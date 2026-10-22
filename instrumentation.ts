/**
 * Next.js invoca `register()` un sol cop en arrencar el servidor (Node.js runtime).
 * Comprovem aquí les variables d'entorn obligatòries en producció perquè l'aplicació
 * falli ràpid i amb un missatge clar, en lloc de fallar més tard a mitja petició.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'production') {
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length === 0) {
      throw new Error(
        'SESSION_SECRET no està definida. Cal configurar aquesta variable d\'entorn abans ' +
          'd\'arrencar l\'aplicació en producció (signatura de les cookies de sessió dels socis).'
      );
    }
  }
}
