import datetime
import urllib.parse
from core.smtp_sender import SMTPEmailSender

def main():
    to_email = "mrchristian90210@gmail.com"
    b_name = "Baldų turgus"
    slug = "baldu-turgus"
    lead_id = f"lead-{slug}"
    
    # Tikrasis tiesioginis Google Place ID atsiliepimo modalo adresas
    direct_review_url = "https://search.google.com/local/writereview?placeid=ChIJdRDmwEGV3UYRnKIblCzu0as"
    
    # Demonstracinio puslapio adresas SU perduodama tiesiogine Google review nuoroda
    demo_page_url = f"https://verslomatika.lt/r/{slug}?google_review_url={urllib.parse.quote(direct_review_url)}"
    lead_query = f"slug={urllib.parse.quote(slug)}&name={urllib.parse.quote(b_name)}&email={urllib.parse.quote(to_email)}&google_review_url={urllib.parse.quote(direct_review_url)}"
    pricing_page_url = f"https://verslomatika.lt/reputacija?{lead_query}#kainos"
    
    # 100% 24/7 Cloudflare Edge Išmanusis Nukreipimas su paspaudimų sekimu
    smart_demo_url = f"https://verslomatika.lt/api/track/click?id={lead_id}&to={urllib.parse.quote(demo_page_url)}"
    smart_pricing_url = f"https://verslomatika.lt/api/track/click?id={lead_id}&to={urllib.parse.quote(pricing_page_url)}"
    track_open_url = f"https://verslomatika.lt/api/track/open?id={lead_id}"

    subject = "Idėja Baldų turgui: kaip apsaugoti ir pakelti Google reitingą (Vilnius, Kaunas ir el. parduotuvė)"

    body_text = f"""Sveiki, „Baldų turgaus“ komanda ir vadovai,

Stebime Jūsų veiklą – didžiulės ekspozicijos Vilniuje (Sodybų g.) bei Kauno LEZ ir patogus baldų pirkimas iš sandėlio vietoje pritraukia tūkstančius pirkėjų, ieškančių geros kainos ir greito rezultato.

Tačiau didelių gabaritų baldų prekyboje egzistuoja viena brangiausių rizikų reputacijai: kai pirkėjas namuose išpakuoja baldą ir pastebi transportavimo metu apdaužytą kampą, trūkstamą varžtą ar nesupranta surinkimo schemos – emocijų apimtas jis dažnai parašo 1★ skundą „Google Maps“ arba atsiliepimai.lt. Tuo tarpu patenkinti pirkėjai viešo atsiliepimo beveik niekada nepalieka.

Šiuo metu Jūsų reitingas siekia apie 4.3★. Pakėlimas iki 4.8★ suteiktų triuškinantį pranašumą prieš konkurentus (JYSK, Senukus ar Baldai1).

Kaip ReputationPro veikia Jūsų salonuose ir el. parduotuvėje:
• Fiziniuose salonuose ir sandėliuose: prie kasų ar atsiėmimo rampos pastatomas estetiškas QR stovelis arba po apsipirkimo išsiunčiama trumpoji padėkos SMS/nuoroda.
• El. parduotuvėje (balduturgus.lt): po kurjerio pristatymo pirkėjas gauna asmeninę vertinimo nuorodą.
• 5★ pirkėjai: per 3 sekundes nukreipiami į oficialų Google profilį kelti reitingo.
• 1–3★ pirkėjai: nukreipiami į privačią formą tiesiai kokybės vadovui. Išsprendžiate situaciją asmeniškai, o skundas niekada nepateks į viešumą.

Individuali „Baldų turgus“ demonstracija:
Išbandykite, kaip pirkėjas mato atsiliepimų formą telefone ar kompiuteryje:
👉 {smart_demo_url}

Išsamus pristatymas ir skaidri kainodara (29 € / 49 € / 290 €):
👉 {smart_pricing_url}

Pagarbiai,
Tomas
Verslo sprendimų vadovas | Verslomatika B2B
MB Pinet • Įm. k. 306067365 • Vilnius, Lietuva
Ryšys: tomas@verslomatika.lt • verslomatika.lt
Norėdami atsisakyti pasiūlymų, atsakykite „Atsisakau“.
"""

    body_html = f"""<!DOCTYPE html>
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
    .btn-primary {{ display: inline-block; background: #5636E8; color: #ffffff !important; text-decoration: none; padding: 13px 26px; border-radius: 8px; font-weight: 700; font-size: 14px; margin: 5px; }}
    .btn-green {{ display: inline-block; background: #157a57; color: #ffffff !important; text-decoration: none; padding: 13px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; margin: 5px; }}
    .footer {{ background: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Verslomatika • ReputationPro</h2>
      <p>5★ Atsiliepimų Apsauga ir Augimas Baldų Prekybai ir E-komercijai</p>
    </div>
    <div class="content">
      <p>Sveiki, <strong>„Baldų turgaus“ komanda ir vadovai</strong>,</p>
      
      <p>Stebime Jūsų veiklą – didžiulės ekspozicijos Vilniuje (Sodybų g.) bei Kauno LEZ ir patogus baldų pirkimas iš sandėlio vietoje pritraukia tūkstančius pirkėjų, ieškančių geros kainos ir greito rezultato.</p>
      
      <p>Tačiau didelių gabaritų baldų prekyboje egzistuoja viena brangiausių rizikų reputacijai: kai pirkėjas namuose išpakuoja baldą ir pastebi transportavimo metu apdaužytą kampą, trūkstamą varžtą ar nesupranta surinkimo schemos – emocijų apimtas jis dažnai parašo 1★ skundą „Google Maps“ arba atsiliepimai.lt. Tuo tarpu patenkinti pirkėjai viešo atsiliepimo beveik niekada nepalieka.</p>
      
      <p>Šiuo metu Jūsų reitingas siekia apie 4.3★. Pakėlimas iki 4.8★ suteiktų triuškinantį pranašumą prieš konkurentus (JYSK, Senukus ar Baldai1).</p>

      <div class="highlight-box">
        <h4 style="margin: 0 0 8px 0; color: #5636E8;">Kaip ReputationPro veikia Jūsų salonuose ir el. parduotuvėje:</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 13.5px;">
          <li><strong>Fiziniuose salonuose ir sandėliuose:</strong> prie kasų ar atsiėmimo rampos pastatomas estetiškas QR stovelis arba po apsipirkimo išsiunčiama trumpoji padėkos SMS/nuoroda.</li>
          <li><strong>El. parduotuvėje (balduturgus.lt):</strong> po kurjerio pristatymo pirkėjas gauna asmeninę vertinimo nuorodą.</li>
          <li><strong>5★ pirkėjai:</strong> per 3 sekundes nukreipiami į oficialų Google profilį kelti reitingo.</li>
          <li><strong>1–3★ pirkėjai:</strong> nukreipiami į privačią formą tiesiai kokybės vadovui. Išsprendžiate situaciją asmeniškai, o skundas niekada nepateks į viešumą.</li>
        </ul>
      </div>

      <div class="card-preview">
        <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px;">Individuali „Baldų turgus“ demonstracija:</h3>
        <p style="margin: 0 0 16px 0; font-size: 13.5px; color: #64748b;">Išbandykite, kaip pirkėjas mato atsiliepimų formą telefone ar kompiuteryje:</p>
        
        <div style="margin: 20px 0;">
          <a href="{smart_demo_url}" class="btn-primary" target="_blank">Išbandyti pirkėjo kelią ↗</a>
        </div>
        <div style="margin: 10px 0;">
          <a href="{smart_pricing_url}" class="btn-green" target="_blank">Apie sprendimą ir kainas (14 d. nemokamai) ↗</a>
        </div>
        <p style="font-size: 11px; color: #94a3b8; margin: 12px 0 0;">Spustelėjus atsidarys demonstracinis puslapis su 5 žvaigždutėmis. Įvertinus 4–5★ – tiesioginis Google langas.</p>
      </div>

      <p style="font-size: 13px; color: #475569;">
        Išsamus pristatymas ir skaidri kainodara (29 € / 49 € / 290 €): <br>
        👉 <a href="{smart_pricing_url}" style="color: #5636E8; font-weight: 600;">verslomatika.lt/reputacija</a>
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
  <img src="{track_open_url}" width="1" height="1" style="display:none !important;" alt="" />
</body>
</html>
"""

    print("Siunčiamas tikslus demonstracinis laiškas su integruotu 5★ nukreipimu...")
    sender = SMTPEmailSender()
    success = sender.send_email(to_email=to_email, subject=subject, body_text=body_text, body_html=body_html)
    if success:
        print("✅ SUCCESS: Laiškas sėkmingai išsiųstas į mrchristian90210@gmail.com!")
    else:
        print("❌ ERROR: Nepavyko išsiųsti.")

if __name__ == "__main__":
    main()
