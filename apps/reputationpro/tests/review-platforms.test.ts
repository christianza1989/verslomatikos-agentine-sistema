import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLATFORM_COPY, platformCopy, rekvizitaiReviewUrl, reviewPlatform } from '../src/lib/review-platforms.ts';
import { clinicSchema, isDirectReviewUrl, normalizeReviewUrl, usableReviewUrl, validReviewUrl } from '../src/lib/validation.ts';

// ROADMAP Etapas R: businesses without a Google profile send customers to Rekvizitai.lt.
const RK = 'https://rekvizitai.vz.lt/imone/a_z_prekyba/atsiliepimai/';

test('Rekvizitai.lt links are whitelisted and canonicalised to the review page', () => {
  for (const url of ['https://rekvizitai.vz.lt/imone/a_z_prekyba/', 'https://rekvizitai.vz.lt/imone/a_z_prekyba', 'https://www.rekvizitai.lt/imone/a_z_prekyba/atsiliepimai', RK]) {
    assert.equal(rekvizitaiReviewUrl(url), RK, url);
  }
  for (const url of ['http://rekvizitai.vz.lt/imone/a_z_prekyba/', 'https://rekvizitai.vz.lt.evil.test/imone/x/', 'https://evil.test/imone/x/',
    'https://rekvizitai.vz.lt/imone/a_z_prekyba/finansai/', 'https://user:pw@rekvizitai.vz.lt/imone/x/', 'https://rekvizitai.vz.lt/imone/<script>/', 'javascript:alert(1)', '']) {
    assert.equal(rekvizitaiReviewUrl(url), null, url);
  }
});

test('the platform follows the stored link, so pasting a Google link switches everything', () => {
  assert.equal(reviewPlatform(RK), 'rekvizitai');
  assert.equal(reviewPlatform('https://search.google.com/local/writereview?placeid=ChIJ1'), 'google');
  assert.equal(reviewPlatform(null), 'google');
  assert.equal(platformCopy(RK).button, 'Rašyti atsiliepimą Rekvizitai.lt');
  assert.ok(!/Google/.test(PLATFORM_COPY.rekvizitai.ask + PLATFORM_COPY.rekvizitai.button + PLATFORM_COPY.rekvizitai.shareLabel), 'no "Google" for Rekvizitai customers');
});

test('validation accepts Google and Rekvizitai.lt, stores the canonical Rekvizitai link', () => {
  assert.equal(validReviewUrl('https://g.page/r/demo/review'), true);
  assert.equal(validReviewUrl('https://rekvizitai.vz.lt/imone/a_z_prekyba/'), true);
  assert.equal(validReviewUrl('https://evil.test/imone/a/'), false);
  assert.equal(normalizeReviewUrl(' https://rekvizitai.vz.lt/imone/a_z_prekyba '), RK);
  assert.equal(isDirectReviewUrl(RK), true);
  assert.equal(usableReviewUrl('https://rekvizitai.vz.lt/imone/a_z_prekyba/', 'X'), RK);
  const parsed = clinicSchema.safeParse({ business_name: 'Ergonomic.lt', email: 'a@example.test', slug: 'ergonomic-lt', google_review_url: 'https://rekvizitai.vz.lt/imone/a_z_prekyba/' });
  assert.equal(parsed.success, true);
  assert.equal(parsed.success && parsed.data.google_review_url, RK);
});
