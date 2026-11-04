import Link from 'next/link';
import { ArrowLeft, MessageCircle, BarChart3, QrCode } from 'lucide-react';
import { ClinicForm } from '@/components/admin-controls';
import { getClient } from '@/lib/db';
import styles from './checkout.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Registracija – ReputationPro', robots: { index: false, follow: true } };

export default async function Checkout({
  searchParams
}: {
  searchParams: Promise<{
    plan?: string;
    slug?: string;
    name?: string;
    email?: string;
    google_review_url?: string;
  }>;
}) {
  const params = await searchParams;
  const { plan } = params;
  const initialPlan = plan === 'starter' || plan === 'pro' || plan === 'annual' ? plan : 'pro';

  const cleanSlug = (params.slug || '').trim().toLowerCase();
  const existing = cleanSlug ? getClient(cleanSlug) : undefined;

  const business_name = params.name || existing?.business_name || '';
  const email = params.email || existing?.email || '';
  const slug = cleanSlug || existing?.slug || '';
  const phone = existing?.phone || '';
  
  // Auto-fill Google Maps review link:
  // 1. From URL param (if passed)
  // 2. From existing client database record (researched official Maps URL)
  // 3. Fallback: Search URL based on business name
  const google_review_url =
    params.google_review_url ||
    existing?.google_review_url ||
    (business_name ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business_name)}` : '');

  const client =
    slug || business_name || email
      ? {
          slug,
          business_name,
          email,
          google_review_url,
          phone
        }
      : undefined;

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="https://verslomatika.lt/reputacija/" className={styles.brand} aria-label="Verslomatika ReputationPro pradžia">
          <svg width="32" height="32" viewBox="0 0 34 34" aria-hidden="true">
            <path d="M1.8 7.5h9.4l6.2 18.6-2.5 5H9.7z" fill="#6545ca" />
            <path d="M13 5h9.6l5.4 15.7h-9.5z" fill="#4d31b0" />
            <path d="M22.5 1.8h7.4l2.9 8.2h-7.3z" fill="#8c72ea" />
          </svg>
          <strong>Verslomatika</strong>
          <i /> <b>ReputationPro</b>
        </Link>
        <Link className={styles.back} href="https://verslomatika.lt/reputacija/">
          <ArrowLeft size={17} /> Į pristatymą
        </Link>
      </header>

      <main id="main" className={styles.grid}>
        <section className={styles.intro}>
          <span className={styles.badge}>14 dienų nemokamas bandymas</span>
          <h1>
            Pradėkite su <span>ReputationPro</span>
          </h1>
          <p className={styles.lead}>
            Padėkite pirkėjams ir klientams patogiai palikti 5★ atsiliepimą po internetinio pirkimo (el. paštu / SMS) arba vietoje, o pastabas sulaikyti privačiai.
          </p>
          <ul className={styles.benefits}>
            <li>
              <span><MessageCircle size={21} /></span>
              <div>
                <strong>Atsiliepimai „Google“</strong>
                <p>Patogus būdas pakviesti klientus pasidalyti patirtimi.</p>
              </div>
            </li>
            <li>
              <span><BarChart3 size={21} /></span>
              <div>
                <strong>Privatus grįžtamasis ryšys</strong>
                <p>Sužinokite apie klientų patirtį ir reaguokite į pastabas.</p>
              </div>
            </li>
            <li>
              <span><QrCode size={21} /></span>
              <div>
                <strong>Nuoroda el. paštui, SMS ir QR</strong>
                <p>Siųskite pirkėjams po užsakymo arba naudokite QR vietoje.</p>
              </div>
            </li>
          </ul>
          <figure className={styles.scene}>
            <img className={styles.stand} src="/images/checkout/stand.png" alt="Iliustracinis akrilinis QR stovelis" />
            <figcaption>Fizinis stovelis salonams arba tiesioginė integracijos nuoroda el. parduotuvėms</figcaption>
          </figure>
        </section>

        <section className={styles.panel}>
          <h2>Sukurkite savo paskyrą</h2>
          <p className={styles.description}>
            Užpildykite įmonės duomenis ir sukurkite asmeninę atsiliepimų nuorodą.
          </p>
          <ClinicForm client={client} checkout initialPlan={initialPlan} />
        </section>
      </main>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Verslomatika</span>
        <div>
          <a href="https://verslomatika.lt/privatumas/">Privatumo politika</a>
          <a href="https://verslomatika.lt/salygos/">Naudojimo sąlygos</a>
          <a href="https://verslomatika.lt/kontaktai/">Pagalba</a>
        </div>
      </footer>
    </div>
  );
}
