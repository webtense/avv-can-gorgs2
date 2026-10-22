'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ArchiveFilters from '@/components/archive/ArchiveFilters';
import ArchiveList from '@/components/archive/ArchiveList';
import Pagination from '@/components/common/Pagination';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { ArchiveItemType } from '@/lib/types';
import { useArchiveList } from '@/hooks/useArchive';

const PAGE_SIZE = 12;

export default function ArchivePage() {
  return (
    <Suspense fallback={null}>
      <ArchivePageContent />
    </Suspense>
  );
}

function ArchivePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const type = (searchParams.get('type') ?? undefined) as ArchiveItemType | undefined;
  const tag = searchParams.get('tag') ?? undefined;
  const query = searchParams.get('q') ?? '';

  const { items, total, hasMore, loading, error } = useArchiveList({
    page,
    limit: PAGE_SIZE,
    search: query || undefined,
    type,
    tag,
  });

  const selectedTags = useMemo(() => (tag ? [tag] : []), [tag]);

  const updateParams = useCallback(
    (next: { page?: number; type?: string; tag?: string; q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next.page !== undefined) {
        if (next.page > 1) params.set('page', String(next.page));
        else params.delete('page');
      }
      if ('type' in next) {
        if (next.type) params.set('type', next.type);
        else params.delete('type');
      }
      if ('tag' in next) {
        if (next.tag) params.set('tag', next.tag);
        else params.delete('tag');
      }
      if ('q' in next) {
        if (next.q) params.set('q', next.q);
        else params.delete('q');
      }

      const qs = params.toString();
      router.push(qs ? `/archive?${qs}` : '/archive');
    },
    [router, searchParams]
  );

  function handleFilter(next: {
    type?: ArchiveItemType;
    tags: string[];
    query?: string;
  }) {
    updateParams({
      page: 1,
      type: next.type,
      tag: next.tags[0],
      q: next.query !== undefined ? next.query : query,
    });
  }

  function handlePageChange(nextPage: number) {
    updateParams({ page: nextPage });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
          selectedTags={selectedTags}
          onFilter={handleFilter}
        />

        <div>
          <ErrorBoundary>
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
                <p className="font-serif text-lg text-red-700">
                  No s&apos;ha pogut carregar l&apos;arxiu
                </p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
            ) : (
              <ArchiveList items={items} loading={loading} />
            )}
          </ErrorBoundary>
          {!error && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
