import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getTpvOperator } from '@/lib/auth/session';

/** Retorna el torn de caixa obert actual (o null si no n'hi ha cap). */
export async function GET() {
  const operator = await getTpvOperator();
  if (!operator) {
    return apiError('tpvNotOperator', 403);
  }

  const session = await prisma.cash_sessions.findFirst({
    where: { closed_at: null },
    orderBy: { opened_at: 'desc' },
  });

  return NextResponse.json({ session });
}

/** Obre un nou torn de caixa amb el fons de canvi inicial indicat. */
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

  const openingFloatCents = Number(body.openingFloatCents);
  if (!Number.isInteger(openingFloatCents) || openingFloatCents < 0) {
    return apiError('tpvInvalidAmount', 400);
  }

  const existing = await prisma.cash_sessions.findFirst({ where: { closed_at: null } });
  if (existing) {
    return apiError('tpvSessionAlreadyOpen', 409);
  }

  const session = await prisma.cash_sessions.create({
    data: {
      opened_by: operator.id,
      opening_float_cents: openingFloatCents,
    },
  });

  return NextResponse.json({ session });
}
