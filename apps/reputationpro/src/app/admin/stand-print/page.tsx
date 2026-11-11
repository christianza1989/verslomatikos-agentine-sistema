import { redirect } from 'next/navigation';

// Old address kept for bookmarks: the printable sheets now live in /admin/print (ROADMAP D5).
export const dynamic = 'force-dynamic';

export default async function StandPrintPage({ searchParams }: { searchParams: Promise<{ slug?: string }> }) {
  const { slug } = await searchParams;
  redirect(`/admin/print?type=stand${slug ? `&slug=${encodeURIComponent(slug)}` : ''}`);
}
