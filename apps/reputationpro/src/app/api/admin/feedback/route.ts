import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { error,currentPrincipal,jsonBody,sameOrigin } from '@/lib/security';
import { canAccessClient } from '@/lib/clinic-access';
export async function PATCH(req:NextRequest) {
  const principal=await currentPrincipal();if(!principal)return error('Prisijunkite.',401);
  if(!sameOrigin(req))return error('Netinkama užklausos kilmė.',403);
  try{
    const p=z.object({id:z.uuid(),status:z.enum(['new','resolved'])}).safeParse(await jsonBody(req));
    if(!p.success)return error('Netinkami duomenys.');
    // A clinic login manages notes of its main profile and of its branches.
    const row=db().prepare('SELECT client_id FROM internal_feedback WHERE id=?').get(p.data.id) as {client_id:string}|undefined;
    if(!row || !canAccessClient(principal,row.client_id))return error('Žinutė nerasta.',404);
    const result=db().prepare('UPDATE internal_feedback SET status=? WHERE id=?').run(p.data.status,p.data.id);
    if(!result.changes)return error('Žinutė nerasta.',404);
    return NextResponse.json({ok:true});
  }catch{return error('Nepavyko pakeisti būsenos.');}
}
