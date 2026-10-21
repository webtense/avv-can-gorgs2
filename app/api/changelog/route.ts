const CHANGELOG = [
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
