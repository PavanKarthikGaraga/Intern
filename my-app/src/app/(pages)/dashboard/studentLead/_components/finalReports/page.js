"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import './page.css';
import EvaluationModal from './EvaluationModal';

export default function FinalReports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState({
    submittedReports: [],
    pendingReports: []
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewedReports, setViewedReports] = useState(new Set());
  const [selectedSlot, setSelectedSlot] = useState('all');
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetchReports();
    // eslint-disable-next-line
  }, [user, selectedSlot]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/studentLead/finalReports', {
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
    setViewedReports(prev => new Set([...prev, student.username]));
  };

  const handleEvaluationClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const getGrade = (student) => {
    if (student.completed || student.marksCompleted === 'P') {
      if (student.totalMarks >= 90) {
        return 'A';
      } else if (student.totalMarks >= 80) {
        return 'B';
      } else if (student.totalMarks >= 70) {
        return 'C';
      } else if (student.totalMarks >= 60) {
        return 'D';
      } else {
        return 'F';
      }
    }
    return 'Pending';
  }

  const handleEvaluationSubmit = async (evaluationData) => {
    let toastId;
    try {
      toastId = toast.loading('Submitting evaluation...');
      const response = await fetch('/api/dashboard/studentLead/finalReports/evaluate', {
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
        throw new Error(data.error || 'Failed to submit evaluation');
      }
      await fetchReports();
      setIsModalOpen(false);
      toast.success('Evaluation submitted successfully');
    } catch (err) {
      toast.error(err.message);
    } finally {
      if (toastId) toast.dismiss(toastId);
    }
  };

  if (loading) {
    return (
      <div className="final-reports-section">
        <div className="loading">Loading final reports...</div>
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

  return (
    <div className="final-reports-section">
      <h1>Final Reports</h1>
      
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="slot-filter">Filter by Slot:</label>
          <select 
            id="slot-filter" 
            value={selectedSlot} 
            onChange={handleSlotChange}
            className="slot-filter"
          >
            <option value="all">All Slots</option>
            {availableSlots.map(slot => (
              <option key={slot} value={slot}>Slot {slot}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="reports-section">
        <h2>Submitted Reports ({filterReportsBySlot(reports.submittedReports).length})</h2>
        <p className="section-description">Students who have submitted their final reports</p>
        <div className="table-container">
          {filterReportsBySlot(reports.submittedReports).length === 0 ? (
            <div className="no-reports-message">No final reports submitted yet.</div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Report</th>
                  <th>Presentation</th>
                  <th>Status</th>
                  <th>Internal Marks</th>
                  <th>Final Report</th>
                  <th>Final Presentation</th>
                  <th>Total Marks</th>
                  <th>Grade</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterReportsBySlot(reports.submittedReports).map((student) => (
                  <tr key={student.username}>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td>
                      <span className={`mode-badge ${student.mode?.toLowerCase()}`}>{student.mode}</span>
                    </td>
                    <td>
                      <span className="slot-badge">{student.slot}</span>
                    </td>
                    <td>
                      <a
                        href={student.finalReport}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="report-link"
                      >
                        View Report
                      </a>
                    </td>
                    <td>
                      {student.finalPresentation ? (
                        <a
                          href={student.finalPresentation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="report-link"
                        >
                          View Presentation
                        </a>
                      ) : (
                        <span className="status-badge pending">Not Submitted</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${student.completed ? 'completed' : 'pending'}`}>
                        {student.completed ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <span className="internal-marks">{student.internalMarks} / 60.00</span>
                    </td>
                    <td>
                      {student.finalReportMarks !== null ? (
                        <span className="marks">{student.finalReportMarks} / 25.00</span>
                      ) : (
                        <span className="status-badge pending">Pending</span>
                      )}
                    </td>
                    <td>
                      {student.finalPresentationMarks !== null ? (
                        <span className="marks">{student.finalPresentationMarks} / 15.00</span>
                      ) : (
                        <span className="status-badge pending">Pending</span>
                      )}
                    </td>
                    <td>
                      {student.totalMarks !== null ? (
                        <span className="total-marks">{student.totalMarks} / 100.00</span>
                      ) : (
                        <span className="status-badge pending">Pending</span>
                      )}
                    </td>
                    <td>
                      {student.grade ? (
                        <span className={`grade-badge ${getGrade(student)}`}>{getGrade(student)}</span>
                      ) : (
                        <span className="status-badge pending">Pending</span>
                      )}
                    </td>
                    <td>
                      {student.completed || student.marksCompleted === 'P' ? (
                        <div className="evaluation-info">
                          {student.feedback && (
                            <button 
                              className="feedback-btn"
                              onClick={() => toast.success(student.feedback, { duration: 5000 })}
                              title="View Feedback"
                            >
                              View Feedback
                            </button>
                          )}
                          {student.evaluatedAt && (
                            <span className="evaluation-date">
                              Evaluated: {new Date(student.evaluatedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button
                            className="verify-btn"
                            onClick={() => handleEvaluationClick(student)}
                          >
                            Evaluate Report
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="reports-section">
        <h2>Pending Reports ({filterReportsBySlot(reports.pendingReports).length})</h2>
        <p className="section-description">Students who are verified but haven't submitted their reports yet</p>
        <div className="table-container">
          {filterReportsBySlot(reports.pendingReports).length === 0 ? (
            <div className="no-reports-message">No pending reports.</div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filterReportsBySlot(reports.pendingReports).map((student) => (
                  <tr key={student.username}>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td>
                      <span className={`mode-badge ${student.mode?.toLowerCase()}`}>{student.mode}</span>
                    </td>
                    <td>
                      <span className="slot-badge">{student.slot}</span>
                    </td>
                    <td>
                      <span className="status-badge pending">No Report</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {isModalOpen && (
        <EvaluationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleEvaluationSubmit}
          student={selectedStudent}
        />
      )}
    </div>
  );
}