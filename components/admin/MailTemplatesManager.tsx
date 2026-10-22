'use client';

import { useState, FormEvent } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';

export interface MailTemplate {
  id: string;
  name: string;
  locale: string;
  subject: string;
  body_text: string;
}

const EMPTY_FORM = { name: '', locale: 'ca', subject: '', body_text: '' };

export default function MailTemplatesManager({
  templates,
  onChange,
}: {
  templates: MailTemplate[];
  onChange: (templates: MailTemplate[]) => void;
}) {
  const { t } = useI18n();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startNew() {
    setEditingId('new');
    setForm(EMPTY_FORM);
    setError(null);
  }

  function startEdit(tpl: MailTemplate) {
    setEditingId(tpl.id);
    setForm({ name: tpl.name, locale: tpl.locale, subject: tpl.subject, body_text: tpl.body_text });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const isNew = editingId === 'new';
      const url = isNew ? '/api/admin/mail/templates' : `/api/admin/mail/templates/${editingId}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t('admin.mail.templates.error'));
        return;
      }
      const data = await res.json();
      if (isNew) {
        onChange([...templates, data.template]);
      } else {
        onChange(templates.map((tpl) => (tpl.id === editingId ? data.template : tpl)));
      }
      cancelEdit();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('admin.mail.templates.confirmDelete'))) return;
    const res = await fetch(`/api/admin/mail/templates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      onChange(templates.filter((tpl) => tpl.id !== id));
    }
  }

  return (
    <div>
      {editingId ? (
        <form onSubmit={handleSubmit} className="mb-6 flex max-w-xl flex-col gap-3 rounded-md border border-slate-200 p-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <label className="flex flex-col gap-1 text-sm">
            {t('admin.mail.templates.name')}
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('admin.mail.templates.locale')}
            <select
              value={form.locale}
              onChange={(e) => setForm({ ...form, locale: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="ca">Català</option>
              <option value="es">Castellano</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('admin.mail.templates.subject')}
            <input
              type="text"
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('admin.mail.templates.body')}
            <textarea
              required
              rows={8}
              value={form.body_text}
              onChange={(e) => setForm({ ...form, body_text: e.target.value })}
              className="rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? t('admin.mail.templates.saving') : t('admin.mail.templates.save')}
            </button>
            <button type="button" onClick={cancelEdit} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              {t('admin.mail.templates.cancel')}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={startNew}
          className="mb-4 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white"
        >
          {t('admin.mail.templates.new')}
        </button>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-4">{t('admin.mail.templates.name')}</th>
              <th className="py-2 pr-4">{t('admin.mail.templates.locale')}</th>
              <th className="py-2 pr-4">{t('admin.mail.templates.subject')}</th>
              <th className="py-2 pr-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {templates.map((tpl) => (
              <tr key={tpl.id}>
                <td className="py-2 pr-4">{tpl.name}</td>
                <td className="py-2 pr-4">{tpl.locale}</td>
                <td className="py-2 pr-4">{tpl.subject}</td>
                <td className="py-2 pr-4">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(tpl)} className="text-primary underline">
                      {t('admin.mail.templates.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tpl.id)}
                      className="text-red-600 underline"
                    >
                      {t('admin.mail.templates.delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
