import Link from 'next/link';

const FOUNDING_YEAR = 1978;

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
            <p className="mt-2 text-sm text-slate-400">
              Fundada l&apos;any {FOUNDING_YEAR}. Preservant la memòria
              històrica del barri des de fa més de quatre dècades.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Contacte
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <a
                  href="mailto:info@cangorgs2.cat"
                  className="hover:text-white transition-colors"
                >
                  info@cangorgs2.cat
                </a>
              </li>
              <li className="text-slate-400">Can Gorgs II, Barcelona</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
              Enllaços
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Política de privacitat
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Avís legal
                </Link>
              </li>
              <li className="flex gap-3 pt-2">
                <a
                  href="https://facebook.com"
                  aria-label="Facebook de l'associació"
                  className="hover:text-white transition-colors"
                >
                  Facebook
                </a>
                <a
                  href="https://instagram.com"
                  aria-label="Instagram de l'associació"
                  className="hover:text-white transition-colors"
                >
                  Instagram
                </a>
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
