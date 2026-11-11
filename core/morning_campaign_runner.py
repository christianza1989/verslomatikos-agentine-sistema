"""Rytinis B2B laiškų siuntėjas (ReputationPro).

Paleidimas:
    python core/morning_campaign_runner.py once      # šios dienos kvota dabar
    python core/morning_campaign_runner.py daemon    # kasdien 08:30 (vietinis laikas)
    python core/morning_campaign_runner.py preview   # NIEKO nesiunčia: įrašo pavyzdinius laiškus į data/reports/email_previews/

Piltuvas (ROADMAP_REPUTATIONPRO.md §1):
    provision_lead_in_db() → issue_claim_token() → laiškas su VIENU CTA:
    {APP_BASE}/api/track/click?id={lead_id}&to={APP_BASE}/r/{slug}?k={token}
    Demo puslapyje savininkas mato abi puses ir aktyvuoja per /aktyvuoti/{token}.
    Asmens duomenys (el. paštas, vardas) į URL nededami.
"""
import os
import re
import sys
import time
import random
import uuid
import datetime
import html as html_lib
import urllib.parse
import sqlite3

# UTF-8 terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from core.smtp_sender import SMTPEmailSender
from core.dental_lead_pool import get_uncontacted_dental_leads, provision_lead_in_db
from core.ecommerce_lead_pool import get_uncontacted_ecommerce_leads
from core.claim_tokens import (ensure_schema, issue_claim_token, is_suppressed, suppress, is_direct_review_url,
                               record_message, count_sent_today)

DB_PATH = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "reputation.db")
# Visa piltuvo logika (demo, sekimas, aktyvavimas) gyvena Next.js aplikacijoje šiame PC.
APP_BASE = os.environ.get("REPUTATION_APP_URL", "https://reputacija.verslomatika.lt").rstrip("/")
SENDER_NAME = "Tomas"
SENDER_EMAIL = "tomas@verslomatika.lt"

CONFIGS_REPUTATION_DIR = os.path.join(BASE_DIR, "configs", "reputation_agents")
FALLBACK_CONFIG = os.path.join(BASE_DIR, "configs", "email_credentials.json")

def _resolve_agent_config(cfg_name: str) -> str:
    path = os.path.join(CONFIGS_REPUTATION_DIR, cfg_name)
    if os.path.exists(path):
        return path
    example_path = path.replace(".json", ".example.json")
    if os.path.exists(example_path):
        return example_path
    return FALLBACK_CONFIG

# 2 Aktyvūs ReputationPro agentai klinikinėms įstaigoms (odontologija, klinikos, veterinarija)
# Tomas (@verslomatika.lt) ir Marius (@verslomatika.eu). Kiti profiliai saugomi ateities plėtrai.
AGENT_PROFILES = [
    {
        "agent_id": "agent-tomas",
        "name": "Tomas",
        "display_from": "Tomas | Verslomatika Klinikos",
        "email": "tomas@verslomatika.lt",
        "config_path": FALLBACK_CONFIG,  # configs/email_credentials.json
        "daily_limit": 25,
        "target_industry": "clinic",
        "is_active": True
    },
    {
        "agent_id": "agent-marius",
        "name": "Marius",
        "display_from": "Marius | Verslomatika Klinikos",
        "email": "marius@verslomatika.eu",
        "config_path": _resolve_agent_config("agent_marius.json"),
        "daily_limit": 25,
        "target_industry": "clinic",
        "is_active": True
    },
    {
        "agent_id": "agent-laura",
        "name": "Laura",
        "display_from": "Laura | Verslomatika Klinikos",
        "email": "laura@verslomatika.eu",
        "config_path": _resolve_agent_config("agent_laura.json"),
        "daily_limit": 25,
        "target_industry": "clinic",
        "is_active": False
    },
    {
        "agent_id": "agent-kamile",
        "name": "Kamilė",
        "display_from": "Kamilė | Verslomatika Grožis",
        "email": "kamile@verslomatika.eu",
        "config_path": _resolve_agent_config("agent_kamile.json"),
        "daily_limit": 25,
        "target_industry": "beauty",
        "is_active": False
    },
    {
        "agent_id": "agent-justas",
        "name": "Justas",
        "display_from": "Justas | Verslomatika Horeca",
        "email": "justas@verslomatika.eu",
        "config_path": _resolve_agent_config("agent_justas.json"),
        "daily_limit": 25,
        "target_industry": "horeca",
        "is_active": False
    }
]


def get_today_sent_count(agent_email: str) -> int:
    """Šiandien išsiųsti laiškai: pirmi + follow-up'ai (viena bendra kvota saugo pašto dėžutės reputaciją)."""
    try:
        conn = sqlite3.connect(DB_PATH)
        ensure_schema(conn)
        cnt = count_sent_today(conn)
        conn.close()
        return cnt
    except Exception as e:
        print(f"[DB Sent Count Error] {e}")
        return 0


# ---------------------------------------------------------------------------
# Laiškų šablonai (ROADMAP C1): trumpi, vienas CTA, be „100%“ / „niekada“
# ---------------------------------------------------------------------------

SERVICE_KEYWORDS = ["auto", "servis", "remont", "salonas", "spa", "viešbut", "grož", "kirpykl", "restoran", "kavin", "sporto"]
ECOMMERCE_KEYWORDS = ["shop", "parduotuv", "prekyb", "mada", "drabuž", "avalyn", "kosmetik", "baldai", "baldų", "dovan", "knyg"]


def detect_industry(lead: dict) -> str:
    explicit = (lead.get("industry") or lead.get("niche") or "").lower()
    if explicit in ("clinic", "dental", "odontologija", "veterinarija"):
        return "clinic"
    if explicit in ("beauty", "estetika", "grozis", "spa"):
        return "beauty"
    if explicit in ("auto", "autoservisai", "servisai"):
        return "auto"
    if explicit in ("horeca", "restoranai", "spa_viesbuciai"):
        return "horeca"
    if explicit in ("ecommerce", "ecom", "baldai", "dovanos"):
        return "ecommerce"
    name = (lead.get("business_name") or "").lower()
    if any(k in name for k in ["klinik", "dant", "odontol", "gyd", "dent"]):
        return "clinic"
    if any(k in name for k in ["groz", "estetik", "salonas", "spa", "kirpykl", "lazer", "beauty"]):
        return "beauty"
    if any(k in name for k in ["auto", "servis", "remont", "padang", "detal"]):
        return "auto"
    if any(k in name for k in ["restoran", "kavin", "baras", "hotel", "viesbut", "gastropub"]):
        return "horeca"
    if any(k in name for k in ["shop", "parduotuv", "prekyb", "mada", "drabuž"]):
        return "ecommerce"
    return "services"


