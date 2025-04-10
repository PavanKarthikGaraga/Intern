"use client";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import "./page.css";
import { useAuth } from '@/context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Loader from '@/app/components/loader/loader';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
    const [activeSection, setActiveSection] = useState('home');
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
    const [facultyAdmins, setFacultyAdmins] = useState([]);
    const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);

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
        fetchRegistrations();
        fetchStudentMentors();
        fetchMentorOverview();
        fetchFacultyAdmins();
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
        const activeStudents = registrations.filter(reg => (reg.daysCompleted || 0) < 8).length;
        const completedStudents = registrations.filter(reg => (reg.daysCompleted || 0) === 8).length;
        return { totalStudents, domains, studentsPerDomain, activeStudents, completedStudents };
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
            if (!selectedDomain) {
                toast.error('Please select a domain first');
                return;
            }

            const response = await fetch(
                `/api/dashboard/faculty/search-students?query=${query}&domain=${selectedDomain}`
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
        <div className="student-management">
            <h2>Student Management</h2>
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search by name, ID, or domain..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="search-input"
                />
                <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="domain-filter"
                >
                    <option value="all">All Domains</option>
                    {[...new Set(registrations.map(reg => reg.selectedDomain))].map(domain => (
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
                        {filteredRegistrations.map((reg) => (
                            <tr key={reg.idNumber}>
                                <td>{reg.idNumber}</td>
                                <td>{reg.name}</td>
                                <td>{reg.selectedDomain}</td>
                                <td>{reg.branch}</td>
                                <td>{reg.year}</td>
                                <td>{reg.daysCompleted || 0}/8</td>
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
                                        {reg.mentorName ? 'Modify Mentor' : 'Assign Mentor'}
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
            <div className="domain-stats">
                <div className="welcome-header">
                    <h2>Welcome, {user?.name || 'Faculty'}</h2>
                    <p className="welcome-subtitle">Here's an overview of your students' progress</p>
                </div>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Students</h3>
                        <p>{stats.totalStudents}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Active Students</h3>
                        <p>{stats.activeStudents}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Completed Students</h3>
                        <p>{stats.completedStudents}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Domains</h3>
                        <p>{stats.domains.length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Mentors</h3>
                        <p>{studentMentors.length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Completion Rate</h3>
                        <p>{((stats.completedStudents / stats.totalStudents) * 100).toFixed(1)}%</p>
                    </div>
                </div>

                <h3>Domain-wise Progress</h3>
                <div className="domain-breakdown">
                    {Object.entries(stats.studentsPerDomain).map(([domain, count]) => (
                        <div key={domain} className="domain-stat-card">
                            <h4>{domain}</h4>
                            <div className="domain-details">
                                <p>Total Students: {count}</p>
                                <p>Active Students: {
                                    registrations.filter(reg => 
                                        reg.selectedDomain === domain && 
                                        (reg.daysCompleted || 0) < 8
                                    ).length
                                }</p>
                                <p>Completed Students: {
                                    registrations.filter(reg => 
                                        reg.selectedDomain === domain && 
                                        (reg.daysCompleted || 0) === 8
                                    ).length
                                }</p>
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
        try {
            const response = await fetch('/api/dashboard/faculty/mentor-overview');
            if (!response.ok) throw new Error('Failed to fetch mentor overview');
            const data = await response.json();
            if (data.success) {
                setMentorOverview(data.mentors);
            }
        } catch (err) {
            console.error('Error fetching mentor overview:', err);
            toast.error('Failed to load mentor overview');
        }
    };

    const filteredMentors = mentorOverview?.filter(mentor => {
        if (!mentor) return false;
        const matchesSearch = mentor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            mentor.mentorId?.toString().includes(searchTerm.toLowerCase());
        const matchesDomain = selectedDomain === 'all' || mentor.domain === selectedDomain;
        return matchesSearch && matchesDomain;
    }) || [];

    const handleDeleteMentor = async (mentorId) => {
        if (!window.confirm('Are you sure you want to delete this mentor? This will demote them to a student role.')) {
            return;
        }

        try {
            const response = await fetch('/api/dashboard/faculty/delete-mentor', {
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
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
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
                                onClick={() => setShowMentorModal(true)}
                            >
                                Add New Mentor
                            </button>
                        </div>

                        <div className="mentor-cards">
                            {filteredMentors.map(mentor => (
                                <div key={`mentor-${mentor.mentorId}`} className="mentor-card">
                                    <div 
                                        className="mentor-card-header"
                                        onClick={() => setExpandedMentor(mentor.mentorId)}
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
                            ))}
                        </div>
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
                                            <span className="stat-value">{mentorOverview.find(m => m.mentorId === expandedMentor).stats.total}</span>
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
                                            onClick={() => setActiveTab('completed')}
                                        >
                                            Completed Students ({mentorOverview.find(m => m.mentorId === expandedMentor).students?.filter(s => s.daysCompleted === 8).length || 0})
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
                                                        ?.filter(s => s.daysCompleted < 8)
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
                                            {(!mentorOverview.find(m => m.mentorId === expandedMentor).students?.filter(s => s.daysCompleted < 8).length) && (
                                                <p className="no-students">No active students</p>
                                            )}
                        </div>
                                    ) : (
                                        <div className="student-table">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>ID</th>
                                                        <th>Domain</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {mentorOverview.find(m => m.mentorId === expandedMentor).students
                                                        ?.filter(s => s.daysCompleted === 8)
                                                        .map(student => (
                                                            <tr key={`student-${student.idNumber}`}>
                                                                <td>{student.name}</td>
                                                                <td>{student.idNumber}</td>
                                                                <td>{student.selectedDomain}</td>
                                                                <td>
                                                                    <span className="completed-status">Completed</span>
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
                                            {(!mentorOverview.find(m => m.mentorId === expandedMentor).students?.filter(s => s.daysCompleted === 8).length) && (
                                                <p className="no-students">No completed students</p>
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
            const response = await fetch('/api/dashboard/faculty/remove-mentor', {
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

    const fetchFacultyAdmins = async () => {
        setIsLoadingAdmins(true);
        try {
            const response = await fetch('/api/dashboard/faculty/admin');
            if (!response.ok) throw new Error('Failed to fetch faculty admins');
            const data = await response.json();
            if (data.success) {
                setFacultyAdmins(data.admins);
            }
        } catch (err) {
            console.error('Error fetching faculty admins:', err);
            toast.error('Failed to load faculty admins');
        } finally {
            setIsLoadingAdmins(false);
        }
    };

    const renderAddAdmin = () => {
        const handleSubmit = async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('/api/dashboard/faculty/admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newAdminData),
                });

                const data = await response.json();

                if (response.ok) {
                    toast.success('Admin added successfully');
                    setNewAdminData({
                        name: '',
                        idNumber: '',
                        password: ''
                    });
                    fetchFacultyAdmins();
                    setShowAdminModal(false);
                } else {
                    throw new Error(data.error || 'Failed to add admin');
                }
            } catch (error) {
                console.error('Error adding admin:', error);
                toast.error(error.message || 'Failed to add admin');
            }
        };

        return (
            <div className="add-admin-section">
                <div className="section-header">
                    <h2>Faculty Admins</h2>
                    <button 
                        className="add-admin-btn"
                        onClick={() => setShowAdminModal(true)}
                    >
                        Add New Admin
                    </button>
                </div>

                <div className="faculty-admins-list">
                    {isLoadingAdmins ? (
                        <div className="loading">Loading admins...</div>
                    ) : facultyAdmins.length > 0 ? (
                        <table className="admins-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>ID Number</th>
                                    <th>Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facultyAdmins.map(admin => (
                                    <tr key={admin.idNumber}>
                                        <td>{admin.name}</td>
                                        <td>{admin.idNumber}</td>
                                        <td>{admin.role}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-admins">No faculty admins found</p>
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

    if (!user) return <Loader />;
    if (loading) return <Loader />;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="faculty-dashboard">
            <Navbar title="Faculty Dashboard" user={user} />

            <div className="dashboard-content">
                {/* Sidebar */}
                <aside className="dashboard-sidebar">
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
                        <span className="item-label">Student Management</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'mentors' ? 'active' : ''}`}
                        onClick={() => setActiveSection('mentors')}
                    >
                        <span className="item-label">Mentor Overview</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'add-admin' ? 'active' : ''}`}
                        onClick={() => setActiveSection('add-admin')}
                    >
                        <span className="item-label">Add Admin</span>
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
                    {activeSection === 'home' ? renderDomainStats() : 
                     activeSection === 'students' ? renderStudentManagement() : 
                     activeSection === 'mentors' ? renderMentorOverview() :
                     activeSection === 'add-admin' ? renderAddAdmin() :
                     renderChangePassword()}
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