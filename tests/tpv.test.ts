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
