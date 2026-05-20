'use client';
import { useState, useEffect } from 'react';
import { FaGraduationCap, FaSearch, FaDownload, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slot, setSlot] = useState('1');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  const getGradeInfo = (marks) => {
    const m = Number(marks);
    if (m >= 90) return { grade: 'A', text: 'Excellence', color: '#15803d', bg: '#dcfce7' };
    if (m >= 75) return { grade: 'B', text: 'Appreciation', color: '#0369a1', bg: '#e0f2fe' };
    if (m >= 60) return { grade: 'C', text: 'Participation', color: '#6d28d9', bg: '#ede9fe' };
    return { grade: 'F', text: 'FAIL', color: '#dc2626', bg: '#fee2e2' };
  };

  const fetchResults = async (selectedSlot) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/admin/results?slot=${selectedSlot}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results);
      } else {
        toast.error(data.error || 'Failed to fetch results');
      }
    } catch (err) {
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(slot);
  }, [slot]);

  // Filter logic
  const filteredResults = results.filter(r => {
    if (gradeFilter === 'ALL') return true;
    const info = getGradeInfo(r.totalMarks);
    if (gradeFilter === 'PASS') return Number(r.totalMarks) >= 60;
    if (gradeFilter === 'FAIL') return Number(r.totalMarks) < 60;
    return info.grade === gradeFilter;
  });

  const handleExport = () => {
    if (filteredResults.length === 0) {
      toast.error('No data to export');
      return;
    }
    const exportData = filteredResults.map(r => {
      const info = getGradeInfo(r.totalMarks);
      return {
        'Username': r.username,
        'Name': r.name,
        'Slot': r.slot,
        'Total Marks': r.totalMarks,
        'Grade': info.grade,
        'Category': info.text,
        'Status': Number(r.totalMarks) >= 60 ? 'PASS' : 'FAIL'
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Slot_${slot}_Results`);
    XLSX.writeFile(wb, `Slot_${slot}_Results_${gradeFilter}.xlsx`);
  };

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', minHeight: '80vh', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#014a01', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaGraduationCap /> Student Results & Grades
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Slot Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Slot:</span>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Grade Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <FaFilter style={{ color: '#475569', fontSize: '0.9rem' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Filter:</span>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
            >
              <option value="ALL">All Students</option>
              <option value="PASS">Pass (&gt;= 60)</option>
              <option value="FAIL">Fail (&lt; 60)</option>
              <option value="A">A (Excellence)</option>
              <option value="B">B (Appreciation)</option>
              <option value="C">C (Participation)</option>
            </select>
          </div>
          
          <button 
            onClick={handleExport}
            disabled={filteredResults.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: filteredResults.length === 0 ? '#cbd5e1' : '#014a01', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: filteredResults.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Total Students</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{results.length}</p>
          </div>
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#065f46', fontSize: '0.9rem', fontWeight: 600 }}>Passed (&gt;= 60)</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#047857' }}>{results.filter(r => Number(r.totalMarks) >= 60).length}</p>
          </div>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem', fontWeight: 600 }}>Failed (&lt; 60)</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#b91c1c' }}>{results.filter(r => Number(r.totalMarks) < 60).length}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading results...</div>
      ) : filteredResults.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <FaSearch style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#334155' }}>No Results Match</h3>
          <p style={{ margin: 0, color: '#64748b' }}>Try changing the slot or grade filter.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '16px', borderBottom: '2px solid #e2e8f0' }}>Student</th>
                <th style={{ padding: '16px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Marks ( / 100)</th>
                <th style={{ padding: '16px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Grade</th>
                <th style={{ padding: '16px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Tag / Category</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r, idx) => {
                const info = getGradeInfo(r.totalMarks);
                return (
                  <tr key={r.username} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>{r.username}</div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>{r.name}</div>
                    </td>
                    
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: Number(r.totalMarks) >= 60 ? '#15803d' : '#b91c1c' }}>
                        {Number(r.totalMarks)}
                      </span>
                    </td>
                    
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: '36px', 
                        height: '36px', 
                        background: info.bg, 
                        color: info.color, 
                        borderRadius: '50%', 
                        fontWeight: 800, 
                        fontSize: '1rem',
                        border: `1px solid ${info.color}33`
                      }}>
                        {info.grade}
                      </span>
                    </td>
                    
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block',
                        background: info.bg, 
                        color: info.color, 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontWeight: info.grade === 'F' ? 900 : 700, 
                        fontSize: info.grade === 'F' ? '0.9rem' : '0.85rem',
                        letterSpacing: '0.5px',
                        textTransform: info.grade === 'F' ? 'uppercase' : 'none'
                      }}>
                        {info.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
