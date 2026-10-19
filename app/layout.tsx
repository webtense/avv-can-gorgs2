import { getVersion } from '@/lib/version';

export const metadata = {
  title: 'Can Gorgs II — Arxiu Històric',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const version = getVersion();
  return (
    <html lang="ca" data-build-id={version.buildId}>
      <head>
        <meta name="app-version" content={version.version} />
      </head>
      <body>{children}</body>
    </html>
  );
}
