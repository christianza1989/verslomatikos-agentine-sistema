import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LockKeyhole, ArrowLeft } from 'lucide-react';
import { Brand } from '@/components/brand';
import { LoginForm } from '@/components/login-form';
import { currentPrincipal,demoEnabled } from '@/lib/security';
export const dynamic='force-dynamic';
export const metadata={title:'Prisijungimas'};
export default async function Login(){if(await currentPrincipal())redirect('/admin');return <div className="login-shell"><Brand/><main id="main" className="login-card"><span className="login-icon"><LockKeyhole size={24}/></span><h1>Malonu sugrįžti.</h1><p>Prisijunkite prie savo valdymo erdvės.</p><LoginForm/><Link href="/admin/forgot" className="text-link">Pamiršote slaptažodį?</Link>{demoEnabled()&&<div className="local-note">Vietinis MVP. Savininko prisijungimo duomenys saugomi projekto <code>.env.local</code> faile.</div>}</main><Link href="/" className="subtle-link"><ArrowLeft size={16}/> Į pradžią</Link></div>;}
