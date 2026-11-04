import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { error,currentPrincipal,jsonBody,sameOrigin } from '@/lib/security';
export async function PATCH(req:NextRequest) {
  const principal=await currentPrincipal();if(!principal)return error('Prisijunkite.',401);
  if(!sameOrigin(req))return error('Netinkama užklausos kilmė.',403);
  try{
    const p=z.object({id:z.uuid(),status:z.enum(['new','resolved'])}).safeParse(await jsonBody(req));
    if(!p.success)return error('Netinkami duomenys.');
    const result=principal.role==='owner'
      ? db().prepare('UPDATE internal_feedback SET status=? WHERE id=?').run(p.data.status,p.data.id)
      : db().prepare('UPDATE internal_feedback SET status=? WHERE id=? AND client_id=?').run(p.data.status,p.data.id,principal.clientId);
    if(!result.changes)return error('Žinutė nerasta.',404);
    return NextResponse.json({ok:true});
  }catch{return error('Nepavyko pakeisti būsenos.');}
}
