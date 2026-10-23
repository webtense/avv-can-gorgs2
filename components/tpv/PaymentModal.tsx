'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { formatCents } from '@/lib/tpv';
import { withBasePath } from '@/lib/basePath';

interface CartEntry {
  product: { id: string; name: string; priceCents: number };
  qty: number;
  isFree: boolean;
  giftValueInput?: string;
}

export default function PaymentModal({
  totalCents,
  cartEntries,
  operatorName,
  onClose,
  onComplete,
  quickAmounts,
}: {
  totalCents: number;
  cartEntries: CartEntry[];
  operatorName: string;
  onClose: () => void;
  onComplete: (sale: {
    id: string;
    createdAt: string;
    totalCents: number;
    paidCents: number;
    changeCents: number;
    operatorName: string;
    lines: Array<{ name: string; unitPriceCents: number; qty: number; lineTotalCents: number }>;
  }) => void;
  quickAmounts: number[];
}) {
  const { t } = useI18n();
  const [paidInput, setPaidInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const giftCents = cartEntries.reduce((sum, e) => (e.isFree ? sum + e.product.priceCents * e.qty : sum), 0);

  const paidCents = useMemo(() => {
    const euros = Number(paidInput.replace(',', '.'));
    if (!Number.isFinite(euros) || euros < 0) return 0;
    return Math.round(euros * 100);
  }, [paidInput]);

  const changeCents = paidCents >= totalCents ? paidCents - totalCents : 0;
  const canConfirm = paidCents >= totalCents && !loading;

  function setQuick(cents: number) {
    setPaidInput((cents / 100).toFixed(2).replace('.', ','));
  }

  async function handleConfirm() {
    if (!canConfirm) {
      setError(t('tpv.payment.insufficientAmount'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(withBasePath('/api/tpv/sale'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartEntries.map((e) => {
            const giftValueEuros = e.isFree && e.giftValueInput?.trim() ? Number(e.giftValueInput.replace(',', '.')) : null;
            const giftValueCents =
              giftValueEuros !== null && Number.isFinite(giftValueEuros) ? Math.round(giftValueEuros * 100) : undefined;
            return { productId: e.product.id, qty: e.qty, isFree: e.isFree, giftValueCents };
          }),
          paidCents,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('tpv.payment.error'));
        return;
      }
      onComplete({
        id: data.sale.id,
        createdAt: data.sale.created_at,
        totalCents: data.sale.total_cents,
        paidCents: data.sale.paid_cents,
        changeCents: data.sale.change_cents,
        operatorName,
        lines: data.sale.lines.map((l: { name: string; unit_price_cents: number; qty: number; line_total_cents: number }) => ({
          name: l.name,
          unitPriceCents: l.unit_price_cents,
          qty: l.qty,
          lineTotalCents: l.line_total_cents,
        })),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-xl bg-white p-6 shadow-xl sm:rounded-xl">
        <h2 className="font-serif text-xl font-bold text-slate-900">{t('tpv.payment.title')}</h2>

        <div className="mt-4 flex items-center justify-between text-lg">
          <span>{t('tpv.payment.amountDue')}</span>
          <span className="font-bold">{formatCents(totalCents)}</span>
        </div>
        {giftCents > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm text-emerald-700">
            <span>{t('tpv.payment.giftValue')}</span>
            <span>{formatCents(giftCents)}</span>
          </div>
        )}

        <label htmlFor="paid" className="mt-4 block text-sm font-medium text-slate-700">
          {t('tpv.payment.amountPaid')}
        </label>
        <input
          id="paid"
          type="text"
          inputMode="decimal"
          autoFocus
          value={paidInput}
          onChange={(e) => setPaidInput(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3 text-xl"
          placeholder="0,00"
        />

        <div className="mt-3 grid grid-cols-4 gap-2">
          {quickAmounts.map((cents) => (
            <button
              key={cents}
              type="button"
              onClick={() => setQuick(cents)}
              className="rounded-md border border-slate-300 py-2 text-sm font-medium"
              style={{ minHeight: 48 }}
            >
              {formatCents(cents)}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-lg">
          <span>{t('tpv.payment.change')}</span>
          <span className="font-bold text-emerald-700">{formatCents(changeCents)}</span>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-md border border-slate-300 py-3 text-base font-medium"
            style={{ minHeight: 48 }}
          >
            {t('tpv.payment.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 rounded-md bg-primary py-3 text-base font-semibold text-white disabled:opacity-40"
            style={{ minHeight: 48 }}
          >
            {t('tpv.payment.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
