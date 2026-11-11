'use client';
// Dashboard "QR kodai ir nuorodos" kit (ROADMAP D5): one card per way of sharing the review page,
// each with its own tracked link (?s=channel), ready downloads, print sheets and copyable texts.
import { useState, type ReactNode } from 'react';
import { BarChart3, Check, Contact, Copy, Download, ExternalLink, Globe, Link2, Mail, MessageSquare, Package, Printer, QrCode, Receipt, Store } from 'lucide-react';
import { channelLabel, channelUrl, type QrChannelId } from '@/lib/qr-channels';

type SourceStat = { source: string | null; total: number; positive: number };
type Props = { slug: string; name: string; baseUrl: string; stats: SourceStat[]; shareLabel?: string };

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(key: string, text: string, html?: string) {
    try {
      if (html && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2200);
    } catch { /* clipboard blocked: the text stays visible to copy by hand */ }
  }
  return { copied, copy };
}

function Card({ id, icon, title, text, children, tip }: { id: QrChannelId; icon: ReactNode; title: string; text: string; children: ReactNode; tip?: ReactNode }) {
  return <article className="qk-card" id={`qr-${id}`}>
    <div className="qk-card-head"><span className="qk-icon">{icon}</span><div><h3>{title}</h3><p>{text}</p></div></div>
    <div className="qk-card-body">{children}</div>
    {tip && <p className="qk-tip">{tip}</p>}
  </article>;
}

