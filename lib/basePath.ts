/**
 * Prefijo de ruta con el que se publica la web (ver next.config.js `basePath`).
 * Next.js añade este prefijo automáticamente a next/link, next/image, redirect()
 * y a las rutas de API internas, pero NO a:
 *  - fetch('/api/...') hechos a mano desde el cliente
 *  - <img src="..."> / <a href="..."> escritos en HTML crudo (no next/link ni next/image)
 *  - window.location / window.open con rutas absolutas
 * Para esos casos hay que anteponer BASE_PATH explícitamente con withBasePath().
 */
export const BASE_PATH = '/avv';

export function withBasePath(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${BASE_PATH}${path}`;
}
