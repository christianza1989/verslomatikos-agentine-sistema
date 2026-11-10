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
    },
    "beauty": {
        "generic": "Klientės, rinkdamosi grožio ar estetikos saloną, labiausiai pasitiki Google atsiliepimais su nuotraukomis. Patenkintos lankytojos atsiliepimą palieka retai, nebent jas paskatina procedūros pabaigoje.",
        "stats": "Pažiūrėjome į „{name}“ Google profilį: {rating}★ iš {count} atsiliepimų. Naujos klientės, rinkdamosi procedūras, pirmiausia patikrina būtent čia.",
        "offer": "Paruošėme „{name}“ atsiliepimų puslapį su elegantišku QR stovelio maketu prie veidrodžio ar registratūroje. Per 30 sekundžių pamatysite, ką mato klientė ir kaip privati pastaba iškart pasiekia vadovę:",
        "subject_stats": "{name}: {rating}★ iš {count} atsiliepimų Google",
        "subject_generic": "{name}: klienčių atsiliepimai Google",
    },
    "auto": {
        "generic": "Vairuotojai, ieškodami patikimo autoserviso, pirmiausia skaito Google atsiliepimus. Geras meistras dažnai neturi laiko prašyti įvertinimų, o atsitiktinis nesusipratimas gali numušti reitingą.",
        "stats": "Pažiūrėjome į „{name}“ Google profilį: {rating}★ iš {count} atsiliepimų. Vairuotojai, rinkdamiesi kur remontuoti automobilį, žiūri būtent į šį skaičių.",
        "offer": "Paruošėme „{name}“ atsiliepimų puslapį su QR kodu prie atsiėmimo kasos ir trumpa SMS nuoroda. Per 30 sekundžių pamatysite, kaip vairuotojas palieka 5★ ir kaip pastaba apie remontą sulaikoma privačiai:",
        "subject_stats": "{name}: {rating}★ iš {count} atsiliepimų Google",
        "subject_generic": "{name}: vairuotojų atsiliepimai Google",
    },
    "horeca": {
        "generic": "Svečiai, ieškodami kur papietauti ar pavakarieniauti, pirmiausia atsiverčia Google Maps. Patenkintas svečias skaniai pavalgo ir išeina, o menkiausia smulkmena gali virsti viešu neigiamu įrašu.",
        "stats": "Pažiūrėjome į „{name}“ Google profilį: {rating}★ iš {count} atsiliepimų. Miesto svečiai ir turistai restoranus renkasi tiesiai pagal Google Maps žvaigždutes.",
        "offer": "Paruošėme „{name}“ atsiliepimų puslapį su stilingu QR kodu ant staliuko ar sąskaitos padėklo. Per 30 sekundžių pamatysite, ką mato svečias ir kaip skundas apie patiekalą akimirksniu pasiekia vadovą:",
        "subject_stats": "{name}: {rating}★ iš {count} atsiliepimų Google",
        "subject_generic": "{name}: svečių atsiliepimai Google",
    },
    "ecommerce": {
        "generic": "Pirkėjai prieš užsakydami internetu vis dažniau patikrina parduotuvės atsiliepimus Google. Patenkinti pirkėjai atsiliepimą palieka retai, o nepatenkintas beveik visada.",
        "stats": "Pažiūrėjome į „{name}“ Google profilį: {rating}★ iš {count} atsiliepimų. Pirkėjai prieš užsakydami dažnai patikrina būtent čia, ypač pirkdami pirmą kartą.",
        "offer": "Paruošėme „{name}“ atsiliepimų puslapį. Nuorodą galima įdėti į užsakymo ar pristatymo laišką. Per 30 sekundžių pamatysite, ką mato pirkėjas ir ką tą pačią sekundę gaunate Jūs, jei jis kuo nors nepatenkintas:",
        "subject_stats": "{name}: {rating}★ iš {count} atsiliepimų Google",
        "subject_generic": "{name}: pirkėjų atsiliepimai Google",
    },
    "services": {
        "generic": "Klientai, rinkdamiesi paslaugų teikėją, pirmiausia žiūri Google atsiliepimus. Patenkinti klientai atsiliepimą palieka retai, nes niekas jų nepaprašo tinkamu momentu.",
        "stats": "Pažiūrėjome į „{name}“ Google profilį: {rating}★ iš {count} atsiliepimų. Nauji klientai, rinkdamiesi paslaugų teikėją, pirmiausia žiūri būtent čia.",
        "offer": "Paruošėme „{name}“ atsiliepimų puslapį su QR kodu (prie kasos ar registratūros) ir nuoroda SMS žinutei po apsilankymo. Per 30 sekundžių pamatysite, ką mato klientas ir ką tą pačią sekundę gaunate Jūs:",
        "subject_stats": "{name}: {rating}★ iš {count} atsiliepimų Google",
        "subject_generic": "{name}: klientų atsiliepimai Google",
    },
}


