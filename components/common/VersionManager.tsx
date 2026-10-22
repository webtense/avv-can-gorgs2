'use client';

import { useEffect, useRef, useState } from 'react';

const CHECK_INTERVAL_MS = 30 * 1000;

/**
 * Polls /api/version every 30s and shows an "update available" banner when a
 * new buildId is detected, letting the visitor reload on their own terms
 * (PWA-friendly, avoids losing in-progress scroll/filters).
 */
export default function VersionManager() {
  const currentBuildId = useRef<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkVersion() {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId: string };

        if (cancelled) return;

        if (currentBuildId.current === null) {
          currentBuildId.current = data.buildId;
          return;
        }

        if (currentBuildId.current !== data.buildId) {
          setUpdateAvailable(true);
        }
      } catch {
        // Network errors are ignored; we'll retry on the next interval.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    }

    checkVersion();
    const intervalId = window.setInterval(checkVersion, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-50 bg-primary text-white px-4 py-3 shadow-lg"
    >
      <div className="mx-auto flex max-w-8xl flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-sm">
          Hi ha una nova versió disponible de l&apos;Arxiu Can Gorgs II.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-white px-4 py-1.5 text-sm font-semibold text-primary hover:bg-slate-100 transition-colors"
        >
          Actualitzar ara
        </button>
      </div>
    </div>
  );
}
