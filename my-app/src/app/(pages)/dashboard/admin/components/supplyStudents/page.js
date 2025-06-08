'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import './page.css';
import { FaSearch, FaTrash, FaDownload, FaSync, FaEye } from 'react-icons/fa';
import VerifyModal from './VerifyModal';

export default function SupplyStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filters, setFilters] = useState({
    slot: '',
    mode: '',
    search: '',
    pendingSearch: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 30,
    pendingPage: null
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      setError(null);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.slot && { slot: filters.slot }),
        ...(filters.mode && { mode: filters.mode }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/dashboard/admin/supplyStudents?${queryParams}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch supply students');
      }

      const data = await response.json();
      if (data.success) {
        setStudents(data.data.students);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch supply students');
      }
    } catch (err) {
      console.error('Error fetching supply students:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [filters.search, filters.slot, filters.mode, pagination.currentPage, pagination.limit]);

  const handleFilterChange = (field, value) => {
    if (field === 'search') {
      setFilters(prev => ({ ...prev, pendingSearch: value }));
    } else {
      setFilters(prev => ({ ...prev, [field]: value }));
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: prev.pendingSearch }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
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
    if (e.key === 'Enter' && pagination.pendingPage) {
      handlePageChange(pagination.pendingPage);
    }
  };

  const getSerialNumber = (index) => {
    return (pagination.currentPage - 1) * pagination.limit + index + 1;
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await fetch('/api/dashboard/admin/supplyStudents/download', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download supply students data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'supply-students.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading supply students:', err);
      toast.error('Failed to download supply students data');
    }
  };

  if (loading) {
    return <div className="loading">Loading supply students...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="supply-students-section">
      <div className="section-header">
        <div className="header-left">
          <h1>Supply Students</h1>
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
              <th>S.No</th>
              <th>ID</th>
              <th>Name</th>
              <th>Mode</th>
              <th>Current Slot</th>
              <th>Previous Slot</th>
              <th>Previous Marks</th>
              <th>Actions</th>
              {/* <th>Status</th> */}
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.username}>
                <td>{getSerialNumber(index)}</td>
                <td>{student.username}</td>
                <td>{student.name}</td>
                <td>{student.mode}</td>
                <td>{student.slot}</td>
                <td>{student.previousSlot}</td>
                <td>{student.previousSlotMarks}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="verify-btn"
                      onClick={() => setSelectedStudent(student)}
                    >
                      Evaluate
                    </button>
                  </div>
                </td>
                {/* <td>
                  <span className={`status-badge ${student.completed ? 'completed' : 'active'}`}>
                    {student.completed ? 'Completed' : 'Active'}
                  </span>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedStudent && (
        <VerifyModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      <div className="pagination">
        <button
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1}
        >
          Previous
        </button>
        <div className="page-input">
          <input
            type="number"
            min="1"
            max={pagination.totalPages}
            value={pagination.pendingPage || pagination.currentPage}
            onChange={handlePageInput}
            onKeyPress={handlePageInputKeyPress}
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
    </div>
  );
} 