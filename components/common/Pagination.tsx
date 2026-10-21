interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Paginació de l'arxiu"
      className="flex items-center justify-center gap-4 py-6"
    >
      <button
        type="button"
        onClick={() => canGoPrev && onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        aria-label="Pàgina anterior"
        className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span aria-hidden="true">&larr;</span>
        <span className="ml-1 hidden sm:inline">Anterior</span>
      </button>

      <span className="text-sm font-medium text-slate-600" aria-live="polite">
        Pàgina {currentPage} de {totalPages}
      </span>

      <button
        type="button"
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        aria-label="Pàgina següent"
        className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="mr-1 hidden sm:inline">Següent</span>
        <span aria-hidden="true">&rarr;</span>
      </button>
    </nav>
  );
}
