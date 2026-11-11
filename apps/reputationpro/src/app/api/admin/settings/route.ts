import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, getClientById } from '@/lib/db';
import { canAccessClient } from '@/lib/clinic-access';
import { currentPrincipal, error, jsonBody, sameOrigin } from '@/lib/security';
import { notifyEmailsSchema } from '@/lib/validation';

// Per-client display settings the owner controls from the dashboard.
// show_public_link_low: show the public Google review link after a 1–3★ rating
// (owner's decision, default off; see ROADMAP_REPUTATIONPRO.md §0.1).
// notify_emails: extra addresses that receive customer notes (ROADMAP K5).
const schema = z.object({ client_id: z.string().min(1).max(100), show_public_link_low: z.boolean().optional(), notify_emails: notifyEmailsSchema.optional() })
  .refine((d) => d.show_public_link_low !== undefined || d.notify_emails !== undefined);

export async function PATCH(req: NextRequest) {
  const principal = await currentPrincipal();
  if (!principal) return error('Prisijunkite.', 401);
  if (!sameOrigin(req)) return error('Netinkama užklausos kilmė.', 403);
  try {
    const parsed = schema.safeParse(await jsonBody(req));
    if (!parsed.success) return error(parsed.error.issues[0]?.message && parsed.error.issues[0].path[0] === 'notify_emails' ? 'Patikrinkite el. pašto adresus.' : 'Netinkami duomenys.');
    const { client_id, show_public_link_low, notify_emails } = parsed.data;
    if (!getClientById(client_id) || !canAccessClient(principal, client_id)) return error('Įmonė nerasta.', 404);
    if (show_public_link_low !== undefined) db().prepare('UPDATE clients SET show_public_link_low=? WHERE id=?').run(show_public_link_low ? 1 : 0, client_id);
    if (notify_emails !== undefined) db().prepare('UPDATE clients SET notify_emails=? WHERE id=?').run([...new Set(notify_emails.filter(Boolean))].join(','), client_id);
    return NextResponse.json({ ok: true, show_public_link_low, notify_emails });
  } catch {
    return error('Nepavyko išsaugoti nustatymo.');
  }
}
