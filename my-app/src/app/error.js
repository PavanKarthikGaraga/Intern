'use client';

import { useEffect } from 'react';
import './status-page.css';

export default function GlobalError({ error, reset }) {
  const isChunkError =
    error?.name === 'ChunkLoadError' ||
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('Importing a module script failed');

  useEffect(() => {
    if (isChunkError) {
      // Auto-reload once to get fresh chunks from a new deployment
      const reloaded = sessionStorage.getItem('chunk_reload');
      if (!reloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
      }
    } else {
      console.error(error);
    }
  }, [isChunkError, error]);

  if (isChunkError) {
    return (
      <main className="status-page">
        <div className="status-card">
          <img src="/klu.png" alt="KL University" className="status-logo" />
          <p className="status-code">Update available</p>
          <h1>A new version is ready</h1>
          <p>The platform was just updated. Reload the page to continue with the latest version.</p>
          <div className="status-actions">
            <button
              type="button"
              className="status-btn"
              onClick={() => {
                sessionStorage.removeItem('chunk_reload');
                window.location.reload();
              }}
            >
              Reload now
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <main className="status-page">
      <div className="status-card" role="alert">
        <img src="/klu.png" alt="KL University" className="status-logo" />
        <p className="status-code">Something went wrong</p>
        <h1>We hit an unexpected error</h1>
        <p>
          This section couldn&apos;t be displayed. Try again, or reload the page.
          If the problem continues, please contact the SAC office.
        </p>
        <div className="status-actions">
          <button type="button" className="status-btn" onClick={() => reset()}>
            Try again
          </button>
          <button type="button" className="status-btn is-secondary" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
        {/* Technical details are for developers only; users get a reference code instead */}
        {isDev && error?.message ? (
          <div className="status-detail">{error.message}</div>
        ) : error?.digest ? (
          <div className="status-detail">Reference: {error.digest}</div>
        ) : null}
      </div>
      <p className="status-footer">
        Need help? Email <a href="mailto:sac@kluniversity.in">sac@kluniversity.in</a>
      </p>
    </main>
  );
}
