import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { db, closeDb, createClient, getActivatedClients, getStandOrder, saveStandOrder, setStandOrderStatus } from '../src/lib/db.ts';

const dir = mkdtempSync(join(tmpdir(), 'rp-stand-'));
process.env.DATABASE_PATH = join(dir, 'stand.db'); process.env.DEMO_MODE = 'false';
after(() => { closeDb(); rmSync(dir, { recursive: true, force: true }); });

const address = { recipient: 'Jonas Jonaitis', company: 'Stovelis UAB', phone: '+370 600 00000', street: 'Gedimino pr. 1-2', city: 'Vilnius', postal_code: 'LT-01103', notes: '', quantity: 1 };

test('a client orders a free stand, edits the address while waiting, cannot change it after shipping', () => {
  const c = createClient({ business_name: 'Stovelis', email: 'stovelis@example.test', slug: 'stovelis', google_review_url: 'https://g.page/r/x/review', subscription_status: 'trialing' });
  const first = saveStandOrder(c.id, address);
  assert.equal(first.created, true);
  assert.equal(first.order!.status, 'requested');
  assert.match(first.order!.delivery_address, /Stovelis UAB, Jonas Jonaitis, Gedimino pr\. 1-2, LT-01103 Vilnius/);

  const edit = saveStandOrder(c.id, { ...address, street: 'Konstitucijos pr. 7', quantity: 2 });
  assert.equal(edit.created, false, 'same order is updated, not duplicated');
  assert.equal(edit.order!.id, first.order!.id);
  assert.equal(edit.order!.quantity, 2);
  assert.equal((db().prepare('SELECT COUNT(*) n FROM stand_orders WHERE client_id=?').get(c.id) as { n: number }).n, 1);

  assert.equal(setStandOrderStatus(first.order!.id, 'sent'), true);
  assert.ok(getStandOrder(c.id)!.sent_at);
  assert.equal(saveStandOrder(c.id, address).error, 'already_sent');
  assert.equal(setStandOrderStatus('missing', 'sent'), false);

  // After a cancellation the client may order again (a new row).
  setStandOrderStatus(first.order!.id, 'canceled');
  assert.equal(saveStandOrder(c.id, address).created, true);
});

test('owner overview lists only activated accounts, with their stand order', () => {
  const demo = createClient({ business_name: 'Demo', email: 'demo@example.test', slug: 'demo-x', google_review_url: 'https://g.page/r/y/review' }, true);
  const real = createClient({ business_name: 'Tikras', email: 'tikras@example.test', slug: 'tikras', google_review_url: 'https://g.page/r/z/review', subscription_status: 'trialing' });
  db().prepare('INSERT INTO clinic_email_verifications(client_id, verified_at) VALUES (?, ?)').run(real.id, Date.now());
  saveStandOrder(real.id, address);
  const rows = getActivatedClients();
  assert.ok(!rows.some((r) => r.id === demo.id), 'demo profiles are not listed');
  const row = rows.find((r) => r.id === real.id)!;
  assert.equal(row.order?.status, 'requested');
  assert.ok(row.activated_at);
});
