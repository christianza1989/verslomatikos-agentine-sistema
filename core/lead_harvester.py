"""Lead harvester (ROADMAP Etapas L, 2026-11-11): fills the campaign pool with new businesses every night.

Source: the official Google Places API (New) Text Search – name, rating, review count, place ID
(= direct review link), website, phone, business status. Email: read from the business's own
website (home page + up to 2 contact pages). No AI, no bot-check bypassing: Rekvizitai.lt and the
Google Maps HTML now answer automated requests with a challenge / consent page, so they are not used.

Key: env GOOGLE_PLACES_API_KEY (Windows User scope works after `setx`). The key needs
"Places API (New)" enabled in Google Cloud. Never print it.

Output: data/leads/harvested.json (Git-ignored: business contacts). Progress: data/leads/harvest_state.json.
Read by core/multi_niche_lead_pool.py like the other catalogs.

    python core/lead_harvester.py status
    python core/lead_harvester.py run --max-requests=40      # nightly default
    python core/lead_harvester.py run --target=1100          # pre-fill a month (stops at target or end of queries)
    python core/lead_harvester.py email https://example.lt   # test the email finder on one site
    python core/lead_harvester.py lookup "Denticija" Vilnius https://denticija.lt   # place ID for an old catalog lead
"""
import datetime
import html as html_lib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
OUT_PATH = os.path.join(BASE_DIR, "data", "leads", "harvested.json")
STATE_PATH = os.path.join(BASE_DIR, "data", "leads", "harvest_state.json")
PLACES_URL = "https://places.googleapis.com/v1/places:searchText"
FIELDS = ",".join(["places.id", "places.displayName", "places.rating", "places.userRatingCount", "places.websiteUri",
                   "places.nationalPhoneNumber", "places.formattedAddress", "places.businessStatus", "nextPageToken"])
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "lt,en;q=0.8"}

# niche -> (agent industry, search phrases). Order = priority (active agents are "clinic").
NICHES = {
    "odontologija": ("clinic", ["odontologijos klinika", "odontologas", "ortodontas", "dantų implantacija"]),
    "veterinarija": ("clinic", ["veterinarijos klinika"]),
    "medicina": ("clinic", ["privati medicinos klinika", "estetinės medicinos klinika", "akių klinika", "kineziterapija reabilitacija"]),
    "estetika": ("beauty", ["grožio salonas", "kosmetologas"]),
    "autoservisai": ("auto", ["autoservisas"]),
    "spa_viesbuciai": ("horeca", ["SPA centras"]),
}
CITIES = ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė", "Mažeikiai", "Jonava",
          "Utena", "Kėdainiai", "Telšiai", "Tauragė", "Ukmergė", "Visaginas", "Palanga", "Druskininkai", "Plungė", "Kretinga", "Šilutė"]
MAX_PAGES = 3  # Text Search gives up to 60 results (3 × 20) per query

FREE_MAIL = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "inbox.lt", "one.lt", "zebra.lt", "takas.lt", "mail.ru", "icloud.com"}
JUNK_EMAIL = re.compile(r"(example\.|sentry|wixpress|\.png|\.jpg|\.jpeg|\.webp|\.gif|\.svg|domain\.|yourmail|email@|vardas@|name@|noreply|no-reply|@2x)", re.I)
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
CONTACT_HINT = re.compile(r"kontakt|contact|susisiek|apie-mus|about", re.I)


class HarvestError(RuntimeError):
    pass


def places_key() -> str:
    key = os.environ.get("GOOGLE_PLACES_API_KEY", "").strip()
    if not key and sys.platform == "win32":
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as h:
                key = str(winreg.QueryValueEx(h, "GOOGLE_PLACES_API_KEY")[0]).strip()
        except OSError:
            key = ""
    if not key:
        raise HarvestError("GOOGLE_PLACES_API_KEY nenustatytas (žr. ROADMAP Etapas L)")
    return key


def search_places(query: str, page_token: str = None) -> dict:
    body = {"textQuery": query, "languageCode": "lt", "regionCode": "LT", "pageSize": 20}
    if page_token:
        body["pageToken"] = page_token
    req = urllib.request.Request(PLACES_URL, data=json.dumps(body).encode("utf-8"), method="POST",
                                 headers={"Content-Type": "application/json; charset=utf-8",
                                          "X-Goog-Api-Key": places_key(), "X-Goog-FieldMask": FIELDS})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise HarvestError(f"Places API HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:300]}") from None


