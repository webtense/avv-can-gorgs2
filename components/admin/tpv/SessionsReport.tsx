'use client';

import { Fragment, useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { formatCents } from '@/lib/tpv';
import { withBasePath } from '@/lib/basePath';

interface SessionRow {
  id: string;
  operatorName: string;
  openedAt: string;
  closedAt: string | null;
  ticketCount: number;
  totalCents: number;
  differenceCents: number | null;
}

interface SaleLine {
  name: string;
  qty: number;
  line_total_cents: number;
}

interface Sale {
  id: string;
  created_at: string;
  total_cents: number;
  voided: boolean;
  lines: SaleLine[];
}

function SessionSales({ sessionId, onChanged }: { sessionId: string; onChanged: () => void }) {
  const { t } = useI18n();
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(withBasePath(`/api/tpv/sessions/${sessionId}/sales`))
      .then((res) => res.json())
      .then((data) => setSales(data.sales || []))
      .finally(() => setLoading(false));
  }, [sessionId]);

  async function voidSale(id: string) {
    if (!window.confirm(t('admin.tpv.voidConfirm'))) return;
    const res = await fetch(withBasePath(`/api/tpv/sale/${id}/void`), { method: 'POST' });
    if (res.ok) {
      setSales((prev) => prev?.map((s) => (s.id === id ? { ...s, voided: true } : s)) ?? null);
      onChanged();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || t('admin.tpv.voidError'));
    }
  }

  if (loading) return <p className="py-2 text-xs text-slate-400">…</p>;
  if (!sales || sales.length === 0) return <p className="py-2 text-xs text-slate-400">—</p>;

  return (
    <div className="space-y-2 py-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      {sales.map((sale) => (
        <div
          key={sale.id}
          className={`flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-xs ${
            sale.voided ? 'opacity-50' : ''
          }`}
        >
          <div>
            <p className="font-medium">
              #{sale.id.slice(0, 8)} · {formatCents(sale.total_cents)}
              {sale.voided ? ' · ANUL·LADA' : ''}
            </p>
            <p className="text-slate-500">
              {sale.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}
            </p>
          </div>
          {!sale.voided && (
            <button
              type="button"
              onClick={() => voidSale(sale.id)}
              className="rounded bg-red-500 px-2 py-1 font-medium text-white"
            >
              {t('admin.tpv.voidSale')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SessionsReport({ sessions }: { sessions: SessionRow[] }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-slate-900">{t('admin.tpv.sessionsTitle')}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-2">{t('admin.tpv.colOperator')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.colOpenedAt')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.colClosedAt')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.colTickets')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.colTotal')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.colDifference')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <Fragment key={s.id}>
                <tr
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                >
                  <td className="py-2 pr-2">{s.operatorName}</td>
                  <td className="py-2 pr-2">{new Date(s.openedAt).toLocaleString('ca-ES')}</td>
                  <td className="py-2 pr-2">
                    {s.closedAt ? new Date(s.closedAt).toLocaleString('ca-ES') : t('admin.tpv.open')}
                  </td>
                  <td className="py-2 pr-2">{s.ticketCount}</td>
                  <td className="py-2 pr-2">{formatCents(s.totalCents)}</td>
                  <td className="py-2 pr-2">
                    {s.differenceCents !== null ? (
                      <span className={s.differenceCents === 0 ? 'text-emerald-700' : 'text-red-600'}>
                        {formatCents(s.differenceCents)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
                {expanded === s.id && (
                  <tr>
                    <td colSpan={6}>
                      <SessionSales sessionId={s.id} onChanged={() => setRefreshKey((k) => k + 1)} key={refreshKey} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
