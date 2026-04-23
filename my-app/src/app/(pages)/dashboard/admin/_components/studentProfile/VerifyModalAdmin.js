import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import MarksModal from './MarksModal';
import './page.css';

export default function VerifyModalAdmin({ student, onClose }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [verificationStatus, setVerificationStatus] = useState({});
  const [marks, setMarks] = useState({});
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [internalMarks, setInternalMarks] = useState(0);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/admin/studentProfile/studentData?username=${student.username}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setReports(data.submissions || {});
      setVerificationStatus(data.verification || {});
      setAttendanceStatus(data.attendance || {});
      setMarks(data.marks || {});
      setInternalMarks(data.internalMarks || 0);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (student?.username) {
      fetchStudentData();
    }
  }, [student]);

  const handleAttendanceChange = async (day, status) => {
    try {
      if (status === 'P') {
        setSelectedDay(day);
        setShowMarksModal(true);
        return;
      }

      const response = await fetch('/api/dashboard/admin/studentProfile/studentData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: student.username, day, status: 'A' })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update attendance');
      }

      await fetchStudentData();
      toast.success('Attendance updated successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveMarks = async (totalMarks) => {
    try {
      const response = await fetch('/api/dashboard/admin/studentProfile/studentData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: student.username,
          day: selectedDay,
          status: 'P',
          marks: totalMarks
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update attendance and marks');
      }

      setShowMarksModal(false);
      await fetchStudentData();
      toast.success('Attendance and marks updated successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return (<div className="modal-overlay"><div className="modal-content"><div className="loading">Loading reports...</div></div></div>);
  if (error) return (<div className="modal-overlay"><div className="modal-content"><div className="error">{error}</div></div></div>);

  return (
    <div className="modal-overlay">
      <div className="modal-cont">
        <div className="modal-header">
          <h2>Student Reports - {student.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="internal-marks">
            <h3>Internal Marks: {internalMarks}</h3>
          </div>
          <table className="verification-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Report</th>
                <th>Status</th>
                <th>Total Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5,6,7].map(day => {
                const report = reports[`day${day}`];
                const hasUpload = report;
                const isVerified = verificationStatus[`day${day}`];
                const currentAttendance = attendanceStatus[`day${day}`];
                return (
                  <tr key={day}>
                    <td>Day {day}</td>
                    <td>{hasUpload ? (<a href={hasUpload} target="_blank" rel="noopener noreferrer" className="report-link">View</a>) : '-'}</td>
                    <td>{isVerified ? 'Verified' : 'Pending'}</td>
                    <td>{marks[`day${day}`] || 0}</td>
                    <td>
                      <button 
                        onClick={() => handleAttendanceChange(day, currentAttendance === 'P' ? 'A' : 'P')}
                        className={currentAttendance === 'P' ? 'absent-btn' : 'present-btn'}
                      >
                        {currentAttendance === 'P' ? 'Mark Absent' : 'Mark Present'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {showMarksModal && (
          <MarksModal 
            day={selectedDay} 
            onClose={() => setShowMarksModal(false)} 
            onSave={handleSaveMarks} 
          />
        )}
      </div>
    </div>
  );
} 