'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';

interface Product {
  id: string;
  name: string;
}

interface BarEvent {
  id: string;
  title: string;
}

/**
 * Registre manual d'entrades i sortides d'estoc del TPV. Les vendes i regals
 * es generen automàticament des de la caixa i mai es registren des d'aquí.
 */
export default function StockMovementsAdmin({ products }: { products: Product[] }) {
  const { t } = useI18n();
  const [stockByProduct, setStockByProduct] = useState<Record<string, number>>({});
  const [barEvents, setBarEvents] = useState<BarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState('');
  const [type, setType] = useState<'entrada' | 'salida'>('entrada');
  const [qty, setQty] = useState('');
  const [eventId, setEventId] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    setLoading(true);
    Promise.all([
      fetch('/api/tpv/stock-movements').then((res) => (res.ok ? res.json() : { stockByProduct: {} })),
      fetch('/api/tpv/bar-events').then((res) => (res.ok ? res.json() : { events: [] })),
    ])
      .then(([stockData, eventsData]) => {
        setStockByProduct(stockData.stockByProduct || {});
        setBarEvents(eventsData.events || []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function submit() {
    setError(null);
    const qtyNumber = Number(qty);
    if (!productId) {
      setError(t('admin.tpv.stock.productRequired'));
      return;
    }
    if (!Number.isInteger(qtyNumber) || qtyNumber < 1) {
      setError(t('admin.tpv.stock.qtyInvalid'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/tpv/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          type,
          qty: qtyNumber,
          eventId: eventId || null,
          note: note || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('admin.tpv.stock.saveError'));
        return;
      }
      setQty('');
      setNote('');
      reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-slate-900">{t('admin.tpv.stock.title')}</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-2">{t('admin.tpv.colName')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.stock.colStock')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="py-2 pr-2">{p.name}</td>
                <td className="py-2 pr-2">{loading ? '…' : (stockByProduct[p.id] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600">{t('admin.tpv.colName')}</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="rounded border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">—</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">{t('admin.tpv.stock.type')}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'entrada' | 'salida')}
            className="rounded border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="entrada">{t('admin.tpv.stock.typeIn')}</option>
            <option value="salida">{t('admin.tpv.stock.typeOut')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">{t('admin.tpv.stock.qty')}</label>
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputMode="numeric"
            className="w-20 rounded border border-slate-300 px-2 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">{t('admin.tpv.stock.event')}</label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="rounded border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">{t('admin.tpv.stock.noEvent')}</option>
            {barEvents.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[10rem] flex-1">
          <label className="block text-xs font-medium text-slate-600">{t('admin.tpv.stock.note')}</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={submit}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? t('admin.tpv.saving') : t('admin.tpv.stock.save')}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
