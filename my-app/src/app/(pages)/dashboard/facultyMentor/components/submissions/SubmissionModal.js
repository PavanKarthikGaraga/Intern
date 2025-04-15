'use client';
import { useState } from 'react';
import './SubmissionModal.css';

export default function SubmissionModal({ submission, onClose, onUpdateAttendance }) {
  const handleAttendanceClick = async (day, status) => {
    try {
      await onUpdateAttendance(submission.studentUsername, day, status);
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  // Get all days that have verified submissions
  const verifiedDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(
    day => submission[`day${day}Link`] && submission[`day${day}Verified`] === 1
  );

  const getAttendanceStatus = (day) => {
    const status = submission[`day${day}Attendance`];
    if (status === 'P') return 'Present';
    if (status === 'A') return 'Absent';
    return 'Not Marked';
  };

  const getStatusClass = (day) => {
    const status = submission[`day${day}Attendance`];
    if (status === 'P') return 'status-present';
    if (status === 'A') return 'status-absent';
    return 'status-pending';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{submission.studentName}'s Submissions</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="student-info">
            <p><strong>Student Lead:</strong> {submission.leadName}</p>
          </div>

          <div className="submissions-list">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Submission</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {verifiedDays.map(day => (
                  <tr key={day}>
                    <td>Day {day}</td>
                    <td>
                      <a 
                        href={submission[`day${day}Link`]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-link"
                      >
                        View Report
                      </a>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(day)}`}>
                        {getAttendanceStatus(day)}
                      </span>
                    </td>
                    <td className="attendance-actions">
                      <button 
                        className={`attendance-btn present ${submission[`day${day}Attendance`] === 'P' ? 'active' : ''}`}
                        onClick={() => handleAttendanceClick(day, 'P')}
                      >
                        Present
                      </button>
                      <button 
                        className={`attendance-btn absent ${submission[`day${day}Attendance`] === 'A' ? 'active' : ''}`}
                        onClick={() => handleAttendanceClick(day, 'A')}
                      >
                        Absent
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {verifiedDays.length === 0 && (
            <div className="no-submissions">
              No verified submissions found
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 