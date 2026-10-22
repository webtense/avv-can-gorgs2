'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/I18nProvider';

export default function FeeConfigForm({ initialAmountCents }: { initialAmountCents: number | null }) {
  const router = useRouter();
  const { t } = useI18n();
  const [value, setValue] = useState(initialAmountCents !== null ? (initialAmountCents / 100).toString() : '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const feeAmountCents = value.trim() === '' ? null : Math.round(Number(value.replace(',', '.')) * 100);
      const res = await fetch('/api/admin/comptabilitat/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeAmountCents }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t('admin.comptabilitat.config.saveError'));
        return;
      }
      setMessage(t('admin.comptabilitat.config.saved'));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-slate-200 p-4">
      <h2 className="font-serif text-lg font-semibold text-slate-900">{t('admin.comptabilitat.config.title')}</h2>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm">
          {t('admin.comptabilitat.config.feeAmount')}
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('admin.comptabilitat.config.feeAmountEmpty')}
            className="mt-1 w-48 rounded-md border border-slate-300 px-2 py-1"
          />
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={save}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {t('admin.comptabilitat.config.save')}
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
