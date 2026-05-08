'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const SLOT_DATES = {
  1: 'May 11 – 17, 2026',  2: 'May 18 – 24, 2026', 3: 'May 25 – 31, 2026',
  4: 'Jun 1 – 7, 2026',    5: 'Jun 8 – 14, 2026',  6: 'Jun 15 – 21, 2026',
  7: 'Jun 22 – 28, 2026',  8: 'Jun 29 – Jul 5, 2026', 9: 'Jul 6 – 12, 2026',
};
const SLOT_BATCH = {
  1: 'Y-25', 2: 'Y-25', 3: 'Y-25', 4: 'Y-25', 5: 'Y-25', 6: 'Y-25',
  7: 'Y-24', 8: 'Y-24', 9: 'Y-24',
};

/* ── Toggle Switch ── */
function Toggle({ on, busy, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      title={on ? 'Registration OPEN — click to close' : 'Registration CLOSED — click to open'}
      style={{
        position: 'relative', display: 'inline-flex', alignItems: 'center',
        width: 52, height: 28, borderRadius: 14, border: 'none', outline: 'none',
        cursor: busy ? 'not-allowed' : 'pointer',
        background: on ? '#014a01' : '#dc2626',
        transition: 'background 0.25s', flexShrink: 0, padding: 0,
        opacity: busy ? 0.6 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 4,
        left: on ? 28 : 4,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        transition: 'left 0.22s cubic-bezier(.4,0,.2,1)',
        pointerEvents: 'none', display: 'block',
      }} />
    </button>
  );
}

