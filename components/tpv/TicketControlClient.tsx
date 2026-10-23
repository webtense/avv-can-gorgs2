'use client';

import { useState, FormEvent } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { withBasePath } from '@/lib/basePath';

type Result =
  | { status: 'valid'; checkedInAt: string }
  | { status: 'already_used'; checkedInAt: string }
  | { status: 'error'; message: string };

export default function TicketControlClient() {
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(withBasePath(`/api/tiquets/${encodeURIComponent(trimmed)}/check`), {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ status: 'error', message: data.error || t('tpvControl.genericError') });
        return;
      }
      setResult(data);
    } catch {
      setResult({ status: 'error', message: t('tpvControl.connectionError') });
    } finally {
      setLoading(false);
      setCode('');
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t('tpvControl.title')}</h1>
      <p className="mt-2 text-sm text-slate-600">{t('tpvControl.intro')}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="ticket-code" className="block text-sm font-medium text-slate-700">
            {t('tpvControl.codeLabel')}
          </label>
          <input
            id="ticket-code"
            type="text"
            autoFocus
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3 text-lg uppercase tracking-widest"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full rounded-md bg-primary px-4 py-3 text-base font-medium text-white disabled:opacity-60"
          style={{ minHeight: 48 }}
        >
          {loading ? t('tpvControl.submitting') : t('tpvControl.submit')}
        </button>
      </form>

      {result && (
        <div
          role="status"
          className={`mt-6 rounded-md px-4 py-3 text-center text-lg font-semibold ${
            result.status === 'valid'
              ? 'bg-emerald-50 text-emerald-700'
              : result.status === 'already_used'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
          }`}
        >
          {result.status === 'valid' && t('tpvControl.valid')}
          {result.status === 'already_used' && (
            <>
              <div>{t('tpvControl.alreadyUsed')}</div>
              <div className="mt-1 text-sm font-normal">
                {t('tpvControl.alreadyUsedAt').replace(
                  '{date}',
                  new Date(result.checkedInAt).toLocaleString('ca-ES')
                )}
              </div>
            </>
          )}
          {result.status === 'error' && result.message}
        </div>
      )}
    </div>
  );
}
