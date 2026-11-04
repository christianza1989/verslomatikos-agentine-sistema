import os
import sys
import json
import time
import random
import uuid
import datetime
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

DB_PATH = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "reputation.db")

# Multi-agent sender profiles pool (lengva pridėti naujus domenus ir agentus)
AGENT_PROFILES = [
    {
        "agent_id": "agent-tomas",
        "name": "Tomas | Verslo sprendimų vadovas",
        "display_from": "Tomas | Verslomatika B2B",
        "email": "tomas@verslomatika.lt",
        "config_path": os.path.join(BASE_DIR, "configs", "email_credentials.json"),
        "daily_limit": 25,
        "target_industry": "mixed",  # mixed (50% e-komercija, 50% klinikos), "ecommerce", arba "dental"
        "is_active": True
    }
    # Kai prijungsime naują domeną:
    # {
    #     "agent_id": "agent-naujas",
    #     "name": "Laura | Klientų partnerė",
    #     "display_from": "Laura | Partneriai B2B",
    #     "email": "laura@naujasdomenas.lt",
    #     "config_path": os.path.join(BASE_DIR, "configs", "email_naujasdomenas.json"),
    #     "daily_limit": 25,
    #     "is_active": True
    # }
]

def get_today_sent_count(agent_email: str) -> int:
    """Suskaičiuoja, kiek laiškų jau buvo išsiųsta šiandien iš nurodytos pašto dėžutės."""
    today_str = datetime.datetime.now().strftime("%Y-%m-%d")
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            SELECT COUNT(*) FROM campaign_leads 
            WHERE sent_at LIKE ?
        """, (f"{today_str}%",))
        cnt = c.fetchone()[0]
        conn.close()
        return cnt
    except Exception as e:
        print(f"[DB Sent Count Error] {e}")
        return 0

def build_tracked_email(lead: dict, lead_id: str) -> tuple[str, str, str]:
    """Suformuoja personalizuotą el. laišką pagal veiklos sritį (e-komercija, klinika, paslaugos)."""
    b_name = lead["business_name"]
    city = lead.get("city", "Vilnius")
    industry = lead.get("industry", "dental")
    
    # Auto-detect industry if not explicit
    b_lower = b_name.lower()
    if any(k in b_lower for k in ["shop", "parduotuv", "prekyb", "mada", "drabuž", "avalyn", "kosmetik", "baldai", "dovan", "knyg"]):
        industry = "ecommerce"
    elif any(k in b_lower for k in ["auto", "servis", "remont", "salonas", "spa", "viešbut"]):
        industry = "services"

    default_role = "El. parduotuvės vadovui" if industry == "ecommerce" else "Klinikos vadovui"
    role = lead.get("role", default_role)
    
    slug = lead.get("slug") or "demo"
    raw_preview_url = lead.get("preview_url") or f"https://verslomatika.lt/r/{slug}"
    qr_img_url = lead.get("qr_url") or f"https://verslomatika.lt/api/qr?slug={slug}"
    raw_claim_url = lead.get("claim_url") or f"https://verslomatika.lt/checkout?slug={slug}&name={urllib.parse.quote(b_name)}&email={urllib.parse.quote(lead['email'])}"
    raw_pricing_url = "https://verslomatika.lt/reputacija"

    # Sekimo nuorodos per Next.js API
    track_open_url = f"https://verslomatika.lt/api/track/open?id={lead_id}"
    preview_url = f"https://verslomatika.lt/api/track/click?id={lead_id}&to={urllib.parse.quote(raw_preview_url)}"
    claim_url = f"https://verslomatika.lt/api/track/click?id={lead_id}&to={urllib.parse.quote(raw_claim_url)}"
    pricing_url = f"https://verslomatika.lt/api/track/click?id={lead_id}&to={urllib.parse.quote(raw_pricing_url)}"

    if industry == "ecommerce":
        subject = f"Kaip {b_name} gali surinkti 5★ atsiliepimus po kiekvieno internetinio pirkimo"
        text = f"""Sveiki, {role},

Pastebėjome, kad pirkėjai prieš pirkdami Jūsų el. parduotuvėje vis dažniau tikrina atsiliepimus „Google“ bei „Trustpilot“. Vos vienas piktas 1★ skundas dėl vėlavusio kurjerio ar pažeistos pakuotės gali atbaidyti dešimtis potencialių pirkėjų, o patenkinti klientai po sėkmingo pirkimo retai prisimena parašyti atsiliepimą patys.

