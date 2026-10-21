'use client';

import { useId, useState } from 'react';
import { ARCHIVE_TYPE_LABELS, ArchiveItemType } from '@/lib/types';
import SearchBar from '@/components/common/SearchBar';

const ALL_TYPES: ArchiveItemType[] = ['event', 'photo', 'document', 'video'];

interface ArchiveFiltersProps {
  selectedType?: ArchiveItemType;
  selectedTags: string[];
  availableTags?: string[];
  onFilter: (filters: {
    type?: ArchiveItemType;
    tags: string[];
    dateFrom?: string;
    dateTo?: string;
    query?: string;
  }) => void;
}

export default function ArchiveFilters({
  selectedType,
  selectedTags,
  availableTags = [],
  onFilter,
}: ArchiveFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const headingId = useId();

  function handleTypeChange(type: ArchiveItemType) {
    const next = selectedType === type ? undefined : type;
    onFilter({ type: next, tags: selectedTags, dateFrom, dateTo });
  }

  function handleTagToggle(tag: string) {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onFilter({ type: selectedType, tags: next, dateFrom, dateTo });
  }

  function handleDateChange(from: string, to: string) {
    setDateFrom(from);
    setDateTo(to);
    onFilter({ type: selectedType, tags: selectedTags, dateFrom: from, dateTo: to });
  }

  function handleSearch(query: string) {
    onFilter({ type: selectedType, tags: selectedTags, dateFrom, dateTo, query });
  }

  return (
    <aside
      aria-labelledby={headingId}
      className="rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-20"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between lg:hidden"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="archive-filters-panel"
      >
        <h2 id={headingId} className="font-serif text-base text-slate-900">
          Filtres
        </h2>
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>

      <h2 id={headingId} className="hidden lg:block font-serif text-base text-slate-900">
        Filtres
      </h2>

      <div
        id="archive-filters-panel"
        className={`${expanded ? 'block' : 'hidden'} lg:block mt-4 space-y-6`}
      >
        <div>
          <SearchBar onSearch={handleSearch} />
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">Tipus</legend>
          <div className="mt-2 space-y-2">
            {ALL_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={selectedType === type}
                  onChange={() => handleTypeChange(type)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                {ARCHIVE_TYPE_LABELS[type]}
              </label>
            ))}
          </div>
        </fieldset>

        {availableTags.length > 0 && (
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">Etiquetes</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    aria-pressed={active}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="text-sm font-semibold text-slate-700">Rang de dates</legend>
          <div className="mt-2 flex flex-col gap-2">
            <label className="text-xs text-slate-500">
              Des de
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => handleDateChange(event.target.value, dateTo)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs text-slate-500">
              Fins a
              <input
                type="date"
                value={dateTo}
                onChange={(event) => handleDateChange(dateFrom, event.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
        </fieldset>
      </div>
    </aside>
  );
}
