import { NextRequest, NextResponse } from 'next/server';
import { getReviveCampaigns, createReviveCampaign, getClients } from '@/lib/db';
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

  const campaigns = getReviveCampaigns(clientId);
  return NextResponse.json({ ok: true, campaigns });
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

    if (!body.name || !body.message_template) {
      return error('Kampanijos pavadinimas ir SMS žinutės šablonas yra privalomi.', 400);
    }

    const id = createReviveCampaign({
      clientId,
      name: body.name,
      niche: body.niche || 'dental',
      template_type: body.template_type || 'hygiene_recall',
      message_template: body.message_template
    });

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Klaida kuriant kampaniją.';
    return error(msg, 500);
  }
}
