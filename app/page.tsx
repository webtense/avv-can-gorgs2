'use client';

import Link from 'next/link';
import ArchiveList from '@/components/archive/ArchiveList';
import { useArchiveList } from '@/hooks/useArchive';
import { useI18n } from '@/components/i18n/I18nProvider';

export default function Home() {
  const { items, loading, error } = useArchiveList({ limit: 6 });
  const { t } = useI18n();

  return (
    <>
      <section className="bg-gradient-to-b from-primary to-primary-dark text-white">
        <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl font-bold leading-tight sm:text-5xl">
              {t('home.title')}
            </h1>
            <p className="mt-4 text-base text-white/90 sm:text-lg">
              {t('home.subtitle')}
            </p>
            <p className="mt-3 font-serif text-base italic text-secondary sm:text-lg">
              {t('common.brand.slogan')} · {t('common.brand.since')}
            </p>
            <div className="mt-8">
              <Link
                href="/archive"
                className="inline-flex items-center rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-secondary-dark transition-colors"
              >
                {t('home.exploreArchive')}
                <span aria-hidden="true" className="ml-2">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-8xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-slate-900 sm:text-2xl">
            {t('home.latestNews')}
          </h2>
          <Link href="/archive" className="text-sm font-medium text-primary hover:underline">
            {t('home.viewAll')}
          </Link>
        </div>
        <div className="mt-6">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
              <p className="font-serif text-lg text-red-700">
                {t('home.loadError')}
              </p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          ) : (
            <ArchiveList items={items} loading={loading} />
          )}
        </div>
      </section>
    </>
  );
}