def _fmt_rating(value) -> str:
    return f"{float(value):.1f}".replace(".", ",")


TEMPLATES = {
    "clinic": {
        "generic": "Pacientai, rinkdamiesi kliniką, pirmiausia žiūri Google atsiliepimus. Patenkinti pacientai atsiliepimą palieka retai: ne todėl, kad nenori, o todėl, kad niekas jų nepaprašo tinkamu momentu.",
        "stats": "Pažiūrėjome į „{name}“ Google profilį: {rating}★ iš {count} atsiliepimų. Pacientai, rinkdamiesi kliniką, pirmiausia žiūri būtent čia, ir dažniau renkasi tą, kurios atsiliepimų daugiau.",
        "offer": "Paruošėme „{name}“ atsiliepimų puslapį su QR kodu registratūrai. Per 30 sekundžių pamatysite, kaip jis atrodo paciento telefone ir ką tą pačią sekundę gaunate Jūs, kai pacientas lieka kuo nors nepatenkintas:",
        "subject_stats": "{name}: {rating}★ iš {count} atsiliepimų Google",
        "subject_generic": "{name}: pacientų atsiliepimai Google",
        "team": "Registratūrai mažiau streso: pastaba pirmiausia ateina Jūsų komandai, todėl situaciją galima išspręsti, kol pacientas neparašė viešai.",
    },
    "beauty": {
        "generic": "Klientės, rinkdamosi grožio ar estetikos saloną, labiausiai pasitiki Google atsiliepimais su nuotraukomis. Patenkintos lankytojos atsiliepimą palieka retai, nebent jas paskatina procedūros pabaigoje.",
        "stats": "Pažiūrėjome į „{name}“ Google profilį: {rating}★ iš {count} atsiliepimų. Naujos klientės, rinkdamosi procedūras, pirmiausia patikrina būtent čia.",
        "offer": "Paruošėme „{name}“ atsiliepimų puslapį su elegantišku QR stovelio maketu prie veidrodžio ar registratūroje. Per 30 sekundžių pamatysite, ką mato klientė ir kaip privati pastaba iškart pasiekia Jūsų komandą:",
        "subject_stats": "{name}: {rating}★ iš {count} atsiliepimų Google",
        "subject_generic": "{name}: klienčių atsiliepimai Google",
        "team": "Mažiau streso meistrėms: pastaba pirmiausia ateina Jūsų komandai, o ne į Google.",
    },
    "auto": {
        "generic": "Vairuotojai, ieškodami patikimo autoserviso, pirmiausia skaito Google atsiliepimus. Geras meistras dažnai neturi laiko prašyti įvertinimų, o atsitiktinis nesusipratimas gali numušti reitingą.",
        "stats": "Pažiūrėjome į „{name}“ Google profilį: {rating}★ iš {count} atsiliepimų. Vairuotojai, rinkdamiesi kur remontuoti automobilį, žiūri būtent į šį skaičių.",
        "offer": "Paruošėme „{name}“ atsiliepimų puslapį su QR kodu prie atsiėmimo kasos ir trumpa SMS nuoroda. Per 30 sekundžių pamatysite, kaip vairuotojas palieka 5★ ir kaip pastaba apie remontą sulaikoma privačiai:",
        "subject_stats": "{name}: {rating}★ iš {count} atsiliepimų Google",
        "subject_generic": "{name}: vairuotojų atsiliepimai Google",
        "team": "Mažiau streso meistrams: pastaba apie remontą pirmiausia ateina Jūsų komandai, o ne į Google.",
    },
    "horeca": {
        "generic": "Svečiai, ieškodami kur papietauti ar pavakarieniauti, pirmiausia atsiverčia Google Maps. Patenkintas svečias skaniai pavalgo ir išeina, o menkiausia smulkmena gali virsti viešu neigiamu įrašu.",
        "stats": "Pažiūrėjome į „{name}“ Google profilį: {rating}★ iš {count} atsiliepimų. Miesto svečiai ir turistai restoranus renkasi tiesiai pagal Google Maps žvaigždutes.",
        "offer": "Paruošėme „{name}“ atsiliepimų puslapį su stilingu QR kodu ant staliuko ar sąskaitos padėklo. Per 30 sekundžių pamatysite, ką mato svečias ir kaip pastaba apie patiekalą akimirksniu pasiekia Jūsų komandą:",
        "subject_stats": "{name}: {rating}★ iš {count} atsiliepimų Google",
        "subject_generic": "{name}: svečių atsiliepimai Google",
        "team": "Mažiau streso padavėjams: pastaba pirmiausia ateina Jūsų komandai, todėl ją galima išspręsti dar tą patį vakarą.",
    },
    "ecommerce": {
        "generic": "Pirkėjai prieš užsakydami internetu vis dažniau patikrina parduotuvės atsiliepimus Google. Patenkinti pirkėjai atsiliepimą palieka retai, o nepatenkintas beveik visada.",
        "stats": "Pažiūrėjome į „{name}“ Google profilį: {rating}★ iš {count} atsiliepimų. Pirkėjai prieš užsakydami dažnai patikrina būtent čia, ypač pirkdami pirmą kartą.",
        "offer": "Paruošėme „{name}“ atsiliepimų puslapį. Nuorodą galima įdėti į užsakymo ar pristatymo laišką. Per 30 sekundžių pamatysite, ką mato pirkėjas ir ką tą pačią sekundę gaunate Jūs, jei jis kuo nors nepatenkintas:",
        "subject_stats": "{name}: {rating}★ iš {count} atsiliepimų Google",
        "subject_generic": "{name}: pirkėjų atsiliepimai Google",
        "team": "Mažiau streso klientų aptarnavimui: pastaba apie užsakymą pirmiausia ateina Jūsų komandai, o ne į Google.",
    },
    "services": {
        "generic": "Klientai, rinkdamiesi paslaugų teikėją, pirmiausia žiūri Google atsiliepimus. Patenkinti klientai atsiliepimą palieka retai, nes niekas jų nepaprašo tinkamu momentu.",
        "stats": "Pažiūrėjome į „{name}“ Google profilį: {rating}★ iš {count} atsiliepimų. Nauji klientai, rinkdamiesi paslaugų teikėją, pirmiausia žiūri būtent čia.",
        "offer": "Paruošėme „{name}“ atsiliepimų puslapį su QR kodu (prie kasos ar registratūros) ir nuoroda SMS žinutei po apsilankymo. Per 30 sekundžių pamatysite, ką mato klientas ir ką tą pačią sekundę gaunate Jūs:",
        "subject_stats": "{name}: {rating}★ iš {count} atsiliepimų Google",
        "subject_generic": "{name}: klientų atsiliepimai Google",
        "team": "Mažiau streso darbuotojams: pastaba pirmiausia ateina Jūsų komandai, todėl ją galima išspręsti, kol klientas neparašė viešai.",
    },
}


