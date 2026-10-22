export interface RecipientCandidate {
  id: string;
  name: string;
  email: string;
  status: string;
  gdpr_consent_at: Date | string | null;
  mail_opt_out: boolean;
}

/**
 * Determina si un soci pot rebre comunicacions informatives: ha d'estar
 * actiu, tenir el consentiment RGPD informat i no haver-se exclòs d'aquest
 * tipus de comunicacions. Aquesta regla s'aplica sempre, independentment de
 * si l'enviament és individual, a un grup o a tots els socis.
 */
export function canReceiveMail(member: RecipientCandidate): boolean {
  return member.status === 'actiu' && Boolean(member.gdpr_consent_at) && !member.mail_opt_out;
}

/** Filtra una llista de socis candidats aplicant canReceiveMail(). */
export function filterRecipients<T extends RecipientCandidate>(members: T[]): T[] {
  return members.filter(canReceiveMail);
}

const BATCH_SIZE = 50;

/** Divideix una llista de destinataris en lots de 50 per a l'enviament amb pausa. */
export function chunkIntoBatches<T>(items: T[], size: number = BATCH_SIZE): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}
