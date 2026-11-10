import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClient } from '@/lib/db';
import { issueClaimToken, maskEmail } from '@/lib/claim';
import { sendClaimEmail } from '@/lib/clinic-mail';
import { appUrl, error, jsonBody, rateLimit, sameOrigin } from '@/lib/security';

// Sends a fresh activation link to the email already on file for a demo profile.
// The link only ever goes to that mailbox, so asking for it reveals nothing and grants nothing.
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return error('Netinkama užklausos kilmė.', 403);
  try {
    const parsed = z.object({ slug: z.string().trim().min(3).max(70) }).safeParse(await jsonBody(req));
    if (!parsed.success) return error('Nenurodyta įmonė.');
    const client = getClient(parsed.data.slug);
    if (!client || client.is_demo !== 1) return error('Paruoštos paskyros nerasta.', 404);
    if (!rateLimit('claim-resend-total', 30, 60 * 60 * 1000) || !rateLimit(`claim-resend:${client.id}`, 3, 60 * 60 * 1000)) {
      return error('Nuoroda jau išsiųsta. Patikrinkite el. paštą arba pabandykite po valandos.', 429);
    }
    const token = issueClaimToken(client.id);
    const sent = await sendClaimEmail(client.email, client.business_name, `${appUrl()}/aktyvuoti/${token}`);
    if (!sent) return error('Šiuo metu nepavyko išsiųsti laiško. Parašykite tomas@verslomatika.lt.', 503);
    return NextResponse.json({ ok: true, sent_to: maskEmail(client.email) });
  } catch (e) {
    console.error('Claim resend error:', e);
    return error('Nepavyko išsiųsti nuorodos. Bandykite vėliau.', 500);
  }
}
