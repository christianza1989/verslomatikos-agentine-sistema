import Link from 'next/link';
import { Brand } from '@/components/brand';
export default function NotFound(){return <div className="simple-shell"><Brand/><main id="main"><h1>Šios nuorodos neradome.</h1><p>Patikrinkite įmonės QR kodą arba grįžkite į pradžią.</p><Link href="/" className="btn btn-primary">Grįžti į pradžią</Link></main></div>;}
