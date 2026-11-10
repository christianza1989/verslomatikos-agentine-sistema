import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, getClientById } from '@/lib/db';
import { canAccessClient } from '@/lib/clinic-access';
import { currentPrincipal, error, jsonBody, sameOrigin } from '@/lib/security';

// Per-client display settings the owner controls from the dashboard.
// show_public_link_low: show the public Google review link after a 1–3★ rating
// (owner's decision, default off; see ROADMAP_REPUTATIONPRO.md §0.1).
const schema = z.object({ client_id: z.string().min(1).max(100), show_public_link_low: z.boolean() });

export async function PATCH(req: NextRequest) {
  const principal = await currentPrincipal();
  if (!principal) return error('Prisijunkite.', 401);
  if (!sameOrigin(req)) return error('Netinkama užklausos kilmė.', 403);
  try {
    const parsed = schema.safeParse(await jsonBody(req));
    if (!parsed.success) return error('Netinkami duomenys.');
    const { client_id, show_public_link_low } = parsed.data;
    if (!getClientById(client_id) || !canAccessClient(principal, client_id)) return error('Įmonė nerasta.', 404);
    db().prepare('UPDATE clients SET show_public_link_low=? WHERE id=?').run(show_public_link_low ? 1 : 0, client_id);
    return NextResponse.json({ ok: true, show_public_link_low });
  } catch {
    return error('Nepavyko išsaugoti nustatymo.');
  }
}
