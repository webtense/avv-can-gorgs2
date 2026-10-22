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
  /** Cost unitari de compra del producte en el moment de la venda (per als moviments d'estoc). */
  costCents?: number | null;
  /** Valor unitari propi del regal indicat per l'operador (per als moviments d'estoc). */
  giftValueCents?: number | null;
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
  /** Ingressos (no regal) per clau de producte, en cèntims. */
  revenueByProduct: Record<string, number>;
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
  const revenueByProduct: Record<string, number> = {};

  for (const sale of validSales) {
    for (const line of sale.lines) {
      if (line.isFree) {
        giftCents += line.unitPriceCents * line.qty;
        giftUnitsByProduct[line.productKey] = (giftUnitsByProduct[line.productKey] ?? 0) + line.qty;
      } else {
        unitsByProduct[line.productKey] = (unitsByProduct[line.productKey] ?? 0) + line.qty;
        revenueByProduct[line.productKey] = (revenueByProduct[line.productKey] ?? 0) + line.unitPriceCents * line.qty;
      }
    }
  }

  const avgTicketCents = ticketCount > 0 ? Math.round(cashCents / ticketCount) : 0;

  return { ticketCount, cashCents, giftCents, avgTicketCents, unitsByProduct, giftUnitsByProduct, revenueByProduct };
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
    revenueByProduct: {},
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
    for (const [k, v] of Object.entries(r.revenueByProduct)) {
      merged.revenueByProduct[k] = (merged.revenueByProduct[k] ?? 0) + v;
    }
  }
  merged.avgTicketCents = merged.ticketCount > 0 ? Math.round(merged.cashCents / merged.ticketCount) : 0;
  return merged;
}

/**
 * Resol el valor unitari d'un regal (en cèntims) quan l'operador no n'ha
 * indicat un de propi: per defecte és el cost de compra del producte; si no
 * hi ha cost, es fa servir el preu de venda; si tampoc n'hi ha, 0.
 */
export function resolveGiftValueCents(
  providedValueCents: number | null | undefined,
  costCents: number | null | undefined,
  priceCents: number | null | undefined
): number {
  if (providedValueCents !== null && providedValueCents !== undefined) return providedValueCents;
  if (costCents !== null && costCents !== undefined) return costCents;
  if (priceCents !== null && priceCents !== undefined) return priceCents;
  return 0;
}

export type StockMovementType = 'entrada' | 'salida' | 'venta' | 'regalo';

export interface StockMovementRow {
  productKey: string;
  type: StockMovementType;
  qty: number;
  totalCostCents: number;
  totalValueCents: number;
}

/** Balanç d'estoc actual: entrades − sortides − vendes − regals. */
export function computeStockBalance(movements: Array<{ type: StockMovementType; qty: number }>): number {
  let balance = 0;
  for (const m of movements) {
    if (m.type === 'entrada') balance += m.qty;
    else balance -= m.qty;
  }
  return balance;
}

export interface ProductCostReportRow {
  productKey: string;
  /** Unitats de sortida manual (moviment `salida`) de l'acte. */
  outUnits: number;
  soldUnits: number;
  revenueCents: number;
  giftUnits: number;
  giftCostCents: number;
  giftValueCents: number;
  /** Cost de les unitats venudes (qty × cost), a partir dels moviments `venta`. */
  soldCostCents: number;
  /** Marge = ingressos − cost de les unitats venudes. */
  marginCents: number;
}

export interface ProductCostReport {
  rows: ProductCostReportRow[];
  total: ProductCostReportRow & { grossValueDeliveredCents: number };
}

function sumMovements(
  movements: StockMovementRow[],
  productKey: string,
  type: StockMovementType,
  field: 'qty' | 'totalCostCents' | 'totalValueCents'
): number {
  return movements
    .filter((m) => m.productKey === productKey && m.type === type)
    .reduce((sum, m) => sum + m[field], 0);
}

/**
 * Informe de cost i estoc per producte d'un acte: combina l'informe de
 * vendes (ingressos, unitats venudes/regalades) amb els moviments d'estoc
 * (sortides manuals, cost i valor dels regals, cost del venut) per donar una
 * fila per producte més una fila TOTAL amb el resum de l'acte.
 */
export function computeProductCostReport(
  eventReport: EventSessionReport,
  movements: StockMovementRow[]
): ProductCostReport {
  const productKeys = new Set<string>([
    ...Object.keys(eventReport.unitsByProduct),
    ...Object.keys(eventReport.giftUnitsByProduct),
    ...movements.map((m) => m.productKey),
  ]);

  const rows: ProductCostReportRow[] = [];
  for (const key of productKeys) {
    const soldUnits = eventReport.unitsByProduct[key] ?? 0;
    const revenueCents = eventReport.revenueByProduct[key] ?? 0;
    const giftUnits = eventReport.giftUnitsByProduct[key] ?? 0;

    const outUnits = sumMovements(movements, key, 'salida', 'qty');
    const giftCostCents = sumMovements(movements, key, 'regalo', 'totalCostCents');
    const giftValueCents = sumMovements(movements, key, 'regalo', 'totalValueCents');
    const soldCostCents = sumMovements(movements, key, 'venta', 'totalCostCents');

    const marginCents = revenueCents - soldCostCents;

    rows.push({
      productKey: key,
      outUnits,
      soldUnits,
      revenueCents,
      giftUnits,
      giftCostCents,
      giftValueCents,
      soldCostCents,
      marginCents,
    });
  }

  rows.sort((a, b) => a.productKey.localeCompare(b.productKey, 'ca'));

  const totalBase: ProductCostReportRow = {
    productKey: 'TOTAL',
    outUnits: 0,
    soldUnits: 0,
    revenueCents: 0,
    giftUnits: 0,
    giftCostCents: 0,
    giftValueCents: 0,
    soldCostCents: 0,
    marginCents: 0,
  };
  const total = rows.reduce((acc, r) => {
    acc.outUnits += r.outUnits;
    acc.soldUnits += r.soldUnits;
    acc.revenueCents += r.revenueCents;
    acc.giftUnits += r.giftUnits;
    acc.giftCostCents += r.giftCostCents;
    acc.giftValueCents += r.giftValueCents;
    acc.soldCostCents += r.soldCostCents;
    acc.marginCents += r.marginCents;
    return acc;
  }, totalBase);

  const grossValueDeliveredCents = total.revenueCents + total.giftValueCents;

  return { rows, total: { ...total, grossValueDeliveredCents } };
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