NO_GOOGLE = {
    # Etapas R: įmonė neturi Google verslo profilio, atsiliepimai renkami Rekvizitai.lt.
    "intro": "Ieškodami Google žemėlapiuose „{name}“ profilio neradome. Žmonės, rinkdamiesi, pirmiausia mato tas įmones, kurios ten turi žvaigždučių ir atsiliepimų.",
    "intro_rk": "Ieškodami Google žemėlapiuose „{name}“ profilio neradome, nors Rekvizitai.lt turite {rating}/10 iš {count} įvertinimų. Žmonės, rinkdamiesi, pirmiausia mato tas įmones, kurios turi žvaigždučių ir atsiliepimų.",
    "offer": "Todėl paruošėme „{name}“ atsiliepimų puslapį su QR kodu: jau dabar patenkinti klientai nukreipiami į Jūsų Rekvizitai.lt profilį, o pastabos pirmiausia ateina Jūsų komandai. Per 30 sekundžių pamatysite, kaip tai atrodo:",
    "guide": "Google profilį galite susikurti nemokamai per ~15 min.: parašėme paprastą instrukciją. Susikūrę įklijuosite nuorodą, ir tas pats QR kodas ims vesti į Google.",
    "subject": "{name} Google žemėlapiuose",
}


def build_tracked_email(lead: dict, lead_id: str, demo_url: str = None, google_stats: dict = None,
                        sender_name: str = None, sender_email: str = None, no_google: bool = False,
                        rk_stats: dict = None, company_cities: list = None, cascade_city: str = None) -> tuple:
    """Grąžina (subject, text, html). Vienas CTA: asmeninis demo puslapis.

    demo_url: {APP_BASE}/r/{slug}?k={token} (be tokeno, tik peržiūrai).
    google_stats: {"rating": 4.6, "count": 87}, jei žinoma (ROADMAP B3).
    no_google: įmonė be Google profilio (atsiliepimai -> Rekvizitai.lt). rk_stats: {"rating": 8.3, "count": 19}.
    Instrukcijos nuoroda – antraeilė teksto nuoroda, ne antras mygtukas (Etapas R6).
    """
    name = lead["business_name"].strip()
    slug = lead.get("slug") or "demo"
    tpl = TEMPLATES[detect_industry(lead)]
    demo_url = demo_url or f"{APP_BASE}/r/{slug}"

    rating = (google_stats or {}).get("rating")
    count = (google_stats or {}).get("count")
    if rating and count:
        intro = tpl["stats"].format(name=name, rating=_fmt_rating(rating), count=count)
        subject = tpl["subject_stats"].format(name=name, rating=_fmt_rating(rating), count=count)
    else:
        intro = tpl["generic"]
        subject = tpl["subject_generic"].format(name=name)
    offer = tpl["offer"].format(name=name)
    team = tpl.get("team")
    # Etapas N: a company with branches gets ONE offer for all of them; a cascade email names the branch.
    cities = [c for c in (company_cities or []) if c]
    if len(cities) > 1:
        subject = f"{name}: atsiliepimų puslapiai visiems {len(cities)} filialams"
        team = (f"Puslapiai paruošti visiems Jūsų filialams: {', '.join(cities)}. Kiekvienas turi savo QR kodą ir atsiliepimų nuorodą, "
                f"o aktyvuoti užtenka vieną kartą." + (f" {team}" if team else ""))
    if cascade_city:
        intro = f"rašome ir Jūsų filialui ({cascade_city}), nes galbūt ankstesnis laiškas nepasiekė atsakingo žmogaus. " + intro
    guide_line, guide = None, None
    if no_google:
        rk_rating, rk_count = (rk_stats or {}).get("rating"), (rk_stats or {}).get("count")
        intro = (NO_GOOGLE["intro_rk"].format(name=name, rating=_fmt_rating(rk_rating), count=rk_count)
                 if rk_rating and rk_count else NO_GOOGLE["intro"].format(name=name))
        offer = NO_GOOGLE["offer"].format(name=name)
        subject = NO_GOOGLE["subject"].format(name=name)
        guide_line, guide = NO_GOOGLE["guide"], guide_url(slug)
    closing = "Jei tiks, paskyrą aktyvuosite vienu paspaudimu: 14 dienų nemokamai, be banko kortelės."
    ps = "P.S. Jei neaktualu, tiesiog atsakykite „ne“ ir daugiau nerašysime."

    s_name = sender_name or SENDER_NAME
    s_email = sender_email or SENDER_EMAIL
    track_open_url = f"{APP_BASE}/api/track/open?id={urllib.parse.quote(lead_id)}"
    cta_url = f"{APP_BASE}/api/track/click?id={urllib.parse.quote(lead_id)}&to={urllib.parse.quote(demo_url, safe='')}"

    text = f"""Laba diena,

{intro}

{team + chr(10) + chr(10) if team else ""}{offer}
{cta_url}

{closing}
{f"{chr(10)}{guide_line}{chr(10)}{guide}{chr(10)}" if guide else ""}
{s_name}
Verslomatika · {s_email}

{ps}
"""

    e = html_lib.escape
    html = f"""<!DOCTYPE html>
<html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1e293b;max-width:560px;padding:8px 4px;">
<p style="margin:0 0 14px;">Laba diena,</p>
<p style="margin:0 0 14px;">{e(intro)}</p>
{f'<p style="margin:0 0 14px;">{e(team)}</p>' if team else ''}
<p style="margin:0 0 18px;">{e(offer)}</p>
<p style="margin:0 0 20px;"><a href="{e(cta_url)}" style="display:inline-block;background:#5636E8;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">Peržiūrėti paruoštą puslapį →</a></p>
<p style="margin:0 0 18px;">{e(closing)}</p>
{f'<p style="margin:0 0 18px;">{e(guide_line)} <a href="{e(guide)}" style="color:#5636E8;">Instrukcija čia</a>.</p>' if guide else ''}
<p style="margin:0 0 18px;">{e(s_name)}<br><span style="color:#64748b;">Verslomatika · <a href="mailto:{e(s_email)}" style="color:#64748b;">{e(s_email)}</a></span></p>
<p style="margin:0;color:#64748b;font-size:13px;">{e(ps)}</p>
<p style="margin:18px 0 0;color:#94a3b8;font-size:11px;">MB Pinet · įm. k. 306067365 · Vilnius</p>
</div>
<img src="{e(track_open_url)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />
</body></html>
"""
    return subject, text, html


