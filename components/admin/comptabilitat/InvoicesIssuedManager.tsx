'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';

interface InvoiceRow {
  id: string;
  number: string;
  issue_date: string;
  recipient_name: string;
  total_cents: number;
  status: string;
}

interface LineForm {
  description: string;
  qty: string;
  unitPriceCents: string;
  vatRatePercent: string;
}

function emptyLine(): LineForm {
  return { description: '', qty: '1', unitPriceCents: '', vatRatePercent: '21' };
}

export default function InvoicesIssuedManager() {
  const { t } = useI18n();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [recipientNif, setRecipientNif] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineForm[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin/comptabilitat/invoices-issued');
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateLine(i: number, field: keyof LineForm, value: string) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }

  async function createInvoice() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        recipientName,
        recipientNif: recipientNif || undefined,
        recipientAddress: recipientAddress || undefined,
        notes: notes || undefined,
        lines: lines.map((l) => ({
          description: l.description,
          qty: Number(l.qty),
          unitPriceCents: Math.round(Number(l.unitPriceCents.replace(',', '.')) * 100),
          vatRatePercent: Number(l.vatRatePercent),
        })),
      };
      const res = await fetch('/api/admin/comptabilitat/invoices-issued', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('admin.comptabilitat.invoicesIssued.form.saveError'));
        return;
      }
      setMessage(`${data.invoice.number}`);
      setRecipientName('');
      setRecipientNif('');
      setRecipientAddress('');
      setNotes('');
      setLines([emptyLine()]);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function cancelInvoice(id: string) {
    if (!window.confirm(t('admin.comptabilitat.invoicesIssued.cancelConfirm'))) return;
    const res = await fetch(`/api/admin/comptabilitat/invoices-issued/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'anular' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || t('admin.comptabilitat.invoicesIssued.cancelError'));
      return;
    }
    setMessage(t('admin.comptabilitat.invoicesIssued.cancelSuccess', { number: data.rectification.number }));
    load();
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t('admin.comptabilitat.invoicesIssued.title')}</h1>
      <p className="mt-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
        {t('admin.comptabilitat.invoicesIssued.draftNotice')}
      </p>

      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="mt-4 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white"
      >
        {t('admin.comptabilitat.invoicesIssued.newInvoice')}
      </button>

      {showForm && (
        <div className="mt-4 rounded-md border border-slate-200 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col text-sm">
              {t('admin.comptabilitat.invoicesIssued.form.recipientName')}
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="mt-1 rounded-md border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="flex flex-col text-sm">
              {t('admin.comptabilitat.invoicesIssued.form.recipientNif')}
              <input
                value={recipientNif}
                onChange={(e) => setRecipientNif(e.target.value)}
                className="mt-1 rounded-md border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="flex flex-col text-sm sm:col-span-2">
              {t('admin.comptabilitat.invoicesIssued.form.recipientAddress')}
              <input
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="mt-1 rounded-md border border-slate-300 px-2 py-1"
              />
            </label>
            <label className="flex flex-col text-sm sm:col-span-2">
              {t('admin.comptabilitat.invoicesIssued.form.notes')}
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 rounded-md border border-slate-300 px-2 py-1"
              />
            </label>
          </div>

          <h3 className="mt-4 font-semibold text-slate-900">{t('admin.comptabilitat.invoicesIssued.form.lines')}</h3>
          {lines.map((line, i) => (
            <div key={i} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <input
                placeholder={t('admin.comptabilitat.invoicesIssued.form.lineDescription')}
                value={line.description}
                onChange={(e) => updateLine(i, 'description', e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm sm:col-span-2"
              />
              <input
                type="number"
                min="1"
                placeholder={t('admin.comptabilitat.invoicesIssued.form.lineQty')}
                value={line.qty}
                onChange={(e) => updateLine(i, 'qty', e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={t('admin.comptabilitat.invoicesIssued.form.lineUnitPrice')}
                value={line.unitPriceCents}
                onChange={(e) => updateLine(i, 'unitPriceCents', e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
              <input
                type="number"
                min="0"
                placeholder={t('admin.comptabilitat.invoicesIssued.form.lineVat')}
                value={line.vatRatePercent}
                onChange={(e) => updateLine(i, 'vatRatePercent', e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                  className="col-span-2 rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 sm:col-span-1"
                >
                  {t('admin.comptabilitat.invoicesIssued.form.removeLine')}
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
            className="mt-2 rounded-md border border-slate-300 px-3 py-1 text-sm"
          >
            {t('admin.comptabilitat.invoicesIssued.form.addLine')}
          </button>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={createInvoice}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? t('admin.comptabilitat.invoicesIssued.form.saving') : t('admin.comptabilitat.invoicesIssued.form.save')}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesIssued.colNumber')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesIssued.colDate')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesIssued.colRecipient')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesIssued.colTotal')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesIssued.colStatus')}</th>
              <th className="py-2 pr-4">{t('admin.comptabilitat.invoicesIssued.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td className="py-2 pr-4">{inv.number}</td>
                <td className="py-2 pr-4">{new Date(inv.issue_date).toLocaleDateString()}</td>
                <td className="py-2 pr-4">{inv.recipient_name}</td>
                <td className="py-2 pr-4">{(inv.total_cents / 100).toFixed(2)} €</td>
                <td className="py-2 pr-4">
                  {inv.status === 'emesa'
                    ? t('admin.comptabilitat.invoicesIssued.statusIssued')
                    : t('admin.comptabilitat.invoicesIssued.statusCancelled')}
                </td>
                <td className="py-2 pr-4 flex gap-2">
                  <a
                    href={`/api/admin/comptabilitat/invoices-issued/${inv.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    {t('admin.comptabilitat.invoicesIssued.viewPdf')}
                  </a>
                  {inv.status === 'emesa' && (
                    <button
                      type="button"
                      onClick={() => cancelInvoice(inv.id)}
                      className="rounded-md bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      {t('admin.comptabilitat.invoicesIssued.cancel')}
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
