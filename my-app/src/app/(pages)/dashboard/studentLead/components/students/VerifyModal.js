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
      if (!res.ok) throw new Error(res.error);
      const data = await res.json();
      if (data.success) {
        setStudentData(data.student);
        setReports(data.student.uploads?.details || []);
      }
    } catch (err) {
      console.log(err);
      if(err.status === 401){
        toast.error('Session expired. Please login again.');
      }
      toast.error('Failed to refresh data');
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
    if (status) {
      // Open MarksModal in a new window
      const width = 500;
      const height = 500;
      const left = 0;
      const top = 0;
      
      window.open(
        `/dashboard/studentLead/marks?username=${username}&day=${day}&name=${studentData.name}`,
        'MarksModal',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      return;
    }
    
    let loadingToastId;
    try {
      loadingToastId = toast.loading('Rejecting report...');
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
        toast.error(verifyResponse.error || 'Failed to update verification status', { id: loadingToastId });
      }
      await fetchStudentData(username);
      setVerificationStatus(prev => ({
        ...prev,
        [day]: status
      }));
      onVerify(day, status);
      toast.success(`Day ${day} report rejected and marked absent`, { id: loadingToastId });
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error(error.message || 'Failed to update verification status', { id: loadingToastId });
    }
  };

  // Add event listener for marks window
  useEffect(() => {
    const handleMarksMessage = async (event) => {
      if (event.data.type === 'MARKS_SAVED') {
        const { marks, day: currentDay, message } = event.data;
        console.log('VerifyModal - Received day value:', currentDay, typeof currentDay); // Debug log
        let loadingToastId;
        try {
          loadingToastId = toast.loading('Verifying report...');
          const verifyResponse = await fetch('/api/dashboard/studentLead/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username,
              day: currentDay,
              status: true,
              marks,
              message
            })
          });
          if (!verifyResponse.ok) {
            toast.error(verifyResponse.error || 'Failed to update verification status', { id: loadingToastId });
          }
          await fetchStudentData(username);
          setVerificationStatus(prev => ({
            ...prev,
            [currentDay]: true
          }));
          onVerify(currentDay, true);
          toast.success(`Day ${currentDay} report verified successfully`, { id: loadingToastId });
        } catch (error) {
          console.error('Error updating verification:', error);
          toast.error(error.message || 'Failed to update verification status', { id: loadingToastId });
        }
      }
    };

    window.addEventListener('message', handleMarksMessage);
    return () => window.removeEventListener('message', handleMarksMessage);
  }, [username, onVerify]);

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
          <h2>Verify Documents - {studentData.name} ({studentData.username})</h2>
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
                <th>Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7].map(day => {
                const report = reportArray.find(r => r.dayNumber === day);
                const hasUpload = report?.link;
                const isVerified = studentData.verify?.[`day${day}`] === 1;
                const isRejected = studentData.attendance?.details?.[`day${day}`] === 'A';
                const marks = studentData.dailyMarks?.[`day${day}`] || '-';
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
                      {isVerified ? marks : '-'}
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
                      {isVerified && studentData.messages?.[`day${day}`] && (
                        <span 
                          className="view-remarks"
                          onClick={(e) => {
                            const rect = e.target.getBoundingClientRect();
                            const popup = document.createElement('div');
                            popup.className = 'remarks-popup';
                            popup.innerHTML = `
                              <div class="remarks-content">
                                <h4>Day ${day} Remarks</h4>
                                <ul>
                                  ${studentData.messages[`day${day}`].split(', ').map(msg => 
                                    `<li>${msg}</li>`
                                  ).join('')}
                                </ul>
                              </div>
                            `;
                            popup.style.top = `${rect.top}px`;
                            popup.style.left = `${rect.right + 50}px`;
                            document.body.appendChild(popup);
                            
                            const closePopup = (e) => {
                              if (!popup.contains(e.target) && e.target !== popup) {
                                popup.remove();
                                document.removeEventListener('click', closePopup);
                              }
                            };
                            setTimeout(() => document.addEventListener('click', closePopup), 0);
                          }}
                        >
                          View Remarks
                        </span>
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