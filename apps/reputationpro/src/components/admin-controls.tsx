'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Copy, Check, LoaderCircle, ArrowUpRight, Save, ShieldCheck } from 'lucide-react';
import type { Client } from '@/lib/db';

export function Logout(){
  const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState('');
  return <div><button className="logout-btn" disabled={busy} onClick={async()=>{setBusy(true);try{const res=await fetch('/api/auth/logout',{method:'POST'});if(!res.ok)throw new Error();router.push('/admin/login');router.refresh();}catch{setError('Nepavyko atsijungti.');setBusy(false);}}}><LogOut size={17}/> {busy?'Atsijungiama…':'Atsijungti'}</button>{error&&<span role="alert">{error}</span>}</div>;
}

export function ClinicPicker({clinics,current}:{clinics:{slug:string;business_name:string}[];current:string}){
  const router=useRouter();
  return <label className="clinic-picker">Pasirinkite įmonę<select aria-label="Pasirinkite įmonę" value={current} onChange={e=>router.push('/admin?clinic='+encodeURIComponent(e.target.value))}>{clinics.map(c=><option value={c.slug} key={c.slug}>{c.business_name}</option>)}</select></label>;
}

export function CopyLink({url}:{url:string}){
  const [copied,setCopied]=useState(false),[error,setError]=useState('');
  return <><button className="btn btn-secondary btn-small" onClick={async()=>{try{await navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2500);}catch{setError('Nukopijuokite nuorodą iš teksto laukelio.');}}}>{copied?<Check size={15}/>:<Copy size={15}/>} {copied?'Nukopijuota':'Kopijuoti nuorodą'}</button>{error&&<span className="form-error" role="status">{error}</span>}</>;
}

