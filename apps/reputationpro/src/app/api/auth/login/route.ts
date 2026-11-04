import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { appUrl, error, hashToken, jsonBody, passwordMatches, rateLimit, sameOrigin, issueSession, SESSION_COOKIE } from '@/lib/security';
import { authenticateClinic,issueClinicSession } from '@/lib/clinic-access';
export const runtime='nodejs';
export async function POST(req:NextRequest) {
  if(!sameOrigin(req)) return error('Netinkama užklausos kilmė.',403);
  if(!rateLimit('login-total',120,60*1000)) return error('Per daug bandymų. Bandykite vėliau.',429);
  try {
    const parsed=z.object({email:z.email().max(254),password:z.string().min(1).max(256)}).safeParse(await jsonBody(req));
    if(!parsed.success) return error('Patikrinkite el. paštą ir slaptažodį.');
    const email=parsed.data.email.toLowerCase();
    if(!rateLimit(`login:${hashToken(email)}`,10,15*60*1000)) return error('Per daug bandymų. Bandykite po 15 minučių.',429);
    let session:{token:string;expiresAt:number}|null=null;
    if(email===(process.env.ADMIN_EMAIL||'').toLowerCase()) {
      if(passwordMatches(parsed.data.password))session=issueSession();
    } else {
      const clientId=authenticateClinic(email,parsed.data.password);
      if(clientId)session=issueClinicSession(clientId);
    }
    if(!session)return error('Neteisingas el. paštas arba slaptažodis, arba paskyra dar neaktyvi.',401);
    const {token,expiresAt}=session;
    const response=NextResponse.json({ok:true});
    response.cookies.set(SESSION_COOKIE,token,{httpOnly:true,secure:appUrl().startsWith('https:'),sameSite:'lax',expires:new Date(expiresAt),path:'/'});
    return response;
  } catch {return error('Nepavyko prisijungti. Patikrinkite duomenis.');}
}
