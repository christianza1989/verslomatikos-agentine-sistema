import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { archiveBranch, createBranch, getBranches, getClientById, MAX_BRANCHES, updateBranch } from '@/lib/db';
import { canAccessClient } from '@/lib/clinic-access';
import { branchSchema } from '@/lib/validation';
import { currentPrincipal, error, jsonBody, sameOrigin } from '@/lib/security';

// Branches (filialai) of an account, 2026-11-11.
// POST   – create (clinic login: for its own account; owner: body.parent_id)
// PATCH  – edit ?id=   (name, city/address, review link, optional email/phone, page address)
// DELETE – archive ?id= (page stops collecting, data is kept)
const uniqueError = (e: unknown) => /UNIQUE constraint failed: clients\.(email|slug)/.exec(String(e))?.[1];

async function guard(req: NextRequest) {
  const principal = await currentPrincipal();
  if (!principal) return { fail: error('Prisijunkite.', 401) } as const;
  if (!sameOrigin(req)) return { fail: error('Netinkama užklausos kilmė.', 403) } as const;
  return { principal } as const;
}

export async function POST(req: NextRequest) {
  const g = await guard(req); if ('fail' in g) return g.fail;
  const body = await jsonBody(req).catch(() => null) as Record<string, unknown> | null;
  const parsed = branchSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.issues[0]?.message || 'Patikrinkite filialo duomenis.');
  const rootId = g.principal.role === 'clinic' ? g.principal.clientId : z.string().min(1).max(100).safeParse(body?.parent_id).data;
  const root = rootId ? getClientById(rootId) : undefined;
  if (!root || root.parent_id || root.archived_at || !canAccessClient(g.principal, root.id)) return error('Paskyra nerasta.', 404);
  if (root.is_demo) return error('Filialus galima kurti aktyvavus paskyrą.', 403);
  if (getBranches(root.id).length >= MAX_BRANCHES) return error(`Šiuo metu galima iki ${MAX_BRANCHES} filialų. Parašykite mums, jei reikia daugiau.`, 409);
  try {
    const branch = createBranch(root, parsed.data);
    return NextResponse.json({ ok: true, slug: branch.slug, id: branch.id }, { status: 201 });
  } catch (e) {
    if (uniqueError(e) === 'email') return error('Šis el. paštas jau naudojamas kitam profiliui. Įveskite kitą arba palikite tuščią.', 409);
    console.error('Branch create error:', e);
    return error('Nepavyko sukurti filialo.');
  }
}

export async function PATCH(req: NextRequest) {
  const g = await guard(req); if ('fail' in g) return g.fail;
  const branch = getClientById(req.nextUrl.searchParams.get('id') || '');
  if (!branch || !branch.parent_id || branch.archived_at || !canAccessClient(g.principal, branch.id)) return error('Filialas nerastas.', 404);
  const parsed = branchSchema.safeParse(await jsonBody(req).catch(() => null));
  if (!parsed.success) return error(parsed.error.issues[0]?.message || 'Patikrinkite filialo duomenis.');
  try {
    const saved = updateBranch(branch, parsed.data);
    return NextResponse.json({ ok: true, slug: saved.slug });
  } catch (e) {
    const which = uniqueError(e);
    if (which === 'email') return error('Šis el. paštas jau naudojamas kitam profiliui.', 409);
    if (which === 'slug') return error('Toks puslapio adresas jau užimtas. Pasirinkite kitą.', 409);
    console.error('Branch update error:', e);
    return error('Nepavyko išsaugoti filialo.');
  }
}

export async function DELETE(req: NextRequest) {
  const g = await guard(req); if ('fail' in g) return g.fail;
  const branch = getClientById(req.nextUrl.searchParams.get('id') || '');
  if (!branch || !branch.parent_id || !canAccessClient(g.principal, branch.id)) return error('Filialas nerastas.', 404);
  if (g.principal.role === 'clinic' && g.principal.clientId !== branch.parent_id) return error('Filialą pašalinti gali tik pagrindinė paskyra.', 403);
  if (!archiveBranch(branch.id)) return error('Filialas jau pašalintas.', 409);
  return NextResponse.json({ ok: true });
}
