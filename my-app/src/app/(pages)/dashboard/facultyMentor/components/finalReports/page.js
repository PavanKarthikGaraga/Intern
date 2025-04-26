"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
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

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchReports();
  }, [user, router]);

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

  const handleVerify = async (username, completed) => {
    try {
      const response = await fetch('/api/dashboard/facultyMentor/finalReports', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, completed })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update report status');
      }

      await fetchReports();
      toast.success(`Report marked as completed`);
    } catch (err) {
      console.error('Error verifying report:', err);
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
                  <th>Branch</th>
                  <th>Year</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Student Lead</th>
                  <th>Report</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.submittedReports.map((student) => (
                  <tr key={student.username}>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td>{student.branch}</td>
                    <td>{student.year}</td>
                    <td>
                      <span className={`mode-badge ${student.mode.toLowerCase()}`}>
                        {student.mode}
                      </span>
                    </td>
                    <td>
                      <span className="slot-badge">
                        {student.slot}
                      </span>
                    </td>
                    <td>
                      <div className="lead-info">
                        <span>{student.studentLeadName}</span>
                        <small>{student.studentLeadUsername}</small>
                      </div>
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
                      <span className={`status-badge ${student.completed ? 'completed' : 'pending'}`}>
                        {student.completed ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {!student.completed && (
                        <div className="action-buttons">
                          <button
                            className="verify-btn"
                            onClick={() => handleVerify(student.username, true)}
                          >
                            Mark as Completed
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
                  <th>Branch</th>
                  <th>Year</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Student Lead</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.pendingReports.map((student) => (
                  <tr key={student.username}>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td>{student.branch}</td>
                    <td>{student.year}</td>
                    <td>
                      <span className={`mode-badge ${student.mode.toLowerCase()}`}>
                        {student.mode}
                      </span>
                    </td>
                    <td>
                      <span className="slot-badge">
                        Slot {student.slot}
                      </span>
                    </td>
                    <td>
                      <div className="lead-info">
                        <span>{student.studentLeadName}</span>
                        <small>{student.studentLeadUsername}</small>
                      </div>
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
    </div>
  );
} 