import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getTpvOperator, getAdminMember } from '@/lib/auth/session';

/**
 * GET: llistat de productes.
 * - Operadors de TPV: només productes actius (per a la pantalla de venda).
 * - Admins: tot el catàleg (per a /admin/tpv), amb ?all=1.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wantsAll = searchParams.get('all') === '1';

  if (wantsAll) {
    const admin = await getAdminMember();
    if (!admin) {
      return apiError('notAuthorized', 403);
    }
    const products = await prisma.tpv_products.findMany({
      orderBy: [{ sort: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json({ products });
  }

  const operator = await getTpvOperator();
  if (!operator) {
    return apiError('tpvNotOperator', 403);
  }
  const products = await prisma.tpv_products.findMany({
    where: { active: true, price_cents: { not: null } },
    orderBy: [{ sort: 'asc' }, { name: 'asc' }],
  });
  return NextResponse.json({ products });
}

/** POST: crea un producte nou (admin). Es crea inactiu i sense preu per defecte. */
export async function POST(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('invalidData', 400);
  }

  const name = String(body.name || '').trim();
  if (!name) {
    return apiError('tpvProductNameRequired', 400);
  }
  const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : null;
  const sort = Number.isInteger(body.sort) ? Number(body.sort) : 0;

  const product = await prisma.tpv_products.create({
    data: { name, category, sort, active: false, price_cents: null },
  });

  return NextResponse.json({ product }, { status: 201 });
}
