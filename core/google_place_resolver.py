import sys
import urllib.request
import urllib.parse
import re
import json
from typing import Optional

# UTF-8 terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def resolve_google_place_id(business_name: str, city: str = "Vilnius") -> Optional[str]:
    """
    Automatiškai suranda įmonės Google Place ID pagal pavadinimą ir miestą.
    Grąžina Place ID eilutę (pvz. 'ChIJ80U10jQ65UYRx03aQz5Q79Q').
    """
    clean_name = business_name.strip()
    query = f"{clean_name} {city}"
    
    # Žinomi patikrinti Place ID kataloge
    KNOWN_PLACE_IDS = {
        "baldų turgus": "ChIJdRDmwEGV3UYRnKIblCzu0as", # Vilnius Sodybų g. 30 (Patikrinta: HTTP 302 writereview OK)
        "baldų turgus vilnius": "ChIJdRDmwEGV3UYRnKIblCzu0as",
        "baldų turgus kaunas": "ChIJ12tLz6-d3UYR9_T42kYx8k4",  # Kauno LEZ
        # „Rankų Liejimo Rinkinys - Memocasting“ (2,3★, 6). Patikrinta 2026-11-05. Senas ID (ChIJ2765w1…) rodė kitą vietą.
        "memocasting": "ChIJNfJ5Pf3ybGwRpia1sP-1DvQ",
        "memory casting": "ChIJNfJ5Pf3ybGwRpia1sP-1DvQ",
        "vilniaus denta": "ChIJb_f1oHmb3UYRuD_m0q6b7mU",
        # Šmėlio g. 20, Vilnius (4,6★, 395). Patikrinta 2026-11-05 per maps/place/?q=place_id:…
        # NE V. Grybo g. 32 – tas filialas „uždarytas visam laikui“.
        "denticija": "ChIJkzBL2E2X3UYRyx6Uog2H2Hs",
        # Buivydiškių veterinarijos klinika (Vilniaus r.). Patikrinta 2026-11-10 per maps/place/?q=place_id:…
        "buivydiškių veterinarijos klinika": "ChIJQ53NxiuS3UYRqd7cotEWrg0",
    }
    
    for k, pid in KNOWN_PLACE_IDS.items():
        if k in clean_name.lower():
            return pid
            
    # Dinaminė paieška per Google Maps užklausą
    try:
        search_url = "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(query)
        req = urllib.request.Request(
            search_url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            body = resp.read().decode("utf-8", errors="ignore")
            # Ieškome standartinio Google Place ID formato: ChIJ...
            matches = re.findall(r'ChIJ[a-zA-Z0-9_-]{20,}', body)
            if matches:
                return matches[0]
    except Exception as e:
        print(f"[Place ID Resolver Error] {e}")
        
    return None

def get_direct_review_url(business_name: str, city: str = "Vilnius", fallback_place_id: str = None) -> str:
    """
    Su Place ID: tiesioginė atsiliepimo formos nuoroda (writereview?placeid=…).
    Be Place ID: Google Maps paieška (atsidaro visada; is_direct_review_url() ją laiko NEPATIKRINTA,
    todėl kampanija tokiam lead'ui laiško nesiunčia – ROADMAP C2).
    NIEKADA negrąžinti `writereview?q=…`: Google į ją atsako „400. That's an error.“ (patikrinta 2026-11-10).
    """
    pid = resolve_google_place_id(business_name, city) or fallback_place_id
    if pid:
        return f"https://search.google.com/local/writereview?placeid={pid}"
    return "https://www.google.com/maps/search/?api=1&query=" + urllib.parse.quote(business_name + " " + city)

## ---------------------------------------------------------------------------
## Rekvizitai.lt (ROADMAP Etapas R, 2026-11-11): businesses without a Google profile.
## The match is accepted only when the company page lists the lead's phone number or
## website domain – the name alone is not enough (brand ≠ legal name, e.g. Ergonomic.lt).
## ---------------------------------------------------------------------------
_UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}


