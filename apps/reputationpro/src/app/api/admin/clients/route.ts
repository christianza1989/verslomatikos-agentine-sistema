import { NextRequest,NextResponse } from 'next/server';
import { createClient,db,getClientById } from '@/lib/db';
import { clinicSchema } from '@/lib/validation';
import { demoEnabled,error,currentPrincipal,jsonBody,sameOrigin } from '@/lib/security';
import { canAccessClient } from '@/lib/clinic-access';
async function save(req:NextRequest,update:boolean) {
  const principal=await currentPrincipal();if(!principal)return error('Prisijunkite prie savininko paskyros.',401);
  if(!update && principal.role!=='owner')return error('Neturite prieigos.',403);
  if(!sameOrigin(req))return error('Netinkama užklausos kilmė.',403);
  try {
    const parsed=clinicSchema.safeParse(await jsonBody(req));
    if(!parsed.success)return error('Patikrinkite klinikos duomenis ir Google nuorodą.');
    if(update){
      const id=req.nextUrl.searchParams.get('id') || '';
      const current=getClientById(id);
      if(!current || !canAccessClient(principal,id))return error('Klinika nerasta.',404);
      const c=parsed.data;
      if(principal.role==='clinic' && c.email!==current.email)return error('El. pašto keitimui susisiekite su paslaugos teikėju.',403);
      db().prepare('UPDATE clients SET business_name=?,email=?,slug=?,google_review_url=?,phone=? WHERE id=?').run(c.business_name,c.email,c.slug,c.google_review_url,c.phone||'',id);
      return NextResponse.json({ok:true,slug:c.slug});
    }
    const client=createClient(parsed.data,demoEnabled());return NextResponse.json({ok:true,slug:client.slug},{status:201});
  }catch{return error('Toks el. paštas arba nuorodos vardas jau naudojamas.',409);}
}
export const POST=(req:NextRequest)=>save(req,false);
export const PATCH=(req:NextRequest)=>save(req,true);
