// One-time claim tokens for pre-provisioned outbound leads (clients.is_demo=1).
//
// Flow (see ROADMAP_REPUTATIONPRO.md §1):
//   core/claim_tokens.py (or issueClaimToken below) stores sha256(token) in claim_tokens,
//   the raw token travels only inside the email link /r/{slug}?k={token} and /aktyvuoti/{token},
//   claimClient() upgrades the demo profile to a 14-day trial in a single transaction.
//
// The token proves control of the lead's mailbox, so the email is marked verified on claim.
import { createHash, randomBytes } from 'node:crypto';
import { db, getClientById, type Client } from './db.ts';
import { setClinicPassword, validClinicPassword } from './clinic-access.ts';
import { validGoogleUrl } from './validation.ts';

export const CLAIM_TTL_MS = 30 * 86400000;
export const TRIAL_MS = 14 * 86400000;
const TOKEN_RE = /^[A-Za-z0-9_-]{20,100}$/;
const hash = (token: string) => createHash('sha256').update(token).digest('hex');

export function issueClaimToken(clientId: string, ttlMs = CLAIM_TTL_MS) {
  const token = randomBytes(24).toString('base64url');
  const now = Date.now();
  db().prepare('INSERT INTO claim_tokens(token_hash,client_id,expires_at,created_at) VALUES (?,?,?,?)')
    .run(hash(token), clientId, now + ttlMs, now);
  return token;
}

/** Returns the demo client a valid, unused token belongs to, or null. */
export function claimTokenClient(token: string | undefined | null): Client | null {
  if (!token || !TOKEN_RE.test(token)) return null;
  const row = db().prepare('SELECT client_id FROM claim_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>?')
    .get(hash(token), Date.now()) as { client_id: string } | undefined;
  if (!row) return null;
  const client = getClientById(row.client_id);
  return client && client.is_demo === 1 ? client : null;
}

export type ClaimResult = { ok: true; client: Client; previousEmail: string | null } | { ok: false; status: number; error: string };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// newEmail: the owner may choose a different login email while claiming (e.g. a personal address
// instead of info@). The claimant proved control of the business mailbox via the token, so the new
// address is accepted; the route notifies the previous address about the change.
export function claimClient(token: string, password: string, googleReviewUrl?: string, newEmail?: string): ClaimResult {
  if (!validClinicPassword(password)) return { ok: false, status: 400, error: 'Slaptažodis turi būti bent 8 simbolių.' };
  const url = googleReviewUrl?.trim();
  if (url && !validGoogleUrl(url)) return { ok: false, status: 400, error: 'Įveskite HTTPS Google Maps atsiliepimų nuorodą.' };
  const email = newEmail?.trim().toLowerCase();
  if (email && (email.length > 254 || !EMAIL_RE.test(email))) return { ok: false, status: 400, error: 'Patikrinkite el. pašto adresą.' };
  const sql = db();
  sql.exec('BEGIN IMMEDIATE');
  try {
    const client = claimTokenClient(token);
    if (!client) { sql.exec('ROLLBACK'); return { ok: false, status: 410, error: 'Aktyvavimo nuoroda nebegalioja arba jau panaudota.' }; }
    const now = Date.now();
    const changeEmail = !!email && email !== client.email.toLowerCase();
    if (changeEmail && sql.prepare('SELECT 1 FROM clients WHERE email=? AND id<>?').get(email, client.id)) {
      sql.exec('ROLLBACK');
      return { ok: false, status: 409, error: 'Šis el. paštas jau naudojamas kitai paskyrai. Įveskite kitą adresą.' };
    }
    const updated = sql.prepare(`UPDATE clients SET subscription_status='trialing', is_demo=0, trial_ends_at=?,
        google_review_url=COALESCE(?, google_review_url) WHERE id=? AND is_demo=1`)
      .run(new Date(now + TRIAL_MS).toISOString(), url || null, client.id);
    if (!updated.changes) { sql.exec('ROLLBACK'); return { ok: false, status: 409, error: 'Ši paskyra jau aktyvuota. Prisijunkite.' }; }
    if (changeEmail) sql.prepare('UPDATE clients SET email=? WHERE id=?').run(email, client.id);
    setClinicPassword(client.id, password);
    sql.prepare('INSERT OR REPLACE INTO clinic_email_verifications(client_id,verified_at) VALUES (?,?)').run(client.id, now);
    sql.prepare('UPDATE claim_tokens SET used_at=? WHERE client_id=? AND used_at IS NULL').run(now, client.id);
    sql.prepare('DELETE FROM clinic_sessions WHERE client_id=?').run(client.id);
    // Ratings clicked while the prospect explored the demo are not real customer data.
    sql.prepare('DELETE FROM review_events WHERE client_id=?').run(client.id);
    sql.prepare('DELETE FROM internal_feedback WHERE client_id=?').run(client.id);
    sql.exec('COMMIT');
    return { ok: true, client: getClientById(client.id)!, previousEmail: changeEmail ? client.email : null };
  } catch (error) {
    sql.exec('ROLLBACK');
    throw error;
  }
}

/** j***@domenas.lt: enough for the owner to recognise the mailbox, useless for harvesting. */
export function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!domain) return '***';
  return `${user.slice(0, 1)}***@${domain}`;
}