def _digits(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def _domain(website: str) -> str:
    w = (website or "").strip().lower()
    w = re.sub(r"^https?://", "", w).split("/")[0]
    return w[4:] if w.startswith("www.") else w


def fetch_rekvizitai(url: str) -> Optional[dict]:
    """Reads a Rekvizitai.lt company page. Returns review URL, rating (x/10), counts, phones and the page text."""
    import html as html_lib
    from core.claim_tokens import rekvizitai_review_url
    review_url = rekvizitai_review_url(url)
    if not review_url:
        return None
    company_url = review_url.rsplit("atsiliepimai/", 1)[0]
    try:
        req = urllib.request.Request(company_url, headers=_UA)
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[Rekvizitai] {company_url}: {e}")
        return None
    text = html_lib.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", body)))
    rating = re.search(r"(\d+(?:[.,]\d+)?)\s*/\s*10\s*\(\s*įvertino\s*(\d+)", text)
    reviews = re.search(r"Atsiliepimai\s*\((\d+)\)", text)
    phones = {_digits(p)[-8:] for p in re.findall(r"\+370[\d ]{8,12}", text)}
    return {
        "url": review_url,
        "rating": float(rating.group(1).replace(",", ".")) if rating else None,
        "ratings_count": int(rating.group(2)) if rating else None,
        "reviews_count": int(reviews.group(1)) if reviews else None,
        "phones": phones,
        "text": text.lower(),
    }


def verify_rekvizitai(url: str, phone: str = None, website: str = None) -> Optional[dict]:
    """The Rekvizitai.lt page counts as this lead's only if it lists the same phone or website domain."""
    info = fetch_rekvizitai(url)
    if not info:
        return None
    tail = _digits(phone)[-8:] if phone else ""
    dom = _domain(website)
    matched = (len(tail) == 8 and tail in info["phones"]) or (bool(dom) and dom in info["text"])
    info["verified"] = bool(matched)
    info["match"] = "telefonas" if (len(tail) == 8 and tail in info["phones"]) else ("svetainė" if matched else None)
    return info


def find_rekvizitai(business_name: str, phone: str = None, website: str = None, max_candidates: int = 4) -> Optional[dict]:
    """Best effort: Rekvizitai.lt search by name, then a page check by phone/website. None if not proven."""
    if not (phone or website):
        return None
    words = [w for w in re.split(r"[^a-z0-9ąčęėįšųūž]+", business_name.lower()) if len(w) >= 3 and w not in {"uab", "mb", "ab", "lietuva"}]
    if not words:
        return None
    try:
        q = urllib.parse.quote(business_name.strip())
        req = urllib.request.Request(f"https://rekvizitai.vz.lt/imones/1/?name={q}", headers=_UA)
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[Rekvizitai search] {e}")
        return None
    plain = lambda s: s.translate(str.maketrans("ąčęėįšųūž", "aceeisuuz"))
    slugs = []
    for slug in re.findall(r"rekvizitai\.vz\.lt/imone/([a-z0-9_]+)/", body):
        if slug not in slugs and any(plain(w) in slug for w in words):
            slugs.append(slug)
    for slug in slugs[:max_candidates]:
        info = verify_rekvizitai(f"https://rekvizitai.vz.lt/imone/{slug}/", phone, website)
        if info and info["verified"]:
            return info
    return None


def get_review_destination(business_name: str, city: str = "Vilnius", phone: str = None, website: str = None) -> tuple:
    """(url, platform, rekvizitai_info): Google review form if a place ID is known, else a verified
    Rekvizitai.lt review page, else a Maps search (not direct -> the campaign skips the lead, ROADMAP C2)."""
    url = get_direct_review_url(business_name, city)
    if "placeid=" in url:
        return url, "google", None
    rk = find_rekvizitai(business_name, phone, website)
    if rk:
        return rk["url"], "rekvizitai", rk
    return url, "none", None


if __name__ == "__main__":
    test_lead = "Baldų turgus"
    url = get_direct_review_url(test_lead, "Vilnius")
    print(f"Direct Review URL for '{test_lead}': {url}")
