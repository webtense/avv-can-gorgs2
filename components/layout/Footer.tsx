import Link from 'next/link';

import { siteConfig, footerLegal } from '@/lib/site-config';
import { getLocale, getMessages } from '@/lib/i18n';

export default async function Footer() {
  const year = new Date().getFullYear();
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.common;

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h2 className="font-serif text-lg text-white">
              {siteConfig.fullName}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {t.footer.tagline}
            </p>
            <p className="mt-2 text-sm italic text-slate-400">
              {t.brand.slogan} · {t.brand.since}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              {t.footer.contactTitle}
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
              {t.footer.linksTitle}
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              {footerLegal.map((l) => {
                const section = l.labelKey.split('.')[0] as 'terms' | 'privacy' | 'cookies';
                return (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-white transition-colors">
                      {messages[section].title}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link href="/changelog" className="hover:text-white transition-colors">
                  {t.footer.changelog}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-700 pt-6 text-xs text-slate-500">
          © {year} {siteConfig.fullName}. {t.footer.rightsReserved}
        </div>
      </div>
    </footer>
  );
}
