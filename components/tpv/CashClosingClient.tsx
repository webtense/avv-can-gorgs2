'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/I18nProvider';
import { formatCents } from '@/lib/tpv';
import { withBasePath } from '@/lib/basePath';

export default function CashClosingClient({
  openedAt,
  openingFloatCents,
  expectedCents,
}: {
  openedAt: string;
  openingFloatCents: number;
  expectedCents: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [countedInput, setCountedInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ countedCents: number; differenceCents: number } | null>(null);

  const countedCents = useMemo(() => {
    const euros = Number(countedInput.replace(',', '.'));
    if (!Number.isFinite(euros) || euros < 0) return null;
    return Math.round(euros * 100);
  }, [countedInput]);

  async function handleClose() {
    if (countedCents === null) {
      setError(t('tpv.closing.error'));
      return;
    }
    if (!window.confirm(t('tpv.closing.confirmClose'))) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(withBasePath('/api/tpv/session/close'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countedCents }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('tpv.closing.error'));
        return;
      }
      setResult({
        countedCents: data.session.counted_cents,
        differenceCents: data.session.difference_cents,
      });
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-sm px-4 py-10 text-center">
        <h1 className="font-serif text-2xl font-bold text-slate-900">{t('tpv.closing.closedTitle')}</h1>
        <div className="mt-6 space-y-2 text-left">
          <div className="flex justify-between">
            <span>{t('tpv.closing.expected')}</span>
            <span className="font-medium">{formatCents(expectedCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('tpv.closing.countedLabel')}</span>
            <span className="font-medium">{formatCents(result.countedCents)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <span>{t('tpv.closing.difference')}</span>
            <span
              className={`font-bold ${result.differenceCents === 0 ? 'text-emerald-700' : 'text-red-600'}`}
            >
              {formatCents(result.differenceCents)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push('/tpv')}
          className="mt-8 w-full rounded-md bg-primary py-3 text-base font-semibold text-white"
          style={{ minHeight: 48 }}
        >
          {t('tpv.closing.goToSale')}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t('tpv.closing.title')}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {t('tpv.closing.openedAt')}: {new Date(openedAt).toLocaleString('ca-ES')}
      </p>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between">
          <span>{t('tpv.closing.openingFloat')}</span>
          <span className="font-medium">{formatCents(openingFloatCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('tpv.closing.expected')}</span>
          <span className="font-medium">{formatCents(expectedCents)}</span>
        </div>
      </div>

      <label htmlFor="counted" className="mt-6 block text-sm font-medium text-slate-700">
        {t('tpv.closing.countedLabel')}
      </label>
      <input
        id="counted"
        type="text"
        inputMode="decimal"
        value={countedInput}
        onChange={(e) => setCountedInput(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3 text-xl"
        placeholder="0,00"
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={loading || countedCents === null}
        onClick={handleClose}
        className="mt-6 w-full rounded-md bg-red-600 py-3 text-base font-semibold text-white disabled:opacity-40"
        style={{ minHeight: 48 }}
      >
        {t('tpv.closing.close')}
      </button>
    </div>
  );
}
