"use client";
import { useState, useEffect } from "react";
import { toast } from 'react-hot-toast';
import Loader from '@/app/components/loader/loader';

export default function Students() {
    const [activeStudents, setActiveStudents] = useState([]);
    const [isLoadingActive, setIsLoadingActive] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [uploads, setUploads] = useState([]);
    const [studentAttendance, setStudentAttendance] = useState({});
    const [showMentorModal, setShowMentorModal] = useState(false);
    const [selectedStudentForMentor, setSelectedStudentForMentor] = useState(null);
    const [studentMentors, setStudentMentors] = useState([]);
    const [mentorSearchQuery, setMentorSearchQuery] = useState('');
    const [searchedStudents, setSearchedStudents] = useState([]);
    const [domains, setDomains] = useState([]);

    useEffect(() => {
        fetchActiveStudents();
        fetchStudentMentors();
        fetchDomains();
    }, [currentPage, searchQuery, selectedDomain]);

    const fetchActiveStudents = async () => {
        setIsLoadingActive(true);
        try {
            const response = await fetch(
                `/api/dashboard/admin/active-students?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`
            );
            const data = await response.json();

            if (!data.success) {
                toast.error(data.error || 'Failed to fetch active students');
                setActiveStudents([]);
                return;
            }

            setActiveStudents(data.students || []);
            setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
        } catch (err) {
            console.error('Error fetching active students:', err);
            toast.error('Failed to load active students. Please try again later.');
            setActiveStudents([]);
        } finally {
            setIsLoadingActive(false);
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
            setUploads([]);
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

            await fetchAttendance(studentId);
            toast.success('Attendance marked successfully');
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to mark attendance');
        }
    };

    const handleAssignMentor = async (studentId, mentorId) => {
        try {
            if (!studentId || !mentorId) {
                toast.error('Student ID and Mentor ID are required');
                return;
            }

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
                fetchStudentMentors();
                fetchActiveStudents();
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
                fetchActiveStudents();
                fetchStudentMentors();
                setShowMentorModal(false);
            }
        } catch (err) {
            console.error('Error removing mentor:', err);
            toast.error(err.message || 'Failed to remove mentor');
        }
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
                fetchActiveStudents();
            }
        } catch (err) {
            console.error('Error deleting student:', err);
            toast.error(err.message || 'Failed to delete student');
        }
    };

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

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const fetchDomains = async () => {
        try {
            const response = await fetch('/api/dashboard/admin/domains');
            const data = await response.json();

            if (!data.success) {
                toast.error(data.error || 'Failed to fetch domains');
                return;
            }

            setDomains(data.domains || []);
        } catch (error) {
            console.error('Error fetching domains:', error);
            toast.error('Failed to load domains');
        }
    };

    if (isLoadingActive) {
        return <Loader />;
    }

    return (
        <div className="students-section">
            <div className="section-header">
                <h2>Active Students</h2>
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search students..."
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
                        {domains.map((domain) => (
                            <option key={domain} value={domain}>
                                {domain}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {activeStudents.length > 0 ? (
                <>
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
                                {activeStudents
                                    .filter(student => selectedDomain === 'all' || student.selectedDomain === selectedDomain)
                                    .map((student) => (
                                        <tr key={student.username}>
                                            <td>{student.username}</td>
                                            <td>{student.name}</td>
                                            <td>{student.selectedDomain}</td>
                                            <td>{student.branch}</td>
                                            <td>{student.year}</td>
                                            <td>{student.daysCompleted || 0}/8</td>
                                            <td>{student.mentorName || 'Not Assigned'}</td>
                                            <td>
                                                <button
                                                    onClick={() => {
                                                        setSelectedStudent(student.username);
                                                        fetchAttendance(student.username);
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
                                                    onClick={() => handleDeleteStudent(student.username)}
                                                    className="delete-student-btn"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-controls">
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span className="page-info">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </>
            ) : (
                <p className="no-students">No students found</p>
            )}

            {(selectedStudent || showMentorModal) && (
                <div className="modal-overlay" onClick={handleModalClose}>
                    {selectedStudent && (
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
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
                                            <tr key={`${upload.username}-${upload.dayNumber}`}>
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
                                <button className="close-modal-btn" onClick={handleModalClose}>
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                    {showMentorModal && (
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
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
                                        onClick={() => handleRemoveMentor(selectedStudentForMentor.username)}
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
                                                        onClick={() => handleAssignMentor(selectedStudentForMentor.username, mentor.mentorId)}
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
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 