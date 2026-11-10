"""24/7 budėtojas šiam PC-serveriui (ROADMAP E2, E3).

    pythonw core/health_watchdog.py     # fone, be lango (paleidžiamas automatiškai, žr. scripts/register-windows-tasks.ps1)
    python  core/health_watchdog.py once  # vienas patikrinimas (diagnostikai)

Ką daro:
  * kas 60 s tikrina http://127.0.0.1:3000/api/health; po 3 nesėkmių iš eilės perkrauna ReputationPro
    (apps/reputationpro/scripts/start-local.ps1, kuris gerbia data/operations/active-build);
  * kas 5 min. tikrina viešą https://reputacija.verslomatika.lt/api/health (per Cloudflare Tunnel);
    jei neveikia, o cloudflared procesas nerastas, paleidžia scripts/start-tunnel.ps1;
  * kasdien ~03:00 daro DB atsarginę kopiją (core/backup_db.py);
  * apie problemas siunčia el. laišką (ne dažniau nei kartą per valandą tai pačiai problemai).
Žurnalas: logs/watchdog.log
"""
import datetime
import http.client
import json
import os
import socket
import ssl
import subprocess
import sys
import time
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

APP_DIR = os.path.join(BASE_DIR, "apps", "reputationpro")
LOCAL_HEALTH = "http://127.0.0.1:3000/api/health"
PUBLIC_HOST = "reputacija.verslomatika.lt"
LOG_PATH = os.path.join(BASE_DIR, "logs", "watchdog.log")
ALERT_EMAIL = os.environ.get("VERSLOMATIKA_ALERT_EMAIL", "tomas@verslomatika.lt")
_last_alert = {}


def log(msg: str) -> None:
    line = f"[{datetime.datetime.now():%Y-%m-%d %H:%M:%S}] {msg}"
    print(line)
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def alert(key: str, subject: str, body: str) -> None:
    now = time.time()
    if now - _last_alert.get(key, 0) < 3600:
        return
    _last_alert[key] = now
    try:
        from core.smtp_sender import SMTPEmailSender
        SMTPEmailSender().send_email(to_email=ALERT_EMAIL, subject=f"[Verslomatika serveris] {subject}", body_text=body)
        log(f"Įspėjimas išsiųstas: {subject}")
    except Exception as e:
        log(f"Nepavyko išsiųsti įspėjimo ({subject}): {e}")


def local_ok() -> bool:
    try:
        with urllib.request.urlopen(LOCAL_HEALTH, timeout=10) as r:
            return r.status == 200 and json.loads(r.read().decode()).get("status") == "ok"
    except Exception:
        return False


def _resolve_public_ip() -> str:
    try:
        return socket.gethostbyname(PUBLIC_HOST)
    except socket.gaierror:
        # Šio PC DNS kartais neišsprendžia subdomeno: klausiame Cloudflare DoH tiesiogiai per IP.
        req = urllib.request.Request(f"https://1.1.1.1/dns-query?name={PUBLIC_HOST}&type=A", headers={"accept": "application/dns-json"})
        with urllib.request.urlopen(req, timeout=10) as r:
            answers = [a["data"] for a in json.loads(r.read().decode()).get("Answer", []) if a.get("type") == 1]
        if not answers:
            raise
        return answers[0]


def public_ok() -> bool:
    try:
        ip = _resolve_public_ip()
        ctx = ssl.create_default_context()
        sock = socket.create_connection((ip, 443), timeout=15)
        conn = http.client.HTTPSConnection(PUBLIC_HOST, timeout=15, context=ctx)
        conn.sock = ctx.wrap_socket(sock, server_hostname=PUBLIC_HOST)
        conn.request("GET", "/api/health", headers={"Host": PUBLIC_HOST, "User-Agent": "verslomatika-watchdog"})
        resp = conn.getresponse()
        ok = resp.status == 200 and json.loads(resp.read().decode()).get("status") == "ok"
        conn.close()
        return ok
    except Exception:
        return False


def _powershell(script: str) -> subprocess.CompletedProcess:
    return subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
                          capture_output=True, text=True, timeout=600, cwd=APP_DIR)


def restart_app() -> None:
    log("ReputationPro neatsako: perkraunama...")
    _powershell("Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | "
                "ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }")
    time.sleep(3)
    res = _powershell(f"& '{os.path.join(APP_DIR, 'scripts', 'start-local.ps1')}'")
    log(f"start-local.ps1: {(res.stdout or res.stderr).strip()[:300]}")


def tunnel_running() -> bool:
    res = _powershell("@(Get-Process -Name cloudflared -ErrorAction SilentlyContinue).Count")
    return (res.stdout or "0").strip() not in ("", "0")


def check_once(state: dict) -> None:
    if local_ok():
        if state.get("local_fail"):
            log("ReputationPro vėl veikia.")
        state["local_fail"] = 0
    else:
        state["local_fail"] = state.get("local_fail", 0) + 1
        log(f"Lokalus /api/health nepavyko ({state['local_fail']} kartą iš eilės).")
        if state["local_fail"] >= 3:
            restart_app()
            state["local_fail"] = 0
            if not local_ok():
                alert("local", "ReputationPro neveikia", "Lokalus serveris neatsako net po perkrovimo. Patikrinkite apps/reputationpro/logs/server-error.log.")

    if time.time() - state.get("public_checked", 0) >= 300:
        state["public_checked"] = time.time()
        if public_ok():
            state["public_fail"] = 0
        else:
            state["public_fail"] = state.get("public_fail", 0) + 1
            log(f"Viešas https://{PUBLIC_HOST}/api/health nepavyko ({state['public_fail']}).")
            if state["public_fail"] >= 2:
                if local_ok() and not tunnel_running():
                    res = _powershell(f"& '{os.path.join(APP_DIR, 'scripts', 'start-tunnel.ps1')}'")
                    log(f"start-tunnel.ps1: {(res.stdout or res.stderr).strip()[:300]}")
                alert("public", "reputacija.verslomatika.lt nepasiekiama",
                      "Viešas adresas neatsako. Klientų atsiliepimų puslapiai ir registracija neveikia. Patikrinkite Cloudflare Tunnel (cloudflared).")

    today = datetime.date.today().isoformat()
    if datetime.datetime.now().hour >= 3 and state.get("backup_day") != today:
        try:
            from core.backup_db import run_backup
            log(f"Atsarginė kopija: {run_backup()}")
            state["backup_day"] = today
        except Exception as e:
            log(f"Atsarginė kopija nepavyko: {e}")
            alert("backup", "DB atsarginė kopija nepavyko", str(e))
            state["backup_day"] = today  # kitas bandymas rytoj, kad nespamintume


def main() -> None:
    state: dict = {}
    if len(sys.argv) > 1 and sys.argv[1] == "once":
        print("local_ok:", local_ok(), "| public_ok:", public_ok(), "| tunnel_running:", tunnel_running())
        return
    log("Budėtojas paleistas.")
    while True:
        try:
            check_once(state)
        except Exception as e:
            log(f"Budėtojo klaida: {e}")
        time.sleep(60)


if __name__ == "__main__":
    main()
