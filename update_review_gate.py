import sys
from pathlib import Path

target_file = Path(r"C:\Users\Lenovo\Documents\Agentai\apps\reputationpro\src\components\review-gate.tsx")
content = target_file.read_text(encoding="utf-8")

# 1. Update choose function to toggle showForm
old_choose = """  async function choose(n:number) {
    if(busy)return;
    setProblem('');setBusy(true);
    try {
      const res=await fetch('/api/rating',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,rating:n})});
      const data=await res.json();if(!res.ok)throw new Error(data.error);
      setRating(n);
    } catch(e) {setProblem(e instanceof Error?e.message:'Nepavyko išsaugoti įvertinimo.');}
    finally {setBusy(false);}
  }"""

new_choose = """  async function choose(n:number) {
    if(busy)return;
    setProblem('');setBusy(true);
    try {
      const res=await fetch('/api/rating',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,rating:n})});
      const data=await res.json();if(!res.ok)throw new Error(data.error);
      setRating(n);
      setShowForm(n <= 3);
    } catch(e) {setProblem(e instanceof Error?e.message:'Nepavyko išsaugoti įvertinimo.');}
    finally {setBusy(false);}
  }"""

assert old_choose in content, "old_choose not found"
content = content.replace(old_choose, new_choose, 1)

# 2. Update gate-options block
old_options = """        {rating!==null&&<section className="gate-options" aria-label="Kaip norėtumėte pasidalinti?">
          <p>Ačiū už įvertinimą. Jei norite, galite pasirinkti:</p>
          <div className="gate-option-actions"><button type="button" className="btn btn-secondary" aria-expanded={showForm} aria-controls="private-feedback" onClick={()=>setShowForm(!showForm)}><MessageSquare size={17}/> {showForm?'Uždaryti privačią formą':'Rašyti privačiai'}</button><a className="btn btn-secondary" href={googleUrl}>Rašyti atsiliepimą Google <ArrowUpRight size={15}/></a></div>
          {showForm&&<form id="private-feedback" onSubmit={submit} className="feedback-form"><label htmlFor="feedback_text">Jūsų žinutė <span>(privaloma)</span></label><textarea id="feedback_text" name="feedback_text" required minLength={10} maxLength={3000} rows={4} placeholder="Ką norėtumėte papasakoti?"/><small>Nerašykite diagnozių, asmens kodo ar kitų sveikatos duomenų.</small><div className="form-row"><label>Vardas <span>(nebūtina)</span><input name="customer_name" autoComplete="given-name" maxLength={100} placeholder="Jūsų vardas"/></label><label>Telefonas <span>(nebūtina)</span><input name="customer_phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+370"/></label></div><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className="checkbox-label"><input type="checkbox" name="consent" required/><span>{isMemocastingDemo ? 'Sutinku, kad demonstracijos savininkas perskaitytų šią žinutę.' : 'Sutinku, kad klinika perskaitytų šią žinutę ir, jei palikau kontaktą, su manimi susisiektų.'} <Link href="/privacy">Apie duomenis</Link></span></label><button disabled={busy} className="btn btn-primary btn-full" type="submit">{busy?<LoaderCircle size={18} className="spin"/>:<MessageSquare size={18}/>} {busy?'Siunčiama…':isMemocastingDemo?'Siųsti privačią žinutę':'Siųsti vadovui'}</button></form>}
        </section>}"""

new_options = """        {rating!==null&&<section className="gate-options" aria-label="Kaip norėtumėte pasidalinti?">
          {rating >= 4 ? (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px', marginBottom: '14px', color: '#065f46' }}>
                <strong style={{ display: 'block', fontSize: '15.5px', marginBottom: '4px' }}>🟢 Dėkojame už puikų įvertinimą!</strong>
                <span style={{ fontSize: '13.5px', lineHeight: '1.5' }}>Kviečiame skirti 10 sekundžių ir pasidalinti savo 5★ patirtimi „Google Maps“ tinkle.</span>
              </div>
              <a className="btn btn-primary btn-full" href={googleUrl} style={{ background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15.5px', padding: '14px', color: '#fff', fontWeight: '700', borderRadius: '10px', textDecoration: 'none' }}>
                Palikti 5★ atsiliepimą Google Maps <ArrowUpRight size={18} />
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
                  Apgailestaujame, kad patirtis nebuvo tobula. Ši žinutė <strong>nėra skelbiama viešai</strong> – ji keliauja tiesiai įmonės vadovui, kad galėtume nedelsiant ištaisyti situaciją.
                </span>
              </div>
            </div>
          )}
          {showForm&&<form id="private-feedback" onSubmit={submit} className="feedback-form"><label htmlFor="feedback_text">Jūsų pastaba ar atsiliepimas <span>(privaloma)</span></label><textarea id="feedback_text" name="feedback_text" required minLength={10} maxLength={3000} rows={4} placeholder="Kas nutiko ir kaip galėtume pasitaisyti?"/><small>Konfidencialu. Žinutė bus perduota tiesiogiai įmonės vadovui.</small><div className="form-row"><label>Vardas <span>(nebūtina)</span><input name="customer_name" autoComplete="given-name" maxLength={100} placeholder="Jūsų vardas"/></label><label>Telefonas <span>(nebūtina)</span><input name="customer_phone" type="tel" autoComplete="tel" maxLength={40} placeholder="+370"/></label></div><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div><label className="checkbox-label"><input type="checkbox" name="consent" required/><span>{isMemocastingDemo ? 'Sutinku, kad demonstracijos savininkas perskaitytų šią žinutę.' : 'Sutinku, kad įmonės vadovas perskaitytų šią žinutę ir, jei palikau kontaktą, su manimi susisiektų.'} <Link href="/privacy">Apie duomenis</Link></span></label><button disabled={busy} className="btn btn-primary btn-full" type="submit">{busy?<LoaderCircle size={18} className="spin"/>:<MessageSquare size={18}/>} {busy?'Siunčiama…':isMemocastingDemo?'Siųsti privačią žinutę':'Siųsti tiesiai vadovui'}</button></form>}
          {rating <= 3 && (
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px', textAlign: 'center' }}>
              Norite pasidalinti viešai? <a href={googleUrl} style={{ color: '#64748b', textDecoration: 'underline' }}>Google Maps nuoroda ↗</a>
            </p>
          )}
        </section>}"""

assert old_options in content, "old_options not found"
content = content.replace(old_options, new_options, 1)

content = content.replace("Testinė klinika.", "Testinė demonstracija.")

target_file.write_text(content, encoding="utf-8")
print("review-gate.tsx updated successfully!")
