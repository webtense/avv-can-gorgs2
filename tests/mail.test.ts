import { test } from 'node:test';
import assert from 'node:assert/strict';
import { substituteVariables, sampleVariables } from '../lib/mail/template';
import { canReceiveMail, filterRecipients, chunkIntoBatches, type RecipientCandidate } from '../lib/mail/recipients';

test('substituteVariables reemplaza todas las variables conocidas', () => {
  const result = substituteVariables(
    'Hola {{nom}}, la quota de {{periode}} és de {{import}} € (factura {{nº_factura}}).',
    { nom: 'Maria', periode: '2026', import: '25,00', 'nº_factura': '2026-0001' }
  );
  assert.strictEqual(result, 'Hola Maria, la quota de 2026 és de 25,00 € (factura 2026-0001).');
});

test('substituteVariables deja en blanco una variable sin valor (nunca deja {{...}} sin sustituir)', () => {
  const result = substituteVariables('Hola {{nom}}, import: {{import}}.', { nom: 'Joan' });
  assert.strictEqual(result, 'Hola Joan, import: .');
  assert.ok(!result.includes('{{'));
});

test('substituteVariables no toca texto sin variables', () => {
  const result = substituteVariables('Text pla sense variables.', {});
  assert.strictEqual(result, 'Text pla sense variables.');
});

test('sampleVariables genera datos de ejemplo con el nombre indicado', () => {
  const vars = sampleVariables('Maria');
  assert.strictEqual(vars.nom, 'Maria');
  assert.ok(vars.import);
  assert.ok(vars.periode);
});

function makeMember(overrides: Partial<RecipientCandidate> = {}): RecipientCandidate {
  return {
    id: '1',
    name: 'Test',
    email: 'test@example.com',
    status: 'actiu',
    gdpr_consent_at: new Date(),
    mail_opt_out: false,
    ...overrides,
  };
}

test('canReceiveMail exige socio activo, con consentimiento y sin exclusión', () => {
  assert.strictEqual(canReceiveMail(makeMember()), true);
  assert.strictEqual(canReceiveMail(makeMember({ status: 'pendent' })), false);
  assert.strictEqual(canReceiveMail(makeMember({ gdpr_consent_at: null })), false);
  assert.strictEqual(canReceiveMail(makeMember({ mail_opt_out: true })), false);
});

test('filterRecipients descarta los socios que no cumplen los requisitos', () => {
  const members = [
    makeMember({ id: '1' }),
    makeMember({ id: '2', status: 'rebutjat' }),
    makeMember({ id: '3', mail_opt_out: true }),
    makeMember({ id: '4' }),
  ];
  const result = filterRecipients(members);
  assert.deepStrictEqual(result.map((m) => m.id), ['1', '4']);
});

test('chunkIntoBatches agrupa en lotes de 50 por defecto', () => {
  const items = Array.from({ length: 120 }, (_, i) => i);
  const batches = chunkIntoBatches(items);
  assert.strictEqual(batches.length, 3);
  assert.strictEqual(batches[0].length, 50);
  assert.strictEqual(batches[1].length, 50);
  assert.strictEqual(batches[2].length, 20);
});

test('chunkIntoBatches admite un tamaño de lote personalizado', () => {
  const items = [1, 2, 3, 4, 5];
  const batches = chunkIntoBatches(items, 2);
  assert.deepStrictEqual(batches, [[1, 2], [3, 4], [5]]);
});
