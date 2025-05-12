'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './page.css';

export default function VerifyModal({ username, onClose, onVerify }) {
  const [verificationStatus, setVerificationStatus] = useState({});
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);

  const fetchStudentData = async (username) => {
    try {
      const res = await fetch(`/api/dashboard/studentLead/student?username=${username}`);
      if (!res.ok) throw new Error('Failed to fetch student data');
      const data = await res.json();
      if (data.success) {
        setStudentData(data.student);
        setReports(data.uploads);
      }
    } catch (err) {
      toast.error('Failed to refresh student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      setLoading(true);
      fetchStudentData(username);
    }
    // eslint-disable-next-line
  }, [username]);

  const handleVerify = async (day, status) => {
    try {
      if (studentData.verify?.[`day${day}`] === 1 && !status) {
        toast.error('Cannot reject an already verified day');
        return;
      }
      const verifyResponse = await fetch('/api/dashboard/studentLead/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          day,
          status
        })
      });
      if (!verifyResponse.ok) {
        throw new Error('Failed to update verification status');
      }
      if (!status) {
        const attendanceResponse = await fetch('/api/dashboard/studentLead/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            day,
            status: 'A'
          })
        });
        if (!attendanceResponse.ok) {
          throw new Error('Failed to update attendance status');
        }
      }
      const verifyData = await verifyResponse.json();
      if (verifyData.success) {
        await fetchStudentData(username); // Refresh student data from DB
        setVerificationStatus(prev => ({
          ...prev,
          [day]: status
        }));
        onVerify(day, status);
        if (status) {
          toast.success(`Day ${day} report verified successfully`);
        } else {
          toast.success(`Day ${day} report rejected and marked absent`);
        }
      }
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification status');
    }
  };

  const isDayVerifiable = (day) => {
    if (!studentData) return false;
    if (day === 1) {
      const report = reports.find(r => r.dayNumber === day);
      return !!report?.link;
    }
    const previousDay = day - 1;
    const previousDayVerified = studentData.verify?.[`day${previousDay}`] === 1;
    const previousDayAbsent = studentData.attendance?.[`day${previousDay}`] === 'A';
    const currentDayReport = reports.find(r => r.dayNumber === day);
    const hasCurrentDayReport = !!currentDayReport?.link;
    return (previousDayVerified || previousDayAbsent) && hasCurrentDayReport;
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Verify Documents</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="loading">Loading reports...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Verify Documents</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="error">Error loading reports: {error || 'No data'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Verify Documents - {studentData.name}</h2>
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
                const isVerified = studentData.verify?.[`day${day}`] === 1;
                const isRejected = studentData.attendance?.[`day${day}`] === 'A';
                let status;
                if (isVerified) status = 'verified';
                else if (isRejected) status = 'rejected';
                else if (hasUpload) status = 'pending';
                else status = 'not_uploaded';
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
                         status === 'rejected' ? 'Rejected' :
                         status === 'pending' ? 'Pending' : 
                         'Not Uploaded'}
                      </span>
                    </td>
                    <td>
                      {hasUpload && !isVerified && !isRejected && (
                        <div className="action-buttons">
                          {isVerifiable ? (
                            <>
                              <button 
                                className="accept-btn"
                                onClick={() => handleVerify(day, true)}
                              >
                                Verify
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
                              {day === 1 ? 'Report not uploaded' : 'Verify Day ' + (day - 1) + ' first'}
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