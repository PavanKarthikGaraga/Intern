'use client'
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaDownload, FaFilePdf, FaSync, FaEye, FaCog } from 'react-icons/fa';
import './certificateDownload.css';

const CertificateDownload = () => {
  const [usernames, setUsernames] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [summary, setSummary] = useState(null);
  const [generationResult, setGenerationResult] = useState(null);
  const [individualResults, setIndividualResults] = useState([]);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    processing: false
  });

  const handleGenerateIndividual = async () => {
    setError('');
    if (!usernames.trim()) {
      setError('Please enter at least one username.');
      return;
    }

    // Parse usernames (split by newlines, commas, or spaces)
    const usernameList = usernames
      .split(/[\n,\s]+/)
      .map(username => username.trim())
      .filter(username => username.length > 0);

    if (usernameList.length === 0) {
      setError('Please enter valid usernames.');
      return;
    }

    setLoading(true);
    setIndividualResults([]);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const username of usernameList) {
      try {
        const res = await fetch('/api/dashboard/admin/certificate/generate-individual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ username })
        });

        const data = await res.json();

        if (res.ok) {
          results.push({
            username,
            status: 'Generated',
            message: 'Certificate generated successfully',
            uid: data.uid,
            totalMarks: data.totalMarks,
            grade: data.grade
          });
          successCount++;
        } else {
          results.push({
            username,
            status: 'Failed',
            message: data.error || 'Failed to generate certificate',
            error: data.error
          });
          failureCount++;
        }
      } catch (err) {
        results.push({
          username,
          status: 'Failed',
          message: 'Network error occurred',
          error: err.message
        });
        failureCount++;
      }
    }

    setIndividualResults(results);
    setLoading(false);

    if (successCount > 0) {
      toast.success(`Generated ${successCount} certificates successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`);
    } else {
      toast.error('Failed to generate any certificates');
    }
  };

  const handleDownloadCertificate = async (username) => {
    try {
      const response = await fetch(`/api/dashboard/admin/certificate/download?username=${encodeURIComponent(username)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to download certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${username}_certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading certificate:', err);
      toast.error(err.message);
    }
  };

  const handleGenerateCertificates = async () => {
    if (!selectedSlot) {
      toast.error('Please select a slot');
      return;
    }

    setGenerating(true);
    setSummary(null);
    setGenerationResult(null);
    setError('');
    setBatchProgress({ current: 0, total: 0, processing: true });
    
    try {
      // First, get the total count of eligible students
      const countResponse = await fetch(`/api/dashboard/admin/certificate/count?slot=${selectedSlot}`, {
        credentials: 'include'
      });
      
      if (!countResponse.ok) {
        throw new Error('Failed to get student count');
      }
      
      const countData = await countResponse.json();
      const totalStudents = countData.count;
      const batchSize = 50;
      const totalBatches = Math.ceil(totalStudents / batchSize);
      
      setBatchProgress(prev => ({ ...prev, total: totalBatches }));

      // Now process in batches
      const response = await fetch('/api/dashboard/admin/certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          slot: selectedSlot,
          batchSize: batchSize
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setGenerationResult({
            type: 'conflict',
            message: data.error,
            existingCertificates: data.existingCertificates || [],
            studentsNeedingCertificates: data.studentsNeedingCertificates || []
          });
        } else {
          throw new Error(data.error || 'Failed to generate certificates');
        }
      } else {
        // Update batch progress
        if (data.currentBatch && data.totalBatches) {
          setBatchProgress(prev => ({
            ...prev,
            current: data.currentBatch,
            total: data.totalBatches
          }));
        }

        setSummary(data.summary);
        setCertificates(data.certificates || []);
        setGenerationResult({
          type: 'success',
          message: data.message,
          summary: data.summary,
          certificates: data.certificates || []
        });
        toast.success(data.message);
      }

    } catch (err) {
      console.error('Error generating certificates:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setGenerating(false);
      setBatchProgress({ current: 0, total: 0, processing: false });
    }
  };

  const clearResults = () => {
    setSummary(null);
    setGenerationResult(null);
    setCertificates([]);
    setError('');
    setIndividualResults([]);
  };

  return (
    <div className="certificate-download-container">
      <div className="certificate-section">
        <h2>Generate Individual Certificates</h2>
        <div className="username-input-section">
          <label htmlFor="usernames" className="input-label">
            Enter Usernames (one per line, comma, or space separated):
          </label>
          <textarea
            id="usernames"
            placeholder="2400032048&#10;24000xxxxxx&#10;24000xxxx"
            value={usernames}
            onChange={e => setUsernames(e.target.value)}
            className="certificate-textarea"
            rows={6}
          />
          <p className="input-help">
            You can enter multiple usernames separated by newlines, commas, or spaces.
          </p>
        </div>
        <button onClick={handleGenerateIndividual} disabled={loading} className="certificate-generate-btn">
          {loading ? <><FaCog className="spinning" /> Generating...</> : <><FaCog /> Generate Certificates</>}
        </button>
        {error && <div className="certificate-error">{error}</div>}
      </div>

      {/* Individual Generation Results */}
      {individualResults.length > 0 && (
        <div className="individual-results-section">
          <h3>Individual Generation Results</h3>
          <div className="individual-results-grid">
            {individualResults.map((result, index) => (
              <div key={index} className={`individual-result-card ${result.status.toLowerCase()}`}>
                <div className="result-header">
                  <h4>{result.username}</h4>
                  <span className={`status ${result.status.toLowerCase()}`}>{result.status}</span>
                </div>
                <div className="result-details">
                  <p className="result-message">{result.message}</p>
                  {result.uid && <p><strong>UID:</strong> {result.uid}</p>}
                  {result.totalMarks && <p><strong>Total Marks:</strong> {result.totalMarks}</p>}
                  {result.grade && <p><strong>Grade:</strong> {result.grade}</p>}
                  {result.error && <p className="error-text"><strong>Error:</strong> {result.error}</p>}
                </div>
                {result.status === 'Generated' && (
                  <button 
                    onClick={() => handleDownloadCertificate(result.username)}
                    className="download-individual-btn"
                  >
                    <FaDownload /> Download
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="certificate-section">
        <h2>Generate Certificates for Slot</h2>
        <div className="generate-section">
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            className="certificate-select"
          >
            <option value="">Select Slot</option>
            <option value="1">Slot 1</option>
            <option value="2">Slot 2</option>
            <option value="3">Slot 3</option>
            <option value="4">Slot 4</option>
            <option value="5">Slot 5</option>
            <option value="6">Slot 6</option>
          </select>
          <button 
            onClick={handleGenerateCertificates} 
            disabled={generating || !selectedSlot} 
            className="generate-btn"
          >
            {generating ? (
              <>
                <FaCog className="spinning" /> 
                {batchProgress.processing ? 
                  `Processing Batch ${batchProgress.current}/${batchProgress.total}...` : 
                  'Generating...'}
              </>
            ) : (
              <>Generate Certificates</>
            )}
          </button>
          {(summary || generationResult || individualResults.length > 0) && (
            <button onClick={clearResults} className="clear-btn">
              Clear Results
            </button>
          )}
        </div>
        <p className="info-text">
          This will generate certificates for all students in the selected slot who have total marks ≥ 60
        </p>
        {batchProgress.processing && batchProgress.total > 0 && (
          <div className="batch-progress">
            <div 
              className="progress-bar" 
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
            <p className="progress-text">
              Processing batch {batchProgress.current} of {batchProgress.total}
            </p>
          </div>
        )}
      </div>

      {/* Summary Section */}
      {summary && (
        <div className="summary-section">
          <h3>Generation Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Slot:</span>
              <span className="summary-value">{summary.slot}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Eligible Students:</span>
              <span className="summary-value">{summary.totalStudents}</span>
            </div>
            <div className="summary-item existing">
              <span className="summary-label">Already Had Certificates:</span>
              <span className="summary-value">{summary.existingCount}</span>
            </div>
            <div className="summary-item success">
              <span className="summary-label">Newly Generated:</span>
              <span className="summary-value">{summary.newlyGeneratedCount}</span>
            </div>
            <div className="summary-item failure">
              <span className="summary-label">Failed to Generate:</span>
              <span className="summary-value">{summary.failedCount}</span>
            </div>
            <div className="summary-item info">
              <span className="summary-label">Students Needing Certificates:</span>
              <span className="summary-value">{summary.studentsNeedingCertificates}</span>
            </div>
            <div className="summary-item info">
              <span className="summary-label">Students With Existing Certificates:</span>
              <span className="summary-value">{summary.studentsWithExistingCertificates}</span>
            </div>
            {summary.batchInfo && (
              <>
                <div className="summary-item batch">
                  <span className="summary-label">Batch Size:</span>
                  <span className="summary-value">{summary.batchInfo.batchSize}</span>
                </div>
                <div className="summary-item batch">
                  <span className="summary-label">Total Batches Processed:</span>
                  <span className="summary-value">{summary.batchInfo.totalBatches}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Generation Result Section */}
      {generationResult && (
        <div className={`result-section ${generationResult.type}`}>
          <h3>{generationResult.type === 'success' ? '✅ Generation Complete' : '⚠️ Generation Result'}</h3>
          <p className="result-message">{generationResult.message}</p>
          
          {generationResult.type === 'conflict' && generationResult.existingCertificates && (
            <div className="conflict-details">
              <h4>Existing Certificates:</h4>
              <div className="certificate-list">
                {generationResult.existingCertificates.map((cert, index) => (
                  <div key={index} className="certificate-item">
                    <span>Username: {cert.username}</span>
                    <span>UID: {cert.uid}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {generationResult.type === 'conflict' && generationResult.studentsNeedingCertificates && (
            <div className="needing-certificates">
              <h4>Students Needing Certificates:</h4>
              <div className="student-list">
                {generationResult.studentsNeedingCertificates.map((username, index) => (
                  <span key={index} className="student-item">{username}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generated Certificates List */}
      {certificates.length > 0 && (
        <div className="certificates-section">
          <h3>All Certificates (Existing + Newly Generated)</h3>
          <div className="certificates-grid">
            {certificates.map((cert, index) => (
              <div key={index} className={`certificate-card ${cert.status.toLowerCase().replace(' ', '-')}`}>
                <div className="certificate-header">
                  <h4>{cert.name}</h4>
                  <span className={`status ${cert.status.toLowerCase().replace(' ', '-')}`}>{cert.status}</span>
                </div>
                <div className="certificate-details">
                  <p><strong>Username:</strong> {cert.username}</p>
                  {cert.uid && <p><strong>UID:</strong> {cert.uid}</p>}
                  {cert.totalMarks && <p><strong>Total Marks:</strong> {cert.totalMarks}</p>}
                  {cert.grade && <p><strong>Grade:</strong> {cert.grade}</p>}
                  {cert.error && <p className="error-text"><strong>Error:</strong> {cert.error}</p>}
                </div>
                {(cert.status === 'Generated' || cert.status === 'Already exists') && (
                  <button 
                    onClick={() => handleDownloadCertificate(cert.username)}
                    className="download-individual-btn"
                  >
                    <FaDownload /> Download
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default CertificateDownload; 