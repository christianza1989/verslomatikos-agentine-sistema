import {createHash,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {cookies,headers} from 'next/headers';
import {NextRequest,NextResponse} from 'next/server';
import {db} from './db.ts';
export const COOKIE='revive_session';
export function localHost(host:string|null){return !!host&&/^(localhost|127\.0\.0\.1):3002$/i.test(host);}
export async function localRequest(){return localHost((await headers()).get('host'));}
export function safeOrigin(req:NextRequest){const host=req.headers.get('host');return localHost(host)&&req.headers.get('origin')===`http://${host}`;}
export function hash(value:string){return createHash('sha256').update(value).digest('hex');}
export function verifyPassword(value:string){const expected=process.env.ADMIN_PASSWORD, salt=process.env.SESSION_SECRET;if(!expected||!salt||salt.length<32)return false;return timingSafeEqual(scryptSync(value,salt,64),scryptSync(expected,salt,64));}
export function issue(){const token=randomBytes(32).toString('hex'),expires=Date.now()+8*3600000;db().prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now());db().prepare('INSERT INTO sessions VALUES (?,?)').run(hash(token),expires);return {token,expires};}
export async function authorized(){if(!await localRequest())return false;const token=(await cookies()).get(COOKIE)?.value;return !!token&&!!db().prepare('SELECT 1 FROM sessions WHERE token_hash=? AND expires_at>?').get(hash(token),Date.now());}
export function limited(bucket:string,maximum:number,window:number){const sql=db(),now=Date.now();sql.prepare('DELETE FROM limits WHERE expires_at<?').run(now);sql.prepare('INSERT INTO limits VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1').run(bucket,now+window);return Number(sql.prepare('SELECT count FROM limits WHERE bucket=?').get(bucket)?.count)>maximum;}
export function fail(message:string,status=400){return NextResponse.json({error:message},{status});}
