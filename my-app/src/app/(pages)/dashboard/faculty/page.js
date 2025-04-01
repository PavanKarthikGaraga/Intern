"use client";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import "./page.css";
import { useAuth } from '@/context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Loader from '@/app/components/loader/loader';

export default function Faculty() {
    const { user, logout } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [filteredRegistrations, setFilteredRegistrations] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [uploads, setUploads] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [studentAttendance, setStudentAttendance] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(20);
    const [activeSection, setActiveSection] = useState('students');
    const [showMentorModal, setShowMentorModal] = useState(false);
    const [selectedStudentForMentor, setSelectedStudentForMentor] = useState(null);
    const [studentMentors, setStudentMentors] = useState([]);
    const [showNewMentorForm, setShowNewMentorForm] = useState(false);
    const [newMentorData, setNewMentorData] = useState({
        idNumber: '',
        name: '',
        domain: ''
    });
    const [mentorSearchQuery, setMentorSearchQuery] = useState('');
    const [searchedStudents, setSearchedStudents] = useState([]);
    const [mentorOverview, setMentorOverview] = useState([]);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    useEffect(() => {
        fetchRegistrations();
        fetchStudentMentors();
        fetchMentorOverview();
    }, [currentPage, searchQuery]);

    useEffect(() => {
        if (registrations.length > 0) {
            setFilteredRegistrations(
                selectedDomain === 'all' 
                    ? registrations 
                    : registrations.filter(reg => reg.selectedDomain === selectedDomain)
            );
        }
    }, [selectedDomain, registrations]);

    const fetchRegistrations = async () => {
        try {
            const response = await fetch(
                `/api/dashboard/faculty?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setRegistrations(data.reports);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            setError('Failed to load registrations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentMentors = async () => {
        try {
            const response = await fetch('/api/dashboard/faculty/student-mentors');
            if (!response.ok) throw new Error('Failed to fetch student mentors');
            const data = await response.json();
            if (data.success) {
                setStudentMentors(data.mentors);
            }
        } catch (err) {
            console.error('Error fetching student mentors:', err);
            toast.error('Failed to load student mentors');
        }
    };

    const fetchAttendance = async (studentId) => {
        try {
            const response = await fetch(`/api/dashboard/faculty/attendance?studentId=${studentId}`);
            if (!response.ok) throw new Error('Failed to fetch attendance');
            const data = await response.json();
            if (data.success) {
                setStudentAttendance(data.data || {});
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch attendance');
        }
    };

    const fetchUploads = async (studentId) => {
        try {
            const [uploadsResponse] = await Promise.all([
                fetch(`/api/dashboard/faculty/uploads?studentId=${studentId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }),
                fetchAttendance(studentId)
            ]);
            
            if (!uploadsResponse.ok) throw new Error('Failed to fetch uploads');
            const data = await uploadsResponse.json();
            
            // Ensure uploads is always an array
            if (Array.isArray(data.uploads)) {
                setUploads(data.uploads);
            } else if (Array.isArray(data)) {
                setUploads(data);
            } else {
                setUploads([]);
                console.warn('Uploads data is not in expected format:', data);
            }
            
            setSelectedStudent(studentId);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch uploads');
            setUploads([]); // Set empty array on error
        }
    };

    const markAttendance = async (studentId, dayNumber, status) => {
        try {
            const response = await fetch('/api/dashboard/faculty/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    studentId, 
                    dayNumber, 
                    status 
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to mark attendance');
            }
            
            // Fetch updated attendance data immediately after marking
            await fetchAttendance(studentId);
            toast.success('Attendance marked successfully');
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to mark attendance');
        }
    };

    const getStats = () => {
        const totalStudents = registrations.length;
        const domains = [...new Set(registrations.map(reg => reg.selectedDomain))];
        const studentsPerDomain = domains.reduce((acc, domain) => {
            acc[domain] = registrations.filter(reg => reg.selectedDomain === domain).length;
            return acc;
        }, {});
        return { totalStudents, domains, studentsPerDomain };
    };

    const canMarkAttendance = (dayNumber) => {
        if (dayNumber === 1) return true;
        const prevDay = `day${dayNumber - 1}`;
        return !!studentAttendance[prevDay];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const renderAttendanceModal = () => (
        <>
            <h2>Student Attendance - {selectedStudent}</h2>
            <table className="attendance-table">
                <thead>
                    <tr>
                        <th>Day</th>
                        <th>Document</th>
                        <th>Uploaded On</th>
                        <th>Actions</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {uploads.map((upload) => {
                        const dayKey = `day${upload.dayNumber}`;
                        const currentStatus = studentAttendance[dayKey];
                        const canMark = canMarkAttendance(upload.dayNumber);
                        
                        return (
                            <tr key={`${upload.idNumber}-${upload.dayNumber}`}>
                                <td>Day {upload.dayNumber}</td>
                                <td>
                                    <a href={upload.link} target="_blank" rel="noopener noreferrer">
                                        View Document
                                    </a>
                                </td>
                                <td>{formatDate(upload.createdAt)}</td>
                                <td className="attendance-actions">
                                    <button 
                                        className={`attendance-btn present ${currentStatus === 'P' ? 'active' : ''}`}
                                        onClick={() => markAttendance(selectedStudent, upload.dayNumber, 'P')}
                                        disabled={!canMark}
                                        title={!canMark ? "Mark previous days first" : ""}
                                    >
                                        Present
                                    </button>
                                    <button 
                                        className={`attendance-btn absent ${currentStatus === 'A' ? 'active' : ''}`}
                                        onClick={() => markAttendance(selectedStudent, upload.dayNumber, 'A')}
                                        disabled={!canMark}
                                        title={!canMark ? "Mark previous days first" : ""}
                                    >
                                        Absent
                                    </button>
                                </td>
                                <td>
                                    {currentStatus || (canMark ? 'Not Marked' : 'Mark previous days first')}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="modal-footer">
                <button className="close-modal-btn" onClick={() => setSelectedStudent(null)}>
                    Close
                </button>
            </div>
        </>
    );

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleAssignMentor = async (studentId, mentorId) => {
        try {
            if (!studentId || !mentorId) {
                toast.error('Student ID and Mentor ID are required');
                return;
            }

            // Prevent self-assignment
            if (studentId === mentorId) {
                toast.error('A student cannot be assigned as their own mentor');
                return;
            }

            const response = await fetch('/api/dashboard/faculty/assign-mentor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, mentorId })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Student mentor assigned successfully');
                setShowMentorModal(false);
                fetchStudentMentors(); // Refresh the mentors list
                fetchRegistrations(); // Refresh the registrations list
            } else {
                if (data.error === 'Student is already assigned to a mentor') {
                    toast.error('This student already has a mentor assigned. Please unassign the current mentor first.');
                } else {
                    throw new Error(data.error || 'Failed to assign mentor');
                }
            }
        } catch (err) {
            console.error('Error assigning mentor:', err);
            toast.error(err.message || 'Failed to assign mentor');
        }
    };

    const searchPotentialMentors = async (query) => {
        try {
            if (!selectedStudentForMentor?.selectedDomain) {
                toast.error('Student domain not found');
                return;
            }

            const response = await fetch(
                `/api/dashboard/faculty/search-students?query=${query}&studentId=${selectedStudentForMentor.idNumber}&domain=${selectedStudentForMentor.selectedDomain}`
            );
            if (!response.ok) throw new Error('Failed to search students');
            const data = await response.json();
            setSearchedStudents(data.students);
        } catch (err) {
            console.error('Error searching students:', err);
            toast.error('Failed to search students');
        }
    };

    const createNewMentor = async (studentData) => {
        try {
            const response = await fetch('/api/dashboard/faculty/create-mentor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData)
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Student mentor created successfully');
                fetchStudentMentors(); // Refresh mentors list
                setShowNewMentorForm(false);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Error creating mentor:', err);
            toast.error(err.message || 'Failed to create mentor');
        }
    };

    const renderStudentManagement = () => (
        <div className="students-section">
            <div className="search-pagination-controls">
                <input
                    type="text"
                    placeholder="Search by name, ID, or domain..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="search-input"
                />
                
                <div className="pagination-controls">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            </div>

            <div className="registrations-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID Number</th>
                            <th>Name</th>
                            <th>Domain</th>
                            <th>Branch</th>
                            <th>Year</th>
                            <th>Days Completed</th>
                            <th>Student Mentor</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRegistrations.map((reg) => (
                            <tr key={reg.idNumber}>
                                <td>{reg.idNumber}</td>
                                <td>{reg.name}</td>
                                <td>{reg.selectedDomain}</td>
                                <td>{reg.branch}</td>
                                <td>{reg.year}</td>
                                <td>{reg.uploadsCount || 0}/8</td>
                                <td>{reg.mentorName || 'Not Assigned'}</td>
                                <td>
                                    <button 
                                        onClick={() => {
                                            setSelectedStudentForMentor(reg);
                                            setShowMentorModal(true);
                                            setSelectedStudent(null);
                                        }}
                                        className="assign-mentor-btn"
                                    >
                                        Assign Mentor
                                    </button>
                                    <button 
                                        onClick={() => {
                                            fetchUploads(reg.idNumber);
                                            setShowMentorModal(false);
                                        }}
                                        className="view-uploads-btn"
                                    >
                                        Mark Attendance
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderDomainStats = () => {
        const stats = getStats();
        return (
            <div className="domain-stats-section">
                <div className="stats-overview">
                    <div className="stat-card">
                        <h3>Total Students</h3>
                        <p>{stats.totalStudents}</p>
                    </div>
                    {Object.entries(stats.studentsPerDomain).map(([domain, count]) => (
                        <div key={domain} className="stat-card">
                            <h3>{domain}</h3>
                            <p>{count} students</p>
                        </div>
                    ))}
                </div>

                <div className="domain-filter">
                    <select 
                        value={selectedDomain} 
                        onChange={(e) => setSelectedDomain(e.target.value)}
                    >
                        <option value="all">All Domains</option>
                        {stats.domains.map(domain => (
                            <option key={domain} value={domain}>{domain}</option>
                        ))}
                    </select>
                </div>

                <div className="registrations-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ID Number</th>
                                <th>Name</th>
                                <th>Domain</th>
                                <th>Branch</th>
                                <th>Year</th>
                                <th>Days Completed</th>
                                <th>Student Mentor</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(activeSection === 'domains' ? filteredRegistrations : registrations).map((reg) => (
                                <tr key={reg.idNumber}>
                                    <td>{reg.idNumber}</td>
                                    <td>{reg.name}</td>
                                    <td>{reg.selectedDomain}</td>
                                    <td>{reg.branch}</td>
                                    <td>{reg.year}</td>
                                    <td>{reg.uploadsCount || 0}/8</td>
                                    <td>{reg.mentorName || 'Not Assigned'}</td>
                                    <td>
                                        <button 
                                            onClick={() => {
                                                setSelectedStudentForMentor(reg);
                                                setShowMentorModal(true);
                                                setSelectedStudent(null);
                                            }}
                                            className="assign-mentor-btn"
                                        >
                                            Assign Mentor
                                        </button>
                                        <button 
                                            onClick={() => {
                                                fetchUploads(reg.idNumber);
                                                setShowMentorModal(false);
                                            }}
                                            className="view-uploads-btn"
                                        >
                                            Mark Attendance
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderMentorModal = () => (
        <>
            <h3>Assign Student Mentor</h3>
            <p>Select a mentor for {selectedStudentForMentor?.name} (Domain: {selectedStudentForMentor?.selectedDomain})</p>

            <div className="mentor-search-section">
                <h4>Existing Mentors</h4>
                <div className="mentor-list">
                    {studentMentors
                        .filter(mentor => mentor.domain === selectedStudentForMentor?.selectedDomain)
                        .map((mentor) => (
                            <div key={mentor.mentorId} className="mentor-item">
                                <div className="mentor-info">
                                    <span className="mentor-name">{mentor.name}</span>
                                    <span className="mentor-domain">{mentor.domain}</span>
                                </div>
                                <button
                                    onClick={() => handleAssignMentor(selectedStudentForMentor?.idNumber, mentor.mentorId)}
                                    className="assign-btn"
                                >
                                    Assign
                                </button>
                            </div>
                        ))}
                </div>

                <div className="create-mentor-section">
                    <h4>Create New Mentor</h4>
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search students by name or ID..."
                            value={mentorSearchQuery}
                            onChange={(e) => {
                                setMentorSearchQuery(e.target.value);
                                searchPotentialMentors(e.target.value);
                            }}
                            className="search-input"
                        />
                    </div>

                    {searchedStudents.length > 0 && (
                        <div className="search-results">
                            {searchedStudents.map((student) => (
                                <div key={student.idNumber} className="student-result">
                                    <div className="student-info">
                                        <span>{student.name}</span>
                                        <span>{student.idNumber}</span>
                                        <span>{student.selectedDomain}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            handleAssignMentor(selectedStudentForMentor?.idNumber, student.idNumber);
                                            setMentorSearchQuery('');
                                            setSearchedStudents([]);
                                        }}
                                        className="select-btn"
                                    >
                                        Select
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="modal-footer">
                <button
                    onClick={() => setShowMentorModal(false)}
                    className="close-modal-btn"
                >
                    Close
                </button>
            </div>
        </>
    );

    const fetchMentorOverview = async () => {
        try {
            const response = await fetch('/api/dashboard/faculty/mentor-overview');
            if (!response.ok) throw new Error('Failed to fetch mentor overview');
            const data = await response.json();
            if (data.success) {
                setMentorOverview(data.mentors || []);
            }
        } catch (err) {
            console.error('Error fetching mentor overview:', err);
            toast.error('Failed to load mentor overview');
        }
    };

    const renderMentorOverview = () => (
        <div className="mentor-overview-section">
            <h2>Mentor Overview</h2>
            <div className="mentors-grid">
                {mentorOverview.map((mentor) => (
                    <div key={mentor.mentorId} className="mentor-card">
                        <div className="mentor-header">
                            <h3>{mentor.name}</h3>
                            <span className="mentor-id">ID: {mentor.mentorId}</span>
                            <span className="mentor-domain">Domain: {mentor.domain}</span>
                        </div>
                        <div className="students-list">
                            <h4>Assigned Students ({mentor.students?.length || 0})</h4>
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Progress</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mentor.students?.map((student) => (
                                        <tr key={student.idNumber}>
                                            <td>{student.idNumber}</td>
                                            <td>{student.name}</td>
                                            <td>
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ 
                                                            width: `${(student.daysCompleted / 8) * 100}%`,
                                                            backgroundColor: student.daysCompleted === 8 ? '#2e7d32' : '#66bb6a'
                                                        }}
                                                    />
                                                </div>
                                                <span className="progress-text">
                                                    {student.daysCompleted}/8 days
                                                </span>
                                            </td>
                                            <td>
                                                <button 
                                                    onClick={() => fetchUploads(student.idNumber)}
                                                    className="view-uploads-btn"
                                                >
                                                    View Progress
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setIsPasswordLoading(true);

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match');
            setIsPasswordLoading(false);
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters long');
            setIsPasswordLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Password changed successfully');
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                throw new Error(data.error || 'Failed to change password');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const renderChangePassword = () => (
        <div className="change-password-section">
            <div className="section-header">
                <h2>Change Password</h2>
            </div>
            <div className="change-password-form">
                <form onSubmit={handlePasswordChange}>
                    {passwordError && (
                        <div className="error-message">{passwordError}</div>
                    )}
                    
                    <div className="form-group">
                        <label htmlFor="currentPassword">Current Password</label>
                        <input
                            type={showPasswords.current ? "text" : "password"}
                            id="currentPassword"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({
                                ...passwordForm,
                                currentPassword: e.target.value
                            })}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('current')}
                            aria-label={showPasswords.current ? "Hide password" : "Show password"}
                        >
                            {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            type={showPasswords.new ? "text" : "password"}
                            id="newPassword"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({
                                ...passwordForm,
                                newPassword: e.target.value
                            })}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('new')}
                            aria-label={showPasswords.new ? "Hide password" : "Show password"}
                        >
                            {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input
                            type={showPasswords.confirm ? "text" : "password"}
                            id="confirmPassword"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({
                                ...passwordForm,
                                confirmPassword: e.target.value
                            })}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => togglePasswordVisibility('confirm')}
                            aria-label={showPasswords.confirm ? "Hide password" : "Show password"}
                        >
                            {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    <div className="button-group">
                        <button 
                            type="submit" 
                            className="submit-btn"
                            disabled={isPasswordLoading}
                        >
                            {isPasswordLoading ? 'Changing...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (!user) return <Loader />;
    if (loading) return <Loader />;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="faculty-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>Faculty Dashboard</h1>
                </div>
                <div className="header-right">
                    <div className="user-info">
                        <span>{user?.name}</span>
                        <span className="user-id">ID: {user?.idNumber}</span>
                    </div>
                    <button onClick={logout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </header>

            <div className="dashboard-content">
                {/* Sidebar */}
                <aside className="dashboard-sidebar">
                    <button
                        className={`sidebar-item ${activeSection === 'students' ? 'active' : ''}`}
                        onClick={() => setActiveSection('students')}
                    >
                        <span className="item-label">Student Management</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'domains' ? 'active' : ''}`}
                        onClick={() => setActiveSection('domains')}
                    >
                        <span className="item-label">Domain Statistics</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'mentors' ? 'active' : ''}`}
                        onClick={() => setActiveSection('mentors')}
                    >
                        <span className="item-label">Mentor Overview</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'change-password' ? 'active' : ''}`}
                        onClick={() => setActiveSection('change-password')}
                    >
                        <span className="item-label">Change Password</span>
                    </button>
                </aside>

                {/* Main Content */}
                <main className="dashboard-main">
                    {activeSection === 'students' ? renderStudentManagement() : 
                     activeSection === 'domains' ? renderDomainStats() : 
                     activeSection === 'mentors' ? renderMentorOverview() :
                     renderChangePassword()}
                </main>
            </div>

            {/* Footer */}
            <footer className="dashboard-footer">
                <p>© 2024 Smart Village Revolution. All Rights Reserved.</p>
                <p>Designed and Developed by ZeroOne CodeClub</p>
            </footer>

            {/* Modals */}
            {(selectedStudent || showMentorModal) && (
                <div className="modal-overlay">
                    {selectedStudent && (
                        <div className="modal-content">
                            {renderAttendanceModal()}
                        </div>
                    )}
                    {showMentorModal && (
                        <div className="modal-content">
                            {renderMentorModal()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}