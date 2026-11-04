import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from core.morning_campaign_runner import load_leads, build_niche_email

leads = load_leads()
print(f"Total leads: {len(leads)}")
first_lead = leads[0]
subj, text, html = build_niche_email(first_lead)

print("\n=== EMAIL SUBJECT ===")
print(subj)

print("\n=== TEXT VERSION ===")
print(text)

print("\n=== HTML CHECKS ===")
print("Contains QR Image:", "img src=\"https://reputacija.verslomatika.lt/api/qr" in html)
print("Contains Preview Link:", first_lead["preview_url"] in html)
print("Contains Claim Link:", first_lead["claim_url"] in html)
print("Contains Business Name:", first_lead["business_name"] in html)
