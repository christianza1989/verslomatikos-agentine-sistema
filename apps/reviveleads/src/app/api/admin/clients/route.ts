import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {db} from '@/lib/db';
import {authorized,fail,safeOrigin} from '@/lib/auth';
export async function POST(req:NextRequest){if(!await authorized())return fail('Nerasta.',404);if(!safeOrigin(req))return fail('Netinkama užklausos kilmė.',403);try{const input=await req.json();const name=String(input.name||'').trim().slice(0,120),email=String(input.email||'').trim().slice(0,254),phone=String(input.phone||'').trim().slice(0,40),industry=String(input.industry||'').trim().slice(0,100);if(name.length<2||!/^\S+@\S+\.\S+$/.test(email))return fail('Patikrinkite pavadinimą ir el. paštą.');const id=randomUUID();db().prepare('INSERT INTO clients(id,name,email,phone,industry) VALUES (?,?,?,?,?)').run(id,name,email,phone,industry);return NextResponse.json({ok:true,id});}catch{return fail('Nepavyko išsaugoti.');}}
