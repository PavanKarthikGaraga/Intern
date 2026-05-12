'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  const isChunkError =
    error?.name === 'ChunkLoadError' ||
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('Importing a module script failed');

  useEffect(() => {
    if (isChunkError) {
      // Auto-reload once to get fresh chunks from new deployment
      const reloaded = sessionStorage.getItem('chunk_reload');
      if (!reloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
      }
    }
  }, [isChunkError]);

  if (isChunkError) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f0fdf4', fontFamily: 'system-ui, sans-serif', padding: 24
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔄</div>
        <h2 style={{ color: '#014a01', fontWeight: 700, marginBottom: 8 }}>App Updated!</h2>
        <p style={{ color: '#555', marginBottom: 20, textAlign: 'center', maxWidth: 360 }}>
          A new version of the platform has been deployed. The page is reloading to get the latest version…
        </p>
        <button
          onClick={() => {
            sessionStorage.removeItem('chunk_reload');
            window.location.reload();
          }}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: '#014a01', color: '#fff', fontWeight: 600,
            fontSize: '0.95rem', cursor: 'pointer'
          }}
        >
          Reload Now
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#fff5f5', fontFamily: 'system-ui, sans-serif', padding: 24
    }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
      <h2 style={{ color: '#dc2626', fontWeight: 700, marginBottom: 8 }}>Something went wrong</h2>
      <p style={{ color: '#555', marginBottom: 20, textAlign: 'center', maxWidth: 360 }}>
        {error?.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 24px', borderRadius: 8, border: 'none',
          background: '#014a01', color: '#fff', fontWeight: 600,
          fontSize: '0.95rem', cursor: 'pointer'
        }}
      >
        Try Again
      </button>
    </div>
  );
}