Mūsų sukurta „ReputationPro“ sistema skirta tokiems el. prekybos lyderiams kaip „{b_name}“:
1. Automatinė po-pirkimo nuoroda: kurjeriui (Omniva, DPD, LP Express) pristačius siuntą, pirkėjas el. laišku ar SMS gauna asmeninę padėkos nuorodą.
2. Laimingi pirkėjai (5★): per 3 sekundes nukreipiami parašyti viešą 5★ atsiliepimą oficialiame Google Maps arba Trustpilot profilyje.
3. Nepatenkinti pirkėjai (1–3★): nukreipiami į privačią formą tiesiai el. parduotuvės vadovui. Išsprendžiate situaciją asmeniškai, pakeičiate prekę ir išsaugote klientą – joks skundas NIEKADA nepasirodo viešai!
4. Nereikia jokio fizinio stovelio: visa sistema veikia skaitmeniniu būdu per unikalią nuorodą, integruojamą į Jūsų el. parduotuvę (Shopify, WooCommerce ar bet kurią kitą platformą).

Paruošėme Jūsų el. parduotuvei individualų demonstracinį pirkėjo kelią:
👉 Jūsų demonstracinis puslapis: {raw_preview_url}
👉 Aktyvuoti Jūsų paskyrą (14 d. nemokamai): {raw_claim_url}
(Spustelėjus aktyvavimą, Jūsų duomenys jau bus paruošti – tereikės nustatyti norimą slaptažodį).

Išsamus sprendimo pristatymas ir skaidri kainodara (29 € / 49 € / 290 €):
👉 {raw_pricing_url}

