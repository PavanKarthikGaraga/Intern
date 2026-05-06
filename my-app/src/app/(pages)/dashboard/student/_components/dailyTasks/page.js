'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { surveyData as SURVEY } from './surveyDataShared';
import { getTemplate } from './caseStudyTemplates';
import { FaCheck, FaLock, FaTimes, FaHourglassHalf, FaPlay, FaClipboardList, FaHandshake, FaChartBar, FaCamera, FaVideo, FaClock, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaCalendarAlt, FaFilePdf } from 'react-icons/fa';
import './dailyTasks.css';

/* ── Slot start dates (IST midnight) ── */
const SLOT_START = {
  1: new Date('2026-05-11T00:00:00+05:30'),
  2: new Date('2026-05-18T00:00:00+05:30'),
  3: new Date('2026-05-25T00:00:00+05:30'),
  4: new Date('2026-06-01T00:00:00+05:30'),
  5: new Date('2026-06-08T00:00:00+05:30'),
  6: new Date('2026-06-15T00:00:00+05:30'),
  7: new Date('2026-06-22T00:00:00+05:30'),
  8: new Date('2026-06-29T00:00:00+05:30'),
  9: new Date('2026-07-06T00:00:00+05:30'),
};

/** Window for the Nth day of the slot */
function dayWindow(slot, dayNum) {
  const start = SLOT_START[slot];
  if (!start) return { open: null, close: null };
  const d = new Date(start);
  d.setDate(d.getDate() + (dayNum - 1));
  
  const open = new Date(d);
  open.setHours(0, 0, 0, 0); // 12:00 am IST
  
  const close = new Date(d);
  close.setHours(23, 59, 59, 999); // 11:59:59 PM IST
  
  return { open, close };
}

/* Offset between server IST epoch and device clock — set once on mount */
let _serverOffset = 0;   // ms
function serverNow() { return Date.now() + _serverOffset; }

function dayLabel(slot, dayNum) {
  const { close } = dayWindow(slot, dayNum);
  if (!close) return '';
  return close.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

const DEMO_ID = '2500099999';

function getDayStatus(dayNum, slot, saved, username, unlockedDays = []) {
  // ── Demo bypass: all days open regardless of date ──
  if (username === DEMO_ID) {
    return saved[dayNum] ? 'submitted' : 'open';
  }
  if (!slot || !SLOT_START[slot]) return 'upcoming';
  
  const { open, close } = dayWindow(slot, dayNum);
  const now = serverNow();   // ← server-authoritative IST time
  const isSubmitted = !!saved[dayNum];
  const isUnlocked = unlockedDays.includes(dayNum);

  if (isSubmitted) return 'submitted';
  if (isUnlocked) return 'unlocked'; // Admin unlocked this day

  // Check previous days first to see if we should cascade lock
  if (dayNum > 1) {
    const prevStatus = getDayStatus(dayNum - 1, slot, saved, username, unlockedDays);
    if (prevStatus === 'missed' || prevStatus === 'locked') return 'locked';
  }

  if (now > close.getTime()) return 'missed';
  if (now < open.getTime()) return 'upcoming';
  
  return 'open';
}

function pillClass(st, active) {
  let c = 'dt-day-pill';
  if (active) c += ' active';
  if (st === 'submitted') c += ' submitted';
  if (st === 'locked')    c += ' locked';
  if (st === 'missed')    c += ' missed';
  if (st === 'upcoming')  c += ' upcoming';
  return c;
}
function pillIcon(st) {
  return st === 'submitted' ? <FaCheck /> : st === 'locked' ? <FaLock /> : st === 'missed' ? <FaTimes /> : st === 'upcoming' ? <FaHourglassHalf /> : <FaPlay />;
}
function wc(text) { return text.trim() === '' ? 0 : text.trim().split(/\s+/).length; }

const DAY_META = [
  { day:1, icon: <FaClipboardList />, title:'Day 1 – Problem Statement Understanding', subtitle:'Write your inference and analysis (minimum 100 words)' },
  { day:2, icon: <FaHandshake />, title:'Day 2 – Stakeholder 1 Survey (8 Persons)',  subtitle:'Interview 8 people from the 1st stakeholder group' },
  { day:3, icon: <FaHandshake />, title:'Day 3 – Stakeholder 2 Survey (3 Persons)',  subtitle:'Interview 3 people from the 2nd stakeholder group' },
  { day:4, icon: <FaHandshake />, title:'Day 4 – Stakeholder 3 Survey (3 Persons)',  subtitle:'Interview 3 people from the 3rd stakeholder group' },
  { day:5, icon: <FaChartBar />, title:'Day 5 – Data Analysis',                     subtitle:'Count responses, calculate percentages & identify insights' },
  { day:6, icon: <FaCamera />, title:'Day 6 – Intervention Activity',             subtitle:'Upload photo documentation from Days 2, 3 & 4' },
  { day:7, icon: <FaVideo />, title:'Day 7 – Documentation & Presentation',      subtitle:'Submit case study report, YouTube video & LinkedIn article' },
];

/* ── Timer bar component ── */
function TimerBar({ openTime, closeTime, status }) {
  const [tick, setTick] = useState('');
  const [mode, setMode] = useState('');

  useEffect(() => {
    if (status === 'unlocked') {
      setMode('unlocked');
      return;
    }
    const update = () => {
      const now = serverNow();
      if (now < openTime) {
        setMode('upcoming');
        const diff = openTime - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTick(`${h}h ${m}m ${s}s`);
      } else if (now <= closeTime) {
        setMode('open');
        const diff = closeTime - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTick(`${h}h ${m}m ${s}s`);
      } else {
        setMode('closed');
        setTick('Submission closed');
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [openTime, closeTime, status]);

  if (mode === 'unlocked') {
    return (
      <div className="dt-timer-bar" style={{ background: '#fff3e0', borderColor: '#ffe0b2' }}>
        <span className="dt-timer-label" style={{ color: '#e65100', display: 'flex', alignItems: 'center', gap: '6px' }}><FaCheckCircle /> Special Access Granted</span>
        <span className="dt-timer-date" style={{ color: '#e65100' }}>Admin has opened this day for submission. No deadline applied.</span>
      </div>
    );
  }

  if (mode === 'upcoming') {
    return (
      <div className="dt-timer-bar">
        <span className="dt-timer-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaClock /> Submission window opens in:</span>
        <span className="dt-timer-count">{tick}</span>
        <span className="dt-timer-date">
          Opens: {new Date(openTime).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:true })}
        </span>
      </div>
    );
  }

  if (mode === 'closed') {
    return null;
  }

  const urgent = (closeTime - serverNow()) < 3 * 3600000 && (closeTime - serverNow()) > 0;
  return (
    <div className="dt-timer-bar">
      <span className="dt-timer-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaClock /> Submission window closes in:</span>
      <span className={`dt-timer-count${urgent ? ' urgent' : ''}`}>{tick}</span>
      <span className="dt-timer-date">
        Deadline: {new Date(closeTime).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:true })}
      </span>
    </div>
  );
}

