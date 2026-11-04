'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Calculator, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Smartphone, 
  Calendar, 
  Bot, 
  User,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';

export function ReviveCalculator() {
  const [contacts, setContacts] = useState(500);
  const [avgTicket, setAvgTicket] = useState(85);
  const [conversionRate, setConversionRate] = useState(5); // 5%

  const recoveredPatients = Math.round(contacts * (conversionRate / 100));
  const estimatedRevenue = recoveredPatients * avgTicket;
  const planCost = 149;
  const roiMultiplier = Math.round(estimatedRevenue / planCost);

  return (
    <div className="revive-calc-box">
      <div className="calc-sliders-side">
        <div className="slider-group">
          <div className="slider-label-row">
            <span>Miegantys kontaktai bazėje (nesilankę 6+ mėn.):</span>
            <strong>{contacts} pacientų</strong>
          </div>
          <input 
            type="range" 
            min="100" 
            max="3000" 
            step="50" 
            value={contacts} 
            onChange={e => setContacts(Number(e.target.value))}
            className="revive-range-slider"
          />
          <div className="slider-limits">
            <small>100</small>
            <small>1,500</small>
            <small>3,000+</small>
          </div>
        </div>

        <div className="slider-group">
          <div className="slider-label-row">
            <span>Vidutinis krepšelis (procedūros kaina):</span>
            <strong>{avgTicket} €</strong>
          </div>
          <input 
            type="range" 
            min="30" 
            max="250" 
            step="5" 
            value={avgTicket} 
            onChange={e => setAvgTicket(Number(e.target.value))}
            className="revive-range-slider"
          />
          <div className="slider-limits">
            <small>30 € (Profilaktika)</small>
            <small>85 € (Higiena / Servisas)</small>
            <small>250 € (Gydymas / SPA)</small>
          </div>
        </div>

        <div className="slider-group">
          <div className="slider-label-row">
            <span>Reaktyvacijos rodiklis (konversija):</span>
            <strong>{conversionRate}% (Konservatyvus)</strong>
          </div>
          <input 
            type="range" 
            min="2" 
            max="12" 
            step="1" 
            value={conversionRate} 
            onChange={e => setConversionRate(Number(e.target.value))}
            className="revive-range-slider"
          />
          <div className="slider-limits">
            <small>2% (Minimalus)</small>
            <small>5% (Vidutinis)</small>
            <small>12% (Aukštas)</small>
          </div>
        </div>
      </div>

      <div className="calc-result-card">
        <div className="result-chip">
          <Sparkles size={14} />
          <span>PROGNOZUOJAMAS REZULTATAS</span>
        </div>

        <div className="result-metric-large">
          <span className="result-label">Prognozuojamos papildomos pajamos:</span>
          <div className="result-amount">+{estimatedRevenue.toLocaleString()} €</div>
          <span className="result-period">per vieną reaktyvacijos ciklą</span>
        </div>

        <div className="result-breakdown">
          <div className="breakdown-item">
            <span>Sugrąžinta pacientų:</span>
            <strong>{recoveredPatients} klientai</strong>
          </div>
          <div className="breakdown-item">
            <span>Investicijos grąža (ROI):</span>
            <strong className="roi-tag">{roiMultiplier}x grąža</strong>
          </div>
          <div className="breakdown-item">
            <span>Plano kaina:</span>
            <span>149 € / mėn.</span>
          </div>
        </div>

        <Link href="/checkout?plan=reviveleads" className="btn btn-primary calc-cta-btn">
          <span>Pradėti 14 d. nemokamą bandymą</span>
          <ArrowRight size={16} />
        </Link>
        <small className="calc-guarantee">
          <ShieldCheck size={14} /> Jokių sutarčių ar įsipareigojimų. Mokate tik jei sistema atneša pelną.
        </small>
      </div>
    </div>
  );
}

export function ReviveLandingChatDemo() {
  const [step, setStep] = useState<number>(0);

  const steps = [
    {
      replyText: 'Ar turite laisvą laiką šį ketvirtadienį po darbo?',
      botReply: 'Sveiki, Laura! Šį ketvirtadienį turime laisvus laikus: 17:30 arba 18:15 pas gyd. higienistę. Kuris laikas Jums būtų patogesnis?',
      options: ['Ketvirtadienį 17:30', 'Ketvirtadienį 18:15', 'Kitą savaitę']
    },
    {
      replyText: 'Tinka ketvirtadienį 17:30, užregistruokite mane.',
      botReply: 'Puiku! Užregistravome Jus ketvirtadieniui 17:30 profesionaliai higienai. Vizito priminimas atsiųstas. Lauksime atvykstant!',
      booked: 'Ketvirtadienis, 17:30 · Užregistruota'
    }
  ];

  return (
    <div className="landing-chat-wrapper">
      <div className="phone-mockup-landing">
        <div className="landing-phone-header">
          <div className="phone-avatar-mini">K</div>
          <div>
            <strong>Klinikos Registratūra</strong>
            <small>Dvikryptis SMS · ReviveLeads DI</small>
          </div>
        </div>

        <div className="landing-phone-chat">
          <div className="chat-bubble bot">
            Sveiki, Laura! Pastebėjome, kad nuo paskutinio Jūsų profilaktinio vizito praėjo daugiau nei 6 mėn. Ar norėtumėte rezervuoti patogų laiką higienai šią ar kitą savaitę?
          </div>

          {step >= 1 && (
            <>
              <div className="chat-bubble user">
                {steps[0].replyText}
              </div>
              <div className="chat-bubble bot">
                {steps[0].botReply}
              </div>
            </>
          )}

          {step >= 2 && (
            <>
              <div className="chat-bubble user">
                {steps[1].replyText}
              </div>
              <div className="chat-bubble bot">
                {steps[1].botReply}
              </div>
              <div className="booking-badge-landing">
                <CheckCircle2 size={16} />
                <span>{steps[1].booked}</span>
              </div>
            </>
          )}
        </div>

        <div className="landing-phone-actions">
          {step === 0 && (
            <button className="chat-action-btn" onClick={() => setStep(1)}>
              <span>Kliento atsakymas: „Ar turite laikų ketvirtadienį po darbo?“</span>
              <ArrowRight size={14} />
            </button>
          )}
          {step === 1 && (
            <button className="chat-action-btn" onClick={() => setStep(2)}>
              <span>Kliento pasirinkimas: „Tinka 17:30, užregistruokite“</span>
              <ArrowRight size={14} />
            </button>
          )}
          {step === 2 && (
            <button className="chat-reset-btn" onClick={() => setStep(0)}>
              <RotateCcw size={14} /> Pradėti demonstraciją iš naujo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
