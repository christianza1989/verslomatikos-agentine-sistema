import { Clock, MapPin } from 'lucide-react';
import { Brand } from '@/components/brand';
import { InviteForm } from '@/components/invite-form';
import { inviteBranch } from '@/lib/branch-invite';
import { getClientById, isPlaceholderEmail } from '@/lib/db';

// Branch manager invitation (ROADMAP N7): /pakvietimas/{token} → own email + password → branch dashboard.
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pakvietimas į filialą – ReputationPro', robots: { index: false, follow: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const branch = inviteBranch(token);
  if (!branch) {
    return <div className="login-shell"><Brand/>
      <main id="main" className="login-card claim-card">
        <span className="login-icon"><Clock size={24}/></span>
        <h1>Pakvietimas nebegalioja</h1>
        <p>Nuoroda jau panaudota arba pasibaigė jos galiojimas (14 d.). Paprašykite naujos nuorodos įmonės paskyros administratoriaus.</p>
      </main>
    </div>;
  }
  const root = getClientById(branch.parent_id!);
  return <div className="login-shell"><Brand/>
    <main id="main" className="login-card claim-card">
      <span className="claim-badge"><MapPin size={15}/> Filialo prieiga</span>
      <h1>{branch.business_name}</h1>
      <p>{root ? `${root.business_name} kviečia Jus valdyti šio filialo atsiliepimus.` : 'Jus pakvietė valdyti šio filialo atsiliepimus.'} Matysite tik šio filialo pastabas, QR kodus ir nustatymus.</p>
      <InviteForm token={token} email={isPlaceholderEmail(branch.email) ? '' : branch.email}/>
    </main>
  </div>;
}
