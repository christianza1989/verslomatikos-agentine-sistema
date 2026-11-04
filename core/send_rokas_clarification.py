import sys
import os
import sqlite3
import uuid
from datetime import datetime

BASE_DIR = 'C:/Users/Lenovo/Documents/Agentai'
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from core.smtp_sender import SMTPEmailSender

to_email = 'rokas.guzauskas@gmail.com'
subject = 'Re: Idėja „ProMedical“: kaip apsaugoti nepriekaištingą B2B reputaciją ir partnerių atsiliepimus po įrangos pristatymo'

body_text = """Sveiki, Rokai,

Atsiprašau – testuojant naują registratūros auto-atsakiklį, sistema Jums automatiškai išsiuntė klinikoms pritaikytą pavyzdį.

B2B medicinos įrangos tiekėjams kaip „ProMedical“ sistema veikia kur kas paprasčiau ir diskretiškiau:

Po įrangos ar procedūrinių vežimėlių pristatymo bei montavimo ligoninės ar klinikos atstovui pateikiama patogi skaitmeninė forma arba elegantiška QR kortelė priėmimo-perdavimo akte:
1. Patenkinti pirkėjai ir skyrių vedėjai (4–5★) vienu paspaudimu nukreipiami palikti viešą 5★ rekomendaciją Jūsų „ProMedical“ Google ar Rekvizitai profiliui.
2. Jei partneris turėjo menkiausių pastabų dėl komplektacijos ar pristatymo (1–3★) – sistema atveria privačią formą tiesiai Jums. Jūs sužinote apie situaciją per kelias minutes ir galite asmeniškai ją išspręsti, o viešas 1★ skundas niekada neatsiranda internete.

Dėl paslaugų kainodaros:
• Starter planas: 29 € / mėn. (apima 1 prekinį ženklą / profilį ir Review Shield privačią formą).
• Pro planas: 49 € / mėn. (rekomenduojamas – su momentiniais pranešimais vadovui, pilna analitika ir prioritetiniu palaikymu).
• Metinis planas: 290 € / metams (sutaupote 50% ir nemokamai pagaminame fizinį akrilinį NFC/QR stovelį ar kortelių rinkinį biurui/priėmimui).

Svarbiausia – suteikiame 14 dienų visiškai nemokamą bandomąjį laikotarpį be jokios banko kortelės:
👉 https://reputacija.verslomatika.lt/checkout

Ar tiktų trumpas 10 min. pokalbis rytoj iš ryto (pvz., 10:00 ar 11:30), kad trumpai parodyčiau, kaip tai pritaikyti prie Jūsų tiekimo srautų?

Pagarbiai,
Tomas | Verslo sprendimų vadovas
tomas@verslomatika.lt
MB Pinet • https://verslomatika.lt
"""

body_html = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #5636E8; padding: 20px 25px; color: #ffffff; }
    .header h2 { margin: 0; font-size: 18px; font-weight: 700; }
    .content { padding: 25px 30px; font-size: 14.5px; }
    .highlight-box { background: #f5f3ff; border-left: 4px solid #5636E8; padding: 14px 18px; border-radius: 6px; margin: 18px 0; font-size: 14px; }
    .pricing-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 18px 0; }
    .btn { display: inline-block; background: #5636E8; color: #ffffff !important; text-decoration: none; padding: 11px 22px; border-radius: 7px; font-weight: 600; font-size: 14px; margin: 10px 0; }
    .footer { background: #f8fafc; padding: 16px 25px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Verslomatika • ReputationPro</h2>
    </div>
    <div class="content">
      <p>Sveiki, <strong>Rokai</strong>,</p>
      <p>Atsiprašau – testuojant naują registratūros auto-atsakiklį, sistema Jums automatiškai išsiuntė klinikoms pritaikytą pavyzdį.</p>
      <p>B2B medicinos įrangos tiekėjams kaip <strong>„ProMedical“</strong> sistema veikia kur kas paprasčiau ir diskretiškiau:</p>
      
      <div class="highlight-box">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #4338ca;">Po įrangos ar procedūrinių vežimėlių pristatymo/montavimo:</p>
        <ul style="margin: 0; padding-left: 18px;">
          <li><strong>Patenkinti pirkėjai ir skyrių vedėjai (4–5★):</strong> vienu paspaudimu nukreipiami palikti viešą 5★ rekomendaciją Jūsų oficialiam Google Maps profiliui.</li>
          <li><strong>Kilus pastaboms dėl komplektacijos ar pristatymo (1–3★):</strong> sistema atveria privačią formą tiesiai Jums. Sužinote per kelias minutes ir išsprendžiate asmeniškai, o 1★ skundas <strong>niekada nepateks į internetą</strong>.</li>
        </ul>
      </div>

      <div class="pricing-box">
        <h4 style="margin: 0 0 10px 0; color: #0f172a;">Dėl paslaugų kainodaros:</h4>
        <ul style="margin: 0; padding-left: 18px;">
          <li><strong>Starter planas:</strong> 29 € / mėn. (apima 1 profilį ir Review Shield privačią formą).</li>
          <li><strong>Pro planas:</strong> 49 € / mėn. (rekomenduojamas – su momentiniais alertais vadovui ir pilna analitika).</li>
          <li><strong>Metinis planas:</strong> 290 € / metams (sutaupote 50% ir nemokamai pagaminame fizinį akrilinį NFC/QR sprendimą priėmimui).</li>
        </ul>
      </div>

      <p style="text-align: center; margin: 20px 0;">
        <a href="https://reputacija.verslomatika.lt/checkout" class="btn">Išbandyti 14 dienų nemokamai ↗</a>
      </p>

      <p>Ar tiktų trumpas 10 min. pokalbis rytoj iš ryto (pvz., 10:00 ar 11:30), kad trumpai parodyčiau, kaip tai pritaikyti prie Jūsų tiekimo srautų?</p>

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

if __name__ == '__main__':
    sender = SMTPEmailSender()
    success = sender.send_email(to_email, subject, body_text, body_html)
    if success:
        print("[SUCCESS] Clarifying email sent to Rokas Gužauskas.")
        db_path = 'C:/Users/Lenovo/Documents/Agentai/apps/reputationpro/data/reputation.db'
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("INSERT INTO campaign_events (id, lead_id, event_type, details) VALUES (?, ?, 'reply', ?)",
                    (str(uuid.uuid4()), 'lead_promedical_rokas', 'Išsiųstas patikslinantis B2B laiškas dėl kainų ir įrangos logistikos'))
        conn.commit()
        conn.close()
        print("[SUCCESS] Event logged in reputation.db.")
    else:
        print("[FAILED] Could not send email.")
