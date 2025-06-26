'use client'
import React, { useState } from 'react';
import './certificateDownload.css';

const CertificateDownload = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setError('');
    if (!username) {
      setError('Please enter a username.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/admin/certificate?username=${encodeURIComponent(username)}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to download certificate.');
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${username}_certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('An error occurred while downloading.');
    }
    setLoading(false);
  };

  return (
    <div className="certificate-download-container">
      <h2>Download Student Certificate</h2>
      <input
        type="text"
        placeholder="Enter Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="certificate-input"
      />
      <button onClick={handleDownload} disabled={loading} className="certificate-download-btn">
        {loading ? 'Downloading...' : 'Download Certificate'}
      </button>
      {error && <div className="certificate-error">{error}</div>}
    </div>
  );
};

export default CertificateDownload; 