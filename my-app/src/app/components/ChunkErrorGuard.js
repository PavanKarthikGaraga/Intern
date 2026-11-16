'use client';
import { useEffect } from 'react';

/**
 * Listens globally for unhandled ChunkLoadErrors (caused by stale browser cache
 * after a new Vercel deployment) and auto-reloads the page once to fix them.
 */
export default function ChunkErrorGuard() {
  useEffect(() => {
    const handleError = (event) => {
      const err = event?.error || event?.reason;
      const isChunk =
        err?.name === 'ChunkLoadError' ||
        err?.message?.includes('Loading chunk') ||
        err?.message?.includes('Failed to fetch dynamically imported module');

      if (isChunk) {
        const reloaded = sessionStorage.getItem('chunk_reload');
        if (!reloaded) {
          sessionStorage.setItem('chunk_reload', '1');
          window.location.reload();
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    // Clear the reload flag only once the page has stayed healthy for a while.
    // Clearing it immediately on mount meant a permanently-missing chunk would
    // trigger reload → mount → clear → error → reload… forever.
    const clearTimer = setTimeout(() => sessionStorage.removeItem('chunk_reload'), 10000);

    return () => {
      clearTimeout(clearTimer);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return null;
}
