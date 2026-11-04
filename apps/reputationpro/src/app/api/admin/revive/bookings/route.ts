import { NextRequest, NextResponse } from 'next/server';
import { getReviveBookings, addReviveBooking, getClients } from '@/lib/db';
import { currentPrincipal, error } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const principal = await currentPrincipal();
  if (!principal) return error('Reikalingas prisijungimas.', 401);

  const { searchParams } = new URL(req.url);
  let clientId = searchParams.get('clientId');

  if (principal.role === 'clinic') {
    clientId = principal.clientId;
  } else if (!clientId) {
    const clients = getClients();
    clientId = clients[0]?.id || 'demo-vilniaus-denta';
  }

  const bookings = getReviveBookings(clientId);
  return NextResponse.json({ ok: true, bookings });
}

export async function POST(req: NextRequest) {
  const principal = await currentPrincipal();
  if (!principal) return error('Reikalingas prisijungimas.', 401);

  try {
    const body = await req.json();
    let clientId = body.clientId;
    if (principal.role === 'clinic') clientId = principal.clientId;
    if (!clientId) {
      const clients = getClients();
      clientId = clients[0]?.id || 'demo-vilniaus-denta';
    }

    if (!body.contactId || !body.bookingTime || !body.serviceName) {
      return error('Trūksta privalomų rezervacijos parametrų.', 400);
    }

    const id = addReviveBooking({
      clientId,
      contactId: body.contactId,
      bookingTime: body.bookingTime,
      serviceName: body.serviceName,
      estimatedRevenue: Number(body.estimatedRevenue) || 80,
      notes: body.notes
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Klaida išsaugant rezervaciją.';
    return error(msg, 500);
  }
}
