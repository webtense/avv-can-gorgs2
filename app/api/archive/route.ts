import { NextRequest } from 'next/server';

type ArchiveType = 'all' | 'events' | 'photos' | 'documents';

interface ArchiveItem {
  id: string;
  type: 'events' | 'photos' | 'documents';
  title: string;
  description: string | null;
  year: number | null;
}

// Placeholder in-memory dataset until the Fase 2 database connection lands.
// Shape matches the `events`, `photos` and `documents` tables from
// app/db/migrations/001_initial_schema.sql.
const MOCK_ITEMS: ArchiveItem[] = [];

function matchesSearch(item: ArchiveItem, search: string): boolean {
  const needle = search.toLowerCase();
  return (
    item.title.toLowerCase().includes(needle) ||
    (item.description ?? '').toLowerCase().includes(needle)
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const type = (searchParams.get('type') ?? 'all') as ArchiveType;
  const search = searchParams.get('search')?.trim() ?? '';
  const limitParam = Number(searchParams.get('limit') ?? '20');
  const offsetParam = Number(searchParams.get('offset') ?? '0');

  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), 100)
    : 20;
  const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0;

  const validTypes: ArchiveType[] = ['all', 'events', 'photos', 'documents'];
  if (!validTypes.includes(type)) {
    return Response.json(
      { error: `Invalid type. Expected one of: ${validTypes.join(', ')}` },
      { status: 400 }
    );
  }

  let items = MOCK_ITEMS;

  if (type !== 'all') {
    items = items.filter((item) => item.type === type);
  }

  if (search) {
    items = items.filter((item) => matchesSearch(item, search));
  }

  const total = items.length;
  const page = items.slice(offset, offset + limit);

  return Response.json({
    message: 'Archive API (Fase 2)',
    items: page,
    total,
    limit,
    offset,
  });
}
