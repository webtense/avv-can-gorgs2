import type { ReactNode } from 'react';
import { Outfit, Playfair_Display } from 'next/font/google';
import { getVersion } from '@/lib/version';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VersionManager from '@/components/common/VersionManager';
import { I18nProvider } from '@/components/i18n/I18nProvider';
import { getLocale, getMessages } from '@/lib/i18n';
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

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return {
    title:
      locale === 'es'
        ? 'Can Gorgs II — Archivo Histórico'
        : 'Can Gorgs II — Arxiu Històric',
    description:
      locale === 'es'
        ? 'Archivo histórico digital de la Associació de Veïns Can Gorgs II: fotografías, documentos, vídeos y eventos.'
        : messages.home.subtitle,
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const version = getVersion();
  const locale = await getLocale();
  const messages = getMessages(locale);
  return (
    <html
      lang={locale}
      data-build-id={version.buildId}
      className={`${outfit.variable} ${playfair.variable}`}
    >
      <head>
        <meta name="app-version" content={version.version} />
      </head>
      <body className="flex min-h-screen flex-col">
        <I18nProvider locale={locale} messages={messages}>
          <VersionManager />
          <Header version={version.version} />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
