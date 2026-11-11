// Verslomatika site header and footer (same brand and menu as verslomatika.lt), shared by the
// owner demo (/r/{slug} for is_demo=1) and public guide pages such as /google-profilis.
import { ArrowRight } from 'lucide-react';

function Logo({ light = false, size = 30 }: { light?: boolean; size?: number }) {
  const [a, b, c] = light ? ['#8c72ea', '#6545ca', '#b8a6ff'] : ['#6545ca', '#4d31b0', '#8c72ea'];
  return <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
    <path d="M1.8 7.5h9.4l6.2 18.6-2.5 5H9.7z" fill={a}/>
    <path d="M13 5h9.6l5.4 15.7h-9.5z" fill={b}/>
    <path d="M22.5 1.8h7.4l2.9 8.2h-7.3z" fill={c}/>
  </svg>;
}

export function VmHeader({ cta }: { cta?: { href: string; label: string } }) {
  return <header className="vm-header">
    <a href="https://verslomatika.lt/" className="vm-brand" aria-label="Verslomatika pradžia">
      <Logo/>
      <strong>Verslomatika</strong><i/><b>ReputationPro</b>
    </a>
    <nav className="vm-nav" aria-label="Verslomatika">
      <a href="https://verslomatika.lt/sprendimai/">Sprendimai</a>
      <a href="https://verslomatika.lt/industrijos/">Veiklos sritys</a>
      <a href="https://verslomatika.lt/verslo-augimo-irankiai/">Augimo įrankiai</a>
      <a href="https://verslomatika.lt/kontaktai/">Kontaktai</a>
    </nav>
    {cta && <a className="btn btn-primary vm-header-cta" href={cta.href}>{cta.label} <ArrowRight size={16}/></a>}
  </header>;
}

export function VmFooter({ note }: { note?: string }) {
  return <footer className="vm-footer">
    <div className="vm-footer-inner">
      <div className="vm-footer-brand">
        <a href="https://verslomatika.lt/" className="vm-brand vm-brand-light">
          <Logo light size={28}/>
          <strong>Verslomatika</strong>
        </a>
        <p>Verslo procesų automatizavimas ir augimo įrankiai Lietuvos įmonėms.</p>
        <a href="mailto:info@pinet.lt">info@pinet.lt</a>
      </div>
      <div className="vm-footer-col"><b>Produktai</b>
        <a href="https://verslomatika.lt/reputacija/">ReputationPro</a>
        <a href="https://verslomatika.lt/verslo-augimo-irankiai/">Verslo augimo įrankiai</a>
        <a href="https://verslomatika.lt/agentai/">Agentai</a>
      </div>
      <div className="vm-footer-col"><b>Įmonė</b>
        <a href="https://verslomatika.lt/sprendimai/">Sprendimai</a>
        <a href="https://verslomatika.lt/apie-mus/">Apie mus</a>
        <a href="https://verslomatika.lt/kontaktai/">Kontaktai</a>
      </div>
      <div className="vm-footer-col"><b>Informacija</b>
        <a href="https://verslomatika.lt/privatumas/">Privatumas</a>
        <a href="https://verslomatika.lt/salygos/">Naudojimo sąlygos</a>
      </div>
    </div>
    <div className="vm-footer-bottom">© {new Date().getFullYear()} Verslomatika · MB Pinet, įm. k. 306067365.{note ? ` ${note}` : ''}</div>
  </footer>;
}