# ---------------------------------------------------------------- email finder
def _domain(url: str) -> str:
    host = urllib.parse.urlparse(url if "//" in url else "http://" + url).netloc.lower().split(":")[0]
    return host[4:] if host.startswith("www.") else host


def _fetch(url: str, timeout: int = 10) -> tuple:
    """(html, final_url). Read-only. Certificates are always verified: a site whose https is broken is
    tried once over plain http (public contact page only), otherwise skipped."""
    attempts = [url] + (["http://" + url[8:]] if url.startswith("https://") else [])
    last = None
    for u in attempts:
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=timeout) as resp:
                if "html" not in (resp.headers.get("Content-Type") or "html"):
                    return "", resp.geturl()
                return resp.read(600_000).decode("utf-8", errors="ignore"), resp.geturl()
        except (urllib.error.URLError, OSError) as e:
            last = e
            if "getaddrinfo" in str(e):
                break  # domain does not exist
    raise last


def _emails_in(page: str) -> list:
    page = html_lib.unescape(page).replace("[at]", "@").replace("(at)", "@")
    found = []
    for m in re.findall(r"mailto:([^\"'?>\s]+)", page, re.I) + EMAIL_RE.findall(page):
        e = urllib.parse.unquote(m).strip().strip(".").lower()
        if EMAIL_RE.fullmatch(e) and not JUNK_EMAIL.search(e) and e not in found:
            found.append(e)
    return found


def _own(email: str, doms: set) -> bool:
    host = email.split("@")[1]
    return any(host == d or host.endswith("." + d) for d in doms)


def find_email(website: str) -> tuple:
    """(email, kind) from the business's own site. kind: 'domain' (same domain as the site) | 'free' | None.
    Prefers info@/registratura@/kontaktai@ on the site's own domain."""
    if not website:
        return None, None
    doms = {_domain(website)}
    pages, seen = [website], set()
    emails = []
    for _ in range(3):
        if not pages:
            break
        url = pages.pop(0)
        if url in seen:
            continue
        seen.add(url)
        try:
            body, final = _fetch(url)
        except Exception:
            continue
        doms.add(_domain(final))  # e.g. groziochirurgija.lt -> dantu-implantai.lt
        emails += [e for e in _emails_in(body) if e not in emails]
        if any(_own(e, doms) for e in emails):
            break
        for href in re.findall(r"href=[\"']([^\"'#]+)[\"']", body, re.I):
            full = urllib.parse.urljoin(url, href)
            if _domain(full) in doms and CONTACT_HINT.search(href) and full not in seen and full not in pages:
                pages.append(full)
    own = [e for e in emails if _own(e, doms)]
    if own:
        pref = [e for e in own if e.split("@")[0] in ("info", "registratura", "kontaktai", "labas", "hello", "klinika", "office", "biuras")]
        return (pref or own)[0], "domain"
    free = [e for e in emails if e.split("@")[1] in FREE_MAIL]
    if free:
        return free[0], "free"
    return None, None


# ---------------------------------------------------------------- storage
def _load(path: str, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def _save(path: str, data) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)


def load_harvested() -> list:
    return _load(OUT_PATH, [])


def _known() -> dict:
    """What is already in any catalog or the campaign DB (never harvest twice). A known website domain in a
    NEW city is a branch of that company (Etapas N): it keeps the company's address and joins its conversation."""
    from core.multi_niche_lead_pool import all_catalog_leads
    from core.dental_lead_pool import get_already_contacted_emails
    contacted = set(get_already_contacted_emails())
    k = {"contacted": contacted, "emails": set(contacted), "places": set(), "domain_email": {}, "domain_city": set()}
    # Old hand-made catalogs hold invented rows; only rows with a verified place ID count as "already have it".
    for l in all_catalog_leads() + load_harvested():
        email = (l.get("email") or "").lower()
        if email:
            k["emails"].add(email)
        if l.get("google_place_id"):
            k["places"].add(l["google_place_id"])
        dom = _domain(l["website"]) if l.get("website") else (email.split("@")[1] if "@" in email and email.split("@")[1] not in FREE_MAIL else "")
        if dom and l.get("google_place_id"):
            k["domain_email"].setdefault(dom, email)
            k["domain_city"].add((dom, (l.get("city") or "").strip().lower()))
    return k


