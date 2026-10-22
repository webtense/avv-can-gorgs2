import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSaleTotals,
  computeChange,
  computeCashClosing,
  CashPaymentError,
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
