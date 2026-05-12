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

    // Clear the reload flag on successful page load
    // (if we reloaded and it worked, allow future reloads if needed)
    sessionStorage.removeItem('chunk_reload');

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return null;
}