# ---------------------------------------------------------------------------
# Siuntimas
# ---------------------------------------------------------------------------

def _fetch_candidates(target_ind: str, needed: int, agent_id: str = "") -> list:
    """Paima daugiau kandidatų nei reikia, nes dalis bus praleista (suppressed / needs_review)."""
    try:
        from core.multi_niche_lead_pool import get_uncontacted_leads_for_agent
        return get_uncontacted_leads_for_agent(target_ind, limit=needed * 3, agent_id=agent_id)
    except Exception as e:
        print(f"[Fetch Candidates Fallback] {e}")
        pool = needed * 3
        if target_ind in ("ecommerce", "ecom"):
            return get_uncontacted_ecommerce_leads(limit=pool)
        return get_uncontacted_dental_leads(limit=pool)


def _company_candidates(conn: sqlite3.Connection, agent: dict, needed: int) -> list:
    """Etapas N: one primary lead per company; the other branches travel with it (`_branches`).
    Companies already known (campaign_companies) or with any address already written to are skipped:
    they continue through follow-ups / cascade, never as a new first email."""
    from core.company_groups import company_key, group_leads, order_contacts, agent_for_company, get_company
    from core.dental_lead_pool import slugify
    pool = _fetch_candidates(agent.get("target_industry", "clinic"), needed * 4, agent_id="")
    same_niche = [a["agent_id"] for a in AGENT_PROFILES if a.get("is_active") and a.get("target_industry") == agent.get("target_industry")]
    contacted = {r[0] for r in conn.execute("SELECT LOWER(email) FROM campaign_leads WHERE sent_at IS NOT NULL")}
    from core.multi_niche_lead_pool import all_catalog_leads
    everyone = group_leads(all_catalog_leads())  # branches may sit in other niche catalogs
    out = []
    for key, members in group_leads(pool).items():
        if key.startswith("d:"):
            known = {((m.get("email") or "").lower(), (m.get("city") or "").lower()) for m in members}
            members = members + [dict(m, industry=members[0].get("industry"), niche=members[0].get("niche"))
                                 for m in everyone.get(key, []) if ((m["email"], m["city"].lower()) not in known)]
        if same_niche and agent_for_company(key, same_niche) != agent["agent_id"]:
            continue
        if get_company(conn, key) or any((m.get("email") or "").lower() in contacted for m in members):
            continue
        ordered = order_contacts(members)
        primary = dict(ordered[0])
        used = {primary["slug"]}
        branches = []
        for m in members:
            if m is ordered[0] or (m.get("slug") == primary["slug"] and m.get("city") == primary.get("city")):
                continue
            b = dict(m)
            if b["slug"] in used:
                b["slug"] = f"{b['slug']}-{slugify(b.get('city') or 'filialas')}"
            used.add(b["slug"])
            branches.append(b)
        primary["_company_key"], primary["_branches"], primary["_members"] = key, branches, members
        out.append(primary)
        if len(out) >= needed * 2:
            break
    return out


def _run_cascades(conn: sqlite3.Connection, agent: dict, sender, budget: int, dry_run: bool) -> int:
    """Etapas N6: write to the next branch of a quiet company (one per company, max 3 addresses)."""
    from core.company_groups import ensure_company_schema, get_company, next_cascade_contact, refresh_company_status, save_company
    ensure_company_schema(conn)
    sent = 0
    now = datetime.datetime.now()
    for row in conn.execute("SELECT company_key FROM campaign_companies WHERE status='active' AND agent_id=?", (agent["agent_id"],)).fetchall():
        if sent >= budget:
            break
        company = get_company(conn, row[0])
        if refresh_company_status(conn, company) != "active":
            continue
        m = next_cascade_contact(conn, company, now)
        if not m or not company.get("root_client_id"):
            continue
        to_email = m["email"].strip().lower()
        root = conn.execute("SELECT slug, google_rating, google_reviews_count, google_review_url, industry FROM clients WHERE id=?", (company["root_client_id"],)).fetchone()
        if not root:
            continue
        branch_slug = m.get("slug") or root["slug"]
        if not conn.execute("SELECT 1 FROM clients WHERE slug=?", (branch_slug,)).fetchone():
            branch_slug = root["slug"]
        lead_id = (conn.execute("SELECT id FROM campaign_leads WHERE email=?", (to_email,)).fetchone() or [str(uuid.uuid4())])[0]
        token = "PERZIURA" if dry_run else issue_claim_token(conn, company["root_client_id"])
        demo_url = f"{APP_BASE}/r/{urllib.parse.quote(branch_slug)}?k={token}"
        cities = [x.get("city") for x in company["members"] if x.get("city")]
        subj, text, html = build_tracked_email({"business_name": company["name"], "slug": branch_slug, "industry": root["industry"]}, lead_id, demo_url,
                                               {"rating": root["google_rating"], "count": root["google_reviews_count"]},
                                               sender_name=agent["name"], sender_email=agent["email"],
                                               company_cities=sorted(set(cities), key=cities.index), cascade_city=m.get("city") or None)
        if dry_run:
            print(f"    👁 Kaskada {company['name']} → {to_email}: „{subj}“")
            sent += 1
            continue
        if not sender.send_email(to_email=to_email, subject=subj, body_text=text, body_html=html,
                                 headers={"List-Unsubscribe": f"<mailto:{agent['email']}?subject=Atsisakau>"}):
            continue
        now_iso = datetime.datetime.now().isoformat()
        conn.execute("""INSERT INTO campaign_leads (id, campaign_id, business_name, email, slug, city, status, sent_at, created_at, updated_at, company_key)
                        VALUES (?, 'company-cascade', ?, ?, ?, ?, 'sent', ?, ?, ?, ?)
                        ON CONFLICT(email) DO UPDATE SET status='sent', sent_at=excluded.sent_at, company_key=excluded.company_key, updated_at=excluded.updated_at""",
                     (lead_id, m.get("business_name") or company["name"], to_email, branch_slug, m.get("city") or "", now_iso, now_iso, now_iso, company["company_key"]))
        conn.execute("INSERT INTO campaign_events (id, lead_id, event_type, details, created_at) VALUES (?, ?, 'sent', 'company-cascade', ?)", (str(uuid.uuid4()), lead_id, now_iso))
        conn.commit()
        record_message(conn, lead_id, "E0", sender.last_message_id, subj)
        save_company(conn, company["company_key"], company["name"], company["agent_id"], company["root_client_id"], company["members"], company["contacted"] + [to_email])
        print(f"    ✓ Kaskada: {company['name']} → {to_email} ({m.get('city') or ''})")
        sent += 1
    return sent


