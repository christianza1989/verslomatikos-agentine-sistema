import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {randomUUID} from 'node:crypto';import {DatabaseSync} from 'node:sqlite';import {chromium} from '@playwright/test';
import {request as httpRequest} from 'node:http';
const origin='http://127.0.0.1:3002';const env=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
const get=(path,opts={})=>fetch(origin+path,{redirect:'manual',...opts});
const post=(data,cookie)=>({method:'POST',headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(data)});
let clientId='',cookie='';
const publicStatus=(path,method='GET')=>new Promise((resolve,reject)=>{const req=httpRequest({hostname:'127.0.0.1',port:3002,path,method,headers:{host:'reviveleads.verslomatika.lt'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);req.end();});
try {
 assert.equal((await get('/api/health')).status,200);assert.equal((await get('/admin')).status,307);
 assert.equal(await publicStatus('/admin'),404);
 assert.equal(await publicStatus('/api/admin/clients','POST'),404);
 assert.equal((await get('/api/auth/login',post({password:'wrong'}))).status,401);
 const login=await get('/api/auth/login',post({password:env.ADMIN_PASSWORD}));assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];
 const foreign=await get('/api/admin/clients',{method:'POST',headers:{cookie,origin:'https://evil.test','content-type':'application/json'},body:'{}'});assert.equal(foreign.status,403);
 const name='Acceptance '+randomUUID();const create=await get('/api/admin/clients',post({name,email:'test@example.test',phone:'',industry:'test'},cookie));assert.equal(create.status,200);clientId=(await create.json()).id;
 const form=new FormData();form.set('client_id',clientId);form.set('file',new File(['Vardas;Telefonas;Paskutinis vizitas\nBandymas;+37060000001;2024-01-01'],'test.csv',{type:'text/csv'}));
 const upload=await get('/api/admin/contacts',{method:'POST',headers:{origin,cookie},body:form});assert.equal(upload.status,200);assert.equal((await upload.json()).imported,1);
 const campaign=await get('/api/admin/campaigns',post({name:'Acceptance draft',client_id:clientId,niche:'Test'},cookie));assert.equal(campaign.status,200);
 const dashboard=await get('/admin',{headers:{cookie}});assert.equal(dashboard.status,200);assert.match(await dashboard.text(),/Acceptance draft/);
 const browser=await chromium.launch({channel:'chrome',headless:true});try{const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto(origin+'/demo');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.getByRole('button',{name:'Ketvirtadienį po darbo'}).click();await page.getByRole('button',{name:'Ketvirtadienį 17:30'}).click();assert.ok(await page.getByText('Pavyzdinis laikas').isVisible());await page.getByRole('button',{name:'Pradėti iš naujo'}).click();await page.getByRole('button',{name:'Dabar neaktualu'}).click();assert.ok(await page.getByText('Supratau, ačiū už atsakymą. Gražios dienos!').isVisible());await page.goto(origin+'/checkout?plan=pro');assert.ok(await page.getByText(/Registracija ir mokėjimai neįjungti/).isVisible());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}finally{await browser.close();}
 assert.equal((await get('/api/auth/logout',post({},cookie))).status,200);assert.equal((await get('/api/admin/clients',post({},cookie))).status,404);
 console.log('PASS health, protected admin, origin, session, CSV, draft, mobile demo and plan preview.');
} finally {
 if(clientId){const sql=new DatabaseSync('data/reviveleads.db');sql.exec('PRAGMA foreign_keys=ON');sql.exec('BEGIN IMMEDIATE');try{sql.prepare('DELETE FROM campaigns WHERE client_id=?').run(clientId);sql.prepare('DELETE FROM contacts WHERE client_id=?').run(clientId);sql.prepare('DELETE FROM clients WHERE id=?').run(clientId);sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}finally{sql.close();}}
}
