'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import './page.css';
import VerifyModal from './VerifyModal';
import StudentProfile from '../studentProfile/page';
import { FaSearch, FaTrash, FaDownload, FaSync, FaEye, FaCheck, FaTimes, FaEdit } from 'react-icons/fa';

const SLOT_LABELS = {
  '1': 'Slot 1 — May 11–17',
  '2': 'Slot 2 — May 18–24',
  '3': 'Slot 3 — May 25–31',
  '4': 'Slot 4 — Jun 1–7',
  '5': 'Slot 5 — Jun 8–14',
  '6': 'Slot 6 — Jun 15–21',
  '7': 'Slot 7 — Jun 22–28',
  '8': 'Slot 8 — Jun 29–Jul 5',
  '9': 'Slot 9 — Jul 6–12',
};

const MODE_LABELS = {
  Remote: 'Remote',
  Incampus: 'In Campus',
  InVillage: 'In Village',
};

const MODE_COLORS = {
  Remote:    { bg: '#e3f2fd', color: '#1565c0' },
  Incampus:  { bg: '#e8f5e9', color: '#2e7d32' },
  InVillage: { bg: '#fff3e0', color: '#e65100' },
};

/* ── Inline-editable cell for Mode ── */
function ModeCell({ student, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(student.mode);
  const [saving, setSaving]   = useState(false);

  const handleSave = async () => {
    if (value === student.mode) { setEditing(false); return; }
    setSaving(true);
    const ok = await onSave(student.username, { mode: value });
    setSaving(false);
    if (ok) setEditing(false);
    else setValue(student.mode); // revert on failure
  };

  const handleCancel = () => { setValue(student.mode); setEditing(false); };

  if (editing) {
    return (
      <div className="inline-edit-wrap">
        <select
          className="inline-select"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
        >
          {Object.entries(MODE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          className="inline-btn confirm-btn"
          onClick={handleSave}
          disabled={saving}
          title="Save"
        >
          {saving ? <span className="mini-spinner" /> : <FaCheck />}
        </button>
        <button className="inline-btn cancel-btn" onClick={handleCancel} title="Cancel">
          ✕
        </button>
      </div>
    );
  }

  const style = MODE_COLORS[student.mode] || {};
  return (
    <div className="editable-cell" onClick={() => setEditing(true)} title="Click to edit">
      <span className="mode-badge" style={{ background: style.bg, color: style.color }}>
        {MODE_LABELS[student.mode] || student.mode}
      </span>
      <FaEdit className="edit-hint-icon" />
    </div>
  );
}

/* ── Inline-editable cell for Slot ── */
function SlotCell({ student, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(String(student.slot));
  const [saving, setSaving]   = useState(false);

  const handleSave = async () => {
    if (value === String(student.slot)) { setEditing(false); return; }
    setSaving(true);
    const ok = await onSave(student.username, { slot: value });
    setSaving(false);
    if (ok) setEditing(false);
    else setValue(String(student.slot));
  };

  const handleCancel = () => { setValue(String(student.slot)); setEditing(false); };

  if (editing) {
    return (
      <div className="inline-edit-wrap">
        <select
          className="inline-select slot-select"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
        >
          {Object.entries(SLOT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          className="inline-btn confirm-btn"
          onClick={handleSave}
          disabled={saving}
          title="Save"
        >
          {saving ? <span className="mini-spinner" /> : <FaCheck />}
        </button>
        <button className="inline-btn cancel-btn" onClick={handleCancel} title="Cancel">
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="editable-cell" onClick={() => setEditing(true)} title="Click to edit">
      <span className="slot-badge">Slot {student.slot}</span>
      <FaEdit className="edit-hint-icon" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */
export default function Students() {
  const [students, setStudents]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [isSearching, setIsSearching]     = useState(false);
  const [error, setError]                 = useState(null);
  const [domains, setDomains]             = useState([]);
  const [searchInput, setSearchInput]     = useState('');
  const [filters, setFilters] = useState({
    domain: '', slot: '', mode: '', search: '',
    gender: '', fieldOfInterest: '', accommodation: '', transportation: '',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1, totalPages: 1, totalItems: 0, limit: 30, pendingPage: null,
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const isInitialMount = useRef(true);

  /* ── Fetch domains ── */
  useEffect(() => {
    fetch('/api/dashboard/admin/domains')
      .then(r => r.json())
      .then(d => { if (d.success) setDomains(d.domains); })
      .catch(() => toast.error('Failed to load domains'));
  }, []);

  /* ── Fetch students ── */
  const fetchStudents = useCallback(async (isBackground = false) => {
    if (isBackground) setIsSearching(true);
    else setLoading(true);
    try {
      setError(null);
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.domain          && { domain:          filters.domain }),
        ...(filters.slot            && { slot:            filters.slot }),
        ...(filters.mode            && { mode:            filters.mode }),
        ...(filters.search          && { search:          filters.search }),
        ...(filters.gender          && { gender:          filters.gender }),
        ...(filters.fieldOfInterest && { fieldOfInterest: filters.fieldOfInterest }),
        ...(filters.accommodation   && { accommodation:   filters.accommodation }),
        ...(filters.transportation  && { transportation:  filters.transportation }),
      });
      const res = await fetch(`/api/dashboard/admin/students?${queryParams}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      if (data.success) {
        setStudents(data.data.students);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch students');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [
    filters.search, filters.domain, filters.slot, filters.mode,
    filters.gender, filters.fieldOfInterest, filters.accommodation,
    filters.transportation, pagination.currentPage, pagination.limit,
  ]);

  useEffect(() => {
    if (isInitialMount.current) { fetchStudents(false); isInitialMount.current = false; }
    else fetchStudents(true);
  }, [fetchStudents]);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 350);
    return () => clearTimeout(t);
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
    if (!isNaN(value)) setPagination(prev => ({ ...prev, pendingPage: value }));
  };

  const handlePageInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      const value = parseInt(e.target.value);
      if (!isNaN(value)) handlePageChange(value);
    }
  };

  /* ── Save Mode or Slot for a student ── */
  const handleUpdateStudent = async (username, updates) => {
    try {
      const res = await fetch('/api/dashboard/admin/students', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, ...updates }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Failed to update student');
        return false;
      }
      /* Optimistic update */
      setStudents(prev => prev.map(s =>
        s.username === username ? { ...s, ...updates } : s
      ));
      toast.success(`Updated ${username} — ${Object.entries(updates).map(([k,v]) => `${k}: ${v}`).join(', ')}`);
      return true;
    } catch {
      toast.error('Network error — could not update student');
      return false;
    }
  };

  const handleVerify = async (day, status) => {
    try {
      const res = await fetch('/api/dashboard/facultyMentor/students', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedStudent.username, day, verified: status }),
      });
      if (!res.ok) throw new Error('Failed to update verification status');
      setStudents(prev => prev.map(s =>
        s.username === selectedStudent.username
          ? { ...s, verified: { ...s.verified, [day]: status } }
          : s
      ));
      toast.success('Verification status updated successfully');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteStudent = async (username) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await fetch('/api/dashboard/admin/students', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error('Failed to delete student');
      const data = await res.json();
      if (data.success) {
        setStudents(prev => prev.filter(s => s.username !== username));
        toast.success('Student deleted successfully');
        fetchStudents(true);
      } else {
        throw new Error(data.error || 'Failed to delete student');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(filters.domain          && { domain:          filters.domain }),
        ...(filters.slot            && { slot:            filters.slot }),
        ...(filters.mode            && { mode:            filters.mode }),
        ...(filters.search          && { search:          filters.search }),
        ...(filters.gender          && { gender:          filters.gender }),
        ...(filters.fieldOfInterest && { fieldOfInterest: filters.fieldOfInterest }),
        ...(filters.accommodation   && { accommodation:   filters.accommodation }),
        ...(filters.transportation  && { transportation:  filters.transportation }),
      });
      const res = await fetch(`/api/dashboard/admin/students/download?${queryParams}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to download data');
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'students.xlsx';
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch {
      toast.error('Failed to download excel file');
    }
  };

  const getSerialNumber = (index) =>
    ((pagination.currentPage || 1) - 1) * (pagination.limit || 30) + index + 1;

  if (loading) return (
    <div className="students-section">
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading students…</p>
      </div>
    </div>
  );

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="students-section">
      {/* ── Header ── */}
      <div className="section-header">
        <div className="header-left">
          <h1>Students</h1>
          <div className="total-students-badge">
            {pagination.totalItems || 0} students
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

      {/* ── Filters ── */}
      <div className="filters-container">
        <div className="search-group">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              id="search"
              placeholder="Search by name, email, domain or field of interest…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              autoComplete="off"
            />
            {isSearching && <div className="search-loader" />}
          </div>
        </div>
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="domain">Domain</label>
            <select id="domain" value={filters.domain} onChange={e => handleFilterChange('domain', e.target.value)}>
              <option value="">All Domains</option>
              {domains.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="fieldOfInterest">Field of Interest</label>
            <select id="fieldOfInterest" value={filters.fieldOfInterest} onChange={e => handleFilterChange('fieldOfInterest', e.target.value)}>
              <option value="">All Fields</option>
              {[
                'Awareness Campaigns','Content Creation (YouTube / Reels)','Cover Song Production',
                'Dance','Documentary Making','Dramatics','Environmental Activities',
                'Leadership Activities','Literature','Painting','Photography','Public Speaking',
                'Rural Development','Short Film Making','Singing','Social Service / Volunteering',
                'Spirituality','Story Telling','Technical (Hardware)','Technical (Software)',
                'Video Editing','Yoga & Meditation',
              ].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="slot">Slot</label>
            <select id="slot" value={filters.slot} onChange={e => handleFilterChange('slot', e.target.value)}>
              <option value="">All Slots</option>
              {Object.entries(SLOT_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="mode">Mode</label>
            <select id="mode" value={filters.mode} onChange={e => handleFilterChange('mode', e.target.value)}>
              <option value="">All Modes</option>
              <option value="Remote">Remote</option>
              <option value="Incampus">In Campus</option>
              <option value="InVillage">In Village</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="gender">Gender</label>
            <select id="gender" value={filters.gender} onChange={e => handleFilterChange('gender', e.target.value)}>
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="accommodation">Accommodation</label>
            <select id="accommodation" value={filters.accommodation} onChange={e => handleFilterChange('accommodation', e.target.value)}>
              <option value="">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="transportation">Transportation</label>
            <select id="transportation" value={filters.transportation} onChange={e => handleFilterChange('transportation', e.target.value)}>
              <option value="">All</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Inline-edit hint ── */}
      <div className="inline-edit-notice">
        <FaEdit style={{ fontSize: 13 }} />
        <span>Click any <strong>Mode</strong> or <strong>Slot</strong> cell to edit it inline and sync to the database.</span>
      </div>

      {/* ── Table ── */}
      <div className="students-table">
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>ID</th>
              <th>Name</th>
              <th>Domain</th>
              <th>Field of Interest</th>
              <th>Mode <span className="editable-col-hint">✎</span></th>
              <th>Slot <span className="editable-col-hint">✎</span></th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  No students found.
                </td>
              </tr>
            ) : students.map((student, index) => (
              <tr key={student.username}>
                <td>{getSerialNumber(index)}</td>
                <td className="mono-id">{student.username}</td>
                <td>{student.name}</td>
                <td>{student.selectedDomain}</td>
                <td>{student.fieldOfInterest || 'N/A'}</td>
                <td>
                  <ModeCell student={student} onSave={handleUpdateStudent} />
                </td>
                <td>
                  <SlotCell student={student} onSave={handleUpdateStudent} />
                </td>
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

      {/* ── Pagination ── */}
      <div className="pagination">
        <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}>
          Previous
        </button>
        <div className="page-input-container">
          <input
            type="number" min="1" max={pagination.totalPages}
            value={pagination.pendingPage || pagination.currentPage}
            onChange={handlePageInput}
            onKeyPress={handlePageInputKeyPress}
            className="page-input"
          />
          <span>of {pagination.totalPages}</span>
        </div>
        <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}>
          Next
        </button>
      </div>

      {selectedStudent && (
        <VerifyModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onVerify={handleVerify} />
      )}
      {selectedProfile && (
        <StudentProfile isOpen={!!selectedProfile} onClose={() => setSelectedProfile(null)} username={selectedProfile} />
      )}
    </div>
  );
}
