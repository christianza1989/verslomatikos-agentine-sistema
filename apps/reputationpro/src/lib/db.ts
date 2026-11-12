import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { usableReviewUrl } from './validation.ts';

export type Client = {
  id: string; slug: string; business_name: string; email: string; phone: string;
  google_review_url: string; subscription_status: string; stripe_customer_id: string | null;
  stripe_subscription_id: string | null; created_at: string; trial_ends_at: string | null; is_demo: number;
  // Added 2026-11-05 (see ROADMAP_REPUTATIONPRO.md). Columns are created by ensureClientColumns().
  show_public_link_low: number; industry: string;
  google_place_id: string | null; google_rating: number | null; google_reviews_count: number | null;
  /** ROADMAP K5: extra addresses (comma separated, max 3) that also receive customer notes. */
  notify_emails: string;
  /** Branches (filialai): parent = the account's main profile; label = city/address; archived = removed. */
  parent_id: string | null; location_label: string; archived_at: string | null;
};
export type Feedback = {
  id: string; client_id: string; rating: number; feedback_text: string;
  customer_name: string; customer_phone: string; status: 'new' | 'resolved'; created_at: string;
};
export type CampaignLead = {
  id: string;
  campaign_id: string;
  business_name: string;
  email: string;
  slug: string;
  city: string;
  phone: string;
  website: string;
  status: 'ready' | 'sent' | 'opened' | 'clicked' | 'replied' | 'converted' | 'bounced';
  sent_at: string | null;
  opened_at: string | null;
  open_count: number;
  clicked_at: string | null;
  click_count: number;
  last_clicked_url: string | null;
  replied_at: string | null;
  last_reply_text: string | null;
  converted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type CampaignEvent = {
  id: string;
  lead_id: string;
  event_type: 'sent' | 'open' | 'click' | 'reply' | 'conversion';
  details: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};
let singleton: DatabaseSync | undefined;
export type ReviveContact = {
  id: string;
  client_id: string;
  name: string;
  phone: string;
  email: string;
  last_visit: string;
  service_history: string;
  status: 'pending' | 'contacted' | 'replied' | 'booked' | 'opt_out';
  notes: string;
  created_at: string;
  updated_at: string;
};
export type ReviveCampaign = {
  id: string;
  client_id: string;
  name: string;
  niche: string;
  template_type: string;
  message_template: string;
  sent_count: number;
  reply_count: number;
  booked_count: number;
  status: 'draft' | 'active' | 'completed' | 'paused';
  created_at: string;
};
export type ReviveConversation = {
  id: string;
  campaign_id: string;
  contact_id: string;
  sender: 'bot' | 'contact';
  message: string;
  created_at: string;
};
export type ReviveBooking = {
  id: string;
  client_id: string;
  contact_id: string;
  contact_name?: string;
  contact_phone?: string;
  booking_time: string;
  service_name: string;
  estimated_revenue: number;
  status: 'confirmed' | 'completed' | 'canceled';
  notes: string;
  created_at: string;
};
export type ReviveStats = {
  totalContacts: number;
  contactedCount: number;
  replyCount: number;
  replyRate: number;
  bookedCount: number;
  bookingRate: number;
  estimatedRevenue: number;
  activeCampaigns: number;
};
export function db() {
  if (singleton) return singleton;
  const filename = path.resolve(/* turbopackIgnore: true */ process.env.DATABASE_PATH || './data/reputation.db');
  mkdirSync(path.dirname(filename), { recursive: true });
  const sql = new DatabaseSync(filename);
  sql.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, business_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL DEFAULT '', google_review_url TEXT NOT NULL,
      subscription_status TEXT NOT NULL DEFAULT 'pending', stripe_customer_id TEXT,
      stripe_subscription_id TEXT, trial_ends_at TEXT, is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS internal_feedback (
      id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id), rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      feedback_text TEXT NOT NULL, customer_name TEXT NOT NULL DEFAULT '', customer_phone TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','resolved')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS feedback_client_date ON internal_feedback(client_id, created_at);
    CREATE TABLE IF NOT EXISTS review_events (
      id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id), rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS clinic_credentials (
      client_id TEXT PRIMARY KEY REFERENCES clients(id),
      password_salt TEXT NOT NULL, password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS clinic_sessions (
      token_hash TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id), expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS clinic_sessions_client ON clinic_sessions(client_id);
    CREATE TABLE IF NOT EXISTS clinic_email_verifications (
      client_id TEXT PRIMARY KEY REFERENCES clients(id), verified_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS clinic_email_tokens (
      token_hash TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id),
      purpose TEXT NOT NULL CHECK(purpose IN ('verify','reset')), expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS clinic_email_tokens_client ON clinic_email_tokens(client_id,purpose);
    CREATE TABLE IF NOT EXISTS checkout_attempts (
      client_id TEXT PRIMARY KEY REFERENCES clients(id), attempt_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL, session_id TEXT
    );
    CREATE TABLE IF NOT EXISTS claim_tokens (
      token_hash TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id),
      expires_at INTEGER NOT NULL, used_at INTEGER, created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS claim_tokens_client ON claim_tokens(client_id);
    CREATE TABLE IF NOT EXISTS campaign_suppressions (
      email TEXT PRIMARY KEY, reason TEXT NOT NULL, details TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS rate_limits (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, resets_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS stripe_events (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL);

    CREATE TABLE IF NOT EXISTS campaign_leads (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL DEFAULT 'dental-pilot-20261028',
      business_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT 'Vilnius',
      phone TEXT NOT NULL DEFAULT '',
      website TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'ready' CHECK(status IN ('ready','sent','opened','clicked','replied','converted','bounced')),
      sent_at TEXT,
      opened_at TEXT,
      open_count INTEGER NOT NULL DEFAULT 0,
      clicked_at TEXT,
      click_count INTEGER NOT NULL DEFAULT 0,
      last_clicked_url TEXT,
      replied_at TEXT,
      last_reply_text TEXT,
      converted_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS campaign_leads_email ON campaign_leads(email);
    CREATE INDEX IF NOT EXISTS campaign_leads_slug ON campaign_leads(slug);
    CREATE INDEX IF NOT EXISTS campaign_leads_status ON campaign_leads(status);

    CREATE TABLE IF NOT EXISTS campaign_events (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES campaign_leads(id),
      event_type TEXT NOT NULL CHECK(event_type IN ('sent','open','click','reply','conversion')),
      details TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS campaign_events_lead ON campaign_events(lead_id, created_at);

    CREATE TABLE IF NOT EXISTS revive_contacts (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      last_visit TEXT NOT NULL DEFAULT '',
      service_history TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','contacted','replied','booked','opt_out')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS revive_contacts_client ON revive_contacts(client_id);
    CREATE INDEX IF NOT EXISTS revive_contacts_status ON revive_contacts(status);

    CREATE TABLE IF NOT EXISTS revive_campaigns (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      name TEXT NOT NULL,
      niche TEXT NOT NULL DEFAULT 'dental',
      template_type TEXT NOT NULL DEFAULT 'hygiene_recall',
      message_template TEXT NOT NULL,
      sent_count INTEGER NOT NULL DEFAULT 0,
      reply_count INTEGER NOT NULL DEFAULT 0,
      booked_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','completed','paused')),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS revive_campaigns_client ON revive_campaigns(client_id);

    CREATE TABLE IF NOT EXISTS revive_conversations (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES revive_campaigns(id),
      contact_id TEXT NOT NULL REFERENCES revive_contacts(id),
      sender TEXT NOT NULL CHECK(sender IN ('bot','contact')),
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS revive_conv_contact ON revive_conversations(contact_id);

    CREATE TABLE IF NOT EXISTS revive_bookings (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      contact_id TEXT NOT NULL REFERENCES revive_contacts(id),
      booking_time TEXT NOT NULL,
      service_name TEXT NOT NULL DEFAULT '',
      estimated_revenue REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','completed','canceled')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS revive_bookings_client ON revive_bookings(client_id);
  `);
  migrateFeedbackRatings(sql);
  ensureClientColumns(sql);
  ensureStandOrders(sql);
  seedPilotCampaignLeads(sql);
  // Only an explicitly enabled local demo receives a fictional sample clinic.
  if (process.env.DEMO_MODE === 'true') {
    sql.prepare(`INSERT OR IGNORE INTO clients
      (id,slug,business_name,email,google_review_url,subscription_status,is_demo,trial_ends_at)
      VALUES (?,?,?,?,?,'demo_trial',1,?)`).run(
      'demo-vilniaus-denta', 'vilniaus-denta', 'Vilniaus Denta', 'klinika@example.test',
      'https://www.google.com/maps/search/?api=1&query=Vilniaus+Denta+Vilnius',
      new Date(Date.now() + 14 * 86400000).toISOString()
    );
  }
  singleton = sql;
  return sql;
}
// Additive, idempotent column migration. Python (core/claim_tokens.py::ensure_schema)
// runs the same list, so either side may create the columns first.
export const CLIENT_COLUMNS: [string, string][] = [
  ['show_public_link_low', 'INTEGER NOT NULL DEFAULT 0'],
  ['industry', "TEXT NOT NULL DEFAULT 'general'"],
  ['google_place_id', 'TEXT'],
  ['google_rating', 'REAL'],
  ['google_reviews_count', 'INTEGER'],
  ['notify_emails', "TEXT NOT NULL DEFAULT ''"],
  ['parent_id', 'TEXT'],
  ['location_label', "TEXT NOT NULL DEFAULT ''"],
  ['archived_at', 'TEXT'],
];
function ensureClientColumns(sql: DatabaseSync) {
  const have = new Set(sql.prepare('PRAGMA table_info(clients)').all().map((row) => String(row.name)));
  for (const [name, definition] of CLIENT_COLUMNS) {
    if (have.has(name)) continue;
    try { sql.exec(`ALTER TABLE clients ADD COLUMN ${name} ${definition}`); }
    catch (error) { if (!/duplicate column/i.test(String(error))) throw error; }
  }
  sql.exec('CREATE INDEX IF NOT EXISTS clients_parent ON clients(parent_id)');
  ensureCampaignMessages(sql);
  // ROADMAP D5.5: which sharing channel (QR on receipt, email signature, …) brought the rating.
  const ev =new Set(sql.prepare('PRAGMA table_info(review_events)').all().map((row) => String(row.name)));
  if (!ev.has('source')) {
    try { sql.exec('ALTER TABLE review_events ADD COLUMN source TEXT'); }
    catch (error) { if (!/duplicate column/i.test(String(error))) throw error; }
  }
}

// Outbound campaign messages (written by Python core/claim_tokens.py::record_message). Same schema as
// core/claim_tokens.py::ensure_schema; ROADMAP C5 added `variant` = "case:A|B|C" (subject A/B test).
function ensureCampaignMessages(sql: DatabaseSync) {
  sql.exec(`CREATE TABLE IF NOT EXISTS campaign_messages (
      id TEXT PRIMARY KEY, lead_id TEXT NOT NULL, step TEXT NOT NULL,
      message_id TEXT, subject TEXT, sent_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS campaign_messages_lead ON campaign_messages(lead_id, step);`);
  const have = new Set(sql.prepare('PRAGMA table_info(campaign_messages)').all().map((row) => String(row.name)));
  if (!have.has('variant')) {
    try { sql.exec('ALTER TABLE campaign_messages ADD COLUMN variant TEXT'); }
    catch (error) { if (!/duplicate column/i.test(String(error))) throw error; }
  }
  // 2026-11-11: agent mailbox that sent the message (per-mailbox daily cap, follow-ups from the same agent).
  if (!have.has('sender')) {
    try { sql.exec('ALTER TABLE campaign_messages ADD COLUMN sender TEXT'); }
    catch (error) { if (!/duplicate column/i.test(String(error))) throw error; }
  }
}

export const SUBJECT_CASES: Record<string, string> = {
  google_stats: 'Google su reitingu', google_generic: 'Google be reitingo',
  no_google: 'Be Google (Rekvizitai.lt)', branches: 'Įmonė su filialais',
};
/** Below this many first emails per variant the owner panel shows „per mažai duomenų“. */
export const SUBJECT_MIN_SAMPLE = 30;
export type SubjectVariantStat = {
  case_key: string; variant: string; sent: number; opened: number; clicked: number; activated: number;
  open_rate: number; click_rate: number; enough: boolean; example: string | null;
};

/** First emails (step E0) per subject case × variant: sent, opened, clicked, activated (ROADMAP C5). */
export function getSubjectVariantStats(): SubjectVariantStat[] {
  const rows = db().prepare(`SELECT m.variant AS variant, COUNT(DISTINCT m.lead_id) AS sent,
      COUNT(DISTINCT CASE WHEN l.opened_at IS NOT NULL OR l.open_count > 0 THEN m.lead_id END) AS opened,
      COUNT(DISTINCT CASE WHEN l.clicked_at IS NOT NULL OR l.click_count > 0 THEN m.lead_id END) AS clicked,
      COUNT(DISTINCT CASE WHEN l.status = 'converted' OR l.converted_at IS NOT NULL
        OR EXISTS (SELECT 1 FROM clients c WHERE c.slug = l.slug AND c.is_demo = 0) THEN m.lead_id END) AS activated,
      MAX(m.subject) AS example
    FROM campaign_messages m LEFT JOIN campaign_leads l ON l.id = m.lead_id
    WHERE m.step = 'E0' AND m.variant LIKE '%:%'
    GROUP BY m.variant ORDER BY m.variant`).all();
  return rows.map((r) => {
    const [case_key, variant] = String(r.variant).split(':');
    const sent = Number(r.sent), opened = Number(r.opened), clicked = Number(r.clicked);
    return {
      case_key, variant, sent, opened, clicked, activated: Number(r.activated),
      open_rate: sent ? opened / sent : 0, click_rate: sent ? clicked / sent : 0,
      enough: sent >= SUBJECT_MIN_SAMPLE, example: (r.example as string | null) ?? null,
    };
  });
}

/** Ratings per sharing channel for the last `days` days (null source = link without a channel tag). */
export function getSourceStats(clientId: string, days = 90) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  return db().prepare(`SELECT source, COUNT(*) AS total, SUM(CASE WHEN rating>=4 THEN 1 ELSE 0 END) AS positive
    FROM review_events WHERE client_id=? AND created_at>=? GROUP BY source ORDER BY total DESC`)
    .all(clientId, since).map((r) => ({ source: (r.source as string | null) ?? null, total: Number(r.total), positive: Number(r.positive || 0) }));
}

// ---------------------------------------------------------------------------
// Free QR + NFC stands (owner decision 2026-11-11): an activated client enters a
// delivery address in the dashboard, the owner ships the stand and marks it sent
// in /admin/klientai. Older rows were created lazily by api/checkout with only
// (id, client_id, plan, delivery_address, created_at); the extra columns are added here.
// ---------------------------------------------------------------------------
export const STAND_STATUSES = ['requested', 'sent', 'delivered', 'canceled'] as const;
export type StandStatus = typeof STAND_STATUSES[number];
export type StandOrder = {
  id: string; client_id: string; plan: string; delivery_address: string; created_at: string;
  recipient: string | null; company: string | null; phone: string | null; street: string | null;
  city: string | null; postal_code: string | null; notes: string | null; quantity: number;
  status: StandStatus; updated_at: string | null; sent_at: string | null;
};
export type StandOrderInput = {
  recipient: string; company?: string; phone: string; street: string; city: string; postal_code: string;
  notes?: string; quantity: number;
};
const STAND_COLUMNS: [string, string][] = [
  ['recipient', 'TEXT'], ['company', 'TEXT'], ['phone', 'TEXT'], ['street', 'TEXT'], ['city', 'TEXT'],
  ['postal_code', 'TEXT'], ['notes', 'TEXT'], ['quantity', 'INTEGER NOT NULL DEFAULT 1'],
  ['status', "TEXT NOT NULL DEFAULT 'requested'"], ['updated_at', 'TEXT'], ['sent_at', 'TEXT'],
];
function ensureStandOrders(sql: DatabaseSync) {
  sql.exec(`CREATE TABLE IF NOT EXISTS stand_orders (
    id TEXT PRIMARY KEY, client_id TEXT NOT NULL, plan TEXT NOT NULL, delivery_address TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`);
  const have = new Set(sql.prepare('PRAGMA table_info(stand_orders)').all().map((row) => String(row.name)));
  for (const [name, definition] of STAND_COLUMNS) {
    if (have.has(name)) continue;
    try { sql.exec(`ALTER TABLE stand_orders ADD COLUMN ${name} ${definition}`); }
    catch (error) { if (!/duplicate column/i.test(String(error))) throw error; }
  }
  sql.exec('CREATE INDEX IF NOT EXISTS stand_orders_client ON stand_orders(client_id, created_at)');
}
export function formatStandAddress(o: Pick<StandOrderInput, 'recipient' | 'company' | 'phone' | 'street' | 'city' | 'postal_code'>) {
  return [o.company, o.recipient, o.street, `${o.postal_code} ${o.city}`.trim(), o.phone].filter(Boolean).join(', ');
}
/** Latest stand order of a client (the dashboard shows its status). Rows without an address
 *  (old landing sign-ups stored delivery_address='') are not orders: the client still has to enter one. */
export function getStandOrder(clientId: string): StandOrder | undefined {
  const row = db().prepare("SELECT * FROM stand_orders WHERE client_id=? AND TRIM(delivery_address)<>'' ORDER BY created_at DESC LIMIT 1").get(clientId);
  return row ? ({ ...row } as StandOrder) : undefined;
}
/** Creates the order, or updates the address while it is still waiting to be shipped. */
export function saveStandOrder(clientId: string, input: StandOrderInput): { order?: StandOrder; created?: boolean; error?: 'already_sent' } {
  const current = getStandOrder(clientId);
  if (current && (current.status === 'sent' || current.status === 'delivered')) return { error: 'already_sent' };
  const now = new Date().toISOString();
  const fields = [input.recipient, input.company || null, input.phone, input.street, input.city, input.postal_code, input.notes || null, input.quantity, formatStandAddress(input)];
  if (current && current.status === 'requested') {
    db().prepare(`UPDATE stand_orders SET recipient=?, company=?, phone=?, street=?, city=?, postal_code=?, notes=?, quantity=?,
      delivery_address=?, updated_at=? WHERE id=?`).run(...fields, now, current.id);
    return { order: getStandOrder(clientId), created: false };
  }
  db().prepare(`INSERT INTO stand_orders (id, client_id, plan, recipient, company, phone, street, city, postal_code, notes, quantity,
    delivery_address, status, created_at, updated_at) VALUES (?, ?, 'free', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested', ?, ?)`)
    .run(randomUUID(), clientId, ...fields, now, now);
  return { order: getStandOrder(clientId), created: true };
}
/** Owner status change. updated_at is left alone: it means "the client changed the address". */
export function setStandOrderStatus(orderId: string, status: StandStatus) {
  const now = new Date().toISOString();
  const res = db().prepare(`UPDATE stand_orders SET status=?,
    sent_at=CASE WHEN ? IN ('sent','delivered') THEN COALESCE(sent_at, ?) WHEN ?='requested' THEN NULL ELSE sent_at END WHERE id=?`)
    .run(status, status, now, status, orderId);
  return Number(res.changes) > 0;
}
export type BranchRow = {
  id: string; slug: string; business_name: string; location_label: string; email: string | null;
  ratings: number; positive: number; unread: number; order: StandOrder | null;
};
export type ActivatedClientRow = {
  id: string; slug: string; business_name: string; email: string; phone: string; subscription_status: string;
  trial_ends_at: string | null; google_review_url: string; activated_at: string | null;
  ratings: number; positive: number; last_rating_at: string | null; unread: number; order: StandOrder | null;
  /** Active branches of this account (filialai), each with its own stats and stand order. */
  branches: BranchRow[];
};
const STATS_SQL = `(SELECT COUNT(*) FROM review_events e WHERE e.client_id=c.id) AS ratings,
      (SELECT COUNT(*) FROM review_events e WHERE e.client_id=c.id AND e.rating>=4) AS positive,
      (SELECT MAX(created_at) FROM review_events e WHERE e.client_id=c.id) AS last_rating_at,
      (SELECT COUNT(*) FROM internal_feedback f WHERE f.client_id=c.id AND f.status='new') AS unread`;
/** Owner overview (/admin/klientai): every account a business has activated (main profiles), newest first. */
export function getActivatedClients(): ActivatedClientRow[] {
  const rows = db().prepare(`SELECT c.id, c.slug, c.business_name, c.email, c.phone, c.subscription_status, c.trial_ends_at,
      c.google_review_url, c.created_at, v.verified_at, ${STATS_SQL}
    FROM clients c LEFT JOIN clinic_email_verifications v ON v.client_id=c.id
    WHERE c.is_demo=0 AND c.parent_id IS NULL AND c.archived_at IS NULL ORDER BY COALESCE(v.verified_at, 0) DESC, c.created_at DESC`).all();
  const branchStmt = db().prepare(`SELECT c.id, c.slug, c.business_name, c.location_label, c.email, ${STATS_SQL}
    FROM clients c WHERE c.parent_id=? AND c.archived_at IS NULL ORDER BY c.created_at`);
  return rows.map((r) => {
    const verified = r.verified_at == null ? null : new Date(Number(r.verified_at)).toISOString();
    const branches = branchStmt.all(String(r.id)).map((b) => ({
      id: String(b.id), slug: String(b.slug), business_name: String(b.business_name), location_label: String(b.location_label || ''),
      email: isPlaceholderEmail(String(b.email)) ? null : String(b.email),
      ratings: Number(b.ratings), positive: Number(b.positive || 0), unread: Number(b.unread || 0), order: getStandOrder(String(b.id)) ?? null,
    }));
    return {
      id: String(r.id), slug: String(r.slug), business_name: String(r.business_name), email: String(r.email),
      phone: String(r.phone || ''), subscription_status: String(r.subscription_status),
      trial_ends_at: (r.trial_ends_at as string | null) ?? null, google_review_url: String(r.google_review_url),
      activated_at: verified ?? String(r.created_at), ratings: Number(r.ratings), positive: Number(r.positive || 0),
      last_rating_at: (r.last_rating_at as string | null) ?? null, unread: Number(r.unread || 0),
      order: getStandOrder(String(r.id)) ?? null, branches,
    };
  });
}
// SQLite cannot alter a CHECK constraint in place. Migrate the known legacy
// schema transactionally; preserve every row and reject unknown local changes.
function migrateFeedbackRatings(sql: DatabaseSync) {
  const tableSql = () => (sql.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='internal_feedback'").get() as {sql:string}).sql;
  const legacy = /CHECK\s*\(\s*rating\s+BETWEEN\s+1\s+AND\s+3\s*\)/i;
  if (!legacy.test(tableSql())) return;
  sql.exec('BEGIN IMMEDIATE');
  try {
    // A second process may have finished the migration while we waited.
    if (!legacy.test(tableSql())) { sql.exec('COMMIT'); return; }
    const columns = sql.prepare('PRAGMA table_info(internal_feedback)').all().map((row) => String(row.name));
    const expected = ['id','client_id','rating','feedback_text','customer_name','customer_phone','status','created_at'];
    const custom = sql.prepare("SELECT name FROM sqlite_master WHERE tbl_name='internal_feedback' AND (type='trigger' OR (type='index' AND sql IS NOT NULL AND name!='feedback_client_date'))").all();
    const tables=sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='internal_feedback'").all();
    const hasReferences=tables.some(({name})=>sql.prepare(`PRAGMA foreign_key_list("${String(name).replaceAll('"','""')}")`).all().some(row=>row.table==='internal_feedback'));
    const views=sql.prepare("SELECT sql FROM sqlite_master WHERE type='view' AND sql IS NOT NULL").all();
    if (columns.join(',') !== expected.join(',') || custom.length || hasReferences || views.some(row=>/\binternal_feedback\b/i.test(String(row.sql)))) throw new Error('Unknown feedback schema; migration requires review.');
    sql.exec(`ALTER TABLE internal_feedback RENAME TO internal_feedback_legacy;
      CREATE TABLE internal_feedback (
        id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id), rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        feedback_text TEXT NOT NULL, customer_name TEXT NOT NULL DEFAULT '', customer_phone TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','resolved')),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );
      INSERT INTO internal_feedback (id,client_id,rating,feedback_text,customer_name,customer_phone,status,created_at)
        SELECT id,client_id,rating,feedback_text,customer_name,customer_phone,status,created_at FROM internal_feedback_legacy;
      DROP TABLE internal_feedback_legacy;
      CREATE INDEX feedback_client_date ON internal_feedback(client_id, created_at);`);
    sql.exec('COMMIT');
  } catch (error) { sql.exec('ROLLBACK'); throw error; }
}
// node:sqlite returns null-prototype records. React Server Components require
// normal objects at the server/client boundary; normalize all exported records.
// Every client read goes through toClient(): plain object for RSC + never a broken Google link.
function toClient(row: Record<string, unknown>): Client {
  const c = { ...row } as Client;
  c.google_review_url = usableReviewUrl(c.google_review_url, c.business_name);
  return c;
}
export function getClients() { return db().prepare('SELECT * FROM clients ORDER BY created_at DESC').all().map((row) => toClient(row)); }
export function getClient(slug: string) { const row=db().prepare('SELECT * FROM clients WHERE slug=?').get(slug);return row?toClient(row):undefined; }
export function getClientById(id: string) { const row=db().prepare('SELECT * FROM clients WHERE id=?').get(id);return row?toClient(row):undefined; }
export function getFeedback(clientId: string) { return db().prepare('SELECT * FROM internal_feedback WHERE client_id=? ORDER BY created_at DESC LIMIT 200').all(clientId).map(row=>({...row})) as Feedback[]; }
export function getStats(clientId: string) {
  const events = db().prepare('SELECT COUNT(*) total, SUM(CASE WHEN rating>=4 THEN 1 ELSE 0 END) positive_ratings, AVG(rating) average FROM review_events WHERE client_id=?').get(clientId) as { total: number; positive_ratings: number | null; average: number | null };
  const feedback = db().prepare("SELECT COUNT(*) total, SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) unread FROM internal_feedback WHERE client_id=?").get(clientId) as { total: number; unread: number | null };
  return { ratings: events.total, positiveRatings: events.positive_ratings || 0, average: events.average, feedback: feedback.total, unread: feedback.unread || 0 };
}
export function createClient(
  input: {
    business_name: string;
    email: string;
    slug: string;
    google_review_url: string;
    phone?: string;
    subscription_status?: string;
    trial_ends_at?: string | null;
  },
  isDemo = false
) {
  const id = randomUUID();
  const trialEnds = input.trial_ends_at !== undefined ? input.trial_ends_at : (isDemo ? new Date(Date.now() + 14 * 86400000).toISOString() : null);
  const status = input.subscription_status || (isDemo ? 'demo_trial' : 'pending');
  db().prepare(`INSERT INTO clients (id,slug,business_name,email,google_review_url,phone,subscription_status,is_demo,trial_ends_at) VALUES (?,?,?,?,?,?,?,?,?)`).run(
    id, input.slug, input.business_name, input.email, input.google_review_url, input.phone || '', status, isDemo ? 1 : 0, trialEnds
  );
  return getClientById(id)!;
}

// ---------------------------------------------------------------------------
// Branches (filialai), 2026-11-11. A branch is a clients row with parent_id = the account's main
// profile (one level only). It gets everything a profile has: its own /r/{slug} page, QR codes,
// notes inbox, statistics, settings and stand order. Login stays on the main profile;
// subscription/trial is read from the main profile (src/lib/entitlements.ts). Archived branches
// (archived_at) are hidden and their page stops collecting.
// clients.email is UNIQUE NOT NULL: a branch without its own email gets a placeholder
// "filialas-…@filialai.invalid" that is never emailed (see notifyRecipients()).
// ---------------------------------------------------------------------------
export const MAX_BRANCHES = 25; // guard until branch pricing exists (ROADMAP G4)
export const isPlaceholderEmail = (email: string | null | undefined) => !email || email.trim().toLowerCase().endsWith('.invalid');
export const placeholderBranchEmail = () => `filialas-${randomUUID().slice(0, 8)}@filialai.invalid`;

export function getBranches(rootId: string, includeArchived = false): Client[] {
  return db().prepare(`SELECT * FROM clients WHERE parent_id=? ${includeArchived ? '' : 'AND archived_at IS NULL'} ORDER BY created_at`)
    .all(rootId).map((row) => toClient(row));
}
/** The account's main profile (the profile itself when it is not a branch). */
export function getAccountRoot(client: Client): Client {
  return client.parent_id ? getClientById(client.parent_id) ?? client : client;
}
export function slugifyName(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'filialas';
}
export function uniqueSlug(base: string) {
  const root = slugifyName(base);
  let slug = root.length >= 3 ? root : `${root}-filialas`;
  for (let i = 2; db().prepare('SELECT 1 FROM clients WHERE slug=?').get(slug); i++) slug = `${root}-${i}`;
  return slug;
}
export type BranchInput = { business_name: string; location_label?: string; google_review_url: string; email?: string; phone?: string };
export function createBranch(root: Client, input: BranchInput): Client {
  if (root.parent_id) throw new Error('A branch cannot have branches');
  const id = randomUUID();
  const email = (input.email || '').trim().toLowerCase() || placeholderBranchEmail();
  db().prepare(`INSERT INTO clients (id, slug, business_name, email, google_review_url, phone, subscription_status, is_demo, trial_ends_at,
      industry, show_public_link_low, parent_id, location_label) VALUES (?,?,?,?,?,?,?,0,?,?,?,?,?)`).run(
    id, uniqueSlug(input.business_name), input.business_name.trim(), email, input.google_review_url, (input.phone || '').trim(),
    root.subscription_status, root.trial_ends_at, root.industry || 'general', root.show_public_link_low ? 1 : 0, root.id, (input.location_label || '').trim());
  return getClientById(id)!;
}
export function updateBranch(branch: Client, input: BranchInput & { slug?: string }) {
  const typed = (input.email || '').trim().toLowerCase();
  const email = typed || (isPlaceholderEmail(branch.email) ? branch.email : placeholderBranchEmail());
  db().prepare(`UPDATE clients SET business_name=?, location_label=?, google_review_url=?, email=?, phone=?, slug=? WHERE id=? AND parent_id IS NOT NULL`)
    .run(input.business_name.trim(), (input.location_label || '').trim(), input.google_review_url, email, (input.phone || '').trim(), input.slug || branch.slug, branch.id);
  return getClientById(branch.id)!;
}
export function archiveBranch(branchId: string) {
  return Number(db().prepare(`UPDATE clients SET archived_at=? WHERE id=? AND parent_id IS NOT NULL AND archived_at IS NULL`).run(new Date().toISOString(), branchId).changes) > 0;
}
export type LocationStat = { id: string; slug: string; business_name: string; location_label: string; is_root: boolean; google_review_url: string;
  ratings: number; positive: number; ratings30: number; unread: number; has_login: boolean; email: string | null };
/** One row per location of the account (main profile first) for the dashboard "Filialai" list. */
export function getLocationStats(rootId: string): LocationStat[] {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  return db().prepare(`SELECT c.id, c.slug, c.business_name, c.location_label, c.parent_id, c.google_review_url, c.email,
      EXISTS(SELECT 1 FROM clinic_credentials a WHERE a.client_id=c.id) AS has_login,
      (SELECT COUNT(*) FROM review_events e WHERE e.client_id=c.id) AS ratings,
      (SELECT COUNT(*) FROM review_events e WHERE e.client_id=c.id AND e.rating>=4) AS positive,
      (SELECT COUNT(*) FROM review_events e WHERE e.client_id=c.id AND e.created_at>=?) AS ratings30,
      (SELECT COUNT(*) FROM internal_feedback f WHERE f.client_id=c.id AND f.status='new') AS unread
    FROM clients c WHERE (c.id=? OR c.parent_id=?) AND c.archived_at IS NULL
    ORDER BY CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END, c.created_at`).all(since, rootId, rootId).map((r) => ({
      id: String(r.id), slug: String(r.slug), business_name: String(r.business_name), location_label: String(r.location_label || ''),
      is_root: r.parent_id == null, google_review_url: usableReviewUrl(String(r.google_review_url), String(r.business_name)),
      ratings: Number(r.ratings), positive: Number(r.positive || 0), ratings30: Number(r.ratings30), unread: Number(r.unread || 0),
      has_login: !!Number(r.has_login), email: isPlaceholderEmail(String(r.email)) ? null : String(r.email),
    }));
}

function seedPilotCampaignLeads(sql: DatabaseSync) {
  const count = (sql.prepare('SELECT COUNT(*) as count FROM campaign_leads').get() as { count: number }).count;
  if (count > 0) return;

  const pilotLeads = [
    {
      id: 'lead_vic',
      campaign_id: 'dental-pilot-20261028',
      business_name: 'Vilniaus Implantologijos Centras (VIC)',
      email: 'info@vic.lt',
      slug: 'vilniaus-implantologijos-centras-vic',
      city: 'Vilnius',
      website: 'https://vic.lt',
      notes: 'Viena pažangiausių implantacijos klinikų Lietuvoje.'
    },
    {
      id: 'lead_denticija',
      campaign_id: 'dental-pilot-20261028',
      business_name: 'Denticija Vilnius',
      email: 'vilnius@denticija.lt',
      slug: 'denticija-vilnius',
      city: 'Vilnius',
      website: 'https://denticija.lt',
      notes: 'Didelė sostinės klinika, Vilniaus g. 25.'
    },
    {
      id: 'lead_kristoforas',
      campaign_id: 'dental-pilot-20261028',
      business_name: 'Šv. Kristoforo Odontologijos Klinika',
      email: 'info@kristoforoklinika.lt',
      slug: 'sv-kristoforo-odontologijos-klinika',
      city: 'Vilnius',
      website: 'https://kristoforoklinika.lt',
      notes: 'Senamiesčio klinika su aukštu pacientų pasitikėjimu.'
    },
    {
      id: 'lead_dantu_harmonija',
      campaign_id: 'dental-pilot-20261028',
      business_name: 'Dantų Harmonija',
      email: 'info@dantuharmonija.lt',
      slug: 'dantu-harmonija',
      city: 'Vilnius',
      website: 'https://dantuharmonija.lt',
      notes: 'Estetinė odontologija ir protezavimas.'
    },
    {
      id: 'lead_neodenta',
      campaign_id: 'dental-pilot-20261028',
      business_name: 'Neodenta',
      email: 'info@neodenta.lt',
      slug: 'neodenta',
      city: 'Kaunas / Vilnius',
      website: 'https://neodenta.lt',
      notes: 'Didžiausia Kauno implantologijos klinika.'
    },
    {
      id: 'lead_prodenta',
      campaign_id: 'dental-pilot-20261028',
      business_name: 'Prodenta',
      email: 'klinika@prodenta.lt',
      slug: 'prodenta',
      city: 'Kaunas',
      website: 'https://prodenta.lt',
      notes: 'Ilgametė patirtis Kaune.'
    },
    {
      id: 'lead_test_tomas',
      campaign_id: 'dental-pilot-20261028',
      business_name: 'Denticija (Testinė peržiūra - Tomas)',
      email: 'phengwey5@gmail.com',
      slug: 'denticija-vilnius',
      city: 'Vilnius',
      website: 'https://denticija.lt',
      notes: 'Tikrasis testinis gavėjas prieš siunčiant įstaigoms.'
    }
  ];

  const insert = sql.prepare(`INSERT OR IGNORE INTO campaign_leads 
    (id, campaign_id, business_name, email, slug, city, website, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready')`);

  for (const lead of pilotLeads) {
    insert.run(lead.id, lead.campaign_id, lead.business_name, lead.email.toLowerCase(), lead.slug, lead.city, lead.website, lead.notes);
  }
}

export function getCampaignLeads(campaignId?: string): CampaignLead[] {
  if (!campaignId || campaignId === 'all') {
    return getAllCampaignLeads();
  }
  return db().prepare('SELECT * FROM campaign_leads WHERE campaign_id=? ORDER BY (CASE WHEN replied_at IS NOT NULL THEN 4 WHEN click_count > 0 THEN 3 WHEN open_count > 0 THEN 2 ELSE 1 END) DESC, click_count DESC, open_count DESC, sent_at DESC').all(campaignId).map(row => ({...row})) as CampaignLead[];
}

export function getCampaignList(): { id: string; name: string; count: number }[] {
  const rows = db().prepare('SELECT campaign_id, count(*) as count FROM campaign_leads GROUP BY campaign_id').all() as { campaign_id: string; count: number }[];
  return rows.map(r => ({
    id: r.campaign_id,
    name: r.campaign_id === 'dental-pilot-20261028' ? 'Odontologijų pilotas (7)' :
          r.campaign_id === 'expansion-batch-25' ? '25 įmonių plėtra (25)' :
          r.campaign_id === 'vip-direct' ? 'VIP tiesioginiai (1)' : r.campaign_id,
    count: r.count
  }));
}

export function getAllCampaignLeads(): CampaignLead[] {
  return db().prepare('SELECT * FROM campaign_leads ORDER BY (CASE WHEN replied_at IS NOT NULL THEN 4 WHEN click_count > 0 THEN 3 WHEN open_count > 0 THEN 2 ELSE 1 END) DESC, click_count DESC, open_count DESC, sent_at DESC').all().map(row => ({...row})) as CampaignLead[];
}

export function getCampaignLead(id: string): CampaignLead | undefined {
  const row = db().prepare('SELECT * FROM campaign_leads WHERE id=?').get(id);
  return row ? ({...row} as CampaignLead) : undefined;
}

export function getCampaignLeadByEmail(email: string): CampaignLead | undefined {
  const row = db().prepare('SELECT * FROM campaign_leads WHERE LOWER(email)=LOWER(?)').get(email.trim());
  return row ? ({...row} as CampaignLead) : undefined;
}

export function getCampaignLeadBySlug(slug: string): CampaignLead | undefined {
  const row = db().prepare('SELECT * FROM campaign_leads WHERE slug=?').get(slug.trim());
  return row ? ({...row} as CampaignLead) : undefined;
}

export function upsertCampaignLead(lead: {
  id: string;
  campaign_id?: string;
  business_name: string;
  email: string;
  slug: string;
  city?: string;
  phone?: string;
  website?: string;
  notes?: string;
}) {
  const existing = getCampaignLeadByEmail(lead.email) || getCampaignLead(lead.id);
  if (existing) {
    db().prepare(`UPDATE campaign_leads SET
      business_name=?, slug=?, city=?, phone=?, website=?, notes=?, updated_at=(strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      WHERE id=?`).run(
      lead.business_name, lead.slug, lead.city || 'Vilnius', lead.phone || '', lead.website || '', lead.notes || '', existing.id
    );
    return getCampaignLead(existing.id)!;
  }
  db().prepare(`INSERT INTO campaign_leads 
    (id, campaign_id, business_name, email, slug, city, phone, website, notes)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
    lead.id, lead.campaign_id || 'dental-pilot-20261028', lead.business_name, lead.email.toLowerCase(), lead.slug, lead.city || 'Vilnius', lead.phone || '', lead.website || '', lead.notes || ''
  );
  return getCampaignLead(lead.id)!;
}

export function recordLeadSent(leadId: string) {
  const now = new Date().toISOString();
  db().prepare(`UPDATE campaign_leads SET
    status = CASE WHEN status = 'ready' THEN 'sent' ELSE status END,
    sent_at = COALESCE(sent_at, ?),
    updated_at = ?
    WHERE id=?`).run(now, now, leadId);
  db().prepare(`INSERT INTO campaign_events (id, lead_id, event_type, details) VALUES (?, ?, 'sent', ?)`).run(
    randomUUID(), leadId, JSON.stringify({ timestamp: now })
  );
}

export function recordLeadOpen(leadId: string, ip?: string, ua?: string) {
  const now = new Date().toISOString();
  db().prepare(`UPDATE campaign_leads SET
    status = CASE WHEN status IN ('ready', 'sent') THEN 'opened' ELSE status END,
    opened_at = COALESCE(opened_at, ?),
    open_count = open_count + 1,
    updated_at = ?
    WHERE id=?`).run(now, now, leadId);
  db().prepare(`INSERT INTO campaign_events (id, lead_id, event_type, ip, user_agent) VALUES (?, ?, 'open', ?, ?)`).run(
    randomUUID(), leadId, ip || null, ua || null
  );
}

export function recordLeadClick(leadId: string, targetUrl: string, ip?: string, ua?: string) {
  const now = new Date().toISOString();
  db().prepare(`UPDATE campaign_leads SET
    status = CASE WHEN status IN ('ready', 'sent', 'opened') THEN 'clicked' ELSE status END,
    clicked_at = COALESCE(clicked_at, ?),
    click_count = click_count + 1,
    last_clicked_url = ?,
    updated_at = ?
    WHERE id=?`).run(now, targetUrl, now, leadId);
  db().prepare(`INSERT INTO campaign_events (id, lead_id, event_type, details, ip, user_agent) VALUES (?, ?, 'click', ?, ?, ?)`).run(
    randomUUID(), leadId, targetUrl, ip || null, ua || null
  );
}

export function recordLeadReply(email: string, replyText: string) {
  const lead = getCampaignLeadByEmail(email);
  const now = new Date().toISOString();
  if (lead) {
    db().prepare(`UPDATE campaign_leads SET
      status = CASE WHEN status != 'converted' THEN 'replied' ELSE status END,
      replied_at = ?,
      last_reply_text = ?,
      updated_at = ?
      WHERE id=?`).run(now, replyText, now, lead.id);
    db().prepare(`INSERT INTO campaign_events (id, lead_id, event_type, details) VALUES (?, ?, 'reply', ?)`).run(
      randomUUID(), lead.id, replyText
    );
  }
}

export function recordLeadConversion(emailOrSlug: string) {
  const now = new Date().toISOString();
  const lead = getCampaignLeadByEmail(emailOrSlug) || getCampaignLeadBySlug(emailOrSlug);
  // Callers pass both email and slug; record each lead's conversion only once.
  if (lead && !lead.converted_at) {
    db().prepare(`UPDATE campaign_leads SET
      status = 'converted',
      converted_at = ?,
      updated_at = ?
      WHERE id=?`).run(now, now, lead.id);
    db().prepare(`INSERT INTO campaign_events (id, lead_id, event_type, details) VALUES (?, ?, 'conversion', ?)`).run(
      randomUUID(), lead.id, 'Paskyra aktyvuota / pradėtas 14 d. bandymas'
    );
  }
}

// Demo page opened with a valid claim token (campaign_events.event_type has a CHECK
// constraint, so demo views are stored as 'click' with details='demo_view').
export function recordDemoView(slug: string) {
  const lead = getCampaignLeadBySlug(slug);
  if (!lead) return;
  const now = new Date().toISOString();
  db().prepare(`UPDATE campaign_leads SET
    status = CASE WHEN status IN ('ready', 'sent', 'opened') THEN 'clicked' ELSE status END,
    clicked_at = COALESCE(clicked_at, ?), updated_at = ? WHERE id=?`).run(now, now, lead.id);
  db().prepare(`INSERT INTO campaign_events (id, lead_id, event_type, details) VALUES (?, ?, 'click', 'demo_view')`).run(randomUUID(), lead.id);
}

// Owner demo engagement (ROADMAP H6): what the prospect did on the demo page. Stored as
// campaign_events 'click' with details 'demo:{event}' (the table's CHECK allows no new types).
export const DEMO_EVENTS = ['star_good', 'star_care', 'private_sent', 'public_open', 'tab', 'ghost_done', 'cta'] as const;
export type DemoEventName = typeof DEMO_EVENTS[number];
export function recordDemoEvent(slug: string, event: DemoEventName) {
  const lead = getCampaignLeadBySlug(slug);
  if (!lead) return false;
  db().prepare(`INSERT INTO campaign_events (id, lead_id, event_type, details) VALUES (?, ?, 'click', ?)`).run(randomUUID(), lead.id, `demo:${event}`);
  return true;
}

// 2026-11-12 audit: prospects worth a phone call today – clicked the email, used the demo or replied.
// Demo actions ("demo:*") are real people: link scanners do not tap stars.
export type HotLead = { id: string; business_name: string; email: string; slug: string | null; status: string; sent_at: string;
  replied_at: string | null; last_reply_text: string | null; opens: number; clicks: number; demo_actions: number;
  last_at: string | null; phone: string | null; is_demo: number | null };
export function getHotLeads(limit = 40): HotLead[] {
  try {
    return db().prepare(`SELECT l.id, l.business_name, l.email, l.slug, l.status, l.sent_at, l.replied_at, l.last_reply_text,
        (SELECT COUNT(*) FROM campaign_events e WHERE e.lead_id = l.id AND e.event_type = 'open') AS opens,
        (SELECT COUNT(*) FROM campaign_events e WHERE e.lead_id = l.id AND e.event_type = 'click' AND COALESCE(e.details, '') NOT LIKE 'demo:%') AS clicks,
        (SELECT COUNT(*) FROM campaign_events e WHERE e.lead_id = l.id AND e.details LIKE 'demo:%') AS demo_actions,
        (SELECT MAX(e.created_at) FROM campaign_events e WHERE e.lead_id = l.id AND e.event_type IN ('click', 'reply')) AS last_at,
        c.phone, c.is_demo
      FROM campaign_leads l LEFT JOIN clients c ON c.slug = l.slug
      WHERE l.sent_at IS NOT NULL AND l.email NOT LIKE '%.invalid'
        AND (l.replied_at IS NOT NULL OR EXISTS (SELECT 1 FROM campaign_events e WHERE e.lead_id = l.id AND e.event_type = 'click'))
      ORDER BY COALESCE(l.replied_at, last_at, l.sent_at) DESC LIMIT ?`).all(limit) as unknown as HotLead[];
  } catch { return []; }
}

/** Owner's own test accounts (research --to profiles, .invalid record emails): never counted as real clients. */
export function isTestAccount(c: { slug: string; email: string }) {
  return /\.invalid$/i.test(c.email) || /-(testas|bandymas)(-|$)/.test(c.slug);
}

// Etapas N9: outbound campaigns grouped by company (table written by core/company_groups.py).
export type CompanyCampaign = { company_key: string; name: string; agent_id: string | null; root_slug: string | null; status: string;
  reason: string | null; members: { email: string; business_name: string; city: string; slug: string }[]; contacted: string[]; updated_at: string };
export function getCompanyCampaigns(limit = 200): CompanyCampaign[] {
  db().exec(`CREATE TABLE IF NOT EXISTS campaign_companies (company_key TEXT PRIMARY KEY, name TEXT NOT NULL, agent_id TEXT, root_client_id TEXT,
    members TEXT NOT NULL DEFAULT '[]', contacted TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT 'active', reason TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`);
  return db().prepare(`SELECT k.*, c.slug AS root_slug FROM campaign_companies k LEFT JOIN clients c ON c.id=k.root_client_id
    ORDER BY k.updated_at DESC LIMIT ?`).all(limit).map((r) => ({
      company_key: String(r.company_key), name: String(r.name), agent_id: (r.agent_id as string | null) ?? null,
      root_slug: (r.root_slug as string | null) ?? null, status: String(r.status), reason: (r.reason as string | null) ?? null,
      members: JSON.parse(String(r.members || '[]')), contacted: JSON.parse(String(r.contacted || '[]')), updated_at: String(r.updated_at),
    }));
}
export function setCompanyCampaignStatus(key: string, status: 'active' | 'stopped') {
  getCompanyCampaigns(1);
  return Number(db().prepare(`UPDATE campaign_companies SET status=?, reason=?, updated_at=? WHERE company_key=?`)
    .run(status, status === 'stopped' ? 'savininkas sustabdė' : 'savininkas tęsia', new Date().toISOString(), key).changes) > 0;
}

export function getClientByEmail(email: string) {
  const row = db().prepare('SELECT * FROM clients WHERE email=?').get(email.trim().toLowerCase());
  return row ? toClient(row) : undefined;
}

export function getCampaignStats(campaignId?: string) {
  const leads = (!campaignId || campaignId === 'all') ? getAllCampaignLeads() : getCampaignLeads(campaignId);
  const total = leads.length;
  const sent = leads.filter(l => l.sent_at !== null).length;
  const opened = leads.filter(l => l.open_count > 0).length;
  const totalOpens = leads.reduce((sum, l) => sum + l.open_count, 0);
  const clicked = leads.filter(l => l.click_count > 0).length;
  const totalClicks = leads.reduce((sum, l) => sum + l.click_count, 0);
  const replied = leads.filter(l => l.replied_at !== null).length;
  const converted = leads.filter(l => l.converted_at !== null).length;

  return {
    total,
    sent,
    opened,
    totalOpens,
    openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
    clicked,
    totalClicks,
    ctr: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
    clickToOpenRate: opened > 0 ? Math.round((clicked / opened) * 100) : 0,
    replied,
    replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
    converted,
    conversionRate: sent > 0 ? Math.round((converted / sent) * 100) : 0
  };
}

export function getCampaignEvents(limit = 100) {
  return db().prepare(`
    SELECT e.*, l.business_name, l.email, l.slug 
    FROM campaign_events e 
    JOIN campaign_leads l ON e.lead_id = l.id 
    ORDER BY e.created_at DESC 
    LIMIT ?
  `).all(limit).map(row => ({...row})) as (CampaignEvent & { business_name: string; email: string; slug: string })[];
}

// --- REVIVELEADS (DATABASE REACTIVATION) MODULE ---

export function seedReviveDemoDataIfEmpty(clientId: string) {
  const count = (db().prepare('SELECT COUNT(*) as count FROM revive_contacts WHERE client_id=?').get(clientId) as { count: number }).count;
  if (count > 0) return;

  const now = new Date();
  const sampleContacts = [
    {
      name: 'Laura Kazlauskaitė',
      phone: '+370 612 34567',
      email: 'laura.k@gmail.com',
      last_visit: 'Prieš 8 mėn.',
      service_history: 'Profesionali burnos higiena',
      status: 'booked',
      notes: 'Užsiregistravo higienai po 1-os SMS žinutės'
    },
    {
      name: 'Mantas Jankauskas',
      phone: '+370 655 89123',
      email: 'mantas.j@inbox.lt',
      last_visit: 'Prieš 11 mėn.',
      service_history: 'Profilaktinė apžiūra ir plombavimas',
      status: 'replied',
      notes: 'Teiraujasi laisvų laikų antradienį po 17:00'
    },
    {
      name: 'Rasa Petraitienė',
      phone: '+370 687 45210',
      email: 'rasa.petraitiene@gmail.com',
      last_visit: 'Prieš 9 mėn.',
      service_history: 'Dantų balinimas & higiena',
      status: 'booked',
      notes: 'Patvirtino vizitą penktadieniui 11:00'
    },
    {
      name: 'Tomas Vaitkus',
      phone: '+370 699 12345',
      email: 'tomas.vaitkus@outlook.com',
      last_visit: 'Prieš 7 mėn.',
      service_history: 'Kanalų gydymas',
      status: 'contacted',
      notes: 'SMS išsiųsta, laukiama atsakymo'
    },
    {
      name: 'Eglė Balčiūnaitė',
      phone: '+370 621 78901',
      email: 'egle.bal@gmail.com',
      last_visit: 'Prieš 14 mėn.',
      service_history: 'Estetinis plombavimas',
      status: 'pending',
      notes: 'Sąraše sekančiam SMS etapui'
    },
    {
      name: 'Andrius Žukauskas',
      phone: '+370 670 99881',
      email: 'andrius.zuk@delfi.lt',
      last_visit: 'Prieš 10 mėn.',
      service_history: 'Protezavimo konsultacija',
      status: 'booked',
      notes: 'Rezervavo konsultaciją pirmadieniui 15:00'
    },
    {
      name: 'Simona Dambrauskaitė',
      phone: '+370 644 11223',
      email: 'simona.dam@gmail.com',
      last_visit: 'Prieš 6 mėn.',
      service_history: 'Profilaktinis patikrinimas',
      status: 'replied',
      notes: 'Paprašė paskambinti registratūrai'
    }
  ];

  const stmt = db().prepare(`
    INSERT INTO revive_contacts (id, client_id, name, phone, email, last_visit, service_history, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdContactIds: string[] = [];
  for (const c of sampleContacts) {
    const id = randomUUID();
    createdContactIds.push(id);
    stmt.run(id, clientId, c.name, c.phone, c.email, c.last_visit, c.service_history, c.status, c.notes);
  }

  // Seed sample reactivation campaign
  const campaignId = randomUUID();
  db().prepare(`
    INSERT INTO revive_campaigns (id, client_id, name, niche, template_type, message_template, sent_count, reply_count, booked_count, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    campaignId,
    clientId,
    'Profilaktinės higienos & apžiūros priminimas (Recall 6–12 mėn.)',
    'dental',
    'hygiene_recall',
    'Sveiki, {vardas}! Pastebėjome, kad nuo paskutinio Jūsų profilaktinio vizito praėjo daugiau nei 6 mėn. Ar norėtumėte rezervuoti patogų laiką higienai šią ar kitą savaitę? Turime laisvų vietų ketvirtadienį.',
    62,
    19,
    8,
    'active'
  );

  // Seed bookings
  const bookingStmt = db().prepare(`
    INSERT INTO revive_bookings (id, client_id, contact_id, booking_time, service_name, estimated_revenue, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (createdContactIds[0]) {
    bookingStmt.run(randomUUID(), clientId, createdContactIds[0], 'Rytoj, 17:30', 'Profesionali burnos higiena', 85, 'confirmed', 'Automatinė DI rezervacija');
  }
  if (createdContactIds[2]) {
    bookingStmt.run(randomUUID(), clientId, createdContactIds[2], 'Penktadienis, 11:00', 'Konsultacija ir profilaktika', 95, 'confirmed', 'Automatinė DI rezervacija');
  }
  if (createdContactIds[5]) {
    bookingStmt.run(randomUUID(), clientId, createdContactIds[5], 'Pirmadienis, 15:00', 'Protezavimo konsultacija', 120, 'confirmed', 'Automatinė DI rezervacija');
  }
}

export function getReviveContacts(clientId: string): ReviveContact[] {
  seedReviveDemoDataIfEmpty(clientId);
  return db().prepare('SELECT * FROM revive_contacts WHERE client_id=? ORDER BY created_at DESC').all(clientId).map(r => ({...r})) as ReviveContact[];
}

export function getReviveCampaigns(clientId: string): ReviveCampaign[] {
  seedReviveDemoDataIfEmpty(clientId);
  return db().prepare('SELECT * FROM revive_campaigns WHERE client_id=? ORDER BY created_at DESC').all(clientId).map(r => ({...r})) as ReviveCampaign[];
}

export function getReviveBookings(clientId: string): (ReviveBooking & { contact_name: string; contact_phone: string })[] {
  seedReviveDemoDataIfEmpty(clientId);
  return db().prepare(`
    SELECT b.*, c.name as contact_name, c.phone as contact_phone
    FROM revive_bookings b
    JOIN revive_contacts c ON b.contact_id = c.id
    WHERE b.client_id = ?
    ORDER BY b.created_at DESC
  `).all(clientId).map(r => ({...r})) as (ReviveBooking & { contact_name: string; contact_phone: string })[];
}

export function getReviveStats(clientId: string): ReviveStats {
  seedReviveDemoDataIfEmpty(clientId);
  const contacts = getReviveContacts(clientId);
  const bookings = getReviveBookings(clientId);
  const campaigns = getReviveCampaigns(clientId);

  const totalContacts = contacts.length;
  const contactedCount = contacts.filter(c => c.status !== 'pending').length;
  const replyCount = contacts.filter(c => c.status === 'replied' || c.status === 'booked').length;
  const bookedCount = bookings.length;
  const estimatedRevenue = bookings.reduce((sum, b) => sum + (Number(b.estimated_revenue) || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  const replyRate = contactedCount > 0 ? Math.round((replyCount / contactedCount) * 100) : 0;
  const bookingRate = contactedCount > 0 ? Math.round((bookedCount / contactedCount) * 100) : 0;

  return {
    totalContacts,
    contactedCount,
    replyCount,
    replyRate,
    bookedCount,
    bookingRate,
    estimatedRevenue,
    activeCampaigns
  };
}

export function addReviveContact(input: {
  clientId: string;
  name: string;
  phone: string;
  email?: string;
  last_visit?: string;
  service_history?: string;
  notes?: string;
}) {
  const id = randomUUID();
  db().prepare(`
    INSERT INTO revive_contacts (id, client_id, name, phone, email, last_visit, service_history, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    id,
    input.clientId,
    input.name.trim(),
    input.phone.trim(),
    input.email?.trim() || '',
    input.last_visit?.trim() || '',
    input.service_history?.trim() || '',
    input.notes?.trim() || ''
  );
  return id;
}

export function bulkAddReviveContacts(
  clientId: string,
  contacts: { name: string; phone: string; email?: string; last_visit?: string; service_history?: string }[]
) {
  let imported = 0;
  let rejected = 0;
  const stmt = db().prepare(`
    INSERT INTO revive_contacts (id, client_id, name, phone, email, last_visit, service_history, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', '')
  `);

  for (const c of contacts) {
    if (!c.name || !c.phone || c.name.length < 2 || c.phone.length < 5) {
      rejected++;
      continue;
    }
    stmt.run(
      randomUUID(),
      clientId,
      c.name.trim(),
      c.phone.trim(),
      c.email?.trim() || '',
      c.last_visit?.trim() || '',
      c.service_history?.trim() || ''
    );
    imported++;
  }
  return { imported, rejected };
}

export function createReviveCampaign(input: {
  clientId: string;
  name: string;
  niche: string;
  template_type: string;
  message_template: string;
}) {
  const id = randomUUID();
  db().prepare(`
    INSERT INTO revive_campaigns (id, client_id, name, niche, template_type, message_template, sent_count, reply_count, booked_count, status)
    VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 'active')
  `).run(
    id,
    input.clientId,
    input.name.trim(),
    input.niche.trim(),
    input.template_type.trim(),
    input.message_template.trim()
  );
  return id;
}

export function addReviveBooking(input: {
  clientId: string;
  contactId: string;
  bookingTime: string;
  serviceName: string;
  estimatedRevenue: number;
  notes?: string;
}) {
  const id = randomUUID();
  db().prepare(`
    INSERT INTO revive_bookings (id, client_id, contact_id, booking_time, service_name, estimated_revenue, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?)
  `).run(
    id,
    input.clientId,
    input.contactId,
    input.bookingTime.trim(),
    input.serviceName.trim(),
    input.estimatedRevenue,
    input.notes?.trim() || ''
  );

  // Update contact status to booked
  db().prepare("UPDATE revive_contacts SET status='booked', updated_at=(strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE id=?").run(input.contactId);
  return id;
}

export function updateReviveContactStatus(contactId: string, status: 'pending' | 'contacted' | 'replied' | 'booked' | 'opt_out') {
  db().prepare("UPDATE revive_contacts SET status=?, updated_at=(strftime('%Y-%m-%dT%H:%M:%fZ','now')) WHERE id=?").run(status, contactId);
}

export function closeDb() { singleton?.close(); singleton = undefined; }