def prepare_lead(conn: sqlite3.Connection, lead: dict):
    """Paruošia lead'ą siuntimui. Grąžina (client_row, priežastis_praleisti)."""
    email = lead["email"].strip().lower()
    if is_suppressed(conn, email):
        return None, "suppressed"
    client = provision_lead_in_db(lead)
    if not client:
        return None, "provision_failed"
    if not client.get("is_demo"):
        suppress(conn, email, "client", "Jau aktyvuotas klientas")
        return None, "already_client"
    if not is_direct_review_url(client.get("google_review_url") or ""):
        # ROADMAP C2: be patikrintos Google nuorodos demo atrodytų nepatikimai.
        suppress(conn, email, "needs_review", client.get("google_review_url") or "")
        return None, "needs_review"
    return client, None


def dispatch_daily_quota(target_agent_id: str = "agent-tomas", force_count: int = None, delay_min: int = 40, delay_max: int = 65, dry_run: bool = False) -> int:
    """Išsiunčia trūkstamus laiškus iki dienos limito. dry_run=True: nieko nesiunčia, įrašo peržiūras."""
    agent = next((a for a in AGENT_PROFILES if a["agent_id"] == target_agent_id), None)
    if not agent or not agent.get("is_active"):
        print(f"Agentas {target_agent_id} nerastas arba neaktyvus.")
        return 0

    daily_limit = force_count if force_count is not None else agent["daily_limit"]
    already_sent = 0 if dry_run else get_today_sent_count(agent["email"])
    needed = max(0, daily_limit - already_sent)

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n{'=' * 75}")
    print(f"[{now_str}] 🚀 ReputationPro B2B kampanija ({agent['email']}){' – PERŽIŪRA, nesiunčiama' if dry_run else ''}")
    print(f"Dienos limitas: {daily_limit} | Šiandien jau išsiųsta: {already_sent} | Reikia: {needed}")
    print(f"{'=' * 75}")
    if needed == 0:
        print(f"✅ Šios dienos kvota ({daily_limit}) jau pasiekta.")
        return 0

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)

    sender = None if dry_run else SMTPEmailSender(config_path=agent["config_path"])
    # Etapas N: quiet companies get their next branch first, then new companies (one email per company).
    from core.company_groups import backfill_companies
    backfill_companies(conn, AGENT_PROFILES)
    cascaded = _run_cascades(conn, agent, sender, needed, dry_run)
    needed -= cascaded
    candidates = _company_candidates(conn, agent, needed) if needed > 0 else []
    if not candidates and not cascaded:
        print("⚠️ Nėra naujų nekontaktuotų įmonių sąraše!")
        conn.close()
        return 0
    campaign_id = f"reputation-daily-{datetime.datetime.now().strftime('%Y%m%d')}"
    done = 0
    preview_dir = os.path.join(BASE_DIR, "data", "reports", "email_previews")

    for lead in candidates:
        if done >= needed:
            break
        b_name, to_email, slug = lead["business_name"], lead["email"].strip().lower(), lead["slug"]
        city = lead.get("city", "Vilnius")

        if dry_run:
            client = {"id": "preview", "is_demo": 1, "industry": lead.get("industry"), "google_rating": None, "google_reviews_count": None}
        else:
            client, skip = prepare_lead(conn, lead)
            if skip:
                print(f"    ↷ Praleista {b_name} ({to_email}): {skip}")
                continue
            if lead.get("_branches"):
                from core.company_groups import provision_company
                from core.google_place_resolver import get_review_destination
                provision_company(conn, lead, lead["_branches"],
                                  lambda b: get_review_destination(b.get("business_name") or b_name, b.get("city") or "Vilnius", b.get("phone"), b.get("website"))[:2])

        # Naudojame esamą campaign_leads id, kitaip sekimo įvykiai nesusietų su lead'u.
        row = conn.execute("SELECT id FROM campaign_leads WHERE email=?", (to_email,)).fetchone()
        lead_id = row["id"] if row else str(uuid.uuid4())

        token = "PERZIURA" if dry_run else issue_claim_token(conn, client["id"])
        demo_url = f"{APP_BASE}/r/{urllib.parse.quote(slug)}?k={token}"
        stats = {"rating": client.get("google_rating"), "count": client.get("google_reviews_count")}
        from core.claim_tokens import rekvizitai_review_url
        no_google = bool(rekvizitai_review_url(client.get("google_review_url") or lead.get("google_review_url") or ""))
        members = lead.get("_members") or []
        cities = [m.get("city") for m in members if m.get("city")]
        subj, text, html = build_tracked_email({**lead, "industry": client.get("industry") or lead.get("industry")}, lead_id, demo_url, stats,
                                               sender_name=agent["name"], sender_email=agent["email"], no_google=no_google,
                                               rk_stats=lead.get("rekvizitai_stats"),
                                               company_cities=sorted(set(cities), key=cities.index) if len(members) > 1 else None)

        if dry_run:
            os.makedirs(preview_dir, exist_ok=True)
            with open(os.path.join(preview_dir, f"{slug}.html"), "w", encoding="utf-8") as f:
                f.write(f"<!-- Tema: {html_lib.escape(subj)} -->\n" + html)
            print(f"    👁 {b_name}: „{subj}“ → data/reports/email_previews/{slug}.html")
            done += 1
            continue

        print(f"\n[{done + 1}/{needed}] Siunčiama: {b_name} ({city}) -> {to_email}...")
        now_iso = datetime.datetime.now().isoformat()
        try:
            ok = sender.send_email(to_email=to_email, subject=subj, body_text=text, body_html=html,
                                   headers={"List-Unsubscribe": f"<mailto:{agent['email']}?subject=Atsisakau>"})
            if not ok:  # send_email klaidos nekelia – grąžina False
                raise RuntimeError("SMTP serveris laiško nepriėmė")
            print("    ✓ Išsiųsta")
            conn.execute("""
                INSERT INTO campaign_leads (id, campaign_id, business_name, email, slug, city, status, sent_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?)
                ON CONFLICT(email) DO UPDATE SET status='sent', sent_at=excluded.sent_at, slug=excluded.slug, updated_at=excluded.updated_at
            """, (lead_id, campaign_id, b_name, to_email, slug, city, now_iso, now_iso, now_iso))
            conn.execute("INSERT INTO campaign_events (id, lead_id, event_type, created_at) VALUES (?, ?, 'sent', ?)",
                         (str(uuid.uuid4()), lead_id, now_iso))
            conn.commit()
            record_message(conn, lead_id, "E0", sender.last_message_id, subj)  # follow-up'ų gijai
            if lead.get("_company_key"):  # Etapas N: the company is now one conversation
                from core.company_groups import save_company, ensure_company_schema
                ensure_company_schema(conn)
                conn.execute("UPDATE campaign_leads SET company_key=? WHERE email=?", (lead["_company_key"], to_email))
                save_company(conn, lead["_company_key"], b_name, agent["agent_id"], client["id"], lead.get("_members") or [lead], [to_email])
            done += 1
            if done < needed:
                delay = random.randint(delay_min, delay_max)
                print(f"    ⏳ Pauzė {delay} s (saugo pašto dėžutės reputaciją)...")
                time.sleep(delay)
        except Exception as e:
            print(f"    ✗ Klaida siunčiant į {to_email}: {e}")
            conn.execute("""
                INSERT INTO campaign_leads (id, campaign_id, business_name, email, slug, city, status, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'bounced', ?, ?, ?)
                ON CONFLICT(email) DO UPDATE SET status='bounced', notes=excluded.notes, updated_at=excluded.updated_at
            """, (lead_id, campaign_id, b_name, to_email, slug, city, str(e), now_iso, now_iso))
            conn.commit()

    conn.close()
    print(f"\n{'=' * 75}")
    print(f"🏁 Baigta. {'Paruošta peržiūrų' if dry_run else 'Išsiųsta'}: {done + cascaded} (iš jų kaskada filialams: {cascaded}).")
    print(f"{'=' * 75}")
    return done


