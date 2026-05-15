'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FaChartPie, FaChevronDown, FaChevronUp, FaSearch,
  FaTable, FaChartBar, FaSyncAlt, FaLayerGroup,
  FaLightbulb, FaUsers, FaListUl, FaFileAlt,
} from 'react-icons/fa';
import './page.css';

/* ─── Colour palette for pie slices / bars ─── */
const PALETTE = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
];

/* ─── Severity helper ─── */
function getSeverity(pct) {
  if (pct >= 70) return { label: 'High', cls: 'high' };
  if (pct >= 40) return { label: 'Moderate', cls: 'medium' };
  return { label: 'Low', cls: 'low' };
}

/* ─── Mini Pie Chart (Canvas-based, no lib needed) ─── */
function PieChart({ segments, size = 160 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !segments?.length) return;
    const ctx = canvas.getContext('2d');
    const cx = size / 2, cy = size / 2, r = size / 2 - 8;

    ctx.clearRect(0, 0, size, size);

    const total = segments.reduce((s, d) => s + d.value, 0);
    if (!total) return;

    let startAngle = -Math.PI / 2;
    segments.forEach((seg, i) => {
      const sliceAngle = (seg.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.fill();

      // Label
      if (sliceAngle > 0.3) {
        const mid = startAngle + sliceAngle / 2;
        const lx = cx + (r * 0.65) * Math.cos(mid);
        const ly = cy + (r * 0.65) * Math.sin(mid);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${size < 140 ? 9 : 11}px Inter,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${Math.round((seg.value / total) * 100)}%`, lx, ly);
      }

      startAngle += sliceAngle;
    });

    // Centre circle for donut effect
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.42, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }, [segments, size]);

  return (
    <div className="sa-pie-wrap">
      <canvas ref={canvasRef} width={size} height={size} className="sa-pie-canvas" />
      <div className="sa-pie-legend">
        {segments.map((seg, i) => (
          <div key={i} className="sa-pie-legend-item">
            <span className="sa-pie-legend-dot" style={{ background: PALETTE[i % PALETTE.length] }} />
            {seg.label}: <strong>{seg.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Single Question Bar ─── */
function QuestionBar({ qi, question, yes, no, total }) {
  const pct = total > 0 ? Math.round((yes / total) * 100) : 0;
  const sev = getSeverity(pct);
  const barColor = pct >= 70 ? '#ef4444' : pct >= 40 ? '#f59e0b' : '#10b981';

  return (
    <div className="sa-q-row">
      <div className="sa-q-text">
        <strong>{qi + 1}.</strong> {question.replace(' (Yes/No)', '')}
      </div>
      <div className="sa-q-bar-row">
        <div className="sa-q-bar-wrap">
          <div className="sa-q-bar-yes" style={{ width: `${pct}%`, background: barColor }} />
        </div>
        <span className="sa-q-pct" style={{ color: barColor }}>{pct}%</span>
        <span className="sa-q-counts">({yes}Y / {no}N)</span>
        <span className={`sa-severity ${sev.cls}`}>{sev.label}</span>
      </div>
    </div>
  );
}

/* ─── Stakeholder Group ─── */
function StakeholderGroup({ sh }) {
  const { stakeholder, totalPersons, questions, yesCount, noCount } = sh;
  const overallYes = yesCount.reduce((a, b) => a + b, 0);
  const overallNo  = noCount.reduce((a, b) => a + b, 0);
  const overallTotal = overallYes + overallNo;
  const overallPct   = overallTotal > 0 ? Math.round((overallYes / overallTotal) * 100) : 0;

  return (
    <div className="sa-sh-group">
      <div className="sa-sh-header">
        <div className="sa-sh-title">
          <FaUsers /> {stakeholder}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="sa-sh-count">{totalPersons} person{totalPersons !== 1 ? 's' : ''}</span>
          <span className="sa-sh-count">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
          <span className={`sa-severity ${getSeverity(overallPct).cls}`} style={{ fontSize: '0.75rem' }}>
            Overall: {overallPct}% Yes
          </span>
        </div>
      </div>
      <div className="sa-sh-body">
        {questions.length === 0 ? (
          <p className="sa-no-data">No survey question data available.</p>
        ) : (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Question bars */}
            <div style={{ flex: 2, minWidth: 280 }}>
              {questions.map((q, qi) => (
                <QuestionBar
                  key={qi}
                  qi={qi}
                  question={q}
                  yes={yesCount[qi] || 0}
                  no={noCount[qi] || 0}
                  total={(yesCount[qi] || 0) + (noCount[qi] || 0)}
                />
              ))}
            </div>

            {/* Yes/No Pie */}
            <div style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Overall Yes / No
              </div>
              <PieChart
                segments={[
                  { label: 'Yes', value: overallYes },
                  { label: 'No',  value: overallNo  },
                ]}
                size={150}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Table View for a day ─── */
function TableView({ dayData }) {
  if (!dayData || dayData.length === 0) return <p className="sa-no-data">No data submitted for this day.</p>;

  const allShs = dayData;
  if (!allShs.length) return <p className="sa-no-data">No stakeholder data.</p>;

  return (
    <div className="sa-table-wrap">
      <table className="sa-table">
        <thead>
          <tr>
            <th>Stakeholder</th>
            <th>Persons Surveyed</th>
            <th>Question</th>
            <th>Yes</th>
            <th>No</th>
            <th>% Yes</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>
          {allShs.flatMap((sh) =>
            sh.questions.map((q, qi) => {
              const yes   = sh.yesCount[qi] || 0;
              const no    = sh.noCount[qi]  || 0;
              const total = yes + no;
              const pct   = total > 0 ? Math.round((yes / total) * 100) : 0;
              const sev   = getSeverity(pct);
              return (
                <tr key={`${sh.stakeholder}-${qi}`}>
                  {qi === 0 && <td rowSpan={sh.questions.length} style={{ fontWeight: 700, background: '#f0f4ff', color: '#3730a3' }}>{sh.stakeholder}</td>}
                  {qi === 0 && <td rowSpan={sh.questions.length} style={{ textAlign: 'center', fontWeight: 700 }}>{sh.totalPersons}</td>}
                  <td>{q.replace(' (Yes/No)', '')}</td>
                  <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>{yes}</td>
                  <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{no}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800 }}>{pct}%</td>
                  <td>
                    <span className={`sa-severity ${sev.cls}`}>{sev.label}</span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Analysis Text Section ─── */
function AnalysisSection({ analysis }) {
  if (!analysis) return null;

  const days = [
    { key: 'day2', label: 'Day 2 — Stakeholder 1' },
    { key: 'day3', label: 'Day 3 — Stakeholder 2' },
    { key: 'day4', label: 'Day 4 — Stakeholder 3' },
  ];
  const fields = [
    { key: 'topProblems',    label: 'Top Problems Identified',     icon: '🎯' },
    { key: 'rootCauses',     label: 'Root Causes',                  icon: '🔍' },
    { key: 'recommendations',label: 'Recommendations',              icon: '💡' },
  ];

  const hasAnyData = days.some(d =>
    fields.some(f => (analysis[`${d.key}_${f.key}`] || []).length > 0)
  );

  if (!hasAnyData) return null;

  return (
    <div className="sa-analysis-section">
      <div className="sa-analysis-header">
        <FaLightbulb /> Student Analysis Submissions (Day 5)
      </div>
      <div className="sa-analysis-body">
        {days.map(({ key: dk, label: dlabel }) => {
          const hasData = fields.some(f => (analysis[`${dk}_${f.key}`] || []).length > 0);
          if (!hasData) return null;
          return (
            <div key={dk} className="sa-analysis-day">
              <div className="sa-analysis-day-label">
                <FaFileAlt /> {dlabel}
              </div>
              <div className="sa-analysis-fields">
                {fields.map(({ key: fk, label, icon }) => {
                  const entries = analysis[`${dk}_${fk}`] || [];
                  return (
                    <div key={fk} className="sa-analysis-field">
                      <label>{icon} {label} ({entries.length} student{entries.length !== 1 ? 's' : ''})</label>
                      {entries.length === 0 ? (
                        <span className="sa-analysis-empty">No submissions for this field.</span>
                      ) : (
                        <div className="sa-analysis-quotes">
                          {entries.slice(0, 3).map((e, i) => (
                            <div key={i} className="sa-analysis-quote">{e.slice(0, 400)}{e.length > 400 ? '…' : ''}</div>
                          ))}
                          {entries.length > 3 && (
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                              + {entries.length - 3} more submission{entries.length - 3 !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Problem Statement Card ─── */
function PSCard({ ps, psData }) {
  const [open, setOpen]       = useState(false);
  const [activeDay, setActiveDay] = useState('day2');
  const [viewMode, setViewMode]   = useState('chart'); // 'chart' | 'table'

  const { studentCount, days, analysis } = psData;

  // Overall stats
  const totalPersons = ['day2','day3','day4'].reduce((acc, dk) => {
    return acc + (days[dk] || []).reduce((a, sh) => a + sh.totalPersons, 0);
  }, 0);

  const dayLabels = { day2: 'Day 2 – S1', day3: 'Day 3 – S2', day4: 'Day 4 – S3' };

  return (
    <div className="sa-ps-block">
      <div className="sa-ps-header" onClick={() => setOpen(o => !o)}>
        <div className="sa-ps-title">
          <FaListUl className="sa-ps-icon" />
          {ps}
        </div>
        <div className="sa-ps-meta">
          <span className="sa-ps-chip indigo">{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
          <span className="sa-ps-chip green">{totalPersons} surveyed</span>
          <FaChevronDown className={`sa-ps-chevron ${open ? 'open' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="sa-ps-body">
          {/* Stats */}
          <div className="sa-summary-stats" style={{ marginBottom: 18 }}>
            <div className="sa-stat-card">
              <div className="sa-stat-num">{studentCount}</div>
              <div className="sa-stat-lbl">Students</div>
            </div>
            <div className="sa-stat-card">
              <div className="sa-stat-num" style={{ color: '#0ea5e9' }}>{totalPersons}</div>
              <div className="sa-stat-lbl">Total Surveyed</div>
            </div>
            {['day2','day3','day4'].map(dk => {
              const cnt = (days[dk] || []).reduce((a, sh) => a + sh.totalPersons, 0);
              return (
                <div key={dk} className="sa-stat-card">
                  <div className="sa-stat-num" style={{ color: '#10b981', fontSize: '1.4rem' }}>{cnt}</div>
                  <div className="sa-stat-lbl">{dayLabels[dk]}</div>
                </div>
              );
            })}
          </div>

          {/* Pie chart: stakeholder-wise distribution */}
          {totalPersons > 0 && (() => {
            const segs = ['day2','day3','day4'].flatMap(dk =>
              (days[dk] || []).map(sh => ({
                label: sh.stakeholder,
                value: sh.totalPersons,
              }))
            ).filter(s => s.value > 0);
            if (!segs.length) return null;
            return (
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366f1', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📊 Stakeholder Distribution
                </div>
                <div className="sa-pie-section">
                  <PieChart segments={segs} size={200} />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    {segs.map((seg, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: PALETTE[i % PALETTE.length], flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', flex: 1 }}>{seg.label}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: PALETTE[i % PALETTE.length] }}>{seg.value} persons</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Day Tabs */}
          <div className="sa-day-tabs">
            {['day2','day3','day4'].map(dk => (
              <button
                key={dk}
                className={`sa-day-tab ${activeDay === dk ? 'active' : ''}`}
                onClick={() => setActiveDay(dk)}
              >
                {dayLabels[dk]}
                {(days[dk] || []).length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: '0.7rem', opacity: 0.8 }}>
                    ({(days[dk] || []).reduce((a, sh) => a + sh.totalPersons, 0)} persons)
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="sa-view-toggle">
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginRight: 4 }}>View:</span>
            <button className={`sa-view-btn ${viewMode === 'chart' ? 'active' : ''}`} onClick={() => setViewMode('chart')}>
              <FaChartBar /> Charts
            </button>
            <button className={`sa-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
              <FaTable /> Table
            </button>
          </div>

          {/* Day content */}
          {(days[activeDay] || []).length === 0 ? (
            <p className="sa-no-data">No submissions yet for {dayLabels[activeDay]}.</p>
          ) : viewMode === 'chart' ? (
            (days[activeDay] || []).map((sh, idx) => (
              <StakeholderGroup key={idx} sh={sh} />
            ))
          ) : (
            <TableView dayData={days[activeDay] || []} />
          )}

          {/* Analysis Text */}
          <AnalysisSection analysis={analysis} />
        </div>
      )}
    </div>
  );
}

/* ─── Domain Block ─── */
function DomainBlock({ domain, psMap }) {
  const [open, setOpen] = useState(true);

  const psKeys = Object.keys(psMap);
  const totalStudents = psKeys.reduce((a, ps) => a + psMap[ps].studentCount, 0);
  const totalSurveyed = psKeys.reduce((a, ps) => {
    return a + ['day2','day3','day4'].reduce((b, dk) =>
      b + (psMap[ps].days[dk] || []).reduce((c, sh) => c + sh.totalPersons, 0), 0);
  }, 0);

  return (
    <div className="sa-domain-block">
      <div className="sa-domain-header" onClick={() => setOpen(o => !o)}>
        <div className="sa-domain-title">
          <FaLayerGroup style={{ opacity: 0.8 }} />
          {domain}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="sa-domain-badge">{psKeys.length} problem{psKeys.length !== 1 ? 's' : ''}</span>
          <span className="sa-domain-badge">{totalStudents} students</span>
          <span className="sa-domain-badge">{totalSurveyed} surveyed</span>
          <FaChevronDown className={`sa-domain-chevron ${open ? 'open' : ''}`} />
        </div>
      </div>

      {open && psKeys.map(ps => (
        <PSCard key={ps} ps={ps} psData={psMap[ps]} />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function SurveyAnalysis() {
  const [loading, setLoading]   = useState(false);
  const [data, setData]         = useState(null);
  const [filters, setFilters]   = useState(null);
  const [meta, setMeta]         = useState(null);

  const [slotFilter,   setSlotFilter]   = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [psFilter,     setPsFilter]     = useState('all');
  const [search,       setSearch]       = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (slotFilter   !== 'all') params.set('slot',   slotFilter);
      if (domainFilter !== 'all') params.set('domain', domainFilter);
      if (psFilter     !== 'all') params.set('ps',     psFilter);

      const res  = await fetch(`/api/dashboard/admin/survey-analysis?${params}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setFilters(json.filters);
        setMeta(json.meta);
      } else {
        alert(json.error || 'Failed to load survey data');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [slotFilter, domainFilter, psFilter]);

  // Initial load
  useEffect(() => { fetchData(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  // Reset PS filter when domain changes
  const handleDomainChange = (val) => {
    setDomainFilter(val);
    setPsFilter('all');
  };

  const filteredData = data ? Object.entries(data).filter(([domain]) => {
    if (!search) return true;
    return domain.toLowerCase().includes(search.toLowerCase());
  }) : [];

  const psByDomain = filters?.psByDomain || {};
  const psOptions  = domainFilter !== 'all' ? (psByDomain[domainFilter] || []) : [];

  return (
    <div className="sa-wrap">
      {/* ── Header ── */}
      <div className="sa-header">
        <div>
          <h1 className="sa-title">
            <FaChartPie className="sa-title-icon" />
            Survey Analysis
          </h1>
          <p className="sa-subtitle">
            Domain-wise, problem-statement-wise analysis of student survey data across all slots.
          </p>
        </div>
        <button className="sa-filter-btn" onClick={fetchData} disabled={loading} style={{ alignSelf: 'flex-start' }}>
          <FaSyncAlt style={{ marginRight: 6, display: 'inline' }} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* ── Meta chips ── */}
      {meta && (
        <div className="sa-meta-row">
          <span className="sa-meta-chip blue"><FaLayerGroup /> {meta.totalDomains} Domain{meta.totalDomains !== 1 ? 's' : ''}</span>
          <span className="sa-meta-chip purple"><FaListUl /> {meta.totalPS} Problem Statement{meta.totalPS !== 1 ? 's' : ''}</span>
          {filters && <span className="sa-meta-chip green"><FaUsers /> {(filters.slots || []).length} Slot{(filters.slots || []).length !== 1 ? 's' : ''} Active</span>}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="sa-filter-bar">
        <div className="sa-filter-group">
          <label>Slot</label>
          <select value={slotFilter} onChange={e => setSlotFilter(e.target.value)}>
            <option value="all">All Slots</option>
            {(filters?.slots || []).map(s => (
              <option key={s} value={s}>Slot {s}</option>
            ))}
          </select>
        </div>

        <div className="sa-filter-group">
          <label>Domain</label>
          <select value={domainFilter} onChange={e => handleDomainChange(e.target.value)}>
            <option value="all">All Domains</option>
            {(filters?.domains || []).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {psOptions.length > 0 && (
          <div className="sa-filter-group">
            <label>Problem Statement</label>
            <select value={psFilter} onChange={e => setPsFilter(e.target.value)}>
              <option value="all">All Problem Statements</option>
              {psOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}

        <div className="sa-filter-group">
          <label>Search Domain</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <FaSearch style={{ position: 'absolute', left: 10, color: '#94a3b8', fontSize: '0.82rem' }} />
            <input
              type="text"
              placeholder="Filter by domain name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 32px',
                border: '1.5px solid #e2e8f0', borderRadius: 8,
                fontFamily: 'Inter,sans-serif', fontSize: '0.88rem',
                outline: 'none', background: '#f8faff', color: '#0d1b2a',
              }}
            />
          </div>
        </div>

        <button className="sa-filter-btn" onClick={fetchData} disabled={loading}>
          {loading ? 'Loading…' : 'Apply Filters'}
        </button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="sa-loading">
          <div className="sa-spinner" />
          Loading survey data…
        </div>
      ) : !data ? (
        <div className="sa-empty">
          <FaChartPie />
          <h3>No data loaded yet. Click &ldquo;Apply Filters&rdquo; to begin.</h3>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="sa-empty">
          <FaSearch />
          <h3>No domains match your search.</h3>
        </div>
      ) : (
        filteredData.map(([domain, psMap]) => (
          <DomainBlock key={domain} domain={domain} psMap={psMap} />
        ))
      )}
    </div>
  );
}
