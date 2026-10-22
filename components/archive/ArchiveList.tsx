import { ArchiveItem } from '@/lib/types';
import ArchiveCard from './ArchiveCard';

interface ArchiveListProps {
  items: ArchiveItem[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isFiltered?: boolean;
}

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="aspect-[4/3] w-full animate-pulse bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

export default function ArchiveList({
  items,
  loading = false,
  hasMore = false,
  onLoadMore,
  isFiltered = false,
}: ArchiveListProps) {
  if (!loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="font-serif text-lg text-slate-700">
          {isFiltered ? 'No s\'han trobat resultats' : 'Encara no hi ha elements publicats'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {isFiltered
            ? 'Prova amb altres paraules clau o elimina alguns filtres.'
            : 'Aviat hi trobareu fotografies, documents i esdeveniments del barri.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy={loading}
      >
        {items.map((item) => (
          <li key={item.id}>
            <ArchiveCard
              id={item.id}
              title={item.title}
              date={item.date}
              thumbnailUrl={item.thumbnailUrl}
              tags={item.tags}
              type={item.type}
            />
          </li>
        ))}
        {loading &&
          Array.from({ length: 3 }).map((_, index) => (
            <li key={`skeleton-${index}`}>
              <SkeletonCard />
            </li>
          ))}
      </ul>

      {hasMore && !loading && onLoadMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            className="rounded-lg border border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
          >
            Carregar més
          </button>
        </div>
      )}
    </div>
  );
}
