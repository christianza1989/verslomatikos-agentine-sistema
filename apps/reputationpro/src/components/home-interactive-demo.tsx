'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, ArrowRight, ExternalLink, MessageSquare, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export function HomeInteractiveDemo() {
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const activeRating = hoverRating ?? selectedRating;
  const isPositive = activeRating >= 4;

  return (
    <div className="interactive-simulator-card">
      <div className="simulator-header">
        <div className="simulator-title-badge">
          <Sparkles size={15} className="text-amber-500" />
          <span>IŠBANDYKITE PATYS GYVAI</span>
        </div>
        <h3>Kaip sistema suveiks Jūsų klientui?</h3>
        <p>Paspauskite bet kurį žvaigždučių skaičių žemiau ir pamatykite, kas nutinka:</p>
      </div>

      <div className="simulator-stars-container">
        <div className="stars-picker" role="radiogroup" aria-label="Interaktyvus vertinimas">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-btn ${star <= activeRating ? 'active' : ''}`}
              onClick={() => setSelectedRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              aria-label={`${star} žvaigždutės`}
            >
              <Star
                size={38}
                fill={star <= activeRating ? 'currentColor' : 'none'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        <div className="stars-caption">
          <span>{activeRating} iš 5 žvaigždučių pasirinkta</span>
          <span className="scale-hint">{activeRating >= 4 ? '🟢 Puikus vizitas' : '🟠 Vizitas su priekaištais'}</span>
        </div>
      </div>

      <div className="simulator-outcome-box">
        {isPositive ? (
          <div className="outcome-positive">
            <div className="outcome-badge positive">
              <CheckCircle2 size={16} />
              <span>MARŠRUTAS A: TIESIAI Į GOOGLE MAPS</span>
            </div>
            <h4>Klientas automatiškai nukreipiamas į Google atsiliepimą</h4>
            <p>
              Patenkintas klientas per 2 sekundes atsidaro Jūsų oficialią Google Maps anketą,
              kurioje jau pažymėtos 5 žvaigždutės. Jokių kliūčių – viešas reitingas auga!
            </p>

            <div className="simulated-google-card">
              <div className="google-card-header">
                <span className="google-g">G</span>
                <div>
                  <strong>Vilniaus Denta • Google Atsiliepimai</strong>
                  <span className="google-sub">Viešas atsiliepimas Google tinkle</span>
                </div>
              </div>
              <div className="google-card-stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={18} fill="#eab308" color="#eab308" />
                ))}
                <span className="google-rating-text">5.0 • Labai rekomenduoju!</span>
              </div>
              <div className="google-action-preview">
                <span className="btn-fake-google">Paskelbti atsiliepimą</span>
                <span className="verified-pill">✓ Didina reitingą Google paieškoje</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="outcome-negative">
            <div className="outcome-badge negative">
              <ShieldCheck size={16} />
              <span>MARŠRUTAS B: APSAUGA NUO VIEŠO 1–3★ SKUNDO</span>
            </div>
            <h4>Sulaikymas: atsiliepimas NEPATENKA į Google!</h4>
            <p>
              Klientui atveriama privati konfidenciali forma tiesiai į vadovo el. paštą.
              Pyktis išliejamas saugiai, o Jūs gaunate šansą išspręsti problemą ir išsaugoti klientą.
            </p>

            <div className="simulated-private-form">
              <div className="private-form-header">
                <MessageSquare size={17} className="text-emerald-700" />
                <span>Privati žinutė įmonės vadovui</span>
              </div>
              <div className="private-input-fake">
                „Gydytojas puikus, tačiau registratūroje teko laukti 25 minutes be paaiškinimo...“
              </div>
              <div className="private-form-footer">
                <span className="shield-tag">
                  <ShieldCheck size={14} /> Neįkeliama į Google Maps
                </span>
                <span className="sent-tag">Atsidurs tik vadovo dėžutėje</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="simulator-footer">
        <Link href="/r/vilniaus-denta" className="simulator-link" target="_blank">
          <span>Išbandyti pilną paciento kelią tikrame lange</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
