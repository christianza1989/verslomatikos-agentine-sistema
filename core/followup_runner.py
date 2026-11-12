"""Follow-up agentas: antras (ir trečias) laiškas tiems, kurie neaktyvavo (ROADMAP C3).

    python core/followup_runner.py status    # kas kam ir kada būtų siunčiama (NIEKO nesiunčia)
    python core/followup_runner.py preview   # visi šablonai → data/reports/email_previews/followups/
    python core/followup_runner.py once      # išsiunčia šiuo metu priklausančius follow-up'us
Automatiškai kviečiamas iš `morning_campaign_runner.py daemon` (prieš naujus laiškus, bendra 25/d. kvota).

SEGMENTAI IR LAIKAS (darbo dienomis, siuntimo langas 08:30–16:30):

  E0  pirmas laiškas (morning_campaign_runner.py)
  ├─ KARŠTAS: atidarė demo (paspaudė nuorodą ≥2 min. po išsiuntimo arba spaudė žvaigždutes demo puslapyje)
  │    H1  „Kaip pradėti šiandien“: praktiniai žingsniai pagal nišą + paruoštas SMS tekstas
  │        + aktyvavimo nuoroda. Ne anksčiau kaip po 20 val. nuo demo peržiūros, kitą darbo dieną.
  │    H2  „3 dažniausi klausimai“: kaina / laikas / ar klientai naudos + „atsakykite taip“.
  │        Po 3 darbo dienų nuo H1.
  │    F   Uždarymas su tikra aktyvavimo nuorodos galiojimo data. Po 5 darbo dienų nuo paskutinio.
  └─ ŠALTAS: demo neatidarė
       B1  „Ar teisingam žmogui rašau?“: paprašymas persiųsti vadovui + demo nuoroda. Po 3 darbo dienų nuo E0.
           (Jei po B1 tampa karštas → H1, tada F.)
       F   Uždarymas. Po 7 darbo dienų nuo B1.

  Ne daugiau kaip 3 follow-up'ai vienam lead'ui; F visada paskutinis.
  STOP visiems: aktyvavo (converted), atsakė (replied), bounced, campaign_suppressions (opt_out ir kt.).
  Laiškai siunčiami toje pačioje gijoje (Re: + In-Reply-To), jei žinomas pirmo laiško Message-ID.
  Elgsena naudojama turiniui parinkti, bet laiškuose nerašome „matėme, kad atidarėte“.

TEISINGUMAS: tekstai sąmoningai be skaičių ir garantijų. „Jei nepatiks, nieko daryti nereikės“ teisinga,
kol bandymas neperauga į automatinį mokėjimą (ROADMAP G). Įjungus mokėjimus, H2 tekstą peržiūrėti.
"""
import datetime
import html as html_lib
import os
import random
import sqlite3
import sys
import time
import urllib.parse

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from core.claim_tokens import (CLAIM_TTL_MS, count_sent_today, ensure_schema, issue_claim_token,
                               is_suppressed, record_message)
from core.morning_campaign_runner import (AGENT_PROFILES, APP_BASE, DB_PATH, SENDER_EMAIL, SENDER_NAME,
                                          detect_industry)

SEND_WINDOW = (datetime.time(8, 30), datetime.time(16, 30))
SCANNER_GRACE = datetime.timedelta(minutes=2)  # pašto saugumo skeneriai „paspaudžia“ nuorodas per kelias sekundes
MAX_FOLLOWUPS = 3
MONTHS = ["sausio", "vasario", "kovo", "balandžio", "gegužės", "birželio", "liepos", "rugpjūčio",
          "rugsėjo", "spalio", "lapkričio", "gruodžio"]


# ---------------------------------------------------------------------------
# Laikas
# ---------------------------------------------------------------------------

def parse_ts(value):
    """ISO laikas → vietinis naivus datetime (Node rašo UTC su 'Z', Python – vietinį be zonos)."""
    if not value:
        return None
    dt = datetime.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    return dt.astimezone().replace(tzinfo=None) if dt.tzinfo else dt


def business_days_between(start: datetime.datetime, end: datetime.datetime) -> int:
    """Kiek darbo dienų (Pr–Pn) praėjo nuo start dienos iki end dienos (start diena neskaičiuojama)."""
    days, d = 0, start.date()
    while d < end.date():
        d += datetime.timedelta(days=1)
        if d.weekday() < 5:
            days += 1
    return days


