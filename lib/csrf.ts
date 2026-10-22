import { NextRequest } from 'next/server';

/**
 * Protecció CSRF per comprovació d'origen: en una petició POST/PATCH/DELETE amb
 * cookies de sessió, l'origen (o el referer, si l'origen no es envia) ha de
 * coincidir amb el host de la petició. Els navegadors sempre envien Origin en
 * peticions fetch "same-origin" amb mètode no-GET, així que un formulari o script
 * d'un altre domini no el podrà falsificar.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const host = request.headers.get('host');
  if (!host) return false;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  // Sense Origin ni Referer: no podem validar l'origen, el rebutgem.
  return false;
}
