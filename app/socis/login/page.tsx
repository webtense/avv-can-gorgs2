'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageShell from '@/components/common/PageShell';
import { useI18n } from '@/components/i18n/I18nProvider';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/socis/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('login.genericError'));
        return;
      }
      router.push('/socis');
      router.refresh();
    } catch {
      setError(t('login.connectionError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell title={t('login.title')}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            {t('login.email')}
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
            {t('login.password')}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? t('login.submitting') : t('login.submit')}
        </button>
      </form>
      <p className="text-sm text-slate-500">
        {t('login.notMember')}{' '}
        <Link href="/socis/registre" className="text-primary underline">
          {t('login.requestSignup')}
        </Link>
        .
      </p>
    </PageShell>
  );
}