def in_send_window(now: datetime.datetime) -> bool:
    return now.weekday() < 5 and SEND_WINDOW[0] <= now.time() <= SEND_WINDOW[1]


def lt_date(dt: datetime.datetime) -> str:
    return f"{MONTHS[dt.month - 1]} {dt.day} d."


# ---------------------------------------------------------------------------
# Sprendimas: kuris žingsnis dabar (gryna funkcija, testuojama test_followups.py)
# ---------------------------------------------------------------------------

def next_step(sent_at: datetime.datetime, engaged_at, steps: dict, now: datetime.datetime):
    """steps: {'B1': datetime, 'H1': ..., ...} (be E0). Grąžina 'B1'|'H1'|'H2'|'F'|None."""
    if "F" in steps or len(steps) >= MAX_FOLLOWUPS:
        return None
    last_any = max([sent_at, *steps.values()])
    if engaged_at is not None:
        if "H1" not in steps:
            if now - engaged_at >= datetime.timedelta(hours=20) and business_days_between(last_any, now) >= 1:
                return "H1"
            return None
        if "H2" not in steps and len(steps) < MAX_FOLLOWUPS - 1:
            return "H2" if business_days_between(steps["H1"], now) >= 3 else None
        last = steps.get("H2") or steps["H1"]
        return "F" if business_days_between(last, now) >= 5 else None
    if "B1" not in steps:
        return "B1" if business_days_between(sent_at, now) >= 3 else None
    return "F" if business_days_between(steps["B1"], now) >= 7 else None


# ---------------------------------------------------------------------------
# Šablonai
# ---------------------------------------------------------------------------

NICHE = {
    "clinic": {
        "people": "pacientai", "dat": "pacientams", "asset": "su QR kodu registratūrai",
        "how": ["atsispausdinti QR kodą ir pastatyti jį registratūroje;", "arba po vizito nusiųsti pacientui trumpą SMS su nuoroda."],
    },
    "ecommerce": {
        "people": "pirkėjai", "dat": "pirkėjams", "asset": "su nuoroda užsakymo ir pristatymo laiškams",
        "how": ["įklijuoti nuorodą į užsakymo pristatymo laišką;", "arba nusiųsti ją pirkėjams praėjus kelioms dienoms po pristatymo."],
    },
    "services": {
        "people": "klientai", "dat": "klientams", "asset": "su QR kodu ir nuoroda SMS žinutėms",
        "how": ["pastatyti QR kodą prie kasos ar registratūros;", "arba po apsilankymo nusiųsti klientui trumpą SMS su nuoroda."],
    },
}


def tracked(lead_id: str, url: str) -> str:
    return f"{APP_BASE}/api/track/click?id={urllib.parse.quote(lead_id)}&to={urllib.parse.quote(url, safe='')}"


