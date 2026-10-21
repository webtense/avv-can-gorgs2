import { getVersion } from '@/lib/version';

export default function Home() {
  const version = getVersion();
  return (
    <main>
      <h1>Can Gorgs II v0.2.0-BETA — Arxiu Històric</h1>
      <p>v{version.version}</p>
    </main>
  );
}
