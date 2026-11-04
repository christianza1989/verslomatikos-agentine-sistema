import { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { appUrl } from '@/lib/security';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') || 'vilniaus-denta';
  const targetUrl = `${appUrl()}/r/${slug}`;
  const format = req.nextUrl.searchParams.get('format') || 'png';

  if (format === 'svg') {
    const svg = await QRCode.toString(targetUrl, {
      type: 'svg',
      width: 500,
      margin: 2,
      color: { dark: '#163d35', light: '#ffffff' }
    });
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  const pngBuffer = await QRCode.toBuffer(targetUrl, {
    width: 500,
    margin: 2,
    color: { dark: '#163d35', light: '#ffffff' }
  });

  return new Response(new Uint8Array(pngBuffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
