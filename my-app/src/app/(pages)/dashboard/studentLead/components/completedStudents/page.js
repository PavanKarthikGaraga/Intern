"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import "./page.css";

const CompletedStudents = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState({
    completedStudents: [],
    pendingStudents: []
  });
  const [pagination, setPagination] = useState({
    completedTotal: 0,
    pendingTotal: 0,
    currentPage: {
      completed: 1,
      pending: 1
    },
    totalPages: {
      completed: 1,
      pending: 1
    }
  });
  const [selectedSlot, setSelectedSlot] = useState("all");

  useEffect(() => {
    if (!user) return;
    fetchStudents();
  }, [user, selectedSlot, pagination.currentPage.completed, pagination.currentPage.pending]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/studentLead/completedStudents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: user.username,
          completedPage: pagination.currentPage.completed,
          pendingPage: pagination.currentPage.pending,
          slot: selectedSlot !== 'all' ? parseInt(selectedSlot) : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      if (data.success) {
        setStudents(data.data);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch students');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotChange = (e) => {
    setSelectedSlot(e.target.value);
    setPagination(prev => ({
      ...prev,
      currentPage: {
        completed: 1,
        pending: 1
      }
    }));
  };

  const handlePageChange = (type, newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages[type]) return;
    
    setPagination(prev => ({
      ...prev,
      currentPage: {
        ...prev.currentPage,
        [type]: newPage
      }
    }));
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="completed-students-section">
      <div className="section-header">
        <h1>Student Progress</h1>
        <div className="filters">
          <select value={selectedSlot} onChange={handleSlotChange}>
            <option value="all">All Slots</option>
            <option value="1">Slot 1</option>
            <option value="2">Slot 2</option>
            <option value="3">Slot 3</option>
            <option value="4">Slot 4</option>
          </select>
        </div>
      </div>

      <div className="students-grid">
        <div className="completed-section">
          <h2>Completed Students ({pagination.completedTotal})</h2>
          <div className="table-container">
            {students.completedStudents.length === 0 ? (
              <p className="no-data">No completed students found.</p>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ID</th>
                      <th>Slot</th>
                      <th>Mode</th>
                      <th>Grade</th>
                      <th>Total Marks</th>
                      <th>Report</th>
                      <th>Presentation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.completedStudents.map((student) => (
                      <tr key={student.username}>
                        <td>{student.studentName}</td>
                        <td>{student.username}</td>
                        <td>{student.slot}</td>
                        <td>
                          <span className={`mode-badge ${student.mode?.toLowerCase()}`}>
                            {student.mode}
                          </span>
                        </td>
                        <td>
                          <span className={`grade-badge ${student.grade?.toLowerCase()}`}>
                            {student.grade}
                          </span>
                        </td>
                        <td>{student.totalMarks}/100</td>
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
                          <a
                            href={student.finalPresentation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="report-link"
                          >
                            View Presentation
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pagination-controls">
                  <button
                    onClick={() => handlePageChange('completed', pagination.currentPage.completed - 1)}
                    disabled={pagination.currentPage.completed === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {pagination.currentPage.completed} of {pagination.totalPages.completed}
                  </span>
                  <button
                    onClick={() => handlePageChange('completed', pagination.currentPage.completed + 1)}
                    disabled={pagination.currentPage.completed === pagination.totalPages.completed}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="pending-section">
          <h2>Pending Students ({pagination.pendingTotal})</h2>
          <div className="table-container">
            {students.pendingStudents.length === 0 ? (
              <p className="no-data">No pending students found.</p>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>ID</th>
                      <th>Slot</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th>Report</th>
                      <th>Presentation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.pendingStudents.map((student) => (
                      <tr key={student.username}>
                        <td>{student.studentName}</td>
                        <td>{student.username}</td>
                        <td>{student.slot}</td>
                        <td>
                          <span className={`mode-badge ${student.mode?.toLowerCase()}`}>
                            {student.mode}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge pending">
                            {student.finalReport ? 'Pending Evaluation' : 'Not Submitted'}
                          </span>
                        </td>
                        <td>
                          {student.finalReport ? (
                            <a
                              href={student.finalReport}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="report-link"
                            >
                              View Report
                            </a>
                          ) : (
                            <span className="not-submitted">Not Submitted</span>
                          )}
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
                            <span className="not-submitted">Not Submitted</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="pagination-controls">
                  <button
                    onClick={() => handlePageChange('pending', pagination.currentPage.pending - 1)}
                    disabled={pagination.currentPage.pending === 1}
                  >
                    Previous
                  </button>
                  <span>
                    Page {pagination.currentPage.pending} of {pagination.totalPages.pending}
                  </span>
                  <button
                    onClick={() => handlePageChange('pending', pagination.currentPage.pending + 1)}
                    disabled={pagination.currentPage.pending === pagination.totalPages.pending}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedStudents;
