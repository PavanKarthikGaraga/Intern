'use client';
import { useState, useEffect } from 'react';
import { FaFileUpload, FaHistory, FaSearch, FaUser, FaClipboardList, FaUsers, FaChartLine } from 'react-icons/fa';

const DAY_LABELS = {
  1: 'Day 1 – Problem Statement Understanding',
  2: 'Day 2 – Stakeholder 1 Survey (8 Persons)',
  3: 'Day 3 – Stakeholder 2 Survey (3 Persons)',
  4: 'Day 4 – Stakeholder 3 Survey (3 Persons)',
  5: 'Day 5 – Data Analysis',
  6: 'Day 6 – Intervention Activity',
  7: 'Day 7 – Documentation & Presentation',
};

const DAYS_WITH_COUNTS = { 2: 8, 3: 3, 4: 3 };

export default function DailyTasksViewer() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/dashboard/mentor/daily-tasks');
        const json = await res.json();
        setStudents(json.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = students.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase()) ||
    s.problem_statement?.toLowerCase().includes(search.toLowerCase())
  );

  const submitted = (s) => Object.keys(s.days || {}).length;

  if (loading) return <div style={S.wrap}><p style={{color:'#888'}}>Loading…</p></div>;

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <h2 style={S.h2}>📋 Daily Tasks – Student Submissions</h2>
        <p style={S.sub}>View each student&apos;s daily task submissions for evaluation.</p>
      </div>

      {students.length === 0 ? (
        <div style={S.empty}>No daily task submissions yet.</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: selected ? '320px 1fr' : '1fr', gap:20, alignItems:'start' }}>

          {/* ── Student list ── */}
          <div>
            <input
              type="text"
              placeholder="Search name / username / PS…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={S.search}
            />
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map(s => (
                <div
                  key={s.username}
                  onClick={() => { setSelected(s); setActiveDay(1); }}
                  style={{
                    ...S.card,
                    border: `2px solid ${selected?.username === s.username ? '#014a01' : '#e9ecef'}`,
                    background: selected?.username === s.username ? '#f0f7f0' : '#fff',
                  }}
                >
                  <div style={S.cardName}>{s.name}</div>
                  <div style={S.cardSub}>@{s.username} · {s.branch}</div>
                  <div style={S.cardPS}>{s.problem_statement || '—'}</div>
                  <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                    {[1,2,3,4,5,6,7].map(d => (
                      <span key={d} style={{
                        padding:'2px 8px', borderRadius:10, fontSize:'0.75rem', fontWeight:700,
                        background: s.days[d] ? '#014a01' : '#f0f0f0',
                        color: s.days[d] ? '#fff' : '#bbb',
                      }}>D{d}</span>
                    ))}
                    <span style={S.countBadge}>{submitted(s)}/7 days</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p style={{color:'#888',fontSize:'0.88rem'}}>No matches.</p>}
            </div>
          </div>

          {/* ── Detail panel ── */}
          {selected && (
            <div style={S.detail}>
              <div style={S.detailHead}>
                <div>
                  <h3 style={S.detailName}>{selected.name}</h3>
                  <span style={S.domainBadge}>{selected.domain}</span>
                  <p style={S.detailPS}><strong>PS:</strong> {selected.problem_statement || '—'}</p>
                  <p style={S.detailUser}>@{selected.username}</p>
                </div>
                <button onClick={() => setSelected(null)} style={S.closeBtn}>✕ Close</button>
              </div>

              {/* Day tabs */}
              <div style={S.dayTabs}>
                {[1,2,3,4,5,6,7].map(d => {
                  const dd = selected.days[d];
                  return (
                    <button key={d}
                      onClick={() => setActiveDay(d)}
                      title={dd ? `Submitted: ${new Date(dd.submittedAt||dd.updatedAt).toLocaleString('en-IN')}` : 'Not submitted'}
                      style={{
                        ...S.dayTab,
                        background: activeDay === d ? '#014a01' : dd ? '#e6f4ea' : '#f5f5f5',
                        color: activeDay === d ? '#fff' : dd ? '#014a01' : '#aaa',
                        border: `1.5px solid ${activeDay === d ? '#014a01' : dd ? '#b7dfb7' : '#e0e0e0'}`,
                      }}
                    >
                      Day {d} {dd ? '✓' : ''}
                    </button>
                  );
                })}
              </div>

              {/* Day content */}
              <DayDetail dayNum={activeDay} dayData={selected.days[activeDay]} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Day detail renderer ── */
function DayDetail({ dayNum, dayData }) {
  if (!dayData) return (
    <div style={S.notSubmitted}>
      <div style={{ fontSize:'2rem' }}>📭</div>
      <p>Day {dayNum} not submitted yet.</p>
    </div>
  );

  const { data, submittedAt, updatedAt } = dayData;
  const fmt = (ts) => ts ? new Date(ts).toLocaleString('en-IN', {
    day:'numeric', month:'short', year:'numeric',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true
  }) : '—';

  return (
    <div>
      <div style={S.dayLabel}>{DAY_LABELS[dayNum]}</div>

      {/* Timestamp banner */}
      <div style={S.tsBanner}>
        <div style={S.tsItem}>
          <span style={S.tsIcon}><FaFileUpload /></span>
          <div>
            <div style={S.tsTitle}>First Submitted</div>
            <div style={S.tsVal}>{fmt(submittedAt)}</div>
          </div>
        </div>
        <div style={S.tsDivider} />
        <div style={S.tsItem}>
          <span style={S.tsIcon}><FaHistory /></span>
          <div>
            <div style={S.tsTitle}>Last Updated</div>
            <div style={S.tsVal}>{fmt(updatedAt)}</div>
          </div>
        </div>
      </div>

      {dayNum === 1 && <Day1View data={data} />}
      {(dayNum === 2 || dayNum === 3 || dayNum === 4) && <SurveyView dayNum={dayNum} data={data} />}
      {dayNum === 5 && <Day5View data={data} />}
      {dayNum === 6 && <Day6View data={data} />}
      {dayNum === 7 && <Day7View data={data} />}
    </div>
  );
}

function Day1View({ data }) {
  const text  = data?.inference || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <label style={S.fieldLabel}>Inference &amp; Analysis</label>
        <span style={{ fontSize:'0.8rem', color: words>=100?'#014a01':'#e65100', fontWeight:700 }}>{words} words</span>
      </div>
      <div style={S.textBox}>{text || <em style={{color:'#bbb'}}>No content</em>}</div>
    </div>
  );
}

function SurveyView({ dayNum, data }) {
  const count = DAYS_WITH_COUNTS[dayNum];
  const persons = Array.from({ length: count }, (_, i) => i+1);
  const [activePerson, setActivePerson] = useState(1);
  const pd = data?.[`p${activePerson}`] || {};

  return (
    <div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        {persons.map(p => {
          const d = data?.[`p${p}`];
          const done = d?.name && Object.keys(d?.answers||{}).length>0;
          return (
            <button key={p} onClick={() => setActivePerson(p)} style={{
              padding:'5px 14px', borderRadius:20, border:`1.5px solid ${activePerson===p?'#014a01':'#ccc'}`,
              background: activePerson===p ? '#014a01' : done ? '#f0faf0' : '#f5f5f5',
              color: activePerson===p ? '#fff' : done ? '#2e7d32' : '#888',
              fontWeight:700, fontSize:'0.82rem', cursor:'pointer',
            }}>
              P{p} {done?'✓':''}
            </button>
          );
        })}
      </div>
      <div style={S.personCard}>
        <p style={S.fieldLabel}>Name: <strong>{pd.name || <em style={{color:'#bbb',fontWeight:400}}>Not entered</em>}</strong></p>
        {pd.answers && Object.keys(pd.answers).length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
            {Object.entries(pd.answers).map(([qi, ans]) => (
              <div key={qi} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'#f8f8f8', borderRadius:8, fontSize:'0.85rem' }}>
                <span style={{color:'#555'}}>Q{parseInt(qi)+1}</span>
                <span style={{
                  padding:'2px 14px', borderRadius:12, fontWeight:700, fontSize:'0.8rem',
                  background: ans==='Yes' ? '#d4edda' : '#fdecea',
                  color: ans==='Yes' ? '#155724' : '#721c24',
                }}>{ans}</span>
              </div>
            ))}
          </div>
        ) : <p style={{color:'#bbb',fontSize:'0.85rem',marginTop:8}}>No answers recorded.</p>}
      </div>
    </div>
  );
}