/* ── Completed bar component ── */
function CompletedBar({ deadline, submittedAt }) {
  const diff = deadline.getTime() - new Date(submittedAt).getTime();
  let text = '';
  if (diff < 0) {
    text = 'Submitted late';
  } else {
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    text = `Completed ${h}h ${m}m before deadline`;
  }
  return (
    <div className="dt-timer-bar" style={{ background: '#e8f5e9', borderColor: '#c8e6c9' }}>
      <span className="dt-timer-label" style={{ color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '6px' }}><FaCheckCircle /> {text}</span>
      <span className="dt-timer-date">
        Submitted: {new Date(submittedAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:true })}
      </span>
    </div>
  );
}

/* ── Lock overlay ── */
function LockedView({ status, dayNum, slot }) {
  const { close } = slot ? dayWindow(slot, dayNum) : { close: null };
  const dateStr = close ? close.toLocaleDateString('en-IN', { day:'numeric', month:'long' }) : '';
  if (status === 'missed') return (
    <div className="dt-locked-overlay missed-lock">
      <div className="lock-icon" style={{ fontSize: '2.5rem', marginBottom: '10px' }}><FaTimesCircle /></div>
      <h3>Submission Window Closed</h3>
      <p>The deadline for Day {dayNum} ({dateStr}) passed without a submission.<br/>This day is permanently locked.</p>
    </div>
  );
  if (status === 'locked') return (
    <div className="dt-locked-overlay missed-lock">
      <div className="lock-icon" style={{ fontSize: '2.5rem', marginBottom: '10px' }}><FaLock /></div>
      <h3>Day {dayNum} Locked</h3>
      <p>A previous day was not submitted in time. All subsequent days are locked.<br/>Please contact your mentor.</p>
    </div>
  );
  return (
    <div className="dt-locked-overlay">
      <div className="lock-icon" style={{ fontSize: '2.5rem', marginBottom: '10px' }}><FaHourglassHalf /></div>
      <h3>Day {dayNum} Not Yet Available</h3>
      <p>This day&apos;s submission window has not opened yet.</p>
    </div>
  );
}

