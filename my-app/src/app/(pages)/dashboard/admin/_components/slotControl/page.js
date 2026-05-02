'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SLOT_DATES = {
  1: 'May 11–17',   2: 'May 18–24',  3: 'May 25–31',
  4: 'Jun 1–7',     5: 'Jun 8–14',   6: 'Jun 15–21',
  7: 'Jun 22–28',   8: 'Jun 29–Jul 5', 9: 'Jul 6–12',
};

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
  topRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  slotNum: { fontSize: '1.1rem', fontWeight: 800, color: '#012a01' },
  date:    { fontSize: '0.78rem', color: '#888', fontWeight: 500, marginTop: 2 },
  badge:   { display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 },
  badgeOn: { background: '#e6f4ea', color: '#014a01' },
  badgeOff:{ background: '#f5f5f5', color: '#aaa' },

  // Toggle switch
  switchWrap: { position: 'relative', width: 52, height: 28, cursor: 'pointer', flexShrink: 0 },
  switchTrack: (on) => ({
    width: '100%', height: '100%', borderRadius: 14,
    background: on ? '#014a01' : '#d0d0d0',
    transition: 'background 0.25s',
    border: 'none', outline: 'none', cursor: 'pointer',
    position: 'relative', display: 'block',
  }),
  switchThumb: (on) => ({
    position: 'absolute', top: 3, left: on ? 26 : 3,
    width: 22, height: 22, borderRadius: '50%',
    background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    transition: 'left 0.25s',
    pointerEvents: 'none',
  }),

  info: { fontSize: '0.8rem', color: '#666', lineHeight: 1.5 },
  infoOn: { color: '#2e7d32' },

  loading: { textAlign: 'center', padding: 40, color: '#888' },
};

export default function SlotControl() {
  const [slots, setSlots]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState({}); // { slotNum: true/false }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/dashboard/admin/slot-control');
        const json = await res.json();
        if (json.success) setSlots(json.slots);
        else toast.error('Failed to load slot states');
      } catch { toast.error('Network error'); }
      finally { setLoading(false); }
    })();
  }, []);

  const toggle = async (slot, currentEnabled) => {
    const newVal = !currentEnabled;
    setToggling(p => ({ ...p, [slot]: true }));
    try {
      const res = await fetch('/api/dashboard/admin/slot-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, enabled: newVal }),
      });
      const json = await res.json();
      if (json.success) {
        setSlots(prev => prev.map(s => s.slot === slot ? { ...s, enabled: newVal ? 1 : 0 } : s));
        toast.success(`Slot ${slot} ${newVal ? 'enabled ✅' : 'disabled 🔒'}`);
      } else {
        toast.error(json.error || 'Failed to update');
      }
    } catch { toast.error('Network error'); }
    finally { setToggling(p => ({ ...p, [slot]: false })); }
  };

  if (loading) return <div style={S.loading}>Loading slot states…</div>;

  const enabledCount = slots.filter(s => s.enabled).length;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <h2 style={S.h2}>🎛️ Slot Control</h2>
        <p style={S.sub}>
          Toggle each slot on or off. Students see the full dashboard only when their slot is enabled.
          &nbsp;<strong>{enabledCount} / 9</strong> slots currently active.
        </p>
      </div>

      {/* Summary pill row */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:24 }}>
        {slots.map(s => (
          <span key={s.slot} style={{
            padding:'4px 12px', borderRadius:20, fontSize:'0.75rem', fontWeight:700,
            background: s.enabled ? '#014a01' : '#f0f0f0',
            color: s.enabled ? '#fff' : '#aaa',
            border: `1.5px solid ${s.enabled ? '#014a01' : '#e0e0e0'}`,
          }}>Slot {s.slot}</span>
        ))}
      </div>

      <div style={S.grid}>
        {slots.map(({ slot, enabled }) => {
          const on = Boolean(enabled);
          const busy = toggling[slot];
          return (
            <div key={slot} style={{ ...S.card, ...(on ? S.cardOn : {}) }}>
              <div style={S.topRow}>
                <div>
                  <div style={S.slotNum}>Slot {slot}</div>
                  <div style={S.date}>📅 {SLOT_DATES[slot]}</div>
                </div>
                {/* Toggle */}
                <button
                  style={S.switchTrack(on)}
                  onClick={() => !busy && toggle(slot, on)}
                  disabled={busy}
                  title={on ? 'Click to disable' : 'Click to enable'}
                >
                  <span style={S.switchThumb(on)} />
                </button>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ ...S.badge, ...(on ? S.badgeOn : S.badgeOff) }}>
                  {on ? '✅ Active' : '🔒 Locked'}
                </span>
                {busy && <span style={{ fontSize:'0.75rem', color:'#888' }}>Updating…</span>}
              </div>

              <div style={{ ...S.info, ...(on ? S.infoOn : {}) }}>
                {on
                  ? 'Students in this slot can see all dashboard sections and submit their work.'
                  : 'Students only see Overview, Profile, Change Password and their Mentor (if assigned).'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
