import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getAdminMember } from '@/lib/auth/session';

/**
 * GET: llistat dels "actes de barra" ja configurats (actes de l'agenda amb
 * catàleg de tpv_event_products), per a la pantalla d'administració (admin).
 */
export async function GET() {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }

  const events = await prisma.events.findMany({
    where: { tpv_event_products: { some: {} } },
    orderBy: { event_date: 'desc' },
    select: {
      id: true,
      title: true,
      event_date: true,
      _count: { select: { tpv_event_products: true } },
    },
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      eventDate: e.event_date ? e.event_date.toISOString() : null,
      productCount: e._count.tpv_event_products,
    })),
  });
}

interface ProductInput {
  productId: string;
  priceCentsOverride?: number | null;
}

/**
 * POST: crea o actualitza la configuració d'un acte de barra (admin).
 * Body: { eventId?, newEvent?: { title, eventDate? }, products: ProductInput[] }
 * Si no es dona `eventId`, es crea un acte nou a partir de `newEvent`.
 * Reemplaça completament el catàleg de l'acte pel llistat de `products` rebut.
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

  const productsInput = Array.isArray(body.products) ? (body.products as ProductInput[]) : [];
  const normalizedProducts: ProductInput[] = [];
  for (const p of productsInput) {
    const productId = String(p?.productId || '');
    if (!productId) return apiError('invalidData', 400);
    let priceCentsOverride: number | null = null;
    if (p.priceCentsOverride !== undefined && p.priceCentsOverride !== null) {
      const override = Number(p.priceCentsOverride);
      if (!Number.isInteger(override) || override < 0) {
        return apiError('tpvInvalidAmount', 400);
      }
      priceCentsOverride = override;
    }
    normalizedProducts.push({ productId, priceCentsOverride });
  }
  if (normalizedProducts.length === 0) {
    return apiError('tpvEventNoProducts', 400);
  }

  let eventId = typeof body.eventId === 'string' ? body.eventId : null;

  if (!eventId) {
    const newEvent = body.newEvent as { title?: string; eventDate?: string } | undefined;
    const title = String(newEvent?.title || '').trim();
    if (!title) {
      return apiError('tpvEventTitleRequired', 400);
    }
    const eventDate = newEvent?.eventDate ? new Date(newEvent.eventDate) : null;
    if (newEvent?.eventDate && Number.isNaN(eventDate?.getTime())) {
      return apiError('invalidData', 400);
    }
    const created = await prisma.events.create({
      data: {
        title,
        event_date: eventDate,
        event_year: eventDate ? eventDate.getFullYear() : null,
      },
    });
    eventId = created.id;
  } else {
    const existing = await prisma.events.findUnique({ where: { id: eventId } });
    if (!existing) {
      return apiError('tpvEventNotFound', 404);
    }
  }

  const productIds = normalizedProducts.map((p) => p.productId);
  const products = await prisma.tpv_products.findMany({ where: { id: { in: productIds } } });
  if (products.length !== new Set(productIds).size) {
    return apiError('tpvProductNotFound', 404);
  }

  await prisma.$transaction([
    prisma.tpv_event_products.deleteMany({ where: { event_id: eventId } }),
    prisma.tpv_event_products.createMany({
      data: normalizedProducts.map((p) => ({
        event_id: eventId as string,
        product_id: p.productId,
        price_cents_override: p.priceCentsOverride,
      })),
    }),
  ]);

  const event = await prisma.events.findUnique({
    where: { id: eventId },
    include: { tpv_event_products: { include: { product: true } } },
  });

  return NextResponse.json({ event });
}
