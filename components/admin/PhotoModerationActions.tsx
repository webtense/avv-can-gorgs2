'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PhotoModerationActions({ id, approved }: { id: string; approved: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function approve() {
    setLoading(true);
    try {
      await fetch('/api/admin/fotos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!confirm('Segur que vols esborrar aquesta foto?')) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/fotos?id=${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-1 flex gap-2">
      {!approved && (
        <button
          type="button"
          disabled={loading}
          onClick={approve}
          className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Aprovar
        </button>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={remove}
        className="rounded-md bg-red-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        Esborrar
      </button>
    </div>
  );
}
