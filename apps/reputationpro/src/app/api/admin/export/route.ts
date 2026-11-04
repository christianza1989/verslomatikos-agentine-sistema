import { NextRequest } from 'next/server';
import { getClient,getFeedback } from '@/lib/db';
import { error,currentPrincipal } from '@/lib/security';
import { canAccessClient } from '@/lib/clinic-access';
function cell(v:unknown) {const s=String(v??'');return '"'+(/^[=+@\-\t\r]/.test(s)?"'"+s:s).replaceAll('"','""')+'"';}
export async function GET(req:NextRequest) {
  const principal=await currentPrincipal();if(!principal)return error('Prisijunkite.',401);
  const c=getClient(req.nextUrl.searchParams.get('slug')||'');if(!c)return error('Klinika nerasta.',404);
  if(!canAccessClient(principal,c.id))return error('Klinika nerasta.',404);
  const rows=[['Data','Įvertinimas','Žinutė','Vardas','Telefonas','Būsena'],...getFeedback(c.id).map(f=>[f.created_at,f.rating,f.feedback_text,f.customer_name,f.customer_phone,f.status])];
  return new Response('\ufeff'+rows.map(r=>r.map(cell).join(';')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${c.slug}-atsiliepimai.csv"`,'Cache-Control':'private, no-store'}});
}
