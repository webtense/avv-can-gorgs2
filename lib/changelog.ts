export interface ChangelogEntry {
  version: string;
  date: string;
  sections: {
    features: string[];
    fixes: string[];
    internal: string[];
  };
}

export const CHANGELOG: ChangelogEntry[] = [
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
