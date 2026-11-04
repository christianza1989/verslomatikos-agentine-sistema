import { NextRequest,NextResponse } from 'next/server';
import Stripe from 'stripe';
import { invoiceSubscriptionId,processStripeEvent,stripeClient } from '@/lib/stripe';
import { error } from '@/lib/security';
import { db } from '@/lib/db';
export async function POST(req:NextRequest) {
  if(!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)return error('Webhook nesukonfigūruotas.',503);
  const signature=req.headers.get('stripe-signature');if(!signature)return error('Nėra Stripe parašo.');
  const stripe=stripeClient();let event:Stripe.Event;
  try{event=stripe.webhooks.constructEvent(await req.text(),signature,process.env.STRIPE_WEBHOOK_SECRET);}catch{return error('Neteisingas Stripe parašas.');}
  try{
    let sub:Stripe.Subscription|undefined;
    if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
      const session=event.data.object as Stripe.Checkout.Session;
      const clientId=session.client_reference_id||session.metadata?.client_id;
      if(!clientId||!db().prepare('SELECT 1 FROM clients WHERE id=? AND is_demo=0').get(clientId))return NextResponse.json({received:true});
      if(typeof session.subscription==='string')sub=await stripe.subscriptions.retrieve(session.subscription);
    }
    // Retrieve the current subscription on every update to tolerate out-of-order delivery.
    if(event.type==='customer.subscription.created'||event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'){
      const incoming=event.data.object as Stripe.Subscription;
      const known=db().prepare('SELECT 1 FROM clients WHERE stripe_subscription_id=? OR (id=? AND subscription_status=? AND is_demo=0)').get(incoming.id,incoming.metadata?.client_id||'','pending');
      if(!known)return NextResponse.json({received:true});
      const current=await stripe.subscriptions.retrieve(incoming.id);
      event={...event,data:{...event.data,object:current}} as Stripe.Event;
    }
    if(event.type==='invoice.paid'||event.type==='invoice.payment_failed'){
      const subscriptionId=invoiceSubscriptionId(event.data.object as Stripe.Invoice);
      if(!subscriptionId||!db().prepare('SELECT 1 FROM clients WHERE stripe_subscription_id=?').get(subscriptionId))return NextResponse.json({received:true});
      sub=await stripe.subscriptions.retrieve(subscriptionId);
    }
    processStripeEvent(event,sub);return NextResponse.json({received:true});
  }catch{console.error('Stripe webhook processing failed; Stripe should retry.',event.id,event.type);return error('Nepavyko apdoroti įvykio.',500);}
}