export function ClinicForm({
  client,
  checkout=false,
  demo=false,
  initialPlan='annual'
}:{
  client?:Partial<Client>;
  checkout?:boolean;
  demo?:boolean;
  initialPlan?:string;
}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [problem,setProblem]=useState('');
  const [saved,setSaved]=useState(false);
  const [slug,setSlug]=useState(client?.slug||'');
  const [manualSlug,setManualSlug]=useState(!!client);
  const [plan,setPlan]=useState<'starter'|'pro'|'annual'>(
    (initialPlan as 'starter'|'pro'|'annual') || 'annual'
  );

  function slugify(name:string){
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70);
  }

  async function save(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setBusy(true);
    setProblem('');
    setSaved(false);
    const f=new FormData(e.currentTarget);
    const body=Object.fromEntries(f.entries());
    if(checkout && body.password!==body.password_confirm){
      setProblem('Slaptažodžiai nesutampa.');
      setBusy(false);
      return;
    }
    try{
      const res=await fetch(checkout?'/api/checkout':`/api/admin/clients${client?'?id='+client.id:''}`,{
        method:checkout||!client?'POST':'PATCH',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body)
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error);
      if(checkout){
        window.location.assign(data.url);
        return;
      }
      setSaved(true);
      router.push('/admin?clinic='+encodeURIComponent(data.slug)+'#settings');
      router.refresh();
    }catch(e){
      setProblem(e instanceof Error?e.message:'Nepavyko išsaugoti.');
    }finally{
      setBusy(false);
    }
  }

  return <form onSubmit={save} className="stack-form clinic-form">
    {checkout && (
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '13.5px', marginBottom: '8px', color: '#1e293b' }}>
          Pasirinkite planą:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <label style={{
            border: plan === 'starter' ? '2px solid #5636e8' : '1px solid #cbd5e1',
            background: plan === 'starter' ? '#f5f3ff' : '#ffffff',
            padding: '10px 8px',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'block'
          }}>
            <input type="radio" name="plan" value="starter" checked={plan === 'starter'} onChange={()=>setPlan('starter')} style={{ display: 'none' }} />
            <div style={{ fontWeight: 700, fontSize: '13.5px' }}>Starter</div>
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>29 € / mėn.</div>
          </label>
          <label style={{
            border: plan === 'pro' ? '2px solid #5636e8' : '1px solid #cbd5e1',
            background: plan === 'pro' ? '#f5f3ff' : '#ffffff',
            padding: '10px 8px',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'block'
          }}>
            <input type="radio" name="plan" value="pro" checked={plan === 'pro'} onChange={()=>setPlan('pro')} style={{ display: 'none' }} />
            <div style={{ fontWeight: 700, fontSize: '13.5px' }}>Pro</div>
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>49 € / mėn.</div>
          </label>
          <label style={{
            border: plan === 'annual' ? '2px solid #10b981' : '1px solid #cbd5e1',
            background: plan === 'annual' ? '#ecfdf5' : '#ffffff',
            padding: '10px 8px',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'block',
            position: 'relative'
          }}>
            <input type="radio" name="plan" value="annual" checked={plan === 'annual'} onChange={()=>setPlan('annual')} style={{ display: 'none' }} />
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: plan === 'annual' ? '#047857' : 'inherit' }}>Metinis</div>
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>290 € / metus</div>
          </label>
        </div>
      </div>
    )}

    {checkout && plan === 'annual' && (
      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
        <label style={{ fontWeight: 600, color: '#166534', display: 'block', marginBottom: '6px', fontSize: '13.5px' }}>
          Pristatymo adresas arba paštomatas (fiziniam akriliniam stoveliui gauti)
          <input
            required={plan === 'annual'}
            name="delivery_address"
            type="text"
            placeholder="Pvz.: Vilniaus Omniva (Ozo g. 18, Vilnius) arba biuro adresas"
            style={{ marginTop: '6px', width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '13.5px' }}
          />
        </label>
        <small style={{ color: '#15803d', display: 'block', marginTop: '4px', fontSize: '12px' }}>
          🎁 Į Metinį planą įskaičiuotas fizinis akrilinis stovelis su integruotu NFC lustu ir QR kodu (išsiunčiamas per 1–2 d.d.).
        </small>
      </div>
    )}

    <div className="form-row">
      <label>Įmonės pavadinimas<input required name="business_name" minLength={2} maxLength={120} defaultValue={client?.business_name} placeholder="Jūsų įmonės pavadinimas" onChange={e=>{if(!manualSlug)setSlug(slugify(e.target.value));}}/></label>
      <label>Kontaktinis el. paštas<input required name="email" type="email" autoComplete="email" defaultValue={client?.email} maxLength={254} placeholder="info@imone.lt"/></label>
    </div>
    <div className="form-row">
      <label>Nuorodos vardas<input required name="slug" minLength={3} maxLength={70} value={slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={e=>{setManualSlug(true);setSlug(e.target.value);}} placeholder="jusu-verslas"/><small>/r/{slug||'jusu-verslas'}</small></label>
      <label>Telefonas <span>(nebūtina)</span><input name="phone" type="tel" autoComplete="tel" maxLength={40} defaultValue={client?.phone} placeholder="+370"/></label>
    </div>
    <label>Google Maps atsiliepimų nuoroda<input required name="google_review_url" type="url" maxLength={2000} defaultValue={client?.google_review_url} placeholder="https://g.page/r/…/review"/><small>Naudokite savo Google Business Profile nuorodą „Prašyti atsiliepimų“.</small></label>
    {checkout&&<div className="form-row"><label>Prisijungimo slaptažodis<input required name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128}/><small>Mažiausiai 8 simboliai.</small></label><label>Pakartokite slaptažodį<input required name="password_confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128}/></label></div>}
    {problem&&<p role="alert" className="form-error">{problem}</p>}
    {saved&&<p className="success-text" role="status"><Check size={17}/> Nustatymai išsaugoti.</p>}
    <button className="btn btn-primary" disabled={busy}>{busy?<LoaderCircle size={18} className="spin"/>:checkout?<ArrowUpRight size={18}/>:<Save size={17}/>} {busy?'Išsaugoma…':checkout?'Aktyvuoti paskyrą (14 d. nemokamai)':client?'Išsaugoti nustatymus':'Pridėti įmonę'}</button>
    {checkout&&<p className="form-fineprint">14 dienų nemokamas bandymas be jokios banko kortelės. Po bandomojo laikotarpio pasirinksite Jums tinkamą planą.</p>}
  </form>;
}

export function BillingPortal(){
  const [busy,setBusy]=useState(false),[problem,setProblem]=useState('');
  return <div><button className="btn btn-secondary btn-small" disabled={busy} onClick={async()=>{setBusy(true);setProblem('');try{const res=await fetch('/api/billing/portal',{method:'POST'});const data=await res.json();if(!res.ok)throw new Error(data.error);window.location.assign(data.url);}catch(e){setProblem(e instanceof Error?e.message:'Nepavyko atverti prenumeratos valdymo.');setBusy(false);}}}>{busy?'Atidaroma…':'Valdyti prenumeratą'}</button>{problem&&<p className="form-error" role="alert">{problem}</p>}</div>;
}
