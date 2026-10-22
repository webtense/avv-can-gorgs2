import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getAdminMember } from '@/lib/auth/session';
import { computeStockBalance, type StockMovementType } from '@/lib/tpv';

const MANUAL_TYPES: StockMovementType[] = ['entrada', 'salida'];

/**
 * GET: estoc actual de tots els productes (entrades - sortides - vendes -
 * regals), a partir de tots els moviments registrats (admin).
 */
export async function GET() {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }

  const movements = await prisma.tpv_stock_movements.findMany({
    select: { product_id: true, type: true, qty: true },
  });

  const byProduct = new Map<string, Array<{ type: StockMovementType; qty: number }>>();
  for (const m of movements) {
    const list = byProduct.get(m.product_id) ?? [];
    list.push({ type: m.type as StockMovementType, qty: m.qty });
    byProduct.set(m.product_id, list);
  }

  const stockByProductId: Record<string, number> = {};
  for (const [productId, list] of byProduct.entries()) {
    stockByProductId[productId] = computeStockBalance(list);
  }

  return NextResponse.json({ stockByProductId });
}

/**
 * POST: registra una entrada o sortida manual d'estoc (admin). El cost
 * unitari es congela a partir del cost de catàleg del producte en aquest
 * moment. Si la sortida deixa l'estoc en negatiu cal confirmar-ho
 * explícitament (`confirmNegative`), i la nota queda registrada.
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

  const type = String(body.type || '');
  if (!MANUAL_TYPES.includes(type as StockMovementType)) {
    return apiError('tpvStockInvalidType', 400);
  }

  const productId = String(body.productId || '');
  if (!productId) return apiError('invalidData', 400);

  const qty = Number(body.qty);
  if (!Number.isInteger(qty) || qty < 1) return apiError('tpvInvalidQty', 400);

  const product = await prisma.tpv_products.findUnique({ where: { id: productId } });
  if (!product) return apiError('tpvProductNotFound', 404);

  const eventId = typeof body.eventId === 'string' && body.eventId ? body.eventId : null;
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null;
  const confirmNegative = Boolean(body.confirmNegative);

  if (type === 'salida') {
    const existing = await prisma.tpv_stock_movements.findMany({
      where: { product_id: productId },
      select: { type: true, qty: true },
    });
    const currentStock = computeStockBalance(existing.map((m) => ({ type: m.type as StockMovementType, qty: m.qty })));
    if (currentStock - qty < 0 && !confirmNegative) {
      return apiError('tpvStockNegativeConfirm', 409);
    }
  }

  const unitCostCents = product.cost_cents ?? null;
  const totalCostCents = (unitCostCents ?? 0) * qty;

  const movement = await prisma.tpv_stock_movements.create({
    data: {
      product_id: productId,
      event_id: eventId,
      type,
      qty,
      unit_cost_cents: unitCostCents,
      total_cost_cents: totalCostCents,
      total_value_cents: totalCostCents,
      note,
      created_by: admin.id,
    },
  });

  return NextResponse.json({ movement }, { status: 201 });
}
