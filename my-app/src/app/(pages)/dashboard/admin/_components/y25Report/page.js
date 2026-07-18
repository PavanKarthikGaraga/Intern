import React, { useState, useEffect } from 'react';
import './page.css';

export default function Y25Report() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/admin/y25-report');
      const json = await res.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to fetch Y25 report data');
      }
    } catch (err) {
      setError('An error occurred while fetching the data');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!data || !data.students || data.students.length === 0) return;

    const headers = [
      'ID', 'Name', 'Email', 'Phone', 'Branch', 'Slot', 'Mode', 
      'Domain', 'Problem Statement', 'Status', 'Lead', 'Faculty'
    ];

    const csvRows = [];
    // Add headers
    csvRows.push(headers.join(','));

    // Add data
    data.students.forEach(student => {
      const values = [
        student.username || '',
        `"${(student.name || '').replace(/"/g, '""')}"`,
        student.email || '',
        student.phoneNumber || '',
        student.branch || '',
        student.slot || '',
        student.mode || '',
        `"${(student.selectedDomain || '').replace(/"/g, '""')}"`,
        `"${(student.problem_statement || '').replace(/"/g, '""')}"`,
        student.status || '',
        `"${(student.leadName || '').replace(/"/g, '""')}"`,
        `"${(student.facultyName || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Y25_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="y25-loading">Loading Y25 Report Data...</div>;
  if (error) return <div className="y25-error">{error}</div>;
  if (!data) return <div className="y25-error">No data available</div>;

  const { overview, slots, domains, problemStatements } = data;

  return (
    <div className="y25-report-container">
      <div className="y25-header">
        <h1>Y25 Students Report (Slots 1-6)</h1>
        <button className="y25-download-btn" onClick={downloadCSV}>
          Download Full Report (CSV)
        </button>
      </div>

      <div className="y25-overview-cards">
        <div className="y25-card">
          <h3>Total Students</h3>
          <p className="y25-stat-large">{overview.totalStudents}</p>
        </div>
        <div className="y25-card y25-success">
          <h3>Completed</h3>
          <p className="y25-stat-large">{overview.totalCompleted}</p>
        </div>
        <div className="y25-card y25-warning">
          <h3>Active (Incomplete)</h3>
          <p className="y25-stat-large">{overview.totalActive}</p>
        </div>
      </div>

      <div className="y25-grid">
        {/* Slot Distribution */}
        <div className="y25-section">
          <h2>Slot Distribution</h2>
          <div className="y25-table-container">
            <table className="y25-table">
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>Total</th>
                  <th>Completed</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {slots.map(s => (
                  <tr key={s.slot}>
                    <td>Slot {s.slot}</td>
                    <td>{s.total}</td>
                    <td>{s.completed}</td>
                    <td>{s.total - s.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Domain Distribution */}
        <div className="y25-section">
          <h2>Domain Distribution</h2>
          <div className="y25-table-container">
            <table className="y25-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Total</th>
                  <th>Completed</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {domains.map(d => (
                  <tr key={d.selectedDomain || 'Unknown'}>
                    <td>{d.selectedDomain || 'Not Selected'}</td>
                    <td>{d.total}</td>
                    <td>{d.completed}</td>
                    <td>{d.total - d.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Problem Statements */}
      <div className="y25-section y25-full-width">
        <h2>Problem Statements Covered</h2>
        <div className="y25-table-container">
          <table className="y25-table">
            <thead>
              <tr>
                <th>Problem Statement</th>
                <th>Total Students</th>
                <th>Completed</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {problemStatements.length === 0 ? (
                <tr>
                  <td colSpan="4" className="y25-no-data">No problem statements data available</td>
                </tr>
              ) : (
                problemStatements.map((ps, idx) => (
                  <tr key={idx}>
                    <td className="y25-ps-text">{ps.problem_statement}</td>
                    <td>{ps.total}</td>
                    <td>{ps.completed}</td>
                    <td>{ps.total - ps.completed}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
