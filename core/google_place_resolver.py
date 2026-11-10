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

if __name__ == "__main__":
    test_lead = "Baldų turgus"
    url = get_direct_review_url(test_lead, "Vilnius")
    print(f"Direct Review URL for '{test_lead}': {url}")
