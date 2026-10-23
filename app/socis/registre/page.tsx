'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import PageShell from '@/components/common/PageShell';
import { useI18n } from '@/components/i18n/I18nProvider';
import { withBasePath } from '@/lib/basePath';

export default function RegistrePage() {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(withBasePath('/api/socis/registre'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, gdprConsent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('registre.genericError'));
        return;
      }
      setSuccess(data.message);
    } catch {
      setError(t('registre.connectionError'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <PageShell title={t('registre.sentTitle')}>
        <p role="status">{success}</p>
        <p>
          <Link href="/" className="text-primary underline">
            {t('registre.backHome')}
          </Link>
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell title={t('registre.title')}>
      <p>{t('registre.intro')}</p>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            {t('registre.name')}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            aria-describedby="name-help"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            {t('registre.email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            {t('registre.password')}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
            {t('registre.phone')}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            id="gdprConsent"
            name="gdprConsent"
            type="checkbox"
            required
            checked={gdprConsent}
            onChange={(e) => setGdprConsent(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="gdprConsent" className="text-sm text-slate-700">
            {t('registre.gdprPrefix')}{' '}
            <Link href="/privacy" className="text-primary underline">
              {t('registre.gdprLink')}
            </Link>
            .
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? t('registre.submitting') : t('registre.submit')}
        </button>
      </form>
    </PageShell>
  );
}
