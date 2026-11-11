import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notifyEmailsSchema, notifyRecipients, parseNotifyEmails } from '../src/lib/validation.ts';

// ROADMAP K5: customer notes go to the team, not only to the account owner.
test('extra note recipients are parsed, de-duplicated and capped at 3', () => {
  assert.deepEqual(parseNotifyEmails(' Registratura@Imone.lt, admin@imone.lt;admin@imone.lt  vadovas@imone.lt x@y.lt bad '), ['registratura@imone.lt', 'admin@imone.lt', 'vadovas@imone.lt']);
  assert.deepEqual(parseNotifyEmails(''), []);
  assert.deepEqual(parseNotifyEmails(null), []);
});

test('the account email always receives notes, extra addresses are added once', () => {
  assert.deepEqual(notifyRecipients({ email: 'Info@Imone.lt', notify_emails: 'registratura@imone.lt,info@imone.lt' }), ['info@imone.lt', 'registratura@imone.lt']);
  assert.deepEqual(notifyRecipients({ email: 'info@imone.lt', notify_emails: '' }), ['info@imone.lt']);
});

test('settings API accepts at most 3 valid addresses', () => {
  assert.equal(notifyEmailsSchema.safeParse(['a@b.lt', 'c@d.lt']).success, true);
  assert.equal(notifyEmailsSchema.safeParse(['a@b.lt', 'c@d.lt', 'e@f.lt', 'g@h.lt']).success, false);
  assert.equal(notifyEmailsSchema.safeParse(['ne-adresas']).success, false);
  assert.equal(notifyEmailsSchema.safeParse(['a@b.lt, c@d.lt']).success, false, 'one address per field');
});
