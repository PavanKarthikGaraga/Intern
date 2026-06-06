'use client';
import { useState, useRef } from 'react';
import { FaFilePdf, FaDownload, FaSpinner, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function Day5Report() {
  const [slot, setSlot] = useState('1');
  const [modes, setModes] = useState(['InVillage', 'Incampus']);
  const [loading, setLoading] = useState(false);
  const [studentsData, setStudentsData] = useState([]);
  const pdfRef = useRef();

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
      
      if (data.success) {
        if (data.data.length === 0) {
          toast.error('No students found for this selection.');
          setStudentsData([]);
        } else {
          setStudentsData(data.data);
          toast.success(`Found ${data.data.length} students. Generating PDF...`);
          
          // Allow React to render the hidden DOM first
          setTimeout(() => {
            generatePDF(data.data.length);
          }, 1000);
        }
      } else {
        toast.error(data.error || 'Failed to fetch data');
      }
    } catch (err) {
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (count) => {
    const element = pdfRef.current;
    if (!element) return;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       10,
        filename:     `Day5_Report_Slot${slot}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: 'css', avoid: '.no-break' }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        toast.success('PDF Downloaded successfully!');
      });
    } catch (e) {
      console.error(e);
      toast.error('Failed to load PDF library');
    }
  };

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', minHeight: '80vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#014a01', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaFilePdf /> Day 5 Students Analysis Report
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Generate a comprehensive PDF containing Day 5 analysis texts and Day 2, 3, 4 survey YES percentages for students based on slot and mode.
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
          <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaFilter style={{ color: '#64748b' }}/> Select Modes
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
          {loading ? <FaSpinner className="spin" /> : <FaDownload />} 
          {loading ? 'Generating Report...' : 'Generate & Download PDF'}
        </button>
      </div>

      {/* Hidden PDF Template Container */}
      <div style={{ display: 'none' }}>
        <div ref={pdfRef} style={{ background: '#fff', padding: '20px', color: '#000', fontSize: '12px' }}>
          {studentsData.map((s, idx) => (
            <div key={s.username} style={{ pageBreakAfter: idx < studentsData.length - 1 ? 'always' : 'auto', paddingBottom: '20px' }}>
              <div style={{ borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
                <h1 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#014a01' }}>{s.name} ({s.username})</h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#333' }}>
                  <strong>Slot:</strong> {s.slot} | <strong>Mode:</strong> {s.mode} | <strong>Domain:</strong> {s.problemStatement}
                </p>
              </div>

              {/* SURVEY PERCENTAGES */}
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '14px', color: '#1e293b', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '10px' }}>Survey Responses (YES %)</h2>
                {[2, 3, 4].map(dayNum => {
                  const dayData = s.surveyData[`day${dayNum}`];
                  if (!dayData || !dayData.questions) return null;
                  return (
                    <div key={dayNum} className="no-break" style={{ marginBottom: '15px' }}>
                      <h3 style={{ fontSize: '12px', margin: '0 0 5px 0', color: '#0f172a' }}>Day {dayNum} - {dayData.stakeholder} (Persons surveyed: {dayData.totalPersons})</h3>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <tbody>
                          {dayData.questions.map((q, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '4px 0', width: '85%' }}>{q.question}</td>
                              <td style={{ padding: '4px 0', width: '15%', fontWeight: 'bold', color: q.percentage > 50 ? '#16a34a' : '#d97706', textAlign: 'right' }}>
                                {q.percentage}% YES
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
                {Object.keys(s.surveyData).length === 0 && <p style={{ fontSize: '11px', fontStyle: 'italic' }}>No survey data found.</p>}
              </div>

              {/* DAY 5 ANALYSIS */}
              <div className="no-break">
                <h2 style={{ fontSize: '14px', color: '#1e293b', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '10px' }}>Day 5 Final Problem Analysis</h2>
                {s.analysisText.isSlot4OrMore ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <tbody>
                      {[
                        { label: 'Actual Problem Observed', val: s.analysisText.actualProblem },
                        { label: 'Who is Mainly Affected', val: s.analysisText.whoAffected },
                        { label: 'Survey Insight', val: s.analysisText.surveyInsight },
                        { label: 'Main Reason', val: s.analysisText.mainReason },
                        { label: 'Impact of the Problem', val: s.analysisText.impact },
                        { label: 'Final Problem Statement', val: s.analysisText.finalStatement }
                      ].map((field, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '6px', fontWeight: 'bold', width: '30%', verticalAlign: 'top', background: '#f8fafc' }}>{field.label}</td>
                          <td style={{ padding: '6px', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{field.val || 'Not provided'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div>
                    {[2, 3, 4].map(dayNum => {
                      const d = s.analysisText[`day${dayNum}`];
                      if (!d) return null;
                      return (
                        <div key={dayNum} style={{ marginBottom: '15px' }}>
                          <h3 style={{ fontSize: '12px', margin: '0 0 5px 0', color: '#0f172a' }}>Day {dayNum} Stakeholder Analysis</h3>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <tbody>
                              <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '4px', fontWeight: 'bold', width: '25%', verticalAlign: 'top' }}>Top Problems</td>
                                <td style={{ padding: '4px', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{d.topProblems || 'Not provided'}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '4px', fontWeight: 'bold', width: '25%', verticalAlign: 'top' }}>Root Causes</td>
                                <td style={{ padding: '4px', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{d.rootCauses || 'Not provided'}</td>
                              </tr>
                              <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '4px', fontWeight: 'bold', width: '25%', verticalAlign: 'top' }}>Recommendations</td>
                                <td style={{ padding: '4px', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{d.recommendations || 'Not provided'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
