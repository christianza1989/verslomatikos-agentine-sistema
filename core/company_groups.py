"""Companies with several branches in outbound campaigns (ROADMAP Etapas N, 2026-11-11).

Principles
- One company = one conversation: never several emails to the same company on one day,
  only one active thread at a time.
- The first email goes to the primary contact and presents pages for ALL branches;
  the company is prepared as one demo account (main profile + branch demo profiles,
  clients.parent_id) and one activation activates every branch (src/lib/claim.ts).
- Another branch address is written to only if nobody engaged (no open/click/demo view)
  for CASCADE_BUSINESS_DAYS, at most MAX_CONTACTS_PER_COMPANY addresses.
- Activation, a reply or an opt-out from ANY address stops the whole company.

Company key: corporate email domain (not free mailbox providers), else website domain.
A matching name alone never groups companies (franchises, generic names).
"""
import datetime
import json
import re
import sqlite3
import sys
import uuid
import zlib
from typing import Dict, List, Optional

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CASCADE_BUSINESS_DAYS = 3
MAX_CONTACTS_PER_COMPANY = 3
FREE_MAIL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "hotmail.com", "outlook.com", "live.com", "icloud.com", "me.com",
    "inbox.lt", "one.lt", "zebra.lt", "takas.lt", "delfi.lt", "is.lt", "mail.ru", "yandex.ru", "yandex.com",
    "gmx.com", "gmx.net", "proton.me", "protonmail.com", "aol.com", "mail.com",
}
GENERIC_LOCALPARTS = ("info", "centras", "office", "biuras", "labas", "kontaktai", "hello", "pagalba", "administracija", "registratura")
CITY_ORDER = ["vilnius", "kaunas", "klaipėda", "klaipeda", "šiauliai", "siauliai", "panevėžys", "panevezys"]


def _domain_of_site(website: str) -> str:
    w = (website or "").strip().lower()
    w = re.sub(r"^https?://", "", w).split("/")[0].split(":")[0]
    return w[4:] if w.startswith("www.") else w


def company_key(lead: Dict) -> str:
    """'d:denticija.lt' (email domain) or 'w:denticija.lt' (website) or 'e:info@x.lt' (alone)."""
    email = (lead.get("email") or "").strip().lower()
    domain = email.split("@", 1)[1] if "@" in email else ""
    if domain and domain not in FREE_MAIL_DOMAINS:
        return f"d:{domain}"
    site = _domain_of_site(lead.get("website", ""))
    if site and site not in FREE_MAIL_DOMAINS:
        return f"d:{site}"
    return f"e:{email}"


def agent_for_company(key: str, agents: List[str]) -> str:
    """Stable split: the whole company always belongs to the same agent."""
    return agents[zlib.crc32(key.encode("utf-8")) % len(agents)] if agents else ""


def group_leads(leads: List[Dict]) -> Dict[str, List[Dict]]:
    groups: Dict[str, List[Dict]] = {}
    for lead in leads:
        groups.setdefault(company_key(lead), []).append(lead)
    return groups


def _city_rank(city: str) -> int:
    c = (city or "").strip().lower()
    return CITY_ORDER.index(c) if c in CITY_ORDER else len(CITY_ORDER)


def order_contacts(members: List[Dict]) -> List[Dict]:
    """Primary first: generic/HQ address (info@, centras@), then the biggest city, then most reviews.
    Members sharing one address are contacted once."""
    def score(m):
        local = (m.get("email") or "").split("@")[0].lower()
        generic = 0 if local in GENERIC_LOCALPARTS else 1
        return (generic, _city_rank(m.get("city", "")), -(m.get("google_reviews_count") or 0), (m.get("business_name") or ""))
    seen, ordered = set(), []
    for m in sorted(members, key=score):
        e = (m.get("email") or "").strip().lower()
        if e and e not in seen:
            seen.add(e)
            ordered.append(m)
    return ordered


