import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {chromium} from '@playwright/test';

const base=resolve(tmpdir()),dir=mkdtempSync(join(base,'rp-security-check-'));
assert.ok(resolve(dir).startsWith(base+sep),'temporary directory stays under temp root');
process.env.DATABASE_PATH=join(dir,'isolated.db');process.env.DEMO_MODE='false';
const {db,closeDb,createClient}=await import('../src/lib/db.ts');
const {createClinicCredential,issueClinicSession}=await import('../src/lib/clinic-access.ts');
const {issueEmailToken}=await import('../src/lib/clinic-mail.ts');
const old=createClient({business_name:'Test Demo',email:'demo@example.test',slug:'demo-victim',google_review_url:'https://www.google.com/maps'},true);
const claimed=createClient({business_name:'Claimed Demo',email:'claimed@example.test',slug:'demo-claimed',google_review_url:'https://www.google.com/maps'},true);
const paid=createClient({business_name:'Verified Test',email:'paid@example.test',slug:'verified-test',google_review_url:'https://www.google.com/maps'});
const password='test-password-123';createClinicCredential(claimed.id,password);createClinicCredential(paid.id,password);
db().prepare('INSERT INTO clinic_email_verifications(client_id,verified_at) VALUES (?,?)').run(claimed.id,Date.now());
db().prepare('INSERT INTO clinic_email_verifications(client_id,verified_at) VALUES (?,?)').run(paid.id,Date.now());
db().prepare("UPDATE clients SET stripe_subscription_id='sub_test_local',subscription_status='active' WHERE id=?").run(paid.id);
const claimedToken=issueClinicSession(claimed.id).token,resetToken=issueEmailToken(claimed.id,'reset');
const feedbackId=randomUUID();db().prepare('INSERT INTO internal_feedback(id,client_id,rating,feedback_text) VALUES (?,?,?,?)').run(feedbackId,old.id,2,'Synthetic private test message');
closeDb();
function rows(){const sql=new DatabaseSync(join(dir,'isolated.db'),{readOnly:true});const data={clients:sql.prepare('SELECT * FROM clients ORDER BY id').all(),feedback:sql.prepare('SELECT * FROM internal_feedback ORDER BY id').all(),credentials:sql.prepare('SELECT * FROM clinic_credentials ORDER BY client_id').all()};sql.close();return JSON.stringify(data);}
const before=rows(),origin='http://127.0.0.1:3143';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3143'],{cwd:process.cwd(),env:{...process.env,DATABASE_PATH:join(dir,'isolated.db'),APP_URL:origin,DEMO_MODE:'false',REPUTATION_BUILD_DIR:'.next-safety3-20261028',ADMIN_EMAIL:'owner@example.test',ADMIN_PASSWORD:'owner-test-password-long',SESSION_SECRET:'local-test-session-secret-long-enough',STRIPE_SECRET_KEY:'rk_test_local',STRIPE_LIVE_READY:'true'},stdio:'ignore',windowsHide:true});
const request=(path,opts={})=>fetch(origin+path,{redirect:'manual',...opts});
const post=(data,cookie)=>({method:'POST',headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(data)});
try {
 let ready=false;for(let i=0;i<80;i++){try{if((await request('/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 const attacker={business_name:'Attempted takeover',email:'attacker@example.test',slug:'demo-victim',google_review_url:'https://www.google.com/maps',password,password_confirm:password};
 const attempt=await request('/api/checkout',post(attacker));assert.equal(attempt.status,503);assert.equal(attempt.headers.get('set-cookie'),null);
 assert.equal((await request('/api/checkout',post({...attacker,slug:'new-unique-slug'}))).status,503);
 assert.equal((await request('/api/auth/verify-email',post({token:'dummy',password}))).status,503);
 assert.equal((await request('/api/auth/login',post({email:'claimed@example.test',password}))).status,401);
 const priorCookie='rp_owner_session='+claimedToken;
 assert.equal((await request('/api/admin/export?slug=demo-claimed',{headers:{cookie:priorCookie}})).status,401);
 assert.equal((await request('/api/auth/reset-password',post({token:resetToken,password:'replacement-password',password_confirm:'replacement-password'}))).status,400);
 assert.equal(rows(),before,'clients, credentials and feedback remain unchanged');
 const paidLogin=await request('/api/auth/login',post({email:'paid@example.test',password}));assert.equal(paidLogin.status,200);
 const paidCookie=paidLogin.headers.get('set-cookie')?.split(';')[0];assert.ok(paidCookie);
 assert.equal((await request('/api/admin/export?slug=demo-victim',{headers:{cookie:paidCookie}})).status,404);
 const ownerLogin=await request('/api/auth/login',post({email:'owner@example.test',password:'owner-test-password-long'}));assert.equal(ownerLogin.status,200);
 const ownerCookie=ownerLogin.headers.get('set-cookie')?.split(';')[0];assert.ok(ownerCookie);
 assert.equal((await request('/api/admin/export?slug=demo-victim',{headers:{cookie:ownerCookie}})).status,200);
 const checkout=await request('/checkout?slug=demo-victim');assert.equal(checkout.status,200);const html=await checkout.text();assert.ok(!html.includes('name="password"'));assert.ok(!html.includes('demo@example.test'));
 assert.equal((await request('/r/demo-victim')).status,200);
 const browser=await chromium.launch({channel:'chrome',headless:true});try{const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto(origin+'/checkout');assert.ok(await page.getByRole('heading',{name:'Registracija laikinai sustabdyta.'}).isVisible());const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('*')].filter(x=>x.getBoundingClientRect().right>innerWidth+1).slice(0,5).map(x=>({tag:x.tagName,cls:x.className,right:x.getBoundingClientRect().right}))}));assert.equal(layout.scroll<=layout.width,true,JSON.stringify(layout));await page.goto(origin+'/r/demo-victim');for(const n of [1,2,3,4,5]){await page.getByRole('button',{name:`${n} ${n===1?'žvaigždutė':'žvaigždutės'}`,exact:true}).click();await page.getByRole('link',{name:'Rašyti atsiliepimą Google'}).waitFor({state:'visible'});assert.ok(await page.getByRole('button',{name:'Rašyti privačiai'}).isVisible());}}finally{await browser.close();}
 console.log('PASS isolated registration lock, old demo session and reset lock, data preservation, owner access, tenant isolation and equal-choice demo.');
}finally{server.kill();await new Promise(resolve=>server.once('exit',resolve));rmSync(dir,{recursive:true,force:true});}


