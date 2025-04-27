'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './page.css';

export default function CompletedStudents() {
  const [completedStudents, setCompletedStudents] = useState([]);
  const [verifiedStudents, setVerifiedStudents] = useState([]);
  const [failedStudents, setFailedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    slot: '',
    studentLead: ''
  });
  const [availableFilters, setAvailableFilters] = useState({
    slots: [],
    studentLeads: []
  });

  useEffect(() => {
    fetchCompletedStudents();
  }, [filters]);

  const fetchCompletedStudents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.slot) queryParams.append('slot', filters.slot);
      if (filters.studentLead) queryParams.append('studentLead', filters.studentLead);

      const response = await fetch(`/api/dashboard/facultyMentor/completedStudents?${queryParams}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      setCompletedStudents(data.completedStudents || []);
      setVerifiedStudents(data.verifiedStudents || []);
      setFailedStudents(data.failedStudents || []);
      setAvailableFilters(data.filters || { slots: [], studentLeads: [] });
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const getGradeClass = (grade) => {
    switch (grade) {
      case 'A':
        return 'grade-a';
      case 'B':
        return 'grade-b';
      case 'C':
        return 'grade-c';
      case 'F':
        return 'grade-f';
      default:
        return '';
    }
  };

  const renderStudentTable = (students, type) => {
    if (students.length === 0) {
      return (
        <div className="no-students">
          <div className="no-students-message">
            <span>No {type} students found</span>
          </div>
        </div>
      );
    }

    return (
      <div className="table-container">
        <table className="completed-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Mode</th>
              <th>Slot</th>
              <th>Student Lead</th>
              {/* <th>Contact</th> */}
              {type === 'completed' && <th>Report</th>}
              {type === 'completed' && <th>Grade</th>}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.username}>
                <td>{student.name}</td>
                <td>{student.username}</td>
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
                {/* <td>
                  <div className="contact-info">
                    <a href={`mailto:${student.email}`} className="contact-link">
                      {student.email}
                    </a>
                    <a href={`tel:${student.phoneNumber}`} className="contact-link">
                      {student.phoneNumber}
                    </a>
                  </div>
                </td> */}
                {type === 'completed' && (
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
                )}
                {type === 'completed' && (
                  <td>
                    <span className={`grade-badge ${getGradeClass(student.grade)}`}>
                      {student.grade}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="completed-section">
        <div className="section-header">
          <h1>Students Status</h1>
        </div>
        <div className="loading">Loading students...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="completed-section">
        <div className="section-header">
          <h1>Students Status</h1>
        </div>
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="completed-section">
      <div className="section-header">
        <h1>Students Status</h1>
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="slot-filter">Filter by Slot:</label>
            <select
              id="slot-filter"
              value={filters.slot}
              onChange={(e) => handleFilterChange('slot', e.target.value)}
            >
              <option value="">All Slots</option>
              {availableFilters.slots.map(slot => (
                <option key={slot} value={slot}>Slot {slot}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="studentLead-filter">Filter by Student Lead:</label>
            <select
              id="studentLead-filter"
              value={filters.studentLead}
              onChange={(e) => handleFilterChange('studentLead', e.target.value)}
            >
              <option value="">All Student Leads</option>
              {availableFilters.studentLeads.map(lead => (
                <option key={lead.username} value={lead.username}>
                  {lead.name} ({lead.username})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="status-sections">
        <div className="status-section">
          <h2>Completed Students ({completedStudents.length})</h2>
          <p className="section-description">Students who have completed their internship and submitted final report</p>
          {renderStudentTable(completedStudents, 'completed')}
        </div>

        <div className="status-section">
          <h2>Verified Students ({verifiedStudents.length})</h2>
          <p className="section-description">Students who have been verified but haven't completed their final report</p>
          {renderStudentTable(verifiedStudents, 'verified')}
        </div>

        <div className="status-section">
          <h2>Failed Students ({failedStudents.length})</h2>
          <p className="section-description">Students who haven't submitted reports or haven't been verified</p>
          {renderStudentTable(failedStudents, 'failed')}
        </div>
      </div>
    </div>
  );
}
