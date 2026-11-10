import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { claimClient } from '@/lib/claim';
import { issueClinicSession } from '@/lib/clinic-access';
import { recordLeadConversion } from '@/lib/db';
import { sendLoginEmailChangedNotice, sendNewOrderAlertToAdmin, sendWelcomeEmail } from '@/lib/clinic-mail';
import { appUrl, error, hashToken, jsonBody, rateLimit, sameOrigin, SESSION_COOKIE } from '@/lib/security';

const schema = z.object({
  token: z.string().min(20).max(100),
  password: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių.').max(128),
  password_confirm: z.string().max(128),
  google_review_url: z.string().trim().max(2000).optional(),
  email: z.string().trim().max(254).optional(),
  email_confirm: z.string().trim().max(254).optional(),
});

// Claims a pre-provisioned demo profile with the one-time token from the outbound email.
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return error('Netinkama užklausos kilmė.', 403);
  try {
    const parsed = schema.safeParse(await jsonBody(req));
    if (!parsed.success) return error(parsed.error.issues[0]?.message || 'Patikrinkite formą.');
    const data = parsed.data;
    if (data.password !== data.password_confirm) return error('Slaptažodžiai nesutampa.');
    if (data.email && data.email_confirm !== undefined && data.email.toLowerCase() !== data.email_confirm.toLowerCase()) return error('El. pašto adresai nesutampa.');
    if (!rateLimit(`claim:${hashToken(data.token)}`, 10, 60 * 60 * 1000)) return error('Per daug bandymų. Pabandykite po valandos.', 429);

    const result = claimClient(data.token, data.password, data.google_review_url || undefined, data.email || undefined);
    if (!result.ok) return error(result.error, result.status);
    const client = result.client;

    try { recordLeadConversion(client.email); recordLeadConversion(client.slug); }
    catch (e) { console.error('Claim conversion tracking failed:', e); }

    if (result.previousEmail) {
      sendLoginEmailChangedNotice(result.previousEmail, client.business_name, client.email).catch((e) => console.error('Email change notice error:', e));
    }
    sendWelcomeEmail(client.email, client.business_name, client.slug).catch((e) => console.error('Welcome email error:', e));
    sendNewOrderAlertToAdmin({ business_name: client.business_name, email: client.email, slug: client.slug, phone: client.phone, plan: 'trial (aktyvuota iš laiško)', delivery_address: '' })
      .catch((e) => console.error('Admin alert error:', e));

    const session = issueClinicSession(client.id);
    const res = NextResponse.json({ ok: true, url: '/admin#onboarding' }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, session.token, { httpOnly: true, secure: appUrl().startsWith('https:'), path: '/', maxAge: 8 * 3600, sameSite: 'lax' });
    return res;
  } catch (e) {
    console.error('Claim error:', e);
    return error('Nepavyko aktyvuoti paskyros. Bandykite dar kartą.', 500);
  }
}
