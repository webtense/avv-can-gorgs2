import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getTpvOperator } from '@/lib/auth/session';
import { computeCashClosing } from '@/lib/tpv';

/** Tanca el torn de caixa obert, comptant l'efectiu i calculant el descuadre. */
export async function POST(request: NextRequest) {
  const operator = await getTpvOperator();
  if (!operator) {
    return apiError('tpvNotOperator', 403);
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

  const countedCents = Number(body.countedCents);
  if (!Number.isInteger(countedCents) || countedCents < 0) {
    return apiError('tpvInvalidAmount', 400);
  }
  const note = typeof body.note === 'string' ? body.note.slice(0, 1000) : null;

  const session = await prisma.cash_sessions.findFirst({ where: { closed_at: null } });
  if (!session) {
    return apiError('tpvNoOpenSession', 409);
  }

  const salesAgg = await prisma.tpv_sales.aggregate({
    where: { session_id: session.id, voided: false },
    _sum: { total_cents: true },
  });
  const salesTotalCents = salesAgg._sum.total_cents ?? 0;

  const { expectedCents, differenceCents } = computeCashClosing(
    session.opening_float_cents,
    salesTotalCents,
    countedCents
  );

  const closed = await prisma.cash_sessions.update({
    where: { id: session.id },
    data: {
      closed_at: new Date(),
      closed_by: operator.id,
      counted_cents: countedCents,
      expected_cents: expectedCents,
      difference_cents: differenceCents,
      note,
    },
  });

  return NextResponse.json({ session: closed });
}