function Day5View({ data }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        <label style={S.fieldLabel}>1. Overall Analysis of Responses</label>
        <div style={S.textBox}>{data?.analysis || <em style={{color:'#bbb'}}>No content</em>}</div>
      </div>
      <div>
        <label style={S.fieldLabel}>2. Identified Root Causes</label>
        <div style={S.textBox}>{data?.rootcause || <em style={{color:'#bbb'}}>No content</em>}</div>
      </div>
      <div>
        <label style={S.fieldLabel}>3. Proposed Intervention Strategy</label>
        <div style={S.textBox}>{data?.strategy || <em style={{color:'#bbb'}}>No content</em>}</div>
      </div>
    </div>
  );
}

function Day6View({ data }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        <label style={S.fieldLabel}>Google Drive Link</label>
        {data?.driveLink
          ? <a href={data.driveLink} target="_blank" rel="noreferrer" style={S.link}>{data.driveLink}</a>
          : <p style={S.empty2}>Not submitted</p>}
      </div>
      <div>
        <label style={S.fieldLabel}>Activity Description</label>
        <div style={S.textBox}>{data?.notes || <em style={{color:'#bbb'}}>No description</em>}</div>
      </div>
    </div>
  );
}

function Day7View({ data }) {
  const fields = [
    { label: 'Case Study Document', key: 'caseStudyLink' },
    { label: 'YouTube Video Link',  key: 'youtubeLink' },
    { label: 'LinkedIn Article Link',  key: 'linkedinLink' },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {fields.map(({ label, key }) => (
        <div key={key}>
          <label style={S.fieldLabel}>{label}</label>
          {data?.[key]
            ? <a href={data[key]} target="_blank" rel="noreferrer" style={S.link}>{data[key]}</a>
            : <p style={S.empty2}>Not submitted</p>}
        </div>
      ))}
    </div>
  );
}

