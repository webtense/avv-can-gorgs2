/**
 * Lògica de càlcul del TPV en efectiu. Tots els imports són en cèntims
 * (enters), mai en float, per evitar errors d'arrodoniment amb diners.
 */

export interface CartLine {
  productId: string;
  name: string;
  unitPriceCents: number;
  qty: number;
  /** Línia de regal: el servidor sempre la calcula a 0, mai es confia en el client. */
  isFree?: boolean;
}

export interface SaleTotals {
  totalCents: number;
  lines: Array<CartLine & { lineTotalCents: number }>;
}

/**
 * Calcula el total d'una venda a partir de les línies del carret. Les línies
 * marcades com a regal (`isFree`) sumen 0 al total (i a la recaptació), però
 * conserven `unitPriceCents` per poder calcular el valor regalat als informes.
 */
export function computeSaleTotals(lines: CartLine[]): SaleTotals {
  const computedLines = lines.map((line) => ({
    ...line,
    lineTotalCents: line.isFree ? 0 : line.unitPriceCents * line.qty,
  }));
  const totalCents = computedLines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  return { totalCents, lines: computedLines };
}

/**
 * Resol el preu a aplicar a un producte dins el catàleg d'un acte de barra:
 * el preu propi de l'acte (`overrideCents`) si existeix, si no el de catàleg.
 */
export function resolveEventProductPriceCents(
  catalogPriceCents: number | null,
  overrideCents: number | null | undefined
): number | null {
  return overrideCents ?? catalogPriceCents;
}

export interface ReportSaleLine {
  productKey: string;
  qty: number;
  unitPriceCents: number;
  isFree: boolean;
}

export interface ReportSale {
  totalCents: number;
  voided: boolean;
  lines: ReportSaleLine[];
}

export interface EventSessionReport {
  ticketCount: number;
  cashCents: number;
  giftCents: number;
  avgTicketCents: number;
  /** Unitats venudes (no regal) per clau de producte. */
  unitsByProduct: Record<string, number>;
  /** Unitats regalades per clau de producte. */
  giftUnitsByProduct: Record<string, number>;
}

/**
 * Agrega un conjunt de vendes (d'un torn o d'un acte sencer) en l'informe:
 * recaptació = suma de total_cents de vendes no anul·lades; els regals es
 * mostren a part i mai sumen a la recaptació.
 */
export function computeEventSessionReport(sales: ReportSale[]): EventSessionReport {
  const validSales = sales.filter((s) => !s.voided);
  const cashCents = validSales.reduce((sum, s) => sum + s.totalCents, 0);
  const ticketCount = validSales.length;

  let giftCents = 0;
  const unitsByProduct: Record<string, number> = {};
  const giftUnitsByProduct: Record<string, number> = {};

  for (const sale of validSales) {
    for (const line of sale.lines) {
      if (line.isFree) {
        giftCents += line.unitPriceCents * line.qty;
        giftUnitsByProduct[line.productKey] = (giftUnitsByProduct[line.productKey] ?? 0) + line.qty;
      } else {
        unitsByProduct[line.productKey] = (unitsByProduct[line.productKey] ?? 0) + line.qty;
      }
    }
  }

  const avgTicketCents = ticketCount > 0 ? Math.round(cashCents / ticketCount) : 0;

  return { ticketCount, cashCents, giftCents, avgTicketCents, unitsByProduct, giftUnitsByProduct };
}

/** Suma diversos informes de torn en el resum total de l'acte. */
export function sumEventReports(reports: EventSessionReport[]): EventSessionReport {
  const merged: EventSessionReport = {
    ticketCount: 0,
    cashCents: 0,
    giftCents: 0,
    avgTicketCents: 0,
    unitsByProduct: {},
    giftUnitsByProduct: {},
  };
  for (const r of reports) {
    merged.ticketCount += r.ticketCount;
    merged.cashCents += r.cashCents;
    merged.giftCents += r.giftCents;
    for (const [k, v] of Object.entries(r.unitsByProduct)) {
      merged.unitsByProduct[k] = (merged.unitsByProduct[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(r.giftUnitsByProduct)) {
      merged.giftUnitsByProduct[k] = (merged.giftUnitsByProduct[k] ?? 0) + v;
    }
  }
  merged.avgTicketCents = merged.ticketCount > 0 ? Math.round(merged.cashCents / merged.ticketCount) : 0;
  return merged;
}

export class CashPaymentError extends Error {}

/** Calcula el canvi a retornar. Llança CashPaymentError si l'import entregat és insuficient. */
export function computeChange(totalCents: number, paidCents: number): number {
  if (paidCents < totalCents) {
    throw new CashPaymentError('paidCents insuficient per cobrir totalCents');
  }
  return paidCents - totalCents;
}

/** Calcula el descuadre en el tancament de caixa. */
export function computeCashClosing(
  openingFloatCents: number,
  salesTotalCents: number,
  countedCents: number
): { expectedCents: number; differenceCents: number } {
  const expectedCents = openingFloatCents + salesTotalCents;
  const differenceCents = countedCents - expectedCents;
  return { expectedCents, differenceCents };
}

/** Formata cèntims com a import en euros (ex: 1234 -> "12,34 €"). */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('ca-ES', {
    style: 'currency',
    currency: 'EUR',
  });
}

export const QUICK_CASH_AMOUNTS_CENTS = [500, 1000, 2000, 5000];
