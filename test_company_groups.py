"""Etapas N: companies with branches in outbound campaigns. Run: python test_company_groups.py"""
import datetime
import sqlite3
import sys

sys.path.insert(0, ".")
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from core.company_groups import (company_key, group_leads, order_contacts, agent_for_company, save_company, get_company,
                                 next_cascade_contact, company_state, refresh_company_status, active_thread_email, provision_company,
                                 MAX_CONTACTS_PER_COMPANY)

ok = 0
def check(cond, msg):
    global ok
    assert cond, msg
    ok += 1
    print("OK  ", msg)

def db():
    c = sqlite3.connect(":memory:")
    c.executescript("""
      CREATE TABLE clients (id TEXT PRIMARY KEY, slug TEXT UNIQUE, business_name TEXT, email TEXT UNIQUE, google_review_url TEXT, phone TEXT,
        subscription_status TEXT, is_demo INTEGER, trial_ends_at TEXT, industry TEXT, parent_id TEXT, location_label TEXT DEFAULT '');
      CREATE TABLE campaign_leads (id TEXT PRIMARY KEY, email TEXT UNIQUE, status TEXT, opened_at TEXT, clicked_at TEXT, replied_at TEXT, sent_at TEXT);
      CREATE TABLE campaign_messages (id TEXT, lead_id TEXT, step TEXT, message_id TEXT, subject TEXT, sent_at TEXT);
      CREATE TABLE campaign_suppressions (email TEXT PRIMARY KEY, reason TEXT, details TEXT);
      CREATE TABLE campaign_events (id TEXT, lead_id TEXT, event_type TEXT, details TEXT, created_at TEXT);
    """)
    return c

# 1. grouping
check(company_key({"email": "kaunas@denticija.lt"}) == company_key({"email": "vilnius@denticija.lt"}), "branches share the email domain key")
check(company_key({"email": "a@gmail.com"}) != company_key({"email": "b@gmail.com"}), "free mailboxes are never grouped")
check(company_key({"email": "x@gmail.com", "website": "https://www.melga.lt/"}) == "d:melga.lt", "website groups free-mail leads")
g = group_leads([{"email": "kaunas@denticija.lt"}, {"email": "vilnius@denticija.lt"}, {"email": "info@kita.lt"}])
check(len(g) == 2, "two companies from three leads")
check(agent_for_company("d:denticija.lt", ["agent-tomas", "agent-marius"]) == agent_for_company("d:denticija.lt", ["agent-tomas", "agent-marius"]), "stable agent per company")

# 2. primary contact
ordered = order_contacts([{"email": "kaunas@x.lt", "city": "Kaunas"}, {"email": "vilnius@x.lt", "city": "Vilnius"}, {"email": "info@x.lt", "city": "Klaipėda"}, {"email": "info@x.lt", "city": "Vilnius"}])
check([m["email"] for m in ordered] == ["info@x.lt", "vilnius@x.lt", "kaunas@x.lt"], "info@ first, then the biggest city, one email once")

# 3. provisioning: one demo account with branches
c = db()
c.execute("INSERT INTO clients VALUES ('pre-x','x','X','info@x.lt','https://g.page/r/x/review','','demo_trial',1,'2099-01-01','clinic',NULL,'')")
root = provision_company(c, {"slug": "x"}, [{"slug": "x-kaunas", "business_name": "X Kaunas", "city": "Kaunas", "email": "info@x.lt"},
                                            {"slug": "x-vilnius", "business_name": "X Vilnius", "city": "Vilnius", "email": "vilnius@x.lt"}],
                         lambda b: ("https://g.page/r/b/review", "google"))
rows = c.execute("SELECT slug, parent_id, is_demo, email FROM clients WHERE parent_id='pre-x' ORDER BY slug").fetchall()
check(len(rows) == 2 and all(r[2] == 1 for r in rows), "branches are demo profiles under the main profile")
check(rows[0][3].endswith(".invalid"), "shared info@ address becomes a placeholder on the branch")

# 4. cascade timing and limits
now = datetime.datetime(2026, 11, 16, 9, 0)  # Monday
members = [{"email": "info@x.lt", "city": "Vilnius"}, {"email": "kaunas@x.lt", "city": "Kaunas"}, {"email": "klaipeda@x.lt", "city": "Klaipėda"}, {"email": "siauliai@x.lt", "city": "Šiauliai"}]
save_company(c, "d:x.lt", "X", "agent-tomas", "pre-x", members, ["info@x.lt"])
c.execute("INSERT INTO campaign_leads (id,email,status,sent_at) VALUES ('L1','info@x.lt','sent','2026-11-13T09:00:00')")
c.execute("INSERT INTO campaign_messages VALUES ('m1','L1','E0',NULL,'s','2026-11-13T09:00:00')")  # Friday
comp = get_company(c, "d:x.lt")
check(next_cascade_contact(c, comp, now) is None, "no cascade after 1 business day")
nxt = next_cascade_contact(c, comp, datetime.datetime(2026, 11, 18, 9, 0))  # Wednesday = 3 business days
check(nxt and nxt["email"] == "kaunas@x.lt", "quiet company → next branch after 3 business days")
c.execute("UPDATE campaign_leads SET opened_at='2026-11-14' WHERE id='L1'")
check(next_cascade_contact(c, get_company(c, "d:x.lt"), datetime.datetime(2026, 11, 20, 9, 0)) is None, "engaged company → no other branch is written to")
c.execute("UPDATE campaign_leads SET opened_at=NULL WHERE id='L1'")
save_company(c, "d:x.lt", "X", "agent-tomas", "pre-x", members, ["info@x.lt", "kaunas@x.lt", "klaipeda@x.lt"])
check(len(get_company(c, "d:x.lt")["contacted"]) == MAX_CONTACTS_PER_COMPANY and next_cascade_contact(c, get_company(c, "d:x.lt"), datetime.datetime(2026, 12, 1)) is None, "at most 3 addresses per company")
check(active_thread_email(get_company(c, "d:x.lt")) == "klaipeda@x.lt", "follow-ups only to the newest contacted address")

# 5. company-level stops
c.execute("INSERT INTO campaign_suppressions VALUES ('kaunas@x.lt','opt_out','')")
comp = get_company(c, "d:x.lt")
check(company_state(c, comp)["state"] == "stopped", "opt-out from any branch stops the company")
check(refresh_company_status(c, comp) == "stopped", "stop is persisted")
c.execute("DELETE FROM campaign_suppressions")
save_company(c, "d:x.lt", "X", "agent-tomas", "pre-x", members, ["info@x.lt"])
c.execute("UPDATE campaign_leads SET status='replied', replied_at='2026-11-14' WHERE id='L1'")
check(company_state(c, get_company(c, "d:x.lt"))["state"] == "paused", "a reply pauses the company for a manual answer")
c.execute("UPDATE clients SET is_demo=0 WHERE id='pre-x'")
check(company_state(c, get_company(c, "d:x.lt"))["state"] == "converted", "activation of the company converts it")

print(f"\n{ok}/{ok} OK")