function InfoView({ text }) {
  return <div style={{ padding:'20px', background:'#f0f7f0', borderRadius:10, color:'#555', fontSize:'0.88rem' }}>{text}</div>;
}

/* ── Styles ── */
const S = {
  wrap:   { padding:24, maxWidth:1100, margin:'0 auto' },
  header: { marginBottom:20 },
  h2:     { fontSize:'1.4rem', fontWeight:700, color:'#014a01', margin:'0 0 4px' },
  sub:    { color:'#666', fontSize:'0.88rem', margin:0 },
  search: { width:'100%', padding:'9px 13px', borderRadius:8, border:'1.5px solid #ccc', fontSize:'0.92rem', marginBottom:12, boxSizing:'border-box' },
  empty:  { textAlign:'center', padding:'40px 20px', background:'#f8f9fa', borderRadius:12, color:'#888' },
  empty2: { color:'#bbb', fontSize:'0.85rem', margin:'4px 0 0' },
  card:   { background:'#fff', borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all 0.15s' },
  cardName: { fontWeight:700, color:'#1a1a1a', fontSize:'0.95rem' },
  cardSub:  { fontSize:'0.8rem', color:'#888', marginTop:2 },
  cardPS:   { fontSize:'0.78rem', color:'#555', marginTop:4, lineHeight:1.4 },
  countBadge: { marginLeft:'auto', padding:'2px 10px', borderRadius:10, fontSize:'0.75rem', fontWeight:700, background:'#e6f4ea', color:'#014a01' },
  detail:     { background:'#fff', border:'1.5px solid #d0e8d0', borderRadius:14, padding:24 },
  detailHead: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18, borderBottom:'2px solid #f0f0f0', paddingBottom:14 },
  detailName: { margin:'0 0 6px', color:'#1a1a1a', fontSize:'1.1rem' },
  detailPS:   { color:'#555', fontSize:'0.88rem', margin:'6px 0 0' },
  detailUser: { color:'#888', fontSize:'0.8rem', margin:'2px 0 0' },
  domainBadge: { background:'#e3f2fd', color:'#1565c0', padding:'3px 12px', borderRadius:20, fontSize:'0.78rem', fontWeight:700 },
  closeBtn:   { padding:'6px 16px', border:'1.5px solid #ccc', borderRadius:8, background:'#fff', cursor:'pointer', fontWeight:600, fontSize:'0.85rem', color:'#555', whiteSpace:'nowrap' },
  dayTabs:    { display:'flex', flexWrap:'wrap', gap:8, marginBottom:18 },
  dayTab:     { padding:'6px 14px', borderRadius:20, fontWeight:700, fontSize:'0.82rem', cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' },
  dayLabel:   { marginBottom:14, fontWeight:700, color:'#014a01', fontSize:'0.95rem' },
  ts:         { fontSize:'0.75rem', color:'#888', fontWeight:400 },
  tsBanner:   { display:'flex', alignItems:'center', gap:0, background:'#f0f7f0', border:'1.5px solid #b7dfb7', borderRadius:10, padding:'12px 16px', marginBottom:18, flexWrap:'wrap' },
  tsItem:     { display:'flex', alignItems:'center', gap:10, flex:1, minWidth:200 },
  tsIcon:     { fontSize:'1.3rem', flexShrink:0 },
  tsTitle:    { fontSize:'0.72rem', fontWeight:700, color:'#666', textTransform:'uppercase', letterSpacing:'0.04em' },
  tsVal:      { fontSize:'0.88rem', fontWeight:700, color:'#014a01', marginTop:2 },
  tsDivider:  { width:1, background:'#b7dfb7', alignSelf:'stretch', margin:'0 16px' },
  fieldLabel: { display:'block', fontWeight:600, color:'#333', fontSize:'0.85rem', marginBottom:4 },
  textBox:    { background:'#f9f9f9', border:'1px solid #eee', borderRadius:8, padding:'12px 14px', fontSize:'0.88rem', color:'#333', lineHeight:1.6, whiteSpace:'pre-wrap', minHeight:80 },
  link:       { display:'block', color:'#1565c0', fontSize:'0.88rem', wordBreak:'break-all', marginTop:4, textDecoration:'underline' },
  personCard: { background:'#f9f9f9', border:'1px solid #eee', borderRadius:10, padding:'14px 16px' },
  notSubmitted: { textAlign:'center', padding:'40px', color:'#888', fontSize:'0.88rem' },
};
