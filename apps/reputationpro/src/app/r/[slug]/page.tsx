import { notFound } from 'next/navigation';
import { getClient } from '@/lib/db';
import { ReviewGate } from '@/components/review-gate';
import { canCollectFeedback } from '@/lib/entitlements';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const client=getClient(slug);
  return {title: client ? `Jūsų nuomonė — ${client.business_name}` : 'Atsiliepimų puslapis'};
}
export default async function ReviewPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const client=getClient(slug);if(!client||!canCollectFeedback(client))notFound();return <ReviewGate slug={client.slug} name={client.business_name} googleUrl={client.google_review_url} isDemo={!!client.is_demo}/>;}
