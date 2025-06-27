'use client'
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaDownload, FaFilePdf, FaSync, FaEye } from 'react-icons/fa';
import './certificateDownload.css';

const CertificateDownload = () => {
  const [username, setUsername] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);



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

  const handleGenerateCertificates = async () => {
    if (!selectedSlot) {
      toast.error('Please select a slot');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/dashboard/admin/certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ slot: selectedSlot })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate certificates');
      }

      const data = await response.json();
      
    } catch (err) {
      console.error('Error generating certificates:', err);
      toast.error(err.message);
    } finally {
      setGenerating(false);
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


  return (
    <div className="certificate-download-container">
      <div className="certificate-section">
        <h2>Download Individual Certificate</h2>
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
            {generating ? 'Generating...' : 'Generate Certificates'}
          </button>
        </div>
        <p className="info-text">
          This will generate certificates for all students in the selected slot who have total marks ≥ 60
        </p>
      </div>

      
    </div>
  );
};

export default CertificateDownload; 