import { getVersion } from '@/lib/version';

export default function Home() {
  const version = getVersion();
  return (
    <main>
      <h1>Can Gorgs II — Arxiu Històric</h1>
      <p>v{version.version}</p>
    </main>
  );
}
