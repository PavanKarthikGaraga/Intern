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

  useEffect(() => {
    if (!user) return;
    fetchReports();
    // eslint-disable-next-line
  }, [user]);

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
        // console.log("data",data.data.submittedReports); 
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

  const handleDocumentClick = (student) => {
    setSelectedStudent(student);
    setViewedReports(prev => new Set([...prev, student.username]));
  };

  const handleEvaluationClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const getGrade = (student) => {
    if (student.completed) {
      if(student.grade === 'Certificate of Excellence') {
        return 'A';
      } else if(student.grade === 'Certificate of Appreciation') {
        return 'B';
      } else if(student.grade === 'Certificate of Participation') {
        return 'C';
      } else if(student.grade === 'Not Qualified') {
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
      <div className="reports-section">
        <h2>Submitted Reports ({reports.submittedReports.length})</h2>
        <p className="section-description">Students who have submitted their final reports</p>
        <div className="table-container">
          {reports.submittedReports.length === 0 ? (
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.submittedReports.map((student) => (
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
                      <span className={`status-badge ${student.completed ? 'completed' : 'pending'}`}>{student.completed ? 'Completed' : 'Pending'}</span>
                    </td>
                    <td>
                      <span className="internal-marks">{student.internalMarks} / 60.00</span>
                    </td>
                    <td>
                      {student.completed ? (
                        <span className={`grade-badge ${getGrade(student)}`}>{getGrade(student)}</span>
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
        <h2>Pending Reports ({reports.pendingReports.length})</h2>
        <p className="section-description">Students who are verified but haven't submitted their reports yet</p>
        <div className="table-container">
          {reports.pendingReports.length === 0 ? (
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
                {reports.pendingReports.map((student) => (
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