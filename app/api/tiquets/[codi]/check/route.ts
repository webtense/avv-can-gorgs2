import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getTpvOperator } from '@/lib/auth/session';
import { isValidTicketCode, evaluateCheckin } from '@/lib/tickets';
import { apiError } from '@/lib/i18n/api-error';

/**
 * Valida l'entrada d'un tiquet. Protegit amb la mateixa comprovació de rol
 * que la resta de /api/tpv: només operadors de TPV o admins. Idempotent:
 * un segon intent sobre el mateix codi no sobreescriu `checked_in_at` i
 * respon "ja utilitzat" amb l'hora original. No revela cap dada del titular
 * (nom/correu) a qui no estigui autenticat com a operador/admin.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ codi: string }> }) {
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  const operator = await getTpvOperator();
  if (!operator) {
    return apiError('tpvNotOperator', 403);
  }

  const { codi } = await params;
  const code = (codi || '').trim().toUpperCase();
  if (!isValidTicketCode(code)) {
    return apiError('ticketInvalidCode', 400);
  }

  const reservation = await prisma.reservations.findUnique({ where: { ticket_code: code } });
  if (!reservation) {
    return apiError('ticketNotFound', 404);
  }

  const now = new Date();
  const evaluation = evaluateCheckin(reservation.checked_in_at, now);

  if (evaluation.status === 'valid') {
    // UPDATE atòmic condicionat a checked_in_at IS NULL: evita una condició
    // de cursa si dues peticions arriben alhora per al mateix codi.
    const updated = await prisma.reservations.updateMany({
      where: { id: reservation.id, checked_in_at: null },
      data: { checked_in_at: now, checked_in_by: operator.id },
    });
    if (updated.count === 0) {
      // Algú altre l'ha validat just abans: recuperem l'hora real.
      const fresh = await prisma.reservations.findUnique({ where: { id: reservation.id } });
      return NextResponse.json({
        status: 'already_used',
        checkedInAt: fresh?.checked_in_at?.toISOString() ?? now.toISOString(),
      });
    }
    return NextResponse.json({ status: 'valid', checkedInAt: now.toISOString() });
  }

  return NextResponse.json({
    status: 'already_used',
    checkedInAt: evaluation.checkedInAt.toISOString(),
  });
}
