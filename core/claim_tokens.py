"""Claim tokens and campaign suppressions shared with the ReputationPro Next.js app.

Mirror of apps/reputationpro/src/lib/claim.ts and the schema in src/lib/db.ts.
Keep both sides in sync (see ROADMAP_REPUTATIONPRO.md, section 4 "gotchas").

- A claim token is a random URL-safe string. Only sha256(token) is stored.
- The raw token travels only inside the outbound email link:
      https://verslomatika.lt/r/{slug}?k={token}   (owner demo with personal CTA)
      https://verslomatika.lt/aktyvuoti/{token}    (1-step activation)
- campaign_suppressions(email, reason): never email these addresses again
  (reason: 'opt_out', 'needs_review', 'bounced', 'client').
"""
import hashlib
import secrets
import sqlite3
import sys
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CLAIM_TTL_MS = 30 * 86400 * 1000

# Same list as CLIENT_COLUMNS in apps/reputationpro/src/lib/db.ts
CLIENT_COLUMNS = [
    ("show_public_link_low", "INTEGER NOT NULL DEFAULT 0"),
    ("industry", "TEXT NOT NULL DEFAULT 'general'"),
    ("google_place_id", "TEXT"),
    ("google_rating", "REAL"),
    ("google_reviews_count", "INTEGER"),
]


def ensure_schema(conn: sqlite3.Connection) -> None:
    """Idempotent: safe to call on every run, from Python or before the app has started."""
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS claim_tokens (
          token_hash TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id),
          expires_at INTEGER NOT NULL, used_at INTEGER, created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS claim_tokens_client ON claim_tokens(client_id);
        CREATE TABLE IF NOT EXISTS campaign_suppressions (
          email TEXT PRIMARY KEY, reason TEXT NOT NULL, details TEXT,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );
        -- Every outbound campaign message: step E0 = first email, B1/H1/H2/F = follow-ups
        -- (core/followup_runner.py). message_id/subject keep follow-ups in the same thread.
        CREATE TABLE IF NOT EXISTS campaign_messages (
          id TEXT PRIMARY KEY, lead_id TEXT NOT NULL, step TEXT NOT NULL,
          message_id TEXT, subject TEXT, sent_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS campaign_messages_lead ON campaign_messages(lead_id, step);
        """
    )
    have = {row[1] for row in conn.execute("PRAGMA table_info(clients)")}
    if not have:
        return  # clients table is created by the Next.js app on first start
    for name, definition in CLIENT_COLUMNS:
        if name in have:
            continue
        try:
            conn.execute(f"ALTER TABLE clients ADD COLUMN {name} {definition}")
        except sqlite3.OperationalError as e:
            if "duplicate column" not in str(e).lower():
                raise
    conn.commit()


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def issue_claim_token(conn: sqlite3.Connection, client_id: str, ttl_ms: int = CLAIM_TTL_MS) -> str:
    token = secrets.token_urlsafe(24)
    now = int(time.time() * 1000)
    conn.execute(
        "INSERT INTO claim_tokens(token_hash, client_id, expires_at, created_at) VALUES (?,?,?,?)",
        (_hash(token), client_id, now + ttl_ms, now),
    )
    conn.commit()
    return token


def is_suppressed(conn: sqlite3.Connection, email: str) -> bool:
    row = conn.execute("SELECT 1 FROM campaign_suppressions WHERE email=?", (email.strip().lower(),)).fetchone()
    return row is not None


def suppress(conn: sqlite3.Connection, email: str, reason: str, details: str = "") -> None:
    conn.execute(
        """INSERT INTO campaign_suppressions(email, reason, details) VALUES (?,?,?)
           ON CONFLICT(email) DO UPDATE SET reason=excluded.reason, details=excluded.details""",
        (email.strip().lower(), reason, details),
    )
    conn.commit()


def record_message(conn: sqlite3.Connection, lead_id: str, step: str, message_id: str, subject: str) -> None:
    import datetime
    import uuid

    conn.execute(
        "INSERT INTO campaign_messages(id, lead_id, step, message_id, subject, sent_at) VALUES (?,?,?,?,?,?)",
        (str(uuid.uuid4()), lead_id, step, message_id, subject, datetime.datetime.now().isoformat()),
    )
    conn.commit()


def count_sent_today(conn: sqlite3.Connection) -> int:
    """First emails (campaign_leads.sent_at) + follow-ups today. One shared daily cap protects the mailbox."""
    import datetime

    today = datetime.datetime.now().strftime("%Y-%m-%d")
    first = conn.execute("SELECT COUNT(*) FROM campaign_leads WHERE sent_at LIKE ?", (f"{today}%",)).fetchone()[0]
    try:
        follow = conn.execute("SELECT COUNT(*) FROM campaign_messages WHERE step != 'E0' AND sent_at LIKE ?", (f"{today}%",)).fetchone()[0]
    except sqlite3.OperationalError:
        follow = 0
    return first + follow


def is_direct_review_url(url: str) -> bool:
    """Mirror of isDirectReviewUrl() in src/lib/validation.ts."""
    from urllib.parse import urlparse, parse_qs

    try:
        u = urlparse(url or "")
    except ValueError:
        return False
    if u.hostname == "search.google.com" and u.path == "/local/writereview":
        return bool(parse_qs(u.query).get("placeid"))
    if u.hostname == "g.page":
        parts = [p for p in u.path.split("/") if p]
        return len(parts) == 3 and parts[0] == "r" and parts[2] == "review"
    return False