def build_tracked_email(lead: dict, lead_id: str, demo_url: str = None, google_stats: dict = None,
                        sender_name: str = None, sender_email: str = None) -> tuple:
    """Grąžina (subject, text, html). Vienas CTA: asmeninis demo puslapis.

    demo_url: {APP_BASE}/r/{slug}?k={token} (be tokeno, tik peržiūrai).
    google_stats: {"rating": 4.6, "count": 87}, jei žinoma (ROADMAP B3).
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
    closing = "Jei tiks, paskyrą aktyvuosite vienu paspaudimu: 14 dienų nemokamai, be banko kortelės."
    ps = "P.S. Jei neaktualu, tiesiog atsakykite „ne“ ir daugiau nerašysime."

    s_name = sender_name or SENDER_NAME
    s_email = sender_email or SENDER_EMAIL
    track_open_url = f"{APP_BASE}/api/track/open?id={urllib.parse.quote(lead_id)}"
    cta_url = f"{APP_BASE}/api/track/click?id={urllib.parse.quote(lead_id)}&to={urllib.parse.quote(demo_url, safe='')}"

    text = f"""Laba diena,

{intro}

{offer}
{cta_url}

{closing}

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
<p style="margin:0 0 18px;">{e(offer)}</p>
<p style="margin:0 0 20px;"><a href="{e(cta_url)}" style="display:inline-block;background:#5636E8;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">Peržiūrėti paruoštą puslapį →</a></p>
<p style="margin:0 0 18px;">{e(closing)}</p>
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

    candidates = _fetch_candidates(agent.get("target_industry", "clinic"), needed, agent_id=agent["agent_id"])
    if not candidates:
        print("⚠️ Nėra naujų nekontaktuotų įmonių sąraše!")
        conn.close()
        return 0

    sender = None if dry_run else SMTPEmailSender(config_path=agent["config_path"])
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

        # Naudojame esamą campaign_leads id, kitaip sekimo įvykiai nesusietų su lead'u.
        row = conn.execute("SELECT id FROM campaign_leads WHERE email=?", (to_email,)).fetchone()
        lead_id = row["id"] if row else str(uuid.uuid4())

        token = "PERZIURA" if dry_run else issue_claim_token(conn, client["id"])
        demo_url = f"{APP_BASE}/r/{urllib.parse.quote(slug)}?k={token}"
        stats = {"rating": client.get("google_rating"), "count": client.get("google_reviews_count")}
        subj, text, html = build_tracked_email({**lead, "industry": client.get("industry") or lead.get("industry")}, lead_id, demo_url, stats,
                                               sender_name=agent["name"], sender_email=agent["email"])

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
    print(f"🏁 Baigta. {'Paruošta peržiūrų' if dry_run else 'Išsiųsta'}: {done}.")
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


def build_custom_email(draft: dict, lead_id: str, demo_url: str) -> tuple:
    """Individualus laiškas pagal agento tyrimą (data/leads/research/*.json → email_draft). Tas pats stilius ir vienas CTA."""
    e = html_lib.escape
    paragraphs = draft["paragraphs"]
    closing = draft.get("closing", "Jei tiks, paskyrą aktyvuosite vienu paspaudimu: 14 dienų nemokamai, be banko kortelės.")
    ps = "P.S. Jei neaktualu, tiesiog atsakykite „ne“ ir daugiau nerašysime."
    cta_url = f"{APP_BASE}/api/track/click?id={urllib.parse.quote(lead_id)}&to={urllib.parse.quote(demo_url, safe='')}"
    track_open_url = f"{APP_BASE}/api/track/open?id={urllib.parse.quote(lead_id)}"
    text = "Laba diena,\n\n" + "\n\n".join(paragraphs) + f"\n{cta_url}\n\n{closing}\n\n{SENDER_NAME}\nVerslomatika · {SENDER_EMAIL}\n\n{ps}\n"
    body = "".join(f'<p style="margin:0 0 14px;">{e(p)}</p>' for p in paragraphs)
    html = f"""<!DOCTYPE html>
<html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1e293b;max-width:560px;padding:8px 4px;">
<p style="margin:0 0 14px;">Laba diena,</p>
{body}
<p style="margin:4px 0 20px;"><a href="{e(cta_url)}" style="display:inline-block;background:#5636E8;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">{e(draft.get('cta_label', 'Peržiūrėti paruoštą puslapį'))} →</a></p>
<p style="margin:0 0 18px;">{e(closing)}</p>
<p style="margin:0 0 18px;">{e(s_name)}<br><span style="color:#64748b;">Verslomatika · <a href="mailto:{e(s_email)}" style="color:#64748b;">{e(s_email)}</a></span></p>
<p style="margin:0;color:#64748b;font-size:13px;">{e(ps)}</p>
<p style="margin:18px 0 0;color:#94a3b8;font-size:11px;">MB Pinet · įm. k. 306067365 · Vilnius</p>
</div>
<img src="{e(track_open_url)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />
</body></html>
"""
    return draft["subject"], text, html


