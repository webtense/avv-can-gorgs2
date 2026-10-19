const CHANGELOG = [
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
