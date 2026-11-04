import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from core.smtp_sender import SMTPEmailSender
from core.morning_campaign_runner import build_niche_email

sender = SMTPEmailSender()

lead_memocasting = {
    "id": "test-memocasting",
    "business_name": "Rankų Liejimo Rinkinys – Memocasting",
    "niche": "dovanos",
    "city": "Vilnius",
    "email": "memocasting.lt@gmail.com",
    "website": "https://memocasting.lt",
    "role": "Vadovui / Įkūrėjui",
    "pain_point": "atsiliepimai po pirkimo",
    "hook": "dovanų pirkėjai",
    "slug": "memocasting",
    "preview_url": "https://reputacija.verslomatika.lt/r/memocasting",
    "qr_url": "https://reputacija.verslomatika.lt/api/qr?slug=memocasting",
    "claim_url": "https://reputacija.verslomatika.lt/checkout?slug=memocasting&name=Rank%C5%B3%20Liejimo%20Rinkinys%20%E2%80%93%20Memocasting&email=memocasting.lt%40gmail.com"
}

subj, text, html = build_niche_email(lead_memocasting)

print(f"Siunčiamas testinis personalizuotas laiškas į {lead_memocasting['email']}...")
res = sender.send_email(
    to_email=lead_memocasting["email"],
    subject=subj,
    body_text=text,
    body_html=html
)
print("Išsiuntimo rezultatas:", res)