def build_followup(step: str, lead: dict, links: dict, expiry: datetime.datetime, platform: str = "google") -> tuple:
    """Grąžina (body_paragraphs, cta_label, cta_url). Paragrafai: str arba list (sąrašas).

    platform: "google" arba "rekvizitai" (įmonė be Google profilio, Etapas R) – keičia tik žodžius apie platformą.
    """
    rk = platform == "rekvizitai"
    name = lead["business_name"].strip()
    niche = NICHE[detect_industry(lead)]
    page = f"reputacija.verslomatika.lt/r/{lead['slug']}"

    if step == "H1":
        return ([
            f"trumpai papildysiu: „{name}“ atsiliepimų puslapis jau paruoštas, o pradėti galima dar šiandien. Užtenka vieno iš šių būdų:",
            niche["how"],
            "Štai tekstas, kurį galite naudoti iškart (nuoroda veiks iškart po aktyvavimo):",
            [f"Ačiū, kad pasirinkote „{name}“! Būtume dėkingi už trumpą įvertinimą: {page}"],
            "Aktyvavimas užtrunka minutę: 14 dienų nemokamai, be banko kortelės.",
        ], "Aktyvuoti paskyrą", links["activate"])

    if step == "H2":
        return ([
            "dažniausiai klausia trijų dalykų, todėl atsakau iš anksto:",
            ["Kiek kainuos? 14 dienų nemokamai, kortelės nereikia. Jei nepatiks, nieko daryti nereikės.",
             "Kiek laiko užims? Aktyvavimas trunka minutę, toliau tik dalinatės nuoroda ar QR kodu.",
             f"Ar {niche['people']} tai naudos? Puslapis atsidaro telefonu be programėlių, įvertinti užtrunka kelias sekundes."],
            f"Jei patogiau, tiesiog atsakykite „taip“: atsiųsiu QR kodą spausdinimui ir paruoštą tekstą {niche['dat']}.",
        ], "Aktyvuoti pačiam", links["activate"])

    if step == "B1":
        return ([
            f"gal mano laiškas pateko ne tam žmogui? Jei atsiliepimais {'internete' if rk else '„Google“'} rūpinasi kolega ar vadovas, būsiu dėkingas, jei persiųsite.",
            f"Trumpai: paruošėme „{name}“ atsiliepimų puslapį {niche['asset']}. Patenkinti {niche['people']} nukreipiami palikti atsiliepimą {'Rekvizitai.lt' if rk else '„Google“'}, o pastabos pirmiausia ateina Jūsų komandai, kad darbuotojai galėtų greitai sureaguoti.",
        ], "Peržiūrėti puslapį (30 s)", links["demo"])

    if step == "F":
        return ([
            "daugiau nerašysiu, kad neužimčiau Jūsų laiko.",
            f"„{name}“ puslapis lieka paruoštas, o aktyvavimo nuoroda galioja iki {lt_date(expiry)}",
            f"Jei atsiliepimai {'internete' if rk else '„Google“'} taps aktualūs vėliau, tiesiog atsakykite į šį laišką.",
        ], "Aktyvuoti paskyrą", links["activate"])

    raise ValueError(step)


def render(paragraphs: list, cta_label: str, cta_url: str, sender_name: str = None, sender_email: str = None) -> tuple:
    """(text, html) tame pačiame stiliuje kaip pirmas laiškas. Pasirašo tas pats agentas, kuris rašė pirmą laišką."""
    e = html_lib.escape
    sender_name, sender_email = sender_name or SENDER_NAME, sender_email or SENDER_EMAIL
    text_parts, html_parts = ["Laba diena,"], ['<p style="margin:0 0 14px;">Laba diena,</p>']
    for p in paragraphs:
        if isinstance(p, list):
            text_parts.append("\n".join(f"• {x}" for x in p))
            html_parts.append('<ul style="margin:0 0 14px;padding-left:20px;">' + "".join(f"<li>{e(x)}</li>" for x in p) + "</ul>")
        else:
            text_parts.append(p)
            html_parts.append(f'<p style="margin:0 0 14px;">{e(p)}</p>')
    text_parts.append(f"{cta_label}: {cta_url}")
    text_parts.append(f"{SENDER_NAME}\nVerslomatika · {SENDER_EMAIL}")
    html_parts.append(f'<p style="margin:4px 0 20px;"><a href="{e(cta_url)}" style="display:inline-block;background:#5636E8;color:#ffffff;text-decoration:none;font-weight:600;padding:11px 18px;border-radius:8px;">{e(cta_label)} →</a></p>')
    html_parts.append(f'<p style="margin:0;">{e(sender_name)}<br><span style="color:#64748b;">Verslomatika · {e(sender_email)}</span></p>')
    text = "\n\n".join(text_parts) + "\n"
    html = ('<!DOCTYPE html><html lang="lt"><head><meta charset="utf-8"></head><body style="margin:0;background:#fff;">'
            '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1e293b;max-width:560px;padding:8px 4px;">'
            + "".join(html_parts) + "</div></body></html>")
    return text, html


# ---------------------------------------------------------------------------
# Duomenys
# ---------------------------------------------------------------------------

