import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getAdminMember } from '@/lib/auth/session';
import { computeProductStock } from '@/lib/tpv';

/**
 * GET: estoc actual de cada producte (admin), calculat com
 * entrades - sortides - vendes - regals a partir de tpv_stock_movements.
 */
export async function GET() {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }

  const movements = await prisma.tpv_stock_movements.findMany({
    select: { product_id: true, type: true, qty: true },
  });

  const byProduct = new Map<string, Array<{ type: string; qty: number }>>();
  for (const m of movements) {
    const list = byProduct.get(m.product_id) ?? [];
    list.push({ type: m.type, qty: m.qty });
    byProduct.set(m.product_id, list);
  }

  const stockByProduct: Record<string, number> = {};
  for (const [productId, list] of byProduct.entries()) {
    stockByProduct[productId] = computeProductStock(list);
  }

  return NextResponse.json({ stockByProduct });
}

/**
 * POST: registra manualment una entrada o sortida d'estoc (admin). Les
 * vendes i regals es registren automàticament en crear la línia de venda
 * (veure /api/tpv/sale), mai des d'aquí.
 */
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

  const type = body.type === 'entrada' || body.type === 'salida' ? body.type : null;
  if (!type) return apiError('invalidData', 400);

  const productId = String(body.productId || '');
  if (!productId) return apiError('invalidData', 400);

  const qty = Number(body.qty);
  if (!Number.isInteger(qty) || qty < 1) return apiError('tpvInvalidQty', 400);

  const product = await prisma.tpv_products.findUnique({ where: { id: productId } });
  if (!product) return apiError('tpvProductNotFound', 404);

  const eventId = typeof body.eventId === 'string' && body.eventId ? body.eventId : null;
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null;

  const totalCostCents = product.cost_cents != null ? qty * product.cost_cents : null;

  const movement = await prisma.tpv_stock_movements.create({
    data: {
      product_id: productId,
      event_id: eventId,
      type,
      qty,
      unit_cost_cents: product.cost_cents,
      total_cost_cents: totalCostCents,
      note,
    },
  });

  return NextResponse.json({ movement });
}
