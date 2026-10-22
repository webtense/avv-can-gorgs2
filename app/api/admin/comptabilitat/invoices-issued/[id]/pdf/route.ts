import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { getLocale } from '@/lib/i18n';
import { buildInvoiceIssuedPdf } from '@/lib/accounting/invoice-pdf';

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

  const locale = await getLocale();
  const pdf = buildInvoiceIssuedPdf(
    {
      number: invoice.number,
      issueDate: invoice.issue_date,
      recipientName: invoice.recipient_name,
      recipientNif: invoice.recipient_nif,
      recipientAddress: invoice.recipient_address,
      subtotalCents: invoice.subtotal_cents,
      vatCents: invoice.vat_cents,
      totalCents: invoice.total_cents,
      status: invoice.status,
      notes: invoice.notes,
      lines: invoice.lines.map((l) => ({
        description: l.description,
        qty: l.qty,
        unitPriceCents: l.unit_price_cents,
        vatRatePercent: l.vat_rate_percent,
        lineTotalCents: l.line_total_cents,
      })),
    },
    locale
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="factura-${invoice.number.replace('/', '-')}.pdf"`,
    },
  });
}
