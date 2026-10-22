/**
 * Rate limit senzill en memòria (no sobreviu reinicis ni funciona amb múltiples
 * instàncies del servidor). Suficient per frenar intents bàsics de força bruta
 * al login. Per a un entorn amb més d'una instància caldria un magatzem compartit
 * (Redis, Postgres, etc.).
 */
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function cleanup(now: number) {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/** Retorna true si encara es permet un intent per aquesta clau (normalment IP). */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  cleanup(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_ATTEMPTS) return false;
  bucket.count += 1;
  return true;
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unknown';
}
