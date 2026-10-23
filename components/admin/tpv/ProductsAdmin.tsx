'use client';

import { useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { withBasePath } from '@/lib/basePath';

interface Product {
  id: string;
  name: string;
  category: string | null;
  priceCents: number | null;
  costCents: number | null;
  active: boolean;
  sort: number;
}

/** Fila editable d'un producte del catàleg del TPV. */
function ProductRow({
  product,
  stock,
  onSaved,
  onDeleted,
}: {
  product: Product;
  stock: number | undefined;
  onSaved: (p: Product) => void;
  onDeleted: (id: string) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category ?? '');
  const [priceInput, setPriceInput] = useState(
    product.priceCents !== null ? (product.priceCents / 100).toFixed(2).replace('.', ',') : ''
  );
  const [costInput, setCostInput] = useState(
    product.costCents !== null ? (product.costCents / 100).toFixed(2).replace('.', ',') : ''
  );
  const [active, setActive] = useState(product.active);
  const [sort, setSort] = useState(String(product.sort));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const euros = priceInput.trim() ? Number(priceInput.replace(',', '.')) : null;
      const priceCents = euros === null ? null : Math.round(euros * 100);
      const costEuros = costInput.trim() ? Number(costInput.replace(',', '.')) : null;
      const costCents = costEuros === null ? null : Math.round(costEuros * 100);

      if (active && priceCents === null) {
        setError(t('admin.tpv.priceRequiredToActivate'));
        return;
      }

      const res = await fetch(withBasePath(`/api/tpv/products/${product.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category: category || null,
          priceCents,
          costCents,
          active,
          sort: Number(sort) || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('admin.tpv.saveError'));
        return;
      }
      onSaved({
        id: data.product.id,
        name: data.product.name,
        category: data.product.category,
        priceCents: data.product.price_cents,
        costCents: data.product.cost_cents,
        active: data.product.active,
        sort: data.product.sort,
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(t('admin.tpv.delete') + '?')) return;
    const res = await fetch(withBasePath(`/api/tpv/products/${product.id}`), { method: 'DELETE' });
    if (res.ok) onDeleted(product.id);
  }

  return (
    <tr className="align-top">
      <td className="py-2 pr-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          placeholder={t('admin.tpv.noPrice')}
          inputMode="decimal"
          className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          value={costInput}
          onChange={(e) => setCostInput(e.target.value)}
          placeholder={t('admin.tpv.noCost')}
          inputMode="decimal"
          className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="py-2 pr-2 text-center text-sm tabular-nums">{stock ?? 0}</td>
      <td className="py-2 pr-2 text-center">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-5 w-5"
        />
      </td>
      <td className="py-2 pr-2">
        <input
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          inputMode="numeric"
          className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="py-2 pr-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
          >
            {saving ? t('admin.tpv.saving') : t('admin.tpv.save')}
          </button>
          <button
            type="button"
            onClick={remove}
            className="rounded-md bg-red-500 px-2 py-1 text-xs font-medium text-white"
          >
            {t('admin.tpv.delete')}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </td>
    </tr>
  );
}

export default function ProductsAdmin({
  initialProducts,
  stockByProductId,
}: {
  initialProducts: Product[];
  stockByProductId: Record<string, number>;
}) {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  async function createProduct() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(withBasePath('/api/tpv/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setProducts((prev) => [
          ...prev,
          {
            id: data.product.id,
            name: data.product.name,
            category: data.product.category,
            priceCents: data.product.price_cents,
            costCents: data.product.cost_cents,
            active: data.product.active,
            sort: data.product.sort,
          },
        ]);
        setNewName('');
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-slate-900">{t('admin.tpv.productsTitle')}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-2">{t('admin.tpv.colName')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.colCategory')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.colPrice')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.colCost')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.colStock')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.colActive')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.colSort')}</th>
              <th className="py-2 pr-2">{t('admin.tpv.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                stock={stockByProductId[p.id]}
                onSaved={(updated) =>
                  setProducts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                }
                onDeleted={(id) => setProducts((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('admin.tpv.newProduct')}
          className="rounded border border-slate-300 px-2 py-2 text-sm"
        />
        <button
          type="button"
          disabled={creating || !newName.trim()}
          onClick={createProduct}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {t('admin.tpv.newProduct')}
        </button>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        {products.filter((p) => p.priceCents !== null).length} / {products.length}{' '}
        {t('admin.tpv.colPrice').toLowerCase()}
      </p>
    </div>
  );
}
