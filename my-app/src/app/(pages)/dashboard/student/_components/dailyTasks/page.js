'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { surveyData as SURVEY } from './surveyDataShared';
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

/** 11:59:59 PM IST on the Nth day of the slot */
function dayDeadline(slot, dayNum) {
  const start = SLOT_START[slot];
  if (!start) return null;
  const d = new Date(start);
  d.setDate(d.getDate() + (dayNum - 1));
  // 23:59:59.999 in IST = UTC+5:30
  // We store as absolute epoch so it's device-clock-independent when compared with serverNow()
  d.setHours(23, 59, 59, 999);
  return d;
}

/* Offset between server IST epoch and device clock — set once on mount */
let _serverOffset = 0;   // ms
function serverNow() { return Date.now() + _serverOffset; }

function dayLabel(slot, dayNum) {
  const dl = dayDeadline(slot, dayNum);
  if (!dl) return '';
  return dl.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

const DEMO_ID = '2500099999';

/**
 * Status: 'upcoming' | 'open' | 'submitted' | 'missed' | 'locked'
 */
function getDayStatus(dayNum, slot, saved, username) {
  // ── Demo bypass: all days open regardless of date ──
  if (username === DEMO_ID) {
    return saved[dayNum] ? 'submitted' : 'open';
  }
  if (!slot || !SLOT_START[slot]) return 'upcoming';
  const dl = dayDeadline(slot, dayNum);
  const now = serverNow();   // ← server-authoritative IST time
  const isSubmitted = !!saved[dayNum];
  if (isSubmitted) return 'submitted';
  if (dl && now > dl.getTime()) return 'missed';
  if (dayNum === 1) {
    return now >= SLOT_START[slot].getTime() ? 'open' : 'upcoming';
  }
  const prevStatus = getDayStatus(dayNum - 1, slot, saved, username);
  if (prevStatus === 'missed' || prevStatus === 'locked') return 'locked';
  if (prevStatus !== 'submitted') return 'upcoming';
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
  return st === 'submitted' ? '✓' : st === 'locked' ? '🔒' : st === 'missed' ? '❌' : st === 'upcoming' ? '⏳' : '▶';
}
function wc(text) { return text.trim() === '' ? 0 : text.trim().split(/\s+/).length; }

const DAY_META = [
  { day:1, icon:'📋', title:'Day 1 – Problem Statement Understanding', subtitle:'Write your inference and analysis (minimum 100 words)' },
  { day:2, icon:'🤝', title:'Day 2 – Stakeholder 1 Survey (8 Persons)',  subtitle:'Interview 8 people from the 1st stakeholder group' },
  { day:3, icon:'🤝', title:'Day 3 – Stakeholder 2 Survey (3 Persons)',  subtitle:'Interview 3 people from the 2nd stakeholder group' },
  { day:4, icon:'🤝', title:'Day 4 – Stakeholder 3 Survey (3 Persons)',  subtitle:'Interview 3 people from the 3rd stakeholder group' },
  { day:5, icon:'📊', title:'Day 5 – Data Analysis',                     subtitle:'Count responses, calculate percentages & identify insights' },
  { day:6, icon:'📸', title:'Day 6 – Intervention Activity',             subtitle:'Upload photo documentation from Days 2, 3 & 4' },
  { day:7, icon:'📹', title:'Day 7 – Documentation & Presentation',      subtitle:'Submit case study report, YouTube video & LinkedIn post' },
];

/* ── Timer bar component ── */
function TimerBar({ deadline }) {
  const [tick, setTick] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = deadline - serverNow();   // ← server time
      if (diff <= 0) { setTick('Submission closed'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTick(`${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  const urgent = (deadline - serverNow()) < 3 * 3600000 && (deadline - serverNow()) > 0;
  return (
    <div className="dt-timer-bar">
      <span className="dt-timer-label">⏰ Submission window closes in:</span>
      <span className={`dt-timer-count${urgent ? ' urgent' : ''}`}>{tick}</span>
      <span className="dt-timer-date">
        Deadline: {deadline.toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit', hour12:true })}
      </span>
    </div>
  );
}

/* ── Lock overlay ── */
function LockedView({ status, dayNum, slot }) {
  const dl = slot ? dayDeadline(slot, dayNum) : null;
  const dateStr = dl ? dl.toLocaleDateString('en-IN', { day:'numeric', month:'long' }) : '';
  if (status === 'missed') return (
    <div className="dt-locked-overlay missed-lock">
      <div className="lock-icon">❌</div>
      <h3>Submission Window Closed</h3>
      <p>The deadline for Day {dayNum} ({dateStr}) passed without a submission.<br/>This day is permanently locked.</p>
    </div>
  );
  if (status === 'locked') return (
    <div className="dt-locked-overlay missed-lock">
      <div className="lock-icon">🔒</div>
      <h3>Day {dayNum} Locked</h3>
      <p>A previous day was not submitted in time. All subsequent days are locked.<br/>Contact your mentor if you believe this is an error.</p>
    </div>
  );
  return (
    <div className="dt-locked-overlay">
      <div className="lock-icon">⏳</div>
      <h3>Day {dayNum} Not Yet Available</h3>
      <p>{dayNum === 1
        ? `This day opens on ${dateStr} when your slot begins.`
        : `Complete and submit Day ${dayNum - 1} first to unlock this day.`}
      </p>
    </div>
  );
}

/* ── Main component ── */
export default function DailyTasks({ studentData }) {
  const [activeDay, setActiveDay] = useState(null);
  const [saved, setSaved]     = useState({});
  const [draft, setDraft]     = useState({});
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
        setSaved(tasks);
        const firstOpen = [1,2,3,4,5,6,7].find(d => {
          const st = getDayStatus(d, slot, tasks, username);
          return st === 'open' || st === 'submitted';
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
        <h3>⚠️ Problem Statement Not Selected</h3>
        <p>Please select your Problem Statement in the Overview section first.</p>
      </div>
    </div>
  );

  if (activeDay === null) return <div className="dt-wrap"><p style={{color:'#888'}}>Loading…</p></div>;

  const statuses    = Object.fromEntries([1,2,3,4,5,6,7].map(d => [d, getDayStatus(d, slot, saved, username)]));
  const meta        = DAY_META[activeDay - 1];
  const activeStatus = statuses[activeDay];
  const isSaved     = activeStatus === 'submitted' && !draft[activeDay];
  const deadline    = slot ? dayDeadline(slot, activeDay) : null;
  const isEditable  = activeStatus === 'open';

  return (
    <div className="dt-wrap">
      <div className="dt-header">
        <div>
          <h2>📅 Daily Tasks</h2>
          <p>Problem Statement: <strong>{ps}</strong>
            {slot && <span style={{marginLeft:8,fontSize:'0.8rem',color:'#888'}}>· Slot {slot}</span>}
          </p>
        </div>
        {activeStatus === 'open' && deadline && <TimerBar deadline={deadline} />}
      </div>

      {/* Timeline pills */}
      <div className="dt-timeline">
        {DAY_META.map(m => {
          const st = statuses[m.day];
          const canClick = st === 'open' || st === 'submitted';
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
            {slot && <p className="dt-day-date">📅 {dayLabel(slot, activeDay)} · Closes 11:59 PM IST</p>}
          </div>
        </div>
        <div className="dt-card-body">
          {(activeStatus === 'locked' || activeStatus === 'missed' || activeStatus === 'upcoming')
            ? <LockedView status={activeStatus} dayNum={activeDay} slot={slot} />
            : (
              <>
                {activeDay === 1 && <Day1 data={dayData(1)} onChange={(f,v) => setDayField(1,f,v)} ps={ps} readOnly={isSaved} />}
                {activeDay === 2 && <DaySurvey day={2} personCount={8} stakeholderIdx={0} survey={survey} data={dayData(2)} onChange={(f,v) => setDayField(2,f,v)} readOnly={isSaved} />}
                {activeDay === 3 && <DaySurvey day={3} personCount={3} stakeholderIdx={1} survey={survey} data={dayData(3)} onChange={(f,v) => setDayField(3,f,v)} readOnly={isSaved} />}
                {activeDay === 4 && <DaySurvey day={4} personCount={3} stakeholderIdx={2} survey={survey} data={dayData(4)} onChange={(f,v) => setDayField(4,f,v)} readOnly={isSaved} />}
                {activeDay === 5 && <Day5 saved={saved} survey={survey} />}
                {activeDay === 6 && <Day6 data={dayData(6)} onChange={(f,v) => setDayField(6,f,v)} readOnly={isSaved} />}
                {activeDay === 7 && <Day7 data={dayData(7)} onChange={(f,v) => setDayField(7,f,v)} readOnly={isSaved} />}

                {activeDay !== 5 && (
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
function DaySurvey({ day, personCount, stakeholderIdx, survey, data, onChange, readOnly }) {
  const [activePerson, setActivePerson] = useState(1);
  if (!survey) return <div className="dt-info-box"><h4>Survey data not available</h4><p>No questions found for your problem statement. Contact admin.</p></div>;

  const sh = survey[stakeholderIdx];
  if (!sh) return <p>Stakeholder not found.</p>;

  const persons = Array.from({ length: personCount }, (_, i) => i + 1);
  const pk = (p) => `p${p}`;
  const pd = (p) => data[pk(p)] || { name: '', answers: {} };
  const isFilled = (p) => { const d = pd(p); return d.name?.trim() && Object.keys(d.answers||{}).length > 0; };

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
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Day 5 – Analysis ── */
function Day5({ saved, survey }) {
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
    const avg = stats.length ? Math.round(stats.reduce((a,s)=>a+s.yesPct,0)/stats.length) : 0;
    return { sh, day, persons, stats, avg, severity: avg>=70?'high':avg>=40?'medium':'low' };
  }).filter(Boolean);

  if (analyses.every(a => a.persons.length===0)) return (
    <div className="dt-info-box">
      <h4>📊 Data Analysis</h4>
      <p>No survey data yet. Complete Days 2, 3, and 4 first.</p>
    </div>
  );

  return (
    <div>
      <div className="dt-analysis-info">
        <strong>Auto-generated from Days 2, 3 &amp; 4.</strong> Review Yes% per question, identify severity, root causes, and affected groups.
      </div>
      {analyses.map(({ sh, day, persons, stats, avg, severity }) => (
        <div key={day} className="dt-sh-analysis">
          <h4>Day {day} – {sh.stakeholder} ({persons.length} persons)</h4>
          {persons.length===0
            ? <p style={{color:'#888',fontSize:'0.88rem'}}>No data for this day yet.</p>
            : stats.map(({ q, yes, no, yesPct }, qi) => (
              <div key={qi} className="dt-q-stat">
                <span className="q-label">{qi+1}. {q.replace(' (Yes/No)','')}</span>
                <div className="dt-bar-wrap"><div className="dt-bar-yes" style={{width:`${yesPct}%`}} /></div>
                <span className="dt-pct">{yesPct}% Yes</span>
                <span style={{fontSize:'0.78rem',color:'#888'}}>({yes}Y/{no}N)</span>
              </div>
            ))
          }
          {persons.length>0 && (
            <div className="dt-severity-box">
              <h4>📌 Insights for {sh.stakeholder}</h4>
              <div className="dt-severity-item">
                <strong>Severity:</strong>
                <span className={`dt-severity-label ${severity}`}>
                  {severity==='high'?'🔴 High':severity==='medium'?'🟡 Medium':'🟢 Low'}
                </span> ({avg}% avg Yes)
              </div>
              <div className="dt-severity-item">
                <strong>Root Causes:</strong>{' '}
                {stats.filter(s=>s.yesPct>=60).length>0
                  ? `Top issues: ${stats.filter(s=>s.yesPct>=60).map(s=>`"${s.q.split('?')[0]}"`).join(', ')}.`
                  : 'No dominant issues in this group.'}
              </div>
              <div className="dt-severity-item"><strong>Affected Group:</strong> {sh.stakeholder} — {persons.length} individuals.</div>
            </div>
          )}
        </div>
      ))}
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
          <li>Compile all photos from Days 2, 3, and 4 stakeholder interactions</li>
          <li>Add <strong>date</strong> and <strong>description</strong> for each photo</li>
          <li>Upload to Google Doc / Drive folder — <strong>must be publicly viewable</strong></li>
        </ul>
      </div>
      <div className="dt-warning-box">⚠️ Set sharing to <strong>&quot;Anyone with the link can view&quot;</strong>. Private links will NOT be evaluated.</div>
      <div className="dt-link-section">
        <label htmlFor="d6-link">Google Drive / Doc Public Link</label>
        <p>Paste the shareable link to your photo documentation.</p>
        <input id="d6-link" type="url" className="dt-link-input" placeholder="https://drive.google.com/…"
          value={data.driveLink||''} readOnly={readOnly} style={ro}
          onChange={e => !readOnly && onChange('driveLink', e.target.value)} />
      </div>
      <div className="dt-textarea-wrap">
        <label htmlFor="d6-notes">Brief Description of Intervention Activity</label>
        <textarea id="d6-notes" className="dt-textarea" style={{minHeight:100,...ro}}
          placeholder="Describe your intervention activity and key observations…"
          value={data.notes||''} readOnly={readOnly}
          onChange={e => !readOnly && onChange('notes', e.target.value)} />
      </div>
    </div>
  );
}

/* ── Day 7 ── */
function Day7({ data, onChange, readOnly }) {
  const ro = { background: readOnly ? '#f9f9f9' : undefined };
  return (
    <div>
      <div className="dt-info-box" style={{marginBottom:18}}>
        <h4>Task: Documentation &amp; Presentation</h4>
        <ul>
          <li><strong>Case Study Report:</strong> Prepare using the template (will be shared). Upload to Google Docs/Drive.</li>
          <li><strong>Presentation Video:</strong> PowerPoint + face recording + voiceover.</li>
          <li>Upload video to <strong>YouTube</strong> and <strong>LinkedIn</strong>.</li>
          <li>Submit all three links below.</li>
        </ul>
      </div>
      <div className="dt-link-section">
        <label htmlFor="d7-cs">Case Study Document Public Link</label>
        <p>Google Docs / Drive link — must be publicly viewable.</p>
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
        <label htmlFor="d7-li">Presentation – LinkedIn Post Link</label>
        <p>Share your video on LinkedIn and paste the post URL.</p>
        <input id="d7-li" type="url" className="dt-link-input" placeholder="https://linkedin.com/posts/…"
          value={data.linkedinLink||''} readOnly={readOnly} style={ro}
          onChange={e => !readOnly && onChange('linkedinLink', e.target.value)} />
      </div>
      <div className="dt-warning-box">⚠️ Case study template will be provided soon. Prepare content in advance.</div>
    </div>
  );
}
