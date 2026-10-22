import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getTpvOperator } from '@/lib/auth/session';
import { computeSaleTotals, computeChange, CashPaymentError } from '@/lib/tpv';

interface CartItemInput {
  productId: string;
  qty: number;
}

/**
 * Registra una venda. El client només envia productId + qty; el servidor
 * recalcula el total amb els preus actuals de la base de dades (no es
 * confia mai en el total enviat pel client) i desa l'snapshot a les línies.
 */
export async function POST(request: NextRequest) {
  const operator = await getTpvOperator();
  if (!operator) {
    return apiError('tpvNotOperator', 403);
  }

  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  const session = await prisma.cash_sessions.findFirst({ where: { closed_at: null } });
  if (!session) {
    return apiError('tpvNoOpenSession', 409);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('invalidData', 400);
  }

  const items = Array.isArray(body.items) ? (body.items as CartItemInput[]) : [];
  if (items.length === 0) {
    return apiError('tpvEmptyCart', 400);
  }

  const paidCents = Number(body.paidCents);
  if (!Number.isInteger(paidCents) || paidCents < 0) {
    return apiError('tpvInvalidAmount', 400);
  }

  // Validació bàsica de les línies rebudes.
  const normalizedItems: CartItemInput[] = [];
  for (const item of items) {
    const productId = String(item?.productId || '');
    const qty = Number(item?.qty);
    if (!productId) return apiError('invalidData', 400);
    if (!Number.isInteger(qty) || qty < 1) return apiError('tpvInvalidQty', 400);
    normalizedItems.push({ productId, qty });
  }

  const productIds = normalizedItems.map((i) => i.productId);
  const products = await prisma.tpv_products.findMany({
    where: { id: { in: productIds } },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const lines = [];
  for (const item of normalizedItems) {
    const product = productById.get(item.productId);
    if (!product) return apiError('tpvProductNotFound', 404);
    if (!product.active || product.price_cents === null) {
      return apiError('tpvProductInactive', 400);
    }
    lines.push({
      productId: product.id,
      name: product.name,
      unitPriceCents: product.price_cents,
      qty: item.qty,
    });
  }

  const totals = computeSaleTotals(lines);

  let changeCents: number;
  try {
    changeCents = computeChange(totals.totalCents, paidCents);
  } catch (err) {
    if (err instanceof CashPaymentError) {
      return apiError('tpvInsufficientPayment', 400);
    }
    throw err;
  }

  const sale = await prisma.tpv_sales.create({
    data: {
      session_id: session.id,
      operator_id: operator.id,
      total_cents: totals.totalCents,
      paid_cents: paidCents,
      change_cents: changeCents,
      lines: {
        create: totals.lines.map((l) => ({
          product_id: l.productId,
          name: l.name,
          unit_price_cents: l.unitPriceCents,
          qty: l.qty,
          line_total_cents: l.lineTotalCents,
        })),
      },
    },
    include: { lines: true },
  });

  return NextResponse.json({ sale });
}
