import {NextRequest,NextResponse} from 'next/server';
import {COOKIE,fail,hash,localHost,safeOrigin} from '@/lib/auth';
import {db} from '@/lib/db';
export async function POST(req:NextRequest){if(!localHost(req.headers.get('host')))return fail('Nerasta.',404);if(!safeOrigin(req))return fail('Netinkama užklausos kilmė.',403);const token=req.cookies.get(COOKIE)?.value;if(token)db().prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));const response=NextResponse.json({ok:true});response.cookies.delete(COOKIE);return response;}