def run_daily_morning_daemon(target_hour: int = 8, target_minute: int = 30):
    """Kiekvieną rytą (08:30) užpildo aktyvių agentų dienos kvotą. Tikrina kas 10 min."""
    print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 🕒 Rytinio B2B siuntimo demonas paleistas.")
    print(f"Siuntimo laikas: kasdien {target_hour:02d}:{target_minute:02d}. Agentai: {[a['email'] for a in AGENT_PROFILES if a.get('is_active')]}")
    while True:
        try:
            now = datetime.datetime.now()
            for agent in AGENT_PROFILES:
                if not agent.get("is_active"):
                    continue
                after_start = now.hour > target_hour or (now.hour == target_hour and now.minute >= target_minute)
                if after_start:
                    # 1) Follow-up'ai (karšti pirmiau) – core/followup_runner.py, tik darbo dienomis 08:30–16:30.
                    from core.followup_runner import dispatch_followups
                    sent_fu = dispatch_followups()
                    if sent_fu:
                        print(f"[{now.strftime('%H:%M:%S')}] ↪ Follow-up laiškų išsiųsta: {sent_fu}")
                # 2) Nauji laiškai iš likusios kvotos.
                today_sent = get_today_sent_count(agent["email"])
                if today_sent < agent["daily_limit"] and after_start and now.weekday() < 5:
                    print(f"\n[{now.strftime('%H:%M:%S')}] ⏰ {agent['email']}: kvota nepasiekta ({today_sent}/{agent['daily_limit']}).")
                    dispatch_daily_quota(target_agent_id=agent["agent_id"], force_count=agent["daily_limit"])
            time.sleep(600)
        except Exception as e:
            print(f"[Daemon Error] {e}")
            time.sleep(60)


def send_manual_test(business_name: str, to_email: str, city: str = "Vilnius", industry: str = "clinic",
                     google_rating: float = None, google_reviews: int = None) -> bool:
    """Tikras laiškas per TĄ PATĮ kelią kaip kampanija, bet į Jūsų adresą ir su atskiru testiniu profiliu.

    Tikras lead'as nepaliečiamas: testinis slug = {slug}-testas, campaign_id = 'manual-test'.
    Follow-up agentas vėliau elgsis su juo kaip su tikru lead'u (galima ištestuoti ir B1/H1/H2/F).
    """
    from core.dental_lead_pool import slugify
    lead = {"business_name": business_name, "email": to_email.strip().lower(), "slug": f"{slugify(business_name)}-testas",
            "city": city, "industry": industry}
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)
    client, skip = prepare_lead(conn, lead)
    if skip:
        print(f"✗ Nesiųsta: {skip}. (needs_review = Google nuoroda be placeid; žr. core/google_place_resolver.py KNOWN_PLACE_IDS)")
        conn.close()
        return False
    if google_rating and google_reviews:
        conn.execute("UPDATE clients SET google_rating=?, google_reviews_count=? WHERE id=?", (google_rating, google_reviews, client["id"]))
        conn.commit()
    row = conn.execute("SELECT id FROM campaign_leads WHERE email=?", (lead["email"],)).fetchone()
    lead_id = row["id"] if row else str(uuid.uuid4())
    token = issue_claim_token(conn, client["id"])
    demo_url = f"{APP_BASE}/r/{urllib.parse.quote(lead['slug'])}?k={token}"
    subj, text, html = build_tracked_email(lead, lead_id, demo_url, {"rating": google_rating, "count": google_reviews})
    agent = AGENT_PROFILES[0]
    sender = SMTPEmailSender(config_path=agent["config_path"])
    ok = sender.send_email(to_email=lead["email"], subject=subj, body_text=text, body_html=html,
                           headers={"List-Unsubscribe": f"<mailto:{agent['email']}?subject=Atsisakau>"})
    if not ok:
        print("✗ SMTP serveris laiško nepriėmė.")
        conn.close()
        return False
    now_iso = datetime.datetime.now().isoformat()
    conn.execute("""
        INSERT INTO campaign_leads (id, campaign_id, business_name, email, slug, city, status, sent_at, created_at, updated_at)
        VALUES (?, 'manual-test', ?, ?, ?, ?, 'sent', ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET status='sent', sent_at=excluded.sent_at, slug=excluded.slug, updated_at=excluded.updated_at
    """, (lead_id, business_name, lead["email"], lead["slug"], city, now_iso, now_iso, now_iso))
    conn.execute("INSERT INTO campaign_events (id, lead_id, event_type, created_at) VALUES (?, ?, 'sent', ?)", (str(uuid.uuid4()), lead_id, now_iso))
    conn.commit()
    record_message(conn, lead_id, "E0", sender.last_message_id, subj)
    conn.close()
    print(f"✓ Išsiųsta: „{subj}“ → {lead['email']}\n  Demo: {APP_BASE}/r/{lead['slug']} (asmeninė nuoroda su tokenu – laiške)")
    return True


