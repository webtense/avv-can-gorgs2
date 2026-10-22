import Link from 'next/link';

import { siteConfig, footerLegal } from '@/lib/site-config';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h2 className="font-serif text-lg text-white">
              Associació de Veïns Can Gorgs II
            </h2>
            {siteConfig.foundedYear && (
              <p className="mt-2 text-sm text-slate-400">
                Fundada l&apos;any {siteConfig.foundedYear}.
              </p>
            )}
            <p className="mt-2 text-sm text-slate-400">
              Preservant la memòria històrica del barri.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Contacte
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              {siteConfig.email && (
                <li>
                  <a href={`mailto:${siteConfig.email}`} className="hover:text-white transition-colors">
                    {siteConfig.email}
                  </a>
                </li>
              )}
              {siteConfig.phone && <li className="text-slate-400">{siteConfig.phone}</li>}
              {siteConfig.address && <li className="text-slate-400">{siteConfig.address}</li>}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Enllaços
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              {footerLegal.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/changelog" className="hover:text-white transition-colors">
                  Historial de versions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-700 pt-6 text-xs text-slate-500">
          © {year} Associació de Veïns Can Gorgs II. Tots els drets reservats.
        </div>
      </div>
    </footer>
  );
}
