import { notFound, redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { getClient, recordDemoView } from '@/lib/db';
import { ReviewGate } from '@/components/review-gate';
import { OwnerDemo } from '@/components/owner-demo';
import { canCollectFeedback } from '@/lib/entitlements';
import { claimTokenClient } from '@/lib/claim';
import { appUrl } from '@/lib/security';
import { cleanChannel } from '@/lib/qr-channels';

export const dynamic = 'force-dynamic';

// Public showcase demos (no campaign lead behind them): CTA goes to plain /checkout.
// The landing page links /r/memocasting, which does not exist in the DB → alias it.
const SHOWCASE_ALIASES: Record<string, string> = { memocasting: 'vilniaus-denta', demo: 'vilniaus-denta' };
const isShowcase = (slug: string, email: string) => slug === 'vilniaus-denta' || email.endsWith('.test');

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = getClient(slug);
  return {
    title: client ? (client.is_demo ? `${client.business_name} – paruoštas atsiliepimų puslapis` : `Jūsų nuomonė – ${client.business_name}`) : 'Atsiliepimų puslapis',
    robots: { index: false, follow: false },
  };
}

// is_demo=0 → the customer-facing review page.
// is_demo=1 → "owner mode" demo for the prospect (k = one-time claim token from the outbound email).
export default async function ReviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ k?: string; view?: string; s?: string }> }) {
  const { slug } = await params;
  const { k, view, s } = await searchParams;
  const source = cleanChannel(s);
  const client = getClient(slug);
  if (!client && SHOWCASE_ALIASES[slug]) redirect(`/r/${SHOWCASE_ALIASES[slug]}`);
  if (!client || !canCollectFeedback(client)) notFound();

  if (!client.is_demo) {
    return <ReviewGate slug={client.slug} name={client.business_name} googleUrl={client.google_review_url} showPublicLow={!!client.show_public_link_low} source={source}/>;
  }

  // Customer preview for a not-yet-activated profile (linked from /aktyvuoti): the real customer page,
  // in demo mode so nothing is stored, emailed or redirected.
  if (view === 'klientas') {
    return <>
      <div className="customer-preview-bar"><strong>Peržiūra.</strong> Taip Jūsų atsiliepimų puslapį matys klientai. Kol paskyra neaktyvuota, įvertinimai niekur nesiunčiami.</div>
      <ReviewGate slug={client.slug} name={client.business_name} googleUrl={client.google_review_url} showPublicLow={!!client.show_public_link_low} mode="demo"/>
    </>;
  }

  const tokenClient = claimTokenClient(k);
  const personal = !!tokenClient && tokenClient.id === client.id;
  if (personal) { try { recordDemoView(client.slug); } catch (e) { console.error('Demo view tracking failed:', e); } }
  const pageUrl = `${appUrl()}/r/${client.slug}`;
  const qr = await QRCode.toDataURL(pageUrl, { width: 300, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });

  return <OwnerDemo
    slug={client.slug}
    name={client.business_name}
    googleUrl={client.google_review_url}
    showPublicLow={!!client.show_public_link_low}
    claimHref={personal ? `/aktyvuoti/${k}` : isShowcase(client.slug, client.email) ? '/checkout' : `/checkout?slug=${encodeURIComponent(client.slug)}`}
    personal={personal}
    qr={qr}
    pageUrl={pageUrl}
    industry={client.industry || 'general'}
    googleRating={client.google_rating ?? null}
    googleReviews={client.google_reviews_count ?? null}
  />;
}
