"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import EvaluationModal from './EvaluationModal';
import './page.css';

export default function SFinalReports() {
  const router = useRouter();
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

  useEffect(() => {
    fetchReports();
  }, [selectedSlot]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/admin/sfinal/finalReports', {
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
  };

  const handleEditClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleEvaluationSubmit = async (evaluationData) => {
    try {
      const response = await fetch('/api/dashboard/admin/sfinal/finalReports/evaluate', {
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
      toast.error(err.message);
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
      <h1>Special Students Final Reports</h1>
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
        <p className="section-description">Special students who have submitted their final reports</p>
        <div className="table-container">
          {filterReportsBySlot(reports.submittedReports).length === 0 ? (
            <div className="no-reports-message">No final reports submitted yet.</div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>S no</th>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Report</th>
                  <th>Presentation</th>
                  <th>Internal Marks</th>
                  <th>Final Report</th>
                  <th>Final Presentation</th>
                  <th>Total Marks</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterReportsBySlot(reports.submittedReports).map((student,index) => (
                  <tr key={student.username} className='roe'>
                    <td>{index+1}</td>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td>
                      <span className={`mode-badge ${student.mode.toLowerCase()}`}>{student.mode}</span>
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
                        onClick={(e) => {
                          e.preventDefault();
                          handleDocumentClick(student);
                          window.open(student.finalReport, '_blank');
                        }}
                      >
                        View Report
                      </a>
                    </td>
                    <td>
                      {student.finalPresentation && (
                        <a
                          href={student.finalPresentation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="report-link"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDocumentClick(student);
                            window.open(student.finalPresentation, '_blank');
                          }}
                        >
                          View Presentation
                        </a>
                      )}
                    </td>
                    <td>  
                      <span className="internal-marks">{student.internalMarks} / 60</span>
                    </td>
                    <td>
                      <span className="marks">{student.finalReportMarks} / 25</span>
                    </td>
                    <td>
                      <span className="marks">{student.finalPresentationMarks} / 15</span>
                    </td>
                    <td>
                      <span className="total-marks">
                        {(student.finalReportMarks !== null && student.finalReportMarks !== undefined &&
                          student.finalPresentationMarks !== null && student.finalPresentationMarks !== undefined &&
                          !(Number(student.finalReportMarks) === 0 && Number(student.finalPresentationMarks) === 0)
                        )
                          ? ((Number(student.internalMarks) || 0) + (Number(student.finalReportMarks) || 0) + (Number(student.finalPresentationMarks) || 0))
                          : 0
                        } / 100
                      </span>
                    </td>
                    <td>
                      <span className={`grade-badge ${student.grade?.toLowerCase()}`}>{student.grade || '-'}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${student.completed ? 'completed' : 'pending'}`}>{student.completed ? 'Accepted' : 'Pending'}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="edit-btn" onClick={() => handleEditClick(student)}>Evaluate</button>
                      </div>
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
        <p className="section-description">Special students who are verified but haven't submitted their reports yet</p>
        <div className="table-container">
          {filterReportsBySlot(reports.pendingReports).length === 0 ? (
            <div className="no-reports-message">No pending reports.</div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>S no</th>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Internal Marks</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filterReportsBySlot(reports.pendingReports).map((student,index) => (
                  <tr key={student.username}>
                    <td>{index+1}</td>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td>
                      <span className={`mode-badge ${student.mode.toLowerCase()}`}>{student.mode}</span>
                    </td>
                    <td>
                      <span className="slot-badge">{student.slot}</span>
                    </td>
                    <td>
                      <span className="internal-marks">{student.internalMarks} / 60</span>
                    </td>
                    <td>
                      <span className={`grade-badge ${student.grade?.toLowerCase()}`}>{student.grade || '-'}</span>
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