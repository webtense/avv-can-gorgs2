import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSaleTotals,
  computeChange,
  computeCashClosing,
  CashPaymentError,
  resolveEventProductPriceCents,
  computeEventSessionReport,
  sumEventReports,
  resolveGiftValueCents,
  computeStockBalance,
  computeProductCostReport,
  type StockMovementRow,
} from '../lib/tpv';

test('computeSaleTotals suma les línies en cèntims', () => {
  const { totalCents, lines } = computeSaleTotals([
    { productId: 'a', name: 'Coca-Cola', unitPriceCents: 150, qty: 2 },
    { productId: 'b', name: 'Cervesa', unitPriceCents: 200, qty: 3 },
  ]);

  assert.strictEqual(totalCents, 150 * 2 + 200 * 3);
  assert.strictEqual(lines[0].lineTotalCents, 300);
  assert.strictEqual(lines[1].lineTotalCents, 600);
});

test('computeSaleTotals amb carret buit dona total 0', () => {
  const { totalCents, lines } = computeSaleTotals([]);
  assert.strictEqual(totalCents, 0);
  assert.strictEqual(lines.length, 0);
});

test('computeChange calcula el canvi correcte', () => {
  assert.strictEqual(computeChange(500, 1000), 500);
  assert.strictEqual(computeChange(1000, 1000), 0);
});

test('computeChange llança CashPaymentError si l\'import entregat és insuficient', () => {
  assert.throws(() => computeChange(1000, 999), CashPaymentError);
});

test('computeCashClosing calcula l\'esperat i el descuadre sense diferència', () => {
  const result = computeCashClosing(5000, 12345, 5000 + 12345);
  assert.strictEqual(result.expectedCents, 17345);
  assert.strictEqual(result.differenceCents, 0);
});

test('computeCashClosing detecta un descuadre negatiu (falta efectiu)', () => {
  const result = computeCashClosing(5000, 10000, 14500);
  assert.strictEqual(result.expectedCents, 15000);
  assert.strictEqual(result.differenceCents, -500);
});

test('computeCashClosing detecta un descuadre positiu (sobra efectiu)', () => {
  const result = computeCashClosing(5000, 10000, 15500);
  assert.strictEqual(result.expectedCents, 15000);
  assert.strictEqual(result.differenceCents, 500);
});

test('computeSaleTotals exclou del total les línies marcades com a regal', () => {
  const { totalCents, lines } = computeSaleTotals([
    { productId: 'a', name: 'Coca-Cola', unitPriceCents: 150, qty: 2 },
    { productId: 'b', name: 'Cervesa', unitPriceCents: 200, qty: 3, isFree: true },
  ]);

  // Nomes la línia no gratuïta suma al total.
  assert.strictEqual(totalCents, 150 * 2);
  assert.strictEqual(lines[0].lineTotalCents, 300);
  // La línia gratuïta té line_total_cents = 0 però conserva unitPriceCents.
  assert.strictEqual(lines[1].lineTotalCents, 0);
  assert.strictEqual(lines[1].unitPriceCents, 200);
});

test('resolveEventProductPriceCents fa servir el preu de catàleg si no hi ha override', () => {
  assert.strictEqual(resolveEventProductPriceCents(300, null), 300);
  assert.strictEqual(resolveEventProductPriceCents(300, undefined), 300);
});

test('resolveEventProductPriceCents fa servir l\'override de l\'acte quan existeix', () => {
  assert.strictEqual(resolveEventProductPriceCents(300, 250), 250);
  assert.strictEqual(resolveEventProductPriceCents(300, 0), 0);
});

test('computeEventSessionReport quadra: recaptació = vendes no anul·lades, regals a part', () => {
  const report = computeEventSessionReport([
    {
      totalCents: 500,
      voided: false,
      lines: [
        { productKey: 'cervesa', qty: 2, unitPriceCents: 250, isFree: false },
      ],
    },
    {
      totalCents: 999999,
      voided: true, // no ha de comptar ni en recaptació ni en tiquets
      lines: [{ productKey: 'cervesa', qty: 100, unitPriceCents: 250, isFree: false }],
    },
    {
      totalCents: 0,
      voided: false,
      lines: [{ productKey: 'cervesa', qty: 1, unitPriceCents: 250, isFree: true }],
    },
  ]);

  assert.strictEqual(report.cashCents, 500);
  assert.strictEqual(report.ticketCount, 2);
  assert.strictEqual(report.giftCents, 250);
  assert.strictEqual(report.unitsByProduct.cervesa, 2);
  assert.strictEqual(report.giftUnitsByProduct.cervesa, 1);
  assert.strictEqual(report.avgTicketCents, 250);
});

test('sumEventReports suma els torns en el resum de l\'acte', () => {
  const r1 = computeEventSessionReport([
    { totalCents: 1000, voided: false, lines: [{ productKey: 'a', qty: 2, unitPriceCents: 500, isFree: false }] },
  ]);
  const r2 = computeEventSessionReport([
    { totalCents: 500, voided: false, lines: [{ productKey: 'a', qty: 1, unitPriceCents: 500, isFree: false }] },
  ]);
  const total = sumEventReports([r1, r2]);
  assert.strictEqual(total.cashCents, 1500);
  assert.strictEqual(total.ticketCount, 2);
  assert.strictEqual(total.unitsByProduct.a, 3);
});

