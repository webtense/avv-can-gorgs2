'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  id: string;
  membersOnly: boolean;
  reservationsOpen: boolean;
  capacity: number | null;
}

export default function EventFlagsForm({ id, membersOnly, reservationsOpen, capacity }: Props) {
  const router = useRouter();
  const [mOnly, setMOnly] = useState(membersOnly);
  const [resOpen, setResOpen] = useState(reservationsOpen);
  const [cap, setCap] = useState(capacity != null ? String(capacity) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          membersOnly: mOnly,
          reservationsOpen: resOpen,
          capacity: cap === '' ? null : Number(cap),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No s\'ha pogut desar.');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-center gap-3 text-sm">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <label className="flex items-center gap-1">
        <input type="checkbox" checked={mOnly} onChange={(e) => setMOnly(e.target.checked)} />
        Només socis
      </label>
      <label className="flex items-center gap-1">
        <input type="checkbox" checked={resOpen} onChange={(e) => setResOpen(e.target.checked)} />
        Reserves obertes
      </label>
      <label className="flex items-center gap-1">
        Aforament
        <input
          type="number"
          min={1}
          value={cap}
          onChange={(e) => setCap(e.target.value)}
          placeholder="sense límit"
          className="w-24 rounded-md border border-slate-300 px-2 py-1"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? 'Desant…' : 'Desar'}
      </button>
    </form>
  );
}
