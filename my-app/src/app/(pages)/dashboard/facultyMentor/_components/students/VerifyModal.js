'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import MarksModal from './MarksModal';
import { commonActivities, dailyActivities } from '@/app/Data/activities';
import './page.css';

const MAX_MARKS_MAPPING = {
  1: 10,
  2: 5,
  3: 5,
  4: 5,
  5: 15,
  6: 20,
  7: 40
};

export default function VerifyModal({ student, onClose }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [verificationStatus, setVerificationStatus] = useState({});
  const [marks, setMarks] = useState({});
  const [checkedActivities, setCheckedActivities] = useState({});
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [day1Links, setDay1Links] = useState({ linkedinUrl: null, youtubeUrl: null });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [submissionsResponse, attendanceResponse, marksResponse, linksResponse] = await Promise.all([
        fetch(`/api/dashboard/facultyMentor/submissions`, {
          credentials: 'include'
        }),
        fetch(`/api/dashboard/facultyMentor/attendance`, {
          credentials: 'include'
        }),
        fetch(`/api/dashboard/facultyMentor/dailyMarks?username=${student.username}`, {
          credentials: 'include'
        }),
        fetch(`/api/dashboard/facultyMentor/day1Links?username=${student.username}`, {
          credentials: 'include'
        })
      ]);
      
      if (!submissionsResponse.ok || !attendanceResponse.ok || !marksResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const [submissionsData, attendanceData, marksData] = await Promise.all([
        submissionsResponse.json(),
        attendanceResponse.json(),
        marksResponse.json()
      ]);

      if (linksResponse.ok) {
        const linksData = await linksResponse.json();
        if (linksData.success) setDay1Links({ linkedinUrl: linksData.linkedinUrl, youtubeUrl: linksData.youtubeUrl });
      }
      
      // console.log("submissions",submissionsData.submissions);

      if (submissionsData.submissions) {
        const studentReports = submissionsData.submissions.filter(
          sub => sub.username === student.username
        );
        setReports(studentReports);
        // console.log("submis", studentReports);

        // Initialize verification status from submissions data
        if (studentReports.length > 0) {
          const report = studentReports[0];
          setVerificationStatus({
            day1: report.verified1 || false,
            day2: report.verified2 || false,
            day3: report.verified3 || false,
            day4: report.verified4 || false,
            day5: report.verified5 || false,
            day6: report.verified6 || false,
            day7: report.verified7 || false
          });
        }

        // Find attendance record for this student
        const studentAttendance = attendanceData.attendance.find(
          record => record.username === student.username
        );

        if (studentAttendance) {
          setAttendanceStatus({
            day1: studentAttendance.day1 || null,
            day2: studentAttendance.day2 || null,
            day3: studentAttendance.day3 || null,
            day4: studentAttendance.day4 || null,
            day5: studentAttendance.day5 || null,
            day6: studentAttendance.day6 || null,
            day7: studentAttendance.day7 || null
          });
        }

        // Set marks from marks data
        if (marksData.marks) {
          setMarks({
            day1: marksData.marks.day1 || 0,
            day2: marksData.marks.day2 || 0,
            day3: marksData.marks.day3 || 0,
            day4: marksData.marks.day4 || 0,
            day5: marksData.marks.day5 || 0,
            day6: marksData.marks.day6 || 0,
            day7: marksData.marks.day7 || 0
          });
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student?.username) {
      fetchReports();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student]);

  // Listen for marks from popup
  useEffect(() => {
    const handler = (event) => {
      if (event.data && event.data.type === 'MARKS_SAVED' && event.data.day && typeof event.data.totalMarks === 'number') {
        handleSaveMarks(event.data.totalMarks, event.data.day);
      }
      if (event.data && event.data.type === 'MARKS_REJECTED' && event.data.day) {
        handleAttendanceChange(event.data.day, 'A');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerification = async (day, verified) => {
    try {
      const response = await fetch('/api/dashboard/facultyMentor/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: student.username,
          day,
          verified
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify report');
      }

      // Update local state
      setVerificationStatus(prev => ({
        ...prev,
        [`day${day}`]: verified
      }));

      // If rejecting, automatically mark as absent
      if (!verified) {
        await handleAttendanceChange(day, 'A');
      }

      await fetchReports();
      toast.success(`Report ${verified ? 'verified' : 'rejected'} successfully`);
    } catch (err) {
      console.error('Error verifying report:', err);
      toast.error(err.message);
    }
  };

  const handleAttendanceChange = async (day, status) => {
    try {
      if (status === 'P' && !verificationStatus[`day${day}`]) {
        toast.error('Cannot mark attendance for unverified reports');
        return;
      }
      if (status === 'A' || status === 'P') {
        const response = await fetch('/api/dashboard/facultyMentor/attendance', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: student.username,
            day,
            status,
            marks: status === 'A' ? 0 : marks[`day${day}`] || 0
          })
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update attendance');
        }
        await fetchReports();
        toast.success('Attendance updated successfully');
      }
    } catch (err) {
      console.error('Error updating attendance:', err);
      toast.error(err.message);
    }
  };

  // Open popup for marks modal
  const handleOpenMarksModal = (day, initialMarks) => {
    const url = `/dashboard/facultyMentor/marks-modal?day=${day}&initialMarks=${initialMarks}`;
    window.open(url, 'marksModal', 'width=500,height=500');
  };

  // Save marks and mark present
  const handleSaveMarks = async (totalMarks, day) => {
    try {
      const response = await fetch('/api/dashboard/facultyMentor/attendance', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: student.username,
          day,
          status: 'P',
          marks: totalMarks
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update attendance and marks');
      }
      setMarks(prev => ({
        ...prev,
        [`day${day}`]: totalMarks
      }));
      await fetchReports();
      toast.success('Attendance and marks updated successfully');
    } catch (err) {
      console.error('Error updating attendance and marks:', err);
      toast.error(err.message);
    }
  };

  const canMarkAttendance = (day) => {
    if (day === 1) return true;
    return attendanceStatus[`day${day - 1}`];
  };

  const handleVerify = async (day) => {
    try {
      const response = await fetch('/api/dashboard/facultyMentor/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: student.username,
          day,
        }),
      });

      if (response.ok) {
        setVerificationStatus(prev => ({
          ...prev,
          [`day${day}`]: true
        }));
      }
    } catch (error) {
      console.error('Error verifying report:', error);
    }
  };

  const handleMarksChange = async (day, value) => {
    try {
      const response = await fetch('/api/dashboard/facultyMentor/dailyMarks', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: student.username,
          day,
          marks: parseFloat(value) || 0
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update marks');
      }

      setMarks(prev => ({
        ...prev,
        [`day${day}`]: parseFloat(value) || 0
      }));
      toast.success('Marks updated successfully');
    } catch (error) {
      console.error('Error updating marks:', error);
      toast.error(error.message);
    }
  };

  const calculateTotalMarks = (day) => {
    let total = 0;
    
    // Add marks from common activities
    commonActivities.forEach(activity => {
      if (checkedActivities[`day${day}_${activity.id}`]) {
        total += activity.marks;
      }
    });

    // Add marks from daily activities
    const dayActivities = dailyActivities.find(d => d.day === day)?.activities || [];
    dayActivities.forEach(activity => {
      if (checkedActivities[`day${day}_${activity.id}`]) {
        total += activity.marks || 0;
      }
    });

    return total;
  };

  const handleActivityCheck = (day, activityId, checked) => {
    setCheckedActivities(prev => ({
      ...prev,
      [`day${day}_${activityId}`]: checked
    }));

    // Calculate and update total marks
    const totalMarks = calculateTotalMarks(day);
    setMarks(prev => ({
      ...prev,
      [`day${day}`]: totalMarks
    }));
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Student Reports - {student.name}</h2>
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
            <h2>Student Reports - {student.name}</h2>
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
          <h2>Student Reports - {student.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <table className="verification-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Report</th>
                {/* <th>Uploaded On</th> */}
                <th>Status</th>
                <th>Total Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7].map(day => {
                const report = reports.find(r => r[`day${day}`]);
                const hasUpload = report?.[`day${day}`];
                const isVerified = verificationStatus[`day${day}`];
                const currentAttendance = attendanceStatus[`day${day}`];
                const canMark = canMarkAttendance(day);
                
                return (
                  <tr key={day}>
                    <td>Day {day}</td>
                    <td>
                      {hasUpload ? (
                        <a 
                          href={hasUpload} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="report-link"
                          onClick={e => {
                            if (!isVerified) {
                              e.preventDefault();
                              toast.error('Please verify the report first.');
                            } else if (!canMark) {
                              e.preventDefault();
                              toast.error('Please mark previous days as present first.');
                            }
                          }}
                        >
                          View Report
                        </a>
                      ) : (
                        <span className="no-upload">Not Uploaded</span>
                      )}
                      {day === 1 && (
                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {day1Links.linkedinUrl ? (
                            <a href={day1Links.linkedinUrl} target="_blank" rel="noopener noreferrer"
                               style={{ color: '#0077b5', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="#0077b5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                              LinkedIn
                            </a>
                          ) : (
                            <span style={{ color: '#aaa', fontSize: '0.78rem' }}>LinkedIn: Not submitted</span>
                          )}
                          {day1Links.youtubeUrl ? (
                            <a href={day1Links.youtubeUrl} target="_blank" rel="noopener noreferrer"
                               style={{ color: '#ff0000', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                              YouTube
                            </a>
                          ) : (
                            <span style={{ color: '#aaa', fontSize: '0.78rem' }}>YouTube: Not submitted</span>
                          )}
                        </div>
                      )}
                    </td>
                    {/* <td>
                      {hasUpload ? new Date(report.createdAt).toLocaleDateString() : '-'}
                    </td> */}
                    <td>
                      <div className="status-container">
                        {currentAttendance === 'A' ? (
                          <span className="status-badge rejected">Absent</span>
                        ) : hasUpload ? (
                          <>
                            <span className={`status-badge ${isVerified ? 'verified' : 'pending'}`}>
                              {isVerified ? 'Verified' : 'Pending'}
                            </span>
                            {(isVerified || currentAttendance) && (
                              <span className={`status-badge ${
                                currentAttendance === 'P' ? 'verified' : 
                                currentAttendance === 'A' ? 'rejected' : 'pending'
                              }`}>
                                {currentAttendance === 'P' ? 'Present' : 
                                 currentAttendance === 'A' ? 'Absent' : 
                                 'Not Marked'}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="status-badge not_uploaded">Not Uploaded</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {isVerified && (
                        <span className="total-marks">
                          {marks[`day${day}`] || 0} / {MAX_MARKS_MAPPING[day]}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons-stack">
                        {/* Verification Actions */}
                        {hasUpload && !isVerified && (
                          <div className="verification-actions">
                            <button 
                              className="verify-btn success"
                              onClick={() => handleVerification(day, true)}
                            >
                              Verify Report
                            </button>
                            <button 
                              className="verify-btn danger"
                              onClick={() => handleVerification(day, false)}
                            >
                              Reject Report
                            </button>
                          </div>
                        )}

                        {/* Attendance Actions */}
                        {canMarkAttendance(day) && (
                          <div className="attendance-actions">
                            {hasUpload ? (
                              <>
                                {currentAttendance !== 'P' && (
                                  <>
                                    <button 
                                      className="accept-btn"
                                      onClick={() => handleAttendanceChange(day, 'P')}
                                    >
                                      Accept Marks
                                    </button>
                                    <button 
                                      className="reject-btn"
                                      onClick={() => handleAttendanceChange(day, 'A')}
                                    >
                                      Mark Absent
                                    </button>
                                  </>
                                )}
                                <button 
                                  className="edit-btn"
                                  onClick={() => handleOpenMarksModal(day, marks[`day${day}`] || 0)}
                                >
                                  Edit Marks
                                </button>
                              </>
                            ) : (
                              <button 
                                className="reject-btn"
                                onClick={() => handleAttendanceChange(day, 'A')}
                              >
                                Mark Absent
                              </button>
                            )}
                          </div>
                        )}

                        {/* Messages */}
                        {!canMark && day > 1 && hasUpload && !isVerified && (
                          <span className="verify-message">
                            Verify or reject this report first
                          </span>
                        )}
                        {!canMark && day > 1 && hasUpload && isVerified && attendanceStatus[`day${day - 1}`] == null && (
                          <span className="verify-message">
                            Mark Day {day - 1} as Present or Absent first
                          </span>
                        )}
                        {!hasUpload && (
                          <span className="verify-message">
                            No report uploaded
                          </span>
                        )}
                      </div>
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