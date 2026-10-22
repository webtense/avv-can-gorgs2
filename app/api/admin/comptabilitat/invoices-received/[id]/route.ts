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

  if (body.action !== 'pagar') {
    return apiError('invalidQuery', 400);
  }
  const method = String(body.method || '');
  if (!VALID_METHODS.includes(method)) {
    return apiError('invalidData', 400);
  }

  const { id } = await params;
  const invoice = await prisma.invoices_received.findUnique({ where: { id } });
  if (!invoice) {
    return apiError('invalidData', 404);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.invoices_received.update({
      where: { id },
      data: { status: 'pagada', paid_at: new Date(), method },
    });
    await logAccountingAudit(tx, {
      actorMemberId: admin.id,
      action: 'mark_invoice_received_paid',
      entity: 'invoices_received',
      entityId: id,
      detail: `method=${method}`,
    });
    return u;
  });

  return NextResponse.json({ ok: true, invoice: updated });
}
