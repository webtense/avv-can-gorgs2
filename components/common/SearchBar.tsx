'use client';

import { FormEvent, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  initialQuery = '',
  placeholder,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const { t } = useI18n();
  const resolvedPlaceholder = placeholder ?? t('searchBar.placeholder');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(query.trim());
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex w-full items-stretch gap-2"
    >
      <label htmlFor="archive-search" className="sr-only">
        {t('searchBar.label')}
      </label>
      <input
        id="archive-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={resolvedPlaceholder}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent-search focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-accent-search px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-search-dark transition-colors"
      >
        <span className="hidden sm:inline">{t('searchBar.button')}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 sm:hidden"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <span className="sr-only sm:hidden">{t('searchBar.button')}</span>
      </button>
    </form>
  );
}
