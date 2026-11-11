import { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { getClient, getClientById } from '@/lib/db';
import { appUrl, error, currentPrincipal } from '@/lib/security';
import { canAccessClient } from '@/lib/clinic-access';
import { channelUrl, cleanChannel } from '@/lib/qr-channels';

// QR code downloads for the dashboard QR kit (ROADMAP D5.2).
//   ?slug=…            business (owner may pick any; a clinic user always gets their own)
//   &s=kvitas          channel → encoded URL /r/{slug}?s=kvitas (tracking which channel works)
//   &format=png|svg    PNG for screens/office, SVG for print shops
//   &size=200..2000    PNG width in px (default 1200)
//   &style=brand|black brand = dark violet, black = pure black for thermal receipt printers
export async function GET(req: NextRequest) {
  const principal = await currentPrincipal();
  if (!principal) return error('Prisijunkite.', 401);
  const q = req.nextUrl.searchParams;
  const client = principal.role === 'clinic' ? getClientById(principal.clientId) : getClient(q.get('slug') || '');
  if (!client || !canAccessClient(principal, client.id)) return error('Įmonė nerasta.', 404);

  const channel = cleanChannel(q.get('s'));
  const target = channelUrl(appUrl(), client.slug, channel);
  const dark = q.get('style') === 'black' ? '#000000' : '#13112e';
  const size = Math.min(2000, Math.max(200, Number(q.get('size')) || 1200));
  const name = `${client.slug}${channel ? `-${channel}` : ''}-qr`;
  const opts = { margin: 2, color: { dark, light: '#ffffff' }, errorCorrectionLevel: 'M' as const };

  if (q.get('format') === 'svg') {
    const svg = await QRCode.toString(target, { ...opts, type: 'svg', width: 640 });
    return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Content-Disposition': `attachment; filename="${name}.svg"`, 'Cache-Control': 'private, no-store' } });
  }
  const png = await QRCode.toBuffer(target, { ...opts, width: size });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png', 'Content-Disposition': `attachment; filename="${name}.png"`, 'Cache-Control': 'private, no-store' } });
}
