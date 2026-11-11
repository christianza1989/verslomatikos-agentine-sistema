import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { setCompanyCampaignStatus } from '@/lib/db';
import { currentPrincipal, error, jsonBody, sameOrigin } from '@/lib/security';

// Owner only: stop or resume all outbound emails to one company (Etapas N9).
const schema = z.object({ key: z.string().min(3).max(300), status: z.enum(['active', 'stopped']) });
export async function PATCH(req: NextRequest) {
  const principal = await currentPrincipal();
  if (!principal) return error('Prisijunkite.', 401);
  if (principal.role !== 'owner') return error('Tik administratoriui.', 403);
  if (!sameOrigin(req)) return error('Netinkama užklausos kilmė.', 403);
  const p = schema.safeParse(await jsonBody(req).catch(() => null));
  if (!p.success) return error('Netinkami duomenys.');
  if (!setCompanyCampaignStatus(p.data.key, p.data.status)) return error('Įmonė nerasta.', 404);
  return NextResponse.json({ ok: true });
}
