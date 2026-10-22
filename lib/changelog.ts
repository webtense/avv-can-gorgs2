export interface ChangelogSections {
  features: string[];
  fixes: string[];
  internal: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  sections: ChangelogSections & {
    /**
     * Traducción al castellano de `features`/`fixes` (opcional).
     * Decisión: el catalán sigue siendo la fuente de verdad del changelog;
     * solo se traduce `es` para las entradas nuevas a partir de la 1.3.0.
     * Las entradas anteriores a la 1.3.0 se muestran en su idioma original
     * (mayoritariamente catalán, alguna en castellano) también con locale `es`.
     */
    es?: Partial<ChangelogSections>;
  };
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.5.3',
    date: '2026-10-23',
    sections: {
      features: [
        'Cost de compra editable per producte al catàleg del TPV, junt amb el preu',
        'Control d\'estoc: entrades i sortides manuals des de /admin/tpv i estoc actual calculat (entrades − sortides − vendes − regals)',
        'Valor propi del regal: en marcar una línia com a "Gratis" es pot indicar el seu valor (per defecte, el cost; si no n\'hi ha, el preu)',
        'Informe de l\'acte de barra ampliat amb cost i marge per producte (sortides, venut, regalat a cost i a valor, marge) i un resum econòmic de l\'acte, també a l\'exportació CSV',
      ],
      fixes: [],
      internal: [],
      es: {
        features: [
          'Coste de compra editable por producto en el catálogo del TPV, junto al precio',
          'Control de stock: entradas y salidas manuales desde /admin/tpv y stock actual calculado (entradas − salidas − ventas − regalos)',
          'Valor propio del regalo: al marcar una línea como "Gratis" se puede indicar su valor (por defecto, el coste; si no hay, el precio)',
          'Informe del evento de barra ampliado con coste y margen por producto (salidas, vendido, regalado a coste y a valor, margen) y un resumen económico del evento, también en la exportación CSV',
        ],
        fixes: [],
      },
    },
  },
  {
    version: '1.5.2',
    date: '2026-10-22',
    sections: {
      features: [
        'Actes de barra al TPV: catàleg i preus propis per acte (Paella, festes…), selecció de l\'acte actiu en obrir caixa',
        'Línies de venda marcades com a "Gratis" (regal): no sumen a la recaptació però queden registrades per a l\'informe',
        'Informe final per acte de barra amb exportació a CSV: unitats venudes i regalades, recaptació, valor dels regals, tiquet mitjà',
      ],
      fixes: [],
      internal: [],
      es: {
        features: [
          'Eventos de barra en el TPV: catálogo y precios propios por evento (Paella, fiestas…), selección del evento activo al abrir caja',
          'Líneas de venta marcadas como "Gratis" (regalo): no suman a la recaudación pero quedan registradas para el informe',
          'Informe final por evento de barra con exportación a CSV: unidades vendidas y regaladas, recaudación, valor de los regalos, ticket medio',
        ],
        fixes: [],
      },
    },
  },
  {
    version: '1.5.1',
    date: '2026-10-23',
    sections: {
      features: [
        'Nou mòdul de correu per a socis a /admin/correu: plantilles, enviament individual o a tots els socis actius, adjunts PDF i historial d\'enviaments',
        'Enviament via Brevo (API REST), amb previsualització i confirmació obligatòria abans d\'enviar',
        'Els socis poden excloure\'s de les comunicacions informatives; aquesta exclusió es respecta sempre',
      ],
      fixes: [],
      internal: [
        'Noves taules mail_templates i mail_log, i columna members.mail_opt_out (migració aditiva)',
      ],
      es: {
        features: [
          'Nuevo módulo de correo para socios en /admin/correu: plantillas, envío individual o a todos los socios activos, adjuntos PDF e historial de envíos',
          'Envío vía Brevo (API REST), con previsualización y confirmación obligatoria antes de enviar',
          'Los socios pueden excluirse de las comunicaciones informativas; esta exclusión se respeta siempre',
        ],
        fixes: [],
      },
    },
  },
  {
    version: '1.4.0',
    date: '2026-10-22',
    sections: {
      features: [
        'TPV en efectiu per a la barra: caixa per torns, catàleg de productes i tiquets en pantalla',
      ],
      fixes: [],
      internal: [],
      es: {
        features: [
          'TPV en efectivo para la barra: caja por turnos, catálogo de productos y tickets en pantalla',
        ],
        fixes: [],
      },
    },
  },
  {
    version: '1.3.1',
    date: '2026-10-22',
    sections: {
      features: [
        'Eslògans de marca ("Més que un barri" · "Des de 1984") a la portada i al peu de pàgina',
        'Nova pàgina de socis per canviar la contrasenya',
      ],
      fixes: [
        "Les fotos pujades per socis s'eliminen de metadades EXIF (incloent la ubicació GPS) abans de desar-se",
      ],
      internal: [],
      es: {
        features: [
          'Eslóganes de marca ("Más que un barrio" · "Desde 1984") en la portada y en el pie de página',
          'Nueva página de socios para cambiar la contraseña',
        ],
        fixes: [
          'Las fotos subidas por socios se eliminan de metadatos EXIF (incluida la ubicación GPS) antes de guardarse',
        ],
      },
    },
  },
  {
    version: '1.3.0',
    date: '2026-10-22',
    sections: {
      features: [
        'Web disponible en català i castellà, amb selector d\'idioma',
      ],
      fixes: [],
      internal: [],
      es: {
        features: [
          'Web disponible en catalán y castellano, con selector de idioma',
        ],
      },
    },
  },
  {
    version: '1.2.1',
    date: '2026-10-22',
    sections: {
      features: [
        'Botó «Inicia sessió» a la capçalera, i «Àrea de socis» quan ja has entrat',
      ],
      fixes: [
        'L\'inici de sessió funciona des de la xarxa local (sense HTTPS)',
      ],
      internal: [
        'Cookie de sessió segura només amb COOKIE_SECURE=true',
        'Endpoint GET /api/socis/me per saber si hi ha sessió',
      ],
    },
  },
  {
    version: '1.2.0',
    date: '2026-10-22',
    sections: {
      features: [
        'Alta de socis per sol·licitud online, amb validació per part de la junta (/socis/registre, /admin/socis)',
        'Inici i tancament de sessió per a socis (/socis/login, /socis/sortir), amb sessió de 30 dies',
        'Agenda pública d\'actes (/agenda), amb marca "només socis" i reserves gratuïtes amb aforament opcional',
        'Zona de socis (/socis) amb els propers actes i les reserves pròpies',
        'Pujada de fotos d\'actes pels socis (/socis/fotos/pujar), pendents d\'aprovació de la junta',
        'Galeria pública de fotos aprovades (/fotos) i moderació des de /admin/fotos',
        'Gestió d\'actes des de /admin/events: marcar "només socis", obrir reserves i fixar aforament',
      ],
      fixes: [],
      internal: [
        'Noves taules members, reservations i event_photos; camps members_only, reservations_open i capacity a events (migració aditiva)',
        'Contrasenyes amb scrypt (node:crypto) i sal aleatòria, mai en clar ni als registres',
        'Cookie de sessió signada amb HMAC-SHA256 (SESSION_SECRET), httpOnly i sameSite=lax',
        'Protecció CSRF per comprovació d\'origen a totes les peticions d\'escriptura i rate limit en memòria al login',
        'Pendent: les imatges pujades no es reescriuen per eliminar metadades EXIF (no hi ha cap llibreria de processament d\'imatges al projecte)',
      ],
    },
  },
  {
    version: '1.1.1',
    date: '2026-10-22',
    sections: {
      features: [
        'Logotip de l\'associació a la capçalera',
        'Avís legal amb les dades del titular',
      ],
      fixes: [],
      internal: [
        'Logotip recortat del cartell oficial de la Festa de la Paella (fons transparent)',
      ],
    },
  },
  {
    version: '1.1.0',
    date: '2026-10-22',
    sections: {
      features: [
        'Nova pàgina El barri: història de la Torre d\'en Gorgs amb fotografies de llicència lliure',
        'Pàgina L\'associació amb la trajectòria pública de l\'entitat',
        'Dades de contacte de l\'associació',
      ],
      fixes: [],
      internal: [
        'lib/site-config.ts: dades de l\'associació i menús en un sol fitxer; els camps no confirmats no es mostren',
        'Imatges de la Torre amb metadades EXIF (inclosa la ubicació GPS) eliminades abans de publicar-les',
      ],
    },
  },
  {
    version: '1.0.2',
    date: '2026-10-22',
    sections: {
      features: [],
      fixes: [
        'La versión que se muestra en la web coincide con la versión publicada',
      ],
      internal: [
        'lib/version.ts lee la versión de package.json en lugar de un valor fijo',
      ],
    },
  },
  {
    version: '1.0.1',
    date: '2026-10-22',
    sections: {
      features: [
        'Menú y páginas de la web: L\'associació, Contacte, Avís legal, Política de privacitat y Política de cookies',
        'Mensaje claro en el archivo cuando todavía no hay contenido publicado',
      ],
      fixes: [
        'La ficha de un elemento del archivo ya carga correctamente en producción',
      ],
      internal: [
        'lib/archive-detail.ts: la lógica de detalle se comparte entre la API y la página, sin llamadas HTTP internas',
        'lib/site-config.ts: datos de la asociación y menús en un único fichero',
      ],
    },
  },
  {
    version: '1.0.0',
    date: '2026-10-21',
    sections: {
      features: [
        'Archivo conectado a datos reales',
        'Aviso de nueva versión',
        'Historial de versiones',
      ],
      fixes: [],
      internal: [
        'hooks/useArchive.ts con hooks de lista, detalle y búsqueda contra /api/archive, /api/archive/[id] y /api/search',
        'Página principal, listado de arxiu (con filtros, paginación y búsqueda por query string) y detalle de ítem conectados a las APIs reales',
        'VersionManager revisa /api/version cada 30s y también al volver a la pestaña (visibilitychange)',
        'Página pública /changelog con el historial de versiones',
      ],
    },
  },
  {
    version: '0.6.0',
    date: '2026-10-21',
    sections: {
      features: [
        'Componentes React 19 + Tailwind CSS: Header, Footer, ArchiveList, ArchiveCard, ArchiveDetail, ArchiveFilters, SearchBar, Pagination, VersionBadge, ErrorBoundary',
        'Páginas: homepage, listado de arxiu con filtros, detalle de ítem con breadcrumbs y relacionados',
        'Diseño responsive mobile-first (320px–1024px+), paleta de marca (#8B1E2D / #D4A574) y tipografías Outfit + Playfair Display',
        'VersionManager con banner de actualización disponible (polling cada 30s)',
      ],
      fixes: [],
      internal: [
        'Tailwind CSS 3.4 configurado (tailwind.config.ts, postcss.config.js, app/globals.css)',
        'Listo para Oleada 5: integración con /api/archive real y PWA',
      ],
    },
  },
  {
    version: '0.5.0',
    date: '2026-10-21',
    sections: {
      features: [
        'Suite de tests E2E con Playwright (tests/e2e/archive.spec.ts) cubriendo /api/archive, /api/archive/[id], /api/search, /api/version, /api/health y /api/changelog',
        'Scripts npm test / test:ui / test:debug',
      ],
      fixes: [],
      internal: [
        'Auditoría de seguridad: npm audit baseline (audit-report.txt, no versionado) y gitleaks sin secretos detectados',
        'Vulnerabilidad high conocida en postcss (transitiva vía next@15) requiere upgrade breaking a next@16; pendiente para una oleada futura',
      ],
    },
  },
  {
    version: '0.4.0',
    date: '2026-10-21',
    sections: {
      features: [
        'APIs reales de /api/archive, /api/archive/[id] y /api/search wired a Prisma (events, photos, documents, videos)',
        'Búsqueda por título/descripción (contains insensitive) y filtros por type y tag',
        'Detalle de item con relatedItems (fotos/documentos/vídeos del mismo evento, o hermanos por event_id)',
        'Facets de /api/search (conteo por type y por tag)',
      ],
      fixes: [],
      internal: ['app/api/archive/mappers.ts centraliza el mapeo a ArchiveItemResponse y la resolución de tags vía item_tags'],
    },
  },
  {
    version: '0.3.0',
    date: '2026-10-21',
    sections: {
      features: [
        'Prisma ORM integrado sobre el schema PostgreSQL real (14 tablas: sources, rights, people, places, festivals, events, photos, documents, videos, tags, photo_people, item_tags, contributions, audit_log)',
        'prisma/schema.prisma generado por introspección (`prisma db pull`) del SQL existente, sin tocar app/db/migrations/001_initial_schema.sql',
        'lib/db.ts — cliente Prisma singleton',
        'Migración baseline de Prisma (prisma/migrations) marcada como aplicada sobre el esquema ya desplegado',
      ],
      fixes: [],
      internal: ['Listo para Oleada 2: APIs reales con queries Prisma'],
    },
  },
  {
    version: '0.2.0',
    date: '2026-10-21',
    sections: {
      features: [
        'Fase 0: setup de CI/CD validado (lint, build, gitleaks, publicación GHCR)',
        'Primer ciclo completo de despliegue de prueba',
      ],
      fixes: [],
      internal: ['Preparado para Oleada 1: Prisma schema'],
    },
  },
  {
    version: '0.1.1',
    date: '2026-10-19',
    sections: {
      features: [
        'PostgreSQL schema: 14 taules històriques (events, photos, documents, festivals, sources, rights, etc)',
        'API /api/archive — Buscar i llistar arxius (GET ?type=all|events|photos|documents&search=&limit=20&offset=0)',
        'PWA update detection via VersionManager component',
        'Health check endpoint /api/health',
      ],
      fixes: ['Service worker cache invalidation per buildId'],
      internal: ['Prepared for Fase 2: authentication, image upload, full-text search'],
    },
  },
];

export interface ResolvedChangelogEntry {
  version: string;
  date: string;
  features: string[];
  fixes: string[];
}

/**
 * Resuelve cada entrada al idioma pedido: usa `sections.es` si existe para
 * ese locale, y si no hay traducción cae al contenido original (catalán,
 * fuente de verdad del changelog).
 */
export function getChangelog(locale: 'ca' | 'es' = 'ca'): ResolvedChangelogEntry[] {
  return CHANGELOG.map((entry) => ({
    version: entry.version,
    date: entry.date,
    features:
      locale === 'es' && entry.sections.es?.features
        ? entry.sections.es.features
        : entry.sections.features,
    fixes:
      locale === 'es' && entry.sections.es?.fixes
        ? entry.sections.es.fixes
        : entry.sections.fixes,
  }));
}
