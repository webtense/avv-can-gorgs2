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

/**
 * Resol el valor unitari d'un regal: el valor explícit indicat en marcar la
 * línia com a regal té prioritat; si no se n'ha indicat cap, es fa servir el
 * cost unitari del producte; si tampoc hi ha cost, el preu normal (de
 * catàleg o de l'acte).
 */
export function resolveGiftUnitValueCents(
  explicitValueCents: number | null | undefined,
  costCents: number | null | undefined,
  priceCents: number | null | undefined
): number | null {
  if (explicitValueCents != null) return explicitValueCents;
  if (costCents != null) return costCents;
  return priceCents ?? null;
}

/** Stock actual d'un producte = entrades - sortides - vendes - regals. */
export function computeProductStock(movements: Array<{ type: string; qty: number }>): number {
  let stock = 0;
  for (const m of movements) {
    if (m.type === 'entrada') stock += m.qty;
    else stock -= m.qty;
  }
  return stock;
}

export interface StockMovementForReport {
  type: 'entrada' | 'salida' | 'venta' | 'regalo';
  qty: number;
  /** Cost total del moviment (qty * cost unitari), o null si no hi ha cost. */
  totalCostCents: number | null;
  /** Valor total del moviment (només regals: qty * valor unitari), o null. */
  totalValueCents: number | null;
}

export interface ProductEventReportRow {
  productKey: string;
  unitsOut: number;
  unitsSold: number;
  unitsGifted: number;
  revenueCents: number;
  giftCostCents: number;
  giftValueCents: number;
  soldCostCents: number;
  marginCents: number;
}

/**
 * Agrega els moviments d'estoc d'un producte (per a un acte) més els
 * ingressos de les seves línies de venda no gratuïtes en una fila de
 * l'informe per producte. El cost i el valor del regal SEMPRE se sumen a
 * partir dels totals ja calculats de cada moviment (mai es recalculen des de
 * qty*unitari aquí), de manera que dos grups de regals amb cost i valor
 * diferents no es confonguin entre si.
 */
export function computeProductEventReportRow(
  productKey: string,
  movements: StockMovementForReport[],
  revenueCents: number
): ProductEventReportRow {
  let unitsOut = 0;
  let unitsSold = 0;
  let unitsGifted = 0;
  let giftCostCents = 0;
  let giftValueCents = 0;
  let soldCostCents = 0;

  for (const m of movements) {
    if (m.type === 'salida') {
      unitsOut += m.qty;
    } else if (m.type === 'venta') {
      unitsSold += m.qty;
      soldCostCents += m.totalCostCents ?? 0;
    } else if (m.type === 'regalo') {
      unitsGifted += m.qty;
      giftCostCents += m.totalCostCents ?? 0;
      giftValueCents += m.totalValueCents ?? 0;
    }
  }

  return {
    productKey,
    unitsOut,
    unitsSold,
    unitsGifted,
    revenueCents,
    giftCostCents,
    giftValueCents,
    soldCostCents,
    marginCents: revenueCents - soldCostCents,
  };
}

/** Suma les files per producte de l'informe en el bloc resum de l'acte. */
export function sumProductEventReportRows(
  rows: ProductEventReportRow[]
): Omit<ProductEventReportRow, 'productKey'> {
  const total = rows.reduce(
    (acc, r) => ({
      unitsOut: acc.unitsOut + r.unitsOut,
      unitsSold: acc.unitsSold + r.unitsSold,
      unitsGifted: acc.unitsGifted + r.unitsGifted,
      revenueCents: acc.revenueCents + r.revenueCents,
      giftCostCents: acc.giftCostCents + r.giftCostCents,
      giftValueCents: acc.giftValueCents + r.giftValueCents,
      soldCostCents: acc.soldCostCents + r.soldCostCents,
      marginCents: 0,
    }),
    {
      unitsOut: 0,
      unitsSold: 0,
      unitsGifted: 0,
      revenueCents: 0,
      giftCostCents: 0,
      giftValueCents: 0,
      soldCostCents: 0,
      marginCents: 0,
    }
  );
  total.marginCents = total.revenueCents - total.soldCostCents;
  return total;
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
