'use client';

import { useState, FormEvent } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';

interface Props {
  events: { id: string; title: string }[];
}

export default function PhotoUploadForm({ events }: Props) {
  const { t } = useI18n();
  const [eventId, setEventId] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('files') as HTMLInputElement;
    const files = fileInput?.files;

    if (!files || files.length === 0) {
      setError(t('photoUploadForm.selectAtLeastOne'));
      return;
    }
    if (files.length > 10) {
      setError(t('photoUploadForm.tooMany'));
      return;
    }

    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append('files', file);
    }
    if (eventId) formData.append('eventId', eventId);
    if (caption) formData.append('caption', caption);

    setLoading(true);
    try {
      const res = await fetch('/api/socis/fotos', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('photoUploadForm.genericError'));
        return;
      }
      setSuccess(data.message);
      form.reset();
      setEventId('');
      setCaption('');
    } catch {
      setError(t('photoUploadForm.connectionError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <div>
        <label htmlFor="event" className="block text-sm font-medium text-slate-700">
          {t('photoUploadForm.eventLabel')}
        </label>
        <select
          id="event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="">{t('photoUploadForm.noEvent')}</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="caption" className="block text-sm font-medium text-slate-700">
          {t('photoUploadForm.captionLabel')}
        </label>
        <input
          id="caption"
          type="text"
          maxLength={500}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="files" className="block text-sm font-medium text-slate-700">
          {t('photoUploadForm.filesLabel')}
        </label>
        <input
          id="files"
          name="files"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required
          className="mt-1 w-full text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? t('photoUploadForm.submitting') : t('photoUploadForm.submit')}
      </button>
    </form>
  );
}
