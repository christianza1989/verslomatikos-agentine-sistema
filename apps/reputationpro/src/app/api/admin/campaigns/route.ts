import { NextRequest, NextResponse } from 'next/server';
import { getCampaignStats, getCampaignLeads, getCampaignEvents, getCampaignList } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId') || 'all';

  const stats = getCampaignStats(campaignId);
  const leads = getCampaignLeads(campaignId);
  const events = getCampaignEvents(50);
  const campaigns = getCampaignList();

  return NextResponse.json({
    ok: true,
    campaignId,
    stats,
    leads,
    events,
    campaigns,
    timestamp: new Date().toISOString()
  });
}
