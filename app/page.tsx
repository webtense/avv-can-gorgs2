import Link from 'next/link';
import ArchiveList from '@/components/archive/ArchiveList';
import { ArchiveItem } from '@/lib/types';

// Dades d'exemple fins que l'Oleada 5 connecti aquesta pàgina a /api/archive.
const LATEST_ITEMS: ArchiveItem[] = [];

export default function Home() {
  return (
    <>
      <section className="bg-gradient-to-b from-primary to-primary-dark text-white">
        <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl font-bold leading-tight sm:text-5xl">
              Arxiu Històric Can Gorgs II
            </h1>
            <p className="mt-4 text-base text-white/90 sm:text-lg">
              Fotografies, documents, vídeos i esdeveniments que recorden la
              història del nostre barri, conservats i oberts a tots els
              veïns.
            </p>
            <div className="mt-8">
              <Link
                href="/archive"
                className="inline-flex items-center rounded-lg bg-secondary px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-secondary-dark transition-colors"
              >
                Explora l&apos;arxiu
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
            Últimes novetats
          </h2>
          <Link href="/archive" className="text-sm font-medium text-primary hover:underline">
            Veure tot
          </Link>
        </div>
        <div className="mt-6">
          <ArchiveList items={LATEST_ITEMS} />
        </div>
      </section>
    </>
  );
}