def _resolve(k: dict, pid: str, site: str, city: str) -> tuple:
    """(email, kind, outcome) for one place. outcome: new | branch | dupe | no_site | no_email."""
    if not pid or pid in k["places"]:
        return None, None, "dupe"
    k["places"].add(pid)
    if not site:
        return None, None, "no_site"
    dom, c = _domain(site), city.strip().lower()
    if dom in k["domain_email"]:
        if (dom, c) in k["domain_city"]:
            return None, None, "dupe"  # same company, same city (second branch in one city: not supported yet)
        k["domain_city"].add((dom, c))
        return k["domain_email"][dom], "branch", "branch"
    email, kind = find_email(site)
    if not email:
        return None, None, "no_email"
    if email in k["emails"] and email in k["contacted"]:
        return None, None, "dupe"  # already written to
    k["emails"].add(email)
    k["domain_email"][dom] = email
    k["domain_city"].add((dom, c))
    return email, kind, "new"


def _queries() -> list:
    return [(niche, ind, f"{phrase} {city}", city) for niche, (ind, phrases) in NICHES.items()
            for city in CITIES for phrase in phrases]


def harvest(max_requests: int = 40, target: int = None, verbose: bool = True) -> dict:
    """Walks the query list from where the last run stopped. Each Places page = 1 request."""
    from core.dental_lead_pool import slugify
    state = _load(STATE_PATH, {"done": [], "cursor": {}})
    done = set(state.get("done", []))
    leads = load_harvested()
    known = _known()
    used = {l["slug"] for l in leads}
    stats = {"requests": 0, "places": 0, "added": 0, "no_site": 0, "no_email": 0, "dupes": 0, "closed": 0}
    start_total = len(leads)
    for niche, ind, query, city in _queries():
        if query in done:
            continue
        token = state["cursor"].get(query)
        page = 0
        while page < MAX_PAGES:
            if stats["requests"] >= max_requests or (target and len(leads) >= target):
                state["cursor"][query] = token
                _save(STATE_PATH, {"done": sorted(done), "cursor": state["cursor"]})
                _save(OUT_PATH, leads)
                stats["total"] = len(leads)
                return stats
            data = search_places(query, token)
            stats["requests"] += 1
            for p in data.get("places", []):
                stats["places"] += 1
                pid, site = p.get("id"), p.get("websiteUri") or ""
                if p.get("businessStatus") not in (None, "OPERATIONAL"):
                    stats["closed"] += 1
                    continue
                email, kind, outcome = _resolve(known, pid, site, city)
                if not email:
                    stats[{"dupe": "dupes"}.get(outcome, outcome)] += 1
                    continue
                stats["branches"] = stats.get("branches", 0) + (outcome == "branch")
                name = (p.get("displayName") or {}).get("text") or _domain(site)
                slug = slugify(name)
                if slug in used:
                    slug = f"{slug}-{slugify(city)}"
                used.add(slug)
                leads.append({
                    "business_name": name, "city": city, "email": email, "email_kind": kind,
                    "website": site, "phone": p.get("nationalPhoneNumber", ""), "address": p.get("formattedAddress", ""),
                    "niche": niche, "industry": ind, "slug": slug, "google_place_id": pid,
                    "google_review_url": f"https://search.google.com/local/writereview?placeid={pid}",
                    "google_rating": p.get("rating"), "google_reviews_count": p.get("userRatingCount"),
                    "source": "google_places", "harvested_at": datetime.date.today().isoformat(),
                })
                stats["added"] += 1
                if verbose:
                    print(f"  + {name} ({city}) {p.get('rating')}★/{p.get('userRatingCount')} → {email}")
            token = data.get("nextPageToken")
            page += 1
            if not token:
                break
            time.sleep(1)
        done.add(query)
        state["cursor"].pop(query, None)
        _save(STATE_PATH, {"done": sorted(done), "cursor": state["cursor"]})
        _save(OUT_PATH, leads)
    stats["total"] = len(leads)
    stats["finished_all_queries"] = True
    _save(OUT_PATH, leads)
    return stats


