// Ephemeral local Stripe sandbox runner. Reads restricted credentials from the
// ACL-protected test directory and never prints either key or signing secret.
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const privateDir=path.resolve('data/operations/stripe-sandbox-private');
const key=fs.readFileSync(path.join(privateDir,'api-key'),'utf8').trim();
const price=fs.readFileSync(path.join(privateDir,'price-id'),'utf8').trim();
if(!key.startsWith('rk_test_')||!price.startsWith('price_'))throw Error('Invalid sandbox credentials');
const port=31848;
const events='checkout.session.completed,checkout.session.async_payment_succeeded,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed';
const shim=path.join(privateDir,'cli/node_modules/@stripe/cli/bin/shim.js');
const listener=spawn(process.execPath,[shim,'listen','--skip-update','--events',events,'--forward-to',`http://127.0.0.1:${port}/api/stripe/webhook`],{env:{...process.env,STRIPE_API_KEY:key},stdio:['ignore','pipe','pipe']});
let server,buffer='',started=false;
const timer=setTimeout(()=>{if(!started){console.error('Stripe sandbox listener did not become ready.');cleanup(1);}},40000);
function cleanup(code){clearTimeout(timer);if(server)server.kill();listener.kill();process.exitCode=code;}
function handle(chunk){
  buffer+=chunk.toString();
  const match=buffer.match(/whsec_[A-Za-z0-9]+/);
  if(!started&&match){
    started=true;clearTimeout(timer);
    server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{
      env:{...process.env,REPUTATION_BUILD_DIR:'.next-stripe-prep2-20261027',DATABASE_PATH:path.join(privateDir,'sandbox.db'),APP_URL:`http://127.0.0.1:${port}`,DEMO_MODE:'true',STRIPE_SECRET_KEY:key,STRIPE_WEBHOOK_SECRET:match[0],STRIPE_PRICE_ID:price},stdio:['ignore','ignore','ignore']});
    server.once('exit',code=>{console.error('Sandbox server stopped.');cleanup(code||1);});
    console.log(`Stripe sandbox listener active; local application starting at http://127.0.0.1:${port}/checkout`);
  }
  // Never echo provider output: it can contain secrets or customer data.
  if(buffer.length>30000)buffer=buffer.slice(-10000);
}
listener.stdout.on('data',handle);listener.stderr.on('data',handle);
listener.once('exit',code=>{if(!started){
  const safe=buffer.replace(/(?:whsec|[sr]k_(?:test|live))_[A-Za-z0-9]+/g,'[secret]');
  console.error('Stripe sandbox listener exited before becoming ready:',safe.slice(-1000));
}if(server)server.kill();clearTimeout(timer);process.exitCode=code||1;});
process.on('SIGINT',()=>cleanup(0));process.on('SIGTERM',()=>cleanup(0));
