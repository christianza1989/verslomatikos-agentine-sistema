// Branch manager invitations (ROADMAP N7, 2026-11-11). The account (main profile) creates a one-time
// link for one branch; the branch manager sets an email + password and gets a login that sees ONLY
// that branch (canAccessClient: principal.clientId === branch id, a branch has no children).
import { createHash, randomBytes } from 'node:crypto';
import { db, getClientById, type Client } from './db.ts';
import { setClinicPassword, validClinicPassword } from './clinic-access.ts';

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const hash = (t: string) => createHash('sha256').update(t).digest('hex');
const EMAIL_RE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[a-z]{2,}$/i;

function ensure() {
  db().exec(`CREATE TABLE IF NOT EXISTS branch_invites (
    token_hash TEXT PRIMARY KEY, client_id TEXT NOT NULL, expires_at INTEGER NOT NULL, used_at INTEGER,
    created_at INTEGER NOT NULL)`);
}

export function createBranchInvite(branch: Client) {
  if (!branch.parent_id || branch.archived_at) throw new Error('Not a branch');
  ensure();
  const token = randomBytes(24).toString('base64url');
  db().prepare('DELETE FROM branch_invites WHERE client_id=? AND used_at IS NULL').run(branch.id); // one open link per branch
  db().prepare('INSERT INTO branch_invites(token_hash, client_id, expires_at, created_at) VALUES (?,?,?,?)')
    .run(hash(token), branch.id, Date.now() + INVITE_TTL_MS, Date.now());
  return token;
}

export function inviteBranch(token: string | undefined): Client | undefined {
  if (!token || token.length < 20 || token.length > 100) return undefined;
  ensure();
  const row = db().prepare('SELECT client_id FROM branch_invites WHERE token_hash=? AND used_at IS NULL AND expires_at>?')
    .get(hash(token), Date.now()) as { client_id: string } | undefined;
  const branch = row ? getClientById(row.client_id) : undefined;
  return branch && branch.parent_id && !branch.archived_at ? branch : undefined;
}

export type AcceptResult = { ok: true; branch: Client } | { ok: false; status: number; error: string };
export function acceptBranchInvite(token: string, email: string, password: string): AcceptResult {
  const mail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(mail) || mail.length > 254) return { ok: false, status: 400, error: 'Patikrinkite el. pašto adresą.' };
  if (!validClinicPassword(password)) return { ok: false, status: 400, error: 'Slaptažodis turi būti bent 8 simbolių.' };
  const sql = db();
  sql.exec('BEGIN IMMEDIATE');
  try {
    const branch = inviteBranch(token);
    if (!branch) { sql.exec('ROLLBACK'); return { ok: false, status: 410, error: 'Pakvietimo nuoroda nebegalioja arba jau panaudota.' }; }
    if (sql.prepare('SELECT 1 FROM clients WHERE email=? AND id<>?').get(mail, branch.id)) {
      sql.exec('ROLLBACK'); return { ok: false, status: 409, error: 'Šis el. paštas jau naudojamas kitai paskyrai. Įveskite kitą adresą.' };
    }
    const now = Date.now();
    sql.prepare('UPDATE clients SET email=? WHERE id=?').run(mail, branch.id);
    setClinicPassword(branch.id, password);
    sql.prepare('INSERT OR REPLACE INTO clinic_email_verifications(client_id, verified_at) VALUES (?,?)').run(branch.id, now);
    sql.prepare('UPDATE branch_invites SET used_at=? WHERE client_id=? AND used_at IS NULL').run(now, branch.id);
    sql.exec('COMMIT');
    return { ok: true, branch: getClientById(branch.id)! };
  } catch (e) {
    sql.exec('ROLLBACK');
    throw e;
  }
}

/** Removes the branch manager's login (the branch itself and its data stay). */
export function revokeBranchAccess(branchId: string) {
  ensure();
  const sql = db();
  sql.prepare('DELETE FROM clinic_sessions WHERE client_id=?').run(branchId);
  sql.prepare('DELETE FROM clinic_credentials WHERE client_id=?').run(branchId);
  sql.prepare('DELETE FROM clinic_email_verifications WHERE client_id=?').run(branchId);
  sql.prepare('DELETE FROM branch_invites WHERE client_id=?').run(branchId);
}

export function hasBranchLogin(branchId: string) {
  return !!db().prepare('SELECT 1 FROM clinic_credentials WHERE client_id=?').get(branchId);
}
