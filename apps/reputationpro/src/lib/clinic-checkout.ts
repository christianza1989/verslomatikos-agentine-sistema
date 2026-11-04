import { randomUUID } from 'node:crypto';
import { db,type Client } from './db.ts';
import { checkoutParams,stripeClient } from './stripe.ts';
import type Stripe from 'stripe';

export async function clinicCheckout(client:Client,baseUrl:string,stripe:Stripe=stripeClient()) {
  if(process.env.STRIPE_PRICE_ID){
    const price=await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
    if(price.unit_amount!==4900||price.currency!=='eur'||price.recurring?.interval!=='month'||price.recurring.interval_count!==1)throw new Error('Invalid price');
  }
  const sql=db();type Attempt={attempt_id:string;expires_at:number;session_id:string|null};
  const existing=sql.prepare('SELECT attempt_id,expires_at,session_id FROM checkout_attempts WHERE client_id=?').get(client.id) as Attempt|undefined;
  if(existing && existing.expires_at<=Math.floor(Date.now()/1000) && existing.session_id) {
    const prior=await stripe.checkout.sessions.retrieve(existing.session_id);
    if(prior.status==='complete')throw new Error('Checkout already complete');
  }
  const now=Math.floor(Date.now()/1000);
  sql.prepare(`INSERT INTO checkout_attempts(client_id,attempt_id,expires_at,session_id) VALUES (?,?,?,NULL)
    ON CONFLICT(client_id) DO UPDATE SET attempt_id=excluded.attempt_id,expires_at=excluded.expires_at,session_id=NULL
    WHERE checkout_attempts.expires_at<=?`).run(client.id,randomUUID(),now+23*3600,now);
  const attempt=sql.prepare('SELECT attempt_id,expires_at,session_id FROM checkout_attempts WHERE client_id=?').get(client.id) as Attempt;
  const session=await stripe.checkout.sessions.create({...checkoutParams(client,baseUrl),expires_at:attempt.expires_at},{idempotencyKey:`checkout-${attempt.attempt_id}`});
  sql.prepare('UPDATE checkout_attempts SET session_id=? WHERE client_id=? AND attempt_id=?').run(session.id,client.id,attempt.attempt_id);
  if(!session.url)throw new Error('No checkout URL');
  return session.url;
}
