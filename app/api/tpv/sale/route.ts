import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getTpvOperator } from '@/lib/auth/session';
import {
  computeSaleTotals,
  computeChange,
  resolveEventProductPriceCents,
  resolveGiftValueCents,
  CashPaymentError,
} from '@/lib/tpv';

interface CartItemInput {
  productId: string;
  qty: number;
  isFree?: boolean;
  /** Valor unitari propi del regal (cèntims), opcional, només si isFree. */
  giftValueCents?: number;
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

  // Validació bàsica de les línies rebudes. `isFree` només es llegeix com a
  // senyal; el preu i el total sempre els recalcula el servidor.
  const normalizedItems: CartItemInput[] = [];
  for (const item of items) {
    const productId = String(item?.productId || '');
    const qty = Number(item?.qty);
    if (!productId) return apiError('invalidData', 400);
    if (!Number.isInteger(qty) || qty < 1) return apiError('tpvInvalidQty', 400);
    const isFree = Boolean(item?.isFree);
    let giftValueCents: number | undefined;
    if (isFree && item?.giftValueCents !== undefined && item?.giftValueCents !== null) {
      const v = Number(item.giftValueCents);
      if (!Number.isInteger(v) || v < 0) return apiError('tpvInvalidAmount', 400);
      giftValueCents = v;
    }
    normalizedItems.push({ productId, qty, isFree, giftValueCents });
  }

  const productIds = normalizedItems.map((i) => i.productId);
  const products = await prisma.tpv_products.findMany({
    where: { id: { in: productIds } },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  // Si el torn té un acte de barra actiu, el catàleg i els preus són els de
  // l'acte (amb override si en té); si no, el catàleg habitual.
  let eventPriceById: Map<string, number | null> | null = null;
  if (session.event_id) {
    const eventProducts = await prisma.tpv_event_products.findMany({
      where: { event_id: session.event_id, product_id: { in: productIds } },
    });
    eventPriceById = new Map(
      eventProducts.map((ep) => {
        const product = productById.get(ep.product_id);
        const price = resolveEventProductPriceCents(product?.price_cents ?? null, ep.price_cents_override);
        return [ep.product_id, price];
      })
    );
  }

  const lines = [];
  for (const item of normalizedItems) {
    const product = productById.get(item.productId);
    if (!product) return apiError('tpvProductNotFound', 404);

    let unitPriceCents: number | null;
    if (eventPriceById) {
      if (!eventPriceById.has(item.productId)) {
        return apiError('tpvProductNotInEvent', 400);
      }
      unitPriceCents = eventPriceById.get(item.productId) ?? null;
    } else {
      if (!product.active || product.price_cents === null) {
        return apiError('tpvProductInactive', 400);
      }
      unitPriceCents = product.price_cents;
    }
    if (unitPriceCents === null) {
      return apiError('tpvProductInactive', 400);
    }

    lines.push({
      productId: product.id,
      name: product.name,
      unitPriceCents,
      qty: item.qty,
      isFree: item.isFree,
      costCents: product.cost_cents,
      giftValueCents: item.giftValueCents,
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

  // Cada línia (venda o regal) genera, dins la mateixa transacció, un
  // moviment d'estoc: `venta` resta del catàleg i té com a "valor" els
  // ingressos; `regalo` resta del catàleg i congela el cost de compra i el
  // valor del regal (propi si l'operador l'ha indicat, o resolt per defecte).
  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.tpv_sales.create({
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
            is_free: Boolean(l.isFree),
          })),
        },
      },
      include: { lines: true },
    });

    for (const l of totals.lines) {
      if (l.isFree) {
        const resolvedValueCents = resolveGiftValueCents(l.giftValueCents, l.costCents, l.unitPriceCents);
        await tx.tpv_stock_movements.create({
          data: {
            product_id: l.productId,
            event_id: session.event_id,
            session_id: session.id,
            type: 'regalo',
            qty: l.qty,
            unit_cost_cents: l.costCents,
            unit_value_cents: l.giftValueCents ?? null,
            total_cost_cents: (l.costCents ?? 0) * l.qty,
            total_value_cents: resolvedValueCents * l.qty,
            created_by: operator.id,
          },
        });
      } else {
        await tx.tpv_stock_movements.create({
          data: {
            product_id: l.productId,
            event_id: session.event_id,
            session_id: session.id,
            type: 'venta',
            qty: l.qty,
            unit_cost_cents: l.costCents,
            total_cost_cents: (l.costCents ?? 0) * l.qty,
            total_value_cents: l.lineTotalCents,
            created_by: operator.id,
          },
        });
      }
    }

    return created;
  });

  return NextResponse.json({ sale });
}
