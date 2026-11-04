import { NextRequest, NextResponse } from 'next/server';
import { recordLeadOpen } from '@/lib/db';

// 1x1 transparent GIF (43 bytes)
const PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '';
    const ua = req.headers.get('user-agent') || '';
    try {
      recordLeadOpen(id, ip, ua);
    } catch (e) {
      console.error('Tracking open error:', e);
    }
  }

  return new NextResponse(PIXEL_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': PIXEL_GIF.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
