import Link from 'next/link';
import { 
  ArrowUpRight, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Users, 
  CalendarCheck, 
  TrendingUp, 
  MessageSquare,
  Smartphone,
  Star,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Brand } from '@/components/brand';
import { ReviveCalculator, ReviveLandingChatDemo } from '@/components/reviveleads-landing-interactive';

export const metadata = {
  title: 'ReviveLeads™ · DI Klientų Duomenų Bazės Reaktyvavimas · Verslomatika',
  description: 'Paverskite miegančių pacientų kontaktus į 3,000–8,000 € papildomų pajamų kas mėnesį be jokių reklamos išlaidų.'
};

export default function ReviveLeadsLandingPage() {
  return (
    <div className="revive-landing-root">
      {/* Top Holding Bar */}
      <div className="top-holding-banner">
        <span>
          🚀 <strong>Verslomatika Holding Ekosistema</strong> · Automatizuoti B2B sprendimai verslui
        </span>
      </div>

      {/* Main Header / Navigation */}
      <header className="revive-site-header">
        <div className="header-inner">
          <div className="header-brand-wrap">
            <Brand />
            <span className="holding-module-tag">ReviveLeads™</span>
          </div>

          <nav className="header-nav">
            <Link href="/" className="nav-link">
              ReputationPro (Atsiliepimai)
            </Link>
            <Link href="/reviveleads" className="nav-link active">
              ReviveLeads (Miegantys klientai)
            </Link>
            <a href="#calculator" className="nav-link">
              ROI Skaičiuoklė
            </a>
            <a href="#how-it-works" className="nav-link">
              Kaip tai veikia
            </a>
            <a href="#pricing" className="nav-link">
              Kainos
            </a>
          </nav>

          <div className="header-actions">
            <Link href="/admin/login" className="btn btn-ghost btn-small">
              Prisijungti
            </Link>
            <Link href="/checkout?plan=reviveleads" className="btn btn-primary btn-small">
              14 d. Nemokamai
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="revive-hero">
        <div className="hero-content-wrap">
          <div className="hero-left">
            <div className="hero-chip">
              <Zap size={15} />
              <span>DI DUOMENŲ BAZĖS REAKTYVAVIMAS · BE REKLAMOS BIUDŽETO</span>
            </div>

            <h1>
              Paverskite <em>„miegančių“</em> pacientų bazę į <span>3,000–8,000 €</span> papildomų pajamų kas mėnesį.
            </h1>

            <p className="hero-lead">
              Nustokite leisti tūkstančius Google ir Meta reklamai, kol tūkstančiai senų klientų guli pamiršti Jūsų registratūros lentelėse. Mūsų DI agentas personalizuotomis SMS žinutėmis atgaivina kontaktus ir automatiškai užpildo laisvus gydytojų laikus.
            </p>

            <div className="hero-cta-group">
              <Link href="/checkout?plan=reviveleads" className="btn btn-primary hero-main-btn">
                <span>Išbandyti 14 dienų nemokamai</span>
                <ArrowRight size={18} />
              </Link>
              <a href="#calculator" className="btn btn-secondary hero-calc-btn">
                <span>Apskaičiuoti savo pajamas</span>
              </a>
            </div>

            <div className="hero-trust-bar">
              <div className="trust-item">
                <CheckCircle2 size={16} /> <span>100% atitinka BDAR</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} /> <span>Jokio rankinio darbo registratūrai</span>
              </div>
              <div className="trust-item">
                <CheckCircle2 size={16} /> <span>Veikia su bet kokiu CSV / Excel</span>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-demo-card">
              <div className="demo-badge-wrap">
                <Sparkles size={14} />
                <span>INTERAKTYVI DEMONSTRACIJA</span>
              </div>
              <h3>Pamatykite, kaip DI bendrauja:</h3>
              <p>Spustelėkite kliento atsakymus ir stebėkite automatinį vizito patvirtinimą.</p>
              <ReviveLandingChatDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Big Impact Numbers Banner */}
      <section className="impact-bar-section">
        <div className="impact-inner">
          <div className="impact-col">
            <strong>82%</strong>
            <span>Pacientų nori sugrįžti, bet tiesiog pamiršta užsiregistruoti</span>
          </div>
          <div className="impact-col">
            <strong>5–12%</strong>
            <span>Vidutinis reaktyvacijos lygis po pirmosios DI SMS kampanijos</span>
          </div>
          <div className="impact-col">
            <strong>72 val.</strong>
            <span>Vidutinis laikas nuo sąrašo įkėlimo iki pirmųjų 10+ rezervacijų</span>
          </div>
          <div className="impact-col">
            <strong>12x–20x</strong>
            <span>Investicijos grąža (ROI) lyginant su tradicine mokama reklama</span>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator Section */}
      <section id="calculator" className="calculator-section">
        <div className="section-head-center">
          <span className="section-eyebrow">POTENCIALO SKAIČIUOKLĖ</span>
          <h2>Kiek pajamų slepiasi Jūsų kontaktų bazėje?</h2>
          <p>
            Pastumkite slankiklius pagal savo klinikos ar įmonės apimtis ir sužinokite prognozuojamą finansinį rezultatą.
          </p>
        </div>

        <ReviveCalculator />
      </section>

      {/* 3-Step Process */}
      <section id="how-it-works" className="steps-section">
        <div className="section-head-center">
          <span className="section-eyebrow">KAIP TAI VEIKIA</span>
          <h2>Trys paprasti žingsniai iki pilno kalendoriaus</h2>
          <p>Sistemos paleidimas trunka mažiau nei 10 minučių. Jokio IT specialistų samdymo.</p>
        </div>

        <div className="steps-grid-landing">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon-circle bg-blue">
              <Users size={24} />
            </div>
            <h3>1. Įkelkite miegančiųjų sąrašą</h3>
            <p>
              Pateikite pacientų ar klientų sąrašą iš savo registratūros programos (CSV arba Excel). Užtenka vardo, telefono numerio ir apytikslio paskutinio vizito laiko.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon-circle bg-purple">
              <MessageSquare size={24} />
            </div>
            <h3>2. DI pradeda mandagų dialogą</h3>
            <p>
              Sistema išsiunčia personalizuotas, neįkyrias SMS žinutes. Dirbtinis intelektas akimirksniu atsako į paciento klausimus apie kainas ir laisvus laikus.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon-circle bg-emerald">
              <CalendarCheck size={24} />
            </div>
            <h3>3. Rezervacija patenka į kalendorių</h3>
            <p>
              Suderintas laikas automatiškai užfiksuojamas sistemoje, o pacientas gauna patvirtinimą. Jūsų registratūrai belieka pasitikti atvykstantį klientą.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison: Ads vs ReviveLeads */}
      <section className="comparison-section">
        <div className="section-head-center">
          <span className="section-eyebrow">PALYGINIMAS</span>
          <h2>Kodėl reaktyvavimas lenkia tradicinę reklamą?</h2>
        </div>

        <div className="comparison-table-wrap">
          <table className="comp-table">
            <thead>
              <tr>
                <th>Kriterijus</th>
                <th>Google / Meta reklama (PPC)</th>
                <th className="highlight-col">ReviveLeads™ Reaktyvavimas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Tikslinė auditorija</strong></td>
                <td>Nepažįstami žmonės (šaltas srautas)</td>
                <td className="highlight-col"><strong>Buvę pacientai, kurie jau Jumis pasitiki</strong></td>
              </tr>
              <tr>
                <td><strong>Kliento pritraukimo kaina (CAC)</strong></td>
                <td>35–80 € už vieną naują pacientą</td>
                <td className="highlight-col"><strong>3–6 € už vieną sugrąžintą pacientą</strong></td>
              </tr>
              <tr>
                <td><strong>Pasitikėjimas & Neatvykimo rodiklis</strong></td>
                <td>Aukštas neatvykimo procentas (20–30%)</td>
                <td className="highlight-col"><strong>Neatvykimas vos 3–5% (artimas ryšys)</strong></td>
              </tr>
              <tr>
                <td><strong>Mėnesinės išlaidos</strong></td>
                <td>1,000–3,000 € biudžetas agentūrai ir reklamai</td>
                <td className="highlight-col"><strong>Fiksuota nuo 99 €/mėn. prenumerata</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-head-center">
          <span className="section-eyebrow">SKAIDRIOS KAINOS</span>
          <h2>Investuokite į garantuotą registracijų augimą</h2>
          <p>Pradėkite su 14 dienų nemokamu bandymu. Mokėkite tik jei sistema atneša pelną.</p>
        </div>

        <div className="pricing-cards-grid">
          <div className="pricing-card">
            <div className="tier-name">Pradedantiesiems</div>
            <div className="tier-price">
              <strong>99 €</strong>
              <span>/ mėn.</span>
            </div>
            <p className="tier-desc">Kompaktiškoms klinikoms ir privatiems kabinetams.</p>
            <ul className="tier-features">
              <li><CheckCircle2 size={16} /> Iki 300 kontaktų reaktyvavimas</li>
              <li><CheckCircle2 size={16} /> Paruošti odontologijos / grožio šablonai</li>
              <li><CheckCircle2 size={16} /> Automatinis atsakymų registravimas</li>
              <li><CheckCircle2 size={16} /> El. pašto ir SMS palaikymas</li>
            </ul>
            <Link href="/checkout?plan=starter" className="btn btn-secondary full-width">
              Išbandyti nemokamai
            </Link>
          </div>

          <div className="pricing-card popular">
            <div className="popular-ribbon">POPULIARIAUSIAS</div>
            <div className="tier-name">Pro Reaktyvacija</div>
            <div className="tier-price">
              <strong>149 €</strong>
              <span>/ mėn.</span>
            </div>
            <p className="tier-desc">Vidutinėms klinikoms, norinčioms maksimalios grąžos.</p>
            <ul className="tier-features">
              <li><CheckCircle2 size={16} /> <strong>Iki 1,500 kontaktų reaktyvavimas</strong></li>
              <li><CheckCircle2 size={16} /> <strong>Dvikryptis AI dialogų agentas</strong></li>
              <li><CheckCircle2 size={16} /> <strong>Integracija su registratūros kalendoriumi</strong></li>
              <li><CheckCircle2 size={16} /> Išsami ROI ir atgautų pajamų ataskaita</li>
              <li><CheckCircle2 size={16} /> Prioritetinis palaikymas 7 d. per savaitę</li>
            </ul>
            <Link href="/checkout?plan=reviveleads" className="btn btn-primary full-width">
              Pradėti 14 d. Pro bandymą
            </Link>
          </div>

          <div className="pricing-card">
            <div className="tier-name">Klinikų Tinklas</div>
            <div className="tier-price">
              <strong>299 €</strong>
              <span>/ mėn.</span>
            </div>
            <p className="tier-desc">Didelėms gydymo įstaigoms ir kelių filialų tinklams.</p>
            <ul className="tier-features">
              <li><CheckCircle2 size={16} /> Neribotas kontaktų skaičius</li>
              <li><CheckCircle2 size={16} /> Keli filialai ir gydytojų profiliai</li>
              <li><CheckCircle2 size={16} /> Integracija su Voice AI registratūra</li>
              <li><CheckCircle2 size={16} /> Dedikuotas vadybininkas ir apmokymai</li>
            </ul>
            <Link href="/checkout?plan=enterprise" className="btn btn-secondary full-width">
              Susisiekti dėl tinklo
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA Band */}
      <section className="bottom-cta-section">
        <div className="bottom-cta-inner">
          <div className="bottom-cta-text">
            <h2>Pasiruošę sugrąžinti pirmuosius pacientus jau šią savaitę?</h2>
            <p>Užsiregistruokite dabar ir gaukite 14 dienų nemokamą pilną prieigą prie visų ReviveLeads funkcijų.</p>
          </div>
          <div className="bottom-cta-buttons">
            <Link href="/checkout?plan=reviveleads" className="btn btn-primary btn-large">
              <span>Aktyvuoti 14 d. nemokamą bandymą</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="revive-site-footer">
        <div className="footer-inner">
          <div className="footer-col-brand">
            <Brand />
            <p>
              Verslomatika Holding · Šiuolaikinės B2B technologijos Lietuvos verslo augimui.
            </p>
            <small>© 2026 MB „Pinet“. Visos teisės saugomos.</small>
          </div>

          <div className="footer-col">
            <strong>Ekosistemos Paslaugos</strong>
            <Link href="/">ReputationPro (Google Atsiliepimai)</Link>
            <Link href="/reviveleads">ReviveLeads (Miegantys klientai)</Link>
            <span className="footer-dimmed">Voice AI Registratūra (Netrukus)</span>
            <span className="footer-dimmed">Smart Invoicing (Netrukus)</span>
          </div>

          <div className="footer-col">
            <strong>Saugumas ir Teisė</strong>
            <Link href="/privacy">Privatumo politika (BDAR)</Link>
            <Link href="/admin/login">Kliento prisijungimas</Link>
            <span>SSL 256-bit šifravimas</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