export default function RegistrationControl() {
  const [slots, setSlots]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [toggling, setToggling] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/dashboard/admin/registration-control', { credentials: 'include' });
        const json = await res.json();
        if (json.success) setSlots(json.slots);
        else toast.error('Failed to load registration states');
      } catch { toast.error('Network error'); }
      finally { setLoading(false); }
    })();
  }, []);

  const toggle = async (slot, currentOpen) => {
    const newVal = !currentOpen;
    const action = newVal ? 'OPEN' : 'CLOSE';
    const confirmMsg = newVal
      ? `Open registration for Slot ${slot}? Students will be able to select this slot.`
      : `Close registration for Slot ${slot}? Students will NOT be able to select this slot until re-opened.`;
    if (!window.confirm(confirmMsg)) return;

    setToggling(p => ({ ...p, [slot]: true }));
    try {
      const res = await fetch('/api/dashboard/admin/registration-control', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, open: newVal }),
      });
      const json = await res.json();
      if (json.success) {
        setSlots(prev => prev.map(s => s.slot === slot ? { ...s, registrationOpen: newVal ? 1 : 0 } : s));
        toast.success(`Slot ${slot} registration ${newVal ? 'OPENED ✅' : 'CLOSED 🔒'}`);
      } else {
        toast.error(json.error || 'Failed to update');
      }
    } catch { toast.error('Network error'); }
    finally { setToggling(p => ({ ...p, [slot]: false })); }
  };

  const openCount   = slots.filter(s => s.registrationOpen).length;
  const closedCount = slots.length - openCount;

  const openAll = async () => {
    if (!window.confirm('Open registration for ALL slots?')) return;
    for (const s of slots.filter(s => !s.registrationOpen)) await toggle(s.slot, false);
  };
  const closeAll = async () => {
    if (!window.confirm('Close registration for ALL slots? No student will be able to register.')) return;
    for (const s of slots.filter(s => s.registrationOpen)) await toggle(s.slot, true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#888', fontSize: '1rem' }}>
        Loading registration states…
      </div>
    );
  }

  const y25Slots = slots.filter(s => s.slot <= 6);
  const y24Slots = slots.filter(s => s.slot >= 7);

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1000, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#012a01', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          📋 Registration Control
        </h2>
        <p style={{ color: '#555', fontSize: '0.88rem', margin: '0 0 16px', lineHeight: 1.6 }}>
          Toggle each slot&apos;s registration on or off. When a slot is <strong style={{ color: '#dc2626' }}>closed</strong>, 
          students cannot select it during registration — it will appear greyed out with a &quot;Registration Full&quot; notice.<br />
          <strong>By default all slots are open.</strong> Changes take effect immediately.
        </p>

        {/* Summary strip */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ padding: '5px 14px', borderRadius: 20, background: '#e6f4ea', color: '#014a01', fontWeight: 700, fontSize: '0.82rem' }}>
            ✅ {openCount} Open
          </span>
          <span style={{ padding: '5px 14px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: '0.82rem' }}>
            🔒 {closedCount} Closed
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              onClick={openAll}
              style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #014a01', background: '#fff', color: '#014a01', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              Open All
            </button>
            <button
              onClick={closeAll}
              style={{ padding: '7px 16px', borderRadius: 8, border: '1.5px solid #dc2626', background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              Close All
            </button>
          </div>
        </div>
      </div>

      {/* Y-25 Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ background: 'linear-gradient(135deg,#014a01,#1a7a1a)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', padding: '3px 12px', borderRadius: 20 }}>
            Y-25 Batch
          </span>
          <span style={{ color: '#888', fontSize: '0.82rem' }}>Vijayawada &amp; Hyderabad Off-Campus — Slots 1–6</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {y25Slots.map(({ slot, registrationOpen }) => {
            const on   = Boolean(registrationOpen);
            const busy = toggling[slot];
            return (
              <div key={slot} style={{
                background: '#fff', borderRadius: 14, padding: '18px 20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                border: `2px solid ${on ? '#014a01' : '#fca5a5'}`,
                display: 'flex', flexDirection: 'column', gap: 12,
                transition: 'border 0.2s, box-shadow 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#012a01' }}>Slot {slot}</div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>📅 {SLOT_DATES[slot]}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                      <span style={{ background: '#e6f4ea', color: '#014a01', fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                        {SLOT_BATCH[slot]}
                      </span>
                    </div>
                  </div>
                  <Toggle on={on} busy={busy} onClick={() => !busy && toggle(slot, on)} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                    background: on ? '#e6f4ea' : '#fef2f2', color: on ? '#014a01' : '#dc2626',
                  }}>
                    {on ? '✅ Registration Open' : '🔒 Registration Closed'}
                  </span>
                  {busy && <span style={{ fontSize: '0.72rem', color: '#888' }}>Updating…</span>}
                </div>

                <div style={{ fontSize: '0.79rem', color: on ? '#2e7d32' : '#b91c1c', lineHeight: 1.5 }}>
                  {on
                    ? 'Students can select this slot during registration.'
                    : 'This slot is hidden from the registration dropdown. Students will see "Registration Closed".'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Y-24 Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ background: 'linear-gradient(135deg,#7a0002,#c00004)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', padding: '3px 12px', borderRadius: 20 }}>
            Y-24 Batch
          </span>
          <span style={{ color: '#888', fontSize: '0.82rem' }}>Detained / Supply Students — Slots 7–9 (Remote only)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {y24Slots.map(({ slot, registrationOpen }) => {
            const on   = Boolean(registrationOpen);
            const busy = toggling[slot];
            return (
              <div key={slot} style={{
                background: '#fff', borderRadius: 14, padding: '18px 20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                border: `2px solid ${on ? '#970003' : '#fca5a5'}`,
                display: 'flex', flexDirection: 'column', gap: 12,
                transition: 'border 0.2s, box-shadow 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7a0002' }}>Slot {slot}</div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>📅 {SLOT_DATES[slot]}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                      <span style={{ background: '#fef2f2', color: '#7a0002', fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                        {SLOT_BATCH[slot]}
                      </span>
                    </div>
                  </div>
                  <Toggle on={on} busy={busy} onClick={() => !busy && toggle(slot, on)} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                    background: on ? '#fef2f2' : '#fef2f2', color: on ? '#970003' : '#dc2626',
                    border: on ? '1px solid #fca5a5' : '1px solid #fca5a5',
                  }}>
                    {on ? '✅ Registration Open' : '🔒 Registration Closed'}
                  </span>
                  {busy && <span style={{ fontSize: '0.72rem', color: '#888' }}>Updating…</span>}
                </div>

                <div style={{ fontSize: '0.79rem', color: on ? '#7a0002' : '#b91c1c', lineHeight: 1.5 }}>
                  {on
                    ? 'Students can select this slot during registration.'
                    : 'This slot is hidden from the registration dropdown. Students will see "Registration Closed".'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info box */}
      <div style={{
        marginTop: 32, background: '#fffbeb', border: '1.5px solid #fcd34d',
        borderRadius: 10, padding: '14px 18px', fontSize: '0.84rem', color: '#92400e', lineHeight: 1.7
      }}>
        <strong>ℹ️ How it works:</strong><br />
        • When you <strong>close</strong> a slot, it immediately disappears from the registration slot dropdown for students.<br />
        • Students who try to select a closed slot in the dropdown will see it as <em>disabled</em> with &quot;Registration Closed&quot;.<br />
        • This does <strong>not</strong> affect students already registered in that slot — only new registrations are blocked.<br />
        • Re-opening a slot makes it available again instantly.
      </div>
    </div>
  );
}