def guide_url(slug: str) -> str:
    """Public instructions how to create a Google Business Profile (Etapas R4), on the app host."""
    return f"{APP_BASE}/google-profilis?imone={urllib.parse.quote(slug)}"


def build_custom_email(draft: dict, lead_id: str, demo_url: str, sender_name: str = None, sender_email: str = None,
                       guide: str = None) -> tuple:
    """Individualus laiškas pagal agento tyrimą (data/leads/research/*.json → email_draft). Tas pats stilius ir vienas CTA.

    guide: Google profilio instrukcijos URL (Etapas R6) – antraeilė teksto nuoroda po CTA, ne antras mygtukas.
    Teksto eilutė imama iš draft["guide_text"].
    """
    e = html_lib.escape
    s_name = sender_name or SENDER_NAME
    s_email = sender_email or SENDER_EMAIL
    paragraphs = draft["paragraphs"]
    closing = draft.get("closing", "Jei tiks, paskyrą aktyvuosite vienu paspaudimu: 14 dienų nemokamai, be banko kortelės.")
    ps = "P.S. Jei neaktualu, tiesiog atsakykite „ne“ ir daugiau nerašysime."
    cta_url = f"{APP_BASE}/api/track/click?id={urllib.parse.quote(lead_id)}&to={urllib.parse.quote(demo_url, safe='')}"
    track_open_url = f"{APP_BASE}/api/track/open?id={urllib.parse.quote(lead_id)}"
    guide_text = draft.get("guide_text") if guide else None
    text = ("Laba diena,\n\n" + "\n\n".join(paragraphs) + f"\n{cta_url}\n\n{closing}\n\n"
            + (f"{guide_text}\n{guide}\n\n" if guide_text else "")
            + f"{s_name}\nVerslomatika · {s_email}\n\n{ps}\n")
    body = "".join(f'<p style="margin:0 0 14px;">{e(p)}</p>' for p in paragraphs)
    guide_html = (f'<p style="margin:0 0 18px;">{e(guide_text)} <a href="{e(guide)}" style="color:#5636E8;">Instrukcija čia</a>.</p>'
                  if guide_text else "")
    html = f"""<!DOCTYPE html>
<html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1e293b;max-width:560px;padding:8px 4px;">
<p style="margin:0 0 14px;">Laba diena,</p>
{body}
<p style="margin:4px 0 20px;"><a href="{e(cta_url)}" style="display:inline-block;background:#5636E8;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">{e(draft.get('cta_label', 'Peržiūrėti paruoštą puslapį'))} →</a></p>
<p style="margin:0 0 18px;">{e(closing)}</p>
{guide_html}
<p style="margin:0 0 18px;">{e(s_name)}<br><span style="color:#64748b;">Verslomatika · <a href="mailto:{e(s_email)}" style="color:#64748b;">{e(s_email)}</a></span></p>
<p style="margin:0;color:#64748b;font-size:13px;">{e(ps)}</p>
<p style="margin:18px 0 0;color:#94a3b8;font-size:11px;">MB Pinet · įm. k. 306067365 · Vilnius</p>
</div>
<img src="{e(track_open_url)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />
</body></html>
"""
    return draft["subject"], text, html


def _brief_review_url(brief: dict) -> tuple:
    """(review_url, platform) from a research brief: Google place ID first, else a Rekvizitai.lt page (Etapas R)."""
    from core.claim_tokens import rekvizitai_review_url
    if brief.get("google_place_id"):
        return f"https://search.google.com/local/writereview?placeid={brief['google_place_id']}", "google"
    rk = rekvizitai_review_url(brief.get("rekvizitai_url") or "")
    if rk:
        return rk, "rekvizitai"
    raise SystemExit("✗ Tyrime nėra nei google_place_id, nei rekvizitai_url – laiško nesiųsime (ROADMAP C2).")


