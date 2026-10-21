import { CHANGELOG } from '@/app/api/changelog/route';

export const metadata = {
  title: 'Historial de versiones — Arxiu Can Gorgs II',
};

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
        Historial de versiones
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Novedades y correcciones de cada versión publicada de l&apos;Arxiu
        Històric Can Gorgs II.
      </p>

      <div className="mt-8 space-y-8">
        {CHANGELOG.map((entry) => (
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

            {entry.sections.features.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Novedades
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {entry.sections.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {entry.sections.fixes.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Correcciones
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {entry.sections.fixes.map((fix) => (
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
