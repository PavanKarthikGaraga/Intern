'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './page.css';

function RemarksModal({ open, onClose, onSave, initialRemarks = '' }) {
  const [remarks, setRemarks] = useState(initialRemarks);
  const [error, setError] = useState('');
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2>Remarks</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <textarea
            className="remarks-textarea"
            placeholder="Enter remarks (required)"
            value={remarks}
            onChange={e => { setRemarks(e.target.value); setError(''); }}
            rows={4}
            style={{ width: '100%', borderRadius: 6, border: '1px solid #ccc', padding: 8 }}
          />
          {error && <div style={{ color: 'red', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="save-marks-btn" onClick={() => {
              if (!remarks.trim()) { setError('Remarks are required'); return; }
              onSave(remarks);
            }}>Save</button>
            <button className="mark-zero-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyModal({ student, onClose }) {
  const [daysData, setDaysData] = useState([]); // [{day, report, attendance, marks, message, status}]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marksModal, setMarksModal] = useState({ open: false, day: null, initialMarks: 0, initialRemarks: '' });
  const [remarksModal, setRemarksModal] = useState({ open: false, day: null, initialRemarks: '' });
  const [editType, setEditType] = useState(null); // 'present' or 'absent'

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'MARKS_SAVED') {
        const { day, totalMarks, remarks } = event.data;
        handleAttendanceChange(day, 'P', totalMarks, remarks);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchDaysData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/dashboard/admin/supplyStudents/submissions?username=${student.username}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch data');
      const { data } = await res.json();
      console.log(data);
      setDaysData(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (student?.username) fetchDaysData(); }, [student]);

  // POST attendance/marks/message and reset sstatus
  const handleAttendanceChange = async (day, status, marks = 0, remarks = '') => {
    try {
      const response = await fetch('/api/dashboard/admin/supplyStudents/attendance', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: student.username,
          day,
          status,
          marks,
          remarks,
          resetStatus: true
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update attendance');
      }
      await fetchDaysData();
      toast.success('Saved successfully');
      setMarksModal({ open: false, day: null, initialMarks: 0, initialRemarks: '' });
      setRemarksModal({ open: false, day: null, initialRemarks: '' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Can mark if previous day is marked (P or A), or if sstatus is 'new' for this day
  const canMarkAttendance = (dayIdx) => {
    if (dayIdx === 0) return true;
    const prev = daysData[dayIdx - 1];
    return prev && (prev.attendance === 'P' || prev.attendance === 'A');
  };

  if (loading) return <div className="modal-overlay"><div className="modal-content"><div className="modal-header"><h2>Student Reports - {student.name}</h2><button className="close-btn" onClick={onClose}>×</button></div><div className="modal-body"><div className="loading">Loading reports...</div></div></div></div>;
  if (error) return <div className="modal-overlay"><div className="modal-content"><div className="modal-header"><h2>Student Reports - {student.name}</h2><button className="close-btn" onClick={onClose}>×</button></div><div className="modal-body"><div className="error">Error loading reports: {error}</div></div></div></div>;

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
                <th>Status</th>
                <th>Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {daysData.map((d, idx) => {
                const isNew = d.status === 'new';
                let statusLabel = '';
                let statusClass = '';
                if (isNew) {
                  statusLabel = 'New';
                  statusClass = 'pending';
                } else if (!d.report) {
                  statusLabel = 'No Report Uploaded';
                  statusClass = 'not_uploaded';
                } else if (d.attendance === 'P') {
                  statusLabel = 'Present';
                  statusClass = 'verified';
                } else if (d.attendance === 'A') {
                  statusLabel = 'Absent';
                  statusClass = 'rejected';
                } else if (d.report && d.attendance == null) {
                  statusLabel = 'Pending';
                  statusClass = 'pending';
                }
                let canMark = false;
                if (idx === 0) {
                  canMark = true;
                } else if (daysData[idx - 1]?.attendance === 'P') {
                  canMark = true;
                } else if (daysData[idx - 1]?.attendance === 'A' && typeof d.report === 'string' && d.report.trim() !== '') {
                  canMark = true;
                } else if (isNew) {
                  canMark = true;
                }
                return (
                  <tr key={d.day}>
                    <td>Day {d.day}</td>
                    <td>{d.report ? <a href={d.report} target="_blank" rel="noopener noreferrer" className="report-link">View Report</a> : <span className="no-upload">Not Uploaded</span>}</td>
                    <td><span className={`status-badge ${statusClass}`}>{statusLabel}</span></td>
                    <td>{d.marks !== null && d.marks !== undefined ? d.marks : '-'}</td>
                    <td>
                      <div className="action-buttons-row">
                        {(d.report && (isNew || (canMark && d.attendance == null))) && (
                          <>
                            <button className="accept-btn small-btn" onClick={() => setMarksModal({ open: true, day: d.day, initialMarks: d.marks || 0, initialRemarks: d.message || '' })}>Mark Present</button>
                            <button className="reject-btn small-btn" onClick={() => setRemarksModal({ open: true, day: d.day, initialRemarks: d.message || '' })}>Mark Absent</button>
                          </>
                        )}
                        {!isNew && d.attendance === 'P' && (
                          <button className="accept-btn small-btn" onClick={() => setMarksModal({ open: true, day: d.day, initialMarks: d.marks || 0, initialRemarks: d.message || '' })}>Edit Marks</button>
                        )}
                        {!isNew && d.attendance === 'A' && d.message && (
                          <span className="verify-message">{d.message}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Marks Modal */}
        {marksModal.open && (
          <MarksModal
            day={marksModal.day}
            onClose={() => setMarksModal({ open: false, day: null, initialMarks: 0, initialRemarks: '' })}
            initialMarks={marksModal.initialMarks}
            initialRemarks={marksModal.initialRemarks}
            onSave={(marks, remarks) => handleAttendanceChange(marksModal.day, 'P', marks, remarks)}
          />
        )}
        {/* Remarks Modal */}
        {remarksModal.open && (
          <RemarksModal
            open={remarksModal.open}
            onClose={() => setRemarksModal({ open: false, day: null, initialRemarks: '' })}
            initialRemarks={remarksModal.initialRemarks}
            onSave={remarks => handleAttendanceChange(remarksModal.day, 'A', 0, remarks)}
          />
        )}
      </div>
    </div>
  );
}
// import MarksModal at the top:
import MarksModal from './MarksModal'; 