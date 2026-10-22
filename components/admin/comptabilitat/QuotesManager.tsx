'use client';

import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';

interface Fee {
  id: string;
  period: string;
  amount_cents: number;
  status: string;
  paid_at: string | null;
  method: string | null;
  receipt_number: string | null;
  members: { id: string; name: string; email: string };
}

const currentYear = new Date().getFullYear();

export default function QuotesManager() {
  const { t } = useI18n();
  const [fees, setFees] = useState<Fee[]>([]);
  const [period, setPeriod] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [genPeriod, setGenPeriod] = useState(String(currentYear));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (period) params.set('period', period);
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    const res = await fetch(`/api/admin/comptabilitat/quotes?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setFees(data.fees);
    }
  }, [period, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function generate() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/comptabilitat/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: genPeriod }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('admin.comptabilitat.quotes.generateError'));
        return;
      }
      setMessage(t('admin.comptabilitat.quotes.generateSuccess', { count: data.created }));
      load();
    } finally {
      setLoading(false);
    }
  }

  async function markPaid(id: string) {
    const method = window.prompt(
      `${t('admin.comptabilitat.quotes.methodEfectiu')} / ${t(
        'admin.comptabilitat.quotes.methodTransferencia'
      )} / ${t('admin.comptabilitat.quotes.methodAltre')}`,
      'transferencia'
    );
    if (!method || !['efectiu', 'transferencia', 'altre'].includes(method)) return;
    const receiptNumber = window.prompt(t('admin.comptabilitat.quotes.receiptNumber')) || undefined;
    const res = await fetch(`/api/admin/comptabilitat/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pagar', method, receiptNumber }),
    });
    if (res.ok) load();
    else setError(t('admin.comptabilitat.quotes.actionError'));
  }

  async function revert(id: string) {
    const reason = window.prompt(t('admin.comptabilitat.quotes.revertReasonPrompt'));
    if (!reason) return;
    const res = await fetch(`/api/admin/comptabilitat/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revertir', reason }),
    });
    if (res.ok) load();
    else setError(t('admin.comptabilitat.quotes.actionError'));
  }

  function exportUrl(): string {
    const params = new URLSearchParams();
    if (period) params.set('period', period);
    if (status) params.set('status', status);
    return `/api/admin/comptabilitat/quotes/export?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t('admin.comptabilitat.quotes.title')}</h1>

      <div className="mt-4 rounded-md border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">{t('admin.comptabilitat.quotes.generateTitle')}</h2>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm">
            {t('admin.comptabilitat.quotes.periodLabel')}
            <input
              type="text"
              value={genPeriod}
              onChange={(e) => setGenPeriod(e.target.value)}
              className="mt-1 w-28 rounded-md border border-slate-300 px-2 py-1"
            />
          </label>
          <button
            type="button"
            disabled={loading}
            onClick={generate}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {t('admin.comptabilitat.quotes.generate')}
          </button>
        </div>
        {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm">
          {t('admin.comptabilitat.quotes.filterPeriod')}
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="mt-1 w-28 rounded-md border border-slate-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-sm">
          {t('admin.comptabilitat.quotes.filterStatus')}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1"
          >
            <option value="">{t('admin.comptabilitat.quotes.allStatuses')}</option>
            <option value="pendent">{t('admin.comptabilitat.quotes.statusPending')}</option>
            <option value="pagada">{t('admin.comptabilitat.quotes.statusPaid')}</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          {t('admin.comptabilitat.quotes.filterSearch')}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1"
          />
        </label>
        <a href={exportUrl()} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
          {t('admin.comptabilitat.quotes.exportCsv')}
        </a>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-4">{t('admin.comptabilitat.quotes.colMember')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.quotes.colPeriod')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.quotes.colAmount')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.quotes.colStatus')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.quotes.colPaidAt')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.quotes.colMethod')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.quotes.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fees.map((f) => (
              <tr key={f.id}>
                <td className="py-2 pr-4">
                  {f.members.name}
                  <div className="text-xs text-slate-400">{f.members.email}</div>
                </td>
                <td className="py-2 pr-4">{f.period}</td>
                <td className="py-2 pr-4">{(f.amount_cents / 100).toFixed(2)} €</td>
                <td className="py-2 pr-4">
                  {f.status === 'pagada'
                    ? t('admin.comptabilitat.quotes.statusPaid')
                    : t('admin.comptabilitat.quotes.statusPending')}
                </td>
                <td className="py-2 pr-4">{f.paid_at ? new Date(f.paid_at).toLocaleDateString() : '—'}</td>
                <td className="py-2 pr-4">{f.method || '—'}</td>
                <td className="py-2 pr-4">
                  {f.status === 'pendent' ? (
                    <button
                      type="button"
                      onClick={() => markPaid(f.id)}
                      className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      {t('admin.comptabilitat.quotes.markPaid')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => revert(f.id)}
                      className="rounded-md bg-slate-500 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
                    >
                      {t('admin.comptabilitat.quotes.revert')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
