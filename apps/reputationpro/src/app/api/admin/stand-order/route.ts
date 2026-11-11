import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClientById, saveStandOrder, setStandOrderStatus, STAND_STATUSES } from '@/lib/db';
import { canAccessClient } from '@/lib/clinic-access';
import { sendStandOrderAlert } from '@/lib/clinic-mail';
import { currentPrincipal, error, jsonBody, sameOrigin } from '@/lib/security';

// Free QR + NFC stand (owner decision 2026-11-11).
// POST  – an activated client (or the owner on its behalf) saves the delivery details.
// PATCH – only the owner changes the status (sent / delivered / canceled).
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const orderSchema = z.object({
  client_id: text(1, 100),
  recipient: text(2, 100),
  company: z.string().trim().max(120).optional().default(''),
  phone: z.string().trim().min(6).max(40).regex(/^[+0-9 ()-]+$/, 'Telefono numeris'),
  street: text(3, 200),
  city: text(2, 80),
  postal_code: z.string().trim().max(12).transform((v) => v.replace(/^LT-?/i, '').replace(/\s+/g, '')).pipe(z.string().regex(/^\d{5}$/)),
  notes: z.string().trim().max(500).optional().default(''),
  quantity: z.number().int().min(1).max(3),
});
const statusSchema = z.object({ order_id: text(1, 100), status: z.enum(STAND_STATUSES) });

export async function POST(req: NextRequest) {
  const principal = await currentPrincipal();
  if (!principal) return error('Prisijunkite.', 401);
  if (!sameOrigin(req)) return error('Netinkama užklausos kilmė.', 403);
  const parsed = orderSchema.safeParse(await jsonBody(req).catch(() => null));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] || '');
    const labels: Record<string, string> = { recipient: 'gavėjo vardą', phone: 'telefono numerį', street: 'gatvę ir namo numerį', city: 'miestą', postal_code: 'pašto kodą (5 skaitmenys)', quantity: 'kiekį' };
    return error(labels[field] ? `Patikslinkite ${labels[field]}.` : 'Patikrinkite pristatymo duomenis.');
  }
  const data = parsed.data;
  const client = getClientById(data.client_id);
  if (!client || !canAccessClient(principal, client.id)) return error('Įmonė nerasta.', 404);
  if (client.is_demo) return error('Stovelį galima užsisakyti aktyvavus paskyrą.', 403);
  const postal = `LT-${data.postal_code}`;
  const result = saveStandOrder(client.id, { ...data, postal_code: postal });
  if (result.error === 'already_sent') return error('Stovelis jau išsiųstas. Jei reikia dar vieno, parašykite tomas@verslomatika.lt.', 409);
  const order = result.order!;
  sendStandOrderAlert({
    business_name: client.business_name, slug: client.slug, email: client.email, address: order.delivery_address,
    quantity: order.quantity, notes: order.notes, updated: !result.created,
  }).catch(() => undefined);
  return NextResponse.json({ ok: true, order });
}

export async function PATCH(req: NextRequest) {
  const principal = await currentPrincipal();
  if (!principal) return error('Prisijunkite.', 401);
  if (principal.role !== 'owner') return error('Tik administratoriui.', 403);
  if (!sameOrigin(req)) return error('Netinkama užklausos kilmė.', 403);
  const parsed = statusSchema.safeParse(await jsonBody(req).catch(() => null));
  if (!parsed.success) return error('Netinkami duomenys.');
  if (!setStandOrderStatus(parsed.data.order_id, parsed.data.status)) return error('Užsakymas nerastas.', 404);
  return NextResponse.json({ ok: true });
}