test('computeEventSessionReport calcula els ingressos per producte i exclou els regals', () => {
  const report = computeEventSessionReport([
    {
      totalCents: 1000,
      voided: false,
      lines: [
        { productKey: 'Cava', qty: 2, unitPriceCents: 500, isFree: false },
        { productKey: 'Cava', qty: 1, unitPriceCents: 500, isFree: true },
      ],
    },
  ]);

  // La venda normal suma als ingressos del producte...
  assert.strictEqual(report.revenueByProduct.Cava, 1000);
  // ...però la línia de regal no hi suma res (venda amb regal no suma a ingressos).
  assert.strictEqual(report.cashCents, 1000);
});

test('resolveGiftValueCents fa servir el valor indicat si existeix', () => {
  assert.strictEqual(resolveGiftValueCents(1000, 200, 300), 1000);
  assert.strictEqual(resolveGiftValueCents(0, 200, 300), 0);
});

test('resolveGiftValueCents sense valor explícit fa servir el cost', () => {
  assert.strictEqual(resolveGiftValueCents(null, 200, 300), 200);
  assert.strictEqual(resolveGiftValueCents(undefined, 200, 300), 200);
});

test('resolveGiftValueCents sense valor ni cost fa servir el preu', () => {
  assert.strictEqual(resolveGiftValueCents(null, null, 300), 300);
});

test('resolveGiftValueCents sense cap dada dona 0', () => {
  assert.strictEqual(resolveGiftValueCents(null, null, null), 0);
});

test('computeStockBalance: entrades sumen, sortides/vendes/regals resten', () => {
  assert.strictEqual(
    computeStockBalance([
      { type: 'entrada', qty: 100 },
      { type: 'salida', qty: 10 },
      { type: 'venta', qty: 20 },
      { type: 'regalo', qty: 5 },
    ]),
    65
  );
});

test('computeProductCostReport: cas de prova de l\'acte "Paella"', () => {
  // Sortida de 10 unitats d'"Entrepà" (moviment manual, no és venda ni regal).
  // 20 unitats de "Cava" regalades amb cost de compra de 2 € i sense valor
  // propi indicat (l'operador va posar explícitament 0 perquè no interessa
  // valorar-les) -> coste de regalo 40,00 €.
  // 30 unitats de "Vi" regalades amb valor propi de 10 € i sense cost conegut
  // -> valor de regalo 300,00 €.
  const movements: StockMovementRow[] = [
    { productKey: 'Entrepà', type: 'salida', qty: 10, totalCostCents: 0, totalValueCents: 0 },
    { productKey: 'Cava', type: 'regalo', qty: 20, totalCostCents: 4000, totalValueCents: 0 },
    { productKey: 'Vi', type: 'regalo', qty: 30, totalCostCents: 0, totalValueCents: 30000 },
  ];

  const eventReport = computeEventSessionReport([
    {
      totalCents: 0,
      voided: false,
      lines: [
        { productKey: 'Cava', qty: 20, unitPriceCents: 0, isFree: true },
        { productKey: 'Vi', qty: 30, unitPriceCents: 0, isFree: true },
      ],
    },
  ]);

  const { rows, total } = computeProductCostReport(eventReport, movements);

  const entrepa = rows.find((r) => r.productKey === 'Entrepà')!;
  assert.strictEqual(entrepa.outUnits, 10);

  const cava = rows.find((r) => r.productKey === 'Cava')!;
  assert.strictEqual(cava.giftUnits, 20);
  assert.strictEqual(cava.giftCostCents, 4000); // 40,00 €

  const vi = rows.find((r) => r.productKey === 'Vi')!;
  assert.strictEqual(vi.giftUnits, 30);
  assert.strictEqual(vi.giftValueCents, 30000); // 300,00 €

  // Totals coherents de l'acte sencer.
  assert.strictEqual(total.outUnits, 10);
  assert.strictEqual(total.giftCostCents, 4000); // 40,00 € de coste de regalo
  assert.strictEqual(total.giftValueCents, 30000); // 300,00 € de valor de regalo
  assert.strictEqual(total.revenueCents, 0);
  assert.strictEqual(total.grossValueDeliveredCents, 30000); // ingressos (0) + valor regals
});

test('computeProductCostReport calcula el marge com ingressos menys cost del venut', () => {
  const movements: StockMovementRow[] = [
    { productKey: 'Cervesa', type: 'venta', qty: 10, totalCostCents: 1000, totalValueCents: 2500 },
  ];
  const eventReport = computeEventSessionReport([
    {
      totalCents: 2500,
      voided: false,
      lines: [{ productKey: 'Cervesa', qty: 10, unitPriceCents: 250, isFree: false }],
    },
  ]);

  const { rows } = computeProductCostReport(eventReport, movements);
  const cervesa = rows.find((r) => r.productKey === 'Cervesa')!;
  assert.strictEqual(cervesa.soldUnits, 10);
  assert.strictEqual(cervesa.revenueCents, 2500);
  assert.strictEqual(cervesa.soldCostCents, 1000);
  assert.strictEqual(cervesa.marginCents, 1500);
});
