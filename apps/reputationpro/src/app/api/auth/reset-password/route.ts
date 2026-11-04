import { NextRequest,NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { consumeEmailToken,tokenClient } from '@/lib/clinic-mail';
import { replaceClinicPassword,validClinicPassword } from '@/lib/clinic-access';
import { error,jsonBody,rateLimit,sameOrigin } from '@/lib/security';

export async function POST(req:NextRequest) {
  if(!sameOrigin(req))return error('Netinkama užklausos kilmė.',403);
  if(!rateLimit('reset-password-total',60,60000))return error('Bandykite vėliau.',429);
  try {
    const input=await jsonBody(req) as {token?:unknown;password?:unknown;password_confirm?:unknown};
    const token=typeof input.token==='string'?input.token:'';
    if(typeof input.password!=='string'||!validClinicPassword(input.password)||input.password!==input.password_confirm)return error('Slaptažodis turi būti bent 12 simbolių ir sutapti.');
    const sql=db();sql.exec('BEGIN IMMEDIATE');
    try {
      const id=tokenClient(token,'reset');
      if(!id||!sql.prepare('SELECT 1 FROM clients WHERE id=? AND is_demo=0').get(id)||!consumeEmailToken(token,'reset')){sql.exec('ROLLBACK');return error('Nuoroda nebegalioja. Paprašykite naujos.',400);}
      replaceClinicPassword(id,input.password);sql.exec('COMMIT');
    }catch(e){sql.exec('ROLLBACK');throw e;}
    return NextResponse.json({ok:true});
  }catch{return error('Nepavyko pakeisti slaptažodžio.',500);}
}