Pagarbiai,
Tomas | Verslo sprendimų vadovas
Verslomatika B2B • MB Pinet
tomas@verslomatika.lt • https://verslomatika.lt
"""

        html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background: #5636E8; padding: 24px 30px; color: #ffffff; }}
    .header h2 {{ margin: 0; font-size: 20px; font-weight: 700; }}
    .header p {{ margin: 5px 0 0; font-size: 13px; opacity: 0.9; }}
    .content {{ padding: 30px; }}
    .highlight-box {{ background: #f5f3ff; border-left: 4px solid #5636E8; padding: 15px 20px; border-radius: 6px; margin: 20px 0; }}
    .card-preview {{ background: #ffffff; border: 2px solid #5636E8; border-radius: 12px; padding: 22px; text-align: center; margin: 25px 0; box-shadow: 0 4px 15px rgba(86,54,232,0.08); }}
    .btn-primary {{ display: inline-block; background: #5636E8; color: #ffffff !important; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-weight: 700; font-size: 13px; margin: 5px; }}
    .btn-green {{ display: inline-block; background: #157a57; color: #ffffff !important; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-weight: 700; font-size: 13px; margin: 5px; }}
    .footer {{ background: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Verslomatika • ReputationPro</h2>
      <p>5★ Atsiliepimų Apsauga El. Parduotuvėms ir E-komercijai</p>
    </div>
    <div class="content">
      <p>Sveiki, <strong>{role}</strong>,</p>
      <p>Pastebėjome, kad pirkėjai prieš pirkdami Jūsų el. parduotuvėje vis dažniau tikrina atsiliepimus „Google“ bei „Trustpilot“. Vos vienas piktas 1★ skundas dėl vėlavusio kurjerio ar pažeistos pakuotės gali atbaidyti dešimtis potencialių pirkėjų, o patenkinti klientai po sėkmingo pirkimo retai prisimena parašyti atsiliepimą patys.</p>
      
      <div class="highlight-box">
        <h4 style="margin: 0 0 8px 0; color: #5636E8;">Kaip ReputationPro veikia Jūsų el. parduotuvėje:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li><strong>Automatinė po-pirkimo nuoroda:</strong> kurjeriui (Omniva, DPD, LP Express) pristačius siuntą, pirkėjas gauna padėkos laišką su nuoroda.</li>
          <li><strong>5★ pirkėjai:</strong> akimirksniu nukreipiami į oficialų Google ar Trustpilot profilį parašyti viešo atsiliepimo.</li>
          <li><strong>1–3★ nusivylę pirkėjai:</strong> patenka į privačią formą tiesiai Jums – pakeičiate prekę, išsprendžiate problemą, o skundas <strong>niekada nepateks į viešumą</strong>.</li>
          <li><strong>Nulis fizinių reikalavimų:</strong> nereikia jokio stovelio – veikia 100% skaitmeniniu formatu.</li>
        </ul>
      </div>

      <div class="card-preview">
        <h3 style="margin: 0 0 6px 0; color: #1e293b; font-size: 17px;">Individuali „{b_name}“ pirkėjo demonstracija:</h3>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">Išbandykite, kaip pirkėjas mato atsiliepimų formą telefone ar kompiuteryje:</p>
        
        <div style="margin: 20px 0;">
          <a href="{preview_url}" class="btn-primary">Išbandyti pirkėjo kelią ↗</a>
          <a href="{claim_url}" class="btn-green">Aktyvuoti paskyrą (14 d. nemokamai) ↗</a>
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin: 10px 0 0;">Spustelėjus aktyvavimą, įmonės duomenys jau bus paruošti – tereikės nustatyti slaptažodį.</p>
      </div>

      <p style="font-size: 13px; color: #475569;">
        Išsamus pristatymas ir skaidri kainodara (29 € / 49 € / 290 €): <br>
        👉 <a href="{pricing_url}" style="color: #5636E8; font-weight: 600;">verslomatika.lt/reputacija</a>
      </p>

      <p style="margin-bottom: 0;">Pagarbiai,<br>
      <strong>Tomas</strong><br>
      <span style="color: #64748b; font-size: 13px;">Verslo sprendimų vadovas | Verslomatika B2B</span></p>
    </div>
    <div class="footer">
      MB Pinet • Įm. k. 306067365 • Vilnius, Lietuva<br>
      Ryšys: <a href="mailto:tomas@verslomatika.lt" style="color: #5636E8;">tomas@verslomatika.lt</a> • <a href="https://verslomatika.lt" style="color: #5636E8;">verslomatika.lt</a><br>
      Norėdami atsisakyti pasiūlymų, atsakykite „Atsisakau“.
    </div>
  </div>
  <!-- 1x1 Transparent Tracking Pixel -->
  <img src="{track_open_url}" width="1" height="1" style="display:none !important;" alt="" />
</body>
</html>
"""
        return subject, text, html

    # Standartinis klinikos / fizinės vietos šablonas
    subject = f"Kaip {b_name} gali apsaugoti 5.0★ Google reitingą ({city})"
    text = f"""Sveiki, {role},

Pastebėjome, kad pacientai vis dažniau renkasi odontologijos kliniką remdamiesi būtent Google Maps atsiliepimais. Vienas neigiamas 1★ atsiliepimas po sudėtingesnės procedūros gali atbaidyti dešimtis naujų pacientų, kurių krepšelis siekia 500 € – 2 000 €.

Mūsų sukurta „ReputationPro“ sistema skirta tokiems rinkos lyderiams kaip „{b_name}“:
1. Registratūroje pastatomas estetiškas akrilinis QR stovelis arba siunčiama nuoroda po vizito.
2. Patenkinti pacientai (5★) per 3 sekundes nukreipiami parašyti atsiliepimą oficialiame Google Maps tinkle.
3. Jei lankytojas turi pastabų (1–3★) – sistema pasiūlo privačią formą tiesiogiai vadovui. Tai leidžia išspręsti situaciją konfidencialiai, o skundas NIEKADA nepateks į viešą erdvę.

Paruošėme Jūsų įmonei individualų demonstracinį puslapį bei QR kodą:
👉 Jūsų demonstracinis puslapis: {raw_preview_url}
👉 Jūsų QR kodo peržiūra: {qr_img_url}
👉 Aktyvuoti Jūsų paskyrą (14 d. nemokamai): {raw_claim_url}
(Spustelėjus aktyvavimą, Jūsų duomenys jau bus paruošti – tereikės nustatyti norimą slaptažodį).

Išsamus sprendimo pristatymas ir skaidri kainodara (29 € / 49 € / 290 €):
👉 {raw_pricing_url}

Jei norėtumėte gauti nemokamą testinį akrilinį QR stovelį registratūrai – tiesiog atsakykite į šį laišką.

Pagarbiai,
Tomas | Verslo sprendimų vadovas
Verslomatika B2B • MB Pinet
tomas@verslomatika.lt • https://verslomatika.lt
"""

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }}
    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }}
    .header {{ background: #5636E8; padding: 24px 30px; color: #ffffff; }}
    .header h2 {{ margin: 0; font-size: 20px; font-weight: 700; }}
    .header p {{ margin: 5px 0 0; font-size: 13px; opacity: 0.9; }}
    .content {{ padding: 30px; }}
    .highlight-box {{ background: #f5f3ff; border-left: 4px solid #5636E8; padding: 15px 20px; border-radius: 6px; margin: 20px 0; }}
    .card-preview {{ background: #ffffff; border: 2px solid #5636E8; border-radius: 12px; padding: 22px; text-align: center; margin: 25px 0; box-shadow: 0 4px 15px rgba(86,54,232,0.08); }}
    .btn-primary {{ display: inline-block; background: #5636E8; color: #ffffff !important; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-weight: 700; font-size: 13px; margin: 5px; }}
    .btn-green {{ display: inline-block; background: #157a57; color: #ffffff !important; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-weight: 700; font-size: 13px; margin: 5px; }}
    .footer {{ background: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Verslomatika • ReputationPro</h2>
      <p>5★ Atsiliepimų Apsaugos ir Augimo Sistema • {city}</p>
    </div>
    <div class="content">
      <p>Sveiki, <strong>{role}</strong>,</p>
      <p>Pastebėjome, kad pacientai vis dažniau renkasi odontologijos kliniką remdamiesi būtent Google Maps atsiliepimais. Vienas neigiamas 1★ atsiliepimas po sudėtingesnės procedūros gali atbaidyti dešimtis naujų pacientų, kurių krepšelis siekia 500 € – 2 000 €.</p>
      
      <div class="highlight-box">
        <h4 style="margin: 0 0 8px 0; color: #5636E8;">Kaip ReputationPro apsaugo „{b_name}“:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li><strong>Patenkinti pacientai (5★):</strong> akimirksniu nukreipiami į oficialų Google Maps profilį.</li>
          <li><strong>Nusivylę lankytojai (1–3★):</strong> patenka į privačią formą tiesiai vadovui. Skundas <strong>niekada nepateks į viešumą</strong>.</li>
          <li><strong>QR stovelis arba nuoroda:</strong> veikia per 3 sekundes telefonu be jokių programėlių diegimo.</li>
        </ul>
      </div>

      <div class="card-preview">
        <h3 style="margin: 0 0 6px 0; color: #1e293b; font-size: 17px;">Individuali „{b_name}“ demonstracija:</h3>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">Nukreipkite telefoną arba išbandykite paciento kelią:</p>
        
        <a href="{preview_url}" style="display: inline-block; text-decoration: none;">
          <img src="{qr_img_url}" width="160" height="160" style="border-radius: 8px; border: 1px solid #e2e8f0; display: block; margin: 0 auto;" alt="Jūsų klinikos QR kodas" />
        </a>
        
        <div style="margin-top: 18px;">
          <a href="{preview_url}" class="btn-primary">Išbandyti paciento kelią ↗</a>
          <a href="{claim_url}" class="btn-green">Aktyvuoti paskyrą (14 d. nemokamai) ↗</a>
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin: 10px 0 0;">Spustelėjus aktyvavimą, klinikos duomenys jau bus užpildyti – tereikės nurodyti slaptažodį.</p>
      </div>

      <p style="font-size: 13px; color: #475569;">
        Išsamus pristatymas ir skaidri kainodara (29 € / 49 € / 290 €): <br>
        👉 <a href="{pricing_url}" style="color: #5636E8; font-weight: 600;">verslomatika.lt/reputacija</a>
      </p>

      <p style="margin-top: 25px;">Jei norėtumėte gauti nemokamą testinį akrilinį QR stovelį klinikos registratūrai – tiesiog atsakykite į šį laišką.</p>

      <p style="margin-bottom: 0;">Pagarbiai,<br>
      <strong>Tomas</strong><br>
      <span style="color: #64748b; font-size: 13px;">Verslo sprendimų vadovas | Verslomatika B2B</span></p>
    </div>
    <div class="footer">
      MB Pinet • Įm. k. 306067365 • Vilnius, Lietuva<br>
      Ryšys: <a href="mailto:tomas@verslomatika.lt" style="color: #5636E8;">tomas@verslomatika.lt</a> • <a href="https://verslomatika.lt" style="color: #5636E8;">verslomatika.lt</a><br>
      Norėdami atsisakyti pasiūlymų, atsakykite „Atsisakau“.
    </div>
  </div>
  <!-- 1x1 Transparent Tracking Pixel -->
  <img src="{track_open_url}" width="1" height="1" style="display:none !important;" alt="" />
</body>
</html>
"""
    return subject, text, html

def dispatch_daily_quota(target_agent_id: str = "agent-tomas", force_count: int = None, delay_min: int = 40, delay_max: int = 65) -> int:
    """
    Išsiunčia tiksliai trūkstamus laiškus iki 25 dienos limito.
    Apsaugo nuo per didelio siuntimo, registruoja į SQLite ir naudoja saugius intervalus.
    """
    agent = next((a for a in AGENT_PROFILES if a["agent_id"] == target_agent_id), None)
    if not agent or not agent.get("is_active"):
        print(f"Agentas {target_agent_id} nerastas arba neaktyvus.")
        return 0

    daily_limit = force_count if force_count is not None else agent["daily_limit"]
    already_sent = get_today_sent_count(agent["email"])
    needed = max(0, daily_limit - already_sent)

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n{'='*75}")
    print(f"[{now_str}] 🚀 B2B RYTINĖ ODONTOLOGIJOS KAMPANIJA ({agent['email']})")
    print(f"Dienos limitas: {daily_limit} | Šiandien jau išsiųsta: {already_sent} | Reikia išsiųsti: {needed}")
    print(f"{'='*75}")

    if needed == 0:
        print(f"✅ Šios dienos kvota ({daily_limit} laiškų) jau pilnai pasiekta. Naujų laiškų nesiunčiama.")
        return 0

    # Pasiimame šviežias nekontaktuotas įmones (e-komercija arba odontologija)
    target_ind = agent.get("target_industry", "mixed")
    if target_ind == "ecommerce":
        leads = get_uncontacted_ecommerce_leads(limit=needed)
    elif target_ind == "dental":
        leads = get_uncontacted_dental_leads(limit=needed)
    else:
        # Mišrus paskirstymas: dalis e-komercijos, dalis klinikų
        ecom_count = needed // 2
        dental_count = needed - ecom_count
        leads_ecom = get_uncontacted_ecommerce_leads(limit=ecom_count)
        leads_dental = get_uncontacted_dental_leads(limit=dental_count)
        leads = leads_ecom + leads_dental
        if len(leads) < needed:
            remainder = needed - len(leads)
            extra_ecom = get_uncontacted_ecommerce_leads(limit=remainder + len(leads_ecom))[len(leads_ecom):]
            leads.extend(extra_ecom)
            if len(leads) < needed:
                extra_rem = needed - len(leads)
                extra_dental = get_uncontacted_dental_leads(limit=extra_rem + len(leads_dental))[len(leads_dental):]
                leads.extend(extra_dental)
        
    if not leads:
        print("⚠️ Dėmesio: Nėra naujų nekontaktuotų įmonių sąraše!")
        return 0

    sender = SMTPEmailSender(config_path=agent["config_path"])
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    campaign_id = f"dental-daily-{datetime.datetime.now().strftime('%Y%m%d')}"
    sent_successfully = 0

    for idx, lead in enumerate(leads, 1):
        lead_id = str(uuid.uuid4())
        b_name = lead["business_name"]
        to_email = lead["email"]
        city = lead.get("city", "Vilnius")
        slug = lead["slug"]

        # 1. Užtikriname, kad klinika turi demonstracinį profilį `clients` lentelėje
        provision_lead_in_db(lead)

        # 2. Suformuojame personalizuotą el. laišką su sekimo pikseliais
        subj, text, html = build_tracked_email(lead, lead_id)

        print(f"\n[{idx}/{len(leads)}] Siunčiama: {b_name} ({city}) -> {to_email}...")
        try:
            res = sender.send_email(
                to_email=to_email,
                subject=subj,
                body_text=text,
                body_html=html
            )
            print(f"    ✓ Sėkmingai pristatyta per SMTP serverį!")
            
            now_iso = datetime.datetime.now().isoformat()
            # 3. Įrašome į campaign_leads lentelę
            c.execute("""
                INSERT INTO campaign_leads 
                (id, campaign_id, business_name, email, slug, city, status, sent_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?)
                ON CONFLICT(email) DO UPDATE SET
                  status = 'sent',
                  sent_at = excluded.sent_at,
                  updated_at = excluded.updated_at
            """, (lead_id, campaign_id, b_name, to_email, slug, city, now_iso, now_iso, now_iso))

            # 4. Įrašome siuntimo įvykį į campaign_events
            c.execute("""
                INSERT INTO campaign_events (id, lead_id, event_type, created_at)
                VALUES (?, ?, 'sent', ?)
            """, (str(uuid.uuid4()), lead_id, now_iso))

            conn.commit()
            sent_successfully += 1

            # Saugus pauzės intervalas tarp laiškų
            if idx < len(leads):
                delay = random.randint(delay_min, delay_max)
                print(f"    ⏳ Saugumo pauzė prieš kitą kliniką: {delay} sek. (apsaugo pašto dėžutės reputaciją)...")
                time.sleep(delay)

        except Exception as e:
            print(f"    ✗ Klaida siunčiant į {to_email}: {e}")
            c.execute("""
                INSERT INTO campaign_leads 
                (id, campaign_id, business_name, email, slug, city, status, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 'bounced', ?, ?, ?)
                ON CONFLICT(email) DO UPDATE SET
                  status = 'bounced',
                  notes = excluded.notes,
                  updated_at = excluded.updated_at
            """, (lead_id, campaign_id, b_name, to_email, slug, city, str(e), datetime.datetime.now().isoformat(), datetime.datetime.now().isoformat()))
            conn.commit()

    conn.close()
    print(f"\n{'='*75}")
    print(f"🏁 Kampanija baigta! Šiandien sėkmingai išsiųsta: {sent_successfully} laiškų.")
    print(f"{'='*75}")
    return sent_successfully

def run_daily_morning_daemon(target_hour: int = 8, target_minute: int = 30):
    """
    Nuolatinis foninis demonas:
    Kiekvieną rytą (pvz. 08:30) patikrina kiekvieno aktyvaus agento siuntimo kvotą (pvz. 25 laiškų)
    ir jei trūksta – automatiškai išsiunčia.
    Jei paleidžiamas po numatytos valandos ir šiandien dar neišsiųsta – išsiunčia iškart.
    """
    print(f"[{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 🕒 Rytinio B2B siuntimo demonas paleistas.")
    print(f"Numatytas kasdienio siuntimo laikas: kiekvieną dieną {target_hour:02d}:{target_minute:02d}")
    print(f"Aktyvūs siuntimo agentai: {[a['email'] for a in AGENT_PROFILES if a.get('is_active')]}")

    while True:
        try:
            now = datetime.datetime.now()
            for agent in AGENT_PROFILES:
                if not agent.get("is_active"):
                    continue
                a_id = agent["agent_id"]
                a_email = agent["email"]
                a_limit = agent["daily_limit"]

                today_sent = get_today_sent_count(a_email)
                if today_sent < a_limit and (now.hour > target_hour or (now.hour == target_hour and now.minute >= target_minute)):
                    print(f"\n[{now.strftime('%H:%M:%S')}] ⏰ Agentui {a_email} atėjo laikas ir šiandienos kvota nepasiekta ({today_sent}/{a_limit}). Pradedamas siuntimas...")
                    dispatch_daily_quota(target_agent_id=a_id, force_count=a_limit)

            # Miegama 10 minučių iki kito patikrinimo
            time.sleep(600)
        except Exception as e:
            print(f"[Daemon Error] {e}")
            time.sleep(60)

if __name__ == "__main__":
    # Paleidimas: jei nurodyta 'daemon' – veikia fone, jei ne – paleidžia šios dienos kvotą
    if len(sys.argv) > 1 and sys.argv[1] == "daemon":
        run_daily_morning_daemon(target_hour=8, target_minute=30)
    else:
        # Tiesioginis šios dienos 25 laiškų išsiuntimas
        dispatch_daily_quota(target_agent_id="agent-tomas", force_count=25)
