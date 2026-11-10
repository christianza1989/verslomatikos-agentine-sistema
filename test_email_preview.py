"""Laiško peržiūra be siuntimo (ROADMAP C1). Paleidimas: python test_email_preview.py"""
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from core.dental_lead_pool import get_uncontacted_dental_leads
from core.morning_campaign_runner import build_tracked_email, APP_BASE

leads = get_uncontacted_dental_leads(5)
print(f"Sample leads loaded: {len(leads)}")
lead = leads[0]
demo_url = f"{APP_BASE}/r/{lead['slug']}?k=PERZIURA"
subj, text, html = build_tracked_email(lead, "preview-lead-123", demo_url, {"rating": 4.6, "count": 87})

print("\n=== EMAIL SUBJECT ===")
print(subj)
print("\n=== TEXT VERSION ===")
print(text)

checks = {
    "Vienas CTA per sekimo nuorodą": html.count("/api/track/click?") == 1,
    "CTA veda į asmeninį demo su tokenu": "%2Fr%2F" in html and "k%3DPERZIURA" in html,
    "Sekimas per aplikacijos domeną": f"{APP_BASE}/api/track/open?id=" in html,
    "Nėra el. pašto URL'e": lead["email"] not in html.split("mailto:")[0],
    "Nėra senų pažadų (100% / NIEKADA)": "100%" not in text and "NIEKADA" not in text,
    "Taisyklingas kreipinys": text.startswith("Laba diena,"),
    "Atsisakymo galimybė": "atsakykite „ne“" in text,
    "Įmonės pavadinimas": lead["business_name"] in text,
}
print("\n=== CHECKS ===")
for name, ok in checks.items():
    print(("OK   " if ok else "FAIL ") + name)
sys.exit(0 if all(checks.values()) else 1)
