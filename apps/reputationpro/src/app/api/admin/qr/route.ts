import { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { getClient } from '@/lib/db';
import { appUrl,error,currentPrincipal } from '@/lib/security';
import { canAccessClient } from '@/lib/clinic-access';
export async function GET(req:NextRequest) {
  const principal=await currentPrincipal();if(!principal)return error('Prisijunkite.',401);
  const client=getClient(req.nextUrl.searchParams.get('slug')||'');
  if(!client)return error('Klinika nerasta.',404);
  if(!canAccessClient(principal,client.id))return error('Klinika nerasta.',404);
  const svg=await QRCode.toString(`${appUrl()}/r/${client.slug}`,{type:'svg',width:640,margin:3,color:{dark:'#163d35',light:'#ffffff'},errorCorrectionLevel:'M'});
  return new Response(svg,{headers:{'Content-Type':'image/svg+xml','Content-Disposition':`attachment; filename="${client.slug}-qr.svg"`,'Cache-Control':'private, no-store'}});
}
