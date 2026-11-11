import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { acceptBranchInvite } from '@/lib/branch-invite';
import { issueClinicSession } from '@/lib/clinic-access';
import { appUrl, error, hashToken, jsonBody, rateLimit, sameOrigin, SESSION_COOKIE } from '@/lib/security';

// A branch manager accepts the invitation: own email + password, login limited to that branch.
const schema = z.object({
  token: z.string().min(20).max(100),
  email: z.string().trim().max(254),
  password: z.string().min(8, 'Slaptažodis turi būti bent 8 simbolių.').max(128),
  password_confirm: z.string().max(128),
});

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return error('Netinkama užklausos kilmė.', 403);
  const parsed = schema.safeParse(await jsonBody(req).catch(() => null));
  if (!parsed.success) return error(parsed.error.issues[0]?.message || 'Patikrinkite formą.');
  const d = parsed.data;
  if (d.password !== d.password_confirm) return error('Slaptažodžiai nesutampa.');
  if (!rateLimit(`invite:${hashToken(d.token)}`, 10, 60 * 60 * 1000)) return error('Per daug bandymų. Pabandykite po valandos.', 429);
  try {
    const result = acceptBranchInvite(d.token, d.email, d.password);
    if (!result.ok) return error(result.error, result.status);
    const session = issueClinicSession(result.branch.id);
    const res = NextResponse.json({ ok: true, url: '/admin' }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, session.token, { httpOnly: true, secure: appUrl().startsWith('https:'), path: '/', maxAge: 8 * 3600, sameSite: 'lax' });
    return res;
  } catch (e) {
    console.error('Branch invite error:', e);
    return error('Nepavyko priimti pakvietimo.', 500);
  }
}
