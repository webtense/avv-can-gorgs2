import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getAdminMember } from '@/lib/auth/session';

/** PATCH: actualitza nom, categoria, preu, actiu o ordre d'un producte (admin). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  const { id } = await params;
  const product = await prisma.tpv_products.findUnique({ where: { id } });
  if (!product) {
    return apiError('tpvProductNotFound', 404);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('invalidData', 400);
  }

  const data: {
    name?: string;
    category?: string | null;
    price_cents?: number | null;
    active?: boolean;
    sort?: number;
  } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return apiError('tpvProductNameRequired', 400);
    data.name = name;
  }
  if (body.category !== undefined) {
    data.category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : null;
  }
  if (body.priceCents !== undefined) {
    if (body.priceCents === null) {
      data.price_cents = null;
    } else {
      const priceCents = Number(body.priceCents);
      if (!Number.isInteger(priceCents) || priceCents < 0) {
        return apiError('tpvInvalidAmount', 400);
      }
      data.price_cents = priceCents;
    }
  }
  if (body.sort !== undefined) {
    const sort = Number(body.sort);
    if (!Number.isInteger(sort)) return apiError('invalidData', 400);
    data.sort = sort;
  }
  if (body.active !== undefined) {
    data.active = Boolean(body.active);
  }

  // Comprova la invariant: no es pot activar sense preu.
  const finalActive = data.active ?? product.active;
  const finalPrice = data.price_cents !== undefined ? data.price_cents : product.price_cents;
  if (finalActive && finalPrice === null) {
    return apiError('tpvPriceRequiredToActivate', 400);
  }

  const updated = await prisma.tpv_products.update({
    where: { id },
    data,
  });

  return NextResponse.json({ product: updated });
}

/** DELETE: elimina un producte del catàleg (admin). */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  const { id } = await params;
  const product = await prisma.tpv_products.findUnique({ where: { id } });
  if (!product) {
    return apiError('tpvProductNotFound', 404);
  }

  await prisma.tpv_products.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
