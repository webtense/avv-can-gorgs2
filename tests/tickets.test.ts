import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateTicketCode, isValidTicketCode, evaluateCheckin, TICKET_CODE_LENGTH } from '../lib/tickets';

test('generateTicketCode genera un codi d\'almenys 12 caràcters', () => {
  const code = generateTicketCode();
  assert.ok(code.length >= 12);
  assert.strictEqual(code.length, TICKET_CODE_LENGTH);
});

test('generateTicketCode només fa servir l\'alfabet permès (sense 0/O/1/I/L/U)', () => {
  const forbidden = /[0O1ILU]/;
  for (let i = 0; i < 200; i++) {
    const code = generateTicketCode();
    assert.match(code, /^[A-Z0-9]+$/);
    assert.doesNotMatch(code, forbidden);
  }
});

test('generateTicketCode genera codis aleatoris sense col·lisions en una mostra gran', () => {
  const sample = new Set<string>();
  const N = 20000;
  for (let i = 0; i < N; i++) {
    sample.add(generateTicketCode());
  }
  // Test estadístic d'unicitat (no criptogràfic): amb un alfabet de 30
  // símbols i 12 posicions (30^12 combinacions possibles), no s'espera cap
  // col·lisió en una mostra de 20.000 codis.
  assert.strictEqual(sample.size, N);
});

test('isValidTicketCode accepta un codi ben format', () => {
  assert.ok(isValidTicketCode(generateTicketCode()));
  assert.ok(isValidTicketCode('23456789ABCD'));
});

test('isValidTicketCode rebutja codis massa curts, buits o amb caràcters no vàlids', () => {
  assert.strictEqual(isValidTicketCode(''), false);
  assert.strictEqual(isValidTicketCode('ABC'), false);
  assert.strictEqual(isValidTicketCode('23456789ABC0'), false); // conté el '0', no permès
  assert.strictEqual(isValidTicketCode('23456789abcd'), false); // minúscules no acceptades
});

test('evaluateCheckin: el primer ús marca el tiquet com a vàlid amb la data actual', () => {
  const now = new Date('2026-10-23T20:00:00Z');
  const result = evaluateCheckin(null, now);
  assert.strictEqual(result.status, 'valid');
  assert.strictEqual(result.checkedInAt.getTime(), now.getTime());
});

test('evaluateCheckin: un segon ús sobre el mateix tiquet dona "ja utilitzat" sense canviar l\'hora original', () => {
  const originalCheckin = new Date('2026-10-23T19:30:00Z');
  const now = new Date('2026-10-23T20:00:00Z');
  const result = evaluateCheckin(originalCheckin, now);
  assert.strictEqual(result.status, 'already_used');
  assert.strictEqual(result.checkedInAt.getTime(), originalCheckin.getTime());
});
