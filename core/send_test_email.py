import os
import sys
from datetime import datetime
from core.smtp_sender import SMTPEmailSender

# UTF-8 terminale
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def send_b2b_outreach_test(recipient_email: str, recipient_name: str = "Gydytojau / Klinikos Vadove"):
    sender = SMTPEmailSender()
    
    subject = "Kaip Vilniaus odontologijos klinikos apsaugo 5.0★ Google reitingą registratūroje"
    
    text_content = f"""Sveiki, {recipient_name},

Pastebėjome, kad pacientai vis dažniau renkasi odontologijos kliniką remdamiesi būtent Google Maps atsiliepimais ir reitingu. Vienas neigiamas 1★ atsiliepimas gali atbaidyti dešimtis potencialių pacientų, kurių krepšelis siekia 500 € – 2 000 €.

Norime Jums pristatyti ReputationPro sistemą, pritaikytą Lietuvos klinikoms:
1. Registratūroje pacientas telefonu nuskaito estetišką QR stovelį (užtrunka vos 3 sekundes).
2. Patenkinti pacientai nukreipiami tiesiai į viešą Google Maps profilį (5★).
3. Jei pacientas turi pastabą ar nusiskundimą (1–3★), sistema pasiūlo privačią formą tiesiogiai klinikos vadovui. Tai leidžia išspręsti situaciją privačiai, o skundas NIEKADA nepatenka į viešą erdvę.

Gyva demonstracinė Verslomatika atsiliepimų anketa:
https://reputacija.verslomatika.lt/r/verslomatika

Išsamus pristatymas ir galimybė išbandyti 14 dienų nemokamai:
https://verslomatika.lt/reputacija

Jei norėtumėte gauti nemokamą testinį akrilinį QR stovelį savo registratūrai – tiesiog atsakykite į šį laišką.

Pagarbiai,
Tomas | Verslomatika B2B
tomas@verslomatika.lt
MB Pinet • https://verslomatika.lt
"""

    html_content = f"""<!DOCTYPE html>
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
      <p>5★ Atsiliepimų Apsaugos ir Augimo Sistema Registratūroje</p>
    </div>
    <div class="content">
      <p>Sveiki, <strong>{recipient_name}</strong>,</p>
      <p>Pastebėjome, kad pacientai vis dažniau renkasi odontologijos kliniką remdamiesi būtent <strong>Google Maps</strong> atsiliepimais. Vienas neigiamas 1★ skundas gali atbaidyti dešimtis naujų pacientų, o reitingo atstatymas užtrunka mėnesius.</p>
      
      <div class="highlight-box">
        <h4 style="margin: 0 0 8px 0; color: #5636E8;">Kaip ReputationPro apsaugo Jūsų kliniką:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li><strong>Patenkinti pacientai (5★):</strong> akimirksniu nukreipiami į Google Maps profilį.</li>
          <li><strong>Nusivylę pacientai (1–3★):</strong> patenka į privačią formą tiesiai klinikos vadovui. Problema išsprendžiama konfidencialiai – skundas <strong>niekada nepateks į viešumą</strong>.</li>
          <li><strong>QR stovelis registratūroje:</strong> veikia per 3 sekundes be jokių programėlių diegimo.</li>
        </ul>
      </div>

      <p style="text-align: center; margin: 25px 0;">
        <a href="https://reputacija.verslomatika.lt/r/verslomatika" class="btn">Išbandyti demonstracinį Verslomatika kelią ↗</a>
      </p>

      <p style="font-size: 14px; color: #475569;">
        Detalus pristatymas, kainodara (29 € / 49 € / 290 €) ir 14 d. nemokamas bandymas: <br>
        👉 <a href="https://verslomatika.lt/reputacija" style="color: #5636E8; font-weight: 600;">verslomatika.lt/reputacija</a>
      </p>

      <p style="margin-top: 25px;">Jei norėtumėte gauti nemokamą testinį QR stovelį registratūrai – tiesiog atsakykite į šį laišką.</p>

      <p style="margin-bottom: 0;">Pagarbiai,<br>
      <strong>Tomas</strong><br>
      <span style="color: #64748b; font-size: 13px;">Verslo sprendimų vadovas | Verslomatika B2B</span></p>
    </div>
    <div class="footer">
      MB Pinet • Įm. k. 306067365 • Vilnius, Lietuva<br>
      Ryšys: <a href="mailto:tomas@verslomatika.lt" style="color: #5636E8;">tomas@verslomatika.lt</a> • <a href="https://verslomatika.lt" style="color: #5636E8;">verslomatika.lt</a><br>
      Gavote šį pranešimą kaip bandomąjį B2B pasiūlymą. Norėdami atsisakyti, tiesiog atsakykite „Atsisakau“.
    </div>
  </div>
</body>
</html>
"""

    print(f"Siunčiamas testinis B2B laiškas gavėjui: {recipient_email}...")
    success = sender.send_email(
        to_email=recipient_email,
        subject=subject,
        body_text=text_content,
        body_html=html_content
    )
    return success

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = sys.argv[1]
        name = sys.argv[2] if len(sys.argv) > 2 else "Testuotojau"
        send_b2b_outreach_test(target, name)
    else:
        print("Naudojimas: python core/send_test_email.py <el_pastas> [gavejo_vardas]")
