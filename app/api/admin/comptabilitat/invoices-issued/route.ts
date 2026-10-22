import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';
import { calculateInvoiceTotals, type InvoiceLineInput } from '@/lib/accounting/money';
import { reserveNextInvoiceNumber } from '@/lib/accounting/numbering';
import { logAccountingAudit } from '@/lib/accounting/audit';

export async function GET() {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  const invoices = await prisma.invoices_issued.findMany({
    orderBy: { issue_date: 'desc' },
    select: {
      id: true,
      number: true,
      issue_date: true,
      recipient_name: true,
      total_cents: true,
      status: true,
    },
  });
  return NextResponse.json({ invoices });
}

interface RawLine {
  description?: unknown;
  qty?: unknown;
  unitPriceCents?: unknown;
  vatRatePercent?: unknown;
}

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

  const recipientName = typeof body.recipientName === 'string' ? body.recipientName.trim() : '';
  if (!recipientName) {
    return apiError('invalidData', 400);
  }
  const recipientNif = typeof body.recipientNif === 'string' && body.recipientNif.trim() ? body.recipientNif.trim() : null;
  const recipientAddress =
    typeof body.recipientAddress === 'string' && body.recipientAddress.trim() ? body.recipientAddress.trim() : null;
  const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null;

  const rawLines = Array.isArray(body.lines) ? (body.lines as RawLine[]) : [];
  if (rawLines.length === 0) {
    return apiError('invalidData', 400);
  }

  let lineInputs: InvoiceLineInput[];
  try {
    lineInputs = rawLines.map((l) => ({
      qty: Number(l.qty),
      unitPriceCents: Number(l.unitPriceCents),
      vatRatePercent: Number(l.vatRatePercent),
    }));
    for (const l of lineInputs) {
      if (!Number.isInteger(l.qty) || !Number.isInteger(l.unitPriceCents) || !Number.isInteger(l.vatRatePercent)) {
        throw new Error('invalid');
      }
    }
  } catch {
    return apiError('invalidData', 400);
  }

  let descriptions: string[];
  try {
    descriptions = rawLines.map((l) => {
      const d = typeof l.description === 'string' ? l.description.trim() : '';
      if (!d) throw new Error('invalid');
      return d.slice(0, 300);
    });
  } catch {
    return apiError('invalidData', 400);
  }

  let totals;
  try {
    totals = calculateInvoiceTotals(lineInputs);
  } catch {
    return apiError('invalidData', 400);
  }

  const now = new Date();
  const series = String(now.getFullYear());

  const invoice = await prisma.$transaction(async (tx) => {
    const number = await reserveNextInvoiceNumber(tx, series);
    const created = await tx.invoices_issued.create({
      data: {
        number,
        issue_date: now,
        recipient_name: recipientName,
        recipient_nif: recipientNif,
        recipient_address: recipientAddress,
        subtotal_cents: totals.subtotalCents,
        vat_cents: totals.vatCents,
        total_cents: totals.totalCents,
        notes,
        lines: {
          create: totals.lines.map((l, i) => ({
            description: descriptions[i],
            qty: l.qty,
            unit_price_cents: l.unitPriceCents,
            base_cents: l.lineBaseCents,
            vat_rate_percent: l.vatRatePercent,
            vat_cents: l.lineVatCents,
            line_total_cents: l.lineTotalCents,
            position: i,
          })),
        },
      },
    });
    await logAccountingAudit(tx, {
      actorMemberId: admin.id,
      action: 'create_invoice_issued',
      entity: 'invoices_issued',
      entityId: created.id,
      detail: `number=${created.number}`,
    });
    return created;
  });

  return NextResponse.json({ ok: true, invoice: { id: invoice.id, number: invoice.number } });
}
