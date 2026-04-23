'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [domains, setDomains] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    domain: '',
    slot: '',
    mode: '',
    search: '',
    gender: '',
    fieldOfInterest: ''
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
  const isInitialMount = useRef(true);

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

  const fetchStudents = useCallback(async (isBackground = false) => {
    if (isBackground) setIsSearching(true);
    else setLoading(true);
    
    try {
      setError(null);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.domain && { domain: filters.domain }),
        ...(filters.slot && { slot: filters.slot }),
        ...(filters.mode && { mode: filters.mode }),
        ...(filters.search && { search: filters.search }),
        ...(filters.gender && { gender: filters.gender }),
        ...(filters.fieldOfInterest && { fieldOfInterest: filters.fieldOfInterest })
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
      setIsSearching(false);
    }
  }, [filters.search, filters.domain, filters.slot, filters.mode, filters.gender, filters.fieldOfInterest, pagination.currentPage, pagination.limit]);

  useEffect(() => {
    if (isInitialMount.current) {
      fetchStudents(false);
      isInitialMount.current = false;
    } else {
      fetchStudents(true);
    }
  }, [fetchStudents]);

  // Debounce: fire search 350 ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
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
        fetchStudents(true);
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
    return (
      <div className="students-section">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading students...</p>
        </div>
      </div>
    );
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
          <button className="download-btn" onClick={() => fetchStudents(true)}>
            <FaSync className={isSearching ? 'spinning' : ''} /> Refresh
          </button>
          <button className="download-btn" onClick={handleDownloadExcel}>
            <FaDownload /> Download Excel
          </button>
        </div>
      </div>

      <div className="filters-container">
        <div className="search-group">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              id="search"
              placeholder="Search by name, email, domain or field of interest..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoComplete="off"
            />
            {isSearching && <div className="search-loader"></div>}
          </div>
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
            <label htmlFor="fieldOfInterest">Field of Interest</label>
            <select
              id="fieldOfInterest"
              value={filters.fieldOfInterest}
              onChange={(e) => handleFilterChange('fieldOfInterest', e.target.value)}
            >
              <option value="">All Fields</option>
              <option value="Awareness Campaigns">Awareness Campaigns</option>
              <option value="Content Creation (YouTube / Reels)">Content Creation (YouTube / Reels)</option>
              <option value="Cover Song Production">Cover Song Production</option>
              <option value="Dance">Dance</option>
              <option value="Documentary Making">Documentary Making</option>
              <option value="Dramatics">Dramatics</option>
              <option value="Environmental Activities">Environmental Activities</option>
              <option value="Leadership Activities">Leadership Activities</option>
              <option value="Literature">Literature</option>
              <option value="Painting">Painting</option>
              <option value="Photography">Photography</option>
              <option value="Public Speaking">Public Speaking</option>
              <option value="Rural Development">Rural Development</option>
              <option value="Short Film Making">Short Film Making</option>
              <option value="Singing">Singing</option>
              <option value="Social Service / Volunteering">Social Service / Volunteering</option>
              <option value="Spirituality">Spirituality</option>
              <option value="Story Telling">Story Telling</option>
              <option value="Technical (Hardware)">Technical (Hardware)</option>
              <option value="Technical (Software)">Technical (Software)</option>
              <option value="Video Editing">Video Editing</option>
              <option value="Yoga &amp; Meditation">Yoga &amp; Meditation</option>
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
              <option value="1">Slot 1 — May 11–17</option>
              <option value="2">Slot 2 — May 18–24</option>
              <option value="3">Slot 3 — May 25–31</option>
              <option value="4">Slot 4 — Jun 1–7</option>
              <option value="5">Slot 5 — Jun 8–14</option>
              <option value="6">Slot 6 — Jun 15–21</option>
              <option value="7">Slot 7 — Jun 22–28</option>
              <option value="8">Slot 8 — Jun 29–Jul 5</option>
              <option value="9">Slot 9 — Jul 6–12</option>
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
              <th>Field of Interest</th>
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
                <td>{student.fieldOfInterest || 'N/A'}</td>
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
