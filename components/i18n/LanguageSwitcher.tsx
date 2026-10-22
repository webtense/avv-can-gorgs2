'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n/I18nProvider';
import type { Locale } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  async function changeLocale(next: Locale) {
    if (next === locale) return;
    setPendingLocale(next);
    try {
      await fetch('/api/lang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      });
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setPendingLocale(null);
    }
  }

  const busy = isPending || pendingLocale !== null;

  return (
    <div className="flex items-center rounded-full border border-slate-300 text-xs font-semibold">
      <button
        type="button"
        onClick={() => changeLocale('ca')}
        aria-pressed={locale === 'ca'}
        aria-label={t('common.langSelector.ariaCa')}
        disabled={busy}
        className={`rounded-l-full px-2 py-1 transition-colors ${
          locale === 'ca'
            ? 'bg-primary text-white'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        {t('common.langSelector.ca')}
      </button>
      <span aria-hidden="true" className="text-slate-300">
        |
      </span>
      <button
        type="button"
        onClick={() => changeLocale('es')}
        aria-pressed={locale === 'es'}
        aria-label={t('common.langSelector.ariaEs')}
        disabled={busy}
        className={`rounded-r-full px-2 py-1 transition-colors ${
          locale === 'es'
            ? 'bg-primary text-white'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        {t('common.langSelector.es')}
      </button>
    </div>
  );
}
