import { NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getTpvOperator } from '@/lib/auth/session';

/**
 * GET: llistat d'actes de barra disponibles per triar com a "acte actiu" en
 * obrir una caixa (operador o admin). Només actes amb catàleg configurat.
 */
export async function GET() {
  const operator = await getTpvOperator();
  if (!operator) {
    return apiError('tpvNotOperator', 403);
  }

  const events = await prisma.events.findMany({
    where: { tpv_event_products: { some: {} } },
    orderBy: { event_date: 'desc' },
    select: { id: true, title: true, event_date: true },
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      eventDate: e.event_date ? e.event_date.toISOString() : null,
    })),
  });
}
