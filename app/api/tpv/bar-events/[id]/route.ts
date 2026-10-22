import { NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getTpvOperator, getAdminMember } from '@/lib/auth/session';
import { resolveEventProductPriceCents } from '@/lib/tpv';

/**
 * GET: detall d'un acte de barra amb el seu catàleg resolt (preu d'acte si
 * n'hi ha, si no el de catàleg). Accessible a operadors (per a la pantalla de
 * venda) i admins (per a l'edició de la configuració).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const operator = await getTpvOperator();
  if (!operator) {
    return apiError('tpvNotOperator', 403);
  }

  const { id } = await params;
  const event = await prisma.events.findUnique({
    where: { id },
    include: {
      tpv_event_products: {
        include: { product: true },
      },
    },
  });
  if (!event) {
    return apiError('tpvEventNotFound', 404);
  }

  const isAdmin = Boolean(await getAdminMember());

  const products = event.tpv_event_products
    .map((ep) => ({
      id: ep.product.id,
      name: ep.product.name,
      category: ep.product.category,
      priceCents: resolveEventProductPriceCents(ep.product.price_cents, ep.price_cents_override),
      catalogPriceCents: ep.product.price_cents,
      priceCentsOverride: ep.price_cents_override,
      active: ep.product.active,
    }))
    .filter((p) => isAdmin || (p.active && p.priceCents !== null));

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      eventDate: event.event_date ? event.event_date.toISOString() : null,
    },
    products,
  });
}
