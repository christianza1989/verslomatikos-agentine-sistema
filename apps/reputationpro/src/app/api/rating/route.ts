import { NextRequest,NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db,getClient } from '@/lib/db';
import { sameOrigin,error,jsonBody,rateLimit } from '@/lib/security';
import { canCollectFeedback } from '@/lib/entitlements';
export async function POST(req:NextRequest) {
  if(!sameOrigin(req)) return error('Netinkama užklausos kilmė.',403);
  try {
    const data=z.object({slug:z.string().min(3).max(70),rating:z.number().int().min(1).max(5)}).safeParse(await jsonBody(req));
    if(!data.success) return error('Pasirinkite įvertinimą nuo 1 iki 5.');
    const client=getClient(data.data.slug);if(!client||!canCollectFeedback(client)) return error('Klinika nerasta.',404);
    if(!rateLimit(`ratings:${client.id}`,120,60000)) return error('Pabandykite po minutės.',429);
    db().prepare('INSERT INTO review_events(id,client_id,rating) VALUES (?,?,?)').run(randomUUID(),client.id,data.data.rating);
    return NextResponse.json({ok:true});
  }catch{return error('Nepavyko išsaugoti įvertinimo. Bandykite dar kartą.');}
}
