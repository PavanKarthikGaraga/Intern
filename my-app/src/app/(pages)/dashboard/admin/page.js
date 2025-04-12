"use client";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import "./page.css";
import { useAuth } from '@/context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Loader from '@/app/components/loader/loader';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Admin() {
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
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);
    const [showMentorModal, setShowMentorModal] = useState(false);
    const [selectedStudentForMentor, setSelectedStudentForMentor] = useState(null);
    const [studentMentors, setStudentMentors] = useState([]);
    const [showNewMentorForm, setShowNewMentorForm] = useState(false);
    const [newMentorData, setNewMentorData] = useState({
        idNumber: '',
        name: '',
        domain: ''
    });
    const [newAdminData, setNewAdminData] = useState({
        name: '',
        idNumber: '',
        password: ''
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
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedMentor, setExpandedMentor] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [admins, setAdmins] = useState([]);
    const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [completedStudents, setCompletedStudents] = useState([]);
    const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);
    const [activeStudents, setActiveStudents] = useState([]);
    const [isLoadingActive, setIsLoadingActive] = useState(false);
    const [completedCurrentPage, setCompletedCurrentPage] = useState(1);
    const [completedTotalPages, setCompletedTotalPages] = useState(1);
    const [mentorCurrentPage, setMentorCurrentPage] = useState(1);
    const [mentorTotalPages, setMentorTotalPages] = useState(1);
    const [isLoadingMentors, setIsLoadingMentors] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('home');
    const [mentorCompletedCurrentPage, setMentorCompletedCurrentPage] = useState(1);
    const [mentorCompletedTotalPages, setMentorCompletedTotalPages] = useState(1);
    const [dashboardStats, setDashboardStats] = useState({
        totalStudents: 0,
        domains: [],
        studentsPerDomain: {},
        activeStudents: 0,
        completedStudents: 0
    });
    const [isLoadingStats, setIsLoadingStats] = useState(false);

    const handleModalClose = () => {
        setSelectedStudent(null);
        setShowMentorModal(false);
        setSelectedStudentForMentor(null);
        setMentorSearchQuery('');
        setSearchedStudents([]);
        setUploads([]);
        setStudentAttendance({});
        if (!selectedStudentForMentor) {
            setSelectedDomain('all');
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchStudentMentors(),
                    fetchAdmins()
                ]);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeSection === 'students') {
            fetchActiveStudents();
        } else if (activeSection === 'completed-students') {
            fetchCompletedStudents();
        } else if (activeSection === 'mentors') {
            fetchMentorOverview();
        }
    }, [currentPage, searchQuery, activeSection]);

    // Reset expanded mentor when navigating away from mentors section
    useEffect(() => {
        if (activeSection !== 'mentors') {
            setExpandedMentor(null);
        }
    }, [activeSection]);

    useEffect(() => {
        if (registrations && registrations.length > 0) {
            setFilteredRegistrations(
                selectedDomain === 'all'
                    ? registrations
                    : registrations.filter(reg => reg.selectedDomain === selectedDomain)
            );
        }
    }, [selectedDomain, registrations]);

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/dashboard/admin/active-students?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`
            );
            const data = await response.json();
            if (data.success) {
                setRegistrations(data.registrations || []);
                setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
            }
        } catch (error) {
            console.error('Error fetching registrations:', error);
            setRegistrations([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentMentors = async () => {
        try {
            const response = await fetch('/api/dashboard/admin/student-mentors');
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
            const response = await fetch(`/api/dashboard/admin/attendance?studentId=${studentId}`);
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
                fetch(`/api/dashboard/admin/uploads?studentId=${studentId}`, {
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
            const response = await fetch('/api/dashboard/admin/attendance', {
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

    const getStats = async () => {
        setIsLoadingStats(true);
        try {
            const response = await fetch('/api/dashboard/admin/stats', {
                credentials: 'include'
            });
            if (!response.ok) {
                if (response.status === 401) {
                    toast.error('Session expired. Please login again');
                    return null;
                }
                throw new Error('Failed to fetch stats');
            }
            const data = await response.json();
            if (data.success) {
                return {
                    totalStudents: data.totalStudents || 0,
                    domains: data.domains || [],
                    studentsPerDomain: data.studentsPerDomain || {},
                    activeStudents: data.activeStudents || 0,
                    completedStudents: data.completedStudents || 0
                };
            }
            throw new Error(data.error || 'Failed to fetch stats');
        } catch (err) {
            console.error('Error fetching stats:', err);
            toast.error('Failed to load dashboard stats');
            return null;
        } finally {
            setIsLoadingStats(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            const stats = await getStats();
            if (stats) {
                setDashboardStats(stats);
            }
        };

        if (activeSection === 'home') {
            fetchStats();
        }
    }, [activeSection]);

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
                        {!activeSection == 'completed-students' && <>
                            <th>Actions</th>
                            <th>Status</th>
                        </>}
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
                                {!activeSection == 'completed-students' && <>
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
                                </>}
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

            const response = await fetch('/api/dashboard/admin/assign-mentor', {
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
            if (!selectedDomain) {
                toast.error('Please select a domain first');
                return;
            }

            const response = await fetch(
                `/api/dashboard/admin/search-students?query=${query}&domain=${selectedDomain}`
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
            const response = await fetch('/api/dashboard/admin/create-mentor', {
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

    const fetchActiveStudents = async () => {
        setIsLoadingActive(true);
        try {
            const response = await fetch(
                `/api/dashboard/admin/active-students?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`
            );
            if (!response.ok) throw new Error('Failed to fetch active students');
            const data = await response.json();
            if (data.success) {
                setActiveStudents(data.students || []);
                setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
            }
        } catch (err) {
            console.error('Error fetching active students:', err);
            toast.error('Failed to load active students');
            setActiveStudents([]);
        } finally {
            setIsLoadingActive(false);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const renderPagination = (totalPages, currentPage, onPageChange = handlePageChange) => {
        if (totalPages <= 1) return null;

        return (
            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <span className="page-info">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </div>
        );
    };

    const renderStudentManagement = () => (
        <section className="students-section">
            <h2>Active Students</h2>
            <div className="search-pagination-controls">
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search by name, ID, or domain..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className="domain-filter"
                    >
                        <option value="all">All Domains</option>
                        {[...new Set(activeStudents.map(student => student.selectedDomain))].map(domain => (
                            <option key={domain} value={domain}>{domain}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="students-table">
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
                        {isLoadingActive ? (
                            <tr>
                                <td colSpan="8" className="loading">Loading...</td>
                            </tr>
                        ) : activeStudents.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="no-students">No active students found</td>
                            </tr>
                        ) : (
                            activeStudents
                                .filter(student => selectedDomain === 'all' || student.selectedDomain === selectedDomain)
                                .map((student) => (
                                    <tr key={student.idNumber}>
                                        <td>{student.idNumber}</td>
                                        <td>{student.name}</td>
                                        <td>{student.selectedDomain}</td>
                                        <td>{student.branch}</td>
                                        <td>{student.year}</td>
                                        <td>{student.daysCompleted || 0}/8</td>
                                        <td>{student.mentorName || 'Not Assigned'}</td>
                                        <td>
                                            <button
                                                onClick={() => {
                                                    setSelectedStudent(student.idNumber);
                                                    fetchAttendance(student.idNumber);
                                                }}
                                                className="view-attendance-btn"
                                            >
                                                View Attendance
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedStudentForMentor(student);
                                                    setShowMentorModal(true);
                                                    setMentorSearchQuery('');
                                                    setSearchedStudents([]);
                                                }}
                                                className="assign-mentor-btn"
                                            >
                                                {student.mentorName ? 'Modify Mentor' : 'Assign Mentor'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStudent(student.idNumber)}
                                                className="delete-student-btn"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                        )}
                    </tbody>
                </table>
            </div>
            {renderPagination(totalPages, currentPage)}
        </section>
    );

    const renderDomainStats = () => {
        if (isLoadingStats) {
            return (
                <div className="domain-stats">
                    <div className="welcome-header">
                        <h2>Welcome, {user?.name || 'admin'}</h2>
                        <p className="welcome-subtitle">Loading statistics...</p>
                    </div>
                    <div className="stats-grid">
                        {[...Array(6)].map((_, index) => (
                            <div key={index} className="stat-card loading">
                                <h3>Loading...</h3>
                                <p>...</p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="domain-stats">
                <div className="welcome-header">
                    <h2>Welcome, {user?.name || 'admin'}</h2>
                    <p className="welcome-subtitle">Here's an overview of your students' progress</p>
                </div>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Students</h3>
                        <p>{dashboardStats.totalStudents}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Active Students</h3>
                        <p>{dashboardStats.activeStudents}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Completed Students</h3>
                        <p>{dashboardStats.completedStudents}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Domains</h3>
                        <p>{dashboardStats.domains.length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Mentors</h3>
                        <p>{studentMentors.length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Completion Rate</h3>
                        <p>{((dashboardStats.completedStudents / dashboardStats.totalStudents) * 100 || 0).toFixed(1)}%</p>
                    </div>
                </div>

                <h3>Domain-wise Progress</h3>
                <div className="domain-breakdown">
                    {Object.entries(dashboardStats.studentsPerDomain).map(([domain, stats]) => (
                        <div key={domain} className="domain-stat-card">
                            <h4>{domain}</h4>
                            <div className="domain-details">
                                <p>Total Students: {stats.total || 0}</p>
                                <p>Active Students: {stats.active || 0}</p>
                                <p>Completed Students: {stats.completed || 0}</p>
                                <p>Assigned Mentors: {
                                    studentMentors.filter(mentor =>
                                        mentor.domain === domain
                                    ).length
                                }</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMentorModal = () => {
        // If we're assigning a mentor to a student
        if (selectedStudentForMentor) {
            return (
                <>
                    <h3>{selectedStudentForMentor.mentorName ? 'Modify Student Mentor' : 'Assign Student Mentor'}</h3>
                    <div className="student-domain-info">
                        <p>Student: <strong>{selectedStudentForMentor.name}</strong></p>
                        <p>Domain: <strong>{selectedStudentForMentor.selectedDomain}</strong></p>
                        {selectedStudentForMentor.mentorName && (
                            <p>Current Mentor: <strong>{selectedStudentForMentor.mentorName}</strong></p>
                        )}
                    </div>

                    {selectedStudentForMentor.mentorName ? (
                        <div className="remove-mentor-section">
                            <p>To assign a new mentor, first remove the current mentor.</p>
                            <button
                                onClick={() => handleRemoveMentor(selectedStudentForMentor.idNumber)}
                                className="remove-mentor-btn"
                            >
                                Remove Current Mentor
                            </button>
                        </div>
                    ) : (
                        <div className="mentor-search-section">
                            <h4>Available Mentors</h4>
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder="Search mentors by name or ID..."
                                    value={mentorSearchQuery}
                                    onChange={(e) => setMentorSearchQuery(e.target.value)}
                                    className="search-input"
                                />
                            </div>

                            <div className="mentor-list">
                                {studentMentors
                                    .filter(mentor =>
                                        mentor.domain === selectedStudentForMentor.selectedDomain &&
                                        (mentorSearchQuery === '' ||
                                            mentor.name.toLowerCase().includes(mentorSearchQuery.toLowerCase()) ||
                                            mentor.mentorId.toString().includes(mentorSearchQuery))
                                    )
                                    .map((mentor) => (
                                        <div key={`mentor-${mentor.mentorId}`} className="mentor-item">
                                            <div className="mentor-info">
                                                <span className="mentor-name">{mentor.name}</span>
                                                <span className="mentor-id">ID: {mentor.mentorId}</span>
                                                <span className="mentor-domain">{mentor.domain}</span>
                                            </div>
                                            <button
                                                onClick={() => handleAssignMentor(selectedStudentForMentor.idNumber, mentor.mentorId)}
                                                className="assign-btn"
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    ))}
                                {studentMentors.filter(mentor => mentor.domain === selectedStudentForMentor.selectedDomain).length === 0 && (
                                    <p className="no-mentors">No mentors available for this domain</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="modal-footer">
                        <button
                            onClick={handleModalClose}
                            className="close-modal-btn"
                        >
                            Close
                        </button>
                    </div>
                </>
            );
        }

        // If we're creating a new mentor
        return (
            <>
                <h3>Create New Mentor</h3>
                <div className="mentor-search-section">
                    <div className="domain-selection">
                        <label htmlFor="mentorDomain">Select Domain</label>
                        <select
                            id="mentorDomain"
                            value={selectedDomain}
                            onChange={(e) => {
                                setSelectedDomain(e.target.value);
                                setSearchedStudents([]);
                                setMentorSearchQuery('');
                            }}
                            className="domain-select"
                        >
                            <option value="all">Select a domain</option>
                            {[...new Set(registrations.map(reg => reg.selectedDomain))].map(domain => (
                                <option key={domain} value={domain}>{domain}</option>
                            ))}
                        </select>
                    </div>

                    {selectedDomain !== 'all' && (
                        <div className="create-mentor-section">
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder="Search students by name or ID..."
                                    value={mentorSearchQuery}
                                    onChange={(e) => {
                                        setMentorSearchQuery(e.target.value);
                                        if (e.target.value) {
                                            searchPotentialMentors(e.target.value);
                                        } else {
                                            setSearchedStudents([]);
                                        }
                                    }}
                                    className="search-input"
                                />
                            </div>

                            {searchedStudents.length > 0 && (
                                <div className="search-results">
                                    {searchedStudents.map((student) => (
                                        <div key={`student-${student.idNumber}`} className="student-result">
                                            <div className="student-info">
                                                <span className="student-name">{student.name}</span>
                                                <span className="student-id">{student.idNumber}</span>
                                                <span className="student-domain">{student.selectedDomain}</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    createNewMentor({
                                                        idNumber: student.idNumber,
                                                        name: student.name,
                                                        domain: student.selectedDomain
                                                    });
                                                    setMentorSearchQuery('');
                                                    setSearchedStudents([]);
                                                    setShowMentorModal(false);
                                                }}
                                                className="create-btn"
                                            >
                                                Create Mentor
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchedStudents.length === 0 && mentorSearchQuery && (
                                <p className="no-results">No students found matching your search</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        onClick={handleModalClose}
                        className="close-modal-btn"
                    >
                        Close
                    </button>
                </div>
            </>
        );
    };

    const fetchMentorOverview = async () => {
        setIsLoadingMentors(true);
        try {
            const response = await fetch(
                `/api/dashboard/admin/mentor-overview?page=${mentorCurrentPage}&limit=${itemsPerPage}&search=${searchQuery}`
            );
            if (!response.ok) throw new Error('Failed to fetch mentor overview');
            const data = await response.json();
            if (data.success) {
                setMentorOverview(data.mentors || []);
                setMentorTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
            }
        } catch (err) {
            console.error('Error fetching mentor overview:', err);
            toast.error('Failed to load mentor overview');
            setMentorOverview([]);
        } finally {
            setIsLoadingMentors(false);
        }
    };

    useEffect(() => {
        if (activeSection === 'mentors') {
            fetchMentorOverview();
        }
    }, [mentorCurrentPage, searchQuery, activeSection]);

    const handleMentorPageChange = (newPage) => {
        setMentorCurrentPage(newPage);
    };

    const handleMentorSelect = (mentorId) => {
        setExpandedMentor(mentorId);
        fetchCompletedStudentsForMentor(mentorId);
    };

    const handleDeleteMentor = async (mentorId) => {
        if (!window.confirm('Are you sure you want to delete this mentor? This will demote them to a student role.')) {
            return;
        }

        try {
            const response = await fetch('/api/dashboard/admin/delete-mentor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mentorId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete mentor');
            }

            const data = await response.json();
            if (data.success) {
                toast.success('Mentor deleted successfully and demoted to student role');
                setExpandedMentor(null); // Close the mentor profile
                fetchMentorOverview(); // Refresh the mentor list
            }
        } catch (err) {
            console.error('Error deleting mentor:', err);
            toast.error(err.message || 'Failed to delete mentor');
        }
    };

    const renderMentorOverview = () => {
        const uniqueDomains = [...new Set(mentorOverview?.map(mentor => mentor?.domain).filter(Boolean))];
        
        // Add filtering logic for mentors
        const filteredMentors = mentorOverview?.filter(mentor => {
            if (!mentor) return false;
            const matchesSearch = mentor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                mentor.mentorId?.toString().includes(searchQuery.toLowerCase());
            const matchesDomain = selectedDomain === 'all' || mentor.domain === selectedDomain;
            return matchesSearch && matchesDomain;
        }) || [];

        return (
            <div className="mentor-overview">
                {!expandedMentor ? (
                    <>
                        <div className="mentor-filters">
                            <div className="filters-left">
                                <div className="search-box">
                                    <input
                                        type="text"
                                        placeholder="Search mentors..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="domain-filter">
                                    <select
                                        value={selectedDomain}
                                        onChange={(e) => setSelectedDomain(e.target.value)}
                                    >
                                        <option value="all">All Domains</option>
                                        {uniqueDomains.map(domain => (
                                            <option key={`domain-${domain}`} value={domain}>{domain}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                className="add-mentor-btn"
                                onClick={handleOpenMentorModal}
                            >
                                Add New Mentor
                            </button>
                        </div>

                        <div className="mentor-cards">
                            {isLoadingMentors ? (
                                <div className="loading">Loading mentors...</div>
                            ) : mentorOverview.length === 0 ? (
                                <div className="no-mentors">No mentors found</div>
                            ) : (
                                filteredMentors.map(mentor => (
                                    <div key={`mentor-${mentor.mentorId}`} className="mentor-card">
                                        <div
                                            className="mentor-card-header"
                                            onClick={() => handleMentorSelect(mentor.mentorId)}
                                        >
                                            <div className="mentor-info">
                                                <h3>{mentor.name}</h3>
                                                <p>ID: {mentor.mentorId}</p>
                                                <p>Domain: {mentor.domain}</p>
                                            </div>
                                            <div className="expand-icon">
                                                ▶
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {renderPagination(mentorTotalPages, mentorCurrentPage, handleMentorPageChange)}
                    </>
                ) : (
                    <div className="mentor-profile-main">
                        {mentorOverview?.find(m => m.mentorId === expandedMentor) && (
                            <>
                                <div className="mentor-profile-header">
                                    <div className="mentor-basic-info">
                                        <h2>{mentorOverview.find(m => m.mentorId === expandedMentor).name}</h2>
                                        <p>ID: {mentorOverview.find(m => m.mentorId === expandedMentor).mentorId}</p>
                                        <p>Domain: {mentorOverview.find(m => m.mentorId === expandedMentor).domain}</p>
                                    </div>
                                    <div className="mentor-stats">
                                        <div className="stat-item">
                                            <span className="stat-label">Total Students:</span>
                                            <span className="stat-value">{mentorOverview.find(m => m.mentorId === expandedMentor).stats.total }</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Active Students:</span>
                                            <span className="stat-value">{mentorOverview.find(m => m.mentorId === expandedMentor).stats.active}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Completed Students:</span>
                                            <span className="stat-value">{mentorOverview.find(m => m.mentorId === expandedMentor).stats.completed}</span>
                                        </div>
                                    </div>
                                    <div className="mentor-actions">
                                        <button
                                            className="back-btn"
                                            onClick={() => setExpandedMentor(null)}
                                        >
                                            Back to List
                                        </button>
                                        <button
                                            className="delete-mentor-btn"
                                            onClick={() => handleDeleteMentor(expandedMentor)}
                                        >
                                            Delete Mentor
                                        </button>
                                    </div>
                                </div>

                                <div className="mentor-students">
                                    <div className="students-tabs">
                                        <button
                                            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('active')}
                                        >
                                            Active Students ({mentorOverview.find(m => m.mentorId === expandedMentor).students?.filter(s => s.daysCompleted < 8).length || 0})
                                        </button>
                                        <button
                                            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                                            onClick={() => {
                                                setActiveTab('completed');
                                                handleTabClick('completed');
                                            }}
                                        >
                                            Completed Students(
                                                {mentorOverview.find(m => m.mentorId === expandedMentor).stats.completed})
                                        </button>
                                    </div>

                                    {activeTab === 'active' ? (
                                        <div className="student-table">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>ID</th>
                                                        <th>Domain</th>
                                                        <th>Progress</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {mentorOverview.find(m => m.mentorId === expandedMentor).students
                                                        .map(student => (
                                                            <tr key={`student-${student.idNumber}`}>
                                                                <td>{student.name}</td>
                                                                <td>{student.idNumber}</td>
                                                                <td>{student.selectedDomain}</td>
                                                                <td>
                                                                    <div className="progress-bar">
                                                                        <div
                                                                            className="progress-fill"
                                                                            style={{
                                                                                width: `${(student.daysCompleted / 8) * 100}%`,
                                                                                backgroundColor: '#66bb6a'
                                                                            }}
                                                                        />
                                                                        <span className="progress-text">
                                                                            {student.daysCompleted}/8 days
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        className="view-progress-btn"
                                                                        onClick={() => fetchUploads(student.idNumber)}
                                                                    >
                                                                        View Progress
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                            {/* {(!mentorOverview.find(m => m.mentorId === expandedMentor).students?.filter(s => s.daysCompleted < 8).length) && (
                                                <p className="no-students">No active students</p>
                                            )} */}
                                        </div>
                                    ) : (
                                        <div className="tab-content student-table">
                                            {isLoadingCompleted ? (
                                                <div className="loading">Loading completed students...</div>
                                            ) : completedStudents.length === 0 ? (
                                                <div className="no-data">No completed students found</div>
                                            ) : (
                                                <>
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>Name</th>
                                                                <th>ID</th>
                                                                <th>Domain</th>
                                                                <th>Completion Date</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {completedStudents.map(student => (
                                                                <tr key={student.idNumber}>
                                                                    <td>{student.name}</td>
                                                                    <td>{student.idNumber}</td>
                                                                    <td>{student.selectedDomain}</td>
                                                                    <td>{new Date(student.completionDate).toLocaleDateString()}</td>
                                                                    <td>
                                                                        <button
                                                                            onClick={() => fetchUploads(student.idNumber)}
                                                                            className="view-progress-btn"
                                                                        >
                                                                            View Reports
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {renderPagination(mentorCompletedTotalPages, mentorCompletedCurrentPage, handleMentorCompletedPageChange)}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

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

    const handleRemoveMentor = async (studentId) => {
        try {
            const response = await fetch('/api/dashboard/admin/remove-mentor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ studentId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove mentor');
            }

            const data = await response.json();
            if (data.success) {
                toast.success('Mentor removed successfully');
                fetchRegistrations();
                fetchStudentMentors();
                handleModalClose();
            }
        } catch (err) {
            console.error('Error removing mentor:', err);
            toast.error(err.message || 'Failed to remove mentor');
        }
    };

    const fetchAdmins = async (retryCount = 0) => {
        setIsLoadingAdmins(true);
        try {
            const response = await fetch('/api/dashboard/admin/admin', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                toast.error('Session expired. Please login again');
                return;
            }

            if (response.status === 403) {
                toast.error('You do not have permission to view admins');
                return;
            }

            if (!response.ok) {
                if (retryCount < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return fetchAdmins(retryCount + 1);
                }
                throw new Error(`Failed to fetch admins: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setAdmins(data.admins);
            } else {
                throw new Error(data.error || 'Failed to fetch admins');
            }
        } catch (err) {
            console.error('Error fetching admins:', err);
            toast.error(err.message || 'Failed to load admins');
        } finally {
            setIsLoadingAdmins(false);
        }
    };

    const handleDeleteAdmin = async (idNumber) => {
        if (!window.confirm('Are you sure you want to remove this admin? This will revoke their admin privileges.')) {
            return;
        }

        try {
            const response = await fetch('/api/dashboard/admin/admin/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ idNumber })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove admin');
            }

            toast.success('Admin removed successfully');
            fetchAdmins(); // Refresh the admin list
        } catch (err) {
            console.error('Error removing admin:', err);
            toast.error(err.message || 'Failed to remove admin');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/dashboard/admin/admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(newAdminData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create admin');
            }

            const data = await response.json();
            if (data.success) {
                toast.success('Admin created successfully');
                setShowAdminModal(false);
                setNewAdminData({
                    name: '',
                    idNumber: '',
                    password: ''
                });
                fetchAdmins(); // Refresh the admin list
            }
        } catch (err) {
            console.error('Error creating admin:', err);
            toast.error(err.message || 'Failed to create admin');
        }
    };

    const renderAdminList = () => {
        return (
            <div className="admin-section">
                <div className="section-header">
                    <h2>Admins</h2>
                    <button
                        className="add-admin-btn"
                        onClick={() => setShowAdminModal(true)}
                    >
                        Add New Admin
                    </button>
                </div>

                <div className="admins-list">
                    {isLoadingAdmins ? (
                        <div className="loading">Loading admins...</div>
                    ) : admins.length > 0 ? (
                        <table className="admins-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>ID Number</th>
                                    {/* <th>Role</th> */}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map(admin => (
                                    <tr key={admin.idNumber}>
                                        <td>{admin.name}</td>
                                        <td>{admin.idNumber}</td>
                                        {/* <td>{admin.role}</td> */}
                                        <td>
                                            <button
                                                className="delete-admin-btn"
                                                onClick={() => handleDeleteAdmin(admin.idNumber)}
                                            >
                                                Remove Admin
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-admins">No admins found</p>
                    )}
                </div>

                {showAdminModal && (
                    <div className="modal-overlay" onClick={() => setShowAdminModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>Add New Admin</h3>
                            <form onSubmit={handleSubmit} className="admin-form">
                                <div className="form-group">
                                    <label htmlFor="name">Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={newAdminData.name}
                                        onChange={(e) => setNewAdminData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        placeholder="Enter admin name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="idNumber">ID Number</label>
                                    <input
                                        type="text"
                                        id="idNumber"
                                        value={newAdminData.idNumber}
                                        onChange={(e) => setNewAdminData(prev => ({ ...prev, idNumber: e.target.value }))}
                                        required
                                        placeholder="Enter admin ID number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={newAdminData.password}
                                        onChange={(e) => setNewAdminData(prev => ({ ...prev, password: e.target.value }))}
                                        required
                                        placeholder="Enter admin password"
                                    />
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="cancel-btn"
                                        onClick={() => setShowAdminModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="submit-btn">Add Admin</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const fetchCompletedStudents = async () => {
        setIsLoadingCompleted(true);
        try {
            const response = await fetch(
                `/api/dashboard/admin/completed-students?page=${completedCurrentPage}&limit=${itemsPerPage}&search=${searchQuery}`
            );
            if (!response.ok) throw new Error('Failed to fetch completed students');
            const data = await response.json();
            if (data.success) {
                setCompletedStudents(data.completedStudents || []);
                console.log("completedStudents",completedStudents);
                setCompletedTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
            }
        } catch (err) {
            console.error('Error fetching completed students:', err);
            toast.error('Failed to load completed students');
            setCompletedStudents([]);
        } finally {
            setIsLoadingCompleted(false);
        }
    };

    useEffect(() => {
        if (activeSection === 'completed-students') {
            fetchCompletedStudents();
        }
    }, [completedCurrentPage, searchQuery, activeSection]);

    const handleCompletedPageChange = (newPage) => {
        setCompletedCurrentPage(newPage);
        // Reset to first page when changing pages
        setCurrentPage(1);
    };

    const renderCompletedStudents = () => (
        <section className="completed-students-section">
            <div className="section-header">
                <h2>Completed Students</h2>
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search completed students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className="domain-filter"
                    >
                        <option value="all">All Domains</option>
                        {[...new Set(completedStudents.map(student => student.selectedDomain))].map(domain => (
                            <option key={domain} value={domain}>{domain}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID Number</th>
                            <th>Name</th>
                            <th>Domain</th>
                            <th>Mentor</th>
                            <th>Completion Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoadingCompleted ? (
                            <tr>
                                <td colSpan="6" className="loading">Loading...</td>
                            </tr>
                        ) : completedStudents.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="no-students">No completed students found</td>
                            </tr>
                        ) : (
                            completedStudents
                                .filter(student => selectedDomain === 'all' || student.selectedDomain === selectedDomain)
                                .map((student) => (
                                    <tr key={student.idNumber}>
                                        <td>{student.idNumber}</td>
                                        <td>{student.name}</td>
                                        <td>{student.selectedDomain}</td>
                                        <td>{student.mentorName || 'Not Assigned'}</td>
                                        <td>{new Date(student.completionDate).toLocaleDateString()}</td>
                                        <td>
                                            <button 
                                                className="view-progress-btn"
                                                onClick={() => {
                                                    setSelectedStudent(student.idNumber);
                                                    fetchUploads(student.idNumber);
                                                }}
                                            >
                                                View Reports
                                            </button>
                                        </td>
                                    </tr>
                                ))
                        )}
                    </tbody>
                </table>
            </div>
            {renderPagination(completedTotalPages, completedCurrentPage, handleCompletedPageChange)}
        </section>
    );

    const fetchCompletedStudentsForMentor = async (mentorId, pageNumber = mentorCompletedCurrentPage) => {
        if (!mentorId) {
            console.error('No mentor ID provided');
            toast.error('Please select a mentor first');
            return;
        }

        setIsLoadingCompleted(true);
        try {
            const response = await fetch(
                `/api/dashboard/admin/completed-students?mentorId=${mentorId}&page=${pageNumber}&limit=${itemsPerPage}`, 
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch completed students');
            }

            const data = await response.json();
            if (data.success) {
                setCompletedStudents(data.completedStudents || []);
                setMentorCompletedTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
                setMentorCompletedCurrentPage(pageNumber); // Update the current page after successful fetch
                
                // Update the mentor overview with the completed students count
                if (mentorOverview) {
                    const updatedMentorOverview = mentorOverview.map(mentor => {
                        if (mentor.mentorId === mentorId) {
                            const activeStudentsCount = mentor.students?.filter(s => s.daysCompleted < 8).length || 0;
                            const completedStudentsCount = data.total || 0;
                            return {
                                ...mentor,
                                stats: {
                                    ...mentor.stats,
                                    completed: completedStudentsCount,
                                    total: activeStudentsCount + completedStudentsCount,
                                    active: activeStudentsCount
                                }
                            };
                        }
                        return mentor;
                    });
                    setMentorOverview(updatedMentorOverview);
                }
            } else {
                throw new Error(data.error || 'Failed to fetch completed students');
            }
        } catch (err) {
            console.error('Error fetching completed students:', err);
            toast.error(err.message || 'Failed to load completed students');
            setCompletedStudents([]);
        } finally {
            setIsLoadingCompleted(false);
        }
    };

    const handleMentorCompletedPageChange = (newPage) => {
        // Ensure the new page is within valid bounds
        if (newPage < 1) newPage = 1;
        if (newPage > mentorCompletedTotalPages) newPage = mentorCompletedTotalPages;
        
        // Only update if the page is actually changing
        if (newPage !== mentorCompletedCurrentPage && expandedMentor) {
            fetchCompletedStudentsForMentor(expandedMentor, newPage);
        }
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        if (tab === 'completed' && expandedMentor) {
            setMentorCompletedCurrentPage(1); // Reset to first page when switching to completed tab
            fetchCompletedStudentsForMentor(expandedMentor);
        }
    };

    const fetchAllRegistrations = async () => {
        try {
            const response = await fetch('/api/dashboard/admin/active-students?limit=1000');
            const data = await response.json();
            if (data.success) {
                setRegistrations(data.students || []);
                console.log("Fetched domains:", [...new Set(data.students.map(student => student.selectedDomain))]);
            }
        } catch (error) {
            console.error('Error fetching all registrations:', error);
            toast.error('Failed to fetch domains');
        }
    };

    const handleOpenMentorModal = async () => {
        setShowMentorModal(true);
        await fetchAllRegistrations();
    };

    const handleDeleteStudent = async (studentId) => {
        if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/dashboard/admin/delete-student', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ studentId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete student');
            }

            const data = await response.json();
            if (data.success) {
                toast.success('Student deleted successfully');
                fetchRegistrations(); // Refresh the list
            }
        } catch (err) {
            console.error('Error deleting student:', err);
            toast.error(err.message || 'Failed to delete student');
        }
    };

    if (!user) return <Loader />;
    if (loading) return <Loader />;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="admin-dashboard">
            <Navbar title="Admin Dashboard" user={user} />

            <div className="dashboard-content">
                <nav className="dashboard-sidebar">
                    <button
                        className={`sidebar-item ${activeSection === 'home' ? 'active' : ''}`}
                        onClick={() => setActiveSection('home')}
                    >
                        <span className="item-label">Home</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'students' ? 'active' : ''}`}
                        onClick={() => setActiveSection('students')}
                    >
                        <span className="item-label">Students</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'completed-students' ? 'active' : ''}`}
                        onClick={() => setActiveSection('completed-students')}
                    >
                        <span className="item-label">Completed Students</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'mentors' ? 'active' : ''}`}
                        onClick={() => setActiveSection('mentors')}
                    >
                        <span className="item-label">Mentors</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'admins' ? 'active' : ''}`}
                        onClick={() => setActiveSection('admins')}
                    >
                        <span className="item-label">Admins</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'change-password' ? 'active' : ''}`}
                        onClick={() => setActiveSection('change-password')}
                    >
                        <span className="item-label">Change Password</span>
                    </button>
                </nav>

                <main className="dashboard-main">
                    {activeSection === 'home' ? (
                        <>
                            {renderDomainStats()}
                            {/* {renderStudentManagement()} */}
                        </>
                    ) : activeSection === 'students' ? (
                        renderStudentManagement()
                    ) : activeSection === 'completed-students' ? (
                        renderCompletedStudents()
                    ) : activeSection === 'mentors' ? (
                        renderMentorOverview()
                    ) : activeSection === 'admins' ? (
                        renderAdminList()
                    ) : (
                        renderChangePassword()
                    )}
                </main>
            </div>

            <Footer />

            {/* Modals */}
            {(selectedStudent || showMentorModal) && (
                <div className="modal-overlay" onClick={handleModalClose}>
                    {selectedStudent && (
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            {renderAttendanceModal()}
                        </div>
                    )}
                    {showMentorModal && (
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            {renderMentorModal()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}