/* ── Main component ── */
export default function DailyTasks({ studentData }) {
  const [activeDay, setActiveDay] = useState(null);
  const [saved, setSaved]     = useState({});
  const [draft, setDraft]     = useState({});
  const [unlockedDays, setUnlockedDays] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [msgType, setMsgType] = useState('ok');

  const ps       = studentData?.problemStatementData?.problem_statement || null;
  const slot     = studentData?.slot || null;
  const username = studentData?.username || null;
  const survey   = ps ? (SURVEY[ps] || null) : null;

  useEffect(() => {
    (async () => {
      try {
        // 1. Fetch server time first to anchor all deadline checks
        const timeRes = await fetch('/api/time');
        const timeJson = await timeRes.json();
        _serverOffset = timeJson.ts - Date.now();  // may be +/- a few ms

        // 2. Fetch saved tasks
        const res  = await fetch('/api/dashboard/student/daily-tasks');
        const json = await res.json();
        const tasks = (json.success && json.tasks) ? json.tasks : {};
        const unlocked = (json.success && json.unlockedDays) ? json.unlockedDays : [];
        setSaved(tasks);
        setUnlockedDays(unlocked);
        
        const firstOpen = [1,2,3,4,5,6,7].find(d => {
          const st = getDayStatus(d, slot, tasks, username, unlocked);
          return st === 'open' || st === 'submitted' || st === 'unlocked';
        });
        setActiveDay(firstOpen || 1);
      } catch { setActiveDay(1); }
    })();
  }, [slot, username]);

  const dayData = useCallback((day) => ({
    ...(saved[day]?.data || {}),
    ...(draft[day]  || {}),
  }), [saved, draft]);

  const setDayField = (day, field, value) => {
    setDraft(prev => ({ ...prev, [day]: { ...(prev[day] || {}), [field]: value } }));
    setMsg('');
  };

  const handleSave = async () => {
    const data = dayData(activeDay);
    if (activeDay === 1 && wc(data.inference || '') < 100) {
      setMsg(`Need at least 100 words (currently ${wc(data.inference||'')})`);
      setMsgType('err'); return;
    }
    if ([2, 3, 4].includes(activeDay)) {
      const pCount = activeDay === 2 ? 8 : 3;
      const sh = survey[activeDay - 2];
      const qCount = sh?.questions?.length || 0;
      
      for (let p = 1; p <= pCount; p++) {
        const pd = data[`p${p}`] || {};
        const ansCount = Object.keys(pd.answers || {}).length;
        if (!pd.name?.trim() || ansCount < qCount) {
          setMsg(`Please complete all questions and names for all ${pCount} persons before submitting.`);
          setMsgType('err');
          return;
        }
      }
    }
    if (activeDay === 5) {
      if (wc(data.analysis || '') < 50 || wc(data.rootcause || '') < 50 || wc(data.strategy || '') < 50) {
        setMsg(`Need at least 50 words for each section. (Analysis: ${wc(data.analysis||'')}, Root Causes: ${wc(data.rootcause||'')}, Strategy: ${wc(data.strategy||'')})`);
        setMsgType('err'); return;
      }
    }
    setSaving(true);
    try {
      const res  = await fetch('/api/dashboard/student/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: activeDay, data }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(prev => ({ ...prev, [activeDay]: { data } }));
        setDraft(prev => { const n = { ...prev }; delete n[activeDay]; return n; });
        setMsg('✓ Saved successfully!'); setMsgType('ok');
      } else { setMsg(json.error || 'Save failed'); setMsgType('err'); }
    } catch { setMsg('Network error'); setMsgType('err'); }
    finally { setSaving(false); }
  };

  if (!ps) return (
    <div className="dt-wrap">
      <div className="dt-no-ps">
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FaExclamationTriangle /> Problem Statement Not Selected</h3>
        <p>Please select your Problem Statement in the Overview section first.</p>
      </div>
    </div>
  );

  if (activeDay === null) return <div className="dt-wrap"><p style={{color:'#888'}}>Loading…</p></div>;

  const statuses    = Object.fromEntries([1,2,3,4,5,6,7].map(d => [d, getDayStatus(d, slot, saved, username, unlockedDays)]));
  const meta        = DAY_META[activeDay - 1];
  const activeStatus = statuses[activeDay];
  const isSaved     = activeStatus === 'submitted' && !draft[activeDay];
  // Editable if open or unlocked
  const isEditable  = activeStatus === 'open' || activeStatus === 'unlocked';

  return (
    <div className="dt-wrap">
      <div className="dt-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaCalendarAlt /> Daily Tasks</h2>
          <p>Problem Statement: <strong>{ps}</strong>
            {slot && <span style={{marginLeft:8,fontSize:'0.8rem',color:'#888'}}>· Slot {slot}</span>}
          </p>
        </div>
      </div>

      {/* Timer moved above timeline */}
      {isSaved ? (
        <CompletedBar deadline={slot ? dayWindow(slot, activeDay).close : new Date()} submittedAt={saved[activeDay]?.submittedAt} />
      ) : activeStatus === 'open' || activeStatus === 'upcoming' ? (
        <TimerBar openTime={dayWindow(slot, activeDay).open} closeTime={dayWindow(slot, activeDay).close} status={activeStatus} />
      ) : activeStatus === 'unlocked' ? (
        <TimerBar openTime={null} closeTime={null} status="unlocked" />
      ) : null}

      {/* Timeline pills */}
      <div className="dt-timeline">
        {DAY_META.map(m => {
          const st = statuses[m.day];
          // Can click if it's not upcoming
          const canClick = st !== 'upcoming';
          return (
            <button
              key={m.day}
              className={pillClass(st, activeDay === m.day)}
              onClick={() => canClick && setActiveDay(m.day)}
              title={`${slot ? dayLabel(slot, m.day) + ' · ' : ''}${st}`}
            >
              <span className="dt-pill-icon">{pillIcon(st)}</span>
              Day {m.day}
              {slot && <span style={{fontSize:'0.72rem',opacity:0.8}}> · {dayLabel(slot, m.day)}</span>}
            </button>
          );
        })}
      </div>

      {/* Countdown timer moved to header */}

      {/* Day card */}
      <div className="dt-card">
        <div className="dt-card-head">
          <span className="day-icon">{meta.icon}</span>
          <div>
            <h3>{meta.title}</h3>
            <p>{meta.subtitle}</p>
            {slot && <p className="dt-day-date" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaCalendarAlt /> {dayLabel(slot, activeDay)} · Closes 11:59 PM IST</p>}
          </div>
        </div>
        <div className="dt-card-body">
          {(activeStatus === 'locked' || activeStatus === 'missed' || activeStatus === 'upcoming')
            ? <LockedView status={activeStatus} dayNum={activeDay} slot={slot} />
            : (
              <>
                {activeDay === 1 && <Day1 data={dayData(1)} onChange={(f,v) => setDayField(1,f,v)} ps={ps} readOnly={isSaved} />}
                {activeDay === 2 && <DaySurvey day={2} personCount={8} stakeholderIdx={0} survey={survey} data={dayData(2)} onChange={(f,v) => setDayField(2,f,v)} readOnly={isSaved} onFinalSubmit={handleSave} saving={saving} />}
                {activeDay === 3 && <DaySurvey day={3} personCount={3} stakeholderIdx={1} survey={survey} data={dayData(3)} onChange={(f,v) => setDayField(3,f,v)} readOnly={isSaved} onFinalSubmit={handleSave} saving={saving} />}
                {activeDay === 4 && <DaySurvey day={4} personCount={3} stakeholderIdx={2} survey={survey} data={dayData(4)} onChange={(f,v) => setDayField(4,f,v)} readOnly={isSaved} onFinalSubmit={handleSave} saving={saving} />}
                {activeDay === 5 && <Day5 saved={saved} survey={survey} data={dayData(5)} onChange={(f,v) => setDayField(5,f,v)} readOnly={isSaved} />}
                {activeDay === 6 && <Day6 data={dayData(6)} onChange={(f,v) => setDayField(6,f,v)} readOnly={isSaved} />}
                {activeDay === 7 && <Day7 data={dayData(7)} onChange={(f,v) => setDayField(7,f,v)} readOnly={isSaved} studentData={studentData} />}

                {activeDay !== 2 && activeDay !== 3 && activeDay !== 4 && (
                  <div className="dt-save-row">
                    <button className="dt-save-btn" onClick={handleSave} disabled={saving || isSaved || !isEditable}>
                      {saving ? 'Saving…' : isSaved ? '✓ Submitted' : '💾 Save & Submit'}
                    </button>
                    {isSaved && <span style={{fontSize:'0.82rem',color:'#888'}}>Submitted — view only</span>}
                    {msg && <span className={`dt-save-msg ${msgType}`}>{msg}</span>}
                  </div>
                )}
              </>
            )
          }
        </div>
      </div>
    </div>
  );
}

