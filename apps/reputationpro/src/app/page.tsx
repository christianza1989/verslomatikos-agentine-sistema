import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Star,
  MessageSquare,
  Building2,
  Award,
  HeartHandshake,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Brand } from '@/components/brand';

export default function NeutralLanding() {
  return (
    <>
      {/* Navigacija */}
      <header className="site-header wrap">
        <Brand />
        <nav aria-label="Pagrindinė navigacija">
          <a href="#apie">Apie sistemą</a>
          <a href="#principai">Kokybės standartas</a>
          <a href="#verslui">Verslui</a>
          <Link href="/admin" className="nav-login">
            Prisijungti <ArrowUpRight size={15} />
          </Link>
        </nav>
      </header>

      <main id="main">
        {/* HERO SEKCIJA — NEUTRALUS KOKYBĖS PORTALAS */}
        <section id="apie" className="hero wrap" style={{ paddingTop: '60px', paddingBottom: '70px' }}>
          <div className="hero-copy" style={{ maxWidth: '600px' }}>
            <div className="badge-tag">
              <ShieldCheck size={16} />
              <span>ReputationPro • El. parduotuvėms ir fiziniam verslui</span>
            </div>
            <h1 style={{ fontSize: 'clamp(34px, 4vw, 50px)', lineHeight: '1.2' }}>
              Kliento ir pirkėjo balsas.<br />
              <span style={{ color: '#5636E8' }}>Aiškesnis grįžtamasis ryšys.</span>
            </h1>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: 'var(--muted)', marginTop: '20px' }}>
              Universali atsiliepimų valdymo sistema: automatinė nuoroda pirkėjui po internetinio užsakymo 
              (el. paštu arba SMS) arba estetiškas akrilinis QR stovelis prie kasos ir registratūroje. 
              Patenkinti klientai (5★) keliauja į „Google Maps“, o pastabos pirmiausia ateina Jūsų komandai.
            </p>

            {/* Greita paieška / kodo suvedimas */}
            <div style={{ marginTop: '30px', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid var(--line)', boxShadow: '0 8px 24px -10px rgba(0,0,0,0.06)' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Demonstracinė kliento anketa
              </label>
              <Link href="/r/memocasting" className="btn btn-primary">Atverti testinę anketą <ArrowRight size={16} /></Link>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
                Testavimui nenaudokite tikrų pacientų ar sveikatos duomenų.
              </p>
            </div>
          </div>

          {/* Dešinė pusė: Oficialus Kokybės Audito Skydelis */}
          <div style={{ background: '#F8FAFC', border: '1px solid var(--line)', borderRadius: '16px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={22} style={{ color: '#5636E8' }} />
                <strong style={{ fontSize: '14px', color: '#0F172A' }}>Demonstracijos galimybės</strong>
              </div>
              <span style={{ fontSize: '11px', background: '#EDE9FE', color: '#5636E8', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                MVP
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F5F3FF', color: '#5636E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: '#0F172A' }}>Pastabos pirmiausia Jūsų komandai</strong>
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', lineHeight: '1.5' }}>
                    Privačios pastabos išsaugomos demonstraciniame valdymo skydelyje. Automatiniai el. laiškai nesiunčiami.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Star size={18} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: '#0F172A' }}>Viešas rekomendacijų pasidalinimas</strong>
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', lineHeight: '1.5' }}>
                    Po bet kurio įvertinimo galite pasirinkti, ar rašyti privačiai, ar atverti Google.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: '#0F172A' }}>Saugumas ir konfidencialumas</strong>
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', lineHeight: '1.5' }}>
                    Prieš naudojant su tikrais klientais reikia parengti privatumo, saugojimo ir duomenų apsaugos tvarką.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <Link href="/r/memocasting" className="text-link" style={{ color: '#5636E8', fontSize: '13px' }}>
                Peržiūrėti demonstracinę kliento anketą <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* KAIP VEIKIA PACIENTUI */}
        <section id="principai" className="wrap section-space" style={{ borderTop: '1px solid var(--line)' }}>
          <div className="section-heading">
            <div>
              <div className="badge-tag">
                <CheckCircle2 size={15} />
                <span>PACIENTO KELIAS</span>
              </div>
              <h2>Kaip veikia kokybės įvertinimas?</h2>
            </div>
            <p>
              Tai bandomasis procesas naršyklėje.<br />
              Tikriems pacientų duomenims jis dar neparengtas.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '28px', marginTop: '30px' }}>
            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: '14px', padding: '28px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#5636E8', marginBottom: '14px' }}>01</div>
              <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Nuoroda arba QR kodas</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: '1.6' }}>
                Klientas atveria nuorodą po internetinio pirkimo (el. paštu / SMS) arba nuskenuoja QR kodą prie kasos.
              </p>
            </div>

            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: '14px', padding: '28px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#5636E8', marginBottom: '14px' }}>02</div>
              <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Pasirinkite įvertinimą</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: '1.6' }}>
                Viena 5 žvaigždučių skalė leidžia per kelias sekundes išreikšti savo nuomonę apie suteiktos paslaugos ir bendravimo kokybę.
              </p>
            </div>

            <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: '14px', padding: '28px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#5636E8', marginBottom: '14px' }}>03</div>
              <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Jūsų balsas išgirstas</h3>
              <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: '1.6' }}>
                Pateikta privati pastaba išsaugoma demonstraciniame skydelyje.
              </p>
            </div>
          </div>
        </section>

        {/* DISKRETUS BLOKAS KLINIKŲ VADOVAMS */}
        <section id="verslui" className="wrap section-space" style={{ paddingTop: '0' }}>
          <div style={{ background: '#F8FAFC', border: '1px solid var(--line)', borderRadius: '16px', padding: '40px 50px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '620px' }}>
              <div style={{ display: 'inline-flex', gap: '6px', background: '#EDE9FE', color: '#5636E8', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, marginBottom: '12px' }}>
                EL. PARDUOTUVĖMS, PASLAUGOMS IR SALONAMS
              </div>
              <h3 style={{ fontSize: '24px', color: '#0F172A' }}>Esate paslaugų įmonės ar verslo vadovas?</h3>
              <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '8px', lineHeight: '1.6' }}>
                Susipažinkite, kaip sistema automatizuoja atsiliepimų rinkimą internetu po pirkimo bei fizinėse vietose, sulaikant neigiamas pastabas privačiai. Nauja registracija laikinai sustabdyta.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link href="/r/memocasting" className="btn btn-primary">
                <span>Peržiūrėti demonstraciją</span>
                <ArrowUpRight size={15} />
              </Link>
              <a href="https://verslomatika.lt/reputacija/" className="btn btn-secondary">
                <span>Apie sprendimą</span>
                <ExternalLink size={15} />
              </a>
              <a href="https://verslomatika.lt/verslo-augimo-irankiai/" className="btn btn-secondary">
                Visi verslo įrankiai
              </a>
              <Link href="/admin" className="btn btn-secondary">
                Prisijungti
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer wrap">
        <Brand />
        <p>© 2026 Verslomatika ReputationPro • Demonstracija • MB Pinet</p>
        <div style={{ display: 'flex', gap: '20px', marginLeft: 'auto', fontSize: '12px' }}>
          <Link href="/privacy">Duomenų privatumas</Link>
          <a href="mailto:info@pinet.lt">info@pinet.lt</a>
        </div>
      </footer>
    </>
  );
}
