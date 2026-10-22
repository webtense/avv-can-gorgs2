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
  resolveGiftUnitValueCents,
  computeProductStock,
  computeProductEventReportRow,
  sumProductEventReportRows,
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

test('resolveGiftUnitValueCents fa servir el valor explícit si n\'hi ha', () => {
  assert.strictEqual(resolveGiftUnitValueCents(1000, 200, 500), 1000);
});

test('resolveGiftUnitValueCents cau al cost si no hi ha valor explícit', () => {
  assert.strictEqual(resolveGiftUnitValueCents(null, 200, 500), 200);
  assert.strictEqual(resolveGiftUnitValueCents(undefined, 200, 500), 200);
});

test('resolveGiftUnitValueCents cau al preu si no hi ha valor ni cost', () => {
  assert.strictEqual(resolveGiftUnitValueCents(null, null, 500), 500);
  assert.strictEqual(resolveGiftUnitValueCents(null, null, null), null);
});

test('computeProductStock: entrades - sortides - vendes - regals', () => {
  const stock = computeProductStock([
    { type: 'entrada', qty: 100 },
    { type: 'salida', qty: 10 },
    { type: 'venta', qty: 20 },
    { type: 'regalo', qty: 50 },
  ]);
  assert.strictEqual(stock, 100 - 10 - 20 - 50);
});

test('computeProductEventReportRow quadra coste i valor de regals SEPARATS (cas del requisit 5)', () => {
  // 10 sortides manuals.
  // 20 unitats regalades amb cost 2€/unitat (sense valor explícit -> el
  // servidor ja hauria resolt unit_value_cents = cost_cents = 200 en crear
  // el moviment); cost total = valor total = 20 * 200 = 4000 (40,00€).
  const giftGroup1Cost = 20 * 200;
  const giftGroup1Value = 20 * 200;
  // 30 unitats regalades amb valor explícit 10€/unitat i sense cost
  // registrat; cost total = 0 (null), valor total = 30 * 1000 = 30000 (300€).
  const giftGroup2Value = 30 * 1000;

  const movements = [
    { type: 'salida' as const, qty: 10, totalCostCents: null, totalValueCents: null },
    { type: 'regalo' as const, qty: 20, totalCostCents: giftGroup1Cost, totalValueCents: giftGroup1Value },
    { type: 'regalo' as const, qty: 30, totalCostCents: null, totalValueCents: giftGroup2Value },
  ];

  const row = computeProductEventReportRow('cervesa', movements, 0);

  assert.strictEqual(row.unitsOut, 10);
  assert.strictEqual(row.unitsGifted, 50);
  // Cost dels regals: només el grup 1 té cost (40,00€); el grup 2 no en té.
  assert.strictEqual(row.giftCostCents, 4000);
  // Valor dels regals: suma dels dos grups (40,00€ + 300,00€ = 340,00€).
  assert.strictEqual(row.giftValueCents, giftGroup1Value + giftGroup2Value);
  assert.notStrictEqual(row.giftCostCents, row.giftValueCents);
});

test('sumProductEventReportRows suma ingressos, costos i marge de diversos productes', () => {
  const row1 = computeProductEventReportRow(
    'cervesa',
    [{ type: 'venta', qty: 10, totalCostCents: 1000, totalValueCents: null }],
    3000
  );
  const row2 = computeProductEventReportRow(
    'coca',
    [{ type: 'venta', qty: 5, totalCostCents: 250, totalValueCents: null }],
    1000
  );
  const total = sumProductEventReportRows([row1, row2]);
  assert.strictEqual(total.revenueCents, 4000);
  assert.strictEqual(total.soldCostCents, 1250);
  assert.strictEqual(total.marginCents, 4000 - 1250);
});
