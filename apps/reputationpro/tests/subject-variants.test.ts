import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { closeDb, createClient, db, getSubjectVariantStats, SUBJECT_MIN_SAMPLE } from '../src/lib/db.ts';

// ROADMAP C5: subject A/B/C results for the owner panel (/admin/klientai).
const dir = mkdtempSync(join(tmpdir(), 'rp-subjects-'));
process.env.DATABASE_PATH = join(dir, 'subjects.db'); process.env.DEMO_MODE = 'false';
after(() => { closeDb(); rmSync(dir, { recursive: true, force: true }); });

function lead(variant: string | null, opts: { opened?: boolean; clicked?: boolean; activatedSlug?: string } = {}) {
  const id = randomUUID();
  const slug = opts.activatedSlug ?? `lead-${id.slice(0, 8)}`;
  const now = new Date().toISOString();
  db().prepare(`INSERT INTO campaign_leads (id, campaign_id, business_name, email, slug, status, sent_at, opened_at, open_count, clicked_at, click_count)
    VALUES (?, 'test', 'Įmonė', ?, ?, 'sent', ?, ?, ?, ?, ?)`).run(id, `${id}@example.test`, slug, now,
    opts.opened ? now : null, opts.opened ? 1 : 0, opts.clicked ? now : null, opts.clicked ? 1 : 0);
  db().prepare(`INSERT INTO campaign_messages (id, lead_id, step, message_id, subject, sent_at, variant) VALUES (?, ?, 'E0', ?, 'Tema', ?, ?)`)
    .run(randomUUID(), id, `<${id}@t>`, now, variant);
  // A follow-up must not be counted as another send.
  db().prepare(`INSERT INTO campaign_messages (id, lead_id, step, message_id, subject, sent_at, variant) VALUES (?, ?, 'B1', ?, 'Re: Tema', ?, NULL)`)
    .run(randomUUID(), id, `<${id}-b1@t>`, now);
  return id;
}

test('variant column exists and stats group first emails by case × variant', () => {
  const cols = db().prepare('PRAGMA table_info(campaign_messages)').all().map((r) => String(r.name));
  assert.ok(cols.includes('variant'));

  const claimed = createClient({ business_name: 'Denta', email: `d-${randomUUID().slice(0, 6)}@example.test`, slug: `denta-${randomUUID().slice(0, 6)}`,
    google_review_url: 'https://g.page/r/a/review', subscription_status: 'trialing', trial_ends_at: new Date(Date.now() + 864e5).toISOString() });
  db().prepare('UPDATE clients SET is_demo=0 WHERE id=?').run(claimed.id);

  for (let i = 0; i < SUBJECT_MIN_SAMPLE; i++) lead('google_stats:A', { opened: i < 15, clicked: i < 3 });
  lead('google_stats:A', { opened: true, clicked: true, activatedSlug: claimed.slug });
  lead('no_google:B', { opened: true });
  lead(null); // researched / legacy messages without a variant are ignored

  const stats = getSubjectVariantStats();
  assert.equal(stats.length, 2);
  const a = stats.find((s) => s.case_key === 'google_stats' && s.variant === 'A')!;
  assert.equal(a.sent, SUBJECT_MIN_SAMPLE + 1);
  assert.equal(a.opened, 16);
  assert.equal(a.clicked, 4);
  assert.equal(a.activated, 1);
  assert.equal(a.enough, true);
  const b = stats.find((s) => s.case_key === 'no_google')!;
  assert.equal(b.sent, 1);
  assert.equal(b.enough, false);
});
