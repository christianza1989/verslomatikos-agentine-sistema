import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { issueEmailToken,sendAccountEmail } from '@/lib/clinic-mail';
import { appUrl,error,hashToken,jsonBody,rateLimit,sameOrigin } from '@/lib/security';

export async function POST(req:NextRequest) {
  if(!sameOrigin(req))return error('Netinkama užklausos kilmė.',403);
  if(!rateLimit('reset-total',60,60*60*1000))return error('Bandykite vėliau.',429);
  try {
    const parsed=z.object({email:z.email().max(254)}).safeParse(await jsonBody(req));
    if(!parsed.success)return error('Įveskite el. pašto adresą.');
    const email=parsed.data.email.toLowerCase();
    if(!rateLimit(`reset:${hashToken(email)}`,3,60*60*1000))return NextResponse.json({ok:true});
    const row=db().prepare(`SELECT c.id,c.email FROM clients c JOIN clinic_credentials a ON a.client_id=c.id
      JOIN clinic_email_verifications v ON v.client_id=c.id AND v.verified_at IS NOT NULL WHERE c.email=? AND c.is_demo=0`).get(email) as {id:string;email:string}|undefined;
    if(row) {
      const token=issueEmailToken(row.id,'reset');
      await sendAccountEmail(row.email,'reset',`${appUrl()}/admin/reset?token=${encodeURIComponent(token)}`);
    }
    return NextResponse.json({ok:true});
  }catch{return error('Šiuo metu nepavyko išsiųsti nuorodos. Bandykite vėliau.',503);}
}
