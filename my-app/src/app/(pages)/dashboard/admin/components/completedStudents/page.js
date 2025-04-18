'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import './page.css';

export default function CompletedStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    domain: '',
    slot: '',
    mode: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalStudents: 0,
    limit: 20
  });

  useEffect(() => {
    const fetchCompletedStudents = async () => {
      try {
        setError(null);
        const queryParams = new URLSearchParams({
          page: pagination.currentPage,
          limit: pagination.limit,
          ...(filters.domain && { domain: filters.domain }),
          ...(filters.slot && { slot: filters.slot }),
          ...(filters.mode && { mode: filters.mode })
        });

        const response = await fetch(`/api/dashboard/admin/completedStudents?${queryParams}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch completed students');
        }

        const data = await response.json();
        if (data.success) {
          setStudents(data.data.students);
          setPagination(data.data.pagination);
        } else {
          throw new Error(data.error || 'Failed to fetch completed students');
        }
      } catch (err) {
        console.error('Error fetching completed students:', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedStudents();
  }, [filters, pagination.currentPage, pagination.limit]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
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
        <h2>Completed Students</h2>
        <div className="total-students">
          Total Completed Students: {pagination.totalStudents}
        </div>
      </div>

      <div className="filters">
        <select 
          value={filters.domain}
          onChange={(e) => handleFilterChange('domain', e.target.value)}
        >
          <option value="">All Domains</option>
          <option value="Web Development">Web Development</option>
          <option value="App Development">App Development</option>
          <option value="AI/ML">AI/ML</option>
          <option value="Blockchain">Blockchain</option>
        </select>

        <select
          value={filters.slot}
          onChange={(e) => handleFilterChange('slot', e.target.value)}
        >
          <option value="">All Slots</option>
          <option value="1">Slot 1</option>
          <option value="2">Slot 2</option>
          <option value="3">Slot 3</option>
          <option value="4">Slot 4</option>
        </select>

        <select
          value={filters.mode}
          onChange={(e) => handleFilterChange('mode', e.target.value)}
        >
          <option value="">All Modes</option>
          <option value="Remote">Remote</option>
          <option value="Incampus">In Campus</option>
        </select>
      </div>

      <div className="table-container">
        {students.length === 0 ? (
          <div className="no-students-message">
            No students found with completed registration and verified final report.
          </div>
        ) : (
          <table className="students-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Domain</th>
                <th>Mode</th>
                <th>Slot</th>
                <th>Student Lead</th>
                <th>Faculty Mentor</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.username}>
                  <td>{student.name}</td>
                  <td>{student.username}</td>
                  <td>{student.selectedDomain}</td>
                  <td>{student.mode}</td>
                  <td>{student.slot}</td>
                  <td>{student.leadName || '-'}</td>
                  <td>{student.facultyName || '-'}</td>
                  <td>
                    <div className="student-details">
                      {student.finalReport ? (
                        <a href={student.finalReport} target="_blank" rel="noopener noreferrer">
                          View Final Report
                        </a>
                      ) : (
                        <span className="no-details">No final report</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination">
        <button 
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
        >
          Previous
        </button>
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <button 
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
