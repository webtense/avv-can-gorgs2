import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';
import { logAccountingAudit } from '@/lib/accounting/audit';

const VALID_METHODS = ['efectiu', 'transferencia', 'altre'];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const action = String(body.action || '');
  const fee = await prisma.member_fees.findUnique({ where: { id } });
  if (!fee) {
    return apiError('invalidData', 404);
  }

  if (action === 'pagar') {
    const method = String(body.method || '');
    if (!VALID_METHODS.includes(method)) {
      return apiError('invalidData', 400);
    }
    const receiptNumber = typeof body.receiptNumber === 'string' ? body.receiptNumber.slice(0, 100) : null;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.member_fees.update({
        where: { id },
        data: { status: 'pagada', paid_at: new Date(), method, receipt_number: receiptNumber },
      });
      await logAccountingAudit(tx, {
        actorMemberId: admin.id,
        action: 'mark_fee_paid',
        entity: 'member_fees',
        entityId: id,
        detail: `method=${method}`,
      });
      return u;
    });
    return NextResponse.json({ ok: true, fee: updated });
  }

  if (action === 'revertir') {
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 300) : '';
    if (!reason) {
      return apiError('invalidData', 400);
    }
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.member_fees.update({
        where: { id },
        data: { status: 'pendent', paid_at: null, method: null, receipt_number: null },
      });
      await logAccountingAudit(tx, {
        actorMemberId: admin.id,
        action: 'revert_fee_payment',
        entity: 'member_fees',
        entityId: id,
        detail: `reason=${reason}`,
      });
      return u;
    });
    return NextResponse.json({ ok: true, fee: updated });
  }

  return apiError('invalidQuery', 400);
}