def send_researched(brief_path: str, send: bool = False, test_to: str = None) -> bool:
    """Agento ištirtas lead'as (data/leads/research/{slug}.json).

    Be --send: paruošia demo profilį (niekam nieko nesiunčia) ir įrašo laiško peržiūrą į
    data/reports/email_previews/{slug}.html. Su --send: išsiunčia tikrą laišką.

    test_to (--to=adresas): BANDYMAS. Atskiras demo profilis {slug}-testas su vietos rezervavimo
    el. paštu {slug}-testas@testas.invalid (jam niekas nesiunčiama), o laiškas keliauja tiksliai
    į test_to. Tikras lead'as ir test_to adreso įrašai nepaliečiami (adresas gali priklausyti jau
    aktyvuotam testiniam klientui – tada įprastas kelias jį pažymėtų „client“ ir nebesiųstų).
    """
    import json
    with open(brief_path, encoding="utf-8") as f:
        brief = json.load(f)
    review_url, platform = _brief_review_url(brief)
    if not test_to and not re.match(r"^[^@\s]+@[^@\s]+\.[a-z]{2,}$", (brief.get("email") or "").strip().lower()):
        print("✗ Tyrime nėra patvirtinto gavėjo el. pašto (laukas „email“). Bandymui naudokite --to=jusu@adresas.")
        return False
    slug = brief["slug"] + ("-testas" if test_to else "")
    record_email = f"{slug}@testas.invalid" if test_to else brief["email"].strip().lower()
    deliver_to = (test_to or brief["email"]).strip().lower()
    lead = {"business_name": brief["business_name"], "email": record_email, "slug": slug,
            "city": brief.get("city", "Lietuva"), "industry": brief.get("industry", "services"), "google_review_url": review_url,
            "phone": brief.get("phone", ""), "website": brief.get("website", "")}
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)
    if not test_to and is_suppressed(conn, deliver_to):
        print(f"✗ Nesiųsta: {deliver_to} yra nesiuntimo sąraše.")
        conn.close()
        return False
    client, skip = prepare_lead(conn, lead)
    if skip:
        print(f"✗ Nesiųsta: {skip}")
        conn.close()
        return False
    # Etapas N8: the research brief may list the company's branches – one demo account for all of them.
    branch_leads = []
    for i, br in enumerate(brief.get("branches") or []):
        from core.dental_lead_pool import slugify
        br_slug = br.get("slug") or f"{slug}-{slugify(br.get('city') or br.get('location_label') or str(i + 2))}"
        branch_leads.append({**br, "slug": br_slug, "business_name": br.get("business_name") or brief["business_name"],
                             "city": br.get("city") or br.get("location_label") or ""})
    if branch_leads:
        from core.company_groups import provision_company
        from core.claim_tokens import rekvizitai_review_url
        def _branch_url(b):
            if b.get("google_place_id"):
                return f"https://search.google.com/local/writereview?placeid={b['google_place_id']}", "google"
            rk = rekvizitai_review_url(b.get("rekvizitai_url") or "")
            return (rk, "rekvizitai") if rk else (review_url, platform)
        provision_company(conn, lead, branch_leads, _branch_url)
    if platform == "google":
        conn.execute("UPDATE clients SET google_place_id=?, google_rating=?, google_reviews_count=? WHERE id=?",
                     (brief["google_place_id"], brief.get("google_rating"), brief.get("google_reviews_count"), client["id"]))
        conn.commit()
    row = conn.execute("SELECT id FROM campaign_leads WHERE email=?", (record_email,)).fetchone()
    lead_id = row["id"] if row else str(uuid.uuid4())
    guide = guide_url(slug) if platform == "rekvizitai" else None

    if not send:
        subj, text, html = build_custom_email(brief["email_draft"], lead_id, f"{APP_BASE}/r/{slug}?k=PERZIURA", guide=guide)
        out = os.path.join(BASE_DIR, "data", "reports", "email_previews", f"{slug}.html")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as f:
            f.write(f"<!-- Tema: {html_lib.escape(subj)} | Kam: {deliver_to} -->\n" + html)
        print(f"👁 PERŽIŪRA (neišsiųsta)\nKam: {deliver_to}\nTema: {subj}\nPlatforma: {platform}\n\n{text}\nFailas: {out}\nDemo: {APP_BASE}/r/{slug}")
        conn.close()
        return True

    token = issue_claim_token(conn, client["id"])
    agent = AGENT_PROFILES[0]
    subj, text, html = build_custom_email(brief["email_draft"], lead_id, f"{APP_BASE}/r/{urllib.parse.quote(slug)}?k={token}",
                                          agent["name"], agent["email"], guide=guide)
    sender = SMTPEmailSender(config_path=agent["config_path"])
    ok = sender.send_email(to_email=deliver_to, subject=subj, body_text=text, body_html=html,
                           headers={"List-Unsubscribe": f"<mailto:{agent['email']}?subject=Atsisakau>"})
    if not ok:
        print("✗ SMTP serveris laiško nepriėmė.")
        conn.close()
        return False
    now_iso = datetime.datetime.now().isoformat()
    campaign = "manual-test" if test_to else "researched"
    conn.execute("""
        INSERT INTO campaign_leads (id, campaign_id, business_name, email, slug, city, website, phone, status, sent_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET status='sent', sent_at=excluded.sent_at, slug=excluded.slug, updated_at=excluded.updated_at
    """, (lead_id, campaign, brief["business_name"], record_email, slug, lead["city"], brief.get("website", ""), brief.get("phone", ""), now_iso, now_iso, now_iso))
    conn.execute("INSERT INTO campaign_events (id, lead_id, event_type, details, created_at) VALUES (?, ?, 'sent', ?, ?)",
                 (str(uuid.uuid4()), lead_id, campaign, now_iso))
    conn.commit()
    record_message(conn, lead_id, "E0", sender.last_message_id, subj)
    if not test_to:  # Etapas N: the researched company is one conversation (stops, cascade, owner panel)
        from core.company_groups import company_key as _ck, save_company, ensure_company_schema
        ensure_company_schema(conn)
        key = _ck({"email": deliver_to, "website": brief.get("website", "")})
        members = [{"email": deliver_to, "business_name": brief["business_name"], "city": lead["city"], "slug": slug}] +                   [{"email": b.get("email") or "", "business_name": b["business_name"], "city": b["city"], "slug": b["slug"]} for b in branch_leads]
        conn.execute("UPDATE campaign_leads SET company_key=? WHERE email=?", (key, record_email))
        save_company(conn, key, brief["business_name"], AGENT_PROFILES[0]["agent_id"], client["id"], members, [deliver_to])
    conn.close()
    print(f"✓ Išsiųsta: „{subj}“ → {deliver_to}{' (BANDYMAS, profilis ' + slug + ')' if test_to else ''}")
    return True


def dispatch_all_agents(force_count: int = None, dry_run: bool = False) -> dict:
    """Išsiunčia arba sugeneruoja peržiūras visiems aktyviems lietuviškiems agentams."""
    results = {}
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    active_agents = [a for a in AGENT_PROFILES if a.get("is_active")]
    print(f"\n{'#' * 75}")
    print(f"[{now_str}] 🚀 PALEIDŽIAMI {len(active_agents)} REPUTATIONPRO AGENTAI ({'PERŽIŪRA' if dry_run else 'SIUNTIMAS'})")
    print(f"{'#' * 75}")
    for agent in active_agents:
        cnt = dispatch_daily_quota(target_agent_id=agent["agent_id"], force_count=force_count, dry_run=dry_run)
        results[agent["agent_id"]] = cnt
    print(f"\n{'#' * 75}")
    print(f"🏁 Visi agentai baigė darbą. Rezultatai: {results}")
    print(f"{'#' * 75}")
    return results


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "once"
    if mode == "research":
        # python core/morning_campaign_runner.py research data/leads/research/memory-casting.json [--send]
        send_researched(sys.argv[2], send="--send" in sys.argv[3:],
                        test_to=next((a.split("=", 1)[1] for a in sys.argv[3:] if a.startswith("--to=")), None))
        sys.exit(0)
    if mode == "daemon":
        run_daily_morning_daemon(target_hour=8, target_minute=30)
    elif mode == "test":
        # python core/morning_campaign_runner.py test "Denticija Vilnius" jusu+denticija@gmail.com [miestas] [nisa] [reitingas] [atsiliepimu_sk]
        a = sys.argv[2:]
        send_manual_test(a[0], a[1], a[2] if len(a) > 2 else "Vilnius", a[3] if len(a) > 3 else "clinic",
                         float(a[4]) if len(a) > 4 else None, int(a[5]) if len(a) > 5 else None)
    elif mode == "all":
        dispatch_all_agents(force_count=int(sys.argv[2]) if len(sys.argv) > 2 else None, dry_run="--dry-run" in sys.argv)
    elif mode == "preview":
        dispatch_all_agents(force_count=int(sys.argv[2]) if len(sys.argv) > 2 else 2, dry_run=True)
    elif any(a["agent_id"] == mode for a in AGENT_PROFILES):
        dispatch_daily_quota(target_agent_id=mode, force_count=int(sys.argv[2]) if len(sys.argv) > 2 else 25, dry_run="--dry-run" in sys.argv)
    else:
        dispatch_all_agents(force_count=25)
