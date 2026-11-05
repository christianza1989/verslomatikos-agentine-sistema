# AGENTS.md — Verslomatika B2B Autonomous Ecosystem Guide for LLMs

> **Target Audience**: AI Agents, LLM models (Codex, Claude, GPT, Cursor, Gemini), and autonomous systems maintaining, debugging, or deploying this codebase.
> **Last Updated**: November 2026.
> **Language & Encoding**: Lithuanian / English. UTF-8 strictly required.

---

## 1. Executive Summary & System Identity

* **Organization**: Verslomatika (MB Pinet, Reg. Code 306067365, Vilnius, Lithuania).
* **Domain**: `https://verslomatika.lt`.
* **Primary Outbound Persona**: Tomas | Verslo sprendimų vadovas (`tomas@verslomatika.lt`).
* **Mission**: Fully autonomous B2B outbound engine, customer reactivation, and Google Maps 5★ reputation management system for dental/medical clinics, e-commerce retailers, and local service companies across Lithuania and the EU.
* **Core Products**:
  1. **ReputationPro (`apps/reputationpro`)**: 5★ Google Maps review growth & review shield software.
  2. **ReviveLeads (`apps/reviveleads`)**: Cold customer database reactivation via AI conversational SMS/email.
  3. **B2B Outbound Engine (`core/`)**: Multi-channel autonomous prospecting, quota-controlled email campaigns, and 24/7 IMAP response intelligence.

---

## 2. Repository Layout & Component Architecture

```
Agentai/
├── AGENTS.md                          # <--- THIS FILE (LLM operating instructions & architectural memory)
├── README.md                          # Human-readable overview and quick start
├── SYSTEM_ARCHITECTURE.md             # Dataflow diagrams (Mermaid) and legacy holding schemas
├── CODEX.md                           # Universal business onboarding commands
├── setup_vps.sh                       # 1-click automated deployment script for Ubuntu 22.04 / 24.04
├── requirements.txt                   # Minimal Python 3.12+ dependencies
├── start_all_services.bat             # Windows one-click local startup
├── start_all_services.ps1             # Windows PowerShell daemon launcher
│
├── apps/
│   ├── reputationpro/                 # [Next.js 16 + TypeScript + Tailwind CSS 4 + SQLite]
│   │   ├── src/app/                   # App Router pages (/admin, /checkout, /r/[slug], /api/*)
│   │   ├── src/lib/db.ts              # SQLite database layer (WAL mode, parameterized queries)
│   │   ├── src/lib/clinic-access.ts   # Session auth, scrypt password hashing, trial permissions
│   │   └── data/reputation.db         # Local SQLite DB (Git-ignored)
│   └── reviveleads/                   # [Next.js 16] Lead reactivation micro-SaaS
│
├── core/                              # [Autonomous Python 3.12 Engines]
│   ├── morning_campaign_runner.py     # Outbound campaign dispatcher (daily 08:30 Europe/Vilnius)
│   ├── email_reply_listener.py        # 24/7 IMAP listener & lead status updater
│   ├── reputation_sales_agent.py      # LLM consultative sales closer & objection handler
│   ├── dental_lead_pool.py            # Dental & medical clinics catalog + SQLite provisioner
│   ├── ecommerce_lead_pool.py         # E-commerce stores & repair centres catalog + provisioner
│   ├── smtp_sender.py                 # SSL SMTP mailer (mx.oradomail.com:465)
│   ├── objection_handler.py           # Few-shot objection handling logic
│   └── accounting_pipeline.py         # Accounting AI workflow & financial statement generation
│
├── configs/
│   ├── email_credentials.example.json # Template for SMTP/IMAP credentials
│   └── *.json                         # Niche configurations (kubilai_europa, memocasting, etc.)
│
├── bridge/
│   ├── bridge_server.py               # WebSocket / HTTP IPC bridge on port 5050
│   └── gui/index.html                 # Visual live dashboard
│
└── data/                              # Static lead registers, reports, and templates
```

---

## 3. End-to-End Operational Lifecycle

```
[Lead Discovery]
       │
       ▼
1. Lead Pool Catalog (core/dental_lead_pool.py & core/ecommerce_lead_pool.py)
       │  (Contains verified clinic/store name, email, city, official Google Maps URL)
       ▼
2. Automatic DB Pre-Provisioning
       │  Function: provision_lead_in_db() inserts record into apps/reputationpro/data/reputation.db
       │  Record created with: is_demo=1, subscription_status='demo_trial', unique slug
       ▼
3. Outbound Email Generation (core/morning_campaign_runner.py)
       │  Dispatches at 08:30 daily (max 25 emails/day, 40-65s jitter)
       │  Generates 24/7 Edge URLs:
       │    Preview:  https://verslomatika.lt/r/{slug}
       │    Claim:    https://verslomatika.lt/checkout?slug={slug}&name={name}&email={email}
       │    Tracking: https://verslomatika.lt/api/track/click?id={id}&to=...
       │    Pixel:    https://verslomatika.lt/api/track/open?id={id}
       │    QR Code:  https://verslomatika.lt/api/qr?slug={slug}
       ▼
4. Client Interaction Paths:
       ├─────────────────────────────────────────┬────────────────────────────────────────┐
       ▼                                         ▼                                        ▼
[Path A: Opens Demo /r/{slug}]        [Path B: Replies to Email]           [Path C: Clicks Checkout]
- Served 24/7 by Cloudflare Worker    - Detected by email_reply_listener   - Handled by /checkout
- 4-5★: Directs to Google Maps        - SQLite status updated to 'replied' - Pre-provisioned slug recognized
- 1-3★: Opens private owner feedback  - AI generates consultative answer   - Upgraded to 'trialing', is_demo=0
                                                                           - User logs in to /admin
```

