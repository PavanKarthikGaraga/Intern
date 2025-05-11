'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './page.css';

export default function VerifyModal({ student, onClose, onVerify }) {
  const [verificationStatus, setVerificationStatus] = useState({});
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localVerifyStatus, setLocalVerifyStatus] = useState({});

  useEffect(() => {
    // Initialize local verify status from student data
    if (student?.verify) {
      setLocalVerifyStatus(student.verify);
    }
  }, [student]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/studentLead/reports?username=${student.username}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        const data = await response.json();
        if (data.success) {
          setReports(data.data);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError(err.message);
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    if (student?.username) {
      fetchReports();
    }
  }, [student]);

  const handleVerify = async (day, status) => {
    try {
      // Check if the day is already verified
      if (localVerifyStatus?.[`day${day}`] === 1 && !status) {
        toast.error('Cannot reject an already verified day');
        return;
      }

      // Check if previous day is verified
      if (day > 1 && status) {
        const previousDay = day - 1;
        if (localVerifyStatus?.[`day${previousDay}`] !== 1) {
          toast.error(`Please verify Day ${previousDay} first`);
          return;
        }
      }

      // Update the verify table
      const verifyResponse = await fetch('/api/dashboard/studentLead/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: student.username,
          day,
          status
        })
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to update verification status');
      }

      // Only update attendance table if rejecting
      if (!status) {
        const attendanceResponse = await fetch('/api/dashboard/studentLead/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: student.username,
            day,
            status: 'A' // Only mark as absent when rejecting
          })
        });

        if (!attendanceResponse.ok) {
          throw new Error('Failed to update attendance status');
        }
      }

      const verifyData = await verifyResponse.json();
      if (verifyData.success) {
        // Update local state immediately
        setLocalVerifyStatus(prev => ({
          ...prev,
          [`day${day}`]: status ? 1 : 0
        }));
        setVerificationStatus(prev => ({
          ...prev,
          [day]: status
        }));
        onVerify(day, status);
        
        // Show success toast
        if (status) {
          toast.success(`Day ${day} report accepted successfully`);
        } else {
          toast.success(`Day ${day} report rejected successfully`);
        }
      }
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification status');
    }
  };

  const isDayVerifiable = (day) => {
    if (day === 1) return true;
    return localVerifyStatus?.[`day${day - 1}`] === 1;
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Verify Documents - {student.name}</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="loading">Loading reports...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Verify Documents - {student.name}</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="error">Error loading reports: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Verify Documents - {student.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <table className="verification-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Report</th>
                <th>Uploaded On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7].map(day => {
                const report = reports.find(r => r.dayNumber === day);
                const hasUpload = report?.link;
                const isVerified = localVerifyStatus?.[`day${day}`] === 1;
                const status = isVerified ? 'verified' : hasUpload ? 'pending' : 'not_uploaded';
                const isVerifiable = isDayVerifiable(day);
                
                return (
                  <tr key={day}>
                    <td>Day {day}</td>
                    <td>
                      {hasUpload ? (
                        <a 
                          href={report.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="report-link"
                          title={report.link}
                        >
                          View Report
                        </a>
                      ) : (
                        <span className="no-upload">Not Uploaded</span>
                      )}
                    </td>
                    <td>
                      {hasUpload ? new Date(report.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${status}`}>
                        {status === 'verified' ? 'Verified' : 
                         status === 'pending' ? 'Pending' : 
                         'Not Uploaded'}
                      </span>
                    </td>
                    <td>
                      {hasUpload && !isVerified && (
                        <div className="action-buttons">
                          {isVerifiable ? (
                            <>
                              <button 
                                className="accept-btn"
                                onClick={() => handleVerify(day, true)}
                              >
                                Accept
                              </button>
                              <button 
                                className="reject-btn"
                                onClick={() => handleVerify(day, false)}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="verify-message">
                              Verify Day {day - 1} first
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 