'use client'
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FaDownload, FaCog, FaInfoCircle } from 'react-icons/fa';
import './page.css';

const GenerateCertificates = () => {
  const [usernames, setUsernames] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    processing: false
  });

  const handleGenerateCertificates = async () => {
    setError('');
    setShowResults(false);
    
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

    // Check 100 ID limit
    if (usernameList.length > 100) {
      setError('Maximum 100 IDs allowed per batch. Please reduce the number of IDs.');
      return;
    }

    setLoading(true);
    setResults([]);
    setProgress({
      current: 0,
      total: usernameList.length,
      processing: true
    });

    const generationResults = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each username
    for (let i = 0; i < usernameList.length; i++) {
      const username = usernameList[i];
      
      // Update progress
      setProgress(prev => ({
        ...prev,
        current: i + 1
      }));
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
          generationResults.push({
            username,
            status: 'success',
            message: 'Certificate generated successfully',
            uid: data.uid,
            totalMarks: data.totalMarks,
            grade: data.grade,
            name: data.name || 'N/A'
          });
          successCount++;
        } else {
          generationResults.push({
            username,
            status: 'error',
            message: data.error || 'Failed to generate certificate',
            error: data.error
          });
          failureCount++;
        }
      } catch (err) {
        generationResults.push({
          username,
          status: 'error',
          message: 'Network error occurred',
          error: err.message
        });
        failureCount++;
      }
    }

    // Sort results to show failed first, then successful
    const sortedResults = generationResults.sort((a, b) => {
      if (a.status === 'error' && b.status === 'success') return -1;
      if (a.status === 'success' && b.status === 'error') return 1;
      return 0;
    });

    setResults(sortedResults);
    setShowResults(true);
    setLoading(false);
    setProgress({
      current: 0,
      total: 0,
      processing: false
    });

    // Show summary toast
    if (successCount > 0) {
      toast.success(`Successfully generated ${successCount} certificates${failureCount > 0 ? `, ${failureCount} failed` : ''}`);
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

  const clearResults = () => {
    setResults([]);
    setShowResults(false);
    setError('');
    setProgress({
      current: 0,
      total: 0,
      processing: false
    });
  };

  const clearAll = () => {
    setUsernames('');
    setResults([]);
    setShowResults(false);
    setError('');
    setProgress({
      current: 0,
      total: 0,
      processing: false
    });
  };

  return (
    <div className="generate-certificates-container">
      <div className="header-section">
        <h2>Generate Certificates</h2>
        <p className="subtitle">Bulk certificate generation for student IDs</p>
      </div>

      <div className="input-section">
        <div className="input-group">
          <label htmlFor="usernames" className="input-label">
            Student IDs (Maximum 100)
          </label>
          <div className="textarea-container">
            <textarea
              id="usernames"
              placeholder="Enter student IDs (one per line, comma, or space separated)&#10;Example:&#10;2400032048&#10;2400032049&#10;2400032050"
              value={usernames}
              onChange={(e) => setUsernames(e.target.value)}
              className="id-textarea"
              rows={8}
              maxLength={2000}
            />
            <div className="input-info">
              <FaInfoCircle className="info-icon" />
              <span>You can enter up to 100 IDs separated by newlines, commas, or spaces</span>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button 
            onClick={handleGenerateCertificates} 
            disabled={loading || !usernames.trim()} 
            className="generate-btn"
          >
            {loading ? (
              <>
                <FaCog className="spinning" /> 
                {progress.processing ? 
                  `Processing ${progress.current}/${progress.total}...` : 
                  'Generating...'}
              </>
            ) : (
              <>
                <FaCog /> Generate Certificates
              </>
            )}
          </button>
          
          <button 
            onClick={clearAll} 
            className="clear-btn"
            disabled={loading}
          >
            Clear All
          </button>
        </div>

        {progress.processing && progress.total > 0 && (
          <div className="batch-progress">
            <div 
              className="progress-bar" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
            <p className="progress-text">
              Processing {progress.current} of {progress.total} certificates
            </p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <FaInfoCircle /> {error}
          </div>
        )}
      </div>

      {/* Individual Generation Results */}
      {showResults && (
        <div className="individual-results-section">
          <h3>Individual Generation Results</h3>
          <div className="individual-results-grid">
            {results.map((result, index) => (
              <div key={index} className={`individual-result-card ${result.status === 'success' ? 'generated' : 'failed'}`}>
                <div className="result-header">
                  <h4>{result.username}</h4>
                  <span className={`status ${result.status === 'success' ? 'generated' : 'failed'}`}>
                    {result.status === 'success' ? 'Generated' : 'Failed'}
                  </span>
                </div>
                <div className="result-details">
                  <p className="result-message">{result.message}</p>
                  {result.uid && <p><strong>UID:</strong> {result.uid}</p>}
                  {result.totalMarks && <p><strong>Total Marks:</strong> {result.totalMarks}</p>}
                  {result.grade && <p><strong>Grade:</strong> {result.grade}</p>}
                  {result.error && <p className="error-text"><strong>Error:</strong> {result.error}</p>}
                </div>
                {result.status === 'success' && (
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
    </div>
  );
};

export default GenerateCertificates; 