def send_researched(brief_path: str, send: bool = False) -> bool:
    """Agento ištirtas lead'as (data/leads/research/{slug}.json).

    Be --send: paruošia demo profilį (niekam nieko nesiunčia) ir įrašo laiško peržiūrą į
    data/reports/email_previews/{slug}.html. Su --send: išsiunčia tikrą laišką.
    """
    import json
    with open(brief_path, encoding="utf-8") as f:
        brief = json.load(f)
    review_url = f"https://search.google.com/local/writereview?placeid={brief['google_place_id']}"
    lead = {"business_name": brief["business_name"], "email": brief["email"].strip().lower(), "slug": brief["slug"],
            "city": brief.get("city", "Lietuva"), "industry": brief.get("industry", "services"), "google_review_url": review_url}
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)
    client, skip = prepare_lead(conn, lead)
    if skip:
        print(f"✗ Nesiųsta: {skip}")
        conn.close()
        return False
    conn.execute("UPDATE clients SET google_place_id=?, google_rating=?, google_reviews_count=? WHERE id=?",
                 (brief["google_place_id"], brief.get("google_rating"), brief.get("google_reviews_count"), client["id"]))
    conn.commit()
    row = conn.execute("SELECT id FROM campaign_leads WHERE email=?", (lead["email"],)).fetchone()
    lead_id = row["id"] if row else str(uuid.uuid4())

    if not send:
        subj, text, html = build_custom_email(brief["email_draft"], lead_id, f"{APP_BASE}/r/{brief['slug']}?k=PERZIURA")
        out = os.path.join(BASE_DIR, "data", "reports", "email_previews", f"{brief['slug']}.html")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as f:
            f.write(f"<!-- Tema: {html_lib.escape(subj)} | Kam: {lead['email']} -->\n" + html)
        print(f"👁 PERŽIŪRA (neišsiųsta)\nKam: {lead['email']}\nTema: {subj}\n\n{text}\nFailas: {out}\nDemo: {APP_BASE}/r/{brief['slug']}")
        conn.close()
        return True

    token = issue_claim_token(conn, client["id"])
    subj, text, html = build_custom_email(brief["email_draft"], lead_id, f"{APP_BASE}/r/{urllib.parse.quote(brief['slug'])}?k={token}")
    sender = SMTPEmailSender(config_path=AGENT_PROFILES[0]["config_path"])
    ok = sender.send_email(to_email=lead["email"], subject=subj, body_text=text, body_html=html,
                           headers={"List-Unsubscribe": f"<mailto:{agent['email']}?subject=Atsisakau>"})
    if not ok:
        print("✗ SMTP serveris laiško nepriėmė.")
        conn.close()
        return False
    now_iso = datetime.datetime.now().isoformat()
    conn.execute("""
        INSERT INTO campaign_leads (id, campaign_id, business_name, email, slug, city, website, phone, status, sent_at, created_at, updated_at)
        VALUES (?, 'researched', ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET status='sent', sent_at=excluded.sent_at, slug=excluded.slug, updated_at=excluded.updated_at
    """, (lead_id, brief["business_name"], lead["email"], brief["slug"], lead["city"], brief.get("website", ""), brief.get("phone", ""), now_iso, now_iso, now_iso))
    conn.execute("INSERT INTO campaign_events (id, lead_id, event_type, details, created_at) VALUES (?, ?, 'sent', 'researched', ?)", (str(uuid.uuid4()), lead_id, now_iso))
    conn.commit()
    record_message(conn, lead_id, "E0", sender.last_message_id, subj)
    conn.close()
    print(f"✓ Išsiųsta: „{subj}“ → {lead['email']}")
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
        send_researched(sys.argv[2], send="--send" in sys.argv[3:])
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
