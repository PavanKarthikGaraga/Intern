"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import EvaluationModal from './EvaluationModal';
import './page.css';

export default function FinalReports() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState({
    submittedReports: [],
    pendingReports: []
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('all');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchReports();
  }, [user, router, selectedSlot]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/facultyMentor/finalReports', {
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch final reports');
      }

      const data = await response.json();
      if (data.success) {
        setReports(data.data);
        setAvailableSlots(data.data.availableSlots || []);
      } else {
        throw new Error(data.error || 'Failed to fetch final reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
      toast.error('Failed to load final reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (e) => {
    setSelectedSlot(e.target.value);
  };

  const filterReportsBySlot = (reports) => {
    if (selectedSlot === 'all') return reports;
    return reports.filter(report => report.slot === parseInt(selectedSlot));
  };

  const handleDocumentClick = (student) => {
    setSelectedStudent(student);
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleAcceptMarks = async (student) => {
    try {
      const response = await fetch('/api/dashboard/facultyMentor/finalReports/evaluate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: student.username
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept marks');
      }

      await fetchReports();
      toast.success('Marks accepted successfully');
    } catch (err) {
      console.error('Error accepting marks:', err);
      toast.error(err.message);
    }
  };

  const handleEvaluationSubmit = async (evaluationData) => {
    try {
      const response = await fetch('/api/dashboard/facultyMentor/finalReports/evaluate', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: selectedStudent.username,
          ...evaluationData
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update evaluation');
      }

      await fetchReports();
      setIsModalOpen(false);
      toast.success('Evaluation updated successfully');
    } catch (err) {
      console.error('Error updating evaluation:', err);
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="final-reports-section">
        <div className="loading">Loading evaluations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="final-reports-section">
        <div className="error">{error}</div>
      </div>
    );
  }

  const allSubmitted = filterReportsBySlot(reports.submittedReports);
  const pendingEval = allSubmitted.filter(s => !s.completed && !(s.marksCompleted === 'P'));
  const completed   = allSubmitted.filter(s => s.completed || s.marksCompleted === 'P');
  const notSubmitted = filterReportsBySlot(reports.pendingReports);

  const tabStyle = (tab) => ({
    padding: '8px 20px', borderRadius: '6px 6px 0 0', border: 'none', cursor: 'pointer', fontWeight: 600,
    fontSize: '0.9rem', background: activeTab === tab ? '#014a01' : '#f0f0f0',
    color: activeTab === tab ? '#fff' : '#444', position: 'relative', transition: 'all 0.2s'
  });

  return (
    <div className="final-reports-section">
      <h1>Evaluate</h1>

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="slot-filter">Filter by Slot:</label>
          <select id="slot-filter" value={selectedSlot} onChange={handleSlotChange} className="slot-filter">
            <option value="all">All Slots</option>
            {availableSlots.map(slot => (
              <option key={slot} value={slot}>Slot {slot}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #014a01', marginBottom: 24 }}>
        <button style={tabStyle('pending')} onClick={() => setActiveTab('pending')}>
          Pending Evaluation
          {pendingEval.length > 0 && (
            <span style={{
              marginLeft: 8, background: '#e53e3e', color: '#fff', borderRadius: '999px',
              padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700
            }}>{pendingEval.length}</span>
          )}
        </button>
        <button style={tabStyle('completed')} onClick={() => setActiveTab('completed')}>
          Completed
          <span style={{ marginLeft: 8, background: '#38a169', color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>{completed.length}</span>
        </button>
        <button style={tabStyle('notsubmitted')} onClick={() => setActiveTab('notsubmitted')}>
          Not Submitted
          <span style={{ marginLeft: 8, background: '#718096', color: '#fff', borderRadius: '999px', padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>{notSubmitted.length}</span>
        </button>
      </div>

      {/* PENDING EVALUATION TAB */}
      {activeTab === 'pending' && (
        <div className="reports-section">
          <p className="section-description">Students who have submitted reports but have not been evaluated yet.</p>
          {pendingEval.length === 0 ? (
            <div className="no-reports-message" style={{ background: '#f0fff4', border: '1px solid #c6f6d5', color: '#276749', borderRadius: 8, padding: '24px', textAlign: 'center' }}>🎉 All submissions have been evaluated!</div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Student Lead</th>
                  <th>Report</th>
                  <th>Presentation</th>
                  <th>Internal Marks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingEval.map((student, index) => (
                  <tr key={student.username}>
                    <td>{index + 1}</td>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td><span className={`mode-badge ${student.mode?.toLowerCase()}`}>{student.mode}</span></td>
                    <td><span className="slot-badge">{student.slot}</span></td>
                    <td>
                      <div className="lead-info">
                        <span>{student.studentLeadName}</span>
                        <small>{student.studentLeadUsername}</small>
                      </div>
                    </td>
                    <td>
                      <a href={student.finalReport} target="_blank" rel="noopener noreferrer" className="report-link">View Report</a>
                    </td>
                    <td>
                      {student.finalPresentation
                        ? <a href={student.finalPresentation} target="_blank" rel="noopener noreferrer" className="report-link">View Presentation</a>
                        : <span style={{ color: '#999', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td><span className="internal-marks">{student.internalMarks} / 60</span></td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEditClick(student)}>Evaluate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* COMPLETED TAB */}
      {activeTab === 'completed' && (
        <div className="reports-section">
          <p className="section-description">Students whose final reports have been fully evaluated and marked.</p>
          {completed.length === 0 ? (
            <div className="no-reports-message">No completed evaluations yet.</div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Student Lead</th>
                  <th>Internal</th>
                  <th>Final Report</th>
                  <th>Presentation</th>
                  <th>Total</th>
                  <th>Grade</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((student, index) => (
                  <tr key={student.username}>
                    <td>{index + 1}</td>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td><span className={`mode-badge ${student.mode?.toLowerCase()}`}>{student.mode}</span></td>
                    <td><span className="slot-badge">{student.slot}</span></td>
                    <td>
                      <div className="lead-info">
                        <span>{student.studentLeadName}</span>
                        <small>{student.studentLeadUsername}</small>
                      </div>
                    </td>
                    <td><span className="internal-marks">{student.internalMarks} / 60</span></td>
                    <td><span className="marks">{student.finalReportMarks} / 25</span></td>
                    <td><span className="marks">{student.finalPresentationMarks} / 15</span></td>
                    <td><span className="total-marks">{(Number(student.internalMarks)||0)+(Number(student.finalReportMarks)||0)+(Number(student.finalPresentationMarks)||0)} / 100</span></td>
                    <td><span className={`grade-badge ${student.grade?.toLowerCase()}`}>{student.grade || '—'}</span></td>
                    <td><button className="edit-btn" onClick={() => handleEditClick(student)}>Re-evaluate</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* NOT SUBMITTED TAB */}
      {activeTab === 'notsubmitted' && (
        <div className="reports-section">
          <p className="section-description">Students who have completed the internship but have not submitted their final report yet.</p>
          {notSubmitted.length === 0 ? (
            <div className="no-reports-message">All students have submitted their reports.</div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Student Lead</th>
                  <th>Internal Marks</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {notSubmitted.map((student, index) => (
                  <tr key={student.username}>
                    <td>{index + 1}</td>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td><span className={`mode-badge ${student.mode?.toLowerCase()}`}>{student.mode}</span></td>
                    <td><span className="slot-badge">{student.slot}</span></td>
                    <td>
                      <div className="lead-info">
                        <span>{student.studentLeadName}</span>
                        <small>{student.studentLeadUsername}</small>
                      </div>
                    </td>
                    <td><span className="internal-marks">{student.internalMarks} / 60</span></td>
                    <td><span className="status-badge pending">No Report Submitted</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {isModalOpen && (
        <EvaluationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleEvaluationSubmit}
          student={selectedStudent}
          isEdit={true}
        />
      )}
    </div>
  );
} 