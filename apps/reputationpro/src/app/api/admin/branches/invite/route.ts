import { NextRequest, NextResponse } from 'next/server';
import { getClientById } from '@/lib/db';
import { createBranchInvite, revokeBranchAccess } from '@/lib/branch-invite';
import { appUrl, currentPrincipal, error, sameOrigin } from '@/lib/security';

// Branch manager invitations (ROADMAP N7). Only the account (main profile login) or the owner may
// invite or revoke; a branch login can never invite itself or others.
async function branchFor(req: NextRequest) {
  const principal = await currentPrincipal();
  if (!principal) return { fail: error('Prisijunkite.', 401) } as const;
  if (!sameOrigin(req)) return { fail: error('Netinkama užklausos kilmė.', 403) } as const;
  const branch = getClientById(req.nextUrl.searchParams.get('id') || '');
  if (!branch || !branch.parent_id || branch.archived_at) return { fail: error('Filialas nerastas.', 404) } as const;
  const allowed = principal.role === 'owner' || principal.clientId === branch.parent_id;
  if (!allowed) return { fail: error('Filialus kviesti gali tik pagrindinė paskyra.', 403) } as const;
  return { branch } as const;
}

export async function POST(req: NextRequest) {
  const r = await branchFor(req); if ('fail' in r) return r.fail;
  const token = createBranchInvite(r.branch);
  return NextResponse.json({ ok: true, url: `${appUrl()}/pakvietimas/${token}`, expires_days: 14 });
}

export async function DELETE(req: NextRequest) {
  const r = await branchFor(req); if ('fail' in r) return r.fail;
  revokeBranchAccess(r.branch.id);
  return NextResponse.json({ ok: true });
}
