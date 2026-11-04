import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { DatabaseSync } from 'node:sqlite';
import { db,closeDb,createClient,getClient,getStats,getFeedback } from '../src/lib/db.ts';
import { feedbackSchema,clinicSchema,validGoogleUrl } from '../src/lib/validation.ts';
import { checkoutParams,invoiceSubscriptionId,processStripeEvent } from '../src/lib/stripe.ts';
import { billingMode } from '../src/lib/billing-mode.ts';

const dir=mkdtempSync(join(tmpdir(),'reputationpro-test-'));
process.env.DATABASE_PATH=join(dir,'test.db');process.env.DEMO_MODE='true';delete process.env.STRIPE_PRICE_ID;
after(()=>{closeDb();rmSync(dir,{recursive:true,force:true});});
test('SQLite schema, demo clinic and feedback survive closing and reopening',()=>{
  const client=getClient('vilniaus-denta')!;assert.equal(client.business_name,'Vilniaus Denta');
  assert.equal(Object.getPrototypeOf(client),Object.prototype,'Clinic must serialize into a React Client Component');
  const id=randomUUID();db().prepare('INSERT INTO internal_feedback(id,client_id,rating,feedback_text) VALUES (?,?,?,?)').run(id,client.id,2,'Ilgas laukimas registratūroje.');
  closeDb();assert.equal(getFeedback(client.id).find(f=>f.id===id)?.rating,2);
  assert.equal(Object.getPrototypeOf(getFeedback(client.id)[0]),Object.prototype,'Feedback must serialize into a React Client Component');
  assert.throws(()=>db().prepare('INSERT INTO internal_feedback(id,client_id,rating,feedback_text) VALUES (?,?,?,?)').run(randomUUID(),client.id,6,'Invalid rating'));
  assert.throws(()=>db().prepare('INSERT INTO internal_feedback(id,client_id,rating,feedback_text) VALUES (?,?,?,?)').run(randomUUID(),'missing',2,'Missing client'));
});
test('Google URLs cannot be scripts, lookalike domains or general Google redirects',()=>{
  for(const url of ['javascript:alert(1)','http://www.google.com/maps','https://google.com.evil.test/maps','https://www.google.com/url?q=https://evil.test','https://evil.test','https://user:pass@google.com/maps'])assert.equal(validGoogleUrl(url),false,url);
  for(const url of ['https://www.google.com/maps','https://g.page/r/demo/review','https://search.google.com/local/writereview?placeid=123','https://maps.app.goo.gl/example'])assert.equal(validGoogleUrl(url),true,url);
});
test('Private feedback accepts every rating, while requiring consent and a useful message',()=>{
  const valid={slug:'vilniaus-denta',rating:2,feedback_text:'Norėčiau aiškesnės informacijos.',consent:true,submission_id:randomUUID()};
  for(const rating of [1,2,3,4,5]) assert.ok(feedbackSchema.safeParse({...valid,rating}).success);
  for(const patch of [{rating:0},{rating:6},{consent:false},{feedback_text:' '},{website:'spam'},{submission_id:'abc'}])assert.equal(feedbackSchema.safeParse({...valid,...patch}).success,false);
  assert.equal(clinicSchema.safeParse({business_name:'Demo',email:'owner@example.test',slug:'../admin',google_review_url:'https://www.google.com/maps'}).success,false);
});
test('Stats count rating choices, not imaginary Google reviews',()=>{
  const c=createClient({business_name:'Stat Test',email:'stats@example.test',slug:'stat-test',google_review_url:'https://www.google.com/maps'},true);
  for(const rating of [1,3,4,5])db().prepare('INSERT INTO review_events(id,client_id,rating) VALUES (?,?,?)').run(randomUUID(),c.id,rating);
  const s=getStats(c.id);assert.deepEqual(s,{ratings:4,positiveRatings:2,average:3.25,feedback:0,unread:0});
});
test('Legacy feedback migration preserves records and accepts all five ratings',()=>{
  closeDb(); const previous=process.env.DATABASE_PATH!, legacyPath=join(dir,'legacy.db');
  const old=new DatabaseSync(legacyPath);
  old.exec(`CREATE TABLE clients (id TEXT PRIMARY KEY,slug TEXT NOT NULL UNIQUE,business_name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,phone TEXT NOT NULL DEFAULT '',google_review_url TEXT NOT NULL,subscription_status TEXT NOT NULL DEFAULT 'pending',stripe_customer_id TEXT,stripe_subscription_id TEXT,trial_ends_at TEXT,is_demo INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT '2026-01-01');
    CREATE TABLE internal_feedback (id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES clients(id),rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 3),feedback_text TEXT NOT NULL,customer_name TEXT NOT NULL DEFAULT '',customer_phone TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','resolved')),created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
    CREATE INDEX feedback_client_date ON internal_feedback(client_id,created_at);
    INSERT INTO clients (id,slug,business_name,email,google_review_url) VALUES ('old-client','old-clinic','Old Clinic','old@example.test','https://www.google.com/maps');
    INSERT INTO internal_feedback VALUES ('old-feedback','old-client',2,'Existing message','Name','Phone','resolved','2026-01-02T03:04:05Z');`);
  old.close(); process.env.DATABASE_PATH=legacyPath;
  try {
    const sql=db(); const row=sql.prepare("SELECT * FROM internal_feedback WHERE id='old-feedback'").get();
    assert.deepEqual({...row},{id:'old-feedback',client_id:'old-client',rating:2,feedback_text:'Existing message',customer_name:'Name',customer_phone:'Phone',status:'resolved',created_at:'2026-01-02T03:04:05Z'});
    const insert=sql.prepare('INSERT INTO internal_feedback(id,client_id,rating,feedback_text) VALUES (?,?,?,?)');
    for(const rating of [1,2,3,4,5])insert.run(randomUUID(),'old-client',rating,'New message');
    assert.throws(()=>insert.run(randomUUID(),'old-client',6,'Invalid'));
    closeDb();assert.equal((db().prepare('SELECT COUNT(*) AS n FROM internal_feedback').get() as {n:number}).n,6);
  } finally {closeDb();process.env.DATABASE_PATH=previous;}
});
test('Stripe subscription uses EUR 49/month and a 14-day trial',()=>{
  const c=getClient('vilniaus-denta')!;const p=checkoutParams(c,'http://127.0.0.1:3000');
  assert.equal(p.mode,'subscription');assert.equal(p.subscription_data?.trial_period_days,14);
  assert.equal(p.branding_settings?.display_name,'Verslomatika');
  assert.equal(p.line_items?.[0].price_data?.unit_amount,4900);assert.equal(p.line_items?.[0].price_data?.currency,'eur');assert.equal(p.line_items?.[0].price_data?.recurring?.interval,'month');
  assert.match(p.integration_identifier!,/^reputationpro_[a-z]{8}$/);assert.equal('payment_method_types' in p,false);
  assert.equal(p.metadata?.client_id,c.id);
  assert.deepEqual(checkoutParams(c,'http://127.0.0.1:3000'),p,'Idempotent checkout retry must send identical parameters');
});
test('Billing stays disabled even if credentials or readiness flags are supplied',()=>{
  const local={APP_URL:'http://127.0.0.1:3001',DEMO_MODE:'true'};
  assert.equal(billingMode(local),'disabled');
  const sandbox={...local,STRIPE_SECRET_KEY:'rk_test_example',STRIPE_WEBHOOK_SECRET:'local_test',REPUTATION_SMTP_CONFIG:'smtp.json',STRIPE_PORTAL_CONFIGURATION:'bpc_test',DATABASE_PATH:join(dir,'sandbox.db')};
  assert.equal(billingMode(sandbox),'disabled');
  assert.equal(billingMode({...sandbox,DATABASE_PATH:'./data/reputation.db'}),'disabled');
  assert.equal(billingMode({...sandbox,APP_URL:'https://reputacija.verslomatika.lt'}),'disabled');
  const live={APP_URL:'https://reputacija.verslomatika.lt',STRIPE_SECRET_KEY:'rk_live_example',STRIPE_WEBHOOK_SECRET:'local_test',STRIPE_PRICE_ID:'price_example',REPUTATION_SMTP_CONFIG:'smtp.json',STRIPE_PORTAL_CONFIGURATION:'bpc_live'};
  assert.equal(billingMode(live),'disabled');
  assert.equal(billingMode({...live,STRIPE_LIVE_READY:'true'}),'disabled');
  assert.equal(billingMode({...live,STRIPE_LIVE_READY:'true',STRIPE_PRICE_ID:''}),'disabled');
  assert.equal(billingMode({...live,STRIPE_LIVE_READY:'true',REPUTATION_SMTP_CONFIG:''}),'disabled');
  assert.equal(billingMode({...live,STRIPE_LIVE_READY:'true',STRIPE_PORTAL_CONFIGURATION:''}),'disabled');
});
test('Only verified webhook processing activates real clients; event retries are idempotent',()=>{
  const c=createClient({business_name:'Paid Test',email:'paid@example.test',slug:'paid-test',google_review_url:'https://www.google.com/maps'});
  assert.equal(c.subscription_status,'pending');
  const sub={id:'sub_test',customer:'cus_test',status:'trialing',trial_end:Math.floor(Date.now()/1000)+14*86400,metadata:{client_id:c.id}} as unknown as Stripe.Subscription;
  const event={id:'evt_subscription_1',type:'customer.subscription.updated',data:{object:sub}} as unknown as Stripe.Event;
  processStripeEvent(event);processStripeEvent(event);
  assert.equal(getClient('paid-test')?.subscription_status,'trialing');
  assert.equal((db().prepare('SELECT COUNT(*) count FROM stripe_events WHERE id=?').get(event.id) as {count:number}).count,1);
  const canceled={id:'evt_cancel',type:'customer.subscription.deleted',data:{object:{...sub,status:'canceled'}}} as unknown as Stripe.Event;
  processStripeEvent(canceled);assert.equal(getClient('paid-test')?.subscription_status,'canceled');
});
test('Unpaid checkout completion cannot activate a subscription',()=>{
  const c=createClient({business_name:'Unpaid Test',email:'unpaid@example.test',slug:'unpaid-test',google_review_url:'https://www.google.com/maps'});
  const event={id:'evt_unpaid',type:'checkout.session.completed',data:{object:{payment_status:'unpaid',metadata:{client_id:c.id}}}} as unknown as Stripe.Event;
  processStripeEvent(event,{id:'sub_unpaid',customer:'cus_unpaid',status:'incomplete',trial_end:null} as unknown as Stripe.Subscription);
  assert.equal(getClient('unpaid-test')?.subscription_status,'pending');
});
test('Invoice webhooks reconcile only the matching Stripe subscription and do not revive an unrelated one',()=>{
  const c=createClient({business_name:'Invoice Test',email:'invoice@example.test',slug:'invoice-test',google_review_url:'https://www.google.com/maps'});
  const sub={id:'sub_invoice',customer:'cus_invoice',status:'trialing',trial_end:null,metadata:{client_id:c.id}} as unknown as Stripe.Subscription;
  processStripeEvent({id:'evt_invoice_initial',type:'customer.subscription.created',data:{object:sub}} as unknown as Stripe.Event);
  const invoice={parent:{subscription_details:{subscription:'sub_invoice'}}} as unknown as Stripe.Invoice;
  assert.equal(invoiceSubscriptionId(invoice),'sub_invoice');
  assert.equal(invoiceSubscriptionId({subscription:'sub_legacy'} as unknown as Stripe.Invoice),'sub_legacy');
  assert.equal(invoiceSubscriptionId({parent:null} as unknown as Stripe.Invoice),null);
  const failed={id:'evt_invoice_failed',type:'invoice.payment_failed',data:{object:invoice}} as unknown as Stripe.Event;
  processStripeEvent(failed,{...sub,status:'past_due'} as Stripe.Subscription);
  assert.equal(getClient('invoice-test')?.subscription_status,'past_due');
  processStripeEvent({id:'evt_invoice_paid',type:'invoice.paid',data:{object:invoice}} as unknown as Stripe.Event,{...sub,status:'active'} as Stripe.Subscription);
  assert.equal(getClient('invoice-test')?.subscription_status,'active');
  const wrong={...sub,id:'sub_other',status:'canceled'} as Stripe.Subscription;
  processStripeEvent({id:'evt_other',type:'customer.subscription.deleted',data:{object:wrong}} as unknown as Stripe.Event);
  assert.equal(getClient('invoice-test')?.stripe_subscription_id,'sub_invoice');
  assert.equal(getClient('invoice-test')?.subscription_status,'active');
});
