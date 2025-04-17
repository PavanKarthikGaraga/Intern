'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './page.css';

export default function VerifyModal({ student, onClose }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [verificationStatus, setVerificationStatus] = useState({});

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [submissionsResponse, attendanceResponse] = await Promise.all([
        fetch(`/api/dashboard/facultyMentor/submissions`, {
          credentials: 'include'
        }),
        fetch(`/api/dashboard/facultyMentor/attendance`, {
          credentials: 'include'
        })
      ]);
      
      if (!submissionsResponse.ok || !attendanceResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const [submissionsData, attendanceData] = await Promise.all([
        submissionsResponse.json(),
        attendanceResponse.json()
      ]);

      if (submissionsData.submissions) {
        const studentReports = submissionsData.submissions.filter(
          sub => sub.username === student.username
        );
        setReports(studentReports);

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
  }, [student]);

  const handleAttendanceChange = async (day, status) => {
    try {
      // Check if the day is verified before allowing attendance marking
      if (!verificationStatus[`day${day}`]) {
        toast.error('Cannot mark attendance for unverified reports');
        return;
      }

      const response = await fetch('/api/dashboard/facultyMentor/attendance', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: student.username,
          day,
          status
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update attendance');
      }

      await fetchReports();
      toast.success('Attendance updated successfully');
    } catch (err) {
      console.error('Error updating attendance:', err);
      toast.error(err.message);
    }
  };

  const canMarkAttendance = (day) => {
    if (day === 1) return verificationStatus[`day${day}`];
    return verificationStatus[`day${day}`] && attendanceStatus[`day${day - 1}`] === 'P';
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
                <th>Uploaded On</th>
                <th>Attendance</th>
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
                      <span className={`status-badge ${currentAttendance === 'P' ? 'verified' : 
                        currentAttendance === 'A' ? 'not_uploaded' : 'pending'}`}>
                        {currentAttendance === 'P' ? 'Present' : 
                         currentAttendance === 'A' ? 'Absent' : 
                         'Not Marked'}
                      </span>
                    </td>
                    <td>
                      {hasUpload && isVerified && canMark && currentAttendance !== 'P' && (
                        <div className="action-buttons">
                          <button 
                            className="accept-btn"
                            onClick={() => handleAttendanceChange(day, 'P')}
                          >
                            Present
                          </button>
                          <button 
                            className="reject-btn"
                            onClick={() => handleAttendanceChange(day, 'A')}
                          >
                            Absent
                          </button>
                        </div>
                      )}
                      {!canMark && day > 1 && hasUpload && !isVerified && (
                        <span className="verify-message">
                          Report needs to be verified first
                        </span>
                      )}
                      {!canMark && day > 1 && hasUpload && isVerified && (
                        <span className="verify-message">
                          Mark Day {day - 1} as Present first
                        </span>
                      )}
                      {!hasUpload && (
                        <span className="verify-message">
                          No report uploaded
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