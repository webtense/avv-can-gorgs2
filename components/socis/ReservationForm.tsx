'use client';

import { useState, FormEvent } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { withBasePath } from '@/lib/basePath';

interface Props {
  eventId: string;
  defaultName?: string;
  defaultEmail?: string;
}

export default function ReservationForm({ eventId, defaultName = '', defaultEmail = '' }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(withBasePath('/api/reservations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, name, email, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('reservationForm.genericError'));
        return;
      }
      setSuccess(true);
    } catch {
      setError(t('reservationForm.connectionError'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <p role="status" className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        {t('reservationForm.confirmed')}
      </p>
    );
  }

  const idPrefix = `reserva-${eventId}`;

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 rounded-md bg-slate-50 p-3" noValidate>
      <p className="text-sm font-medium text-slate-700">{t('reservationForm.title')}</p>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <label htmlFor={`${idPrefix}-name`} className="block text-xs font-medium text-slate-600">
            {t('reservationForm.name')}
          </label>
          <input
            id={`${idPrefix}-name`}
            type="text"
            required
            minLength={2}
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-email`} className="block text-xs font-medium text-slate-600">
            {t('reservationForm.email')}
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-quantity`} className="block text-xs font-medium text-slate-600">
            {t('reservationForm.quantity')}
          </label>
          <input
            id={`${idPrefix}-quantity`}
            type="number"
            min={1}
            max={4}
            required
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? t('reservationForm.submitting') : t('reservationForm.submit')}
      </button>
    </form>
  );
}
