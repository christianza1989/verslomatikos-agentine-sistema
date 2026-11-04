import { NextRequest, NextResponse } from 'next/server';
import { getReviveContacts, addReviveContact, bulkAddReviveContacts, getClients } from '@/lib/db';
import { currentPrincipal, error, sameOrigin } from '@/lib/security';

export const dynamic = 'force-dynamic';

function parseCsvText(text: string) {
  const clean = text.replace(/^\uFEFF/, '').trim();
  const lines = clean.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (!lines.length) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const rows: { name: string; phone: string; email?: string; last_visit?: string; service_history?: string }[] = [];

  const startIndex = /^(vardas|name)/i.test(lines[0]) ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts[0] && parts[1]) {
      rows.push({
        name: parts[0],
        phone: parts[1],
        email: parts[2] || '',
        last_visit: parts[3] || 'Prieš 6–12 mėn.',
        service_history: parts[4] || 'Profilaktinis vizitas'
      });
    }
  }
  return rows;
}

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

  const contacts = getReviveContacts(clientId);
  return NextResponse.json({ ok: true, contacts, count: contacts.length });
}

export async function POST(req: NextRequest) {
  const principal = await currentPrincipal();
  if (!principal) return error('Reikalingas prisijungimas.', 401);

  try {
    const contentType = req.headers.get('content-type') || '';
    let clientId = '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      clientId = String(formData.get('client_id') || '');
      if (principal.role === 'clinic') clientId = principal.clientId;
      if (!clientId) {
        const clients = getClients();
        clientId = clients[0]?.id || 'demo-vilniaus-denta';
      }

      const file = formData.get('file') as File | null;
      if (!file) return error('Nepateiktas failas.', 400);

      const text = await file.text();
      const contacts = parseCsvText(text);
      if (!contacts.length) return error('Failas tuščias arba neteisingas formatas (stulpeliai: Vardas, Telefonas, El. paštas, Paskutinis vizitas).', 400);

      const result = bulkAddReviveContacts(clientId, contacts);
      return NextResponse.json({ ok: true, imported: result.imported, rejected: result.rejected });
    } else {
      const body = await req.json();
      clientId = body.clientId;
      if (principal.role === 'clinic') clientId = principal.clientId;
      if (!clientId) {
        const clients = getClients();
        clientId = clients[0]?.id || 'demo-vilniaus-denta';
      }

      if (Array.isArray(body.contacts)) {
        const result = bulkAddReviveContacts(clientId, body.contacts);
        return NextResponse.json({ ok: true, imported: result.imported, rejected: result.rejected });
      }

      if (!body.name || !body.phone) {
        return error('Vardas ir telefono numeris yra privalomi.', 400);
      }

      const id = addReviveContact({
        clientId,
        name: body.name,
        phone: body.phone,
        email: body.email,
        last_visit: body.last_visit,
        service_history: body.service_history,
        notes: body.notes
      });

      return NextResponse.json({ ok: true, id }, { status: 201 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Klaida išsaugant kontaktus.';
    return error(msg, 500);
  }
}
