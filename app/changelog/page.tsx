import { getChangelog } from '@/lib/changelog';
import { getLocale, getMessages } from '@/lib/i18n';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return {
    title: `${messages.changelog.title} — ${locale === 'es' ? 'Archivo' : 'Arxiu'} Can Gorgs II`,
  };
}

export default async function ChangelogPage() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.changelog;
  const entries = getChangelog(locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
        {t.title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        {t.subtitle}
      </p>

      <div className="mt-8 space-y-8">
        {entries.map((entry) => (
          <article
            key={entry.version}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-xl font-semibold text-primary">
                v{entry.version}
              </h2>
              <span className="text-sm text-slate-400">{entry.date}</span>
            </div>

            {entry.features.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  {t.features}
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {entry.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {entry.fixes.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  {t.fixes}
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {entry.fixes.map((fix) => (
                    <li key={fix}>{fix}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
