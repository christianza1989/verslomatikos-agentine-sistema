"""Temų A/B/C variantai (ROADMAP C5): stabilus parinkimas ir įrašymas į campaign_messages.variant.

Paleidimas: python test_subject_variants.py   (naudoja laikiną DB, gyvos DB neliečia)
"""
import os
import sqlite3
import sys
import tempfile
import uuid
from collections import Counter

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from core.claim_tokens import ensure_schema, record_message
from core.morning_campaign_runner import build_tracked_email, subject_variant, SUBJECT_VARIANTS

checks = {}

# 1. Stabilumas: tas pats lead_id -> ta pati raidė, kiekvieną kartą.
ids = [str(uuid.uuid4()) for _ in range(600)]
checks["Tas pats lead_id visada duoda tą patį variantą"] = all(subject_variant(i) == subject_variant(i) for i in ids)
checks["Žinoma reikšmė nesikeičia tarp paleidimų (crc32)"] = subject_variant("lead-123") == SUBJECT_VARIANTS[__import__("zlib").crc32(b"lead-123") % 3]
dist = Counter(subject_variant(i) for i in ids)
checks[f"Pasiskirstymas tolygus ({dict(dist)})"] = all(150 <= dist[v] <= 250 for v in SUBJECT_VARIANTS)

lead = {"business_name": "Vilniaus Denta", "slug": "vilniaus-denta", "industry": "clinic", "email": "x@example.test"}
lid = "lead-abc"
s1, _, _, v1 = build_tracked_email(lead, lid, None, {"rating": 4.6, "count": 87}, return_variant=True)
s2, _, _, v2 = build_tracked_email(lead, lid, None, {"rating": 4.6, "count": 87}, return_variant=True)
checks["build_tracked_email: tema ir žymė stabilios"] = s1 == s2 and v1 == v2 and v1 == f"google_stats:{subject_variant(lid)}"

# 2. Įrašymas į DB (laikina DB su sena schema be variant stulpelio -> ALTER idempotentiškas).
tmp = tempfile.mkdtemp()
path = os.path.join(tmp, "t.db")
conn = sqlite3.connect(path)
conn.execute("CREATE TABLE campaign_messages (id TEXT PRIMARY KEY, lead_id TEXT NOT NULL, step TEXT NOT NULL, message_id TEXT, subject TEXT, sent_at TEXT NOT NULL)")
conn.commit()
ensure_schema(conn)
ensure_schema(conn)  # antras kartas nekrenta
cols = {r[1] for r in conn.execute("PRAGMA table_info(campaign_messages)")}
checks["ensure_schema prideda variant stulpelį (idempotentiškai)"] = "variant" in cols
record_message(conn, lid, "E0", "<m1@test>", s1, variant=v1)
record_message(conn, lid, "B1", "<m2@test>", f"Re: {s1}")
row = conn.execute("SELECT variant, subject FROM campaign_messages WHERE lead_id=? AND step='E0'", (lid,)).fetchone()
checks["E0 įrašas turi variantą"] = row == (v1, s1)
fu = conn.execute("SELECT variant, subject FROM campaign_messages WHERE lead_id=? AND step='B1'", (lid,)).fetchone()
checks["Follow-up lieka toje pačioje gijoje (Re: ta pati tema)"] = fu[1] == f"Re: {s1}"
conn.close()

for name, ok in checks.items():
    print(("OK   " if ok else "FAIL ") + name)
sys.exit(0 if all(checks.values()) else 1)
