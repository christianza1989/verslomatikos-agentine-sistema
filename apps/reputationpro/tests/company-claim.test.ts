import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID, createHash, randomBytes } from 'node:crypto';
import { closeDb, createClient, db, getClientById, archiveBranch, createBranch } from '../src/lib/db.ts';
import { claimClient } from '../src/lib/claim.ts';
import { authenticateClinic, canAccessClient } from '../src/lib/clinic-access.ts';
import { acceptBranchInvite, createBranchInvite, inviteBranch, revokeBranchAccess } from '../src/lib/branch-invite.ts';

// Etapas N: one activation = the whole company; branch managers get a login for their branch only.
const dir = mkdtempSync(join(tmpdir(), 'rp-company-'));
process.env.DATABASE_PATH = join(dir, 'company.db'); process.env.DEMO_MODE = 'false';
after(() => { closeDb(); rmSync(dir, { recursive: true, force: true }); });

function claimToken(clientId: string) {
  const token = randomBytes(24).toString('base64url');
  db().prepare('INSERT INTO claim_tokens(token_hash, client_id, expires_at, created_at) VALUES (?,?,?,?)')
    .run(createHash('sha256').update(token).digest('hex'), clientId, Date.now() + 86400000, Date.now());
  return token;
}
const uniq = () => randomUUID().slice(0, 6);

test('activating the main demo profile activates its demo branches and clears demo data', () => {
  const root = createClient({ business_name: 'Grupė', email: `info-${uniq()}@grupe.test`, slug: `grupe-${uniq()}`, google_review_url: 'https://g.page/r/g/review' }, true);
  const id = `pre-${uniq()}`;
  db().prepare(`INSERT INTO clients (id, slug, business_name, email, google_review_url, subscription_status, is_demo, parent_id, location_label)
    VALUES (?, ?, 'Grupė Kaunas', ?, 'https://g.page/r/k/review', 'demo_trial', 1, ?, 'Kaunas')`).run(id, `grupe-kaunas-${uniq()}`, `k-${uniq()}@filialai.invalid`, root.id);
  db().prepare('INSERT INTO review_events(id, client_id, rating) VALUES (?, ?, 5)').run(randomUUID(), id);
  const r = claimClient(claimToken(root.id), 'very-long-password');
  assert.equal(r.ok, true);
  const branch = getClientById(id)!;
  assert.equal(branch.is_demo, 0);
  assert.equal(branch.subscription_status, 'trialing');
  assert.equal((db().prepare('SELECT COUNT(*) n FROM review_events WHERE client_id=?').get(id) as { n: number }).n, 0, 'demo taps removed');
});

test('a branch manager invitation gives a login that sees only that branch', () => {
  const trial = new Date(Date.now() + 5 * 86400000).toISOString();
  const root = createClient({ business_name: 'Tinklas', email: `info-${uniq()}@tinklas.test`, slug: `tinklas-${uniq()}`, google_review_url: 'https://g.page/r/t/review', subscription_status: 'trialing', trial_ends_at: trial });
  db().prepare('INSERT INTO clinic_email_verifications(client_id, verified_at) VALUES (?, ?)').run(root.id, Date.now());
  const kaunas = createBranch(root, { business_name: 'Tinklas Kaunas', google_review_url: 'https://g.page/r/tk/review' });
  const vilnius = createBranch(root, { business_name: 'Tinklas Vilnius', google_review_url: 'https://g.page/r/tv/review' });
  const token = createBranchInvite(kaunas);
  assert.equal(inviteBranch(token)?.id, kaunas.id);
  assert.equal(acceptBranchInvite(token, root.email, 'very-long-password').ok, false, 'the account email cannot be taken');
  const mail = `kaunas-${uniq()}@tinklas.test`;
  const res = acceptBranchInvite(token, mail, 'very-long-password');
  assert.equal(res.ok, true);
  assert.equal(inviteBranch(token), undefined, 'one-time link');
  const login = authenticateClinic(mail, 'very-long-password');
  assert.equal(login, kaunas.id);
  const principal = { role: 'clinic' as const, clientId: login! };
  assert.equal(canAccessClient(principal, kaunas.id), true);
  assert.equal(canAccessClient(principal, vilnius.id), false, 'not other branches');
  assert.equal(canAccessClient(principal, root.id), false, 'not the main profile');
  db().prepare("UPDATE clients SET subscription_status='canceled', trial_ends_at=NULL WHERE id=?").run(root.id);
  assert.equal(authenticateClinic(mail, 'very-long-password'), null, 'follows the account subscription');
  db().prepare("UPDATE clients SET subscription_status='trialing', trial_ends_at=? WHERE id=?").run(trial, root.id);
  archiveBranch(kaunas.id);
  assert.equal(authenticateClinic(mail, 'very-long-password'), null, 'archived branch cannot log in');
  revokeBranchAccess(kaunas.id);
  assert.equal(db().prepare('SELECT 1 FROM clinic_credentials WHERE client_id=?').get(kaunas.id), undefined);
});
