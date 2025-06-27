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

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoadingCertificates(true);
    try {
      const response = await fetch('/api/dashboard/admin/certificate/list', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch certificates');
      }

      const data = await response.json();
      if (data.success) {
        setCertificates(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch certificates');
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
      toast.error(err.message);
    } finally {
      setLoadingCertificates(false);
    }
  };

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
      if (data.success) {
        toast.success(data.message);
        fetchCertificates(); // Refresh the list
      } else {
        throw new Error(data.error || 'Failed to generate certificates');
      }
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

  const handleViewCertificate = async (username) => {
    try {
      const response = await fetch(`/api/dashboard/admin/certificate/download?username=${encodeURIComponent(username)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to view certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error viewing certificate:', err);
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

      <div className="certificate-section">
        <div className="section-header">
          <h2>Generated Certificates</h2>
          <button onClick={fetchCertificates} disabled={loadingCertificates} className="refresh-btn">
            <FaSync /> Refresh
          </button>
        </div>
        
        {loadingCertificates ? (
          <div className="loading">Loading certificates...</div>
        ) : certificates.length === 0 ? (
          <div className="no-certificates">No certificates generated yet</div>
        ) : (
          <div className="certificates-table">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>Year</th>
                  <th>Slot</th>
                  <th>Total Marks</th>
                  <th>Certificate ID</th>
                  <th>Generated On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.uid}>
                    <td>{cert.username}</td>
                    <td>{cert.name}</td>
                    <td>{cert.branch}</td>
                    <td>{cert.year}</td>
                    <td>{cert.slot}</td>
                    <td>{cert.totalMarks}</td>
                    <td>{cert.uid}</td>
                    <td>{new Date(cert.generatedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="view-btn"
                          onClick={() => handleViewCertificate(cert.username)}
                          title="View Certificate"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="download-btn"
                          onClick={() => handleDownloadCertificate(cert.username)}
                          title="Download Certificate"
                        >
                          <FaDownload />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateDownload; 