import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, createClient, getClient, getClientByEmail, recordLeadConversion, type Client } from '@/lib/db';
import { appUrl, error, jsonBody, rateLimit, sameOrigin, SESSION_COOKIE } from '@/lib/security';
import { createClinicCredential, issueClinicSession } from '@/lib/clinic-access';
import { issueClaimToken, maskEmail, TRIAL_MS } from '@/lib/claim';
import { clinicSchema } from '@/lib/validation';
import { sendClaimEmail, sendWelcomeEmail, sendNewOrderAlertToAdmin } from '@/lib/clinic-mail';

const checkoutSchema = clinicSchema.extend({
  password: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių.').max(128),
  plan: z.enum(['starter', 'pro', 'annual']).optional(),
  delivery_address: z.string().trim().max(300).optional(),
});

// Self-service registration from the landing page.
//
// SECURITY (do not regress, see ROADMAP_REPUTATIONPRO.md A1): this route never modifies
// an existing client. Pre-provisioned outbound leads (is_demo=1) are claimed only with the
// one-time token from their email (/aktyvuoti/{token}); here we just mail that link to the
// address on file. Claimed/real clients get "please log in".
async function handleExisting(existing: Client) {
  if (existing.is_demo === 1) {
    let sentTo: string | null = null;
    if (rateLimit(`claim-resend:${existing.id}`, 3, 60 * 60 * 1000)) {
      const token = issueClaimToken(existing.id);
      const sent = await sendClaimEmail(existing.email, existing.business_name, `${appUrl()}/aktyvuoti/${token}`).catch(() => false);
      if (sent) sentTo = maskEmail(existing.email);
    }
    return NextResponse.json({
      error: sentTo
        ? `„${existing.business_name}“ paskyra jau paruošta. Aktyvavimo nuorodą išsiuntėme į ${sentTo} – atverkite ją ir nustatykite slaptažodį.`
        : `„${existing.business_name}“ paskyra jau paruošta. Aktyvuokite ją per nuorodą laiške arba parašykite tomas@verslomatika.lt.`,
      code: 'claim_sent',
    }, { status: 409 });
  }
  return NextResponse.json({
    error: 'Paskyra su šiuo pavadinimu arba el. paštu jau yra. Prisijunkite arba atkurkite slaptažodį.',
    code: 'exists',
  }, { status: 409 });
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return error('Netinkama užklausos kilmė.', 403);
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'local';
  if (!rateLimit(`checkout:${ip}`, 10, 60 * 60 * 1000)) return error('Per daug bandymų. Pabandykite po valandos.', 429);
  try {
    const parsed = checkoutSchema.safeParse(await jsonBody(req));
    if (!parsed.success) return error(parsed.error.issues[0]?.message || 'Užpildykite visus privalomus laukelius.');
    const data = parsed.data;

    const existing = getClient(data.slug) || getClientByEmail(data.email);
    if (existing) return handleExisting(existing);

    const sql = db();
    sql.exec('BEGIN IMMEDIATE');
    let client: Client;
    try {
      client = createClient({
        business_name: data.business_name, email: data.email, slug: data.slug,
        google_review_url: data.google_review_url, phone: data.phone || '',
        subscription_status: 'trialing', trial_ends_at: new Date(Date.now() + TRIAL_MS).toISOString(),
      }, false);
      createClinicCredential(client.id, data.password);
      // Accepted risk (ROADMAP A1 note): landing sign-ups get instant access without a
      // mailbox round-trip. Outbound leads prove their mailbox through the claim token.
      sql.prepare('INSERT OR REPLACE INTO clinic_email_verifications(client_id, verified_at) VALUES (?,?)').run(client.id, Date.now());
      if (data.delivery_address) {
        sql.exec(`CREATE TABLE IF NOT EXISTS stand_orders (
          id TEXT PRIMARY KEY, client_id TEXT NOT NULL, plan TEXT NOT NULL, delivery_address TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')))`);
        sql.prepare('INSERT INTO stand_orders (id, client_id, plan, delivery_address) VALUES (?, ?, ?, ?)')
          .run(crypto.randomUUID(), client.id, data.plan || 'trial', data.delivery_address);
      }
      sql.exec('COMMIT');
    } catch (e) {
      sql.exec('ROLLBACK');
      throw e;
    }

    try { recordLeadConversion(client.email); recordLeadConversion(client.slug); }
    catch (err) { console.error('Failed to record campaign conversion:', err); }

    const session = issueClinicSession(client.id);
    sendWelcomeEmail(client.email, client.business_name, client.slug).catch(err => console.error('Welcome email error:', err));
    sendNewOrderAlertToAdmin({
      business_name: client.business_name, email: client.email, slug: client.slug, phone: client.phone,
      plan: data.plan || 'trial', delivery_address: data.delivery_address || '',
    }).catch(err => console.error('Admin order alert error:', err));

    const res = NextResponse.json({ ok: true, slug: client.slug, url: '/admin#onboarding' }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true, secure: appUrl().startsWith('https:'), path: '/', maxAge: 8 * 3600, sameSite: 'lax',
    });
    return res;
  } catch (err) {
    console.error('Checkout registration error:', err);
    return error('Nepavyko sukurti paskyros. Toks el. paštas arba nuorodos vardas jau naudojamas.', 409);
  }
}
