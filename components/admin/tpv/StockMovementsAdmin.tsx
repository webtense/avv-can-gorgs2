'use client';

import { useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { withBasePath } from '@/lib/basePath';

interface Product {
  id: string;
  name: string;
}

interface AgendaEvent {
  id: string;
  title: string;
}

/**
 * Formulari per registrar entrades/sortides manuals d'estoc des de
 * /admin/tpv. Les vendes i els regals generen els seus propis moviments
 * automàticament; aquest formulari és només per a ajustos manuals (compres,
 * trencaments, inventari).
 */
export default function StockMovementsAdmin({
  products,
  events,
  onRegistered,
}: {
  products: Product[];
  events: AgendaEvent[];
  onRegistered?: (productId: string) => void;
}) {
  const { t } = useI18n();
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<'entrada' | 'salida'>('entrada');
  const [qty, setQty] = useState('');
  const [eventId, setEventId] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register(confirmNegative = false) {
    setError(null);
    const qtyNumber = Number(qty);
    if (!productId || !Number.isInteger(qtyNumber) || qtyNumber < 1) {
      setError(t('admin.tpv.stockMovements.error'));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(withBasePath('/api/tpv/stock-movements'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          type,
          qty: qtyNumber,
          eventId: eventId || undefined,
          note: note || undefined,
          confirmNegative,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && !confirmNegative) {
        if (window.confirm(t('admin.tpv.stockMovements.confirmNegative'))) {
          await register(true);
        }
        return;
      }
      if (!res.ok) {
        setError(data.error || t('admin.tpv.stockMovements.error'));
        return;
      }
      setQty('');
      setNote('');
      onRegistered?.(productId);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-slate-900">{t('admin.tpv.stockMovements.title')}</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="block text-sm font-medium text-slate-700">{t('admin.tpv.stockMovements.product')}</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
          <label className="block text-sm font-medium text-slate-700">{t('admin.tpv.stockMovements.type')}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'entrada' | 'salida')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="entrada">{t('admin.tpv.stockMovements.typeEntrada')}</option>
            <option value="salida">{t('admin.tpv.stockMovements.typeSalida')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t('admin.tpv.stockMovements.qty')}</label>
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t('admin.tpv.stockMovements.event')}</label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">{t('admin.tpv.stockMovements.eventNone')}</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{t('admin.tpv.stockMovements.note')}</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('admin.tpv.stockMovements.notePlaceholder')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        disabled={saving}
        onClick={() => register(false)}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? t('admin.tpv.stockMovements.registering') : t('admin.tpv.stockMovements.register')}
      </button>
    </div>
  );
}
