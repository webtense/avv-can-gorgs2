'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { formatCents, QUICK_CASH_AMOUNTS_CENTS } from '@/lib/tpv';
import PaymentModal from './PaymentModal';
import Receipt from './Receipt';

export interface TpvProduct {
  id: string;
  name: string;
  category: string | null;
  priceCents: number;
}

interface CartEntry {
  product: TpvProduct;
  qty: number;
}

interface CompletedSale {
  id: string;
  createdAt: string;
  totalCents: number;
  paidCents: number;
  changeCents: number;
  operatorName: string;
  lines: Array<{ name: string; unitPriceCents: number; qty: number; lineTotalCents: number }>;
}

export default function TpvClient({
  operatorName,
  products,
}: {
  operatorName: string;
  products: TpvProduct[];
}) {
  const { t } = useI18n();
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [showPayment, setShowPayment] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);

  const cartEntries = useMemo(() => Object.values(cart), [cart]);
  const totalCents = cartEntries.reduce((sum, e) => sum + e.product.priceCents * e.qty, 0);

  function addToCart(product: TpvProduct) {
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: { product, qty: (existing?.qty ?? 0) + 1 },
      };
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const qty = existing.qty + delta;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: { ...existing, qty } };
    });
  }

  function handleSaleComplete(sale: CompletedSale) {
    setCompletedSale(sale);
    setCart({});
    setShowPayment(false);
  }

  if (completedSale) {
    return <Receipt sale={completedSale} onNewSale={() => setCompletedSale(null)} />;
  }

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <h1 className="font-serif text-2xl font-bold text-slate-900">{t('admin.tpv.title')}</h1>
        <p className="mt-4 text-slate-700">{t('tpv.sale.noActiveProducts')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
      <div className="flex-1">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="font-serif text-xl font-bold text-slate-900">{t('admin.tpv.title')}</h1>
          <a href="/tpv/caixa" className="text-sm text-primary underline">
            {t('tpv.closing.title')}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addToCart(product)}
              className="flex min-h-[72px] flex-col items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-4 text-center shadow-sm active:bg-slate-100"
            >
              <span className="font-medium text-slate-900">{product.name}</span>
              <span className="mt-1 text-sm text-slate-500">{formatCents(product.priceCents)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full shrink-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:w-80">
        <h2 className="font-serif text-lg font-bold text-slate-900">{t('tpv.sale.cart')}</h2>
        {cartEntries.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t('tpv.sale.empty')}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {cartEntries.map(({ product, qty }) => (
              <li key={product.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{formatCents(product.priceCents * qty)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="-"
                    onClick={() => changeQty(product.id, -1)}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-lg font-bold"
                  >
                    −
                  </button>
                  <span className="w-6 text-center">{qty}</span>
                  <button
                    type="button"
                    aria-label="+"
                    onClick={() => changeQty(product.id, 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="font-medium text-slate-700">{t('tpv.sale.total')}</span>
          <span className="text-2xl font-bold text-slate-900">{formatCents(totalCents)}</span>
        </div>

        <button
          type="button"
          disabled={cartEntries.length === 0}
          onClick={() => setShowPayment(true)}
          className="mt-4 w-full rounded-md bg-primary px-4 py-3 text-lg font-semibold text-white disabled:opacity-40"
          style={{ minHeight: 48 }}
        >
          {t('tpv.sale.checkout')}
        </button>
      </div>

      {showPayment && (
        <PaymentModal
          totalCents={totalCents}
          cartEntries={cartEntries}
          operatorName={operatorName}
          onClose={() => setShowPayment(false)}
          onComplete={handleSaleComplete}
          quickAmounts={QUICK_CASH_AMOUNTS_CENTS}
        />
      )}
    </div>
  );
}
