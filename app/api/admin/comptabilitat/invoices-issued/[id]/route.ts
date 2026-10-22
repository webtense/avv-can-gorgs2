import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';
import { reserveNextInvoiceNumber } from '@/lib/accounting/numbering';
import { logAccountingAudit } from '@/lib/accounting/audit';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  const { id } = await params;
  const invoice = await prisma.invoices_issued.findUnique({
    where: { id },
    include: { lines: { orderBy: { position: 'asc' } } },
  });
  if (!invoice) {
    return apiError('invalidData', 404);
  }
  return NextResponse.json({ invoice });
}

/** Anul·la una factura i emet la rectificativa en negatiu (mai s'esborra l'original). */
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
  if (body.action !== 'anular') {
    return apiError('invalidQuery', 400);
  }

  const { id } = await params;
  const original = await prisma.invoices_issued.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!original) {
    return apiError('invalidData', 404);
  }
  if (original.status === 'anulada') {
    return apiError('invalidData', 400);
  }

  const now = new Date();
  const series = `${now.getFullYear()}R`;

  const result = await prisma.$transaction(async (tx) => {
    await tx.invoices_issued.update({ where: { id: original.id }, data: { status: 'anulada' } });

    const rectNumber = await reserveNextInvoiceNumber(tx, series);
    const rectification = await tx.invoices_issued.create({
      data: {
        number: rectNumber,
        issue_date: now,
        recipient_name: original.recipient_name,
        recipient_nif: original.recipient_nif,
        recipient_address: original.recipient_address,
        subtotal_cents: -original.subtotal_cents,
        vat_cents: -original.vat_cents,
        total_cents: -original.total_cents,
        notes: `Rectificativa de ${original.number}`,
        rectifies_id: original.id,
        lines: {
          create: original.lines.map((l, i) => ({
            description: l.description,
            qty: l.qty,
            unit_price_cents: -l.unit_price_cents,
            base_cents: -l.base_cents,
            vat_rate_percent: l.vat_rate_percent,
            vat_cents: -l.vat_cents,
            line_total_cents: -l.line_total_cents,
            position: i,
          })),
        },
      },
    });

    await logAccountingAudit(tx, {
      actorMemberId: admin.id,
      action: 'cancel_invoice_issued',
      entity: 'invoices_issued',
      entityId: original.id,
      detail: `rectification=${rectification.number}`,
    });

    return rectification;
  });

  return NextResponse.json({ ok: true, rectification: { id: result.id, number: result.number } });
}
