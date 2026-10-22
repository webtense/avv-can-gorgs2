/**
 * Funciones puras de cálculo para el módulo de comptabilitat: IVA, totales de
 * factura y numeración correlativa. Todas las cantidades se expresan en
 * céntimos enteros para evitar errores de coma flotante.
 */

export interface InvoiceLineInput {
  qty: number;
  unitPriceCents: number;
  vatRatePercent: number;
}

export interface InvoiceLineComputed extends InvoiceLineInput {
  lineBaseCents: number;
  lineVatCents: number;
  lineTotalCents: number;
}

export interface InvoiceTotals {
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  lines: InvoiceLineComputed[];
}

/** Calcula el IVA de una base en céntimos para un tipo porcentual entero. Redondeo bancario estándar (half up). */
export function calculateVatCents(baseCents: number, vatRatePercent: number): number {
  if (!Number.isInteger(baseCents) || baseCents < 0) {
    throw new Error('baseCents ha de ser un enter >= 0');
  }
  if (!Number.isInteger(vatRatePercent) || vatRatePercent < 0) {
    throw new Error('vatRatePercent ha de ser un enter >= 0');
  }
  return Math.round((baseCents * vatRatePercent) / 100);
}

/** Calcula los totales de una línea de factura (base, IVA y total) en céntimos. */
export function calculateLineTotals(line: InvoiceLineInput): InvoiceLineComputed {
  if (!Number.isInteger(line.qty) || line.qty <= 0) {
    throw new Error('qty ha de ser un enter > 0');
  }
  if (!Number.isInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
    throw new Error('unitPriceCents ha de ser un enter >= 0');
  }
  const lineBaseCents = line.qty * line.unitPriceCents;
  const lineVatCents = calculateVatCents(lineBaseCents, line.vatRatePercent);
  return {
    ...line,
    lineBaseCents,
    lineVatCents,
    lineTotalCents: lineBaseCents + lineVatCents,
  };
}

/** Calcula los totales completos de una factura a partir de sus líneas. */
export function calculateInvoiceTotals(lines: InvoiceLineInput[]): InvoiceTotals {
  if (lines.length === 0) {
    throw new Error('La factura ha de tenir com a mínim una línia');
  }
  const computed = lines.map(calculateLineTotals);
  const subtotalCents = computed.reduce((sum, l) => sum + l.lineBaseCents, 0);
  const vatCents = computed.reduce((sum, l) => sum + l.lineVatCents, 0);
  return {
    subtotalCents,
    vatCents,
    totalCents: subtotalCents + vatCents,
    lines: computed,
  };
}

/**
 * Formatea el número correlativo de factura a partir de la serie (normalmente
 * el año) y el valor del correlativo, ej. formatInvoiceNumber(2026, 1) -> "2026/0001".
 */
export function formatInvoiceNumber(series: string | number, value: number): string {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('El valor del correlatiu ha de ser un enter > 0');
  }
  return `${series}/${String(value).padStart(4, '0')}`;
}

/** Convierte céntimos a una cadena con dos decimales y símbolo de euro, ej. 123456 -> "1.234,56 €". */
export function formatCents(cents: number, locale: 'ca' | 'es' = 'ca'): string {
  const euros = cents / 100;
  return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'ca-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(euros);
}
