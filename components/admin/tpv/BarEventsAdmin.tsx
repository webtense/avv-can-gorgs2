'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import BarEventReport from './BarEventReport';

interface Product {
  id: string;
  name: string;
  category: string | null;
  priceCents: number | null;
}

interface AgendaEvent {
  id: string;
  title: string;
  eventDate: string | null;
}

interface BarEvent {
  id: string;
  title: string;
  eventDate: string | null;
  productCount: number;
}

/** Administració dels "actes de barra" del TPV: alta i informe final. */
export default function BarEventsAdmin({ products }: { products: Product[] }) {
  const { t } = useI18n();
  const [barEvents, setBarEvents] = useState<BarEvent[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AgendaEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportEventId, setReportEventId] = useState<string | null>(null);

  function reloadBarEvents() {
    setLoadingList(true);
    fetch('/api/tpv/bar-events')
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => setBarEvents(data.events || []))
      .finally(() => setLoadingList(false));
  }

  useEffect(reloadBarEvents, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      fetch(`/api/tpv/bar-events/search?q=${encodeURIComponent(query)}`)
        .then((res) => (res.ok ? res.json() : { events: [] }))
        .then((data) => setSearchResults(data.events || []));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  function toggleProduct(id: string) {
    setSelectedProducts((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleSave() {
    setError(null);
    const productIds = Object.keys(selectedProducts).filter((id) => selectedProducts[id]);
    if (productIds.length === 0) {
      setError(t('admin.tpv.barEvents.selectAtLeastOne'));
      return;
    }
    if (!selectedEventId && !newTitle.trim()) {
      setError(t('admin.tpv.barEvents.titleRequired'));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/tpv/bar-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId || undefined,
          newEvent: selectedEventId ? undefined : { title: newTitle.trim(), eventDate: newDate || undefined },
          products: productIds.map((id) => {
            const raw = overrides[id]?.trim();
            const priceCentsOverride = raw ? Math.round(Number(raw.replace(',', '.')) * 100) : null;
            return { productId: id, priceCentsOverride };
          }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('admin.tpv.barEvents.saveError'));
        return;
      }
      setSelectedEventId('');
      setNewTitle('');
      setNewDate('');
      setSelectedProducts({});
      setOverrides({});
      setQuery('');
      reloadBarEvents();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-slate-900">{t('admin.tpv.barEvents.title')}</h2>

      <div className="mt-4 rounded-lg border border-slate-200 p-4">
        <h3 className="font-medium text-slate-900">{t('admin.tpv.barEvents.newTitle')}</h3>

        <div className="mt-3">
          <label className="block text-sm font-medium text-slate-700">{t('admin.tpv.barEvents.searchExisting')}</label>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedEventId('');
            }}
            placeholder={t('admin.tpv.barEvents.searchPlaceholder')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {searchResults.length > 0 && !selectedEventId && (
            <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200">
              {searchResults.map((ev) => (
                <li
                  key={ev.id}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-50"
                  onClick={() => {
                    setSelectedEventId(ev.id);
                    setQuery(ev.title);
                    setSearchResults([]);
                  }}
                >
                  {ev.title}
                  {ev.eventDate ? ` (${new Date(ev.eventDate).toLocaleDateString('ca-ES')})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>

        {!selectedEventId && (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('admin.tpv.barEvents.newEventTitle')}</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('admin.tpv.barEvents.newEventTitlePlaceholder')}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">{t('admin.tpv.barEvents.newEventDate')}</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="text-sm font-medium text-slate-700">{t('admin.tpv.barEvents.products')}</p>
          <ul className="mt-2 space-y-2">
            {products.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded border border-slate-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(selectedProducts[p.id])}
                  onChange={() => toggleProduct(p.id)}
                  className="h-5 w-5"
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {p.name}
                  {p.priceCents !== null && (
                    <span className="ml-2 text-xs text-slate-400">
                      ({t('admin.tpv.barEvents.catalogPrice')}: {(p.priceCents / 100).toFixed(2).replace('.', ',')} €)
                    </span>
                  )}
                </span>
                {selectedProducts[p.id] && (
                  <input
                    value={overrides[p.id] ?? ''}
                    onChange={(e) => setOverrides((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder={t('admin.tpv.barEvents.overridePlaceholder')}
                    inputMode="decimal"
                    className="w-28 rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                )}
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? t('admin.tpv.saving') : t('admin.tpv.barEvents.save')}
        </button>
      </div>

      <div className="mt-6">
        <h3 className="font-medium text-slate-900">{t('admin.tpv.barEvents.listTitle')}</h3>
        {loadingList ? (
          <p className="mt-2 text-sm text-slate-400">…</p>
        ) : barEvents.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t('admin.tpv.barEvents.empty')}</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {barEvents.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {ev.title}
                  {ev.eventDate ? ` (${new Date(ev.eventDate).toLocaleDateString('ca-ES')})` : ''} ·{' '}
                  {ev.productCount} {t('admin.tpv.barEvents.products').toLowerCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setReportEventId(ev.id)}
                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium"
                >
                  {t('admin.tpv.barEvents.viewReport')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {reportEventId && <BarEventReport eventId={reportEventId} onClose={() => setReportEventId(null)} />}
    </div>
  );
}
