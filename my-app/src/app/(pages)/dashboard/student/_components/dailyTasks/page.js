'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { surveyData as SURVEY } from './surveyDataShared';
import { getTemplate } from './caseStudyTemplates';
import { getInterventionTemplate } from './interventionTemplates';
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

const wc = (txt) => (txt || '').trim().split(/\s+/).filter(Boolean).length;

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

function addProportionalImage(doc, base64, x, y, maxW, maxH) {
  if (!base64) return maxH;
  try {
    const props = doc.getImageProperties(base64);
    const ratio = Math.min(maxW / props.width, maxH / props.height);
    const imgW = props.width * ratio;
    const imgH = props.height * ratio;
    const xPos = x + (maxW - imgW) / 2; // Center horizontally
    doc.addImage(base64, props.fileType || 'JPEG', xPos, y, imgW, imgH);
    return imgH;
  } catch (e) {
    doc.addImage(base64, 'JPEG', x, y, maxW, maxH);
    return maxH;
  }
}

const DEMO_ID = '2500099999';

function getDayStatus(dayNum, slot, saved, username, unlockedDays = [], slotEnabled = false, dailyMarks = {}) {
  // ── Demo bypass: all days open regardless of date ──
  if (username === DEMO_ID) {
    const s = saved[dayNum] || saved[String(dayNum)];
    return s ? 'submitted' : 'open';
  }
  if (!slot || !SLOT_START[slot]) return 'upcoming';
  
  const { open, close } = dayWindow(slot, dayNum);
  const now = serverNow();   // ← server-authoritative IST time
  const s = saved[dayNum] || saved[String(dayNum)];
  const mark = dailyMarks[`d${dayNum}`];
  const isEvaluated = mark !== null && mark !== undefined && mark !== '';
  
  let isFinal = s?.data?.isFinal;
  
  // Recovery & Legacy Check: If it's marked as draft or legacy (undefined),
  // but contains the core required fields, treat it as a final submission.
  if (isFinal !== true && s?.data) {
    const d = s.data;
    // Day 1 used to only require inference before social links were added.
    if (dayNum === 1) isFinal = !!d.inference;
    else if ([2, 3, 4, 6, 7].includes(dayNum)) isFinal = !!d.driveLink;
    else if (dayNum === 5) isFinal = !!(d.day2_topProblems || d.day3_topProblems || d.day4_topProblems);
    else isFinal = false;
  }
  
  const isSubmitted = !!s && isFinal === true;
  const isUnlocked = unlockedDays.includes(dayNum);

  if (isSubmitted) return 'submitted';
  if (isUnlocked) return 'unlocked'; // Admin unlocked this day

  // Check previous days first to see if we should cascade lock
  if (dayNum > 1) {
    const prevStatus = getDayStatus(dayNum - 1, slot, saved, username, unlockedDays, slotEnabled, dailyMarks);
    if (prevStatus === 'missed' || prevStatus === 'locked') return 'locked';
  }

  if (now > close.getTime()) return 'missed';
  if (now < open.getTime()) return slotEnabled ? 'preview' : 'upcoming';
  
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


const getDaysMeta = (studentData, survey) => {
  const s1 = survey?.[0]?.stakeholder || 'Stakeholder 1';
  const s2 = survey?.[1]?.stakeholder || 'Stakeholder 2';
  const s3 = survey?.[2]?.stakeholder || 'Stakeholder 3';
  return [
    { day:1, icon: <FaClipboardList />, title:'Day 1 – Problem Statement Understanding', subtitle:'Write why you chose this problem statement, your understanding, and identify the stakeholders (minimum 100 words)' },
    { day:2, icon: <FaHandshake />, title:`Day 2 – ${s1} Survey`,  subtitle:`Interview people from the ${s1} group` },
    { day:3, icon: <FaHandshake />, title:`Day 3 – ${s2} Survey`,  subtitle:`Interview people from the ${s2} group` },
    { day:4, icon: <FaHandshake />, title:`Day 4 – ${s3} Survey`,  subtitle:`Interview people from the ${s3} group` },
    { day:5, icon: <FaChartBar />, title:'Day 5 – Data Analysis',                     subtitle:'Count responses, calculate percentages & identify insights' },
    { day:6, icon: <FaCamera />, title:'Day 6 – Intervention Activity',             subtitle:'Select an activity, perform it, and generate the intervention report' },
    { day:7, icon: <FaVideo />, title:'Day 7 – Documentation & Presentation',      subtitle:'Submit case study report, YouTube video & LinkedIn article' },
  ];
};

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
      <p>This day is locked because a previous task was not submitted within the deadline.<br/><strong>Please contact your admin/mentor to unlock this task for you.</strong></p>
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
export default function DailyTasks({ studentData, onSectionChange }) {
  const [activeDay, setActiveDay] = useState(null);
  const [saved, setSaved]     = useState({});
  const [draft, setDraft]     = useState({});
  const [unlockedDays, setUnlockedDays] = useState([]);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [msgType, setMsgType] = useState('ok');
  
  // Use a Ref to always have the latest state for the async handleSave function
  // and for synchronous updates during input changes
  const latestDataRef = useRef({ saved: {}, draft: {} });
  
  useEffect(() => {
    latestDataRef.current.saved = saved;
  }, [saved]);

  const slotEnabled = studentData?.slotEnabled || false;

  const ps       = studentData?.problemStatementData?.problem_statement || null;
  const slot     = studentData?.slot || null;
  const username = studentData?.username || null;
  const survey   = ps ? (SURVEY[ps] || null) : null;
  const DAY_META = getDaysMeta(studentData, survey);
  const dailyMarks = useMemo(() => studentData?.dailyMarks || {}, [studentData?.dailyMarks]);

  // Max marks per day (matches evaluation rubric)
  const DAY_MAX = { 1:10, 2:5, 3:5, 4:5, 5:15, 6:20, 7:40 };

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
          const st = getDayStatus(d, slot, tasks, username, unlocked, slotEnabled, dailyMarks);
          return st === 'open' || st === 'submitted' || st === 'unlocked' || st === 'preview';
        });
        setActiveDay(firstOpen || 1);
      } catch { setActiveDay(1); }
    })();
  }, [slot, username, slotEnabled, dailyMarks]);

  const dayData = useCallback((day) => ({
    ...(saved[day]?.data || {}),
    ...(draft[day]  || {}),
  }), [saved, draft]);

  const setDayField = (day, field, value) => {
    const newDraft = { ...(latestDataRef.current.draft[day] || {}), [field]: value };
    setDraft(prev => {
      const updated = { ...prev, [day]: newDraft };
      latestDataRef.current.draft = updated; // Synchronous update
      return updated;
    });
    setMsg('');
  };

  const handleSave = useCallback(async (isDraft = false) => {
    const { saved: latestSaved, draft: latestDraft } = latestDataRef.current;
    const data = {
      ...(latestSaved[activeDay]?.data || {}),
      ...(latestDraft[activeDay] || {}),
    };

    if (!isDraft && activeDay === 1 && wc(data.inference || '') < 100) {
      setMsg(`Need at least 100 words (currently ${wc(data.inference||'')})`);
      setMsgType('err'); return;
    }
    if (!isDraft && activeDay === 1) {
      const li = (data.linkedinUrl || '').trim();
      const yt = (data.youtubeUrl  || '').trim();
      const liValid = li.startsWith('https://www.linkedin.com/') || li.startsWith('https://linkedin.com/');
      const ytValid = yt.startsWith('https://www.youtube.com/@') || yt.startsWith('https://youtube.com/@') || yt.startsWith('https://www.youtube.com/channel/');
      if (!li) { setMsg('Please provide your LinkedIn profile URL.'); setMsgType('err'); return; }
      if (!liValid) { setMsg('LinkedIn URL must start with https://www.linkedin.com/in/…'); setMsgType('err'); return; }
      if (!yt) { setMsg('Please provide your YouTube channel URL.'); setMsgType('err'); return; }
      if (!ytValid) { setMsg('YouTube URL must start with https://www.youtube.com/@… or /channel/…'); setMsgType('err'); return; }
    }
    if (!isDraft && [2, 3, 4].includes(activeDay)) {
      const pCount = data.personCount || 3;
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
      if (!data.driveLink?.trim()) {
        setMsg("Please provide the Google Drive Public Link for your report.");
        setMsgType('err'); return;
      }
    }
    if (!isDraft && activeDay === 6) {
      if (!data.activityTitle || (data.activityTitle === 'Other' && !data.customTitle)) {
        setMsg("Please select an activity title."); setMsgType('err'); return;
      }
      if (!data.coverPhoto || !data.photo2 || !data.photo3 || !data.photo4 || !data.photo5) {
        setMsg("Please upload all 5 photos in the generator."); setMsgType('err'); return;
      }
      if (wc(data.coverDesc || '') < 180) {
        setMsg(`Cover photo description must be at least 180 words (currently ${wc(data.coverDesc||'')}).`);
        setMsgType('err'); return;
      }
      const otherDescs = ['photo2Desc', 'photo3Desc', 'photo4Desc', 'photo5Desc'];
      for (let k of otherDescs) {
        if (wc(data[k] || '') < 60) {
          setMsg(`Photo descriptions must be at least 60 words (currently ${wc(data[k]||'')}).`);
          setMsgType('err'); return;
        }
      }
      if (!data.driveLink?.trim()) {
        setMsg("Please provide the Google Drive Public Link for your intervention report.");
        setMsgType('err'); return;
      }
    }
    if (!isDraft && activeDay === 5) {
      const activeDays = [2, 3, 4].filter(d => {
        const sh = survey && survey[d - 2];
        if (!sh) return false;
        const dd = saved[d]?.data || {};
        return Object.keys(dd).some(k => k.startsWith('p'));
      });
      
      for (const d of activeDays) {
        const pCount = wc(data[`day${d}_topProblems`] || '');
        const rCount = wc(data[`day${d}_rootCauses`] || '');
        const sCount = wc(data[`day${d}_recommendations`] || '');
        if (pCount < 50 || rCount < 50 || sCount < 50) {
          setMsg(`Please ensure all analysis sections have at least 50 words. Check your Day ${d} inputs.`);
          setMsgType('err'); return;
        }
      }
    }
    setSaving(true);
    setMsg('');
    try {
      const res  = await fetch('/api/dashboard/student/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          day: activeDay, 
          data: { ...data, isFinal: !isDraft } 
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(prev => ({ 
          ...prev, 
          [activeDay]: { 
            data: { ...data, isFinal: !isDraft }, 
            submittedAt: prev[activeDay]?.submittedAt || (isDraft ? null : new Date().toISOString()) 
          } 
        }));
        if (!isDraft) {
          setDraft(prev => { 
            const n = { ...prev }; 
            delete n[activeDay]; 
            latestDataRef.current.draft = n;
            return n; 
          });
        }
        setMsg(isDraft ? '✓ Progress saved' : '✓ Saved successfully!'); 
        setMsgType('ok');
        if (isDraft) setTimeout(() => setMsg(''), 2000);
      } else { 
        setMsg(json.error || 'Save failed'); 
        setMsgType('err'); 
      }
    } catch { 
      setMsg('Network error'); 
      setMsgType('err'); 
    } finally { 
      setSaving(false); 
    }
  }, [activeDay, latestDataRef, setSaved, setDraft, setMsg, setMsgType, survey, saved]);



  const handleSaveDraft = () => handleSave(true);
  const handleFinalSubmit = () => handleSave(false);

  if (!ps) return (
    <div className="dt-wrap">
      <div className="dt-no-ps">
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><FaExclamationTriangle /> Problem Statement Not Selected</h3>
        <p>Please select your Problem Statement in the Overview section first.</p>
      </div>
    </div>
  );

  if (activeDay === null) return <div className="dt-wrap"><p style={{color:'#888'}}>Loading…</p></div>;

  const statuses    = Object.fromEntries([1,2,3,4,5,6,7].map(d => [d, getDayStatus(d, slot, saved, username, unlockedDays, slotEnabled, dailyMarks)]));
  const meta        = DAY_META[activeDay - 1];
  const activeStatus = statuses[activeDay];
  const isSaved     = activeStatus === 'submitted' && !draft[activeDay];
  // Editable if open or unlocked; preview = view only
  const isEditable  = activeStatus === 'open' || activeStatus === 'unlocked';
  const isPreview   = activeStatus === 'preview';

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

      {/* Timer / status bar */}
      {isSaved ? (
        <>
          <CompletedBar deadline={slot ? dayWindow(slot, activeDay).close : new Date()} submittedAt={saved[activeDay]?.submittedAt} />
          {/* Evaluated marks banner */}
          {(() => {
            const mark = dailyMarks[`d${activeDay}`];
            const max  = DAY_MAX[activeDay];
            if (typeof mark === 'number' || (typeof mark === 'string' && mark !== '')) {
              return (
                <div style={{ display:'flex', alignItems:'center', gap:10, background:'#e8f5e9', border:'1.5px solid #a5d6a7', borderRadius:10, padding:'10px 18px', margin:'8px 0' }}>
                  <FaCheckCircle style={{ color:'#2e7d32', fontSize:'1.1rem' }} />
                  <span style={{ fontWeight:700, color:'#2e7d32', fontSize:'0.95rem' }}>Evaluated</span>
                  <span style={{ background:'#014a01', color:'#fff', fontWeight:800, fontSize:'1rem', borderRadius:8, padding:'2px 14px', marginLeft:4 }}>{mark} / {max}</span>
                  <span style={{ color:'#555', fontSize:'0.82rem', marginLeft:4 }}>marks awarded</span>
                </div>
              );
            }
            return (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fff8e1', border:'1.5px solid #ffe082', borderRadius:10, padding:'8px 16px', margin:'8px 0' }}>
                <FaHourglassHalf style={{ color:'#e65100' }} />
                <span style={{ fontWeight:600, color:'#e65100', fontSize:'0.88rem' }}>Evaluation Pending — marks will appear here once evaluated by admin.</span>
              </div>
            );
          })()}
        </>
      ) : activeStatus === 'open' || activeStatus === 'upcoming' || activeStatus === 'preview' ? (
        <TimerBar openTime={dayWindow(slot, activeDay).open} closeTime={dayWindow(slot, activeDay).close} status={activeStatus} />
      ) : activeStatus === 'unlocked' ? (
        <TimerBar openTime={null} closeTime={null} status="unlocked" />
      ) : null}

      {/* Timeline pills */}
      <div className="dt-timeline">
        {DAY_META.map(m => {
          const st = statuses[m.day];
          // Can click if it's not upcoming or locked
          const canClick = st !== 'upcoming' && st !== 'locked';
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
                {activeDay === 1 && <Day1 data={dayData(1)} onChange={(f,v) => setDayField(1,f,v)} ps={ps} readOnly={isSaved || isPreview} onSectionChange={onSectionChange} />}
                {activeDay === 2 && <DaySurvey day={2} stakeholderIdx={0} survey={survey} data={dayData(2)} onChange={(f,v) => setDayField(2,f,v)} readOnly={isSaved || isPreview} onFinalSubmit={handleFinalSubmit} onDraftSave={handleSaveDraft} saving={saving} minPersons={6} />}
                {activeDay === 3 && <DaySurvey day={3} stakeholderIdx={1} survey={survey} data={dayData(3)} onChange={(f,v) => setDayField(3,f,v)} readOnly={isSaved || isPreview} onFinalSubmit={handleFinalSubmit} onDraftSave={handleSaveDraft} saving={saving} minPersons={3} />}
                {activeDay === 4 && <DaySurvey day={4} stakeholderIdx={2} survey={survey} data={dayData(4)} onChange={(f,v) => setDayField(4,f,v)} readOnly={isSaved || isPreview} onFinalSubmit={handleFinalSubmit} onDraftSave={handleSaveDraft} saving={saving} minPersons={3} />}
                {activeDay === 5 && <Day5 saved={saved} survey={survey} data={dayData(5)} onChange={(f,v) => setDayField(5,f,v)} readOnly={isSaved || isPreview} />}
                {activeDay === 6 && <Day6 data={dayData(6)} onChange={(f,v) => setDayField(6,f,v)} readOnly={isSaved || isPreview} studentData={studentData} />}
                {activeDay === 7 && <Day7 saved={saved} data={dayData(7)} onChange={(f,v) => setDayField(7,f,v)} readOnly={isSaved || isPreview} studentData={studentData} survey={survey} />}

                {activeDay !== 2 && activeDay !== 3 && activeDay !== 4 && (
                  <div className="dt-save-row">
                    <button className="dt-save-btn" onClick={handleFinalSubmit} disabled={saving || isSaved || !isEditable}>
                      {saving ? 'Saving…' : isSaved ? '✓ Submitted' : isPreview ? '🔒 Submission Not Open Yet' : '💾 Final Submit for Evaluation'}
                    </button>
                    {!isSaved && isEditable && (
                      <button className="dt-draft-btn" onClick={handleSaveDraft} disabled={saving}>
                        {saving ? 'Saving...' : '💾 Save Progress'}
                      </button>
                    )}
                    {isSaved && (() => {
                      const mark = dailyMarks[`d${activeDay}`];
                      const max  = DAY_MAX[activeDay];
                      // Show if mark is a number (including 0)
                      if (typeof mark === 'number' || (typeof mark === 'string' && mark !== '')) return (
                        <span style={{ display:'flex', alignItems:'center', gap:6, background:'#e8f5e9', border:'1px solid #a5d6a7', borderRadius:8, padding:'4px 12px', fontSize:'0.85rem', fontWeight:700, color:'#2e7d32' }}>
                          <FaCheckCircle /> Evaluated: {mark}/{max}
                        </span>
                      );
                      return <span style={{fontSize:'0.82rem',color:'#e65100', fontWeight:600}}>⏳ Evaluation Pending</span>;
                    })()}
                    {isPreview && <span style={{fontSize:'0.82rem',color:'#1d4ed8'}}>Submission opens {new Date(dayWindow(slot, activeDay).open).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:true })}</span>}
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
        doc.setDrawColor(30, 60, 30);
        doc.setLineWidth(0.8);
        doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
        doc.setLineWidth(0.3);
        doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
      };

      let yOffset = 15 + 10;
      drawBorders();

      // Institution header
      doc.setFontSize(11);
      doc.setFont('times', 'bold');
      doc.setTextColor(40, 80, 40);
      doc.text('K L DEEMED TO BE UNIVERSITY', pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 7;
      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('(Koneru Lakshmaiah Education Foundation, Deemed to be University under Section 3 of UGC Act, 1956)', pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 10;
      doc.setDrawColor(30, 80, 30);
      doc.setLineWidth(0.5);
      doc.line(15, yOffset, pageWidth - 15, yOffset);
      yOffset += 15;

      // Heading: Day-X Report
      doc.setFontSize(22);
      doc.setFont('times', 'bold');
      doc.setTextColor(0, 0, 0);
      const title = `Day-${day} Report`;
      doc.text(title, pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 12;
      
      // Stakeholder Category
      doc.setFontSize(14);
      const shText = `Stakeholder: ${stakeholder}`;
      const shWidth = doc.getTextWidth(shText);
      doc.text(shText, pageWidth / 2, yOffset, { align: 'center' });
      doc.line((pageWidth / 2) - (shWidth / 2), yOffset + 1, (pageWidth / 2) + (shWidth / 2), yOffset + 1);
      
      doc.setFont('times', 'normal');
      yOffset += 15;

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (i > 0 && i % 2 === 0) {
          doc.addPage();
          drawBorders();
          yOffset = 20;
        }

        if (entry.image) {
          addProportionalImage(doc, entry.image, 25, yOffset, 160, 80);
        }
        
        yOffset += 88;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Date: ${entry.date}`, 25, yOffset);
        yOffset += 7;
        
        doc.setFontSize(11);
        doc.setFont('times', 'normal');
        const splitDesc = doc.splitTextToSize(`Description: ${entry.description}`, 160);
        doc.text(splitDesc, 25, yOffset);
        yOffset += (splitDesc.length * 6) + 15;
      }

      // Footer on all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setFont('times', 'italic');
        doc.setTextColor(120, 120, 120);
        doc.text(
          `SOCIAL INTERNSHIP 2026  |  DAY ${day} REPORT  |  Page ${p} of ${totalPages}`,
          pageWidth / 2, pageHeight - 11, { align: 'center' }
        );
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
function Day1({ data, onChange, ps, readOnly, onSectionChange }) {
  const text  = data.inference || '';
  const words = wc(text);
  const linkedinUrl  = data.linkedinUrl  || '';
  const youtubeUrl   = data.youtubeUrl   || '';

  const isLinkedinValid = linkedinUrl.trim().startsWith('https://www.linkedin.com/') || linkedinUrl.trim().startsWith('https://linkedin.com/');
  const isYoutubeValid  = youtubeUrl.trim().startsWith('https://www.youtube.com/@') || youtubeUrl.trim().startsWith('https://youtube.com/@') || youtubeUrl.trim().startsWith('https://www.youtube.com/channel/');

  const ro = { background: '#f9f9f9', color: '#555' };

  return (
    <div>
      <div className="dt-info-box" style={{ marginBottom: 16 }}>
        <h4>Task: Problem Statement Understanding</h4>
        <ul>
          <li>Read your problem statement carefully: <strong>{ps}</strong></li>
          <li>Research your topic using the internet or books.</li>
          <li>Write your understanding — <strong>minimum 100 words</strong></li>
          <li>Cover: why you chose this problem statement, your understanding of the problem, and identify the key stakeholders.</li>
          <li>Go through the stakeholders and survey questions to ask on Day 2, 3, and 4.</li>
          <li>Create a <strong>LinkedIn account</strong> (if you don&apos;t have one) and submit your profile URL.</li>
          <li>Create a <strong>YouTube channel</strong> (if you don&apos;t have one) and submit your channel URL.</li>
        </ul>
        <div style={{ marginTop: 16 }}>
          <button 
            type="button"
            onClick={() => onSectionChange && onSectionChange('survey-questions')}
            style={{ padding: '8px 16px', background: '#014a01', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
          >
            Click here to view your stakeholders and survey questions to ask and record responses on day 2,3,4 stakeholder wise.
          </button>
        </div>
      </div>

      {/* Understanding textarea */}
      <div className="dt-textarea-wrap">
        <label htmlFor="day1-inference">Your Understanding</label>
        <textarea
          id="day1-inference" className="dt-textarea"
          placeholder="Write your understanding of the problem statement here…"
          value={text} readOnly={readOnly}
          onChange={e => !readOnly && onChange('inference', e.target.value)}
          style={readOnly ? ro : {}}
        />
        <p className={`dt-word-count ${words >= 100 ? 'ok' : words > 60 ? 'warn' : ''}`}>
          {words} / 100 words minimum {words >= 100 ? '✓' : ''}
        </p>
      </div>

      {/* LinkedIn URL */}
      <div className="dt-link-section" style={{ marginTop: 20 }}>
        <label htmlFor="day1-linkedin" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#0077b5" style={{flexShrink:0}}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          LinkedIn Profile URL <span style={{ color: '#e53e3e', marginLeft: 2 }}>*</span>
        </label>
        <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 6, marginTop: 2 }}>
          Example: <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>https://www.linkedin.com/in/your-name-12345</code>
        </p>
        <input
          id="day1-linkedin"
          type="url"
          className={`dt-link-input${!readOnly && linkedinUrl && !isLinkedinValid ? ' dt-link-error' : ''}`}
          placeholder="https://www.linkedin.com/in/your-profile"
          value={linkedinUrl}
          readOnly={readOnly}
          style={readOnly ? ro : {}}
          onChange={e => !readOnly && onChange('linkedinUrl', e.target.value)}
        />
        {!readOnly && linkedinUrl && (
          <p style={{ fontSize: '0.8rem', marginTop: 4, color: isLinkedinValid ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
            {isLinkedinValid ? '✓ Valid LinkedIn profile URL' : '✗ Must start with https://www.linkedin.com/in/…'}
          </p>
        )}
        {readOnly && linkedinUrl && (
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#0077b5', marginTop: 4, display: 'inline-block' }}>
            🔗 View LinkedIn Profile
          </a>
        )}
      </div>

      {/* YouTube Channel URL */}
      <div className="dt-link-section" style={{ marginTop: 16 }}>
        <label htmlFor="day1-youtube" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff0000" style={{flexShrink:0}}><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
          YouTube Channel URL <span style={{ color: '#e53e3e', marginLeft: 2 }}>*</span>
        </label>
        <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 6, marginTop: 2 }}>
          Example: <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 3 }}>https://www.youtube.com/@YourChannelName</code>
        </p>
        <input
          id="day1-youtube"
          type="url"
          className={`dt-link-input${!readOnly && youtubeUrl && !isYoutubeValid ? ' dt-link-error' : ''}`}
          placeholder="https://www.youtube.com/@YourChannelName"
          value={youtubeUrl}
          readOnly={readOnly}
          style={readOnly ? ro : {}}
          onChange={e => !readOnly && onChange('youtubeUrl', e.target.value)}
        />
        {!readOnly && youtubeUrl && (
          <p style={{ fontSize: '0.8rem', marginTop: 4, color: isYoutubeValid ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
            {isYoutubeValid ? '✓ Valid YouTube channel URL' : '✗ Must start with https://www.youtube.com/@… or /channel/…'}
          </p>
        )}
        {readOnly && youtubeUrl && (
          <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#ff0000', marginTop: 4, display: 'inline-block' }}>
            🔗 View YouTube Channel
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Survey Report Generator (Days 2/3/4) ── */
function SurveyReportGenerator({ day, stakeholder, persons, personData }) {
  const initSlots = () => persons.map(p => ({
    id: `person-${p}-${Date.now()}`,
    image: null,
    name: personData[`p${p}`]?.name || `Person ${p}`,
    description: '',
  }));
  
  const [slots, setSlots] = useState(initSlots);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSlots(prev => prev.map((s, i) => i === index ? { ...s, image: reader.result } : s));
    };
    reader.readAsDataURL(file);
  };

  const handleFieldChange = (index, field, val) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: val } : s));
  };

  const addSlot = () => {
    setSlots(prev => [...prev, { id: `extra-${Date.now()}`, image: null, name: '', description: '' }]);
  };

  const removeSlot = (index) => {
    if (slots.length <= 1) return;
    setSlots(prev => prev.filter((_, i) => i !== index));
  };

  const generatePDF = async () => {
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i].image) {
        alert(`Please upload a photo for slot ${i + 1} before generating the PDF.`);
        return;
      }
      const count = wc(slots[i].description);
      if (count < 30 || count > 50) {
        alert(`Description for photo ${i + 1} must be between 30 and 50 words. (Current: ${count} words)`);
        return;
      }
      if (!slots[i].name?.trim()) {
        alert(`Please enter a stakeholder name for photo ${i + 1}.`);
        return;
      }
    }
    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const PW = doc.internal.pageSize.getWidth();
      const PH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = PW - margin * 2;

      const drawBorder = () => {
        doc.setDrawColor(30, 60, 30);
        doc.setLineWidth(0.8);
        doc.rect(8, 8, PW - 16, PH - 16);
        doc.setLineWidth(0.3);
        doc.rect(10, 10, PW - 20, PH - 20);
      };

      const addHeader = (y) => {
        doc.setFontSize(11); doc.setFont('times', 'bold'); doc.setTextColor(40, 80, 40);
        doc.text('K L DEEMED TO BE UNIVERSITY', PW / 2, y, { align: 'center' });
        y += 7;
        doc.setFontSize(9); doc.setFont('times', 'normal'); doc.setTextColor(80, 80, 80);
        doc.text('(Koneru Lakshmaiah Education Foundation, Deemed to be University under Section 3 of UGC Act, 1956)', PW / 2, y, { align: 'center' });
        y += 8;
        doc.setDrawColor(30, 80, 30); doc.setLineWidth(0.5);
        doc.line(margin, y, PW - margin, y);
        y += 10;

        doc.setFontSize(18); doc.setFont('times', 'bold'); doc.setTextColor(0, 0, 0);
        doc.text(`Day-${day} Report`, PW / 2, y, { align: 'center' });
        y += 8;
        doc.setFontSize(13); doc.setFont('times', 'italic'); doc.setTextColor(30, 90, 30);
        const shText = `( ${stakeholder} )`;
        doc.text(shText, PW / 2, y, { align: 'center' });
        y += 12;
        return y;
      };

      let pageSlots = [];
      for (let i = 0; i < slots.length; i += 2) {
        pageSlots.push(slots.slice(i, i + 2));
      }

      pageSlots.forEach((pair, pageIdx) => {
        if (pageIdx > 0) doc.addPage();
        drawBorder();
        let y = margin + 5;
        y = addHeader(y);

        pair.forEach((slot, si) => {
          if (slot.image) {
            addProportionalImage(doc, slot.image, margin, y, contentW, 65);
            y += 70;
          }
          doc.setFontSize(11); doc.setFont('times', 'bold'); doc.setTextColor(0,0,0);
          doc.text(`Stakeholder Name: ${slot.name}`, margin, y);
          y += 6;
          
          doc.setFontSize(12); doc.setFont('times', 'normal');
          const descLines = doc.splitTextToSize(`Description: ${slot.description}`, contentW);
          doc.text(descLines, margin, y);
          y += descLines.length * 6 + 12;
        });
      });

      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8); doc.setFont('times', 'italic'); doc.setTextColor(120, 120, 120);
        doc.text(
          `SOCIAL INTERNSHIP 2026  |  DAY ${day} REPORT  |  Page ${p} of ${totalPages}`,
          PW / 2, PH - 11, { align: 'center' }
        );
      }

      doc.save(`Day${day}_${stakeholder.replace(/\s+/g, '_')}_Report.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ marginTop: 32, padding: 20, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.06)' }}>
      <h4 style={{ margin: '0 0 6px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: 10 }}>
        <FaFilePdf /> Day-{day} Report Generator
      </h4>
      <p style={{ fontSize: '0.85rem', color: '#15803d', marginBottom: 20 }}>
        Upload photos for each person interviewed. Descriptions must be 30-50 words.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {slots.map((slot, index) => {
          const count = wc(slot.description);
          return (
            <div key={slot.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>📷 Photo {index + 1}</span>
                {slots.length > persons.length && (
                  <button onClick={() => removeSlot(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>✕ Remove</button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                <div>
                  {slot.image ? (
                    <Image src={slot.image} alt="preview" width={200} height={110} unoptimized style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                  ) : (
                    <div style={{ width: '100%', height: 110, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '2px dashed #cbd5e1', fontSize: '0.8rem' }}>No Photo</div>
                  )}
                  <label style={{ display: 'block', marginTop: 8, padding: '5px 10px', background: '#e0f2fe', borderRadius: 6, cursor: 'pointer', textAlign: 'center', fontSize: '0.78rem', color: '#0369a1', fontWeight: 500 }}>
                    Upload Photo
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(index, e)} style={{ display: 'none' }} />
                  </label>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Stakeholder Name</label>
                  <input 
                    type="text"
                    value={slot.name}
                    onChange={e => handleFieldChange(index, 'name', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 10, outline: 'none', fontSize: '0.88rem' }}
                  />
                  
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                    Description (30-50 words)
                    <span style={{ float: 'right', color: (count < 30 || count > 50) ? '#ef4444' : '#16a34a' }}>{count} words</span>
                  </label>
                  <textarea
                    value={slot.description}
                    onChange={e => handleFieldChange(index, 'description', e.target.value)}
                    placeholder="Describe this photo/interaction..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', minHeight: 70, resize: 'none', outline: 'none', fontSize: '0.88rem' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <button onClick={addSlot} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #014a01', background: '#fff', color: '#014a01', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          + Add Photo Slot
        </button>
        <button onClick={generatePDF} disabled={isGenerating} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer', opacity: isGenerating ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaFilePdf /> {isGenerating ? 'Generating...' : `Download Day-${day} PDF`}
        </button>
      </div>
    </div>
  );
}

/* ── Days 2/3/4 – Survey ── */
function DaySurvey({ day, stakeholderIdx, survey, data, onChange, readOnly, onFinalSubmit, onDraftSave, saving, minPersons = 3 }) {
  const [personCount, setPersonCount] = useState(Math.max(data.personCount || minPersons, minPersons));
  const [activePerson, setActivePerson] = useState(1);

  // Sync personCount when data loads
  useEffect(() => {
    if (data.personCount && data.personCount !== personCount) {
      setPersonCount(data.personCount);
    }
  }, [data.personCount, personCount]);

  if (!survey) return <div className="dt-info-box"><h4>Survey data not available</h4><p>No questions found for your problem statement. Contact admin.</p></div>;

  const sh = survey[stakeholderIdx];
  if (!sh) return <p>Stakeholder not found.</p>;

  const persons = Array.from({ length: personCount }, (_, i) => i + 1);
  const pk = (p) => `p${p}`;
  const pd = (p) => data[pk(p)] || { name: '', answers: {} };
  const isFilled = (p) => { const d = pd(p); return d.name?.trim() && Object.keys(d.answers||{}).length === sh.questions.length; };
  const allFilled = persons.every(p => isFilled(p));

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

  const addPerson = () => {
    const next = personCount + 1;
    setPersonCount(next);
    onChange('personCount', next);
  };

  const removePerson = () => {
    if (personCount <= minPersons) return;
    const next = personCount - 1;
    setPersonCount(next);
    onChange('personCount', next);
    if (activePerson > next) setActivePerson(next);
  };

  // Initialise personCount in data on first use
  if (!data.personCount) onChange('personCount', personCount);

  const cur = pd(activePerson);
  return (
    <div>
      <div className="dt-sh-banner">
        <span className="sh-tag">{sh.stakeholder}</span>
        <p>Take photos along with stakeholders while performing the surveys and generate the document at last and upload in the drive and submit the public link.</p>
        <p style={{ fontSize: '0.8rem', color: '#555', marginTop: 4 }}>Minimum {minPersons} persons required.</p>
      </div>

      <p className="dt-persons-label">Select Person:</p>
      <div className="dt-person-tabs" style={{ flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        {persons.map(p => (
          <button key={p} className={`dt-person-btn ${activePerson===p?'active':''} ${isFilled(p)?'filled':''}`}
            onClick={() => {
              // Restriction: check if all persons before p are filled
              if (p > activePerson) {
                for (let i = 1; i < p; i++) {
                  if (!isFilled(i)) {
                    alert(`Please complete Person ${i} first.`);
                    return;
                  }
                }
              }
              setActivePerson(p);
            }}>
            Person {p} {isFilled(p) ? '✓' : ''}
          </button>
        ))}
      </div>
      
      {!readOnly && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={addPerson} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px dashed #014a01', background: '#f0fdf4', color: '#014a01', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>+ Add Person</button>
          <button onClick={removePerson} disabled={personCount <= minPersons} style={{ padding: '6px 14px', borderRadius: '6px', border: `1px dashed ${personCount <= minPersons ? '#ccc' : '#dc2626'}`, background: personCount <= minPersons ? '#f9f9f9' : '#fef2f2', color: personCount <= minPersons ? '#aaa' : '#dc2626', fontWeight: 600, cursor: personCount <= minPersons ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
            − Remove Last {personCount <= minPersons ? `(min ${minPersons})` : ''}
          </button>
        </div>
      )}

      <div className="dt-name-wrap">
        <label htmlFor={`n-d${day}-p${activePerson}`}>Name of Person {activePerson}</label>
        <input id={`n-d${day}-p${activePerson}`} type="text" className="dt-name-input"
          placeholder="Enter interviewee's name" value={cur.name||''} readOnly={readOnly}
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
            <button className="dt-save-btn" onClick={async () => {
              if (isFilled(activePerson)) {
                // Ensure we call onDraftSave BEFORE changing local UI state to avoid confusion
                await onDraftSave(); 
                setActivePerson(activePerson + 1);
              }
              else alert('Please complete all questions and the name for this person first.');
            }} style={{ background: '#1a7a1a' }}>
              {saving ? 'Saving...' : 'Save Person & Next'}
            </button>
          )}
          {!allFilled && !readOnly && (
            <button className="dt-draft-btn" onClick={onDraftSave} disabled={saving} style={{ background: '#475569' }}>
              {saving ? 'Saving...' : '💾 Save Progress'}
            </button>
          )}
          {allFilled && (
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

      {/* PDF Report Generator — shown once all persons are filled */}
      {allFilled && (
        <>
          <SurveyReportGenerator
            day={day}
            stakeholder={sh.stakeholder}
            persons={persons}
            personData={data}
          />
          <div className="dt-warning-box" style={{marginTop: 30}}>⚠️ Set sharing to <strong>&quot;Anyone with the link can view&quot;</strong>. Private links will NOT be evaluated.</div>
          <div className="dt-link-section">
            <label htmlFor={`d${day}-link`}>Google Drive Public Link</label>
            <p>Paste the shareable link to your generated report here.</p>
            <input id={`d${day}-link`} type="url" className="dt-link-input" placeholder="https://drive.google.com/…"
              value={data.driveLink||''} readOnly={readOnly} style={readOnly ? {background:'#f9f9f9'} : {}}
              onChange={e => !readOnly && onChange('driveLink', e.target.value)} />
          </div>
        </>
      )}
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
        <h4 style={{ margin: '0 0 10px 0', color: '#0d47a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaClipboardList /> Objective
        </h4>
        <p style={{ margin: '0 0 10px 0' }}>To convert survey data into meaningful insights.</p>
        <h5 style={{ margin: '0 0 5px 0', color: '#0d47a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaChartBar /> Interpretation Guidelines:
        </h5>
        <ul style={{ margin: 0, paddingLeft: 28, fontSize: '0.9rem' }}>
          <li><strong>&gt;70% YES</strong> &rarr; High Severity Problem</li>
          <li><strong>40–70% YES</strong> &rarr; Moderate Severity Problem</li>
          <li><strong>&lt;40% YES</strong> &rarr; Low Severity Problem</li>
        </ul>
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
            {persons.length > 0 && (() => {
               const pCount = wc(data[`day${day}_topProblems`] || '');
               const rCount = wc(data[`day${day}_rootCauses`] || '');
               const sCount = wc(data[`day${day}_recommendations`] || '');
               return (
                 <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px solid #e0e0e0' }}>
                   <div className="dt-textarea-wrap" style={{ marginBottom: 20 }}>
                     <label htmlFor={`day5-topProblems-${day}`}>1. Top 3 Problems Identified</label>
                     <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8, marginTop: -4 }}>Based on the severity (YES percentages), list the top 3 problems. (Minimum 50 words)</p>
                     <textarea
                       id={`day5-topProblems-${day}`} className="dt-textarea"
                       placeholder="List the top 3 problems here..."
                       value={data[`day${day}_topProblems`] || ''} readOnly={readOnly}
                       onChange={e => !readOnly && onChange(`day${day}_topProblems`, e.target.value)}
                       style={readOnly ? { background:'#f9f9f9', color:'#555', minHeight: 100 } : { minHeight: 100 }}
                     />
                     <p className={`dt-word-count ${pCount >= 50 ? 'ok' : pCount > 0 ? 'warn' : ''}`}>
                       {pCount} / 50 words minimum {pCount >= 50 ? '✓' : ''}
                     </p>
                   </div>
                   
                   <div className="dt-textarea-wrap" style={{ marginBottom: 20 }}>
                     <label htmlFor={`day5-rootCauses-${day}`}>2. Root Causes Analysis</label>
                     <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8, marginTop: -4 }}>Identify root causes (e.g., Skill gap, Lack of awareness, Infrastructure issues). (Minimum 50 words)</p>
                     <textarea
                       id={`day5-rootCauses-${day}`} className="dt-textarea"
                       placeholder="Write the identified root causes here..."
                       value={data[`day${day}_rootCauses`] || ''} readOnly={readOnly}
                       onChange={e => !readOnly && onChange(`day${day}_rootCauses`, e.target.value)}
                       style={readOnly ? { background:'#f9f9f9', color:'#555', minHeight: 100 } : { minHeight: 100 }}
                     />
                     <p className={`dt-word-count ${rCount >= 50 ? 'ok' : rCount > 0 ? 'warn' : ''}`}>
                       {rCount} / 50 words minimum {rCount >= 50 ? '✓' : ''}
                     </p>
                   </div>

                   <div className="dt-textarea-wrap" style={{ marginBottom: 8 }}>
                     <label htmlFor={`day5-recommendations-${day}`}>3. Recommendations &amp; Improvement Suggestions</label>
                     <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8, marginTop: -4 }}>Provide suitable recommendations or improvement suggestions based on the identified problems and root causes that may help improve the current community situation. (Minimum 50 words)</p>
                     <textarea
                       id={`day5-recommendations-${day}`} className="dt-textarea"
                       placeholder="Write your recommendations here..."
                       value={data[`day${day}_recommendations`] || ''} readOnly={readOnly}
                       onChange={e => !readOnly && onChange(`day${day}_recommendations`, e.target.value)}
                       style={readOnly ? { background:'#f9f9f9', color:'#555', minHeight: 100 } : { minHeight: 100 }}
                     />
                     <p className={`dt-word-count ${sCount >= 50 ? 'ok' : sCount > 0 ? 'warn' : ''}`}>
                       {sCount} / 50 words minimum {sCount >= 50 ? '✓' : ''}
                     </p>
                   </div>
                 </div>
               );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Intervention Generator ── */
function InterventionGenerator({ studentData, readOnly, data, onChange }) {
  const domain = studentData?.selectedDomain || '';
  const template = getInterventionTemplate(domain);
  const [isGenerating, setIsGenerating] = useState(false);

  const inputStyle = (ro) => ({
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.88rem',
    background: ro ? '#f9f9f9' : '#fff', resize: 'vertical',
  });

  const handlePhotoUpload = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(key, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePDF = async () => {
    // ── Pre-generation validation ──
    if (!data.activityTitle) {
      alert("Please select an activity title."); return;
    }
    if (data.activityTitle === 'Other' && !data.customTitle?.trim()) {
      alert("Please specify the custom activity title."); return;
    }
    if (!data.coverPhoto || !data.photo2 || !data.photo3 || !data.photo4 || !data.photo5) {
      alert("Please upload all 5 photos before generating the report."); return;
    }
    if (wc(data.coverDesc || '') < 180) {
      alert(`Cover photo description needs at least 180 words (current: ${wc(data.coverDesc||'')})`); return;
    }
    const otherKeys = ['photo2Desc', 'photo3Desc', 'photo4Desc', 'photo5Desc'];
    for (let k of otherKeys) {
      const count = wc(data[k] || '');
      if (count < 60) {
        alert(`Each photo description needs at least 60 words (current: ${count} words)`); return;
      }
    }

    setIsGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const PW = doc.internal.pageSize.getWidth();
      const PH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = PW - margin * 2;

      const drawBorder = () => {
        doc.setDrawColor(30, 60, 30);
        doc.setLineWidth(0.8);
        doc.rect(8, 8, PW - 16, PH - 16);
        doc.setLineWidth(0.3);
        doc.rect(10, 10, PW - 20, PH - 20);
      };

      const writeText = (text, fontSize, style, color, align, yPos) => {
        doc.setFontSize(fontSize);
        doc.setFont('times', style);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, contentW);
        doc.text(lines, align === 'center' ? PW / 2 : margin, yPos, { align });
        return lines.length * (fontSize * 0.4);
      };

      // Page 1
      drawBorder();
      let y = margin + 10;
      
      doc.setFontSize(11);
      doc.setFont('times', 'bold');
      doc.setTextColor(40, 80, 40);
      doc.text('K L DEEMED TO BE UNIVERSITY', PW / 2, y, { align: 'center' });
      y += 7;
      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('(Koneru Lakshmaiah Education Foundation, Deemed to be University under Section 3 of UGC Act, 1956)', PW / 2, y, { align: 'center' });
      y += 10;
      doc.setDrawColor(30, 80, 30);
      doc.setLineWidth(0.5);
      doc.line(margin, y, PW - margin, y);
      y += 15;

      doc.setFontSize(16);
      doc.setFont('times', 'bold');
      doc.setTextColor(0, 0, 0);
      const titleText = (data.activityTitle === 'Other' ? data.customTitle : data.activityTitle) || 'Intervention Activity';
      const titleLines = doc.splitTextToSize(titleText, contentW);
      doc.text(titleLines, PW/2, y, { align: 'center' });
      
      doc.setLineWidth(0.5);
      doc.setDrawColor(0,0,0);
      doc.line(PW/2 - 40, y + 2, PW/2 + 40, y + 2);
      y += titleLines.length * 8 + 10;

      if (data.coverPhoto) {
        addProportionalImage(doc, data.coverPhoto, margin, y, contentW, 95);
        y += 105;
      }

      y += writeText(data.coverDesc || '', 13, 'normal', [0,0,0], 'left', y);

      // Page 2: Photo 2 + Photo 3 (2 images stacked)
      doc.addPage();
      drawBorder();
      y = margin + 10;
      if (data.photo2) {
        addProportionalImage(doc, data.photo2, margin, y, contentW, 80);
        y += 85;
      }
      const desc2Lines = doc.splitTextToSize(data.photo2Desc || '', contentW);
      doc.setFontSize(12); doc.setFont('times', 'normal'); doc.setTextColor(0, 0, 0);
      doc.text(desc2Lines, margin, y);
      y += desc2Lines.length * 6 + 12;

      if (data.photo3) {
        addProportionalImage(doc, data.photo3, margin, y, contentW, 80);
        y += 85;
      }
      const desc3Lines = doc.splitTextToSize(data.photo3Desc || '', contentW);
      doc.setFontSize(12); doc.setFont('times', 'normal'); doc.setTextColor(0, 0, 0);
      doc.text(desc3Lines, margin, y);

      // Page 3: Photo 4 + Photo 5 (2 images stacked — same structure as Page 2)
      doc.addPage();
      drawBorder();
      y = margin + 10;
      if (data.photo4) {
        addProportionalImage(doc, data.photo4, margin, y, contentW, 80);
        y += 85;
      }
      const desc4Lines = doc.splitTextToSize(data.photo4Desc || '', contentW);
      doc.setFontSize(12); doc.setFont('times', 'normal'); doc.setTextColor(0, 0, 0);
      doc.text(desc4Lines, margin, y);
      y += desc4Lines.length * 6 + 12;

      if (data.photo5) {
        addProportionalImage(doc, data.photo5, margin, y, contentW, 80);
        y += 85;
      }
      const desc5Lines = doc.splitTextToSize(data.photo5Desc || '', contentW);
      doc.setFontSize(12); doc.setFont('times', 'normal'); doc.setTextColor(0, 0, 0);
      doc.text(desc5Lines, margin, y);

      // Footer on all pages
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setFont('times', 'italic');
        doc.setTextColor(120, 120, 120);
        doc.text(
          `SOCIAL INTERNSHIP 2026  |  INTERVENTION REPORT  |  Page ${p} of ${totalPages}`,
          PW / 2, PH - 11, { align: 'center' }
        );
      }

      doc.save(`Day6_Intervention_${studentData?.rollNumber || 'Report'}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF. Ensure all uploaded photos are valid images.');
    } finally {
      setIsGenerating(false);
    }
  };

  const WordCountLabel = ({ count, min }) => (
    <span style={{ float: 'right', fontSize: '0.75rem', fontWeight: 600, color: count < min ? '#ef4444' : '#16a34a' }}>
      {count < min ? `Min ${min} words required (Current: ${count})` : `✅ ${count} words`}
    </span>
  );

  return (
    <div className="cs-generator-box" style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}><FaFilePdf /> Intervention Activity Report Generator</h3>
      <p style={{ fontSize: '0.88rem', color: '#15803d', marginBottom: '20px' }}>
        <strong>🎯 Objective:</strong> {template.objective}<br/>
        <strong>✅ Requirements:</strong> {template.requirements}
      </p>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Select Activity <span style={{color:'#ef4444'}}>*</span></label>
        <select value={data.activityTitle || ''} onChange={e => !readOnly && onChange('activityTitle', e.target.value)} style={inputStyle(readOnly)} disabled={readOnly}>
          <option value="">-- Select an Activity --</option>
          {template.activities.map(act => <option key={act} value={act}>{act}</option>)}
          <option value="Other">Other (Specify below)</option>
        </select>
      </div>

      {data.activityTitle === 'Other' && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>Custom Activity Title <span style={{color:'#ef4444'}}>*</span></label>
          <input type="text" value={data.customTitle || ''} onChange={e => !readOnly && onChange('customTitle', e.target.value)} style={inputStyle(readOnly)} readOnly={readOnly} placeholder="Enter your activity title" />
        </div>
      )}

      {/* Page 1 Details */}
      <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'inline-block' }}>📄 Page 1: Cover Photo &amp; Description</h4>
          <WordCountLabel count={wc(data.coverDesc || '')} min={180} />
        </div>
        <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, 'coverPhoto')} disabled={readOnly} style={{ marginBottom: '10px', fontSize: '0.8rem' }} />
        {data.coverPhoto && <div style={{ marginBottom: '10px', fontSize: '0.75rem', color: '#16a34a' }}>✅ Cover Photo Uploaded</div>}
        <textarea placeholder="Description of the activity (Min 180 words)..." value={data.coverDesc || ''} onChange={e => !readOnly && onChange('coverDesc', e.target.value)} style={{...inputStyle(readOnly), minHeight: '100px'}} readOnly={readOnly} />
      </div>

      {/* Page 2 Details: Photo 2 + Photo 3 */}
      <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'inline-block' }}>📄 Page 2: Photo 2 &amp; Description</h4>
          <WordCountLabel count={wc(data.photo2Desc || '')} min={60} />
        </div>
        <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, 'photo2')} disabled={readOnly} style={{ marginBottom: '10px', fontSize: '0.8rem' }} />
        {data.photo2 && <div style={{ marginBottom: '10px', fontSize: '0.75rem', color: '#16a34a' }}>✅ Photo 2 Uploaded</div>}
        <textarea placeholder="Description of this photo (Min 60 words)..." value={data.photo2Desc || ''} onChange={e => !readOnly && onChange('photo2Desc', e.target.value)} style={{...inputStyle(readOnly), minHeight: '80px'}} readOnly={readOnly} />
      </div>

      <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'inline-block' }}>📄 Page 2: Photo 3 &amp; Description</h4>
          <WordCountLabel count={wc(data.photo3Desc || '')} min={60} />
        </div>
        <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, 'photo3')} disabled={readOnly} style={{ marginBottom: '10px', fontSize: '0.8rem' }} />
        {data.photo3 && <div style={{ marginBottom: '10px', fontSize: '0.75rem', color: '#16a34a' }}>✅ Photo 3 Uploaded</div>}
        <textarea placeholder="Description of this photo (Min 60 words)..." value={data.photo3Desc || ''} onChange={e => !readOnly && onChange('photo3Desc', e.target.value)} style={{...inputStyle(readOnly), minHeight: '80px'}} readOnly={readOnly} />
      </div>

      {/* Page 3 Details: Photo 4 + Photo 5 */}
      <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'inline-block' }}>📄 Page 3: Photo 4 &amp; Description</h4>
          <WordCountLabel count={wc(data.photo4Desc || '')} min={60} />
        </div>
        <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, 'photo4')} disabled={readOnly} style={{ marginBottom: '10px', fontSize: '0.8rem' }} />
        {data.photo4 && <div style={{ marginBottom: '10px', fontSize: '0.75rem', color: '#16a34a' }}>✅ Photo 4 Uploaded</div>}
        <textarea placeholder="Description of this photo (Min 60 words)..." value={data.photo4Desc || ''} onChange={e => !readOnly && onChange('photo4Desc', e.target.value)} style={{...inputStyle(readOnly), minHeight: '80px'}} readOnly={readOnly} />
      </div>

      <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
        <div style={{ marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'inline-block' }}>📄 Page 3: Photo 5 &amp; Description</h4>
          <WordCountLabel count={wc(data.photo5Desc || '')} min={60} />
        </div>
        <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, 'photo5')} disabled={readOnly} style={{ marginBottom: '10px', fontSize: '0.8rem' }} />
        {data.photo5 && <div style={{ marginBottom: '10px', fontSize: '0.75rem', color: '#16a34a' }}>✅ Photo 5 Uploaded</div>}
        <textarea placeholder="Description of this photo (Min 60 words)..." value={data.photo5Desc || ''} onChange={e => !readOnly && onChange('photo5Desc', e.target.value)} style={{...inputStyle(readOnly), minHeight: '80px'}} readOnly={readOnly} />
      </div>

      <button onClick={generatePDF} disabled={isGenerating} style={{
        padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: isGenerating ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        {isGenerating ? '⏳ Generating PDF...' : '⬇ Download Intervention PDF'}
      </button>
    </div>
  );
}

/* ── Day 6 ── */
function Day6({ data, onChange, readOnly, studentData }) {
  const ro = { background: readOnly ? '#f9f9f9' : undefined };
  const domain = studentData?.selectedDomain || '';
  const template = getInterventionTemplate(domain);

  return (
    <div>
      <div className="dt-info-box" style={{marginBottom:18}}>
        <h4>Task: Intervention Activity Documentation</h4>
        <ul>
          <li><strong>Select any 1 activity</strong> from the list below and perform it.</li>
          <li>Capture images during the activity.</li>
          <li>Use the <strong>Intervention Activity Report Generator</strong> below to compile your photos and descriptions and generate the report.</li>
          <li>Upload the generated PDF to your Google Drive and submit the public link.</li>
        </ul>
      </div>

      <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#334155' }}>Available Activities for {domain || 'your domain'}:</h5>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '0.9rem' }}>
          {template.activities.map(act => <li key={act} style={{ marginBottom: '6px' }}>{act}</li>)}
          <li>Or any other relevant activity (select &quot;Other&quot;)</li>
        </ul>
      </div>

      <InterventionGenerator data={data} onChange={onChange} readOnly={readOnly} studentData={studentData} />

      <div className="dt-warning-box" style={{marginTop: 20}}>⚠️ Set sharing to <strong>&quot;Anyone with the link can view&quot;</strong>. Private links will NOT be evaluated.</div>
      <div className="dt-link-section">
        <label htmlFor="d6-link">Google Drive Public Link</label>
        <p>Paste the shareable link to your intervention report here.</p>
        <input id="d6-link" type="url" className="dt-link-input" placeholder="https://drive.google.com/…"
          value={data.driveLink||''} readOnly={readOnly} style={ro}
          onChange={e => !readOnly && onChange('driveLink', e.target.value)} />
      </div>
    </div>
  );
}

/* ── Case Study Generator ── */
function CaseStudyGenerator({ studentData, readOnly, survey, saved }) {
  const domain   = studentData?.selectedDomain || '';
  const baseTemplate = getTemplate(domain);
  const template = JSON.parse(JSON.stringify(baseTemplate)); // deep copy for mutation
  
  if (template && template.sections) {
    template.sections.forEach(section => {
      if (section.heading.includes('Stakeholders Covered')) {
        section.heading = '3. Number of Stakeholders Covered';
        const dynamicFields = [];
        if (survey && survey.length > 0) {
          survey.forEach((s, idx) => {
            if (s.stakeholder) {
              dynamicFields.push(`Stakeholder ${idx + 1} (${s.stakeholder})`);
            }
          });
        }
        if (dynamicFields.length === 0) {
          dynamicFields.push('Stakeholder 1', 'Stakeholder 2', 'Stakeholder 3');
        }
        section.fields = dynamicFields;
        section.isStakeholderCount = true;
      }
      if (section.heading.includes('Data Analysis')) {
        if (section.tableRows) {
          const dynamicRows = [];
          if (survey && survey.length > 0) {
            survey.forEach(s => {
              if (s.stakeholder) dynamicRows.push(s.stakeholder);
            });
          }
          if (dynamicRows.length === 0) {
            dynamicRows.push('Stakeholder 1', 'Stakeholder 2', 'Stakeholder 3');
          }
          section.tableRows = dynamicRows;
        }
      }
    });
  }

  const [answers, setAnswers] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const pieChartRef = useRef(null);
  const savedRef = useRef(saved);
  savedRef.current = saved; // keep ref current on every render without adding to dep array

  // Auto-populate basic info and survey summaries
  useEffect(() => {
    if (!studentData || !template) return;
    const basicHeading = template.sections[0]?.heading; // Usually "1. Basic Information" or "1. Basic Details"
    const distHeading = '4. Survey Summary';
    const stakeHeading = '3. Number of Stakeholders Covered';
    
    if (!basicHeading || (!basicHeading.includes('Basic'))) return;

    let totalRespondents = 0;
    let distStr = '';
    const stakeholderCounts = {};
    const pieData = [];

    if (survey && survey.length > 0) {
      survey.forEach((s, idx) => {
        const dayNum = idx + 2;
        const dd = savedRef.current && savedRef.current[dayNum] && savedRef.current[dayNum].data ? savedRef.current[dayNum].data : {};
        const pCount = Object.keys(dd).filter(k => k.startsWith('p')).length;
        
        stakeholderCounts[`Stakeholder ${idx + 1} (${s.stakeholder})`] = pCount.toString();
        totalRespondents += pCount;
        distStr += `${s.stakeholder}: ${pCount}${idx < survey.length - 1 ? ', ' : ''}`;
        
        if (pCount > 0) {
          pieData.push({ label: s.stakeholder, val: pCount });
        }
      });
    }

    const autoFields = {
      [`${basicHeading}__Student Name`]: studentData.name,
      [`${basicHeading}__Roll Number`]: studentData.username,
      [`${basicHeading}__Domain`]: domain,
      [`${basicHeading}__Problem Statement`]: studentData.problemStatementData?.problem_statement,
      [`${basicHeading}__Duration`]: '7 Days',
      [`${distHeading}__Total respondents`]: totalRespondents.toString(),
      [`${distHeading}__Stakeholder-wise distribution`]: distStr,
    };
    
    Object.keys(stakeholderCounts).forEach(k => {
      autoFields[`${stakeHeading}__${k}`] = stakeholderCounts[k];
    });

    // Auto-populate Data Analysis table from survey responses
    const dataAnalysisSection = template.sections.find(s => s.heading.includes('Data Analysis'));
    if (dataAnalysisSection && survey && survey.length > 0) {
      survey.forEach((s, idx) => {
        const dayNum = idx + 2;
        const dd = savedRef.current && savedRef.current[dayNum] && savedRef.current[dayNum].data ? savedRef.current[dayNum].data : {};
        const persons = Object.keys(dd).filter(k => k.startsWith('p'));
        const stakeholderLabel = s.stakeholder;
        const numQ = s.questions ? s.questions.length : 0;
        
        autoFields[`${dataAnalysisSection.heading}__${stakeholderLabel}__No. of Questions`] = numQ.toString();
        
        if (numQ > 0 && persons.length > 0) {
          let totalYes = 0, totalAnswers = 0;
          persons.forEach(pk => {
            s.questions.forEach((q, qi) => {
              const a = dd[pk]?.answers?.[qi];
              if (a === 'Yes' || a === 'No') {
                totalAnswers++;
                if (a === 'Yes') totalYes++;
              }
            });
          });
          if (totalAnswers > 0) {
            const yesPct = Math.round((totalYes / totalAnswers) * 100);
            const noPct = 100 - yesPct;
            autoFields[`${dataAnalysisSection.heading}__${stakeholderLabel}__Yes (%)`] = yesPct.toString();
            autoFields[`${dataAnalysisSection.heading}__${stakeholderLabel}__No (%)`] = noPct.toString();
          }
        }
      });
    }

    if (pieData.length > 0 && pieChartRef.current) {
      const ctx = pieChartRef.current.getContext('2d');
      ctx.clearRect(0, 0, 400, 400);
      let total = pieData.reduce((acc, d) => acc + d.val, 0);
      let startAngle = 0;
      const colors = ['#2e7d32', '#1565c0', '#e65100', '#d32f2f', '#6a1b9a'];
      
      pieData.forEach((d, i) => {
        const sliceAngle = (d.val / total) * 2 * Math.PI;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(200, 200);
        ctx.arc(200, 200, 150, startAngle, startAngle + sliceAngle);
        ctx.fill();
        
        // label
        const midAngle = startAngle + sliceAngle / 2;
        const lx = 200 + 170 * Math.cos(midAngle);
        const ly = 200 + 170 * Math.sin(midAngle);
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = lx > 200 ? 'left' : 'right';
        ctx.fillText(`${d.label} (${d.val})`, lx, ly);
        
        startAngle += sliceAngle;
      });
      autoFields['PIE_CHART_IMG'] = pieChartRef.current.toDataURL('image/png');
    }

    setAnswers(prev => {
      const updated = { ...prev };
      let changed = false;
      Object.entries(autoFields).forEach(([key, value]) => {
        if (value !== undefined && updated[key] !== value) {
          updated[key] = value;
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [studentData, template, domain, survey]);

  const setAns = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

  const getMinWords = (heading, field) => {
    // Auto-filled / identity fields — no word count needed
    if (field.includes('Student Name') || field.includes('Roll Number') || field.includes('Duration') || field.includes('Domain') || field.includes('District') || field.includes('Village/Area')) return 0;
    // Sections 1, 3, 4 are numeric / auto-fetched, no min words
    if (heading.startsWith('1.') || heading.startsWith('3.') || heading.startsWith('4.')) return 0;
    return 30; // All analytical/descriptive fields need ≥ 30 words
  };

  const handlePhotoUpload = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAns(key, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const inputStyle = (ro) => ({
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.88rem',
    background: ro ? '#f9f9f9' : '#fff', resize: 'vertical',
  });

  const PhotoUploadField = ({ label, photoKey, descKey, minWords }) => {
    const count = wc(answers[descKey] || '');
    return (
      <div style={{ marginTop: 10, padding: 12, border: '1px dashed #a5d6a7', borderRadius: 8, background: '#fcfdfc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong style={{ fontSize: '0.85rem', color: '#2e7d32' }}>{label}</strong>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: count < minWords ? '#d32f2f' : '#388e3c' }}>
            {count < minWords ? `Min ${minWords} words (Current: ${count})` : `✓ ${count} words`}
          </span>
        </div>
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
          <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, photoKey)} disabled={readOnly} style={{ fontSize: '0.8rem' }} />
          {answers[photoKey] && <span style={{ fontSize: '0.8rem', color: '#388e3c', marginLeft: 10, fontWeight: 600 }}>✓ Image Selected</span>}
        </div>
        <textarea
          rows={3}
          readOnly={readOnly}
          value={answers[descKey] || ''}
          onChange={e => setAns(descKey, e.target.value)}
          placeholder={`Enter description (min ${minWords} words)...`}
          style={inputStyle(readOnly)}
        />
      </div>
    );
  };

  const generatePDF = async () => {
    // Validation
    for (const section of template.sections) {
      if (section.isStakeholderCount) {
        for (const field of section.fields) {
          const key = `${section.heading}__${field}`;
          if (!answers[`${key}__photo1`] || !answers[`${key}__photo2`]) {
            alert(`Please upload 2 photos for ${field}.`); return;
          }
          if (wc(answers[`${key}__desc1`]) < 20 || wc(answers[`${key}__desc2`]) < 20) {
            alert(`Description for ${field} photos must be at least 20 words.`); return;
          }
        }
      }
      
      if (!section.tableHeaders && !section.isStakeholderCount) {
        for (const field of (section.fields || [])) {
          const minW = getMinWords(section.heading, field);
          if (minW > 0) {
            const key = `${section.heading}__${field}`;
            if (wc(answers[key]) < minW) {
              alert(`The field "${field}" in section "${section.heading}" must be at least ${minW} words.`); return;
            }
          }
        }
      }
      // Validate Data Analysis — Key Issue is mandatory (non-auto fields)
      if (section.tableHeaders && section.tableRows) {
        for (const row of section.tableRows) {
          const keyIssueKey = `${section.heading}__${row}__Key Issue`;
          if (!answers[keyIssueKey] || !answers[keyIssueKey].trim()) {
            alert(`Please enter the Key Issue for "${row}" in the Data Analysis section.`); return;
          }
        }
      }
      if (section.heading.includes('Intervention')) {
        const key = `${section.heading}__InterventionPhotos`;
        if (!answers[`${key}__photo1`] || !answers[`${key}__photo2`]) {
          alert(`Please upload 2 photos for Student Intervention.`); return;
        }
        if (wc(answers[`${key}__desc1`]) < 20 || wc(answers[`${key}__desc2`]) < 20) {
          alert(`Description for Intervention photos must be at least 20 words.`); return;
        }
      }
    }

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
      doc.text('K L DEEMED TO BE UNIVERSITY', PW / 2, y, { align: 'center' });
      y += 7;
      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('(Koneru Lakshmaiah Education Foundation, Deemed to be University under Section 3 of UGC Act, 1956)', PW / 2, y, { align: 'center' });
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
        ['Problem Statement', studentData?.problemStatementData?.problem_statement || '________________'],
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
          const cellH = 8;
          let colWidths = [];
          if (section.heading.includes('Data Analysis')) {
             colWidths = [
               contentW * 0.20, // Stakeholder
               contentW * 0.16, // No of Q
               contentW * 0.11, // Yes
               contentW * 0.11, // No
               contentW * 0.42  // Key Issue
             ];
          } else {
             colWidths = Array(section.tableHeaders.length).fill(contentW / section.tableHeaders.length);
          }

          // Header row
          checkNewPage(cellH + 2);
          doc.setFillColor(220, 240, 220);
          doc.rect(margin, y, contentW, cellH, 'F');
          doc.setDrawColor(100, 140, 100);
          doc.setLineWidth(0.3);
          
          let currentX = margin;
          section.tableHeaders.forEach((h, i) => {
            const w = colWidths[i];
            doc.rect(currentX, y, w, cellH);
            doc.setFont('times', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(20, 60, 20);
            doc.text(h, currentX + 2, y + 5.5);
            currentX += w;
          });
          y += cellH;

          // Data rows
          for (const row of section.tableRows) {
            checkNewPage(cellH + 1);
            doc.setFillColor(250, 255, 250);
            doc.rect(margin, y, contentW, cellH, 'F');
            
            currentX = margin;
            section.tableHeaders.forEach((h, i) => {
              const w = colWidths[i];
              doc.setDrawColor(160, 200, 160);
              doc.rect(currentX, y, w, cellH);
              doc.setFontSize(9);
              
              if (i === 0) {
                doc.setFont('times', 'bold');
                doc.setTextColor(40, 40, 40);
                doc.text(row, currentX + 2, y + 5.5);
              } else {
                doc.setFont('times', 'normal');
                doc.setTextColor(20, 20, 20);
                let val = answers[`${section.heading}__${row}__${h}`] || '';
                // Extremely basic clipping so it doesn't bleed too far
                if (val.length > w / 1.5) val = val.substring(0, Math.floor(w / 1.5)) + '...';
                doc.text(val, currentX + 2, y + 5.5);
              }
              currentX += w;
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
          checkNewPage(16);
          doc.setFontSize(11);
          doc.setFont('times', 'bold');
          doc.setTextColor(30, 60, 30);
          doc.text(`${field}:`, margin + 3, y);
          y += 7;
          if (val.trim()) {
            doc.setFont('times', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(20, 20, 20);
            const vlines = doc.splitTextToSize(val, contentW - 6);
            checkNewPage(vlines.length * 6);
            doc.text(vlines, margin + 6, y);
            y += vlines.length * 6 + 4;
            
            // Add Pie Chart below distribution
            if (field === 'Stakeholder-wise distribution' && answers['PIE_CHART_IMG']) {
              checkNewPage(80);
              doc.addImage(answers['PIE_CHART_IMG'], 'PNG', margin + 30, y, 70, 70);
              y += 75;
            }
          } else {
            // blank lines placeholder
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            for (let l = 0; l < 3; l++) {
              doc.line(margin + 6, y + l * 6, margin + contentW - 6, y + l * 6);
            }
            y += 20;
          }
        }

        // --- Render Photos ---
        if (section.isStakeholderCount) {
          for (const field of section.fields) {
            const key = `${section.heading}__${field}`;
            for (let i = 1; i <= 2; i++) {
              checkNewPage(120);
              doc.setFontSize(11); doc.setFont('times', 'bold'); doc.setTextColor(20, 60, 20);
              doc.text(`${field} - Photo ${i}:`, margin, y); y += 6;
              try { addProportionalImage(doc, answers[`${key}__photo${i}`], margin, y, contentW, 90); } catch(e) { console.error(e); }
              y += 95;
              doc.setFont('times', 'normal'); doc.setTextColor(20, 20, 20);
              const lines = doc.splitTextToSize(answers[`${key}__desc${i}`] || '', contentW);
              doc.text(lines, margin, y); y += lines.length * 5.5 + 6;
            }
          }
        }

        if (section.heading.includes('Intervention')) {
          const key = `${section.heading}__InterventionPhotos`;
          for (let i = 1; i <= 2; i++) {
            checkNewPage(120);
            doc.setFontSize(11); doc.setFont('times', 'bold'); doc.setTextColor(20, 60, 20);
            doc.text(`Student Intervention - Photo ${i}:`, margin, y); y += 6;
            try { doc.addImage(answers[`${key}__photo${i}`], 'JPEG', margin, y, contentW, 90); } catch(e) { console.error(e); }
            y += 95;
            doc.setFont('times', 'normal'); doc.setTextColor(20, 20, 20);
            const lines = doc.splitTextToSize(answers[`${key}__desc${i}`] || '', contentW);
            doc.text(lines, margin, y); y += lines.length * 5.5 + 6;
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
          `SOCIAL INTERNSHIP 2026  |  ${template.title}  |  Page ${p} of ${totalPages}`,
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
      
      <canvas ref={pieChartRef} width="400" height="400" style={{ display: 'none' }} />

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
              <p style={{ fontSize: '0.8rem', color: '#1565c0', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong>ℹ Auto-filled:</strong> No. of Questions, Yes (%), and No (%) are automatically calculated from your survey responses. Only <strong>Key Issue</strong> requires manual entry.
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#e8f5e9' }}>
                    {section.tableHeaders.map(h => (
                      <th key={h} style={{ border: '1px solid #b2dfdb', padding: '7px 10px', textAlign: 'left', fontWeight: 700, color: '#014a01' }}>
                        {h}
                        {h === 'Key Issue' && <span style={{ color: '#d32f2f', marginLeft: 4 }}>*</span>}
                        {(h === 'No. of Questions' || h === 'Yes (%)' || h === 'No (%)') && (
                          <span style={{ fontSize: '0.65rem', color: '#1565c0', marginLeft: 4, fontWeight: 400 }}>(auto)</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.tableRows.map(row => (
                    <tr key={row}>
                      <td style={{ border: '1px solid #c8e6c9', padding: '6px 10px', fontWeight: 600, color: '#333', background: '#fafafa' }}>{row}</td>
                      {section.tableHeaders.slice(1).map((h) => {
                        const key = `${section.heading}__${row}__${h}`;
                        const isAutoFilled = h === 'No. of Questions' || h === 'Yes (%)' || h === 'No (%)';
                        const isKeyIssue = h === 'Key Issue';
                        const hasVal = answers[key] && answers[key].trim();
                        return (
                          <td key={h} style={{ border: '1px solid #c8e6c9', padding: 0, background: isAutoFilled ? '#f0f9f0' : isKeyIssue && !hasVal && !readOnly ? '#fff8f8' : '#fff' }}>
                            <input
                              type={isAutoFilled ? 'number' : 'text'}
                              readOnly={isAutoFilled || readOnly}
                              value={answers[key] || ''}
                              onChange={e => {
                                if (isAutoFilled) return;
                                setAns(key, e.target.value);
                              }}
                              style={{
                                width: '100%', border: 'none', padding: '6px 8px', outline: 'none',
                                background: 'transparent', fontSize: '0.85rem',
                                color: isAutoFilled ? '#2e7d32' : '#1a1a1a',
                                cursor: isAutoFilled ? 'default' : 'text',
                                fontWeight: isAutoFilled ? 600 : 400,
                              }}
                              placeholder={isKeyIssue ? 'Enter key issue… (required)' : '—'}
                            />
                          </td>
                        );
                      })}
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
                const minW = getMinWords(section.heading, field);
                const count = wc(answers[key] || '');
                return (
                  <div key={field}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2e7d32', display: 'block' }}>
                        {field}
                      </label>
                      {minW > 0 && !section.isStakeholderCount && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: count < minW ? '#d32f2f' : '#388e3c' }}>
                          {count < minW ? `Min ${minW} words (Current: ${count})` : `✓ ${count} words`}
                        </span>
                      )}
                    </div>
                    {section.isStakeholderCount ? (
                      <input
                        type="number"
                        min="0"
                        readOnly={readOnly}
                        value={answers[key] || ''}
                        onChange={e => setAns(key, e.target.value)}
                        placeholder="Enter number of people covered"
                        style={inputStyle(readOnly)}
                      />
                    ) : (
                      <>
                        <textarea
                          rows={minW > 0 ? 3 : 2}
                          readOnly={readOnly}
                          value={answers[key] || ''}
                          onChange={e => setAns(key, e.target.value)}
                          placeholder={`Enter ${field.toLowerCase()}…`}
                          style={inputStyle(readOnly)}
                        />
                        {field === 'Stakeholder-wise distribution' && answers['PIE_CHART_IMG'] && (
                          <div style={{ marginTop: 12, padding: 12, background: '#f5f5f5', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <h6 style={{ margin: '0 0 10px 0', color: '#333' }}>Auto-Generated Stakeholder Distribution</h6>
                            <Image src={answers['PIE_CHART_IMG']} alt="Distribution Pie Chart" width={250} height={250} unoptimized style={{ width: 250, height: 250 }} />
                          </div>
                        )}
                      </>
                    )}

                    {/* Render photo upload fields for Stakeholders */}
                    {section.isStakeholderCount && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, marginBottom: 8 }}>
                        <PhotoUploadField label={`${field} - Photo 1`} photoKey={`${key}__photo1`} descKey={`${key}__desc1`} minWords={20} />
                        <PhotoUploadField label={`${field} - Photo 2`} photoKey={`${key}__photo2`} descKey={`${key}__desc2`} minWords={20} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Render photo upload fields for Intervention Section */}
              {section.heading.includes('Intervention') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '2px solid #e8f5e9' }}>
                  <h6 style={{ margin: 0, color: '#2e7d32', fontSize: '0.95rem' }}>Intervention Photos &amp; Descriptions</h6>
                  <PhotoUploadField label="Intervention Photo 1" photoKey={`${section.heading}__InterventionPhotos__photo1`} descKey={`${section.heading}__InterventionPhotos__desc1`} minWords={20} />
                  <PhotoUploadField label="Intervention Photo 2" photoKey={`${section.heading}__InterventionPhotos__photo2`} descKey={`${section.heading}__InterventionPhotos__desc2`} minWords={20} />
                </div>
              )}
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
function Day7({ saved, data, onChange, readOnly, studentData, survey }) {
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
      <CaseStudyGenerator saved={saved} studentData={studentData} readOnly={readOnly} survey={survey} />

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
