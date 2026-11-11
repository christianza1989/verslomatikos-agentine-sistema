import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DEMO_EVENTS, getClient, recordDemoEvent } from '@/lib/db';
import { error, hashToken, jsonBody, rateLimit, sameOrigin } from '@/lib/security';

// Owner demo engagement (ROADMAP H6): star taps, auto-filled complaint sent, public link opened,
// automatic demonstration finished, CTA. Only for demo profiles that belong to a campaign lead.
const schema = z.object({ slug: z.string().regex(/^[a-z0-9-]{3,70}$/), event: z.enum(DEMO_EVENTS) });

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return error('Netinkama užklausos kilmė.', 403);
  const parsed = schema.safeParse(await jsonBody(req).catch(() => null));
  if (!parsed.success) return error('Netinkami duomenys.');
  const { slug, event } = parsed.data;
  const client = getClient(slug);
  if (!client || !client.is_demo) return NextResponse.json({ ok: true, skipped: true });
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'local';
  if (!rateLimit(`demo:${slug}:${event}:${hashToken(ip).slice(0, 16)}`, 6, 60 * 60 * 1000)) return NextResponse.json({ ok: true, limited: true });
  try { recordDemoEvent(slug, event); } catch (e) { console.error('Demo event error:', e); }
  return NextResponse.json({ ok: true });
}
