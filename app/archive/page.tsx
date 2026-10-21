'use client';

import { useMemo, useState } from 'react';
import ArchiveFilters from '@/components/archive/ArchiveFilters';
import ArchiveList from '@/components/archive/ArchiveList';
import Pagination from '@/components/common/Pagination';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { ArchiveItem, ArchiveItemType } from '@/lib/types';

const PAGE_SIZE = 12;

// Dades d'exemple fins que l'Oleada 5 connecti aquesta pàgina a /api/archive.
const ALL_ITEMS: ArchiveItem[] = [];

export default function ArchivePage() {
  const [type, setType] = useState<ArchiveItemType | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return ALL_ITEMS.filter((item) => {
      if (type && item.type !== type) return false;
      if (tags.length > 0 && !tags.every((tag) => item.tags.includes(tag))) {
        return false;
      }
      if (query) {
        const needle = query.toLowerCase();
        const haystack = `${item.title} ${item.description ?? ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [type, tags, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilter(next: {
    type?: ArchiveItemType;
    tags: string[];
    query?: string;
  }) {
    setType(next.type);
    setTags(next.tags);
    if (next.query !== undefined) setQuery(next.query);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
        Arxiu
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Explora fotografies, documents, vídeos i esdeveniments històrics de
        Can Gorgs II. Filtra per tipus, etiquetes o data per trobar el que
        busques.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[18rem_1fr]">
        <ArchiveFilters
          selectedType={type}
          selectedTags={tags}
          onFilter={handleFilter}
        />

        <div>
          <ErrorBoundary>
            <ArchiveList items={pageItems} />
          </ErrorBoundary>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
