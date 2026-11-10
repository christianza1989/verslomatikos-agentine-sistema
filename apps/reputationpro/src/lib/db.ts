import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export type Client = {
  id: string; slug: string; business_name: string; email: string; phone: string;
  google_review_url: string; subscription_status: string; stripe_customer_id: string | null;
  stripe_subscription_id: string | null; created_at: string; trial_ends_at: string | null; is_demo: number;
  // Added 2026-11-05 (see ROADMAP_REPUTATIONPRO.md). Columns are created by ensureClientColumns().
  show_public_link_low: number; industry: string;
  google_place_id: string | null; google_rating: number | null; google_reviews_count: number | null;
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
];
function ensureClientColumns(sql: DatabaseSync) {
  const have = new Set(sql.prepare('PRAGMA table_info(clients)').all().map((row) => String(row.name)));
  for (const [name, definition] of CLIENT_COLUMNS) {
    if (have.has(name)) continue;
    try { sql.exec(`ALTER TABLE clients ADD COLUMN ${name} ${definition}`); }
    catch (error) { if (!/duplicate column/i.test(String(error))) throw error; }
  }
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
export function getClients() { return db().prepare('SELECT * FROM clients ORDER BY created_at DESC').all().map(row=>({...row})) as Client[]; }
export function getClient(slug: string) { const row=db().prepare('SELECT * FROM clients WHERE slug=?').get(slug);return row?{...row} as Client:undefined; }
export function getClientById(id: string) { const row=db().prepare('SELECT * FROM clients WHERE id=?').get(id);return row?{...row} as Client:undefined; }
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

export function getClientByEmail(email: string) {
  const row = db().prepare('SELECT * FROM clients WHERE email=?').get(email.trim().toLowerCase());
  return row ? { ...row } as Client : undefined;
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
