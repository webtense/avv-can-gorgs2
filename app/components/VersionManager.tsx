'use client';

import { useEffect, useRef } from 'react';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Polls /api/version and reloads the page when a new buildId is detected,
 * so visitors with an open tab pick up new deployments (PWA-friendly).
 */
export default function VersionManager() {
  const currentBuildId = useRef<string | null>(null);

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
          window.location.reload();
        }
      } catch {
        // Network errors are ignored; we'll retry on the next interval.
      }
    }

    checkVersion();
    const intervalId = window.setInterval(checkVersion, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return null;
}
