'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import './page.css';

/* ── colour palette ── */
const ACCENT   = '#1e3a8a';   // deep blue (govt)
const GREEN    = '#15803d';
const ORANGE   = '#c2410c';
const GOLD     = '#b45309';

const DOMAIN_COLORS = [
  '#1e3a8a','#0f766e','#7e22ce','#b45309',
  '#9f1239','#166534','#1d4ed8','#0369a1',
];

/* ── helpers ── */
function pct(yes, no) {
  const t = yes + no;
  return t ? Math.round((yes / t) * 100) : 0;
}
function barColor(p) {
  if (p >= 60) return '#16a34a';
  if (p >= 35) return '#d97706';
  return '#dc2626';
}

/* ── Mini horizontal bar ── */
function HBar({ yPct }) {
  const c = barColor(yPct);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
      <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${yPct}%`, height: '100%', background: c, borderRadius: 4, transition: 'width .5s' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: c, minWidth: 32 }}>{yPct}%</span>
    </div>
  );
}

/* ── Canvas Donut Chart ── */
function DonutChart({ yes, no, size = 120 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = size / 2, cy = size / 2, r = size / 2 - 10;
    ctx.clearRect(0, 0, size, size);
    const total = yes + no;
    if (!total) { ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); return; }
    const yPct = yes / total;
    // Yes arc
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,-Math.PI/2, -Math.PI/2 + yPct*2*Math.PI); ctx.closePath();
    ctx.fillStyle = '#16a34a'; ctx.fill();
    // No arc
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,-Math.PI/2 + yPct*2*Math.PI, Math.PI*1.5); ctx.closePath();
    ctx.fillStyle = '#ef4444'; ctx.fill();
    // Donut hole
    ctx.beginPath(); ctx.arc(cx,cy,r*0.48,0,Math.PI*2);
    ctx.fillStyle = '#fff'; ctx.fill();
    // Centre text
    ctx.fillStyle = '#1e293b'; ctx.font = `bold ${size < 100 ? 11 : 13}px Inter,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(yPct*100)}%`, cx, cy);
  }, [yes, no, size]);
  return <canvas ref={ref} width={size} height={size} />;
}

/* ── Survey question table for one stakeholder ── */
function StakeholderTable({ sh }) {
  const { stakeholder, questions, yesCount, noCount, totalPersons } = sh;
  const overallYes   = yesCount.reduce((a,b) => a+b, 0);
  const overallNo    = noCount.reduce((a,b) => a+b, 0);
  const overallPct   = pct(overallYes, overallNo);
  return (
    <div className="sr-sh-block">
      <div className="sr-sh-header">
        <span className="sr-sh-name">{stakeholder}</span>
        <span className="sr-sh-meta">{totalPersons} persons surveyed · Overall Yes: <b style={{ color: barColor(overallPct) }}>{overallPct}%</b></span>
      </div>
      <table className="sr-q-table">
        <thead>
          <tr><th>#</th><th>Question</th><th>Yes</th><th>No</th><th>% Yes</th><th style={{ width: 120 }}>Bar</th><th>Chart</th></tr>
        </thead>
        <tbody>
          {questions.map((q, qi) => {
            const y = yesCount[qi] || 0;
            const n = noCount[qi]  || 0;
            const p = pct(y, n);
            return (
              <tr key={qi}>
                <td>{qi + 1}</td>
                <td>{q.replace(' (Yes/No)', '')}</td>
                <td style={{ color: GREEN, fontWeight: 700 }}>{y}</td>
                <td style={{ color: '#dc2626', fontWeight: 700 }}>{n}</td>
                <td style={{ fontWeight: 800, color: barColor(p) }}>{p}%</td>
                <td><HBar yPct={p} /></td>
                <td style={{ textAlign: 'center' }}><DonutChart yes={y} no={n} size={48} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Domain section ── */
function DomainSection({ domain, psMap, colorIdx }) {
  const color = DOMAIN_COLORS[colorIdx % DOMAIN_COLORS.length];
  return (
    <div className="sr-domain-block">
      <div className="sr-domain-header" style={{ borderLeft: `5px solid ${color}`, paddingLeft: 14 }}>
        <h2 className="sr-domain-title" style={{ color }}>{domain}</h2>
      </div>

      {Object.entries(psMap).map(([ps, psData]) => (
        <div key={ps} className="sr-ps-block">
          <div className="sr-ps-header">
            <span className="sr-ps-title">Problem Statement: {ps}</span>
            <div className="sr-ps-chips">
              <span className="sr-chip blue">{psData.studentCount} students</span>
              {psData.incampus > 0 && <span className="sr-chip green">{psData.incampus} In-Campus</span>}
              {psData.invillage > 0 && <span className="sr-chip amber">{psData.invillage} In-Village</span>}
            </div>
          </div>

          {['day2','day3','day4'].map((dk, di) => {
            const shArr = psData.days[dk] || [];
            if (!shArr.length) return null;
            return (
              <div key={dk} className="sr-day-block">
                <div className="sr-day-label">Day {di + 2} — Stakeholder Survey {di + 1}</div>
                {shArr.map((sh, si) => <StakeholderTable key={si} sh={sh} />)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ── PDF Generation ── */
async function generatePDF(reportData, slot) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, PH = 297, M = 15;
  let y = M;
  let pageNum = 1;

  const addPage = () => {
    doc.addPage();
    pageNum++;
    y = M;
    // footer
    doc.setFontSize(8); doc.setTextColor(120,120,120);
    doc.text(`Page ${pageNum} | Confidential — Government of India Report`, PW/2, PH - 8, { align: 'center' });
  };
  const checkY = (needed) => { if (y + needed > PH - 20) addPage(); };
  const setColor = (hex) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    doc.setTextColor(r,g,b);
  };
  const fillRect = (x, fy, w, h, hex) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    doc.setFillColor(r,g,b); doc.rect(x, fy, w, h, 'F');
  };

  const { slotInfo, totalStudents, totalIncampus, totalInvillage, totalRemote,
          surveyedIncampus, surveyedInvillage, villages, domains } = reportData;

  // ── PAGE 1: Cover ──────────────────────────────────────────────────────
  fillRect(0, 0, PW, 60, '#1e3a8a');
  doc.setFontSize(9); doc.setTextColor(255,255,255);
  doc.text('GOVERNMENT OF INDIA — SOCIAL INTERNSHIP PROGRAMME 2026', PW/2, 18, { align: 'center' });
  doc.setFontSize(18); doc.setFont(undefined, 'bold');
  doc.text('Social Internship Survey', PW/2, 32, { align: 'center' });
  doc.setFontSize(14);
  doc.text('Slot-wise Analysis Report', PW/2, 42, { align: 'center' });
  doc.setFontSize(10); doc.setFont(undefined, 'normal');
  doc.text(slotInfo.label, PW/2, 53, { align: 'center' });

  y = 72;
  doc.setFontSize(10); doc.setTextColor(60,60,60);
  doc.setFont(undefined, 'bold');
  doc.text('Villages Covered:', M, y); y += 7;
  doc.setFont(undefined, 'normal');
  villages.forEach(v => { doc.text(`• ${v}`, M + 4, y); y += 6; });

  y += 4;
  doc.setDrawColor(180,180,180); doc.line(M, y, PW-M, y); y += 8;

  doc.setFont(undefined, 'bold'); doc.setFontSize(11); setColor('#1e3a8a');
  doc.text('Executive Summary', M, y); y += 8;

  const summaryRows = [
    ['Total Students (Slot 1)', String(totalStudents)],
    ['In-Campus Students', String(totalIncampus)],
    ['In-Village Students', String(totalInvillage)],
    ['Remote Students', String(totalRemote)],
    ['Persons Surveyed (Campus)', String(surveyedIncampus)],
    ['Persons Surveyed (Village)', String(surveyedInvillage)],
    ['Domains Covered', String(Object.keys(domains).length)],
  ];

  doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(30,30,30);
  summaryRows.forEach(([label, val], i) => {
    if (i % 2 === 0) fillRect(M, y - 3, PW - 2*M, 8, '#f0f4ff');
    doc.text(label, M + 2, y + 2);
    doc.text(val, PW - M - 2, y + 2, { align: 'right' });
    y += 8;
  });

  y += 6;
  doc.setFontSize(8); doc.setTextColor(100,100,100);
  doc.text(`Report generated on ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}`, M, y);
  doc.text(`Confidential | Social Internship Cell | RGUKT Basar`, PW - M, y, { align: 'right' });

  // Footer page 1
  doc.setFontSize(8); doc.setTextColor(120,120,120);
  doc.text(`Page 1 | Confidential — Government of India Report`, PW/2, PH - 8, { align: 'center' });

  // ── Subsequent pages: domain-wise ────────────────────────────────────
  Object.entries(domains).forEach(([domain, psMap], di) => {
    const domColor = DOMAIN_COLORS[di % DOMAIN_COLORS.length];

    addPage();
    // Domain header band
    const r = parseInt(domColor.slice(1,3),16), g = parseInt(domColor.slice(3,5),16), b = parseInt(domColor.slice(5,7),16);
    doc.setFillColor(r,g,b); doc.rect(0, 0, PW, 20, 'F');
    doc.setFontSize(13); doc.setFont(undefined,'bold'); doc.setTextColor(255,255,255);
    doc.text(`Domain: ${domain}`, PW/2, 13, { align: 'center' });
    y = 28;

    Object.entries(psMap).forEach(([ps, psData]) => {
      checkY(30);
      // PS Header
      fillRect(M, y - 3, PW - 2*M, 14, '#eff6ff');
      doc.setFontSize(9); doc.setFont(undefined,'bold'); doc.setTextColor(30,58,138);
      doc.text(`Problem Statement: ${ps}`, M + 2, y + 4); y += 7;
      doc.setFontSize(8); doc.setFont(undefined,'normal'); doc.setTextColor(60,60,60);
      doc.text(`Students: ${psData.studentCount}   In-Campus: ${psData.incampus}   In-Village: ${psData.invillage}`, M+2, y + 2); y += 10;

      ['day2','day3','day4'].forEach((dk, di) => {
        const shArr = psData.days[dk] || [];
        if (!shArr.length) return;
        checkY(20);
        doc.setFontSize(9); doc.setFont(undefined,'bold'); doc.setTextColor(100,60,10);
        doc.text(`Day ${di+2} — Stakeholder Survey ${di+1}`, M, y); y += 7;

        shArr.forEach(sh => {
          checkY(28);
          doc.setFontSize(8); doc.setFont(undefined,'bold'); doc.setTextColor(30,30,30);
          doc.text(`${sh.stakeholder}  (${sh.totalPersons} persons surveyed)`, M, y); y += 5;

          // Table header
          fillRect(M, y - 1, PW - 2*M, 6, '#1e3a8a');
          doc.setTextColor(255,255,255); doc.setFontSize(7.5); doc.setFont(undefined,'bold');
          doc.text('#', M+1, y+3.5);
          doc.text('Question', M+8, y+3.5);
          doc.text('Yes', PW-M-38, y+3.5, { align: 'right' });
          doc.text('No', PW-M-28, y+3.5, { align: 'right' });
          doc.text('% Yes', PW-M-12, y+3.5, { align: 'right' });
          y += 7;

          sh.questions.forEach((q, qi) => {
            checkY(8);
            const yy = sh.yesCount[qi] || 0;
            const nn = sh.noCount[qi]  || 0;
            const pp = pct(yy, nn);
            const c  = barColor(pp);
            if (qi % 2 === 0) fillRect(M, y-1, PW-2*M, 7, '#f8fafc');
            doc.setTextColor(30,30,30); doc.setFont(undefined,'normal'); doc.setFontSize(7.5);
            doc.text(`${qi+1}`, M+1, y+3.5);
            const qText = q.replace(' (Yes/No)','');
            doc.text(qText.length > 68 ? qText.slice(0,65)+'…' : qText, M+8, y+3.5);
            doc.setFont(undefined,'bold');
            doc.setTextColor(21,128,61); doc.text(String(yy), PW-M-38, y+3.5, { align: 'right' });
            doc.setTextColor(220,38,38); doc.text(String(nn), PW-M-28, y+3.5, { align: 'right' });
            const cr = parseInt(c.slice(1,3),16), cg = parseInt(c.slice(3,5),16), cb = parseInt(c.slice(5,7),16);
            doc.setTextColor(cr,cg,cb); doc.text(`${pp}%`, PW-M-12, y+3.5, { align: 'right' });
            doc.setFont(undefined,'normal'); doc.setTextColor(30,30,30);

            // Mini bar
            const barX = PW-M-45; const barW = 20;
            fillRect(barX, y, barW, 5, '#e2e8f0');
            fillRect(barX, y, barW * pp / 100, 5, c);
            y += 7;
          });

          y += 4;
        });
      });
      y += 6;
    });
  });

  doc.save(`Slot${slot}_SurveyReport_${new Date().toISOString().slice(0,10)}.pdf`);
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export default function SlotReport() {
  const [slot, setSlot]         = useState(1);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [generating, setGen]    = useState(false);
  const [error, setError]       = useState('');

  const fetchReport = useCallback(async (s) => {
    setLoading(true); setError(''); setData(null);
    try {
      const res  = await fetch(`/api/dashboard/admin/slot-report?slot=${s}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to fetch report');
    } catch (e) { setError('Network error — ' + e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReport(1); }, [fetchReport]);

  const handleSlotChange = (s) => { setSlot(s); fetchReport(s); };

  const handleGeneratePDF = async () => {
    if (!data) return;
    setGen(true);
    try { await generatePDF(data, slot); }
    catch (e) { alert('PDF generation failed: ' + e.message); }
    finally { setGen(false); }
  };

  return (
    <div className="sr-root">
      {/* ── Toolbar ── */}
      <div className="sr-toolbar">
        <div className="sr-toolbar-left">
          <h1 className="sr-page-title">📊 Slot-wise Survey Report</h1>
          <p className="sr-page-sub">Government of India — Social Internship Programme 2026</p>
        </div>
        <div className="sr-toolbar-right">
          <div className="sr-slot-pills">
            {[1,2,3].map(s => (
              <button key={s} className={`sr-slot-pill ${slot === s ? 'active' : ''}`} onClick={() => handleSlotChange(s)}>
                Slot {s}
              </button>
            ))}
          </div>
          <button className="sr-pdf-btn" onClick={handleGeneratePDF} disabled={!data || generating || loading}>
            {generating ? '⏳ Generating…' : '📄 Download PDF Report'}
          </button>
        </div>
      </div>

      {/* ── Loading / Error ── */}
      {loading && (
        <div className="sr-loading">
          <div className="sr-spinner" />
          <span>Fetching survey data…</span>
        </div>
      )}
      {error && <div className="sr-error">⚠️ {error}</div>}

      {/* ── Report Body ── */}
      {data && !loading && (
        <>
          {/* Summary Banner */}
          <div className="sr-summary-banner">
            <div className="sr-banner-title">
              <span className="sr-banner-flag">🇮🇳</span>
              <div>
                <h2>{data.slotInfo.label}</h2>
                <p>Villages: {data.villages.join(' · ')} &nbsp;|&nbsp; Generated: {new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
              </div>
            </div>
            <div className="sr-stat-grid">
              {[
                { label: 'Total Students', val: data.totalStudents, color: ACCENT },
                { label: 'In-Campus', val: data.totalIncampus, color: GREEN },
                { label: 'In-Village', val: data.totalInvillage, color: GOLD },
                { label: 'Persons Surveyed (Campus)', val: data.surveyedIncampus, color: '#0891b2' },
                { label: 'Persons Surveyed (Village)', val: data.surveyedInvillage, color: ORANGE },
                { label: 'Domains', val: Object.keys(data.domains).length, color: '#7c3aed' },
              ].map(({ label, val, color }) => (
                <div key={label} className="sr-stat-card">
                  <div className="sr-stat-num" style={{ color }}>{val}</div>
                  <div className="sr-stat-lbl">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Campus vs Village donut */}
          <div className="sr-mode-section">
            <div className="sr-mode-card">
              <h3>Student Distribution</h3>
              <div style={{ display:'flex', gap:24, alignItems:'center', marginTop:12 }}>
                <DonutChart yes={data.totalIncampus} no={data.totalInvillage + data.totalRemote} size={100} />
                <div>
                  <div className="sr-legend-item" style={{color:GREEN}}>● In-Campus: <b>{data.totalIncampus}</b></div>
                  <div className="sr-legend-item" style={{color:GOLD}}>● In-Village: <b>{data.totalInvillage}</b></div>
                  {data.totalRemote > 0 && <div className="sr-legend-item" style={{color:'#6b7280'}}>● Remote: <b>{data.totalRemote}</b></div>}
                </div>
              </div>
            </div>
            <div className="sr-mode-card">
              <h3>Persons Surveyed Distribution</h3>
              <div style={{ display:'flex', gap:24, alignItems:'center', marginTop:12 }}>
                <DonutChart yes={data.surveyedIncampus} no={data.surveyedInvillage} size={100} />
                <div>
                  <div className="sr-legend-item" style={{color:'#0891b2'}}>● In-Campus: <b>{data.surveyedIncampus}</b></div>
                  <div className="sr-legend-item" style={{color:ORANGE}}>● In-Village: <b>{data.surveyedInvillage}</b></div>
                  <div className="sr-legend-item" style={{color:'#64748b'}}>Total: <b>{data.surveyedIncampus + data.surveyedInvillage}</b></div>
                </div>
              </div>
            </div>
          </div>

          {/* Domain sections */}
          {Object.entries(data.domains).map(([domain, psMap], di) => (
            <DomainSection key={domain} domain={domain} psMap={psMap} colorIdx={di} />
          ))}

          {Object.keys(data.domains).length === 0 && (
            <div className="sr-no-data">No survey submissions found for Slot {slot}.</div>
          )}
        </>
      )}
    </div>
  );
}
