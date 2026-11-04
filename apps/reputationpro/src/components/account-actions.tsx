'use client';
import { useState,type FormEvent } from 'react';
import Link from 'next/link';

export function VerifyAccount({token}:{token:string}) {
  const [busy,setBusy]=useState(false),[problem,setProblem]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setProblem('');try{const form=new FormData(e.currentTarget);const res=await fetch('/api/auth/verify-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password:form.get('password')})});const data=await res.json();if(!res.ok)throw new Error(data.error);window.location.assign(data.url);}catch(e){setProblem(e instanceof Error?e.message:'Nepavyko patvirtinti.');setBusy(false);}}
  return <><p>Įveskite registruodamiesi pasirinktą slaptažodį. Tada atversime Stripe atsiskaitymo langą.</p><form className="stack-form" onSubmit={submit}><label>Registracijos slaptažodis<input required name="password" type="password" autoComplete="current-password" minLength={12} maxLength={128}/></label>{problem&&<p className="form-error" role="alert">{problem}</p>}<button className="btn btn-primary" disabled={busy}>{busy?'Tikrinama…':'Patvirtinti ir tęsti'}</button></form></>;
}
export function ResetRequest() {
  const [busy,setBusy]=useState(false),[done,setDone]=useState(false),[problem,setProblem]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setProblem('');try{const data=new FormData(e.currentTarget);const res=await fetch('/api/auth/reset-request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:data.get('email')})});const body=await res.json();if(!res.ok)throw new Error(body.error);setDone(true);}catch(e){setProblem(e instanceof Error?e.message:'Nepavyko išsiųsti.');}finally{setBusy(false);}}
  if(done)return <p role="status">Jei paskyra yra ir el. paštas patvirtintas, atsiuntėme slaptažodžio atkūrimo nuorodą.</p>;
  return <form className="stack-form" onSubmit={submit}><label>El. paštas<input required name="email" type="email" autoComplete="email" maxLength={254}/></label>{problem&&<p className="form-error" role="alert">{problem}</p>}<button className="btn btn-primary" disabled={busy}>{busy?'Siunčiama…':'Siųsti atkūrimo nuorodą'}</button></form>;
}
export function ResetPassword({token}:{token:string}) {
  const [busy,setBusy]=useState(false),[done,setDone]=useState(false),[problem,setProblem]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setProblem('');try{const form=new FormData(e.currentTarget);const res=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password:form.get('password'),password_confirm:form.get('password_confirm')})});const data=await res.json();if(!res.ok)throw new Error(data.error);setDone(true);}catch(e){setProblem(e instanceof Error?e.message:'Nepavyko pakeisti.');}finally{setBusy(false);}}
  if(done)return <p role="status">Slaptažodis pakeistas. <Link href="/admin/login">Prisijungti</Link></p>;
  return <form className="stack-form" onSubmit={submit}><label>Naujas slaptažodis<input required name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128}/></label><label>Pakartokite slaptažodį<input required name="password_confirm" type="password" autoComplete="new-password" minLength={12} maxLength={128}/></label>{problem&&<p className="form-error" role="alert">{problem}</p>}<button className="btn btn-primary" disabled={busy}>{busy?'Saugoma…':'Pakeisti slaptažodį'}</button></form>;
}
