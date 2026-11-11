"""Minimal Gemini REST client for the Verslomatika agents (reply drafts, company research).

Key: env var GEMINI_API_KEY (on Windows also read from the User scope, so a `setx` value works
without restarting the shell). Never log or print the key.

Model: GEMINI_MODEL (default gemini-3.8-flash). When it is overloaded (429/500/503) or times out,
the call retries and then falls back to GEMINI_FALLBACK_MODELS (default gemini-3.5-flash).

    from core.gemini_client import generate
    text, model = generate("Parašyk ...", system="Tu esi ...", search=True)
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
FALLBACK_MODELS = [m.strip() for m in os.environ.get("GEMINI_FALLBACK_MODELS", "gemini-3.5-flash").split(",") if m.strip()]
RETRYABLE = {429, 500, 502, 503, 504}


class GeminiError(RuntimeError):
    pass


def api_key() -> str:
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key and sys.platform == "win32":
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as h:
                key = str(winreg.QueryValueEx(h, "GEMINI_API_KEY")[0]).strip()
        except OSError:
            key = ""
    if not key:
        raise GeminiError("GEMINI_API_KEY nenustatytas")
    return key


def _call(model: str, payload: dict, timeout: int) -> dict:
    req = urllib.request.Request(API.format(model=model), data=json.dumps(payload).encode("utf-8"),
                                 headers={"Content-Type": "application/json; charset=utf-8",
                                          "x-goog-api-key": api_key()}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _text(data: dict) -> str:
    cands = data.get("candidates") or []
    if not cands:
        raise GeminiError(f"tuščias atsakymas: {json.dumps(data.get('promptFeedback', {}), ensure_ascii=False)[:200]}")
    parts = (cands[0].get("content") or {}).get("parts") or []
    return "".join(p.get("text", "") for p in parts if not p.get("thought")).strip()


def generate(prompt: str, system: str = None, *, model: str = None, search: bool = False, json_mode: bool = False,
             temperature: float = None, timeout: int = 45, retries: int = 2) -> tuple:
    """Returns (text, model_used). search=True enables Google Search grounding (research agent)."""
    payload = {"contents": [{"role": "user", "parts": [{"text": prompt}]}], "generationConfig": {}}
    if system:
        payload["systemInstruction"] = {"parts": [{"text": system}]}
    if search:
        payload["tools"] = [{"google_search": {}}]
    if json_mode and not search:  # JSON mime type cannot be combined with tools
        payload["generationConfig"]["responseMimeType"] = "application/json"
    if temperature is not None:
        payload["generationConfig"]["temperature"] = temperature

    last = None
    for m in [model or DEFAULT_MODEL] + [f for f in FALLBACK_MODELS if f != (model or DEFAULT_MODEL)]:
        for attempt in range(retries + 1):
            try:
                return _text(_call(m, payload, timeout)), m
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", "replace")[:300]
                last = f"{m}: HTTP {e.code} {body}"
                if e.code not in RETRYABLE:
                    raise GeminiError(last) from None
            except (urllib.error.URLError, TimeoutError, OSError) as e:
                last = f"{m}: {e}"
                break  # a hung model rarely recovers within seconds: go to the fallback at once
            if attempt < retries:
                time.sleep(2 * (attempt + 1))
    raise GeminiError(f"visi modeliai nepasiekiami ({last})")


if __name__ == "__main__":
    q = " ".join(sys.argv[1:]) or "Atsakyk vienu žodžiu: Lietuvos sostinė?"
    t0 = time.time()
    out, used = generate(q)
    print(f"[{used}, {time.time() - t0:.1f} s] {out}")
