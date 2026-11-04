import json
import os
import sys

# Užtikriname, kad šakninis aplankas būtų sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import time
import email
from email.header import decode_header
import imaplib
import ssl
from datetime import datetime
from core.smtp_sender import SMTPEmailSender
from core.llm_client import LLMClient

# UTF-8 terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

class ReputationSalesAgent:
    """
    Autonominis Verslomatika B2B Pardavimų Agentas (Tomas | Verslomatika).
    Specializacija: ReputationPro & Verslo Augimo Įrankiai.
    Veikimas:
    1. Siunčia hiper-personalizuotą B2B laišką.
    2. Tikrina IMAP dėžutę dėl atsakymų.
    3. Atpažįsta kliento prieštaravimus ir sugeneruoja konsultacinį, profesionalų atsakymą.
    4. Išsiunčia atsakymą atgal į giją.
    """
    def __init__(self):
        self.smtp = SMTPEmailSender()
        self.llm = LLMClient()
        self.imap_host = "mx.oradomail.com"
        self.imap_port = 993
        self.email_user = self.smtp.user
        self.email_pass = self.smtp.password
        self.history = []

    def build_initial_memocasting_pitch(self, recipient_name: str = "Memocasting Komandai") -> tuple[str, str, str]:
        subject = "Idėja Memocasting: kaip apsaugoti 5.0★ Google reitingą po švenčių dovanų pirkimo"
        
        text = f"""Sveiki, {recipient_name},

Stebime „Memocasting“ veiklą – Jūsų 3D rankų liejimo rinkiniai yra viena emociškai stipriausių dovanų Lietuvoje, ypač artėjant Kalėdų ir jubiliejų sezonui.

Tačiau DIY (pasidaryk pats) dovanų rinkiniuose yra viena brangi rizika:
Jei pirkėjas namuose netyčia netinkamai sumaišo vandenį, per anksti sujudina ranką ar nesulaukia sustingimo – liejinys nepavyksta. Net jei produktas yra tobulas, nusivylęs pirkėjas emocijų pagautas dažnai parašo 1★ atsiliepimą Google Maps arba Rekvizitai.lt. Vienas toks viešas skundas prieš didįjį Kalėdų sezoną gali atbaidyti dešimtis naujų dovanų ieškotojų.

Sukūrėme „ReputationPro“ sistemą, kuri šią problemą išsprendžia automatiškai:
1. Pirkėjas po siuntos atsiėmimo (arba atvėręs pakuotę) telefonu nuskaito QR kortelę: „Kaip pavyko Jūsų liejinys?“.
2. Patenkinti klientai (5★) akimirksniu nukreipiami tiesiai į Jūsų oficialų „Memocasting“ Google profilį.
3. Jei liejinys nepavyko ar klientas susidūrė su sunkumais (1–3★) – sistema atveria privačią formą tiesiai Jūsų komandai. Jūs galite akimirksniu pasiūlyti nemokamą pakaitinį alginato maišelį ar patarimą, o viešas 1★ skundas NIEKADA neatsiranda Google Maps.

Specialiai Jums paruošėme demonstracinį variantą su Jūsų tikru Google profiliu:
👉 https://reputacija.verslomatika.lt/r/memocasting

Išsamus pristatymas ir galimybė išbandyti 14 dienų nemokamai:
👉 https://verslomatika.lt/reputacija

Ar būtų įdomu trumpai aptarti, kaip šį procesą integruoti į Jūsų siuntų pakuotes prieš šventinį bumą?

Pagarbiai,
Tomas | Verslomatika B2B
tomas@verslomatika.lt
MB Pinet • https://verslomatika.lt
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
    .btn {{ display: inline-block; background: #5636E8; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 10px 0; }}
    .footer {{ background: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Verslomatika • ReputationPro</h2>
      <p>5★ Atsiliepimų Apsauga ir Protingas Filtravimas Dovanų Verslui</p>
    </div>
    <div class="content">
      <p>Sveiki, <strong>{recipient_name}</strong>,</p>
      <p>Stebime <strong>„Memocasting“</strong> veiklą – Jūsų 3D rankų liejimo rinkiniai yra viena emociškai stipriausių dovanų Lietuvoje, ypač artėjant didžiajam švenčių sezonui.</p>
      
      <p>Tačiau DIY dovanų rinkiniuose yra viena brangi rizika: jei pirkėjas namuose netinkamai sumaišo vandenį ar sujudina ranką, liejinys nepavyksta. Net jei produktas kokybiškas, nusivylęs pirkėjas dažnai parašo <strong>1★ atsiliepimą Google Maps</strong>, o tai atbaido dešimtis naujų klientų.</p>

      <div class="highlight-box">
        <h4 style="margin: 0 0 8px 0; color: #5636E8;">Kaip ReputationPro apsaugo Memocasting:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li><strong>Patenkinti klientai (5★):</strong> akimirksniu nukreipiami į Jūsų oficialų Google profilį.</li>
          <li><strong>Nepavykę liejiniai (1–3★):</strong> patenka į privačią formą tiesiai Jūsų komandai. Pasiūlote nemokamą pakaitinį maišelį, o skundas <strong>niekada nepateks į Google</strong>.</li>
          <li><strong>Pritaikyta pakuotėms ir studijai:</strong> estetiška QR kortelė dėžutėje arba stovelis studijoje.</li>
        </ul>
      </div>

      <p style="text-align: center; margin: 25px 0;">
        <a href="https://reputacija.verslomatika.lt/r/memocasting" class="btn">Išbandyti demonstracinį Memocasting kelią ↗</a>
      </p>

      <p style="font-size: 14px; color: #475569;">
        Išsamus pristatymas, kainodara (29 € / 49 € / 290 €) ir 14 d. nemokamas bandymas: <br>
        👉 <a href="https://verslomatika.lt/reputacija" style="color: #5636E8; font-weight: 600;">verslomatika.lt/reputacija</a>
      </p>

      <p style="margin-top: 25px;">Ar būtų įdomu trumpai aptarti, kaip šį procesą integruoti į Jūsų pakuotes prieš šventinį bumą?</p>

      <p style="margin-bottom: 0;">Pagarbiai,<br>
      <strong>Tomas</strong><br>
      <span style="color: #64748b; font-size: 13px;">Verslo sprendimų vadovas | Verslomatika B2B</span></p>
    </div>
    <div class="footer">
      MB Pinet • Įm. k. 306067365 • Vilnius, Lietuva<br>
      Ryšys: <a href="mailto:tomas@verslomatika.lt" style="color: #5636E8;">tomas@verslomatika.lt</a> • <a href="https://verslomatika.lt" style="color: #5636E8;">verslomatika.lt</a>
    </div>
  </div>
</body>
</html>
"""
        return subject, text, html

    def build_dental_pitch(self, recipient_name: str = "Odontologijos klinikos vadovui", clinic_name: str = "Vilniaus Denta", target_email: str = "phengwey5@gmail.com") -> tuple[str, str, str]:
        subject = "Idėja Jūsų klinikai: kaip apsaugoti Google Maps reitingą po skausmingų ar vėluojančių vizitų"
        
        import urllib.parse
        slug = "vilniaus-denta"
        preview_url = f"https://reputacija.verslomatika.lt/r/{slug}"
        qr_url = f"https://reputacija.verslomatika.lt/api/qr?slug={slug}"
        claim_url = f"https://verslomatika.lt/reputacija/?slug={slug}&name={urllib.parse.quote(clinic_name)}&email={urllib.parse.quote(target_email)}"
        
        text = f"""Sveiki, {recipient_name},

Kreipiuosi, nes analizuojame privačių medicinos ir odontologijos klinikų pacientų pritraukimo srautus Lietuvoje.

Odontologijoje vieno naujo paciento vertė (implantacija, estetinis plombavimas, protezavimas) siekia nuo 500 € iki 3000 € per metus. Tačiau net 87% naujų pacientų kliniką renkasi būtent pagal „Google Maps“ žvaigždutes ir atsiliepimus.

Čia kyla didžiausias paradoksas:
Patenkinti pacientai, kuriems procedūra praėjo idealiai, skuba į darbus ir atsiliepimų beveik niekada nerašo. Tačiau jei kam nors teko palaukti 15 minučių registratūroje ar suskaudo dantis po procedūros – jie emocijų pagauti palieka 1★ viešą skundą Google. Vos vienas toks neadekvatus komentaras numuša klinikos reitingą iki 4.1★ ir atbaido dešimtis potencialių pacientų.

Sukūrėme „ReputationPro“ sistemą su fiziniu akriliniu NFC / QR stoveliu registratūrai, kuri šią problemą išsprendžia iš esmės:

1. Registratūros stovelis: Pacientui atsiskaitant po vizito, administratorė paprašo priliesti telefoną prie estetiško stovelio („Įvertinkite šiandienos vizitą“). Užtrunka vos 3 sekundes.
2. Laimingi pacientai (4–5★): Akimirksniu nukreipiami tiesiai į Jūsų oficialų „Google Maps“ profilį. Taip klinika per kelis mėnesius pasiekia 4.8–4.9★ reitingą ir dešimtis naujų 5★ atsiliepimų.
3. Pacientai su pastabomis (1–3★): Automatiškai atveriama privati forma tiesiai klinikos vadovui. Pacientas išsako problemą privačiai, o Jūs gaunate momentinį el. laišką su paciento telefonu ir komentaru. Galite perskambinti per 15 minučių ir išspręsti situaciją, o viešas 1★ skundas NIEKADA nepateks į „Google Maps“.

Paruošėme Jūsų klinikai individualų demonstracinį puslapį bei QR kodą:
👉 Jūsų demonstracinis puslapis: {preview_url}
👉 Jūsų QR kodo peržiūra: {qr_url}
👉 Aktyvuoti Jūsų paskyrą (14 d. nemokamai): {claim_url}
(Spustelėjus aktyvavimą, įmonės duomenys jau bus paruošti – tereikės nustatyti norimą slaptažodį).

Išsamus pristatymas, kainodara ir 14 d. nemokamas bandymas:
👉 https://verslomatika.lt/reputacija
(Pasirinkus Metinį planą – fizinį akrilinį NFC stovelį pagaminame ir atsiunčiame nemokamai).

Ar būtų įdomu išbandyti sistemą 14 dienų visiškai nemokamai ir gauti demonstracinį stovelį į Jūsų registratūrą?

Pagarbiai,
Tomas | Verslomatika B2B
tomas@verslomatika.lt
MB Pinet • https://verslomatika.lt
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
    .btn {{ display: inline-block; background: #5636E8; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 10px 0; }}
    .btn-green {{ display: inline-block; background: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 10px 0; }}
    .footer {{ background: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Verslomatika • ReputationPro</h2>
      <p>5★ Atsiliepimų Apsauga ir Išmanus Sulaikymas Odontologijos Klinikoms</p>
    </div>
    <div class="content">
      <p>Sveiki, <strong>{recipient_name}</strong>,</p>
      <p>Kreipiuosi, nes analizuojame privačių medicinos ir odontologijos klinikų pacientų pritraukimo srautus Lietuvoje.</p>
      
      <p>Odontologijoje vieno paciento vertė (implantacija, estetika, gydymas) siekia nuo 500 € iki 3000 € per metus. Net <strong>87% pacientų naują kliniką renkasi pagal Google Maps žvaigždutes</strong>.</p>
      
      <p>Tačiau čia kyla didžiausias paradoksas: patenkinti pacientai skuba namo ir atsiliepimų nerašo, o jei kam nors teko palaukti 15 min. registratūroje ar suskaudo po vizito – jie emocijų pagauti palieka <strong>1★ viešą skundą Google</strong>. Vienas toks komentaras numuša reitingą ir atbaido dešimtis naujų pacientų.</p>

      <div class="highlight-box">
        <h4 style="margin: 0 0 8px 0; color: #5636E8;">Kaip ReputationPro apsaugo Jūsų kliniką:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li><strong>Registratūros stovelis:</strong> estetiškas akrilinis stovelis ant stalo. Administratorė pasiūlo pacientui priliesti telefoną atsiskaitant (užtrunka 3 sek.).</li>
          <li><strong>Patenkinti pacientai (4–5★):</strong> akimirksniu nukreipiami į klinikos oficialų Google Maps profilį (klinika pasiekia 4.8–4.9★).</li>
          <li><strong>Pacientai su pastabomis (1–3★):</strong> sulaikomi privačioje formoje vadovui. Vadovas gauna momentinį el. laišką su paciento telefonu ir gali išspręsti problemą, o skundas <strong>niekada nepateks į Google</strong>.</li>
        </ul>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 22px; text-align: center; margin: 25px 0;">
        <h3 style="margin: 0 0 6px 0; color: #1e293b; font-size: 17px;">Individuali „{clinic_name}“ demonstracija ir paruoštas QR kodas:</h3>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b;">Nukreipkite telefoną į QR kodą arba išbandykite paciento kelią:</p>
        
        <a href="{preview_url}" style="display: inline-block; text-decoration: none;">
          <img src="{qr_url}" width="160" height="160" style="border-radius: 8px; border: 1px solid #cbd5e1; display: block; margin: 0 auto; background: #ffffff; padding: 8px;" alt="Klinikos QR kodas" />
        </a>
        
        <div style="margin-top: 18px;">
          <a href="{preview_url}" class="btn" style="margin-right: 8px;">Išbandyti paciento kelią ↗</a>
          <a href="{claim_url}" class="btn-green">Aktyvuoti paskyrą (14 d. nemokamai) ↗</a>
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin: 10px 0 0;">Spustelėjus aktyvavimą, klinikos duomenys jau bus užpildyti – tereikės nurodyti slaptažodį.</p>
      </div>

      <p style="font-size: 14px; color: #475569;">
        Išsamus pristatymas, kainodara (29 € / 49 € / 290 €) ir 14 d. nemokamas bandymas: <br>
        👉 <a href="https://verslomatika.lt/reputacija" style="color: #5636E8; font-weight: 600;">verslomatika.lt/reputacija</a>
      </p>

      <p style="margin-top: 25px;">Ar būtų įdomu išbandyti sistemą 14 dienų visiškai nemokamai ir gauti demonstracinį akrilinį stovelį į Jūsų registratūrą?</p>

      <p style="margin-bottom: 0;">Pagarbiai,<br>
      <strong>Tomas</strong><br>
      <span style="color: #64748b; font-size: 13px;">Verslo sprendimų vadovas | Verslomatika B2B</span></p>
    </div>
    <div class="footer">
      MB Pinet • Įm. k. 306067365 • Vilnius, Lietuva<br>
      Ryšys: <a href="mailto:tomas@verslomatika.lt" style="color: #5636E8;">tomas@verslomatika.lt</a> • <a href="https://verslomatika.lt" style="color: #5636E8;">verslomatika.lt</a>
    </div>
  </div>
</body>
</html>
"""
        return subject, text, html

    def send_dental_pitch(self, target_email: str, recipient_name: str = "Odontologijos klinikos vadovui", clinic_name: str = "Vilniaus Denta") -> bool:
        subject, text, html = self.build_dental_pitch(recipient_name, clinic_name, target_email)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Siunčiamas B2B odontologijos pasiūlymas į: {target_email}...")
        success = self.smtp.send_email(
            to_email=target_email,
            subject=subject,
            body_text=text,
            body_html=html
        )
        if success:
            self.history.append({
                "role": "assistant",
                "timestamp": datetime.now().isoformat(),
                "subject": subject,
                "body": text
            })
        return success

    def send_initial_pitch(self, target_email: str, recipient_name: str = "Memocasting Komandai") -> bool:
        subject, text, html = self.build_initial_memocasting_pitch(recipient_name)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Siunčiamas B2B laiškas į: {target_email}...")
        success = self.smtp.send_email(
            to_email=target_email,
            subject=subject,
            body_text=text,
            body_html=html
        )
        if success:
            self.history.append({
                "role": "assistant",
                "timestamp": datetime.now().isoformat(),
                "subject": subject,
                "body": text
            })
        return success

    def fetch_latest_reply(self, target_email: str) -> dict | None:
        """
        Prisijungia prie IMAP ir patikrina, ar yra naujas laiškas iš target_email.
        """
        context = ssl.create_default_context()
        try:
            with imaplib.IMAP4_SSL(self.imap_host, self.imap_port, ssl_context=context) as mail:
                mail.login(self.email_user, self.email_pass)
                mail.select("INBOX")
                
                # Ieškome laiškų nuo target_email
                status, messages = mail.search(None, f'(FROM "{target_email}")')
                if status != "OK" or not messages[0]:
                    return None
                    
                msg_ids = messages[0].split()
                latest_id = msg_ids[-1]
                
                status, data = mail.fetch(latest_id, "(RFC822)")
                raw_email = data[0][1]
                msg = email.message_from_bytes(raw_email)
                
                # Dekoduojame temą
                subject, encoding = decode_header(msg.get("Subject", ""))[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding or "utf-8", errors="ignore")
                    
                # Ištraukiame tekstą
                body = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            payload = part.get_payload(decode=True)
                            if payload:
                                body = payload.decode(part.get_content_charset() or "utf-8", errors="ignore")
                                break
                else:
                    payload = msg.get_payload(decode=True)
                    if payload:
                        body = payload.decode(msg.get_content_charset() or "utf-8", errors="ignore")
                        
                return {
                    "id": latest_id.decode(),
                    "subject": subject,
                    "from": msg.get("From"),
                    "body": body.strip()
                }
        except Exception as e:
            print(f"[IMAP Klaida] {e}")
            return None

    def generate_agent_response(self, client_message: str) -> str:
        """
        Naudoja Verslomatika B2B žinių bazę ir LLM / ekspertinį variklį atsakyti į kliento klausimus.
        """
        msg_lower = client_message.lower()
        
        # Tikriname ar turime LLM raktus
        if self.llm.openai_key or self.llm.grok_key:
            system_prompt = """Tu esi Tomas, Verslomatika (MB Pinet) vyriausiasis verslo sprendimų vadovas.
Tu bendrauji el. paštu su potencialiu klientu (Memocasting vadovu), kuris atsakė į tavo B2B pasiūlymą.
Tonas: Šiltas, pagarbus, profesionalus, konsultacinis. Atsakyk į visus klausimus (kaina, diegimas, Google taisyklės).
Parašas:
Pagarbiai,
Tomas | Verslomatika B2B
tomas@verslomatika.lt | MB Pinet • https://verslomatika.lt"""
            return self.llm.generate(
                system_prompt=system_prompt,
                user_prompt=f"Kliento atsakymas:\n{client_message}\n\nParenk profesionalų atsakymą lietuvių kalba:",
                temperature=0.6
            )
            
        # Ekspertinis kontekstinis atsakiklis (jei nėra išorinio LLM rakto)
        reasons = []
        is_clinic = any(w in msg_lower for w in ["klinik", "dant", "odontolog", "pacient", "gydytoj", "registrat", "vilniaus-denta", "denta"])
        
        # 1. Noras išbandyti / užsakyti / registruotis
        if any(w in msg_lower for w in ["išbandyt", "isbandyt", "noriu", "bandom", "registruot", "atsiųsk", "atsiusk", "tinka", "domina", "pradedam", "gerai"]):
            reasons.append(
                "Dėl sistemos išbandymo ir stovelio gavimo:\n"
                "Išbandyti galite iškart – paruošėme patogią savitarnos registraciją:\n"
                "👉 https://reputacija.verslomatika.lt/checkout\n\n"
                "• Užsiregistruoti užtruks vos 60 sekundžių.\n"
                "• Nereikia banko kortelės bandymo pradžiai (14 dienų nemokamai).\n"
                "• Pasirinkus Metinį planą (290 €), tiesiog nurodykite paštomatą ar klinikos adresą, ir pagaminsime bei išsiųsime akrilinį NFC/QR stovelį registratūrai nemokamai per 1–2 d.d."
            )

        # 2. Klausimas apie kainą
        if any(w in msg_lower for w in ["kain", "eur", "moket", "plan"]):
            reasons.append(
                "Dėl kainodaros:\n"
                "• Starter planas: 29 € / mėn. (apima 1 vietą ir Review Shield filtravimą).\n"
                "• Pro planas: 49 € / mėn. (apima pilną analitiką, momentinius alertus ir prioritetinį palaikymą).\n"
                "• Metinis planas: 290 € / metams (sutaupote 50% ir nemokamai pagaminame fizinį akrilinį NFC/QR stovelį registratūrai).\n"
                "Svarbiausia – suteikiame 14 dienų visiškai nemokamą bandymą be jokios banko kortelės:\n"
                "👉 https://reputacija.verslomatika.lt/checkout"
            )
            
        # 3. Klausimas apie stovelį registratūroje / kaip veikia pacientams
        if any(w in msg_lower for w in ["stovel", "registrat", "kaip veikia", "pacient", "nfc", "qr", "stal"]):
            reasons.append(
                "Kaip tai veikia klinikos registratūroje:\n"
                "1. Ant registratūros stalo pastatomas modernus akrilinis stovelis su integruotu NFC lustu ir QR kodu („Įvertinkite šiandienos vizitą“).\n"
                "2. Pacientui atsiskaitant už procedūrą, administratorė mandagiai paprašo priglausti telefoną arba nuskenuoti kodą (užtrunka vos 3 sekundes, jokių programėlių siųstis nereikia).\n"
                "3. Jei pacientas renkasi 4–5★ – jis vienu paspaudimu perkeliamas į klinikos „Google Maps“ puslapį palikti 5 žvaigždučių.\n"
                "4. Jei pacientas turėjo pastabų (1–3★) – atsidaro privati forma tiesiai klinikos vadovui. Pacientas išsako problemą privačiai, Jūs gaunate skubų pranešimą į el. paštą su paciento telefonu, o Google profilyje skundas NEATSERANDA."
            )

        # 4. Klausimas apie Google taisykles / blokavimą
        if any(w in msg_lower for w in ["google", "taisykl", "blokuo", "bauda", "politika", "gating"]):
            reasons.append(
                "Dėl „Google“ taisyklių ir saugumo:\n"
                "Tai itin svarbus klausimas. Mūsų sistema 100% atitinka „Google Maps“ ir BDAR reikalavimus. Mes NENAUDOJAME aklo atsiliepimų blokavimo (angl. 'review gating').\n"
                "Visiems pacientams lieka legali galimybė rašyti viešai, tačiau sąsaja sukurta pagal protingą psichologinį modelį: nepatenkintam žmogui iškart siūlomas skubus situacijos sprendimas tiesiai su vadovu. Praktiškai 95% nusivylusių pacientų pasirenka privačią formą, nes jie nori būti išklausyti ir gauti sprendimą, o ne veltis į viešus ginčus."
            )
            
        # 5. Klausimas apie pakuotes (Memocasting DIY)
        if any(w in msg_lower for w in ["dežut", "dezut", "pakuot", "siunt", "dieg", "el. parduotuv", "memocasting"]):
            reasons.append(
                "Dėl integracijos su siuntomis ir dėžutėmis:\n"
                "Tai veikia labai paprastai: paruošiame paruoštą spaudai QR kortelę, kurią galima dėti tiesiai į kiekvieną siuntos pakuotę su užrašu „Liejimo kokybės garantija“."
            )

        if not reasons:
            demo_url = "https://reputacija.verslomatika.lt/r/vilniaus-denta" if is_clinic else "https://reputacija.verslomatika.lt/r/memocasting"
            reasons.append(
                "Su malonumu atsakysiu į visus kylančius klausimus dėl sistemos veikimo.\n"
                "Galite tiesiogiai pamatyti demonstracinį kelią čia:\n"
                f"👉 {demo_url}\n\n"
                "Išsamus pristatymas ir 14 d. nemokama registracija be banko kortelės:\n"
                "👉 https://verslomatika.lt/reputacija"
            )

        body_points = "\n\n".join(reasons)
        
        reply = f"""Sveiki,

Dėkoju už atsakymą ir puikius klausimus!

{body_points}

Jei norėtumėte, galime aktyvuoti 14 dienų bandomąjį profilį Jūsų el. paštui be jokių įsipareigojimų, kad galėtumėte patys išbandyti, kaip viskas veikia praktiškai.

Ką manote?

Pagarbiai,
Tomas | Verslomatika B2B
tomas@verslomatika.lt
MB Pinet • https://verslomatika.lt
"""
        return reply

    def reply_to_client(self, to_email: str, subject: str, reply_text: str) -> bool:
        reply_subject = subject if subject.lower().startswith("re:") else f"Re: {subject}"
        return self.smtp.send_email(
            to_email=to_email,
            subject=reply_subject,
            body_text=reply_text
        )

if __name__ == "__main__":
    agent = ReputationSalesAgent()
    if len(sys.argv) > 1:
        target = sys.argv[1]
        name = sys.argv[2] if len(sys.argv) > 2 else "Memocasting Komandai"
        agent.send_initial_pitch(target, name)
    else:
        print("Naudojimas: python core/reputation_sales_agent.py <el_pastas> [gavejo_vardas]")
