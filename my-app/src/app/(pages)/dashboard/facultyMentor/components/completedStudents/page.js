'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './page.css';

export default function CompletedStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompletedStudents();
  }, []);

  const fetchCompletedStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/facultyMentor/completedStudents', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch completed students');
      }

      const data = await response.json();
      setStudents(data.completedStudents);
    } catch (err) {
      console.error('Error fetching completed students:', err);
      setError(err.message);
      toast.error('Failed to load completed students');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="completed-section">
        <div className="section-header">
          <h1>Completed Students</h1>
        </div>
        <div className="loading">Loading completed students...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="completed-section">
        <div className="section-header">
          <h1>Completed Students</h1>
        </div>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="completed-section">
      <div className="section-header">
        <h1>Completed Students</h1>
        <span className="total-students">Total: {students.length}</span>
      </div>

      {students.length === 0 ? (
        <div className="no-students">
          <div className="no-students-message">
            <span>No completed students found</span>
            <p>Students will appear here once they complete their internship and submit their final report.</p>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="completed-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Mode</th>
                <th>Slot</th>
                <th>Student Lead</th>
                <th>Contact</th>
                <th>Report</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
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
                    <div className="contact-info">
                      <a href={`mailto:${student.email}`} className="contact-link">
                        {student.email}
                      </a>
                      <a href={`tel:${student.phoneNumber}`} className="contact-link">
                        {student.phoneNumber}
                      </a>
                    </div>
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
                      <span className="no-report">No Report</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
