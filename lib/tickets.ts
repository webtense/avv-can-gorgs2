import { randomInt } from 'node:crypto';

/**
 * Alfabet Crockford (sense 0/O/1/I/L/U, que es confonen fàcilment a simple
 * vista o en lletra manuscrita) per generar codis de tiquet llegibles.
 */
const TICKET_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
export const TICKET_CODE_LENGTH = 12;

const TICKET_CODE_RE = new RegExp(`^[${TICKET_ALPHABET}]{${TICKET_CODE_LENGTH},}$`);

/**
 * Genera un codi públic de tiquet: aleatori (no seqüencial), d'una longitud
 * mínima de 12 caràcters, amb un alfabet que evita caràcters ambigus. No és
 * criptogràficament sensible (no protegeix cap secret, només evita que es
 * pugui endevinar un altre tiquet per força bruta trivial), però fa servir
 * `randomInt` (CSPRNG) per tenir una distribució uniforme real.
 */
export function generateTicketCode(length: number = TICKET_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += TICKET_ALPHABET[randomInt(0, TICKET_ALPHABET.length)];
  }
  return code;
}

/** Comprova que un codi de tiquet té el format esperat (longitud i alfabet). */
export function isValidTicketCode(code: string): boolean {
  return typeof code === 'string' && TICKET_CODE_RE.test(code);
}

export interface CheckinEvaluation {
  status: 'valid' | 'already_used';
  checkedInAt: Date;
}

/**
 * Lògica pura de validació d'un check-in: si el tiquet ja tenia una data de
 * check-in prèvia, la decisió és "ja utilitzat" i es conserva aquella data
 * (mai es sobreescriu). Si no en tenia, es marca com a vàlid amb `now`. La
 * ruta de l'API és responsable d'aplicar aquest resultat de forma atòmica
 * (p.ex. amb un UPDATE condicionat a `checked_in_at IS NULL`).
 */
export function evaluateCheckin(previousCheckedInAt: Date | null, now: Date): CheckinEvaluation {
  if (previousCheckedInAt) {
    return { status: 'already_used', checkedInAt: previousCheckedInAt };
  }
  return { status: 'valid', checkedInAt: now };
}
