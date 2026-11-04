'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Star, ArrowUpRight, ArrowLeft, ShieldCheck, Check, LoaderCircle, MessageSquare } from 'lucide-react';

export function ReviewGate({slug,name,googleUrl,isDemo}:{slug:string;name:string;googleUrl:string;isDemo:boolean}) {
  const isMemocastingDemo = isDemo && slug === 'memocasting';
  const [rating,setRating]=useState<number|null>(null), [hover,setHover]=useState(0), [busy,setBusy]=useState(false);
  const [problem,setProblem]=useState(''), [sent,setSent]=useState(false), [showForm,setShowForm]=useState(false);
  const [submissionId]=useState(()=>crypto.randomUUID());
  async function choose(n:number) {
    if(busy)return;
    setProblem('');setBusy(true);
    try {
      const res=await fetch('/api/rating',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,rating:n})});
      const data=await res.json();if(!res.ok)throw new Error(data.error);
      setRating(n);
      setShowForm(n <= 3);
    } catch(e) {setProblem(e instanceof Error?e.message:'Nepavyko išsaugoti įvertinimo.');}
    finally {setBusy(false);}
  }
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();if(rating===null)return;setBusy(true);setProblem('');const f=new FormData(e.currentTarget);
    try {
      const res=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,rating,submission_id:submissionId,feedback_text:f.get('feedback_text'),customer_name:f.get('customer_name'),customer_phone:f.get('customer_phone'),consent:f.get('consent')==='on',website:f.get('website')||''})});
      const data=await res.json();if(!res.ok)throw new Error(data.error);setSent(true);
    } catch(e) {setProblem(e instanceof Error?e.message:'Nepavyko pateikti žinutės.');}
    finally {setBusy(false);}
  }
  return <div className="gate-shell">
    <div className="gate-top"><Link href="/" className="subtle-link"><ArrowLeft size={16}/> ReputationPro</Link>{isDemo&&<span className="demo-label">DEMONSTRACIJA</span>}</div>
    {isDemo&&<div style={{background:'#f5f3ff',border:'1px solid #c7d2fe',borderRadius:'12px',padding:'10px 16px',margin:'0 auto 16px',maxWidth:'520px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',fontSize:'13px',color:'#3730a3'}}><span>Demonstracinis puslapis.</span><Link href="https://verslomatika.lt/reputacija/" style={{background:'#5636e8',color:'#ffffff',padding:'6px 14px',borderRadius:'6px',fontWeight:'700',textDecoration:'none',display:'inline-flex',alignItems:'center',gap:'4px',whiteSpace:'nowrap'}}>Apie sprendimą <ArrowUpRight size={14}/></Link></div>}
    <main id="main" className="gate-card">
      <div className="clinic-monogram">{name.split(' ').slice(0,2).map(w=>w[0]).join('')}</div><p className="clinic-name">{name}</p>
      {sent ? <div className="gate-success" role="status"><span className="success-circle"><Check size={30}/></span><h1>Ačiū, kad parašėte.</h1><p>{isMemocastingDemo ? 'Jūsų žinutė išsaugota demonstraciniame vadovo skydelyje.' : 'Jūsų žinutė išsaugota vadovo dėžutėje. Jei palikote telefono numerį, vadovas galės su Jumis susisiekti.'}</p><div className="private-note"><ShieldCheck size={17}/> Ši žinutė viešai neskelbiama.</div></div> : <>
        <h1>Kaip vertinate savo patirtį?</h1>
        <p className="gate-description">Jūsų patirtis mums svarbi. Skirkite akimirką ir pasidalinkite savo įvertinimu.</p>
        <fieldset className="rating-fieldset"><legend className="sr-only">Įvertinkite patirtį nuo 1 iki 5 žvaigždučių</legend><div className="rating-stars" onMouseLeave={()=>setHover(0)}>{[1,2,3,4,5].map(n=><button type="button" key={n} disabled={busy} className={(hover||rating||0)>=n?'selected':''} aria-label={`${n} ${n===1?'žvaigždutė':'žvaigždutės'}`} aria-pressed={rating===n} onMouseEnter={()=>setHover(n)} onFocus={()=>setHover(n)} onBlur={()=>setHover(0)} onClick={()=>choose(n)}><Star size={43} strokeWidth={1.4} fill={(hover||rating||0)>=n?'currentColor':'none'}/></button>)}</div><div className="rating-scale"><span>Galime geriau</span><span>Puikiai</span></div></fieldset>
        {rating!==null&&<section className="gate-options" aria-label="Kaip norėtumėte pasidalinti?">
          {rating >= 4 ? (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px', marginBottom: '14px', color: '#065f46' }}>
                <strong style={{ display: 'block', fontSize: '15.5px', marginBottom: '4px' }}>🟢 Dėkojame už puikų įvertinimą!</strong>
                <span style={{ fontSize: '13.5px', lineHeight: '1.5' }}>Kviečiame skirti 10 sekundžių ir pasidalinti savo 5★ patirtimi „Google Maps“ tinkle.</span>
              </div>
              <a className="btn btn-primary btn-full" href={googleUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15.5px', padding: '14px', color: '#fff', fontWeight: '700', borderRadius: '10px', textDecoration: 'none' }}>
                Rašyti 5★ atsiliepimą Google <ArrowUpRight size={18} />
              </a>
              <div style={{ marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary btn-small" onClick={()=>setShowForm(!showForm)} style={{ fontSize: '12.5px', color: '#64748b' }}>
                  <MessageSquare size={14}/> {showForm ? 'Uždaryti asmeninę formą' : 'Arba parašyti privačią pastabą vadovui'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '16px' }}>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', marginBottom: '14px', color: '#92400e', textAlign: 'left' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', marginBottom: '4px' }}>
                  <ShieldCheck size={18} color="#b45309" /> Jūsų nuomonė svarbi vadovui
                </strong>
                <span style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
                  Apgailestaujame, kad patirtis nebuvo ideali. Prašome parašyti tiesiai vadovui, kad išspręstume situaciją. Ši žinutė <strong>nėra skelbiama viešai</strong>.
                </span>
              </div>
            </div>
          )}
          {showForm&&<form id="private-feedback" onSubmit={submit} className="feedback-form"><label htmlFor="feedback_text">Jūsų pastaba ar atsiliepimas <span>(privaloma)</span></label><textarea id="feedback_text" name="feedback_text" required minLength={10} maxLength={3000} rows={4} placeholder="Kas nutiko ir kaip galėtume pasitaisyti?"/><small>Konfidencialu. Žinutė bus perduota tiesiogiai įmonės vadovui.</small><div className="form-row"><label>Vardas <span>(nebūtina)</span><input name="customer_name" autoComplete="given-name" maxLength={100} placeholder="Jūsų vardas"/></label><label>Telefonas <span>(nebūtina)</span><input name="customer_phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+370"/></label></div><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className="checkbox-label"><input type="checkbox" name="consent" required/><span>{isMemocastingDemo ? 'Sutinku, kad demonstracijos savininkas perskaitytų šią žinutę.' : 'Sutinku, kad įmonės vadovas perskaitytų šią žinutę ir, jei palikau kontaktą, su manimi susisiektų.'} <Link href="/privacy">Apie duomenis</Link></span></label><button disabled={busy} className="btn btn-primary btn-full" type="submit">{busy?<LoaderCircle size={18} className="spin"/>:<MessageSquare size={18}/>} {busy?'Siunčiama…':isMemocastingDemo?'Siųsti privačią žinutę':'Siųsti tiesiai vadovui'}</button></form>}
          {rating <= 3 && (
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', textAlign: 'center' }}>
              Norite pasidalinti viešai? <a href={googleUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#64748b', textDecoration: 'underline' }}>Google atsiliepimų nuoroda ↗</a>
            </p>
          )}
        </section>}
        {problem&&<p role="alert" className="form-error">{problem}</p>}
      </>}
      {sent&&<div className="google-option"><span>Norite pasidalinti viešai?</span><a href={googleUrl} target="_blank" rel="noopener noreferrer">Rašyti atsiliepimą Google <ArrowUpRight size={15}/></a></div>}
      {isDemo&&<p className="demo-disclosure">{isMemocastingDemo ? 'Demonstracija. Google nuoroda atveria tikrą „Memocasting“ profilį; atsiliepimą rašykite tik turėję tikrą patirtį.' : 'Demonstracinis puslapis. Paspaudus 5★, atveriama tiesioginė šios įmonės Google atsiliepimo forma.'}</p>}
    </main><p className="gate-footer"><ShieldCheck size={14}/> Sukurta su ReputationPro</p>
  </div>;
}
