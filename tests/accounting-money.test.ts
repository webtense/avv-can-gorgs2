import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateVatCents,
  calculateLineTotals,
  calculateInvoiceTotals,
  formatInvoiceNumber,
} from '../lib/accounting/money';

test('calculateVatCents calcula el 21% sobre una base en céntimos', () => {
  assert.equal(calculateVatCents(10000, 21), 2100);
});

test('calculateVatCents redondea correctament amb bases no exactes', () => {
  assert.equal(calculateVatCents(333, 21), 70); // 69.93 -> 70
});

test('calculateVatCents amb tipus 0% retorna 0', () => {
  assert.equal(calculateVatCents(5000, 0), 0);
});

test('calculateLineTotals multiplica qty x preu i suma IVA', () => {
  const line = calculateLineTotals({ qty: 3, unitPriceCents: 1000, vatRatePercent: 21 });
  assert.equal(line.lineBaseCents, 3000);
  assert.equal(line.lineVatCents, 630);
  assert.equal(line.lineTotalCents, 3630);
});

test('calculateLineTotals rebutja qty <= 0', () => {
  assert.throws(() => calculateLineTotals({ qty: 0, unitPriceCents: 100, vatRatePercent: 21 }));
});

test('calculateInvoiceTotals suma diverses línies amb tipus d\'IVA diferents', () => {
  const totals = calculateInvoiceTotals([
    { qty: 2, unitPriceCents: 1000, vatRatePercent: 21 },
    { qty: 1, unitPriceCents: 500, vatRatePercent: 10 },
  ]);
  assert.equal(totals.subtotalCents, 2500);
  assert.equal(totals.vatCents, 420 + 50);
  assert.equal(totals.totalCents, 2500 + 470);
  assert.equal(totals.lines.length, 2);
});

test('calculateInvoiceTotals rebutja una factura sense línies', () => {
  assert.throws(() => calculateInvoiceTotals([]));
});

test('formatInvoiceNumber genera el format sèrie/correlatiu amb zeros a l\'esquerra', () => {
  assert.equal(formatInvoiceNumber(2026, 1), '2026/0001');
  assert.equal(formatInvoiceNumber(2026, 42), '2026/0042');
  assert.equal(formatInvoiceNumber(2026, 10000), '2026/10000');
});

test('formatInvoiceNumber rebutja valors <= 0', () => {
  assert.throws(() => formatInvoiceNumber(2026, 0));
});
