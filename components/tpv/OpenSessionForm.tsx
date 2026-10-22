'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/I18nProvider';

interface BarEventOption {
  id: string;
  title: string;
  eventDate: string | null;
}

/** Pantalla per obrir un nou torn de caixa quan no n'hi ha cap d'obert. */
export default function OpenSessionForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [eventId, setEventId] = useState('');
  const [barEvents, setBarEvents] = useState<BarEventOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/tpv/bar-events/active')
      .then((res) => (res.ok ? res.json() : { events: [] }))
      .then((data) => setBarEvents(data.events || []))
      .catch(() => setBarEvents([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const euros = Number(amount.replace(',', '.'));
    if (!Number.isFinite(euros) || euros < 0) {
      setError(t('tpv.openSession.error'));
      return;
    }
    const openingFloatCents = Math.round(euros * 100);

    setLoading(true);
    try {
      const res = await fetch('/api/tpv/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingFloatCents, eventId: eventId || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t('tpv.openSession.error'));
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t('tpv.openSession.title')}</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="float" className="block text-sm font-medium text-slate-700">
            {t('tpv.openSession.floatLabel')}
          </label>
          <input
            id="float"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3 text-lg"
            placeholder="0,00"
          />
        </div>
        <div>
          <label htmlFor="barEvent" className="block text-sm font-medium text-slate-700">
            {t('tpv.openSession.eventLabel')}
          </label>
          <select
            id="barEvent"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3 text-base"
          >
            <option value="">{t('tpv.openSession.eventNone')}</option>
            {barEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
                {ev.eventDate ? ` (${new Date(ev.eventDate).toLocaleDateString('ca-ES')})` : ''}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-3 text-base font-medium text-white disabled:opacity-60"
          style={{ minHeight: 48 }}
        >
          {t('tpv.openSession.submit')}
        </button>
      </form>
    </div>
  );
}
