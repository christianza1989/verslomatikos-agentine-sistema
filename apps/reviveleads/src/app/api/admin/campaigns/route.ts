import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {db} from '@/lib/db';
import {authorized,fail,safeOrigin} from '@/lib/auth';
export async function POST(req:NextRequest){if(!await authorized())return fail('Nerasta.',404);if(!safeOrigin(req))return fail('Netinkama užklausos kilmė.',403);try{const input=await req.json();const name=String(input.name||'').trim().slice(0,120),client=String(input.client_id||''),niche=String(input.niche||'').trim().slice(0,100);if(name.length<2||!db().prepare('SELECT 1 FROM clients WHERE id=?').get(client))return fail('Pasirinkite įmonę ir įveskite pavadinimą.');db().prepare('INSERT INTO campaigns(id,client_id,name,niche) VALUES (?,?,?,?)').run(randomUUID(),client,name,niche);return NextResponse.json({ok:true});}catch{return fail('Nepavyko išsaugoti.');}}
