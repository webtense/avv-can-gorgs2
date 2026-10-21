const CHANGELOG = [
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

export async function GET() {
  return Response.json({ changelog: CHANGELOG });
}