def lead_state(conn: sqlite3.Connection, lead: sqlite3.Row) -> dict:
    sent_at = parse_ts(lead["sent_at"])
    client = conn.execute("SELECT * FROM clients WHERE slug=?", (lead["slug"],)).fetchone()
    engaged = None
    for ev in conn.execute("SELECT created_at FROM campaign_events WHERE lead_id=? AND event_type='click' ORDER BY created_at", (lead["id"],)):
        t = parse_ts(ev["created_at"])
        if t and t - sent_at >= SCANNER_GRACE:
            engaged = t
            break
    if client is not None:
        # Žvaigždučių paspaudimai demo puslapyje = tikras žmogus (skeneriai JS mygtukų nespaudžia).
        for ev in conn.execute("SELECT created_at FROM review_events WHERE client_id=? ORDER BY created_at", (client["id"],)):
            t = parse_ts(ev["created_at"])
            if t and t >= sent_at and (engaged is None or t < engaged):
                engaged = t
                break
    steps, e0 = {}, None
    for m in conn.execute("SELECT step, message_id, subject, sent_at, sender FROM campaign_messages WHERE lead_id=? ORDER BY sent_at", (lead["id"],)):
        if m["step"] == "E0":
            e0 = m
        else:
            steps[m["step"]] = parse_ts(m["sent_at"])
    return {"sent_at": sent_at, "engaged_at": engaged, "steps": steps, "e0": e0, "client": client}


from core.company_groups import active_thread_email, ensure_company_schema, get_company, refresh_company_status


def due_followups(conn: sqlite3.Connection, now: datetime.datetime) -> list:
    """[(priority, lead, state, step)], karšti pirmiau."""
    out = []
    ensure_company_schema(conn)
    rows = conn.execute("""SELECT * FROM campaign_leads
                           WHERE status IN ('sent','opened','clicked') AND sent_at IS NOT NULL""").fetchall()
    for lead in rows:
        if is_suppressed(conn, lead["email"]) or (lead["email"] or "").endswith(".invalid"):
            continue  # nesiųsti / bandomojo profilio vietos rezervavimo adresas (research --to)
        # Etapas N: a company is one conversation. Stop when any address converted/replied/opted out,
        # and follow up only the newest contacted address of the company.
        key = lead["company_key"] if "company_key" in lead.keys() else None
        if key:
            company = get_company(conn, key)
            if company and (refresh_company_status(conn, company) != "active" or active_thread_email(company) != (lead["email"] or "").lower()):
                continue
        st = lead_state(conn, lead)
        if st["client"] is None or not st["client"]["is_demo"]:
            continue  # aktyvavo (arba profilio nėra) – nieko nesiunčiame
        step = next_step(st["sent_at"], st["engaged_at"], st["steps"], now)
        if step:
            out.append(({"H1": 0, "H2": 1, "B1": 2, "F": 3}[step], lead, st, step))
    out.sort(key=lambda x: x[0])
    return out


def agent_for(st: dict) -> dict:
    """The agent whose mailbox sent the first email (same person continues the thread); else the first active one."""
    active = [a for a in AGENT_PROFILES if a.get("is_active")]
    sender = (st.get("e0")["sender"] if st.get("e0") is not None else None) or ""
    return next((a for a in active if a["email"].lower() == sender.lower()), active[0])


def compose(conn: sqlite3.Connection, lead, st: dict, step: str, dry_run: bool, agent: dict = None) -> dict:
    client = st["client"]
    token = "PERZIURA" if dry_run else issue_claim_token(conn, client["id"])
    expiry = datetime.datetime.now() + datetime.timedelta(milliseconds=CLAIM_TTL_MS)
    links = {
        "activate": tracked(lead["id"], f"{APP_BASE}/aktyvuoti/{token}"),
        "demo": tracked(lead["id"], f"{APP_BASE}/r/{urllib.parse.quote(lead['slug'])}?k={token}"),
    }
    lead_dict = {"business_name": lead["business_name"], "slug": lead["slug"], "industry": client["industry"] if "industry" in client.keys() else None}
    from core.claim_tokens import rekvizitai_review_url
    platform = "rekvizitai" if rekvizitai_review_url(client["google_review_url"] or "") else "google"
    paragraphs, label, url = build_followup(step, lead_dict, links, expiry, platform)
    agent = agent or agent_for(st)
    text, html = render(paragraphs, label, url, agent["name"], agent["email"])
    e0 = st["e0"]
    base_subject = (e0["subject"] if e0 else None) or f"{lead['business_name']}: klientų atsiliepimai{'' if platform == 'rekvizitai' else ' Google'}"
    headers = {"List-Unsubscribe": f"<mailto:{agent['email']}?subject=Atsisakau>"}
    if e0 and e0["message_id"]:
        headers["In-Reply-To"] = e0["message_id"]
        headers["References"] = e0["message_id"]
    return {"subject": f"Re: {base_subject}" if e0 else base_subject, "text": text, "html": html, "headers": headers}


