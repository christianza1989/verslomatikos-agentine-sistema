import Stripe from 'stripe';
import { createHash } from 'node:crypto';
import type { Client } from './db.ts';
import { db } from './db.ts';
import { billingMode } from './billing-mode.ts';

export function stripeClient() {
  const key=process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe nenustatytas.');
  // Optional local-only Stripe stub for hermetic sandbox integration tests.
  // Live keys can never be redirected by this test setting.
  const mock=process.env.REPUTATION_STRIPE_MOCK_ORIGIN;
  if(mock && billingMode()==='sandbox') {
    const url=new URL(mock);
    if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||!url.port||url.pathname!=='/'||url.search||url.hash)throw new Error('Invalid local Stripe stub');
    return new Stripe(key,{host:url.hostname,port:Number(url.port),protocol:'http',maxNetworkRetries:0,timeout:5000});
  }
  return new Stripe(key,{maxNetworkRetries:2,timeout:20000});
}
export function checkoutParams(client: Client, baseUrl:string): Stripe.Checkout.SessionCreateParams {
  // The random client UUID yields a stable random-letter label across retries;
  // Stripe idempotency requires the complete payload to remain identical.
  const suffix=Array.from(createHash('sha256').update(client.id).digest().subarray(0,8), n=>String.fromCharCode(97+n%26)).join('');
  return {
    mode:'subscription', customer_email:client.email, client_reference_id:client.id,
    integration_identifier:`reputationpro_${suffix}`, locale:'lt',
    branding_settings:{display_name:'Verslomatika'},
    line_items:[process.env.STRIPE_PRICE_ID ? {price:process.env.STRIPE_PRICE_ID,quantity:1} : {
      price_data:{currency:'eur',unit_amount:4900,recurring:{interval:'month'},product_data:{name:'ReputationPro · viena klinika'}},quantity:1
    }],
    subscription_data:{trial_period_days:14,metadata:{client_id:client.id}},
    metadata:{client_id:client.id},
    success_url:`${baseUrl}/checkout/success`,cancel_url:`${baseUrl}/checkout?canceled=1`
  };
}
function objectId(value: string | {id:string} | null) { return typeof value==='string' ? value : value?.id || null; }
export function invoiceSubscriptionId(invoice: Stripe.Invoice) {
  // Support both current and older webhook endpoint API versions.
  const legacy = invoice as Stripe.Invoice & {subscription?: string | {id:string} | null};
  return objectId(invoice.parent?.subscription_details?.subscription ?? legacy.subscription ?? null);
}
function saveSubscription(sub: Stripe.Subscription, fallbackClientId?: string) {
  const sql=db();
  const customer=objectId(sub.customer as string | {id:string});
  const values=[sub.id,customer,sub.status,sub.trial_end ? new Date(sub.trial_end*1000).toISOString():null] as const;
  // Existing Stripe subscription ID is authoritative. Metadata is only used
  // to attach the first subscription to a pending client, never to replace one.
  const result=sql.prepare(`UPDATE clients SET stripe_subscription_id=?,stripe_customer_id=?,subscription_status=?,trial_ends_at=?
    WHERE stripe_subscription_id=? AND is_demo=0 AND (stripe_customer_id IS NULL OR stripe_customer_id=?)`).run(...values,sub.id,customer);
  if (!result.changes && fallbackClientId) {
    sql.prepare(`UPDATE clients SET stripe_subscription_id=?,stripe_customer_id=?,subscription_status=?,trial_ends_at=?
      WHERE id=? AND is_demo=0 AND subscription_status='pending' AND stripe_subscription_id IS NULL
      AND (stripe_customer_id IS NULL OR stripe_customer_id=?)`).run(...values,fallbackClientId,customer);
  }
}
export function processStripeEvent(event: Stripe.Event, subscription?: Stripe.Subscription) {
  const sql=db(); sql.exec('BEGIN IMMEDIATE');
  try {
    if(sql.prepare('SELECT 1 FROM stripe_events WHERE id=?').get(event.id)) {sql.exec('COMMIT');return;}
    if (event.type==='checkout.session.completed' || event.type==='checkout.session.async_payment_succeeded') {
      const session=event.data.object as Stripe.Checkout.Session;
      // Trialing subscriptions have payment_status=no_payment_required. Never activate from a redirect.
      if(subscription && (session.payment_status==='paid'||session.payment_status==='no_payment_required')) {
        const sessionCustomer=objectId(session.customer as string | {id:string} | null);
        if (sessionCustomer && sessionCustomer===objectId(subscription.customer as string | {id:string})) {
          saveSubscription(subscription,session.client_reference_id || session.metadata?.client_id);
        }
      }
    }
    if(event.type==='customer.subscription.updated'||event.type==='customer.subscription.deleted'||event.type==='customer.subscription.created') {
      const sub=event.data.object as Stripe.Subscription;
      saveSubscription(sub,sub.metadata?.client_id);
    }
    if ((event.type==='invoice.paid'||event.type==='invoice.payment_failed') && subscription) saveSubscription(subscription);
    // Store the event atomically with its state changes, so retries are safe.
    sql.prepare('INSERT INTO stripe_events(id,created_at) VALUES (?,?)').run(event.id,Date.now());
    sql.exec('COMMIT');
  } catch(e) {sql.exec('ROLLBACK');throw e;}
}
