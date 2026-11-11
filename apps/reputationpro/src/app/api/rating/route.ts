import { NextRequest,NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db,getClient } from '@/lib/db';
import { sameOrigin,error,jsonBody,rateLimit } from '@/lib/security';
import { canCollectFeedback } from '@/lib/entitlements';
import { cleanChannel } from '@/lib/qr-channels';
export async function POST(req:NextRequest) {
  if(!sameOrigin(req)) return error('Netinkama užklausos kilmė.',403);
  try {
    const data=z.object({slug:z.string().min(3).max(70),rating:z.number().int().min(1).max(5),source:z.string().max(20).optional()}).safeParse(await jsonBody(req));
    if(!data.success) return error('Pasirinkite įvertinimą nuo 1 iki 5.');
    const client=getClient(data.data.slug);if(!client||!canCollectFeedback(client)) return error('Įmonė nerasta.',404);
    // Demo profiles (is_demo=1) never collect real ratings: their page is the owner demo.
    if(client.is_demo) return NextResponse.json({ok:true,demo:true});
    if(!rateLimit(`ratings:${client.id}`,120,60000)) return error('Pabandykite po minutės.',429);
    // source = sharing channel from the link (?s=kvitas …); unknown values are stored as NULL.
    db().prepare('INSERT INTO review_events(id,client_id,rating,source) VALUES (?,?,?,?)').run(randomUUID(),client.id,data.data.rating,cleanChannel(data.data.source));
    return NextResponse.json({ok:true});
  }catch{return error('Nepavyko išsaugoti įvertinimo. Bandykite dar kartą.');}
}
