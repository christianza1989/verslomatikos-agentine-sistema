import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sameOrigin,error,hashToken,SESSION_COOKIE } from '@/lib/security';
import { revokeClinicSession } from '@/lib/clinic-access';
export async function POST(req:NextRequest) {
  if(!sameOrigin(req)) return error('Netinkama užklausos kilmė.',403);
  const token=req.cookies.get(SESSION_COOKIE)?.value;
  if(token) {db().prepare('DELETE FROM admin_sessions WHERE token_hash=?').run(hashToken(token));revokeClinicSession(token);}
  const res=NextResponse.json({ok:true});res.cookies.delete(SESSION_COOKIE);return res;
}
