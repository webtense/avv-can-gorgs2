import type { ReactNode } from 'react';
import { Outfit, Playfair_Display } from 'next/font/google';
import { getVersion } from '@/lib/version';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VersionManager from '@/components/common/VersionManager';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata = {
  title: 'Can Gorgs II — Arxiu Històric',
  description:
    'Arxiu històric digital de l’Associació de Veïns Can Gorgs II: fotografies, documents, vídeos i esdeveniments.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const version = getVersion();
  return (
    <html
      lang="ca"
      data-build-id={version.buildId}
      className={`${outfit.variable} ${playfair.variable}`}
    >
      <head>
        <meta name="app-version" content={version.version} />
      </head>
      <body className="flex min-h-screen flex-col">
        <VersionManager />
        <Header version={version.version} />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
