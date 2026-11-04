import { Brand } from '@/components/brand';
import { ResetPassword } from '@/components/account-actions';
export const dynamic='force-dynamic';
export const metadata={title:'Naujas slaptažodis',robots:{index:false,follow:false}};
export default async function Reset({searchParams}:{searchParams:Promise<{token?:string}>}){const {token}=await searchParams;return <div className="login-shell"><Brand/><main className="login-card"><h1>Pasirinkite naują slaptažodį.</h1><ResetPassword token={typeof token==='string'?token:''}/></main></div>;}
