import { Brand } from '@/components/brand';
import { VerifyAccount } from '@/components/account-actions';
export const dynamic='force-dynamic';
export const metadata={title:'El. pašto patvirtinimas',robots:{index:false,follow:false}};
export default async function Verify({searchParams}:{searchParams:Promise<{token?:string}>}){const {token}=await searchParams;return <div className="login-shell"><Brand/><main className="success-card"><h1>Patvirtinkite el. paštą.</h1><VerifyAccount token={typeof token==='string'?token:''}/></main></div>;}