# ---------------------------------------------------------------------------
# Siuntimas
# ---------------------------------------------------------------------------

def dispatch_followups(limit: int = None, dry_run: bool = False, now: datetime.datetime = None, delay=(40, 65)) -> int:
    from core.claim_tokens import vilnius_now
    window_now = now or vilnius_now()  # 08:30–16:30 Lithuanian time, whatever the PC clock zone is
    now = now or datetime.datetime.now()
    if not dry_run and not in_send_window(window_now):
        return 0
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)
    # Each mailbox has its own daily cap (first emails + follow-ups); a follow-up leaves from the agent of E0.
    left = {}
    due = []
    for item in due_followups(conn, now):
        agent = agent_for(item[2])
        if agent["email"] not in left:
            left[agent["email"]] = max(0, agent["daily_limit"] - count_sent_today(conn, agent["email"]))
        if (limit is None or len(due) < limit) and left[agent["email"]] > 0:
            left[agent["email"]] -= 1
            due.append(item + (agent,))
    if not due:
        conn.close()
        return 0
    senders = {}
    done = 0
    for _, lead, st, step, agent in due:
        msg = compose(conn, lead, st, step, dry_run, agent)
        label = f"{step} → {lead['business_name']} ({lead['email']}) nuo {agent['name']}"
        if dry_run:
            print(f"    👁 {label}: „{msg['subject']}“")
            done += 1
            continue
        if agent["email"] not in senders:
            from core.smtp_sender import SMTPEmailSender
            senders[agent["email"]] = SMTPEmailSender(config_path=agent["config_path"])
        sender = senders[agent["email"]]
        ok = sender.send_email(to_email=lead["email"], subject=msg["subject"], body_text=msg["text"], body_html=msg["html"], headers=msg["headers"])
        if not ok:
            print(f"    ✗ Nepavyko: {label}")
            continue
        record_message(conn, lead["id"], step, sender.last_message_id, msg["subject"], sender=agent["email"])
        conn.execute("INSERT INTO campaign_events (id, lead_id, event_type, details, created_at) VALUES (?, ?, 'sent', ?, ?)",
                     (os.urandom(16).hex(), lead["id"], f"followup:{step}", datetime.datetime.now().isoformat()))
        conn.commit()
        print(f"    ✓ Follow-up {label}")
        done += 1
        if done < len(due):
            time.sleep(random.randint(*delay))
    conn.close()
    return done


def write_previews() -> str:
    """Visi šablonai visoms nišoms, be DB ir be siuntimo."""
    out_dir = os.path.join(BASE_DIR, "data", "reports", "email_previews", "followups")
    os.makedirs(out_dir, exist_ok=True)
    expiry = datetime.datetime.now() + datetime.timedelta(milliseconds=CLAIM_TTL_MS)
    samples = {"clinic": "Šypsenos klinika", "ecommerce": "Linen Tales", "services": "Auto Meistrai"}
    for industry, name in samples.items():
        lead = {"business_name": name, "slug": "pavyzdys", "industry": industry}
        links = {"activate": f"{APP_BASE}/aktyvuoti/PERZIURA", "demo": f"{APP_BASE}/r/pavyzdys?k=PERZIURA"}
        for step in ("B1", "H1", "H2", "F"):
            paragraphs, label, url = build_followup(step, lead, links, expiry)
            text, html = render(paragraphs, label, url)
            with open(os.path.join(out_dir, f"{industry}-{step}.html"), "w", encoding="utf-8") as f:
                f.write(html)
            with open(os.path.join(out_dir, f"{industry}-{step}.txt"), "w", encoding="utf-8") as f:
                f.write(text)
    return out_dir


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "status"
    if mode == "preview":
        print(f"Šablonai: {write_previews()}")
    elif mode == "status":
        n = dispatch_followups(limit=1000, dry_run=True)
        print(f"Dabar priklausytų follow-up'ų: {n} (nieko neišsiųsta). Siuntimo langas: Pr–Pn 08:30–16:30.")
    elif mode == "once":
        print(f"Išsiųsta follow-up'ų: {dispatch_followups()}")
    else:
        print(__doc__)
