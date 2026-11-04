import { NextRequest, NextResponse } from 'next/server';
import { recordLeadClick, getCampaignLead } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const target = searchParams.get('to') || searchParams.get('target');

  let destination = target || 'https://verslomatika.lt/reputacija';

  if (id) {
    const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '';
    const ua = req.headers.get('user-agent') || '';
    try {
      recordLeadClick(id, destination, ip, ua);
    } catch (e) {
      console.error('Tracking click error:', e);
    }
  }

  // Validate destination to prevent open redirect vulnerabilities
  try {
    const parsed = new URL(destination);
    const allowedDomains = ['verslomatika.lt', 'reputacija.verslomatika.lt', 'localhost', '127.0.0.1'];
    const isAllowed = allowedDomains.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
    if (!isAllowed) {
      destination = 'https://verslomatika.lt/reputacija';
    }
  } catch {
    destination = 'https://verslomatika.lt/reputacija';
  }

  return NextResponse.redirect(destination, 302);
}
