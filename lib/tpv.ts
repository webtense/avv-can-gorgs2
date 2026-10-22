/**
 * Lògica de càlcul del TPV en efectiu. Tots els imports són en cèntims
 * (enters), mai en float, per evitar errors d'arrodoniment amb diners.
 */

export interface CartLine {
  productId: string;
  name: string;
  unitPriceCents: number;
  qty: number;
}

export interface SaleTotals {
  totalCents: number;
  lines: Array<CartLine & { lineTotalCents: number }>;
}

/** Calcula el total d'una venda a partir de les línies del carret. */
export function computeSaleTotals(lines: CartLine[]): SaleTotals {
  const computedLines = lines.map((line) => ({
    ...line,
    lineTotalCents: line.unitPriceCents * line.qty,
  }));
  const totalCents = computedLines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  return { totalCents, lines: computedLines };
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
