'use client';
import { useState } from 'react';
import './certGen.css';

export default function CertGen() {
  const [username, setUsername] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [manualMarks, setManualMarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedUid, setGeneratedUid] = useState('');

  const handleFetchStudent = async () => {
    if (!username.trim()) {
      setError('Please enter a valid Student ID.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setStudentDetails(null);
    setManualMarks('');
    setGeneratedUid('');
    
    try {
      const response = await fetch(`/api/dashboard/admin/cert-gen/fetch?username=${encodeURIComponent(username.trim())}`);
      const data = await response.json();
      
      if (data.success) {
        setStudentDetails(data.student);
      } else {
        setError(data.error || 'Failed to fetch student details.');
      }
    } catch (err) {
      setError('An error occurred while fetching student details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!manualMarks || isNaN(manualMarks) || Number(manualMarks) < 0 || Number(manualMarks) > 100) {
      setError('Please enter valid total marks (0-100).');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    setGeneratedUid('');
    
    try {
      const response = await fetch('/api/dashboard/admin/cert-gen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          manualMarks: Number(manualMarks)
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        setGeneratedUid(data.uid);
      } else {
        setError(data.error || 'Failed to generate certificate.');
      }
    } catch (err) {
      setError('An error occurred while generating the certificate.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = async () => {
    try {
      const res = await fetch(`/api/dashboard/admin/cert-gen/download?username=${encodeURIComponent(username.trim())}`);
      if (!res.ok) throw new Error('Failed to download certificate');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${username.trim()}_certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      setError('Error downloading the certificate. It might not be available.');
    }
  };

  return (
    <div className="cert-gen-container">
      <h2>Manual Certificate Generator</h2>
      
      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="Enter Student ID number (e.g. 230003xxxx)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFetchStudent()}
        />
        <button 
          className="fetch-btn" 
          onClick={handleFetchStudent}
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Fetch Details'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {studentDetails && (
        <div className="student-details">
          <h3>Student Information</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Name</span>
              <span className="detail-value">{studentDetails.name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Branch</span>
              <span className="detail-value">{studentDetails.branch}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Slot</span>
              <span className="detail-value">{studentDetails.slot}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Mode</span>
              <span className="detail-value">{studentDetails.mode}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Domain</span>
              <span className="detail-value">{studentDetails.selectedDomain || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Season</span>
              <span className="detail-value">{studentDetails.season || '2026'}</span>
            </div>
          </div>
        </div>
      )}

      {studentDetails && (
        <div className="marks-section">
          <label htmlFor="manualMarks">Assign Total Marks (0-100)</label>
          <input
            type="number"
            id="manualMarks"
            className="marks-input"
            placeholder="e.g. 85"
            min="0"
            max="100"
            value={manualMarks}
            onChange={(e) => setManualMarks(e.target.value)}
          />
          <button 
            className="generate-btn" 
            onClick={handleGenerateCertificate}
            disabled={loading || !manualMarks}
            style={{ marginTop: '12px', maxWidth: '200px' }}
          >
            {loading ? 'Generating...' : 'Generate Certificate'}
          </button>
        </div>
      )}

      {generatedUid && (
        <div>
          <button onClick={downloadCertificate} className="fetch-btn" style={{ background: '#10b981' }}>
            Download PDF Now
          </button>
        </div>
      )}
    </div>
  );
}
