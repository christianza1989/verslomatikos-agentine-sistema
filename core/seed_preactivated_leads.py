import json
import os
import sys
import sqlite3
import unicodedata
import re
import urllib.parse
from datetime import datetime, timedelta

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
LEADS_FILE = os.path.join(DATA_DIR, "b2b_leads_master.json")
DB_PATH = os.path.join(BASE_DIR, "apps", "reputationpro", "data", "reputation.db")

def slugify(text: str) -> str:
    text = text.lower()
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    text = re.sub(r'[^a-z0-9]+', '-', text).strip('-')
    return text[:60]

def main():
    if not os.path.exists(LEADS_FILE):
        print(f"Error: {LEADS_FILE} not found!")
        return

    with open(LEADS_FILE, "r", encoding="utf-8") as f:
        leads = json.load(f)

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    trial_end = (datetime.now() + timedelta(days=14)).isoformat()
    created_count = 0
    updated_count = 0

    used_slugs = set()
    # Read existing slugs
    cur.execute("SELECT slug FROM clients")
    for row in cur.fetchall():
        used_slugs.add(row[0])

    for lead in leads:
        b_name = lead["business_name"]
        email = lead["email"]
        city = lead.get("city", "Vilnius")

        base_slug = slugify(b_name)
        slug = base_slug
        counter = 2
        while slug in used_slugs and not lead.get("slug") == slug:
            slug = f"{base_slug}-{counter}"
            counter += 1

        lead["slug"] = slug
        used_slugs.add(slug)

        preview_url = f"https://reputacija.verslomatika.lt/r/{slug}"
        qr_url = f"https://reputacija.verslomatika.lt/api/qr?slug={slug}"
        claim_url = f"https://reputacija.verslomatika.lt/checkout?slug={slug}&name={urllib.parse.quote(b_name)}&email={urllib.parse.quote(email)}"

        lead["preview_url"] = preview_url
        lead["qr_url"] = qr_url
        lead["claim_url"] = claim_url

        google_search_url = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(b_name + ' ' + city)}"

        # Check if already exists in DB
        cur.execute("SELECT id FROM clients WHERE slug=?", (slug,))
        existing = cur.fetchone()

        if not existing:
            client_id = f"pre-{slug}"
            cur.execute("""
                INSERT INTO clients (id, slug, business_name, email, google_review_url, phone, subscription_status, is_demo, trial_ends_at)
                VALUES (?, ?, ?, ?, ?, '', 'demo_trial', 1, ?)
            """, (client_id, slug, b_name, email, google_search_url, trial_end))
            created_count += 1
        else:
            cur.execute("""
                UPDATE clients SET business_name=?, email=?, google_review_url=? WHERE slug=?
            """, (b_name, email, google_search_url, slug))
            updated_count += 1

    con.commit()
    con.close()

    with open(LEADS_FILE, "w", encoding="utf-8") as f:
        json.dump(leads, f, ensure_ascii=False, indent=2)

    print(f"✅ Sėkmingai sugeneruoti individualūs profiliai visiems {len(leads)} kontaktams!")
    print(f"📦 SQLite: sukurta naujų: {created_count}, atnaujinta esamų: {updated_count}")
    print("\nPavyzdžiai:")
    for l in leads[:3]:
        print(f" - {l['business_name']}")
        print(f"   Puslapis: {l['preview_url']}")
        print(f"   QR kodas: {l['qr_url']}")
        print(f"   Aktyvavimas: {l['claim_url']}\n")

if __name__ == "__main__":
    main()
