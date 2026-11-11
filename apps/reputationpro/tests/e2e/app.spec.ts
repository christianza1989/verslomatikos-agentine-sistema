import { test,expect } from '@playwright/test';
import { readFileSync,mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const vars=Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const origin=process.env.REPUTATION_TEST_ORIGIN || 'http://127.0.0.1:3000';
async function login(page:import('@playwright/test').Page){await page.goto('/admin/login');await page.getByLabel('El. paštas',{exact:true}).fill(vars.ADMIN_EMAIL);await page.getByLabel('Slaptažodis',{exact:true}).fill(vars.ADMIN_PASSWORD);await page.getByRole('button',{name:'Prisijungti',exact:true}).click();await expect(page).toHaveURL(/\/admin$/);}
test('landing and mobile layout communicate price and have no horizontal overflow',async({page})=>{
  await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('reputacija');await expect(page.locator('#kaina')).toContainText('49');
  await page.setViewportSize({width:390,height:844});await expect(page.getByRole('link',{name:'Išbandyti 14 dienų'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
test('admin data and mutations require login, cross-origin writes are denied',async({page,request})=>{
  await page.goto('/admin');await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await request.patch('/api/admin/feedback',{data:{id:randomUUID(),status:'resolved'}})).status()).toBe(401);
  expect((await request.get('/api/admin/export?slug=vilniaus-denta')).status()).toBe(401);
  expect((await request.get('/api/admin/qr?slug=vilniaus-denta')).status()).toBe(401);
  expect((await request.post('/api/rating',{headers:{Origin:'https://evil.test'},data:{slug:'vilniaus-denta',rating:5}})).status()).toBe(403);
});
test('each rating offers the same optional private and public choices without redirect',async({page})=>{
  for(const n of [1,2,3,4,5]){
    await page.goto('/r/vilniaus-denta');
    await page.getByRole('button',{name:`${n} ${n===1?'žvaigždutė':'žvaigždutės'}`,exact:true}).click();
    await expect(page).toHaveURL(/\/r\/vilniaus-denta$/);
    await expect(page.getByRole('link',{name:'Rašyti atsiliepimą Google'})).toHaveAttribute('href',/https:\/\/www\.google\.com\/maps\/search/);
    await expect(page.getByLabel('Jūsų žinutė',{exact:false})).toHaveCount(0);
    await page.getByRole('button',{name:'Rašyti privačiai'}).click();
    await expect(page.getByLabel('Jūsų žinutė',{exact:false})).toBeVisible();
  }
});
test('private feedback is persisted, shown only to owner, resolved, exported and QR downloaded',async({page,request})=>{
  const text='E2E pacientas: norėčiau aiškesnės informacijos '+Date.now();await page.goto('/r/vilniaus-denta');await page.getByRole('button',{name:'5 žvaigždutės',exact:true}).click();await page.getByRole('button',{name:'Rašyti privačiai'}).click();await page.getByLabel('Jūsų žinutė',{exact:false}).fill(text);await page.getByLabel('Vardas',{exact:false}).fill('Testinis pacientas');await page.getByLabel('Telefonas',{exact:false}).fill('+37060000000');await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Siųsti žinutę'}).click();await expect(page.getByRole('heading',{name:'Ačiū, kad parašėte.'})).toBeVisible();
  await login(page);await page.goto('/admin?clinic=vilniaus-denta');const item=page.locator('.feedback-item').filter({hasText:text});await expect(item).toBeVisible();await item.getByRole('button',{name:'Pažymėti išspręsta'}).click();await expect(item.getByText('Išspręsta',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Naujos',exact:true}).click();await expect(page.locator('.feedback-item').filter({hasText:text})).toHaveCount(0);await page.getByRole('button',{name:'Visos',exact:true}).click();
  const csv=await page.request.get('/api/admin/export?slug=vilniaus-denta');expect(csv.status()).toBe(200);expect(await csv.text()).toContain(text);
  const qr=await page.request.get('/api/admin/qr?slug=vilniaus-denta');expect(qr.status()).toBe(200);expect(qr.headers()['content-type']).toContain('image/svg+xml');expect(await qr.text()).toContain('<svg');
  await page.getByRole('button',{name:'Atsijungti',exact:true}).click();await expect(page).toHaveURL(/\/admin\/login$/);expect((await page.request.get('/api/admin/export?slug=vilniaus-denta')).status()).toBe(401);
  expect((await request.get('/api/health')).status()).toBe(200);
});
test('validation rejects out-of-range ratings, unknown clinics and missing consent',async({request})=>{
  for(const patch of [{rating:6},{consent:false},{slug:'no-such-clinic'}]){const r=await request.post('/api/feedback',{headers:{Origin:origin},data:{slug:'vilniaus-denta',rating:2,feedback_text:'Testo pastaba klinikai',consent:true,submission_id:randomUUID(),...patch}});expect(r.status()).toBe(patch.slug?404:400);}
});
test('local demo checkout creates a new clinic without granting owner access',async({page})=>{
  await page.goto('/checkout');const unique=Date.now();await page.getByLabel('Klinikos pavadinimas',{exact:true}).fill('Testinė klinika '+unique);await page.getByLabel('Klinikos el. paštas',{exact:true}).fill(`test-${unique}@example.test`);await page.getByLabel(/^Google Maps atsiliepimų nuoroda/).fill('https://www.google.com/maps');await page.getByRole('button',{name:'Sukurti testinę kliniką'}).click();await expect(page.getByRole('heading',{name:'Testinė klinika paruošta.'})).toBeVisible();await page.getByRole('link',{name:'Atverti paciento puslapį'}).click();await expect(page.locator('.clinic-name')).toContainText('Testinė klinika');await page.goto('/admin');await expect(page).toHaveURL(/\/admin\/login$/);
});
test('owner can update clinic settings and screenshots cover desktop/mobile surfaces',async({page})=>{
  await login(page);await page.goto('/admin?clinic=vilniaus-denta');await page.locator('#settings').getByLabel('Telefonas',{exact:false}).fill('+37060012345');await page.getByRole('button',{name:'Išsaugoti nustatymus'}).click();await expect(page.getByRole('status')).toContainText('Nustatymai išsaugoti');await page.reload();await expect(page.locator('#settings').getByLabel('Telefonas',{exact:false})).toHaveValue('+37060012345');
  mkdirSync('.impeccable/review',{recursive:true});
  for(const [name,path] of [['landing','/'],['admin','/admin?clinic=vilniaus-denta'],['gate','/r/vilniaus-denta'],['checkout','/checkout']]){
    for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]] as const){await page.setViewportSize({width,height});await page.goto(path);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`.impeccable/review/${name}-${size}.png`,fullPage:true,animations:'disabled'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`${name} ${size} overflow`).toBeTruthy();if(name==='gate'){await page.getByRole('button',{name:'2 žvaigždutės',exact:true}).click();await page.getByRole('button',{name:'Rašyti privačiai'}).click();await expect(page.getByLabel('Jūsų žinutė',{exact:false})).toBeVisible();await page.screenshot({path:`.impeccable/review/gate-private-${size}.png`,fullPage:true,animations:'disabled'});}}
  }
});
