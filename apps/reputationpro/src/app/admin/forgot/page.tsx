import Link from 'next/link';
import { Brand } from '@/components/brand';
import { ResetRequest } from '@/components/account-actions';
export const metadata={title:'Slaptažodžio atkūrimas',robots:{index:false,follow:false}};
export default function Forgot(){return <div className="login-shell"><Brand/><main className="login-card"><h1>Atkurkite slaptažodį.</h1><p>Įveskite patvirtintą paskyros el. paštą.</p><ResetRequest/><Link href="/admin/login" className="text-link">Grįžti prie prisijungimo</Link></main></div>;}
