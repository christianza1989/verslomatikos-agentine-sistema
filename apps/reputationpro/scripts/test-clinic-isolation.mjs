import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,readFileSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn,spawnSync } from 'node:child_process';
import { SMTPServer } from 'smtp-server';
import { createServer } from 'node:http';
import Stripe from 'stripe';
import { chromium } from '@playwright/test';

const dir=mkdtempSync(join(tmpdir(),'rp-http-isolation-'));
const cert=join(dir,'cert.pem'),key=join(dir,'key.pem'),smtpConfig=join(dir,'smtp.json');
const openssl='C:/Program Files/Git/usr/bin/openssl.exe';
const generated=spawnSync(openssl,['req','-x509','-newkey','rsa:2048','-days','1','-nodes','-keyout',key,'-out',cert,'-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1'],{stdio:'ignore',windowsHide:true});
assert.equal(generated.status,0,'create isolated SMTP certificate');
let message='';
const smtp=new SMTPServer({secure:true,key:readFileSync(key),cert:readFileSync(cert),onAuth(_auth,_session,callback){callback(null,{user:'test'});},onData(stream,_session,callback){stream.on('data',chunk=>message+=chunk);stream.on('end',()=>callback());}});
await new Promise((resolve,reject)=>{smtp.once('error',reject);smtp.listen(0,'127.0.0.1',resolve);});
writeFileSync(smtpConfig,JSON.stringify({smtp_host:'127.0.0.1',smtp_port:smtp.server.address().port,smtp_secure:true,email:'test@example.test',password:'test-only'}));
let mockClient='';
const stripeMock=createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;
  res.setHeader('Content-Type','application/json');
  if(req.url?.startsWith('/v1/prices/'))return res.end(JSON.stringify({id:'price_test_local',object:'price',unit_amount:4900,currency:'eur',recurring:{interval:'month',interval_count:1}}));
  if(req.url==='/v1/checkout/sessions'&&req.method==='POST'){mockClient=new URLSearchParams(body).get('client_reference_id')||'';return res.end(JSON.stringify({id:'cs_test_local',object:'checkout.session',url:'https://checkout.stripe.com/c/pay/cs_test_local'}));}
  if(req.url==='/v1/subscriptions/sub_local')return res.end(JSON.stringify({id:'sub_local',object:'subscription',customer:'cus_local',status:'trialing',metadata:{client_id:mockClient},trial_end:Math.floor(Date.now()/1000)+14*86400}));
  if(req.url==='/v1/billing_portal/sessions'&&req.method==='POST')return res.end(JSON.stringify({id:'bps_test_local',object:'billing_portal.session',url:'https://billing.stripe.com/p/session/test_local'}));
  res.statusCode=404;res.end(JSON.stringify({error:{message:'Unknown local test endpoint',type:'invalid_request_error'}}));
});
await new Promise(resolve=>stripeMock.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:3137';
process.env.DATABASE_PATH=join(dir,'test.db');process.env.DEMO_MODE='false';
const {db,closeDb,createClient}=await import('../src/lib/db.ts');
const {createClinicCredential}=await import('../src/lib/clinic-access.ts');
const password='test-clinic-password-123';
const a=createClient({business_name:'Clinic Alpha',email:'alpha@example.test',slug:'clinic-alpha',google_review_url:'https://www.google.com/maps'});
const b=createClient({business_name:'Clinic Beta',email:'beta@example.test',slug:'clinic-beta',google_review_url:'https://www.google.com/maps'});
const pending=createClient({business_name:'Clinic Pending',email:'pending@example.test',slug:'clinic-pending',google_review_url:'https://www.google.com/maps'});
for(const c of [a,b,pending]) {
  createClinicCredential(c.id,password);
  db().prepare('INSERT INTO clinic_email_verifications(client_id,verified_at) VALUES (?,?)').run(c.id,Date.now());
}
for(const c of [a,b])db().prepare("UPDATE clients SET stripe_subscription_id=?,stripe_customer_id=?,subscription_status='trialing' WHERE id=?").run('sub_'+c.slug,'cus_'+c.slug,c.id);
const feedbackId=randomUUID();db().prepare('INSERT INTO internal_feedback(id,client_id,rating,feedback_text) VALUES (?,?,?,?)').run(feedbackId,b.id,2,'Private message for beta');
closeDb();
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3137'],{cwd:process.cwd(),env:{...process.env,DEMO_MODE:'true',REPUTATION_BUILD_DIR:'.next-clinic-access-20261027',APP_URL:origin,ADMIN_EMAIL:'owner@example.test',ADMIN_PASSWORD:'owner-password-for-local-test',SESSION_SECRET:'local-test-session-secret-long-enough',STRIPE_SECRET_KEY:'rk_test_local_stub',STRIPE_WEBHOOK_SECRET:'whsec_local_stub',STRIPE_PRICE_ID:'price_test_local',STRIPE_PORTAL_CONFIGURATION:'bpc_test_local',REPUTATION_STRIPE_MOCK_ORIGIN:`http://127.0.0.1:${stripeMock.address().port}`,REPUTATION_SMTP_CONFIG:smtpConfig,NODE_EXTRA_CA_CERTS:cert},stdio:'ignore',windowsHide:true});
const request=(path,opts={})=>fetch(origin+path,{redirect:'manual',...opts});
const json=(data,cookie)=>({method:'POST',headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(data)});
async function login(email,pass){const r=await request('/api/auth/login',json({email,password:pass}));return {response:r,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
try {
  let ready=false;
  for(let i=0;i<80;i++){try{const r=await request('/api/health');if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}
  assert.ok(ready,'isolated server started');
  const bad=await login(pending.email,password);assert.equal(bad.response.status,401);
  assert.equal((await request('/r/clinic-pending')).status,404);
  const alpha=await login(a.email,password);assert.equal(alpha.response.status,200);assert.ok(alpha.cookie);
  const page=await request('/admin?clinic=clinic-beta',{headers:{cookie:alpha.cookie}});const html=await page.text();
  assert.equal(page.status,200);assert.match(html,/Clinic Alpha/);assert.doesNotMatch(html,/Clinic Beta|Private message for beta/);
  assert.equal((await request('/api/admin/export?slug=clinic-beta',{headers:{cookie:alpha.cookie}})).status,404);
  assert.equal((await request('/api/admin/qr?slug=clinic-beta',{headers:{cookie:alpha.cookie}})).status,404);
  assert.equal((await request('/api/admin/export?slug=clinic-alpha',{headers:{cookie:alpha.cookie}})).status,200);
  const patch=json({id:feedbackId,status:'resolved'},alpha.cookie);patch.method='PATCH';
  assert.equal((await request('/api/admin/feedback',patch)).status,404);
  const edit=json({business_name:b.business_name,email:b.email,slug:b.slug,google_review_url:b.google_review_url,phone:''},alpha.cookie);edit.method='PATCH';
  assert.equal((await request('/api/admin/clients?id='+b.id,edit)).status,404);
  assert.equal((await request('/api/admin/clients',json({business_name:'Another',email:'another@example.test',slug:'another',google_review_url:'https://www.google.com/maps'},alpha.cookie))).status,403);
  assert.equal((await request('/api/billing/portal',json({},alpha.cookie))).status,200);
  const owner=await login('owner@example.test','owner-password-for-local-test');assert.equal(owner.response.status,200);
  assert.equal((await request('/api/admin/export?slug=clinic-beta',{headers:{cookie:owner.cookie}})).status,200);
  message='';assert.equal((await request('/api/auth/reset-request',json({email:a.email}))).status,200);
  const resetToken=message.replace(/=\r?\n/g,'').replace(/=3D/gi,'=').match(/token=([a-f0-9]{64})/)?.[1];assert.ok(resetToken,'reset email received only by isolated SMTP sink');
  assert.equal((await request('/api/auth/reset-password',json({token:resetToken,password:'replacement-local-password',password_confirm:'replacement-local-password'}))).status,200);
  assert.equal((await request('/api/auth/reset-password',json({token:resetToken,password:'replacement-local-password',password_confirm:'replacement-local-password'}))).status,400);
  assert.equal((await request('/api/admin/export?slug=clinic-alpha',{headers:{cookie:alpha.cookie}})).status,401);
  assert.equal((await login(a.email,password)).response.status,401);
  assert.equal((await login(a.email,'replacement-local-password')).response.status,200);
  message='';const signup={business_name:'Clinic Signup',email:'signup@example.test',slug:'clinic-signup',google_review_url:'https://www.google.com/maps',password,password_confirm:password};
  const start=await request('/api/checkout',json(signup));assert.equal(start.status,200);assert.equal((await start.json()).url,'/checkout/check-email');
  assert.equal((await login(signup.email,password)).response.status,401);
  const verifyToken=message.replace(/=\r?\n/g,'').replace(/=3D/gi,'=').match(/token=([a-f0-9]{64})/)?.[1];assert.ok(verifyToken,'verification email received by isolated SMTP');
  assert.equal((await request('/api/auth/verify-email',json({token:verifyToken,password:'wrong-long-password'}))).status,400);
  const verified=await request('/api/auth/verify-email',json({token:verifyToken,password}));assert.equal(verified.status,200);assert.match((await verified.json()).url,/^https:\/\/checkout\.stripe\.com\//);
  assert.equal((await request('/api/auth/verify-email',json({token:verifyToken,password}))).status,400);
  assert.equal((await login(signup.email,password)).response.status,401,'checkout redirect alone must not activate');
  const payload=JSON.stringify({id:'evt_local_signup',type:'customer.subscription.created',data:{object:{id:'sub_local',metadata:{client_id:mockClient}}}});
  const signature=new Stripe('rk_test_local_stub').webhooks.generateTestHeaderString({payload,secret:'whsec_local_stub'});
  assert.equal((await request('/api/stripe/webhook',{method:'POST',headers:{'stripe-signature':signature,'content-type':'application/json'},body:payload})).status,200);
  assert.equal((await login(signup.email,password)).response.status,200);
  assert.equal((await request('/r/clinic-signup')).status,200);
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await page.goto(origin+'/admin/login');await page.getByLabel('El. paštas',{exact:true}).fill(signup.email);
    await page.getByLabel('Slaptažodis',{exact:true}).fill(password);await page.getByRole('button',{name:'Prisijungti',exact:true}).click();
    await page.waitForURL('**/admin');assert.ok(await page.getByRole('heading',{name:'Clinic Signup'}).isVisible());
    assert.ok(await page.getByRole('button',{name:'Valdyti prenumeratą'}).isVisible());
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.goto(origin+'/r/clinic-signup');
    for(const rating of [1,2,3,4,5]) {
      await page.getByRole('button',{name:`${rating} ${rating===1?'žvaigždutė':'žvaigždutės'}`,exact:true}).click();
      await page.getByRole('link',{name:'Rašyti atsiliepimą Google'}).waitFor({state:'visible'});
      assert.ok(await page.getByRole('button',{name:'Rašyti privačiai'}).isVisible());
    }
  }finally {await browser.close();}
  assert.equal((await request('/api/auth/logout',json({},alpha.cookie))).status,200);
  assert.equal((await request('/api/admin/export?slug=clinic-alpha',{headers:{cookie:alpha.cookie}})).status,401);
  console.log('HTTP and mobile browser checks passed: tenant isolation, verified signup, mock Checkout and signed activation, local SMTP reset, portal, equal rating choices and logout.');
} finally {
  server.kill();await new Promise(resolve=>server.once('exit',resolve));await new Promise(resolve=>smtp.close(resolve));await new Promise(resolve=>stripeMock.close(resolve));rmSync(dir,{recursive:true,force:true});
}
