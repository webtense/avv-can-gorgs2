'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import PageShell from '@/components/common/PageShell';

export default function RegistrePage() {
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
      const res = await fetch('/api/socis/registre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, gdprConsent }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No s\'ha pogut completar el registre.');
        return;
      }
      setSuccess(data.message);
    } catch {
      setError('Error de connexió. Torna-ho a provar.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <PageShell title="Sol·licitud enviada">
        <p role="status">{success}</p>
        <p>
          <Link href="/" className="text-primary underline">
            Torna a l&apos;inici
          </Link>
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell title="Fes-te soci">
      <p>
        Omple el formulari per sol·licitar l&apos;alta com a soci. La junta revisarà la teva
        petició abans d&apos;activar el compte.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Nom i cognoms
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
            Correu electrònic
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
            Contrasenya (mínim 10 caràcters)
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
            Telèfon (opcional)
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
            Accepto que les meves dades es tractin per gestionar la meva condició de soci,
            d&apos;acord amb la{' '}
            <Link href="/privacy" className="text-primary underline">
              política de privacitat
            </Link>
            .
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? 'Enviant…' : 'Enviar sol·licitud'}
        </button>
      </form>
    </PageShell>
  );
}
