import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  archiveBranch, closeDb, createBranch, createClient, db, getActivatedClients, getBranches, getClientById, getLocationStats,
  isPlaceholderEmail, updateBranch,
} from '../src/lib/db.ts';
import { canAccessClient } from '../src/lib/clinic-access.ts';
import { canCollectFeedback } from '../src/lib/entitlements.ts';
import { branchSchema, notifyRecipients } from '../src/lib/validation.ts';

// Branches (filialai), 2026-11-11.
const dir = mkdtempSync(join(tmpdir(), 'rp-branches-'));
process.env.DATABASE_PATH = join(dir, 'branches.db'); process.env.DEMO_MODE = 'false';
after(() => { closeDb(); rmSync(dir, { recursive: true, force: true }); });

const trial = new Date(Date.now() + 10 * 86400000).toISOString();
const rootA = () => createClient({ business_name: 'Denta', email: `denta-${randomUUID().slice(0, 6)}@example.test`, slug: `denta-${randomUUID().slice(0, 6)}`, google_review_url: 'https://g.page/r/a/review', subscription_status: 'trialing', trial_ends_at: trial });

test('a branch copies the account plan, gets a unique page address and a placeholder email', () => {
  const root = rootA();
  const b1 = createBranch(root, { business_name: 'Denta Kaunas', location_label: 'Kaunas', google_review_url: 'https://g.page/r/k/review' });
  const b2 = createBranch(root, { business_name: 'Denta Kaunas', google_review_url: 'https://g.page/r/k2/review' });
  assert.equal(b1.parent_id, root.id);
  assert.equal(b1.subscription_status, 'trialing');
  assert.equal(b1.trial_ends_at, trial);
  assert.equal(b1.is_demo, 0);
  assert.notEqual(b1.slug, b2.slug, 'slugs are unique');
  assert.ok(isPlaceholderEmail(b1.email));
  assert.deepEqual(getBranches(root.id).map((b) => b.id), [b1.id, b2.id]);
  assert.throws(() => createBranch(b1, { business_name: 'Nested', google_review_url: 'https://g.page/r/n/review' }), /branch/);
});

test('a login manages its own branches only', () => {
  const a = rootA(), b = rootA();
  const branchA = createBranch(a, { business_name: 'A Vilnius', google_review_url: 'https://g.page/r/av/review' });
  const branchB = createBranch(b, { business_name: 'B Vilnius', google_review_url: 'https://g.page/r/bv/review' });
  const loginA = { role: 'clinic' as const, clientId: a.id };
  assert.equal(canAccessClient(loginA, a.id), true);
  assert.equal(canAccessClient(loginA, branchA.id), true);
  assert.equal(canAccessClient(loginA, branchB.id), false, 'never another account');
  assert.equal(canAccessClient(loginA, b.id), false);
  assert.equal(canAccessClient({ role: 'clinic', clientId: branchA.id }, a.id), false, 'a branch is not a login for its parent');
});

test('a branch collects only while the account may, and stops when archived', () => {
  const root = rootA();
  const branch = createBranch(root, { business_name: 'Denta Klaipėda', google_review_url: 'https://g.page/r/kl/review' });
  assert.equal(canCollectFeedback(getClientById(branch.id)!), true);
  db().prepare("UPDATE clients SET subscription_status='canceled', trial_ends_at=NULL WHERE id=?").run(root.id);
  db().prepare("UPDATE clients SET subscription_status='trialing' WHERE id=?").run(branch.id); // stale copy must not matter
  assert.equal(canCollectFeedback(getClientById(branch.id)!), false, 'follows the main profile');
  db().prepare("UPDATE clients SET subscription_status='trialing', trial_ends_at=? WHERE id=?").run(trial, root.id);
  assert.equal(archiveBranch(branch.id), true);
  assert.equal(canCollectFeedback(getClientById(branch.id)!), false, 'archived');
  assert.equal(getBranches(root.id).length, 0);
  assert.equal(archiveBranch(root.id), false, 'a main profile cannot be archived as a branch');
});

test('branch notes reach the account email, the branch email and its extra addresses', () => {
  const root = rootA();
  const branch = createBranch(root, { business_name: 'Denta Šiauliai', google_review_url: 'https://g.page/r/s/review' });
  assert.deepEqual(notifyRecipients(branch, root), [root.email], 'placeholder is never emailed');
  const withEmail = updateBranch(branch, { business_name: 'Denta Šiauliai', google_review_url: branch.google_review_url, email: 'Siauliai@Example.test' });
  db().prepare("UPDATE clients SET notify_emails='registratura@example.test' WHERE id=?").run(branch.id);
  assert.deepEqual(notifyRecipients(getClientById(withEmail.id)!, root), [root.email, 'siauliai@example.test', 'registratura@example.test']);
  const cleared = updateBranch(getClientById(branch.id)!, { business_name: 'Denta Šiauliai', google_review_url: branch.google_review_url, email: '' });
  assert.ok(isPlaceholderEmail(cleared.email), 'clearing the email returns to a placeholder');
});

test('dashboard and owner overview list locations per account', () => {
  const root = rootA();
  db().prepare('INSERT INTO clinic_email_verifications(client_id, verified_at) VALUES (?, ?)').run(root.id, Date.now());
  const branch = createBranch(root, { business_name: 'Denta Panevėžys', location_label: 'Panevėžys', google_review_url: 'https://g.page/r/p/review' });
  db().prepare('INSERT INTO review_events(id, client_id, rating) VALUES (?, ?, 5)').run(randomUUID(), branch.id);
  const stats = getLocationStats(root.id);
  assert.equal(stats[0].id, root.id); assert.equal(stats[0].is_root, true);
  assert.equal(stats[1].ratings, 1); assert.equal(stats[1].location_label, 'Panevėžys');
  const rows = getActivatedClients();
  assert.ok(!rows.some((r) => r.id === branch.id), 'branches are not separate accounts');
  assert.equal(rows.find((r) => r.id === root.id)!.branches[0].ratings, 1);
});

test('branch form validation normalises the review link and allows an empty email', () => {
  const ok = branchSchema.safeParse({ business_name: 'Ergonomic.lt Kaunas', google_review_url: 'https://rekvizitai.vz.lt/imone/a_z_prekyba/', email: '' });
  assert.equal(ok.success, true);
  assert.equal(ok.success && ok.data.google_review_url, 'https://rekvizitai.vz.lt/imone/a_z_prekyba/atsiliepimai/');
  assert.equal(branchSchema.safeParse({ business_name: 'X', google_review_url: 'https://g.page/r/x/review' }).success, false);
  assert.equal(branchSchema.safeParse({ business_name: 'Xx', google_review_url: 'https://evil.test/' }).success, false);
  assert.equal(branchSchema.safeParse({ business_name: 'Xx', google_review_url: 'https://g.page/r/x/review', email: 'ne-adresas' }).success, false);
});
