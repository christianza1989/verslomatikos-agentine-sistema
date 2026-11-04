import { existsSync,writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
if(Number(process.versions.node.split('.')[0])<24)throw new Error('ReputationPro requires Node.js 24 or newer (node:sqlite).');
if(existsSync('.env.local')){console.log('Existing .env.local preserved.');process.exit(0);}
writeFileSync('.env.local',[
  'APP_URL=http://127.0.0.1:3000','NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000','DATABASE_PATH=./data/reputation.db','DEMO_MODE=true',
  'ADMIN_EMAIL=owner@reputationpro.local','ADMIN_PASSWORD='+randomBytes(15).toString('base64url'),
  'SESSION_SECRET='+randomBytes(48).toString('hex'),'STRIPE_SECRET_KEY=','STRIPE_WEBHOOK_SECRET=','STRIPE_PRICE_ID=',''
].join('\n'),{mode:0o600});
console.log('Created private .env.local with a random owner password and session secret. Open that file for login details.');
