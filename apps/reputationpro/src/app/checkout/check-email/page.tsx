import Link from 'next/link';
import { Brand } from '@/components/brand';
export default function CheckEmail(){return <div className="login-shell"><Brand/><main className="success-card"><h1>Patikrinkite el. paštą.</h1><p>Išsiuntėme patvirtinimo nuorodą. Ją atvėrę galėsite tęsti registraciją. Nuoroda galioja 30 minučių.</p><Link href="/checkout" className="text-link">Grįžti į registraciją</Link></main></div>;}
