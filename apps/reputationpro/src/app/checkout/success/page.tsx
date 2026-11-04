import Link from 'next/link';
import {Brand} from '@/components/brand';
export const dynamic='force-dynamic';
export default function Success(){return <div className="login-shell"><Brand/><main id="main" className="success-card"><h1>Registracija laikinai sustabdyta.</h1><p>Šis puslapis nepatvirtina paskyros ar prenumeratos aktyvinimo.</p><Link href="/r/memocasting" className="btn btn-primary">Peržiūrėti demonstraciją</Link></main></div>;}
