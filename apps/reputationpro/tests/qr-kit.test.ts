import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { db, closeDb, createClient, getSourceStats } from '../src/lib/db.ts';
import { channelLabel, channelUrl, cleanChannel, QR_CHANNELS } from '../src/lib/qr-channels.ts';

const dir = mkdtempSync(join(tmpdir(), 'rp-qrkit-'));
process.env.DATABASE_PATH = join(dir, 'qrkit.db'); process.env.DEMO_MODE = 'false';
after(() => { closeDb(); rmSync(dir, { recursive: true, force: true }); });

test('channel ids are whitelisted and become tracked links', () => {
  assert.equal(cleanChannel('kvitas'), 'kvitas');
  assert.equal(cleanChannel('<script>'), null);
  assert.equal(cleanChannel(undefined), null);
  assert.equal(channelUrl('https://reputacija.verslomatika.lt/', 'klinika', 'parasas'), 'https://reputacija.verslomatika.lt/r/klinika?s=parasas');
  assert.equal(channelUrl('https://reputacija.verslomatika.lt', 'klinika', null), 'https://reputacija.verslomatika.lt/r/klinika');
  assert.equal(channelLabel(null), 'Kita / be žymos');
  assert.equal(new Set(QR_CHANNELS.map((c) => c.id)).size, QR_CHANNELS.length);
});

test('ratings are counted per channel for the dashboard', () => {
  const c = createClient({ business_name: 'Kanalai', email: 'kanalai@example.test', slug: 'kanalai', google_review_url: 'https://search.google.com/local/writereview?placeid=X', subscription_status: 'trialing' });
  const add = (rating: number, source: string | null) => db().prepare('INSERT INTO review_events(id,client_id,rating,source) VALUES (?,?,?,?)').run(randomUUID(), c.id, rating, source);
  add(5, 'kvitas'); add(4, 'kvitas'); add(2, 'kvitas'); add(5, 'parasas'); add(5, null);
  const stats = getSourceStats(c.id);
  assert.deepEqual(stats[0], { source: 'kvitas', total: 3, positive: 2 });
  assert.ok(stats.some((s) => s.source === 'parasas' && s.total === 1));
  assert.ok(stats.some((s) => s.source === null && s.total === 1));
});