---

## 4. Hybrid Cloud Architecture: Cloudflare Edge vs VPS

| Function | Cloudflare Edge (`verslomatika.lt`) | VPS (Ubuntu 24.04 / Linux) |
| :--- | :--- | :--- |
| **Hosting Mode** | Serverless Worker (300+ edge data centers) | Docker / PM2 persistent daemons |
| **Uptime Dependency** | 100% 24/7 (Never goes down, zero PC reliance) | 24/7 cloud server |
| **Routes Served** | `/`, `/reputacija`, `/buhalterija`, `/r/:slug`, `/api/track/*`, `/api/qr` | `/admin`, `/checkout` (API), Next.js SSR, DB |
| **Worker Files** | `verslomatika-v2-website/worker/reputation_edge.ts` | `apps/reputationpro/` |
| **Daemons Running** | Scheduled cron trigger (every 5 min) | `morning_campaign_runner.py`, `email_reply_listener.py` |

---

## 5. Critical Engineering Invariants (Do-Not-Break Rules)

1. **Checkout Slug Claiming (Crucial Bug Prevention)**:
   - *Rule*: Outbound leads are pre-provisioned in `reputation.db` with `is_demo=1`.
   - *Requirement*: When a lead visits `/checkout?slug=...` and registers, `apps/reputationpro/src/app/api/checkout/route.ts` **MUST NOT** reject the submission with *"Šis nuorodos vardas jau užimtas"*. It must detect that the slug is pre-provisioned and upgrade the client from `demo_trial` to `trialing`, hash their chosen password, set `is_demo=0`, and establish a secure session.

2. **Lithuanian Language & UTF-8 Encoding**:
   - All email templates, database records, and logs contain Lithuanian diacritics (`ą, č, ę, ė, į, š, ų, ū, ž`).
   - Python files **MUST** include stdout reconfig:
     ```python
     if hasattr(sys.stdout, 'reconfigure'):
         sys.stdout.reconfigure(encoding='utf-8', errors='replace')
     ```

3. **No Coercive Review Gating (Google Maps Compliance)**:
   - While 4–5★ ratings guide customers to Google Maps and 1–3★ ratings offer a private resolution form to the manager, the interface **must always maintain an optional public review link** to remain strictly compliant with Google’s anti-review-gating guidelines.

4. **Security & Secrets Hygiene**:
   - Never commit `configs/email_credentials.json`, `.env.local`, `*.db`, or `tunnel-token`.
   - Production secrets are passed via environment variables or `.env.local`.

---

## 6. CLI Commands & Operational Runbook

### A. Testing & System Verification
```bash
# Verify ReputationPro Admin Authentication
python test_admin_auth.py

# Verify Checkout Flow & Slug Claiming Logic
python test_checkout_flow.py

# Verify Live Email Preview Generation
python test_email_preview.py

# Run Full System Verification
python test_full_system_verification.py
```

### B. Running Next.js Apps
```bash
# ReputationPro (Port 3000)
cd apps/reputationpro
npm install
npm run build
npm run start -- --port 3000

# ReviveLeads (Port 3002)
cd apps/reviveleads
npm install
npm run build
npm run start -- --port 3002
```

### C. Running Autonomous Daemons
```bash
# Run Outbound Morning Campaign Once (Immediate test)
python core/morning_campaign_runner.py once

# Run Outbound Campaign as 24/7 Daemon (Fires every morning at 08:30)
python core/morning_campaign_runner.py daemon

# Run 24/7 IMAP Email Reply Listener
python core/email_reply_listener.py lilijazap@gmail.com
```

### D. Managing VPS Services via PM2
```bash
pm2 status                  # Check all running processes
pm2 logs morning-campaign   # View outbound campaign logs
pm2 logs reply-listener     # View IMAP listener logs
pm2 restart all             # Graceful restart of all daemons
```

---

## 7. Database Schema & Tables (`apps/reputationpro/data/reputation.db`)

* `clients`:
  - `slug` (TEXT PRIMARY KEY) — URL identifier (e.g., `sportland-lietuva-e-shop`).
  - `business_name` (TEXT) — Business title.
  - `email` (TEXT) — Primary notification & login email.
  - `password_hash` (TEXT) — `scrypt` derived password hash.
  - `google_review_url` (TEXT) — Direct Google Maps review link.
  - `subscription_status` (TEXT) — `demo_trial`, `trialing`, `active`, `canceled`.
  - `is_demo` (INTEGER) — `1` for outbound prospect, `0` once claimed by business owner.
  - `trial_ends_at` (TEXT) — ISO 8601 expiration date (default: 14 days from activation).

* `internal_feedback`:
  - `id` (TEXT PRIMARY KEY) — Feedback UUID.
  - `client_slug` (TEXT) — Associated client.
  - `rating` (INTEGER) — 1 to 5 stars.
  - `feedback_text` (TEXT) — Private complaint or comment for the manager.
  - `customer_name`, `customer_contact` (TEXT) — Optional patient/customer details.
  - `status` (TEXT) — `unread`, `in_progress`, `resolved`.

* `campaign_leads`:
  - Records outbound email history, lead status (`contacted`, `opened`, `clicked`, `replied`, `converted`), and timestamps.
