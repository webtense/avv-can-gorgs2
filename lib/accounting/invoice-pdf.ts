import { siteConfig } from '@/lib/site-config';
import { formatCents } from './money';
import { buildSimplePdf, type PdfTextLine } from './pdf';
import type { Locale } from '@/lib/i18n';

export interface InvoicePdfLine {
  description: string;
  qty: number;
  unitPriceCents: number;
  vatRatePercent: number;
  lineTotalCents: number;
}

export interface InvoicePdfData {
  number: string;
  issueDate: Date;
  recipientName: string;
  recipientNif: string | null;
  recipientAddress: string | null;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  status: string;
  notes: string | null;
  lines: InvoicePdfLine[];
}

/**
 * Genera el PDF (borrador) de una factura emesa con les dades fixes de
 * l'entitat. El format legal (RD 1619/2012) encara no ha estat validat
 * per un assessor; aquest document és només per a revisió interna.
 */
export function buildInvoiceIssuedPdf(invoice: InvoicePdfData, locale: Locale = 'ca'): Buffer {
  const dateStr = new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'ca-ES', {
    timeZone: 'Europe/Madrid',
  }).format(invoice.issueDate);

  const lines: PdfTextLine[] = [
    { text: locale === 'es' ? 'BORRADOR — pendiente de revisión de gestoría' : 'ESBORRANY — pendent de revisió de gestoria', bold: true },
    { text: '' },
    { text: siteConfig.fullName, bold: true, size: 13 },
    { text: siteConfig.address },
    { text: `NIF: ${siteConfig.taxId ?? ''}` },
    { text: siteConfig.email ?? '' },
    { text: '' },
    { text: `${locale === 'es' ? 'Factura' : 'Factura'} ${invoice.number}`, bold: true, size: 12 },
    { text: `${locale === 'es' ? 'Fecha' : 'Data'}: ${dateStr}` },
    { text: `${locale === 'es' ? 'Estado' : 'Estat'}: ${invoice.status}` },
    { text: '' },
    { text: locale === 'es' ? 'Cliente' : 'Client', bold: true },
    { text: invoice.recipientName },
    ...(invoice.recipientNif ? [{ text: `NIF: ${invoice.recipientNif}` }] : []),
    ...(invoice.recipientAddress ? [{ text: invoice.recipientAddress }] : []),
    { text: '' },
    { text: locale === 'es' ? 'Conceptos' : 'Conceptes', bold: true },
  ];

  for (const line of invoice.lines) {
    lines.push({
      text: `${line.qty} x ${line.description} — ${formatCents(line.unitPriceCents, locale)} (IVA ${line.vatRatePercent}%) = ${formatCents(line.lineTotalCents, locale)}`,
    });
  }

  lines.push({ text: '' });
  lines.push({ text: `${locale === 'es' ? 'Base imponible' : 'Base imposable'}: ${formatCents(invoice.subtotalCents, locale)}` });
  lines.push({ text: `IVA: ${formatCents(invoice.vatCents, locale)}` });
  lines.push({ text: `TOTAL: ${formatCents(invoice.totalCents, locale)}`, bold: true, size: 12 });

  if (invoice.notes) {
    lines.push({ text: '' });
    lines.push({ text: `${locale === 'es' ? 'Notas' : 'Notes'}: ${invoice.notes}` });
  }

  return buildSimplePdf(lines);
}
