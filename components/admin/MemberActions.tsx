'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/I18nProvider';

export default function MemberActions({
  id,
  status,
  tpvOperator,
}: {
  id: string;
  status: string;
  tpvOperator: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: 'aprovar' | 'rebutjar' | 'toggle_tpv_operator') {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/socis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t('admin.members.actionError'));
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const tpvToggle = (
    <button
      type="button"
      disabled={loading}
      onClick={() => act('toggle_tpv_operator')}
      className="rounded-md bg-slate-600 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60"
    >
      {tpvOperator ? '− TPV' : '+ TPV'}
    </button>
  );

  if (status !== 'pendent') {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        {tpvToggle}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        disabled={loading}
        onClick={() => act('aprovar')}
        className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {t('admin.members.approve')}
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => act('rebutjar')}
        className="rounded-md bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
      >
        {t('admin.members.reject')}
      </button>
      {tpvToggle}
    </div>
  );
}
