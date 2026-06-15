'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SLOT_DATES = {
  1: 'May 11–17',   2: 'May 18–24',  3: 'May 25–31',
  4: 'Jun 1–7',     5: 'Jun 8–14',   6: 'Jun 15–21',
  7: 'Jun 22–28',   8: 'Jun 29–Jul 5', 9: 'Jul 6–12',
};

/* ── Slim toggle switch ── */
function Toggle({ on, busy, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      title={on ? 'Click to hide Report Book' : 'Click to show Report Book'}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        outline: 'none',
        cursor: busy ? 'not-allowed' : 'pointer',
        background: on ? '#014a01' : '#d0d0d0',
        transition: 'background 0.25s',
        flexShrink: 0,
        padding: 0,
        opacity: busy ? 0.6 : 1,
        verticalAlign: 'middle',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: on ? 23 : 3,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        transition: 'left 0.22s cubic-bezier(.4,0,.2,1)',
        pointerEvents: 'none',
        display: 'block',
      }} />
    </button>
  );
}

const S = {
  wrap:    { padding: 28, maxWidth: 900, margin: '0 auto', fontFamily: 'Inter, sans-serif' },
  header:  { marginBottom: 28 },
  h2:      { fontSize: '1.5rem', fontWeight: 800, color: '#012a01', margin: '0 0 6px', letterSpacing: '-0.02em' },
  sub:     { color: '#666', fontSize: '0.88rem', margin: 0 },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  card:    {
    background: '#fff', borderRadius: 16, padding: '20px 22px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1.5px solid #e8f5e9',
    display: 'flex', flexDirection: 'column', gap: 14,
    transition: 'all 0.2s',
  },
  cardOn:  { borderColor: '#014a01', boxShadow: '0 4px 20px rgba(1,74,1,0.18)' },
  cardOff: { borderColor: '#f44336', boxShadow: '0 4px 20px rgba(244,67,54,0.12)', background: '#fff9f9' },
  topRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  slotNum: { fontSize: '1.1rem', fontWeight: 800, color: '#012a01' },
  date:    { fontSize: '0.78rem', color: '#888', fontWeight: 500, marginTop: 2 },
  badge:   { display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 },
  badgeOn: { background: '#e6f4ea', color: '#014a01' },
  badgeOff:{ background: '#fce8e6', color: '#c62828' },
  info:    { fontSize: '0.8rem', color: '#666', lineHeight: 1.5 },
  infoOn:  { color: '#2e7d32' },
  infoOff: { color: '#c62828' },
  loading: { textAlign: 'center', padding: 40, color: '#888' },
  legend:  {
    background: '#f3f8f3', border: '1px solid #c8e6c9', borderRadius: 12,
    padding: '14px 18px', marginBottom: 22, fontSize: '0.85rem', color: '#333',
    lineHeight: 1.6,
  },
};

export default function RBookControl() {
  const [slots, setSlots]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/dashboard/admin/rbook-control');
        const json = await res.json();
        if (json.success) setSlots(json.slots);
        else toast.error('Failed to load R-Book states');
      } catch { toast.error('Network error'); }
      finally { setLoading(false); }
    })();
  }, []);

  const toggle = async (slot, currentVisible) => {
    const newVal = !currentVisible;
    setToggling(p => ({ ...p, [slot]: true }));
    try {
      const res  = await fetch('/api/dashboard/admin/rbook-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, visible: newVal }),
      });
      const json = await res.json();
      if (json.success) {
        setSlots(prev => prev.map(s => s.slot === slot ? { ...s, visible: newVal ? 1 : 0 } : s));
        toast.success(`Slot ${slot} Report Book ${newVal ? 'visible ✅' : 'hidden 🔒'}`);
      } else {
        toast.error(json.error || 'Failed to update');
      }
    } catch { toast.error('Network error'); }
    finally { setToggling(p => ({ ...p, [slot]: false })); }
  };

  if (loading) return <div style={S.loading}>Loading R-Book control states…</div>;

  const hiddenCount  = slots.filter(s => !s.visible).length;
  const visibleCount = slots.length - hiddenCount;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <h2 style={S.h2}>📘 R-Book Control</h2>
        <p style={S.sub}>
          Toggle Report Book page visibility per slot. When hidden, students in that slot
          cannot see the Report Book tab in their dashboard.&nbsp;
          <strong>{visibleCount}</strong> of 9 slots are currently showing the Report Book.
        </p>
      </div>

      {/* Legend */}
      <div style={S.legend}>
        <strong>📖 How it works:</strong><br />
        • <strong>Visible (ON)</strong> — Students whose slot matches can see the Report Book page (subject to their own eligibility).<br />
        • <strong>Hidden (OFF)</strong> — The Report Book tab is completely invisible for students in that slot, regardless of their marks or submission status.
      </div>

      {/* Quick-view badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {slots.map(s => (
          <span key={s.slot} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
            background: s.visible ? '#014a01' : '#f44336',
            color: '#fff',
            border: `1.5px solid ${s.visible ? '#014a01' : '#f44336'}`,
          }}>
            Slot {s.slot} {s.visible ? '📗' : '🔒'}
          </span>
        ))}
      </div>

      {/* Cards grid */}
      <div style={S.grid}>
        {slots.map(({ slot, visible }) => {
          const on   = Boolean(visible);
          const busy = toggling[slot];
          return (
            <div key={slot} style={{ ...S.card, ...(on ? S.cardOn : S.cardOff) }}>
              <div style={S.topRow}>
                <div>
                  <div style={S.slotNum}>Slot {slot}</div>
                  <div style={S.date}>📅 {SLOT_DATES[slot]}</div>
                </div>
                <Toggle on={on} busy={busy} onClick={() => !busy && toggle(slot, on)} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...S.badge, ...(on ? S.badgeOn : S.badgeOff) }}>
                  {on ? '📗 Visible' : '🔒 Hidden'}
                </span>
                {busy && <span style={{ fontSize: '0.72rem', color: '#888' }}>Updating…</span>}
              </div>

              <div style={{ ...S.info, ...(on ? S.infoOn : S.infoOff) }}>
                {on
                  ? 'Report Book page is visible to eligible students in this slot.'
                  : 'Report Book page is hidden from ALL students in this slot.'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
