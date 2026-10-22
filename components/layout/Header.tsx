'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import VersionBadge from '@/components/common/VersionBadge';
import { navigation } from '@/lib/site-config';


interface HeaderProps {
  version?: string;
}

export default function Header({ version = '0.6.0-BETA' }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [member, setMember] = useState<{ name: string; admin: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/socis/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setMember(d.member ?? null))
      .catch(() => setMember(null));
  }, []);

  const authLink = member ? (
    <>
      <Link href="/socis" className="text-sm font-medium text-primary hover:underline">Àrea de socis</Link>
      <Link href="/socis/sortir" className="text-sm font-medium text-slate-600 hover:text-primary">Tanca sessió</Link>
    </>
  ) : (
    <Link href="/socis/login" className="text-sm font-medium text-primary hover:underline">Inicia sessió</Link>
  );

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-lg font-semibold text-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo-avv-can-gorgs-ii.png" alt="AVV Can Gorgs II" className="h-10 w-auto" />
          </Link>

          <nav
            aria-label="Navegació principal"
            className="hidden md:flex items-center gap-8"
          >
            {navigation.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {authLink}
            <VersionBadge version={version} />
          </div>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Tancar menú' : 'Obrir menú'}
            onClick={() => setOpen((v) => !v)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <nav
            id="mobile-menu"
            aria-label="Navegació mòbil"
            className="md:hidden pb-4 flex flex-col gap-1"
          >
            {navigation.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-3 pt-2 flex flex-col gap-2">
              {authLink}
              <VersionBadge version={version} />
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
