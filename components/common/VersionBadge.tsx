'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/components/i18n/I18nProvider';

interface ChangelogEntry {
  version: string;
  date: string;
  features: string[];
  fixes: string[];
}

interface VersionBadgeProps {
  version: string;
}

export default function VersionBadge({ version }: VersionBadgeProps) {
  const [open, setOpen] = useState(false);
  const [changelog, setChangelog] = useState<ChangelogEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (!open || changelog || loading) return;

    let cancelled = false;
    setLoading(true);

    fetch('/api/changelog')
      .then((res) => res.json())
      .then((data: { changelog: ChangelogEntry[] }) => {
        if (!cancelled) setChangelog(data.changelog);
      })
      .catch(() => {
        if (!cancelled) setChangelog([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, changelog, loading]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
      >
        v{version}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('versionBadge.changelogDialogAria')}
          className="absolute right-0 mt-2 w-80 max-w-[90vw] max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-xl z-50"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-serif text-base text-slate-900">{t('versionBadge.changelogTitle')}</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('versionBadge.closeAria')}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          {loading && <p className="text-sm text-slate-500">{t('versionBadge.loading')}</p>}

          {!loading && changelog && changelog.length === 0 && (
            <p className="text-sm text-slate-500">{t('versionBadge.empty')}</p>
          )}

          <ul className="space-y-3">
            {changelog?.map((entry) => (
              <li key={entry.version} className="border-b border-slate-100 pb-2 last:border-0">
                <p className="text-sm font-semibold text-primary">
                  v{entry.version}{' '}
                  <span className="font-normal text-slate-400">{entry.date}</span>
                </p>
                {entry.features.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-xs text-slate-600 space-y-0.5">
                    {entry.features.slice(0, 3).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-3 border-t border-slate-100 pt-2 text-right">
            <Link
              href="/changelog"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t('versionBadge.viewFull')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
