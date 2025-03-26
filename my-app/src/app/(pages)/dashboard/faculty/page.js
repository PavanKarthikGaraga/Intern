"use client";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import "./page.css";
import { useAuth } from '@/context/AuthContext';

export default function Faculty() {
    const [registrations, setRegistrations] = useState([]);
    const [filteredRegistrations, setFilteredRegistrations] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [uploads, setUploads] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [studentAttendance, setStudentAttendance] = useState({});
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(20);
    const [studentMentors, setStudentMentors] = useState([]);
    const [showMentorModal, setShowMentorModal] = useState(false);
    const [selectedStudentForMentor, setSelectedStudentForMentor] = useState(null);
    const [mentorSearchQuery, setMentorSearchQuery] = useState('');
    const [searchedStudents, setSearchedStudents] = useState([]);
    const [showNewMentorForm, setShowNewMentorForm] = useState(false);
    const [newMentorData, setNewMentorData] = useState({
        idNumber: '',
        name: '',
        domain: ''
    });

    useEffect(() => {
        fetchRegistrations();
        fetchStudentMentors();
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
                fetch('/api/dashboard/faculty', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId })
                }),
                fetchAttendance(studentId)
            ]);
            
            if (!uploadsResponse.ok) throw new Error('Failed to fetch uploads');
            const data = await uploadsResponse.json();
            setUploads(data);
            setSelectedStudent(studentId);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch uploads');
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
        <div className="modal-content">
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
            <button className="close-modal-btn" onClick={() => setSelectedStudent(null)}>
                Close
            </button>
        </div>
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

            const response = await fetch('/api/dashboard/faculty/assign-mentor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, mentorId })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Student mentor assigned successfully');
                setShowMentorModal(false);
                fetchRegistrations(); // Refresh the list
            } else {
                throw new Error(data.error || 'Failed to assign mentor');
            }
        } catch (err) {
            console.error('Error assigning mentor:', err);
            toast.error(err.message || 'Failed to assign mentor');
        }
    };

    const searchPotentialMentors = async (query) => {
        try {
            const response = await fetch(`/api/dashboard/faculty/search-students?query=${query}`);
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

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="faculty-dashboard">
            <div className="faculty-intro">
                <div className="faculty-info">
                    <div className="faculty-header">
                        <div>
                            <h1>Welcome, {user.name}</h1>
                            <p>ID: {user.idNumber}</p>
                        </div>
                        <button onClick={logout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                </div>
                
                <div className="stats-cards">
                    <div className="stat-card">
                        <h3>Total Students</h3>
                        <p>{getStats().totalStudents}</p>
                    </div>
                    {Object.entries(getStats().studentsPerDomain).map(([domain, count]) => (
                        <div key={domain} className="stat-card">
                            <h3>{domain}</h3>
                            <p>{count} students</p>
                        </div>
                    ))}
                </div>

                <div className="filters">
                    <select 
                        value={selectedDomain} 
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className="domain-filter"
                    >
                        <option value="all">All Domains</option>
                        {getStats().domains.map(domain => (
                            <option key={domain} value={domain}>{domain}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="search-pagination-controls">
                <input
                    type="text"
                    placeholder="Search by name, ID, or domain..."
                    value={searchQuery}
                    onChange={handleSearch}
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
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Days Completed</th>
                            <th>Student Mentor</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(filteredRegistrations || []).map((reg) => (
                            <tr key={reg.idNumber}>
                                <td>{reg.idNumber}</td>
                                <td>{reg.name}</td>
                                <td>{reg.selectedDomain}</td>
                                <td>{reg.branch}</td>
                                <td>{reg.year}</td>
                                <td>{reg.email}</td>
                                <td>{reg.phoneNumber}</td>
                                <td>{reg.uploadsCount || 0}/8</td>
                                <td>{reg.mentorName || 'Not Assigned'}</td>
                                <td>
                                    <button 
                                        onClick={() => {
                                            setSelectedStudentForMentor(reg);
                                            setShowMentorModal(true);
                                        }}
                                        className="assign-mentor-btn"
                                    >
                                        Assign Mentor
                                    </button>
                                    <button 
                                        onClick={() => fetchUploads(reg.idNumber)}
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

            {showMentorModal && (
                <div className="mentor-modal">
                    <div className="modal-content">
                        <h3>Assign Student Mentor</h3>
                        <p>Select a mentor for {selectedStudentForMentor?.name}</p>

                        <div className="mentor-search-section">
                            <h4>Existing Mentors</h4>
                            <div className="mentor-list">
                                {studentMentors.map((mentor) => (
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
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setNewMentorData({
                                                            idNumber: student.idNumber,
                                                            name: student.name,
                                                            domain: ''
                                                        });
                                                        setShowNewMentorForm(true);
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

                        <button
                            onClick={() => setShowMentorModal(false)}
                            className="close-modal-btn"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {selectedStudent && (
                <div className="uploads-modal">
                    {renderAttendanceModal()}
                </div>
            )}
        </div>
    );
}