export function QrKit({ slug, name, baseUrl, stats, shareLabel = 'Įvertinkite mus Google' }: Props) {
  const { copied, copy } = useCopy();
  const link = (c: QrChannelId) => channelUrl(baseUrl, slug, c);
  const qrHref = (c: QrChannelId, extra = '') => `/api/admin/qr?slug=${encodeURIComponent(slug)}&s=${c}${extra}`;
  const printHref = (type: string) => `/admin/print?type=${type}&slug=${encodeURIComponent(slug)}`;
  const btn = (label: string, href: string, icon: ReactNode, download = true) =>
    <a className="btn btn-secondary btn-small" href={href} {...(download ? { download: true } : { target: '_blank', rel: 'noopener noreferrer' })}>{icon} {label}</a>;
  const copyBtn = (key: string, label: string, text: string, html?: string) =>
    <button type="button" className={`btn btn-small ${copied === key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => copy(key, text, html)}>{copied === key ? <Check size={14}/> : <Copy size={14}/>} {copied === key ? 'Nukopijuota' : label}</button>;

  const signatureUrl = link('parasas');
  const signatureHtml = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;"><tr><td style="padding:10px 0 4px;font-size:12px;color:#64748b;">Jūsų nuomonė mums svarbi</td></tr><tr><td><a href="${signatureUrl}" target="_blank" style="display:inline-block;background:#5636E8;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;padding:9px 18px;border-radius:18px;">&#9733; ${shareLabel}</a></td></tr></table>`;
  const websiteHtml = `<a href="${link('svetaine')}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#5636E8;color:#ffffff;font:600 15px/1 Arial,Helvetica,sans-serif;text-decoration:none;padding:13px 22px;border-radius:999px;">&#9733; ${shareLabel}</a>`;
  const smsText = `Ačiū, kad pasirinkote ${name}! Būsime dėkingi už trumpą įvertinimą: ${link('sms')}`;
  const emailText = `Laba diena,\n\ndėkojame, kad pasirinkote ${name}. Būtume labai dėkingi, jei skirtumėte 30 sekundžių ir įvertintumėte savo patirtį:\n${link('sms')}\n\nPagarbiai,\n${name}`;
  const receiptLine = `Įvertinkite mus: ${link('kvitas')}`;

  const totalRatings = stats.reduce((a, s) => a + s.total, 0);
  const maxRatings = Math.max(1, ...stats.map((s) => s.total));

  return <section id="qr" className="dashboard-panel qk">
    <div className="qk-header">
      <div>
        <span className="qk-eyebrow"><QrCode size={14}/> QR kodai ir nuorodos</span>
        <h2>Rinkite atsiliepimus visur, kur bendraujate su klientais</h2>
        <p>Pasirinkite būdą – medžiaga jau paruošta su Jūsų pavadinimu ir QR kodu. Kiekvienas būdas turi savo nuorodą, todėl apačioje matysite, kuris veikia geriausiai.</p>
      </div>
    </div>

    <div className="qk-grid">
      <Card id="stovelis" icon={<Store size={20}/>} title="Stovelis ir plakatas" text="Prie kasos, registratūros, ant staliuko ar sienos."
        tip={<>Norite tikro akrilinio stovelio su NFC? <a href="#stovelis">Užsisakykite nemokamai</a>, atsiųsime.</>}>
        <div className="qk-actions">
          {btn('A6 stovelio įdėklas', printHref('stand'), <Printer size={14}/>, false)}
          {btn('A4 plakatas', printHref('poster'), <Printer size={14}/>, false)}
          {btn('PNG', qrHref('stovelis'), <Download size={14}/>)}
          {btn('SVG', qrHref('stovelis', '&format=svg'), <Download size={14}/>)}
        </div>
      </Card>

      <Card id="kvitas" icon={<Receipt size={20}/>} title="Kvitai ir sąskaitos" text="Kasos kvito ar sąskaitos-faktūros apačioje."
        tip="Terminiam kvitų spausdintuvui rinkitės juodai baltą PNG. Sąskaitų programoje įkelkite paveikslėlį į šablono apačią.">
        <div className="qk-actions">
          {btn('PNG juodai baltas', qrHref('kvitas', '&style=black&size=600'), <Download size={14}/>)}
          {btn('SVG', qrHref('kvitas', '&format=svg&style=black'), <Download size={14}/>)}
          {copyBtn('kvitas', 'Kopijuoti tekstą kvitui', receiptLine)}
        </div>
        <code className="qk-code">{receiptLine}</code>
      </Card>

      <Card id="vizitine" icon={<Contact size={20}/>} title="Vizitinės kortelės" text="Nugarėlėje arba šalia kontaktų."
        tip="Spaustuvei siųskite SVG. Mažiausias QR dydis – 2 × 2 cm, aplink palikite baltą paraštę.">
        <div className="qk-actions">
          {btn('SVG spaustuvei', qrHref('vizitine', '&format=svg'), <Download size={14}/>)}
          {btn('PNG 2000 px', qrHref('vizitine', '&size=2000'), <Download size={14}/>)}
        </div>
      </Card>

      <Card id="lipdukai" icon={<Package size={20}/>} title="Lipdukai ant prekių ir pakuočių" text="Siuntiniuose, ant dėžučių, padėkos kortelėse."
        tip="Tinka standartiniai A4 lipnūs lapai (3 × 4 lipdukai).">
        <div className="qk-actions">
          {btn('Spausdinti 12 lipdukų', printHref('labels'), <Printer size={14}/>, false)}
          {btn('PNG', qrHref('lipdukai'), <Download size={14}/>)}
        </div>
      </Card>

      <Card id="parasas" icon={<Mail size={20}/>} title="El. pašto parašas" text="Mygtukas kiekviename Jūsų laiške."
        tip={<>Gmail: Nustatymai → Bendrieji → Parašas → įklijuokite. Outlook: Parametrai → Paštas → Parašai → įklijuokite.</>}>
        <div className="qk-preview qk-signature">
          <span>Jūsų nuomonė mums svarbi</span>
          <a href={signatureUrl} target="_blank" rel="noopener noreferrer">★ {shareLabel}</a>
        </div>
        <div className="qk-actions">
          {copyBtn('parasas', 'Kopijuoti parašą', `${shareLabel}: ${signatureUrl}`, signatureHtml)}
          {copyBtn('parasas-html', 'Kopijuoti HTML kodą', signatureHtml)}
        </div>
      </Card>

      <Card id="sms" icon={<MessageSquare size={20}/>} title="SMS ir žinutės po vizito" text="Po apsilankymo, pristatymo ar atlikto darbo."
        tip="Geriausia siųsti tą pačią ar kitą dieną po apsilankymo.">
        <code className="qk-code">{smsText}</code>
        <div className="qk-actions">
          {copyBtn('sms', 'Kopijuoti SMS', smsText)}
          {copyBtn('email', 'Kopijuoti el. laišką', emailText)}
        </div>
      </Card>

      <Card id="svetaine" icon={<Globe size={20}/>} title="Svetainė" text="Mygtukas puslapyje „Kontaktai“ ar poraštėje."
        tip="Nukopijuotą kodą įklijuokite į svetainės HTML bloką (WordPress, Wix, Shopify ir kt.).">
        <div className="qk-preview"><a className="qk-site-btn" href={link('svetaine')} target="_blank" rel="noopener noreferrer">★ {shareLabel}</a></div>
        <div className="qk-actions">{copyBtn('svetaine', 'Kopijuoti HTML kodą', websiteHtml)}</div>
      </Card>

      <Card id="nuoroda" icon={<Link2 size={20}/>} title="Tiesioginė nuoroda" text="Facebook, Instagram, WhatsApp, Messenger ar bet kur kitur.">
        <code className="qk-code">{link('nuoroda')}</code>
        <div className="qk-actions">
          {copyBtn('nuoroda', 'Kopijuoti nuorodą', link('nuoroda'))}
          {btn('Atidaryti', link('nuoroda'), <ExternalLink size={14}/>, false)}
        </div>
      </Card>
    </div>

    <div className="qk-stats">
      <h3><BarChart3 size={18}/> Iš kur ateina įvertinimai <span>(90 d.)</span></h3>
      {totalRatings === 0
        ? <p className="qk-stats-empty">Kai klientai pradės vertinti, čia matysite, kuris būdas atneša daugiausiai įvertinimų.</p>
        : <ul>{stats.map((s) => <li key={s.source ?? 'none'}>
            <span className="qk-stats-label">{channelLabel(s.source)}</span>
            <span className="qk-stats-bar"><i style={{ width: `${(s.total / maxRatings) * 100}%` }}/></span>
            <span className="qk-stats-num">{s.total} <small>({s.positive} × 4–5★)</small></span>
          </li>)}</ul>}
    </div>
  </section>;
}
