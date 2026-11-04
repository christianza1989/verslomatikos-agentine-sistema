// Executes the compiled route handlers directly against an isolated SQLite DB.
// No network server or production data is used.
const assert = require('node:assert/strict');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
globalThis.AsyncLocalStorage = require('node:async_hooks').AsyncLocalStorage;
const { NextRequest } = require('next/server');

const dir = mkdtempSync(path.join(tmpdir(), 'reputationpro-equal-choice-'));
process.env.DATABASE_PATH = path.join(dir, 'test.db');
process.env.APP_URL = 'http://127.0.0.1:3001';
process.env.DEMO_MODE = 'true';
const rating = require('../.next-equal-choice-20261027/server/app/api/rating/route.js').routeModule.userland.POST;
const feedback = require('../.next-equal-choice-20261027/server/app/api/feedback/route.js').routeModule.userland.POST;
const request = (route, body) => new NextRequest('http://127.0.0.1:3001/api/'+route, {
  method: 'POST', headers: {'content-type':'application/json', origin:'http://127.0.0.1:3001', host:'127.0.0.1:3001'}, body: JSON.stringify(body)
});

(async () => {
  for (const n of [1,2,3,4,5]) {
    const response = await rating(request('rating',{slug:'vilniaus-denta',rating:n}));
    assert.equal(response.status,200); assert.deepEqual(await response.json(),{ok:true});
    const id=randomUUID();
    const privateResult=await feedback(request('feedback',{slug:'vilniaus-denta',rating:n,submission_id:id,feedback_text:'Izoliuoto testo pranešimas',consent:true,website:''}));
    assert.equal(privateResult.status,201,`Private feedback for ${n} stars`);
  }
  const bad=await feedback(request('feedback',{slug:'vilniaus-denta',rating:6,submission_id:randomUUID(),feedback_text:'Izoliuoto testo pranešimas',consent:true}));
  assert.equal(bad.status,400);
  const sqlite=new DatabaseSync(process.env.DATABASE_PATH, {readOnly:true});
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM review_events').get().n,5);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM internal_feedback').get().n,5);
  sqlite.close();
  console.log('Compiled API: all five ratings return no redirect and accept private feedback; invalid rating rejected. Isolated DB.');
})().catch(error=>{console.error(error);process.exitCode=1;});
