import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { db, closeDb, createClient, getClientById } from '../src/lib/db.ts';
import { authenticateClinic } from '../src/lib/clinic-access.ts';
import { claimClient, claimTokenClient, issueClaimToken, maskEmail } from '../src/lib/claim.ts';
import { isDirectReviewUrl, usableReviewUrl } from '../src/lib/validation.ts';

const dir = mkdtempSync(join(tmpdir(), 'rp-claim-'));
process.env.DATABASE_PATH = join(dir, 'claim.db'); process.env.DEMO_MODE = 'false';
after(() => { closeDb(); rmSync(dir, { recursive: true, force: true }); });

const GOOGLE = 'https://search.google.com/local/writereview?placeid=ChIJtest';

test('demo profile is claimed once with its token and becomes a verified 14-day trial', () => {
  const demo = createClient({ business_name: 'Lead Klinika', email: 'lead@example.test', slug: 'lead-klinika', google_review_url: GOOGLE }, true);
  db().prepare('INSERT INTO review_events(id,client_id,rating) VALUES (?,?,?)').run(randomUUID(), demo.id, 2);
  assert.equal(authenticateClinic(demo.email, 'whatever-password'), null, 'demo cannot log in');

  const token = issueClaimToken(demo.id);
  assert.equal(claimTokenClient(token)?.id, demo.id);
  assert.equal(claimTokenClient('x'.repeat(30)), null);

  const weak = claimClient(token, 'short');
  assert.equal(weak.ok, false);
  assert.equal(getClientById(demo.id)?.is_demo, 1, 'failed claim changes nothing');

  const result = claimClient(token, 'claimed-password-123');
  assert.equal(result.ok, true);
  const claimed = getClientById(demo.id)!;
  assert.equal(claimed.is_demo, 0);
  assert.equal(claimed.subscription_status, 'trialing');
  assert.ok(new Date(claimed.trial_ends_at!).getTime() > Date.now() + 13 * 86400000);
  assert.equal(authenticateClinic(demo.email, 'claimed-password-123'), demo.id, 'claimed owner can log in');
  const events = db().prepare('SELECT COUNT(*) n FROM review_events WHERE client_id=?').get(demo.id) as { n: number };
  assert.equal(events.n, 0, 'demo clicks are not reported as real ratings');

  const again = claimClient(token, 'another-password-123');
  assert.equal(again.ok, false, 'token is single-use');
  assert.equal(authenticateClinic(demo.email, 'another-password-123'), null);
});

test('tokens never work for real clients, after expiry, or with a foreign Google URL', () => {
  const real = createClient({ business_name: 'Real', email: 'real@example.test', slug: 'real-client', google_review_url: GOOGLE, subscription_status: 'active' });
  const realToken = issueClaimToken(real.id);
  assert.equal(claimTokenClient(realToken), null);
  assert.equal(claimClient(realToken, 'takeover-password-1').ok, false);
  assert.equal(getClientById(real.id)?.subscription_status, 'active');

  const demo = createClient({ business_name: 'Expired', email: 'expired@example.test', slug: 'expired-demo', google_review_url: GOOGLE }, true);
  const expired = issueClaimToken(demo.id, -1000);
  assert.equal(claimTokenClient(expired), null);

  const fresh = issueClaimToken(demo.id);
  const bad = claimClient(fresh, 'valid-password-123', 'https://evil.example/review');
  assert.equal(bad.ok, false);
  assert.equal(getClientById(demo.id)?.is_demo, 1);
});

test('owner can choose a different login email while claiming, but not one used by another client', () => {
  createClient({ business_name: 'Taken', email: 'taken@example.test', slug: 'taken-client', google_review_url: GOOGLE, subscription_status: 'active' });
  const demo = createClient({ business_name: 'Shop', email: 'info@shop.example.test', slug: 'shop-demo', google_review_url: GOOGLE }, true);
  const token = issueClaimToken(demo.id);

  const clash = claimClient(token, 'shop-password-123', undefined, 'taken@example.test');
  assert.equal(clash.ok, false);
  assert.equal(getClientById(demo.id)?.is_demo, 1, 'failed claim changes nothing');
  assert.equal(claimClient(token, 'shop-password-123', undefined, 'not-an-email').ok, false);

  const result = claimClient(token, 'shop-password-123', undefined, 'Owner@Personal.example.test');
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.previousEmail, 'info@shop.example.test');
  assert.equal(getClientById(demo.id)?.email, 'owner@personal.example.test');
  assert.equal(authenticateClinic('owner@personal.example.test', 'shop-password-123'), demo.id);
  assert.equal(authenticateClinic('info@shop.example.test', 'shop-password-123'), null);
});

test('helpers: masked email and direct review link detection', () => {
  assert.equal(maskEmail('info@klinika.lt'), 'i***@klinika.lt');
  assert.equal(isDirectReviewUrl(GOOGLE), true);
  assert.equal(isDirectReviewUrl('https://g.page/r/CabcDEF/review'), true);
  assert.equal(isDirectReviewUrl('https://www.google.com/maps/search/?api=1&query=x'), false);
  assert.equal(isDirectReviewUrl('https://search.google.com/local/writereview?q=x'), false);
  // Broken legacy fallback (Google answers 400) is replaced by a Maps search; valid links are untouched.
  assert.equal(usableReviewUrl('https://search.google.com/local/writereview?q=Klinika%20Vilnius', 'Klinika'), 'https://www.google.com/maps/search/?api=1&query=Klinika%20Vilnius');
  assert.equal(usableReviewUrl(GOOGLE, 'Klinika'), GOOGLE);
  const broken = createClient({ business_name: 'Broken Link', email: 'broken@example.test', slug: 'broken-link', google_review_url: 'https://search.google.com/local/writereview?q=Broken' }, true);
  assert.ok(getClientById(broken.id)!.google_review_url.startsWith('https://www.google.com/maps/search/'));
});
