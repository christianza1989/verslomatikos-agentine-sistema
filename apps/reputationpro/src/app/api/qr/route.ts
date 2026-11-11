import { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { appUrl } from '@/lib/security';
import { channelUrl, cleanChannel } from '@/lib/qr-channels';

// Public QR image (used e.g. inside email signatures where an image URL is needed).
// ?slug=…&s=parasas&format=png|svg
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const slug = (q.get('slug') || 'vilniaus-denta').replace(/[^a-z0-9-]/g, '').slice(0, 70) || 'vilniaus-denta';
  const targetUrl = channelUrl(appUrl(), slug, cleanChannel(q.get('s')));
  const opts = { margin: 2, color: { dark: '#13112e', light: '#ffffff' } };

  if (q.get('format') === 'svg') {
    const svg = await QRCode.toString(targetUrl, { ...opts, type: 'svg', width: 500 });
    return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } });
  }
  const pngBuffer = await QRCode.toBuffer(targetUrl, { ...opts, width: 500 });
  return new Response(new Uint8Array(pngBuffer), { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' } });
}
