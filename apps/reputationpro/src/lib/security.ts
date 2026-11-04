import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from './db';
import { allowedRequestOrigin } from './origin';
import { clinicSession, type Principal } from './clinic-access';

export const SESSION_COOKIE = 'rp_owner_session';
export function appUrl() { return (process.env.APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, ''); }
export function demoEnabled() { return process.env.DEMO_MODE === 'true' && ['localhost','127.0.0.1','[::1]'].includes(new URL(appUrl()).hostname); }
export function passwordMatches(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  const salt = process.env.SESSION_SECRET;
  if (!expected || !salt || salt.length < 32) return false;
  return timingSafeEqual(scryptSync(password,salt,64), scryptSync(expected,salt,64));
}
export function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
export function issueSession() {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now()+8*60*60*1000;
  db().prepare('DELETE FROM admin_sessions WHERE expires_at<?').run(Date.now());
  db().prepare('INSERT INTO admin_sessions(token_hash,expires_at) VALUES (?,?)').run(hashToken(token),expiresAt);
  return {token, expiresAt};
}
export async function isAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return !!db().prepare('SELECT 1 FROM admin_sessions WHERE token_hash=? AND expires_at>?').get(hashToken(token),Date.now());
}
export async function currentPrincipal():Promise<Principal|null> {
  const token=(await cookies()).get(SESSION_COOKIE)?.value;
  if(!token)return null;
  if(db().prepare('SELECT 1 FROM admin_sessions WHERE token_hash=? AND expires_at>?').get(hashToken(token),Date.now()))return {role:'owner'};
  const clientId=clinicSession(token);
  return clientId?{role:'clinic',clientId}:null;
}
export function sameOrigin(request: NextRequest) {
  return allowedRequestOrigin(request.headers.get('origin'),request.headers.get('host'),appUrl());
}
export function error(message: string,status=400) { return NextResponse.json({error:message},{status}); }
export function rateLimit(bucket: string, limit: number, windowMs: number) {
  const now = Date.now();
  db().prepare('DELETE FROM rate_limits WHERE resets_at<?').run(now);
  db().prepare(`INSERT INTO rate_limits(bucket,count,resets_at) VALUES (?,1,?)
    ON CONFLICT(bucket) DO UPDATE SET count=count+1`).run(bucket,now+windowMs);
  const row = db().prepare('SELECT count FROM rate_limits WHERE bucket=?').get(bucket) as {count:number};
  return row.count <= limit;
}
export async function jsonBody(request: NextRequest) {
  // Bound chunked requests as well as Content-Length requests.
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Nėra duomenų.');
  const chunks: Uint8Array[] = []; let size=0;
  while (true) { const {done,value}=await reader.read(); if(done) break; size+=value.length; if(size>20000){await reader.cancel(); throw new Error('Per daug duomenų.');} chunks.push(value); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}
