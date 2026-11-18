'use client';
import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaSync, FaExternalLinkAlt } from 'react-icons/fa';

const fmt = (iso, withTime = false) => iso
  ? new Date(iso).toLocaleString('en-IN', withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }
    : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
  : '—';

const box = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, marginBottom: 18 };
const th = { textAlign: 'left', padding: '8px 10px', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #e5e7eb' };
const td = { padding: '9px 10px', fontSize: '0.86rem', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' };

export default function MyGovTasksAdmin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    try {
      const res = await fetch('/api/mygov-tasks', { method: force ? 'POST' : 'GET', credentials: 'include' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load');
      setData(json);
      if (force) toast.success('Fetched the latest quizzes and pledges from MyGov');
    } catch (err) {
      toast.error(err.message || 'Failed to load MyGov tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: '0 0 6px' }}>MyGov Tasks</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem', maxWidth: 680, lineHeight: 1.55 }}>
            Quizzes are fetched automatically from quiz.mygov.in and pledges from the ongoing list on pledge.mygov.in,
            every 6 hours. A quiz disappears from students&apos; tasks as soon as its end date passes and is replaced by another open one.
          </p>
        </div>
        <button type="button" onClick={() => load(true)} disabled={refreshing}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 8, border: 'none', background: '#970003', color: '#fff', fontWeight: 600, cursor: refreshing ? 'wait' : 'pointer' }}>
          <FaSync className={refreshing ? 'spinning' : ''} /> {refreshing ? 'Refreshing…' : 'Refresh now'}
        </button>
      </div>

      {loading ? <p>Loading…</p> : data && (
        <>
          <p style={{ fontSize: '0.85rem', color: data.lastError ? '#b91c1c' : '#15803d', margin: '0 0 14px' }}>
            {data.lastError ? `⚠️ ${data.lastError}. Showing the last saved lists.` : '✓ Live data'} · Last fetched {fmt(data.fetchedAt, true)}
          </p>

          <div style={box}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem' }}>Open quizzes ({data.quizzes.length})</h3>
            {data.quizzes.length === 0 ? <p style={{ color: '#92400e', margin: 0 }}>No quizzes are open on MyGov right now. Students are told to complete the pledges; quizzes reappear automatically.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Quiz</th><th style={th}>Start</th><th style={th}>Closes</th></tr></thead>
                <tbody>
                  {data.quizzes.map((q) => (
                    <tr key={q.url}>
                      <td style={td}><a href={q.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8' }}>{q.title} <FaExternalLinkAlt style={{ fontSize: '0.7rem' }} /></a></td>
                      <td style={td}>{fmt(q.startDate)}</td>
                      <td style={td}>{fmt(q.endDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={box}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem' }}>Ongoing pledges ({data.pledges.length})</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={th}>Pledge</th><th style={th}>Started</th></tr></thead>
              <tbody>
                {data.pledges.map((p) => (
                  <tr key={p.url}>
                    <td style={td}><a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8' }}>{p.title} <FaExternalLinkAlt style={{ fontSize: '0.7rem' }} /></a></td>
                    <td style={td}>{p.startDate ? fmt(`${p.startDate}T00:00:00+05:30`) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
