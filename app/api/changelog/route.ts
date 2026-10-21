const CHANGELOG = [
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

export async function GET() {
  return Response.json({ changelog: CHANGELOG });
}
