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
        setReports(data.student.uploads?.details || []);
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
    let loadingToastId;
    try {
      loadingToastId = toast.loading(status ? 'Verifying report...' : 'Rejecting report...');
      if (studentData.verify?.[`day${day}`] === 1 && !status) {
        toast.error('Cannot reject an already verified day', { id: loadingToastId });
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
        toast.error('Failed to update verification status', { id: loadingToastId });
        throw new Error('Failed to update verification status');
      }
      // Always refresh from backend after verify/reject
      await fetchStudentData(username);
      setVerificationStatus(prev => ({
        ...prev,
        [day]: status
      }));
      onVerify(day, status);
      toast.success(status ? `Day ${day} report verified successfully` : `Day ${day} report rejected and marked absent`, { id: loadingToastId });
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification status', { id: loadingToastId });
    }
  };

  // Defensive: Ensure reports is always an array
  const reportArray = Array.isArray(reports) ? reports : [];

  const isDayVerifiable = (day) => {
    if (!studentData) return false;
    if (day === 1) {
      const report = reportArray.find(r => r.dayNumber === day);
      return !!report?.link;
    }
    const previousDay = day - 1;
    const previousDayVerified = studentData.verify?.[`day${previousDay}`] === 1;
    const previousDayAbsent = studentData.attendance?.details?.[`day${previousDay}`] === 'A';
    const currentDayReport = reportArray.find(r => r.dayNumber === day);
    const hasCurrentDayReport = !!currentDayReport?.link;
    return (previousDayVerified || previousDayAbsent) && hasCurrentDayReport;
  };

  // Helper: can submit if previous day is verified or absent
  const canSubmitDay = (dayIndex) => {
    if (dayIndex === 0) return true;
    const prevDayKey = `day${dayIndex}`;
    const prevDayVerified = studentData?.verify?.[prevDayKey] === 1;
    const prevDayAbsent = studentData?.attendance?.details?.[prevDayKey] === 'A';
    return prevDayVerified || prevDayAbsent;
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
                const report = reportArray.find(r => r.dayNumber === day);
                const hasUpload = report?.link;
                const isVerified = studentData.verify?.[`day${day}`] === 1;
                const isRejected = studentData.attendance?.details?.[`day${day}`] === 'A';
                // Debug log for status logic
                console.log('day', day, 'isRejected', isRejected, 'status', studentData.status?.[`day${day}`], 'attendance', studentData.attendance?.details?.[`day${day}`], 'hasUpload', hasUpload);
                let status;
                if (isVerified) status = 'verified';
                else if (isRejected && (!studentData.status || studentData.status[`day${day}`] !== 'new')) status = 'rejected';
                else if (hasUpload && studentData.status && studentData.status[`day${day}`] === 'new') status = 'new';
                else if (
                  hasUpload &&
                  canSubmitDay(day - 1) &&
                  (!studentData.status || studentData.status[`day${day}`] !== 'new') &&
                  !isVerified && !isRejected
                ) status = 'pending';
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
                      {hasUpload ? new Date(report.updatedAt).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${status}`}>
                        {status === 'verified' ? 'Verified' : 
                         status === 'rejected' ? 'Rejected' :
                         status === 'new' ? 'New' :
                         status === 'pending' ? 'Pending' : 
                         'Not Uploaded'}
                      </span>
                    </td>
                    <td>
                      {((status === 'pending' && hasUpload && !isRejected) || 
                        (status === 'new' && hasUpload)) && (
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