/* ── Report Generator Component ── */
function ReportGenerator({ day, stakeholder, readOnly }) {
  const ro = { background: readOnly ? '#f9f9f9' : undefined };
  const [entries, setEntries] = useState([{ id: Date.now(), image: null, date: '', description: '' }]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newEntries = [...entries];
        newEntries[index].image = reader.result;
        setEntries(newEntries);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFieldChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const addEntry = () => {
    setEntries([...entries, { id: Date.now() + Math.random(), image: null, date: '', description: '' }]);
  };

  const removeEntry = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
  };

  const generatePDF = async () => {
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (!e.image || !e.date || !e.description?.trim()) {
        alert(`Please complete Entry ${i + 1} (Image, Date, and Description are all mandatory).`);
        return;
      }
    }

    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const drawBorders = () => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, pageWidth - 10, pageHeight - 10);
      };

      let yOffset = 25;
      drawBorders();

      // Heading: Day-X Report
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      const title = `Day-${day} Report`;
      doc.text(title, pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 12;
      
      // Stakeholder Category: Bold and Underlined
      doc.setFontSize(14);
      const shText = `Stakeholder: ${stakeholder}`;
      const shWidth = doc.getTextWidth(shText);
      doc.text(shText, pageWidth / 2, yOffset, { align: 'center' });
      doc.line((pageWidth / 2) - (shWidth / 2), yOffset + 1, (pageWidth / 2) + (shWidth / 2), yOffset + 1);
      
      doc.setFont('helvetica', 'normal');
      yOffset += 15;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (i > 0 && i % 2 === 0) {
          doc.addPage();
          drawBorders();
          yOffset = 20;
        }

        if (entry.image) {
          doc.addImage(entry.image, 'JPEG', 25, yOffset, 160, 80);
        }
        
        yOffset += 88;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Date: ${entry.date}`, 25, yOffset);
        yOffset += 7;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const splitDesc = doc.splitTextToSize(`Description: ${entry.description}`, 160);
        doc.text(splitDesc, 25, yOffset);
        yOffset += (splitDesc.length * 6) + 15;
      }

      doc.save(`Day_${day}_Report.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Error generating PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginTop: 32, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 10, color: '#1e293b', fontSize: '1.1rem' }}>
        <FaClipboardList style={{ color: '#014a01' }} /> Day-{day} Auto Document Generator
      </h4>
      <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: 20 }}>
        Capture and document your interactions. This tool will generate a professional PDF report with borders for your Day-{day} activities.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {entries.map((entry, index) => (
          <div key={entry.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18, position: 'relative', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <div style={{ fontWeight: 600, marginBottom: 16, display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
              <span>Interaction Photo {index + 1}</span>
              {entries.length > 1 && !readOnly && (
                <button onClick={() => removeEntry(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 500 }}>
                  <FaTimes /> Remove
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
              <div>
                {entry.image ? (
                  <div style={{ width: '100%', height: 130, position: 'relative', overflow: 'hidden', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                    <Image src={entry.image} alt="preview" fill style={{ objectFit: 'cover' }} unoptimized />
                  </div>
                ) : (
                  <div style={{ width: '100%', height: 130, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '2px dashed #cbd5e1', fontSize: '0.85rem' }}>
                    Photo Required
                  </div>
                )}
                {!readOnly && (
                  <label style={{ display: 'block', marginTop: 10, padding: '6px 12px', background: '#f1f5f9', borderRadius: 6, cursor: 'pointer', textAlign: 'center', fontSize: '0.8rem', color: '#475569', fontWeight: 500, border: '1px solid #cbd5e1' }}>
                    Upload Image
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(index, e)} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Date</label>
                  <input type="date" value={entry.date} onChange={(e) => handleFieldChange(index, 'date', e.target.value)} readOnly={readOnly} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', ...ro }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Short Description</label>
                  <textarea placeholder="e.g. Discussing problem statement with stakeholder..." value={entry.description} onChange={(e) => handleFieldChange(index, 'description', e.target.value)} readOnly={readOnly} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', minHeight: 70, resize: 'none', outline: 'none', fontSize: '0.9rem', ...ro }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {!readOnly && (
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={addEntry} style={{ padding: '12px 20px', borderRadius: 8, border: '1px solid #014a01', background: '#fff', color: '#014a01', fontWeight: 600, cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
            + Add Another Entry
          </button>
          <button onClick={generatePDF} disabled={isGenerating} style={{ padding: '12px 20px', borderRadius: 8, border: 'none', background: '#014a01', color: '#fff', fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer', flex: 1, opacity: isGenerating ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            {isGenerating ? 'Generating...' : <>📥 Download Day-{day} PDF</>}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Day 1 ── */
function Day1({ data, onChange, ps, readOnly }) {
  const text  = data.inference || '';
  const words = wc(text);
  return (
    <div>
      <div className="dt-info-box" style={{ marginBottom: 16 }}>
        <h4>Task: Problem Statement Understanding</h4>
        <ul>
          <li>Read your problem statement carefully: <strong>{ps}</strong></li>
          <li>Research using internet, books, or local observation</li>
          <li>Write your inference and analysis — <strong>minimum 100 words</strong></li>
          <li>Cover: what the problem is, why it exists, who is affected, and possible root causes</li>
        </ul>
      </div>
      <div className="dt-textarea-wrap">
        <label htmlFor="day1-inference">Your Inference &amp; Analysis</label>
        <textarea
          id="day1-inference" className="dt-textarea"
          placeholder="Write your understanding of the problem statement here…"
          value={text} readOnly={readOnly}
          onChange={e => !readOnly && onChange('inference', e.target.value)}
          style={readOnly ? { background:'#f9f9f9', color:'#555' } : {}}
        />
        <p className={`dt-word-count ${words >= 100 ? 'ok' : words > 60 ? 'warn' : ''}`}>
          {words} / 100 words minimum {words >= 100 ? '✓' : ''}
        </p>
      </div>
    </div>
  );
}

/* ── Days 2/3/4 – Survey ── */
function DaySurvey({ day, personCount, stakeholderIdx, survey, data, onChange, readOnly, onFinalSubmit, saving }) {
  const [activePerson, setActivePerson] = useState(1);
  if (!survey) return <div className="dt-info-box"><h4>Survey data not available</h4><p>No questions found for your problem statement. Contact admin.</p></div>;

  const sh = survey[stakeholderIdx];
  if (!sh) return <p>Stakeholder not found.</p>;

  const persons = Array.from({ length: personCount }, (_, i) => i + 1);
  const pk = (p) => `p${p}`;
  const pd = (p) => data[pk(p)] || { name: '', answers: {} };
  const isFilled = (p) => { const d = pd(p); return d.name?.trim() && Object.keys(d.answers||{}).length === sh.questions.length; };

  const setField = (p, field, value) => {
    if (readOnly) return;
    const cur = data[pk(p)] || { name:'', answers:{} };
    onChange(pk(p), { ...cur, [field]: value });
  };
  const setAnswer = (p, qi, val) => {
    if (readOnly) return;
    const cur = data[pk(p)] || { name:'', answers:{} };
    onChange(pk(p), { ...cur, answers: { ...(cur.answers||{}), [qi]: val } });
  };

  const cur = pd(activePerson);
  return (
    <div>
      <div className="dt-sh-banner">
        <span className="sh-tag">{sh.stakeholder}</span>
        <p>Interview {personCount} people. Enter each person&apos;s name and record Yes/No responses.</p>
      </div>
      <p className="dt-persons-label">Select Person:</p>
      <div className="dt-person-tabs">
        {persons.map(p => (
          <button key={p} className={`dt-person-btn ${activePerson===p?'active':''} ${isFilled(p)?'filled':''}`}
            onClick={() => setActivePerson(p)}>
            Person {p} {isFilled(p) ? '✓' : ''}
          </button>
        ))}
      </div>
      <div className="dt-name-wrap">
        <label htmlFor={`n-d${day}-p${activePerson}`}>Name of Person {activePerson}</label>
        <input id={`n-d${day}-p${activePerson}`} type="text" className="dt-name-input"
          placeholder="Enter interviewee&apos;s name" value={cur.name||''} readOnly={readOnly}
          onChange={e => setField(activePerson, 'name', e.target.value)}
          style={readOnly ? {background:'#f9f9f9'} : {}} />
      </div>
      <ul className="dt-questions">
        {sh.questions.map((q, qi) => {
          const ans = cur.answers?.[qi];
          return (
            <li key={qi} className="dt-q-item">
              <p className="dt-q-text">{qi+1}. {q}</p>
              <div className="dt-q-btns">
                <button className={`dt-q-btn yes ${ans==='Yes'?'sel':''}`}
                  onClick={() => setAnswer(activePerson, qi, 'Yes')} disabled={readOnly}>Yes</button>
                <button className={`dt-q-btn no ${ans==='No'?'sel':''}`}
                  onClick={() => setAnswer(activePerson, qi, 'No')} disabled={readOnly}>No</button>
                {ans && !readOnly && (
                  <button className="dt-q-btn clear"
                    onClick={() => {
                      const currentAnswers = { ...cur.answers };
                      delete currentAnswers[qi];
                      const currentPersonData = data[pk(activePerson)] || { name:'', answers:{} };
                      onChange(pk(activePerson), { ...currentPersonData, answers: currentAnswers });
                    }}>Clear</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      
      {!readOnly && (
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {activePerson < personCount && (
            <button className="dt-save-btn" onClick={() => {
              if (isFilled(activePerson)) setActivePerson(activePerson + 1);
              else alert('Please complete all questions and the name for this person first.');
            }} style={{ background: '#1a7a1a' }}>
              Save Person & Next
            </button>
          )}
          {persons.every(p => isFilled(p)) && (
            <button className="dt-save-btn" onClick={() => {
              if (window.confirm("Are you sure you want to submit all responses for evaluation? This cannot be undone.")) {
                 onFinalSubmit();
              }
            }} disabled={saving}>
              {saving ? 'Submitting...' : 'Submit All Responses for Evaluation'}
            </button>
          )}
        </div>
      )}

      {/* Added Report Generator for documentation */}
      <ReportGenerator day={day} stakeholder={sh.stakeholder} readOnly={readOnly} />
    </div>
  );
}

/* ── Day 5 – Analysis ── */
function Day5({ saved, survey, data, onChange, readOnly }) {
  if (!survey) return <div className="dt-info-box"><h4>Survey data unavailable</h4></div>;
  const analyses = [2,3,4].map(day => {
    const sh = survey[day-2];
    if (!sh) return null;
    const dd = saved[day]?.data || {};
    const persons = Object.keys(dd).filter(k => k.startsWith('p'));
    const stats = sh.questions.map((q, qi) => {
      let yes=0, no=0;
      persons.forEach(pk => { const a = dd[pk]?.answers?.[qi]; if (a==='Yes') yes++; else if (a==='No') no++; });
      const total = yes+no;
      return { q, yes, no, total, yesPct: total>0 ? Math.round((yes/total)*100) : 0 };
    });
    return { sh, day, persons, stats };
  }).filter(Boolean);

  if (analyses.every(a => a.persons.length===0)) return (
    <div className="dt-info-box">
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FaChartBar /> Data Analysis</h4>
      <p>No survey data yet. Complete Days 2, 3, and 4 first to proceed with Day 5.</p>
    </div>
  );

  return (
    <div>
      <div className="dt-analysis-info" style={{ marginBottom: 24, padding: 16, background: '#e3f2fd', color: '#0d47a1', borderRadius: 8 }}>
        <strong>Task:</strong> Review the Yes/No responses below from your surveys on Days 2, 3 &amp; 4. Use this data to write your analysis and identify root causes.
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 30 }}>
        {analyses.map(({ sh, day, persons, stats }) => (
          <div key={day} className="dt-sh-analysis" style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 10, padding: 16 }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#1a1a1a', borderBottom: '2px solid #e0e0e0', paddingBottom: 8 }}>
              Day {day} Responses – {sh.stakeholder} ({persons.length} persons)
            </h4>
            {persons.length===0
              ? <p style={{color:'#888',fontSize:'0.88rem'}}>No data for this day yet.</p>
              : stats.map(({ q, yes, no, yesPct }, qi) => (
                <div key={qi} className="dt-q-stat" style={{ marginBottom: 12 }}>
                  <span className="q-label" style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    {qi+1}. {q.replace(' (Yes/No)','')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="dt-bar-wrap" style={{ flex: 1, height: 8, background: '#e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
                      <div className="dt-bar-yes" style={{ width:`${yesPct}%`, height: '100%', background: '#014a01' }} />
                    </div>
                    <span className="dt-pct" style={{ fontWeight: 700, color: '#014a01', minWidth: 60 }}>{yesPct}% Yes</span>
                    <span style={{ fontSize:'0.8rem', color:'#666', minWidth: 60 }}>({yes}Y / {no}N)</span>
                  </div>
                </div>
              ))
            }
          </div>
        ))}
      </div>

      <div className="dt-info-box" style={{ marginBottom: 16 }}>
        <h4>Your Analysis</h4>
        <p style={{ fontSize: '0.88rem', color: '#555', marginTop: 4 }}>Based on the data above, please provide your own analysis.</p>
      </div>
      
      <div className="dt-textarea-wrap" style={{ marginBottom: 20 }}>
        <label htmlFor="day5-analysis">1. Overall Analysis of Responses</label>
        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8, marginTop: -4 }}>What are the main findings from your survey data? (Minimum 50 words)</p>
        <textarea
          id="day5-analysis" className="dt-textarea"
          placeholder="Write your overall analysis here..."
          value={data.analysis || ''} readOnly={readOnly}
          onChange={e => !readOnly && onChange('analysis', e.target.value)}
          style={readOnly ? { background:'#f9f9f9', color:'#555', minHeight: 120 } : { minHeight: 120 }}
        />
      </div>

      <div className="dt-textarea-wrap" style={{ marginBottom: 20 }}>
        <label htmlFor="day5-rootcause">2. Identified Root Causes</label>
        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8, marginTop: -4 }}>What are the root causes of the problem based on the highest &apos;Yes&apos; percentages? (Minimum 50 words)</p>
        <textarea
          id="day5-rootcause" className="dt-textarea"
          placeholder="Write the identified root causes here..."
          value={data.rootcause || ''} readOnly={readOnly}
          onChange={e => !readOnly && onChange('rootcause', e.target.value)}
          style={readOnly ? { background:'#f9f9f9', color:'#555', minHeight: 120 } : { minHeight: 120 }}
        />
      </div>

      <div className="dt-textarea-wrap">
        <label htmlFor="day5-strategy">3. Proposed Intervention Strategy</label>
        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8, marginTop: -4 }}>How do you plan to address these root causes during Day 6? (Minimum 50 words)</p>
        <textarea
          id="day5-strategy" className="dt-textarea"
          placeholder="Write your proposed strategy here..."
          value={data.strategy || ''} readOnly={readOnly}
          onChange={e => !readOnly && onChange('strategy', e.target.value)}
          style={readOnly ? { background:'#f9f9f9', color:'#555', minHeight: 120 } : { minHeight: 120 }}
        />
      </div>
    </div>
  );
}

/* ── Day 6 ── */
function Day6({ data, onChange, readOnly }) {
  const ro = { background: readOnly ? '#f9f9f9' : undefined };
  return (
    <div>
      <div className="dt-info-box" style={{marginBottom:18}}>
        <h4>Task: Intervention Activity Documentation</h4>
        <ul>
          <li>Use the <strong>Day-2, Day-3 and Day-4 Report generators</strong> to compile your photos and interactions.</li>
          <li>Upload all generated PDFs to a single Google Drive folder.</li>
          <li>Ensure the folder/files are <strong>publicly viewable</strong>.</li>
        </ul>
      </div>

      <div className="dt-warning-box">⚠️ Set sharing to <strong>&quot;Anyone with the link can view&quot;</strong>. Private links will NOT be evaluated.</div>
      <div className="dt-link-section">
        <label htmlFor="d6-link">Google Drive Public Link</label>
        <p>Paste the shareable link to your reports folder here.</p>
        <input id="d6-link" type="url" className="dt-link-input" placeholder="https://drive.google.com/…"
          value={data.driveLink||''} readOnly={readOnly} style={ro}
          onChange={e => !readOnly && onChange('driveLink', e.target.value)} />
      </div>
      <div className="dt-textarea-wrap">
        <label htmlFor="d6-notes">Brief Description of Intervention Activity</label>
        <textarea id="d6-notes" className="dt-textarea" style={{minHeight:100,...ro}}
          placeholder="Summarize your intervention activity and key observations here…"
          value={data.notes||''} readOnly={readOnly}
          onChange={e => !readOnly && onChange('notes', e.target.value)} />
      </div>
    </div>
  );
}

/* ── Case Study Generator ── */
function CaseStudyGenerator({ studentData, readOnly }) {
  const domain   = studentData?.selectedDomain || '';
  const template = getTemplate(domain);
  const [answers, setAnswers] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);

  const setAns = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

  const inputStyle = (ro) => ({
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.88rem',
    background: ro ? '#f9f9f9' : '#fff', resize: 'vertical',
  });

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const PW = doc.internal.pageSize.getWidth();
      const PH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = PW - margin * 2;
      let y = margin + 10;

      const drawBorder = () => {
        doc.setDrawColor(30, 60, 30);
        doc.setLineWidth(0.8);
        doc.rect(8, 8, PW - 16, PH - 16);
        doc.setLineWidth(0.3);
        doc.rect(10, 10, PW - 20, PH - 20);
      };

      const checkNewPage = (neededH = 20) => {
        if (y + neededH > PH - margin - 5) {
          doc.addPage();
          drawBorder();
          y = margin + 10;
        }
      };

      const writeText = (text, fontSize, style, color, indent = 0, lineH = 6) => {
        doc.setFontSize(fontSize);
        doc.setFont('times', style);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, contentW - indent);
        checkNewPage(lines.length * lineH + 4);
        doc.text(lines, margin + indent, y);
        y += lines.length * lineH;
      };

      // ── Page 1: Title page ────────────────────────────────────
      drawBorder();

      // Institution header
      doc.setFontSize(11);
      doc.setFont('times', 'bold');
      doc.setTextColor(40, 80, 40);
      doc.text('KALASALINGAM ACADEMY OF RESEARCH AND EDUCATION', PW / 2, y, { align: 'center' });
      y += 7;
      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('(Deemed to be University under Section 3 of UGC Act 1956)', PW / 2, y, { align: 'center' });
      y += 7;

      // Divider
      doc.setDrawColor(30, 80, 30);
      doc.setLineWidth(0.5);
      doc.line(margin, y, PW - margin, y);
      y += 10;

      // Main title
      doc.setFontSize(16);
      doc.setFont('times', 'bold');
      doc.setTextColor(20, 60, 20);
      const titleLines = doc.splitTextToSize(template.title, contentW);
      doc.text(titleLines, PW / 2, y, { align: 'center' });
      y += titleLines.length * 9 + 8;

      // Domain badge
      doc.setFontSize(11);
      doc.setFont('times', 'bolditalic');
      doc.setTextColor(60, 100, 60);
      doc.text(`Domain: ${domain || 'General'}`, PW / 2, y, { align: 'center' });
      y += 7;
      doc.setDrawColor(30, 80, 30);
      doc.setLineWidth(0.4);
      doc.line(margin, y, PW - margin, y);
      y += 14;

      // Basic student info from auto-fill
      const infoItems = [
        ['Student Name', studentData?.name || answers['Student Name'] || '________________'],
        ['Roll Number',  studentData?.username || answers['Roll Number'] || '________________'],
        ['Village/Area', answers['Village/Area'] || answers['Village/Area:'] || '________________'],
        ['District',     answers['District'] || '________________'],
        ['Domain',       domain || '________________'],
        ['Duration',     '7 Days'],
      ];
      doc.setFontSize(11);
      for (const [k, v] of infoItems) {
        checkNewPage(8);
        doc.setFont('times', 'bold');
        doc.setTextColor(40, 40, 40);
        doc.text(`${k}:`, margin, y);
        doc.setFont('times', 'normal');
        doc.setTextColor(20, 20, 20);
        doc.text(v, margin + 45, y);
        y += 8;
      }
      y += 6;

      // ── Content sections ─────────────────────────────────────
      for (const section of template.sections) {
        // Skip basic info section — already rendered on title page
        if (section.heading.startsWith('1.')) continue;

        checkNewPage(16);

        // Section heading
        doc.setFontSize(12);
        doc.setFont('times', 'bold');
        doc.setTextColor(20, 60, 20);
        doc.text(section.heading, margin, y);
        // underline the heading
        const hw = doc.getTextWidth(section.heading);
        doc.setDrawColor(20, 60, 20);
        doc.setLineWidth(0.35);
        doc.line(margin, y + 1, margin + hw, y + 1);
        y += 8;

        // Data Analysis table
        if (section.tableHeaders) {
          const colW = contentW / section.tableHeaders.length;
          const cellH = 8;

          // Header row
          checkNewPage(cellH + 2);
          doc.setFillColor(220, 240, 220);
          doc.rect(margin, y, contentW, cellH, 'F');
          doc.setDrawColor(100, 140, 100);
          doc.setLineWidth(0.3);
          section.tableHeaders.forEach((h, i) => {
            doc.rect(margin + i * colW, y, colW, cellH);
            doc.setFont('times', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(20, 60, 20);
            doc.text(h, margin + i * colW + 2, y + 5.5);
          });
          y += cellH;

          // Data rows
          for (const row of section.tableRows) {
            checkNewPage(cellH + 1);
            doc.setFillColor(250, 255, 250);
            doc.rect(margin, y, contentW, cellH, 'F');
            section.tableHeaders.forEach((_, i) => {
              doc.setDrawColor(160, 200, 160);
              doc.rect(margin + i * colW, y, colW, cellH);
              if (i === 0) {
                doc.setFont('times', 'bold');
                doc.setFontSize(9);
                doc.setTextColor(40, 40, 40);
                doc.text(row, margin + i * colW + 2, y + 5.5);
              }
            });
            y += cellH;
          }
          y += 5;
          continue;
        }

        // Regular fields
        for (const field of (section.fields || [])) {
          const key = `${section.heading}__${field}`;
          const val = answers[key] || '';
          checkNewPage(12);
          doc.setFontSize(10);
          doc.setFont('times', 'bold');
          doc.setTextColor(50, 50, 50);
          doc.text(`${field}:`, margin + 3, y);
          y += 6;
          if (val.trim()) {
            doc.setFont('times', 'normal');
            doc.setTextColor(20, 20, 20);
            const vlines = doc.splitTextToSize(val, contentW - 6);
            checkNewPage(vlines.length * 5.5);
            doc.text(vlines, margin + 6, y);
            y += vlines.length * 5.5 + 2;
          } else {
            // blank lines placeholder
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.2);
            for (let l = 0; l < 2; l++) {
              doc.line(margin + 6, y + l * 6, margin + contentW - 6, y + l * 6);
            }
            y += 14;
          }
        }
        y += 4;
      }

      // Footer on all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setFont('times', 'italic');
        doc.setTextColor(120, 120, 120);
        doc.text(
          `KARE Internship 2026  |  ${template.title}  |  Page ${p} of ${totalPages}`,
          PW / 2, PH - 11, { align: 'center' }
        );
      }

      doc.save(`Case_Study_${domain.replace(/\s+/g, '_') || 'Report'}.pdf`);
    } catch (err) {
      console.error('PDF error', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%)',
      border: '1.5px solid #b2dfdb', borderRadius: 14, padding: 28, marginTop: 32,
      boxShadow: '0 4px 24px 0 rgba(1,74,1,0.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <FaFilePdf style={{ color: '#014a01', fontSize: '1.4rem' }} />
        <h4 style={{ margin: 0, color: '#014a01', fontSize: '1.15rem', fontWeight: 700 }}>
          Case Study Report Generator
        </h4>
      </div>
      <p style={{ fontSize: '0.88rem', color: '#4a6b4a', marginBottom: 22 }}>
        Domain: <strong>{domain || 'Not assigned'}</strong> — Fill in the fields below and click
        <strong> Download PDF</strong> to generate your professionally formatted case study report.
      </p>

      {/* Sections */}
      {template.sections.map((section) => (
        <div key={section.heading} style={{
          background: '#fff', border: '1px solid #c8e6c9', borderRadius: 10,
          padding: '18px 20px', marginBottom: 18,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          <h5 style={{
            margin: '0 0 14px 0', color: '#014a01', fontSize: '0.97rem',
            borderBottom: '1px solid #e0f2e9', paddingBottom: 8,
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            {section.heading}
          </h5>

          {/* Table section */}
          {section.tableHeaders ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#e8f5e9' }}>
                    {section.tableHeaders.map(h => (
                      <th key={h} style={{ border: '1px solid #b2dfdb', padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: '#014a01' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.tableRows.map(row => (
                    <tr key={row}>
                      <td style={{ border: '1px solid #c8e6c9', padding: '6px 10px', fontWeight: 600, color: '#333' }}>{row}</td>
                      {section.tableHeaders.slice(1).map((h) => (
                        <td key={h} style={{ border: '1px solid #c8e6c9', padding: 0 }}>
                          <input
                            type="text"
                            readOnly={readOnly}
                            value={answers[`${section.heading}__${row}__${h}`] || ''}
                            onChange={e => setAns(`${section.heading}__${row}__${h}`, e.target.value)}
                            style={{ width: '100%', border: 'none', padding: '6px 8px', outline: 'none', background: readOnly ? '#f9f9f9' : '#fff', fontSize: '0.85rem' }}
                            placeholder="—"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Regular fields */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {section.fields.map(field => {
                const key = `${section.heading}__${field}`;
                return (
                  <div key={field}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#2e7d32', display: 'block', marginBottom: 4 }}>
                      {field}
                    </label>
                    <textarea
                      rows={2}
                      readOnly={readOnly}
                      value={answers[key] || ''}
                      onChange={e => setAns(key, e.target.value)}
                      placeholder={`Enter ${field.toLowerCase()}…`}
                      style={inputStyle(readOnly)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {!readOnly && (
        <button
          onClick={generatePDF}
          disabled={isGenerating}
          style={{
            marginTop: 8, padding: '13px 28px', borderRadius: 10, border: 'none',
            background: isGenerating ? '#9e9e9e' : 'linear-gradient(135deg, #014a01, #1b7a1b)',
            color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: isGenerating ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(1,74,1,0.25)',
            transition: 'all 0.2s'
          }}
        >
          <FaFilePdf />
          {isGenerating ? 'Generating PDF…' : '⬇ Download Case Study PDF'}
        </button>
      )}
    </div>
  );
}

/* ── Day 7 ── */
function Day7({ data, onChange, readOnly, studentData }) {
  const ro = { background: readOnly ? '#f9f9f9' : undefined };
  return (
    <div>
      <div className="dt-info-box" style={{marginBottom:18}}>
        <h4>Task: Documentation &amp; Presentation</h4>
        <ul>
          <li><strong>Case Study Report:</strong> Use the generator below to auto-fill and download your domain-specific report as a PDF. Then upload it to Google Docs/Drive.</li>
          <li><strong>Presentation Video:</strong> PowerPoint + face recording + voiceover.</li>
          <li>Upload video to <strong>YouTube</strong> and write a <strong>LinkedIn Article</strong>.</li>
          <li>Your LinkedIn article MUST include your key findings and embed both your presentation video and article links.</li>
          <li>Submit all three links below.</li>
        </ul>
      </div>

      {/* Case Study Generator */}
      <CaseStudyGenerator studentData={studentData} readOnly={readOnly} />

      <div className="dt-link-section" style={{marginTop: 28}}>
        <label htmlFor="d7-cs">Case Study Document Public Link</label>
        <p>After downloading the PDF above, upload it to Google Drive and paste the shareable link here.</p>
        <input id="d7-cs" type="url" className="dt-link-input" placeholder="https://docs.google.com/…"
          value={data.caseStudyLink||''} readOnly={readOnly} style={ro}
          onChange={e => !readOnly && onChange('caseStudyLink', e.target.value)} />
      </div>
      <div className="dt-link-section">
        <label htmlFor="d7-yt">Presentation Video – YouTube Link</label>
        <p>Upload face + PowerPoint + voiceover video to YouTube (unlisted or public).</p>
        <input id="d7-yt" type="url" className="dt-link-input" placeholder="https://youtube.com/…"
          value={data.youtubeLink||''} readOnly={readOnly} style={ro}
          onChange={e => !readOnly && onChange('youtubeLink', e.target.value)} />
      </div>
      <div className="dt-link-section">
        <label htmlFor="d7-li">LinkedIn Article Link</label>
        <p>Write an article with key findings and embed your video link, then paste the article URL here.</p>
        <input id="d7-li" type="url" className="dt-link-input" placeholder="https://linkedin.com/pulse/…"
          value={data.linkedinLink||''} readOnly={readOnly} style={ro}
          onChange={e => !readOnly && onChange('linkedinLink', e.target.value)} />
      </div>
    </div>
  );
}
