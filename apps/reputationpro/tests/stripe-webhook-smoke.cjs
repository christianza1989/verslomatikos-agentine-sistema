// Run against a separately built server and a disposable SQLite database.
// No request in this test contacts Stripe or uses a real credential.
const {spawn}=require('node:child_process');
const {mkdtempSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join}=require('node:path');
const assert=require('node:assert/strict');
const Stripe=require('stripe');
const {DatabaseSync}=require('node:sqlite');
const dir=mkdtempSync(join(tmpdir(),'rp-stripe-smoke-'));
const port=31847;
const secret='local-only-signature-test';
const env={...process.env,REPUTATION_BUILD_DIR:process.env.SMOKE_BUILD_DIR || '.next-stripe-prep-20261027',DATABASE_PATH:join(dir,'test.db'),APP_URL:`http://127.0.0.1:${port}`,DEMO_MODE:'false',STRIPE_SECRET_KEY:'local-only-not-a-real-key',STRIPE_WEBHOOK_SECRET:secret,STRIPE_PRICE_ID:''};
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env,stdio:'ignore'});
const endpoint=`http://127.0.0.1:${port}/api/stripe/webhook`;
async function run(){
  for(let i=0;i<50;i++){
    if(child.exitCode!==null)throw Error('Isolated server exited before becoming ready');
    try{const r=await fetch(`http://127.0.0.1:${port}/api/health`);if(r.ok)break;}catch{}
    await new Promise(resolve=>setTimeout(resolve,200));
    if(i===49)throw Error('Isolated server did not start');
  }
  const event={id:'evt_local_invoice',type:'invoice.paid',data:{object:{id:'in_local',parent:null}}};
  const payload=JSON.stringify(event);
  const sign=Stripe.webhooks.generateTestHeaderString({payload,secret});
  const post=signature=>fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','stripe-signature':signature},body:payload});
  assert.equal((await post('invalid')).status,400);
  assert.equal((await post(sign)).status,200);
  assert.equal((await post(sign)).status,200);
  if(process.env.SMOKE_EXPECT_BILLING_GUARD==='true'){
    const response=await fetch(`http://127.0.0.1:${port}/api/checkout`,{method:'POST',headers:{'content-type':'application/json','origin':`http://127.0.0.1:${port}`},body:JSON.stringify({business_name:'Test clinic',email:'owner@example.test',slug:'test-clinic',google_review_url:'https://www.google.com/maps'})});
    assert.equal(response.status,503,'Unready billing must remain disabled');
  }
  const db=new DatabaseSync(join(dir,'test.db'),{readOnly:true});
  try{assert.equal(db.prepare('SELECT count(*) AS n FROM stripe_events WHERE id=?').get(event.id).n,1);}finally{db.close();}
  console.log('Isolated webhook: invalid signature rejected; signed event and retry accepted once.'+(process.env.SMOKE_EXPECT_BILLING_GUARD==='true'?' Unready billing remains disabled.':''));
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{
  if(child.exitCode===null){child.kill();await new Promise(resolve=>child.once('exit',resolve));}
  rmSync(dir,{recursive:true,force:true});
});
