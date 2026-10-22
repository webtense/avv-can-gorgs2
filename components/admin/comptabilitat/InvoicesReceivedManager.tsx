'use client';

import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';

interface InvoiceRow {
  id: string;
  supplier_name: string;
  supplier_nif: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  total_cents: number;
  status: string;
}

export default function InvoicesReceivedManager() {
  const { t } = useI18n();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [status, setStatus] = useState('');
  const [supplier, setSupplier] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [supplierName, setSupplierName] = useState('');
  const [supplierNif, setSupplierNif] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [baseEuros, setBaseEuros] = useState('');
  const [vatRate, setVatRate] = useState('21');
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (supplier) params.set('supplier', supplier);
    const res = await fetch(`/api/admin/comptabilitat/invoices-received?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices);
    }
  }, [status, supplier]);

  useEffect(() => {
    load();
  }, [load]);

  const baseCents = Math.round(Number(baseEuros.replace(',', '.') || '0') * 100);
  const rate = Number(vatRate || '0');
  const vatCentsPreview = Math.round((baseCents * rate) / 100);
  const totalCentsPreview = baseCents + vatCentsPreview;

  const pendingBalanceCents = invoices
    .filter((i) => i.status === 'pendent')
    .reduce((sum, i) => sum + i.total_cents, 0);

  async function upload() {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('supplierName', supplierName);
      form.set('supplierNif', supplierNif);
      form.set('invoiceNumber', invoiceNumber);
      form.set('issueDate', issueDate);
      form.set('dueDate', dueDate);
      form.set('baseCents', String(baseCents));
      form.set('vatRatePercent', String(rate));
      form.set('file', file);

      const res = await fetch('/api/admin/comptabilitat/invoices-received', { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('admin.comptabilitat.invoicesReceived.form.saveError'));
        return;
      }
      setSupplierName('');
      setSupplierNif('');
      setInvoiceNumber('');
      setIssueDate('');
      setDueDate('');
      setBaseEuros('');
      setVatRate('21');
      setFile(null);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function markPaid(id: string) {
    const method = window.prompt('efectiu / transferencia / altre', 'transferencia');
    if (!method || !['efectiu', 'transferencia', 'altre'].includes(method)) return;
    const res = await fetch(`/api/admin/comptabilitat/invoices-received/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pagar', method }),
    });
    if (res.ok) load();
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t('admin.comptabilitat.invoicesReceived.title')}</h1>

      <p className="mt-2 text-sm text-slate-700">
        {t('admin.comptabilitat.invoicesReceived.pendingBalance')}: {(pendingBalanceCents / 100).toFixed(2)} €
      </p>

      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="mt-3 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
      >
        {t('admin.comptabilitat.invoicesReceived.newInvoice')}
      </button>

      {showForm && (
        <div className="mt-4 grid gap-3 rounded-md border border-slate-200 p-4 sm:grid-cols-2">
          <label className="flex flex-col text-sm">
            {t('admin.comptabilitat.invoicesReceived.form.supplierName')}
            <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1" />
          </label>
          <label className="flex flex-col text-sm">
            {t('admin.comptabilitat.invoicesReceived.form.supplierNif')}
            <input value={supplierNif} onChange={(e) => setSupplierNif(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1" />
          </label>
          <label className="flex flex-col text-sm">
            {t('admin.comptabilitat.invoicesReceived.form.invoiceNumber')}
            <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1" />
          </label>
          <label className="flex flex-col text-sm">
            {t('admin.comptabilitat.invoicesReceived.form.issueDate')}
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1" />
          </label>
          <label className="flex flex-col text-sm">
            {t('admin.comptabilitat.invoicesReceived.form.dueDate')}
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1" />
          </label>
          <label className="flex flex-col text-sm">
            {t('admin.comptabilitat.invoicesReceived.form.base')}
            <input type="number" step="0.01" min="0" value={baseEuros} onChange={(e) => setBaseEuros(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1" />
          </label>
          <label className="flex flex-col text-sm">
            {t('admin.comptabilitat.invoicesReceived.form.vatRate')}
            <input type="number" min="0" value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1" />
          </label>
          <p className="self-end text-sm text-slate-500">
            {t('admin.comptabilitat.invoicesReceived.form.vatComputed')}: {(vatCentsPreview / 100).toFixed(2)} € ·{' '}
            {t('admin.comptabilitat.invoicesReceived.form.totalComputed')}: {(totalCentsPreview / 100).toFixed(2)} €
          </p>
          <label className="flex flex-col text-sm sm:col-span-2">
            {t('admin.comptabilitat.invoicesReceived.form.file')}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              disabled={saving}
              onClick={upload}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? t('admin.comptabilitat.invoicesReceived.form.saving') : t('admin.comptabilitat.invoicesReceived.form.save')}
            </button>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="flex flex-col text-sm">
          {t('admin.comptabilitat.invoicesReceived.filterStatus')}
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1">
            <option value="">—</option>
            <option value="pendent">{t('admin.comptabilitat.invoicesReceived.statusPending')}</option>
            <option value="pagada">{t('admin.comptabilitat.invoicesReceived.statusPaid')}</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          {t('admin.comptabilitat.invoicesReceived.filterSupplier')}
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1" />
        </label>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesReceived.colSupplier')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesReceived.colNumber')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesReceived.colDate')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesReceived.colDueDate')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesReceived.colTotal')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesReceived.colStatus')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesReceived.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="py-2 pr-4">{inv.supplier_name}</td>
                <td className="py-2 pr-4">{inv.invoice_number}</td>
                <td className="py-2 pr-4">{new Date(inv.issue_date).toLocaleDateString()}</td>
                <td className="py-2 pr-4">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                <td className="py-2 pr-4">{(inv.total_cents / 100).toFixed(2)} €</td>
                <td className="py-2 pr-4">
                  {inv.status === 'pagada'
                    ? t('admin.comptabilitat.invoicesReceived.statusPaid')
                    : t('admin.comptabilitat.invoicesReceived.statusPending')}
                </td>
                <td className="py-2 pr-4 flex gap-2">
                  <a
                    href={`/api/admin/comptabilitat/invoices-received/${inv.id}/file`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    {t('admin.comptabilitat.invoicesReceived.viewFile')}
                  </a>
                  {inv.status === 'pendent' && (
                    <button
                      type="button"
                      onClick={() => markPaid(inv.id)}
                      className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      {t('admin.comptabilitat.invoicesReceived.markPaid')}
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