def ensure_company_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS campaign_companies (
          company_key TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          agent_id TEXT,
          root_client_id TEXT,
          members TEXT NOT NULL DEFAULT '[]',      -- JSON: [{email, business_name, city, slug}]
          contacted TEXT NOT NULL DEFAULT '[]',    -- JSON: emails in the order they were written to
          status TEXT NOT NULL DEFAULT 'active',   -- active | paused | stopped | converted
          reason TEXT,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
          updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );
        """
    )
    have = {row[1] for row in conn.execute("PRAGMA table_info(campaign_leads)")}
    if have and "company_key" not in have:
        try:
            conn.execute("ALTER TABLE campaign_leads ADD COLUMN company_key TEXT")
        except sqlite3.OperationalError:
            pass


def get_company(conn: sqlite3.Connection, key: str) -> Optional[Dict]:
    ensure_company_schema(conn)
    row = conn.execute("SELECT * FROM campaign_companies WHERE company_key=?", (key,)).fetchone()
    if not row:
        return None
    cols = [d[0] for d in conn.execute("SELECT * FROM campaign_companies LIMIT 0").description]
    d = dict(zip(cols, row))
    d["members"] = json.loads(d.get("members") or "[]")
    d["contacted"] = json.loads(d.get("contacted") or "[]")
    return d


def save_company(conn: sqlite3.Connection, key: str, name: str, agent_id: str, root_client_id: str,
                 members: List[Dict], contacted: List[str], status: str = "active", reason: str = None) -> None:
    ensure_company_schema(conn)
    now = datetime.datetime.now().isoformat()
    slim = [{k: m.get(k) for k in ("email", "business_name", "city", "slug")} for m in members]
    conn.execute(
        """INSERT INTO campaign_companies (company_key, name, agent_id, root_client_id, members, contacted, status, reason, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?)
           ON CONFLICT(company_key) DO UPDATE SET name=excluded.name, agent_id=excluded.agent_id,
             root_client_id=excluded.root_client_id, members=excluded.members, contacted=excluded.contacted,
             status=excluded.status, reason=excluded.reason, updated_at=excluded.updated_at""",
        (key, name, agent_id, root_client_id, json.dumps(slim, ensure_ascii=False), json.dumps(contacted), status, reason, now))
    conn.commit()


def provision_company(conn: sqlite3.Connection, root_lead: Dict, branch_leads: List[Dict], resolve_review_url) -> Optional[Dict]:
    """Main demo profile = root_lead (already provisioned by provision_lead_in_db); each other branch
    becomes a demo profile with parent_id = root. Existing separate demo rows are linked, never
    activated rows. resolve_review_url(lead) -> (url, platform)."""
    root = conn.execute("SELECT * FROM clients WHERE slug=?", (root_lead["slug"],)).fetchone()
    if not root:
        return None
    cols = [d[0] for d in conn.execute("SELECT * FROM clients LIMIT 0").description]
    root = dict(zip(cols, root))
    for b in branch_leads:
        existing = conn.execute("SELECT id, is_demo, parent_id FROM clients WHERE slug=?", (b["slug"],)).fetchone()
        if existing:
            if existing[1] and existing[0] != root["id"] and not existing[2]:
                conn.execute("UPDATE clients SET parent_id=?, location_label=? WHERE id=? AND is_demo=1",
                             (root["id"], b.get("city") or "", existing[0]))
            continue
        url, _platform = resolve_review_url(b)
        email = (b.get("email") or "").strip().lower()
        if not email or conn.execute("SELECT 1 FROM clients WHERE email=?", (email,)).fetchone():
            email = f"filialas-{uuid.uuid4().hex[:8]}@filialai.invalid"  # shared info@ etc.
        conn.execute(
            """INSERT INTO clients (id, slug, business_name, email, google_review_url, phone, subscription_status, is_demo,
                 trial_ends_at, industry, parent_id, location_label) VALUES (?,?,?,?,?,?, 'demo_trial', 1, ?, ?, ?, ?)""",
            (f"pre-{b['slug']}", b["slug"], b.get("business_name") or root["business_name"], email, url, b.get("phone") or "",
             root.get("trial_ends_at"), root.get("industry") or "general", root["id"], b.get("city") or ""))
        if b.get("google_place_id") or b.get("google_rating"):  # harvested branch: its own Google numbers
            conn.execute("UPDATE clients SET google_place_id=?, google_rating=?, google_reviews_count=? WHERE slug=? AND is_demo=1",
                         (b.get("google_place_id"), b.get("google_rating"), b.get("google_reviews_count"), b["slug"]))
    conn.commit()
    return root


def _business_days_since(iso: str, now: datetime.datetime) -> int:
    try:
        start = datetime.datetime.fromisoformat(str(iso).replace("Z", "")).replace(tzinfo=None)
    except ValueError:
        return 0
    days, d = 0, start.date()
    while d < now.date():
        d += datetime.timedelta(days=1)
        if d.weekday() < 5:
            days += 1
    return days


def company_state(conn: sqlite3.Connection, company: Dict) -> Dict:
    """Live state from the funnel: converted / stopped (opt-out) / paused (reply) / engaged / quiet.
    last_contact_at = newest message (first emails, follow-ups, cascade) to any address of the company."""
    emails = company["contacted"]
    root = conn.execute("SELECT is_demo FROM clients WHERE id=?", (company.get("root_client_id"),)).fetchone()
    if root is not None and not root[0]:
        return {"state": "converted", "last_contact_at": None}
    marks = ",".join("?" * len(emails)) or "''"
    supp = conn.execute(f"SELECT reason FROM campaign_suppressions WHERE email IN ({marks})", emails).fetchall()
    if any(r[0] == "opt_out" for r in supp):
        return {"state": "stopped", "last_contact_at": None}
    leads = conn.execute(f"SELECT id, status, opened_at, clicked_at, replied_at FROM campaign_leads WHERE email IN ({marks})", emails).fetchall()
    if any(r[1] == "replied" or r[4] for r in leads):
        return {"state": "paused", "last_contact_at": None}
    ids = [r[0] for r in leads]
    last = None
    if ids:
        marks_i = ",".join("?" * len(ids))
        last = conn.execute(f"SELECT MAX(sent_at) FROM campaign_messages WHERE lead_id IN ({marks_i})", ids).fetchone()[0]
        demo_view = conn.execute(f"SELECT 1 FROM campaign_events WHERE lead_id IN ({marks_i}) AND event_type='click' LIMIT 1", ids).fetchone()
    else:
        demo_view = None
    engaged = any(r[2] or r[3] for r in leads) or bool(demo_view)
    return {"state": "engaged" if engaged else "quiet", "last_contact_at": last}


def next_cascade_contact(conn: sqlite3.Connection, company: Dict, now: datetime.datetime) -> Optional[Dict]:
    """The next branch address to write to, or None. Only when the company is quiet (no open, click,
    demo view, reply) for CASCADE_BUSINESS_DAYS since the last message, max MAX_CONTACTS_PER_COMPANY."""
    if company.get("status") != "active" or len(company["contacted"]) >= MAX_CONTACTS_PER_COMPANY:
        return None
    st = company_state(conn, company)
    if st["state"] != "quiet" or not st["last_contact_at"]:
        return None
    if _business_days_since(st["last_contact_at"], now) < CASCADE_BUSINESS_DAYS:
        return None
    for m in order_contacts(company["members"]):
        e = (m.get("email") or "").lower()
        if e and e not in company["contacted"] and not conn.execute("SELECT 1 FROM campaign_suppressions WHERE email=?", (e,)).fetchone():
            return m
    return None


def refresh_company_status(conn: sqlite3.Connection, company: Dict) -> str:
    """Persist converted / stopped / paused so the owner panel and follow-ups see it."""
    st = company_state(conn, company)["state"]
    new = {"converted": "converted", "stopped": "stopped", "paused": "paused"}.get(st, company["status"])
    if new != company["status"] and company["status"] != "stopped":
        conn.execute("UPDATE campaign_companies SET status=?, reason=?, updated_at=? WHERE company_key=?",
                     (new, st, datetime.datetime.now().isoformat(), company["company_key"]))
        conn.commit()
        company["status"] = new
    return company["status"]


def active_thread_email(company: Dict) -> Optional[str]:
    """Follow-ups go only to the newest contacted address of an active company."""
    return company["contacted"][-1] if company.get("status") == "active" and company["contacted"] else None


def backfill_companies(conn: sqlite3.Connection, agent_profiles: List[Dict]) -> int:
    """Companies written to before Etapas N get a campaign_companies row (contacted = addresses already
    sent), so their other branches are never treated as new companies. No new members are added:
    legacy companies get no cascade emails."""
    ensure_company_schema(conn)
    rows = conn.execute("""SELECT email, business_name, city, slug, website, sent_at, company_key FROM campaign_leads
                           WHERE sent_at IS NOT NULL ORDER BY sent_at""").fetchall()
    groups: Dict[str, List] = {}
    for r in rows:
        lead = {"email": r[0], "business_name": r[1], "city": r[2], "slug": r[3], "website": r[4]}
        if (r[0] or "").endswith(".invalid"):
            continue
        if r[6] and get_company(conn, r[6]):
            continue  # already one conversation (2026-11-12: a gmail lead got a 2nd company under "e:" key)
        groups.setdefault(company_key(lead), []).append(lead)
    agents = [a["agent_id"] for a in agent_profiles if a.get("is_active")]
    added = 0
    for key, members in groups.items():
        if get_company(conn, key):
            continue
        root = conn.execute("SELECT id FROM clients WHERE slug=?", (members[0]["slug"],)).fetchone()
        save_company(conn, key, members[0]["business_name"], agent_for_company(key, agents), root[0] if root else None,
                     members, [m["email"].lower() for m in members])
        conn.execute("UPDATE campaign_leads SET company_key=? WHERE email IN (%s)" % ",".join("?" * len(members)), [key] + [m["email"] for m in members])
        added += 1
    conn.commit()
    return added
