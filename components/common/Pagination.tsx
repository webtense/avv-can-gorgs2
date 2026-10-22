'use client';

import { useI18n } from '@/components/i18n/I18nProvider';

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
  const { t } = useI18n();
  if (totalPages <= 1) return null;

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <nav
      aria-label={t('pagination.nav')}
      className="flex items-center justify-center gap-4 py-6"
    >
      <button
        type="button"
        onClick={() => canGoPrev && onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        aria-label={t('pagination.prevAria')}
        className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span aria-hidden="true">&larr;</span>
        <span className="ml-1 hidden sm:inline">{t('pagination.previous')}</span>
      </button>

      <span className="text-sm font-medium text-slate-600" aria-live="polite">
        {t('pagination.pageOf', { current: currentPage, total: totalPages })}
      </span>

      <button
        type="button"
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        aria-label={t('pagination.nextAria')}
        className="inline-flex items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="mr-1 hidden sm:inline">{t('pagination.next')}</span>
        <span aria-hidden="true">&rarr;</span>
      </button>
    </nav>
  );
}
