import { NextRequest,NextResponse } from 'next/server';
import { getClientById } from '@/lib/db';
import { appUrl,currentPrincipal,error,sameOrigin } from '@/lib/security';
import { stripeClient } from '@/lib/stripe';
import { billingMode } from '@/lib/billing-mode';

export async function POST(req:NextRequest) {
  if(!sameOrigin(req))return error('Netinkama užklausos kilmė.',403);
  const principal=await currentPrincipal();
  if(!principal||principal.role!=='clinic')return error('Prisijunkite prie klinikos paskyros.',401);
  const client=getClientById(principal.clientId);
  if(!client?.stripe_customer_id||!['live','sandbox'].includes(billingMode()))return error('Prenumeratos valdymas nepasiekiamas.',503);
  const configuration=process.env.STRIPE_PORTAL_CONFIGURATION;
  if(!configuration)return error('Prenumeratos valdymas dar nesukonfigūruotas.',503);
  try {
    const session=await stripeClient().billingPortal.sessions.create({customer:client.stripe_customer_id,configuration,return_url:`${appUrl()}/admin`});
    return NextResponse.json({url:session.url});
  } catch {return error('Nepavyko atverti prenumeratos valdymo. Bandykite vėliau.',502);}
}
