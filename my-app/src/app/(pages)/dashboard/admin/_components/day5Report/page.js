'use client';
import { useState } from 'react';
import { FaFilePdf, FaDownload, FaSpinner, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function Day5Report() {
  const [slot, setSlot] = useState('1');
  const [modes, setModes] = useState(['InVillage', 'Incampus']);
  const [loading, setLoading] = useState(false);

  const handleModeToggle = (mode) => {
    setModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const handleGenerate = async () => {
    if (modes.length === 0) {
      toast.error('Please select at least one mode.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/admin/day5-report?slot=${slot}&modes=${modes.join(',')}`);
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Failed to fetch data');
        return;
      }
      if (!data.data || data.data.length === 0) {
        toast.error('No students with Day 5 submissions found for this selection.');
        return;
      }

      toast.success(`Found ${data.data.length} students. Building PDF...`);
      await buildPDF(data.data, slot);
      toast.success('PDF Downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Error generating PDF');
    } finally {
      setLoading(false);
    }
  };

  const buildPDF = async (students, slotNum) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    const PAGE_W = 210;
    const PAGE_H = 297;
    const MARGIN = 15;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    let y = MARGIN;

    const checkPage = (needed = 10) => {
      if (y + needed > PAGE_H - MARGIN) {
        doc.addPage();
        y = MARGIN;
      }
    };

    const writeText = (text, x, fontSize = 10, style = 'normal', color = [0, 0, 0], maxWidth = CONTENT_W) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', style);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(String(text || ''), maxWidth);
      lines.forEach(line => {
        checkPage(6);
        doc.text(line, x, y);
        y += fontSize * 0.4;
      });
    };

    const writeLine = (label, value, labelW = 55) => {
      const valueW = CONTENT_W - labelW;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      const labelLines = doc.splitTextToSize(label + ':', labelW);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const valueLines = doc.splitTextToSize(String(value || 'Not provided'), valueW);

      const lineCount = Math.max(labelLines.length, valueLines.length);
      checkPage(lineCount * 4.5 + 3);

      for (let i = 0; i < lineCount; i++) {
        const lx = MARGIN;
        const vx = MARGIN + labelW + 2;
        if (labelLines[i]) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 30);
          doc.text(labelLines[i], lx, y);
        }
        if (valueLines[i]) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          doc.text(valueLines[i], vx, y);
        }
        y += 4.5;
      }
      y += 1;
    };

    const drawDivider = (color = [180, 180, 180]) => {
      checkPage(5);
      doc.setDrawColor(...color);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += 4;
    };

    students.forEach((s, idx) => {
      if (idx > 0) { doc.addPage(); y = MARGIN; }

      // ── Student Header ──
      doc.setFillColor(1, 74, 1);
      doc.rect(MARGIN, y - 4, CONTENT_W, 12, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`${s.name} (${s.username})`, MARGIN + 3, y + 4);
      y += 13;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`Slot: ${s.slot}   |   Mode: ${s.mode}   |   Problem: ${s.problemStatement || 'N/A'}`, MARGIN, y);
      y += 7;

      drawDivider([100, 160, 100]);

      // ── Survey YES % ──
      const hasSurvey = s.surveyData && Object.keys(s.surveyData).length > 0;
      if (hasSurvey) {
        checkPage(10);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Survey Responses (YES %)', MARGIN, y);
        y += 6;

        [2, 3, 4].forEach(dayNum => {
          const dayData = s.surveyData[`day${dayNum}`];
          if (!dayData || !dayData.questions || dayData.questions.length === 0) return;

          checkPage(10);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(3, 105, 161);
          doc.text(`Day ${dayNum} — ${dayData.stakeholder}  (${dayData.totalPersons} persons surveyed)`, MARGIN, y);
          y += 5;

          dayData.questions.forEach((q, qi) => {
            checkPage(6);
            const pct = q.percentage;
            const barW = Math.round((CONTENT_W - 60) * pct / 100);

            // Question text
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 30, 30);
            const qLines = doc.splitTextToSize(`${qi + 1}. ${q.question.replace(' (Yes/No)', '')}`, CONTENT_W - 30);
            qLines.forEach(line => {
              checkPage(5);
              doc.text(line, MARGIN + 2, y);
              y += 4;
            });

            // Percentage bar
            checkPage(7);
            const barX = MARGIN + 2;
            const barY = y;
            doc.setFillColor(230, 230, 230);
            doc.rect(barX, barY - 3, CONTENT_W - 30, 4, 'F');
            doc.setFillColor(pct > 50 ? 22 : 217, pct > 50 ? 163 : 119, pct > 50 ? 74 : 6);
            doc.rect(barX, barY - 3, Math.max(barW, 1), 4, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(pct > 50 ? 22 : 180, pct > 50 ? 100 : 60, pct > 50 ? 50 : 10);
            doc.text(`${pct}% YES`, MARGIN + CONTENT_W - 25, barY);
            y += 6;
          });
          y += 3;
        });
      } else {
        checkPage(8);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 120, 120);
        doc.text('No survey data available for this student.', MARGIN, y);
        y += 7;
      }

      drawDivider([150, 150, 150]);

      // ── Day 5 Analysis ──
      checkPage(10);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Day 5 Final Problem Analysis', MARGIN, y);
      y += 6;

      if (s.analysisText.isSlot4OrMore) {
        writeLine('Actual Problem Observed', s.analysisText.actualProblem);
        writeLine('Who is Mainly Affected', s.analysisText.whoAffected);
        writeLine('Survey Insight', s.analysisText.surveyInsight);
        writeLine('Main Reason', s.analysisText.mainReason);
        writeLine('Impact of the Problem', s.analysisText.impact);
        writeLine('Final Problem Statement', s.analysisText.finalStatement);
      } else {
        [2, 3, 4].forEach(dayNum => {
          const d = s.analysisText[`day${dayNum}`];
          if (!d) return;
          checkPage(10);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(3, 105, 161);
          doc.text(`Day ${dayNum} Stakeholder Analysis`, MARGIN, y);
          y += 5;
          writeLine('Top Problems', d.topProblems);
          writeLine('Root Causes', d.rootCauses);
          writeLine('Recommendations', d.recommendations);
          y += 2;
        });
      }
    });

    doc.save(`Day5_Report_Slot${slotNum}.pdf`);
  };

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', minHeight: '80vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#014a01', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaFilePdf /> Day 5 Students Analysis Report
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Generate a PDF with Day 5 analysis and survey YES % for all students in the selected slot and mode.
        </p>
      </div>

      <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
            Select Slot
          </label>
          <select
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(s => (
              <option key={s} value={s}>Slot {s}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>
            <FaFilter style={{ color: '#64748b', marginRight: 6 }}/> Select Modes
          </label>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'In-Village', value: 'InVillage' },
              { label: 'In-Campus', value: 'Incampus' },
              { label: 'Remote', value: 'Remote' }
            ].map(mode => (
              <label key={mode.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem', color: '#475569' }}>
                <input
                  type="checkbox"
                  checked={modes.includes(mode.value)}
                  onChange={() => handleModeToggle(mode.value)}
                  style={{ width: '18px', height: '18px', accentColor: '#014a01', cursor: 'pointer' }}
                />
                {mode.label}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '14px', background: loading ? '#94a3b8' : '#014a01', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
        >
          {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaDownload />}
          {loading ? 'Generating Report...' : 'Generate & Download PDF'}
        </button>
      </div>

      <style jsx>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
