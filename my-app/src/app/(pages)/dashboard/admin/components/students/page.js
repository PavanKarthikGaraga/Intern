'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
// import Loader from '@/components/loader/loader';
import toast from 'react-hot-toast';
import './page.css';
import VerifyModal from './VerifyModal';
import StudentProfile from '../studentProfile/page';
import { FaSearch, FaTrash, FaDownload, FaSync, FaEye } from 'react-icons/fa';

;

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [domains, setDomains] = useState([]);
  const [filters, setFilters] = useState({
    domain: '',
    slot: '',
    mode: '',
    search: '',
    pendingSearch: '',
    gender: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 30,
    pendingPage: null
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

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
    setLoading(true);
    try {
      setError(null);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.domain && { domain: filters.domain }),
        ...(filters.slot && { slot: filters.slot }),
        ...(filters.mode && { mode: filters.mode }),
        ...(filters.search && { search: filters.search }),
        ...(filters.gender && { gender: filters.gender })
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
  }, [filters.search, filters.domain, filters.slot, filters.mode, filters.gender, pagination.currentPage, pagination.limit]);

  const handleFilterChange = (field, value) => {
    if (field === 'search') {
      setFilters(prev => ({ ...prev, pendingSearch: value }));
    } else {
      setFilters(prev => ({ ...prev, [field]: value }));
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handlePageInput = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setPagination(prev => ({ ...prev, pendingPage: value }));
    }
  };

  const handlePageInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      const value = parseInt(e.target.value);
      if (!isNaN(value)) {
        handlePageChange(value);
      }
    }
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

  const handleSearch = () => {
    if (filters.pendingSearch !== filters.search) {
      setFilters(prev => ({ 
        ...prev, 
        search: prev.pendingSearch
      }));
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleDeleteStudent = async (username) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const response = await fetch('/api/dashboard/admin/students', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      const data = await response.json();
      if (data.success) {
        setStudents(prevStudents => prevStudents.filter(student => student.username !== username));
        toast.success('Student deleted successfully');
        // Refresh the total count
        fetchStudents();
      } else {
        throw new Error(data.error || 'Failed to delete student');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      toast.error(err.message);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await fetch('/api/dashboard/admin/students/download', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading excel:', err);
      toast.error('Failed to download excel file');
    }
  };

  const getSerialNumber = (index) => {
    const page = pagination.currentPage || 1;
    const limit = pagination.limit || 30;
    return ((page - 1) * limit) + index + 1;
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
        <div className="header-left">
          <h1>Students</h1>
          <div className="total-students">
            Total Students: {pagination.totalItems || 0}
          </div>
        </div>
        <div className="header-buttons">
          <button className="download-btn" onClick={fetchStudents}>
            <FaSync /> Refresh
          </button>
          <button className="download-btn" onClick={handleDownloadExcel}>
            <FaDownload /> Download Excel
          </button>
        </div>
      </div>

      <div className="filters-container">
        <div className="search-group">
          {/* <label htmlFor="search">Search Students</label> */}
          <input
            type="text"
            id="search"
            placeholder="Search by name or email..."
            value={filters.pendingSearch}
            onChange={(e) => setFilters(prev => ({ ...prev, pendingSearch: e.target.value }))}
            onKeyPress={handleSearchKeyPress}
          />
          <button className="search-button" onClick={handleSearch} aria-label="Search">
            <FaSearch />
          </button>
        </div>
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
              <option value="InVillage">In Village</option>
            </select>
            
          </div>
          <div className="filter-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      </div>

      <div className="students-table">
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>ID</th>
              <th>Name</th>
              <th>Domain</th>
              <th>Mode</th>
              <th>Slot</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.username}>
                <td>{getSerialNumber(index)}</td>
                <td>{student.username}</td>
                <td>{student.name}</td>
                <td>{student.selectedDomain}</td>
                <td>{student.mode}</td>
                <td>{student.slot}</td>
                <td>
                  <span className={`status-badge ${student.completed ? 'completed' : 'active'}`}>
                    {student.completed ? 'Completed' : 'Active'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="view-btn"
                      onClick={() => setSelectedProfile(student.username)}
                      aria-label="View student profile"
                    >
                      <FaEye />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteStudent(student.username)}
                      aria-label="Delete student"
                    >
                      <FaTrash />
                    </button>
                  </div>
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
        <div className="page-input-container">
          <input
            type="number"
            min="1"
            max={pagination.totalPages}
            value={pagination.pendingPage || pagination.currentPage}
            onChange={handlePageInput}
            onKeyPress={handlePageInputKeyPress}
            className="page-input"
          />
          <span>of {pagination.totalPages}</span>
        </div>
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

      {selectedProfile && (
        <StudentProfile
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          username={selectedProfile}
        />
      )}
    </div>
  );
}
