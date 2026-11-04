import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allowedRequestOrigin} from '../src/lib/origin.ts';
const canonical='https://reputacija.verslomatika.lt';
test('Canonical HTTPS origin works behind the Cloudflare Tunnel',()=>{
  assert.equal(allowedRequestOrigin(canonical,'reputacija.verslomatika.lt',canonical),true);
  assert.equal(allowedRequestOrigin(canonical,'127.0.0.1:3000',canonical),true);
});
test('Direct loopback preview requires matching Host, exact port and HTTP origin',()=>{
  assert.equal(allowedRequestOrigin('http://127.0.0.1:3000','127.0.0.1:3000',canonical),true);
  assert.equal(allowedRequestOrigin('http://localhost:3000','localhost:3000',canonical),true);
  for(const [origin,host] of [[null,'localhost:3000'],['null','localhost:3000'],['https://evil.test','reputacija.verslomatika.lt'],['http://localhost:3000','reputacija.verslomatika.lt'],['http://127.0.0.1:3001','127.0.0.1:3001'],['https://reputacija.verslomatika.lt.evil.test','127.0.0.1:3000'],['http://localhost:3000/path','localhost:3000']])assert.equal(allowedRequestOrigin(origin,host,canonical),false,`${origin} / ${host}`);
});