def places_lookup(business_name: str, city: str = "", website: str = "") -> dict:
    """Old hand-made catalog leads have no place ID. Finds the business by name + city and accepts the
    result only if its website has the same domain (or, when the lead has no website, the name matches).
    Returns {} without a key or without a proven match."""
    try:
        places_key()
    except HarvestError:
        return {}
    try:
        data = search_places(f"{business_name} {city}".strip())
    except HarvestError as e:
        print(f"[Places lookup] {e}")
        return {}
    want = _domain(website) if website else ""
    norm = lambda x: re.sub(r"[^a-z0-9]", "", x.lower().translate(str.maketrans("ąčęėįšųūž", "aceeisuuz")))
    for p in (data.get("places") or [])[:5]:
        name = (p.get("displayName") or {}).get("text") or ""
        site_ok = bool(want) and _domain(p.get("websiteUri") or "") == want
        name_ok = not want and norm(name) and (norm(name) in norm(business_name) or norm(business_name) in norm(name))
        if (site_ok or name_ok) and p.get("businessStatus") in (None, "OPERATIONAL"):
            return {"google_place_id": p["id"], "google_rating": p.get("rating"), "google_reviews_count": p.get("userRatingCount"),
                    "google_review_url": f"https://search.google.com/local/writereview?placeid={p['id']}",
                    "phone": p.get("nationalPhoneNumber", "")}
    return {}


def import_maps_list(path: str, city: str, niche: str) -> dict:
    """Without a Places key: a list copied from Google Maps in a real browser (one line per place:
    name|place_id|rating|count|website|phone). Emails come from the business's own website, as in harvest()."""
    from core.dental_lead_pool import slugify
    ind = NICHES.get(niche, ("clinic", []))[0]
    leads = load_harvested()
    known = _known()
    used = {l["slug"] for l in leads}
    stats = {"rows": 0, "added": 0, "branches": 0, "no_email": 0, "no_site": 0, "dupes": 0}
    with open(path, encoding="utf-8") as f:
        rows = [ln.rstrip("\r\n").split("|") for ln in f if ln.count("|") >= 5]
    for row in rows:
        name, pid, rating, count, site, phone = row[0], row[1], row[2], row[3], row[4], row[5]
        stats["rows"] += 1
        if not pid.startswith("ChIJ"):
            stats["dupes"] += 1
            continue
        email, kind, outcome = _resolve(known, pid, site, city)
        if not email:
            stats[{"dupe": "dupes"}.get(outcome, outcome)] += 1
            continue
        stats["branches"] += outcome == "branch"
        clean = re.split(r"\s+[-|–]\s+", name)[0].strip().strip('"')
        slug = slugify(clean)
        if slug in used:
            slug = f"{slug}-{slugify(city)}"
        used.add(slug)
        leads.append({
            "business_name": clean, "city": city, "email": email, "email_kind": kind, "website": site, "phone": phone,
            "niche": niche, "industry": ind, "slug": slug, "google_place_id": pid,
            "google_review_url": f"https://search.google.com/local/writereview?placeid={pid}",
            "google_rating": float(rating) if rating else None, "google_reviews_count": int(count) if count else None,
            "source": "google_maps_browser", "harvested_at": datetime.date.today().isoformat(),
        })
        stats["added"] += 1
        print(f"  + {clean} ({city}) {rating}★/{count} → {email}")
    _save(OUT_PATH, leads)
    stats["total"] = len(leads)
    return stats


def status() -> None:
    leads = load_harvested()
    state = _load(STATE_PATH, {"done": []})
    from collections import Counter
    from core.dental_lead_pool import get_already_contacted_emails
    sent = set(get_already_contacted_emails())
    left = [l for l in leads if l["email"] not in sent]
    print(f"Surinkta: {len(leads)} | dar nerašyta: {len(left)} | užklausų atlikta: {len(state.get('done', []))}/{len(_queries())}")
    for ind, n in Counter(l["industry"] for l in left).most_common():
        print(f"  {ind:8} {n}")


if __name__ == "__main__":
    args = sys.argv[1:]
    cmd = args[0] if args else "status"
    opt = lambda name, default: int(next((a.split("=", 1)[1] for a in args if a.startswith(f"--{name}=")), default))
    if cmd == "email":
        print(find_email(args[1]))
    elif cmd == "import":  # import list.txt --city=Kaunas --niche=odontologija
        city = next((a.split("=", 1)[1] for a in args if a.startswith("--city=")), "Vilnius")
        niche = next((a.split("=", 1)[1] for a in args if a.startswith("--niche=")), "odontologija")
        print(import_maps_list(args[1], city, niche))
        status()
    elif cmd == "lookup":  # lookup "Pavadinimas" Miestas https://svetaine.lt
        print(places_lookup(args[1], args[2] if len(args) > 2 else "", args[3] if len(args) > 3 else ""))
    elif cmd == "run":
        try:
            print(harvest(max_requests=opt("max-requests", 40 if "--target" not in " ".join(args) else 2000),
                          target=opt("target", 0) or None))
        except HarvestError as e:
            print("✗", e)
            sys.exit(1)
        status()
    else:
        status()
