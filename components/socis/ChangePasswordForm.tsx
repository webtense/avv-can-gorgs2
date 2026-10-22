'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useI18n } from '@/components/i18n/I18nProvider';

export default function ChangePasswordForm() {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError(t('canviaContrasenya.mismatchError'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/socis/contrasenya', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('canviaContrasenya.genericError'));
        return;
      }
      setSuccess(data.message || t('canviaContrasenya.success'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError(t('canviaContrasenya.connectionError'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
        <p>
          <Link href="/socis" className="text-primary underline">
            {t('canviaContrasenya.backToSocis')}
          </Link>
        </p>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700">
          {t('canviaContrasenya.currentPassword')}
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
          {t('canviaContrasenya.newPassword')}
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
          {t('canviaContrasenya.confirmPassword')}
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? t('canviaContrasenya.submitting') : t('canviaContrasenya.submit')}
      </button>
    </form>
  );
}
