'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
// import Loader from '@/components/loader/loader';
import toast from 'react-hot-toast';
import './page.css';
import VerifyModal from './VerifyModal';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [domains, setDomains] = useState([]);
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
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch('/api/dashboard/admin/domains');
        if (!response.ok) {
          throw new Error('Failed to fetch domains');
        }
        const data = await response.json();
        if (data.success) {
          setDomains(data.domains);
        }
      } catch (error) {
        console.error('Error fetching domains:', error);
        toast.error('Failed to load domains');
      }
    };

    fetchDomains();
  }, []);

  const fetchStudents = async () => {
    try {
      setError(null);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.domain && { domain: filters.domain }),
        ...(filters.slot && { slot: filters.slot }),
        ...(filters.mode && { mode: filters.mode })
      });

      const response = await fetch(`/api/dashboard/admin/students?${queryParams}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      if (data.success) {
        setStudents(data.data.students);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filters, pagination.currentPage, pagination.limit]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const getUploadCount = (submissions) => {
    if (!submissions) return 0;
    let count = 0;
    for (let i = 1; i <= 7; i++) {
      if (submissions[`day${i}`]) {
        count++;
      }
    }
    return count;
  };

  const handleVerify = async (day, status) => {
    try {
      const response = await fetch('/api/dashboard/facultyMentor/students', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedStudent.username,
          day,
          verified: status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }


      setStudents(prevStudents => 
        prevStudents.map(student => {
          if (student.username === selectedStudent.username) {
            return {
              ...student,
              verified: {
                ...student.verified,
                [day]: status
              }
            };
          }
          return student;
        })
      );

      toast.success('Verification status updated successfully');
    } catch (err) {
      console.error('Error updating verification:', err);
      toast.error(err.message);
    }
  };

  if (loading) {
    // return <Loader />;
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="students-section">
      <div className="section-header">
        <h1>Students</h1>
        <div className="total-students">
          Total Students: {pagination.totalStudents}
        </div>
      </div>

      <div className="filters-container">
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="domain">Domain</label>
            <select
              id="domain"
              value={filters.domain}
              onChange={(e) => handleFilterChange('domain', e.target.value)}
            >
              <option value="">All Domains</option>
              {domains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="slot">Slot</label>
            <select
              id="slot"
              value={filters.slot}
              onChange={(e) => handleFilterChange('slot', e.target.value)}
            >
              <option value="">All Slots</option>
              <option value="1">Slot 1</option>
              <option value="2">Slot 2</option>
              <option value="3">Slot 3</option>
              <option value="4">Slot 4</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="mode">Mode</label>
            <select
              id="mode"
              value={filters.mode}
              onChange={(e) => handleFilterChange('mode', e.target.value)}
            >
              <option value="">All Modes</option>
              <option value="Remote">Remote</option>
              <option value="Incampus">In Campus</option>
            </select>
          </div>
        </div>
      </div>

      <div className="students-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Domain</th>
              <th>Mode</th>
              <th>Slot</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.username}>
                <td>{student.username}</td>
                <td>{student.name}</td>
                <td>{student.selectedDomain}</td>
                <td>{student.mode}</td>
                <td>{student.slot}</td>
                <td>
                  <span className={`status ${student.completed ? 'completed' : 'active'}`}>
                    {student.completed ? 'Completed' : 'Active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
        >
          Previous
        </button>
        <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
        <button
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages}
        >
          Next
        </button>
      </div>

      {selectedStudent && (
        <VerifyModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onVerify={handleVerify}
        />
      )}
    </div>
  );
}
