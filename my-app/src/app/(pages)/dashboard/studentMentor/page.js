"use client";
import { useState, useEffect } from "react";
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import "./page.css";

export default function StudentMentor() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [uploads, setUploads] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [studentAttendance, setStudentAttendance] = useState({});
    const [activeSection, setActiveSection] = useState('overview');
    

 
    useEffect(() => {
        if (!user?.idNumber) {
            setLoading(false);
            setError('Please log in to view your dashboard');
            return;
        }
        
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch assigned students
                const response = await fetch(`/api/dashboard/studentMentor/assigned-students?mentorId=${user.idNumber}`);
                if (!response.ok) throw new Error('Failed to fetch assigned students');
                const data = await response.json();
                if (data.success) {
                    setAssignedStudents(data.students);
                    
                    // Fetch attendance for each student
                    const attendancePromises = data.students.map(async (student) => {
                        const attendanceResponse = await fetch(`/api/dashboard/studentMentor/attendance?studentId=${student.idNumber}`);
                        if (attendanceResponse.ok) {
                            const attendanceData = await attendanceResponse.json();
                            if (attendanceData.success) {
                                return { studentId: student.idNumber, attendance: attendanceData.data };
                            }
                        }
                        return { studentId: student.idNumber, attendance: {} };
                    });

                    const attendanceResults = await Promise.all(attendancePromises);
                    const attendanceMap = attendanceResults.reduce((acc, { studentId, attendance }) => {
                        acc[studentId] = attendance;
                        return acc;
                    }, {});
                    setStudentAttendance(attendanceMap);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message || 'Failed to load dashboard data');
                toast.error(err.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const fetchUploads = async (studentId) => {
        try {
            const response = await fetch('/api/dashboard/studentMentor/uploads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId })
            });

            if (!response.ok) throw new Error('Failed to fetch uploads');
            const data = await response.json();
            if (data.success) {
                setUploads(data.uploads);
                setSelectedStudent(studentId);
            }
        } catch (err) {
            console.error('Error fetching uploads:', err);
            toast.error(err.message || 'Failed to fetch uploads');
        }
    };

    const markAttendance = async (studentId, dayNumber, status) => {
        try {
            const response = await fetch('/api/dashboard/studentMentor/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, dayNumber, status })
            });

            if (!response.ok) throw new Error('Failed to mark attendance');
            const data = await response.json();
            if (data.success) {
                toast.success('Attendance marked successfully');
                // Update local state
                setStudentAttendance(prev => ({
                    ...prev,
                    [studentId]: {
                        ...prev[studentId],
                        [`day${dayNumber}`]: status
                    }
                }));
            }
        } catch (err) {
            console.error('Error marking attendance:', err);
            toast.error(err.message || 'Failed to mark attendance');
        }
    };

    if (!user) {
        return <div className="error">Please log in to view your dashboard</div>;
    }

    if (loading) {
        return <div className="loading">Loading your dashboard...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="student-mentor-dashboard">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>Student Mentor Dashboard</h1>
                </div>
                <div className="header-right">
                    <div className="user-info">
                        <span>{user.name}</span>
                        <span className="user-id">ID: {user.idNumber}</span>
                    </div>
                    <button onClick={logout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </header>

            <div className="dashboard-content">
                <nav className="dashboard-sidebar">
                    <button
                        className={`sidebar-item ${activeSection === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveSection('overview')}
                    >
                        <span className="item-label">Overview</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'active-students' ? 'active' : ''}`}
                        onClick={() => setActiveSection('active-students')}
                    >
                        <span className="item-label">Active Students</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'completed-students' ? 'active' : ''}`}
                        onClick={() => setActiveSection('completed-students')}
                    >
                        <span className="item-label">Completed Students</span>
                    </button>
                </nav>

                <main className="dashboard-main">
                    {activeSection === 'overview' && (
                        <section className="overview-section">
                            <h2>Overview</h2>
                            <div className="stats-cards">
                                <div className="stat-card">
                                    <h3>Assigned Students</h3>
                                    <p>{assignedStudents.length}</p>
                                </div>
                                <div className="stat-card">
                                    <h3>Completed Students</h3>
                                    <p>
                                        {assignedStudents.filter(student => 
                                            Object.values(studentAttendance[student.idNumber] || {})
                                                .filter(status => status === 'P').length === 8
                                        ).length}
                                    </p>
                                </div>
                                <div className="stat-card">
                                    <h3>Completion Rate</h3>
                                    <p>
                                        {Math.round((assignedStudents.filter(student => 
                                            Object.values(studentAttendance[student.idNumber] || {})
                                                .filter(status => status === 'P').length === 8
                                        ).length / assignedStudents.length) * 100)}%
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeSection === 'active-students' && (
                        <section className="students-section">
                            <h2>Active Students</h2>
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
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignedStudents
                                            .filter(student => 
                                                Object.values(studentAttendance[student.idNumber] || {})
                                                    .filter(status => status === 'P').length < 8
                                            )
                                            .map((student) => (
                                                <tr key={student.idNumber}>
                                                    <td>{student.idNumber}</td>
                                                    <td>{student.name}</td>
                                                    <td>{student.selectedDomain}</td>
                                                    <td>{student.branch}</td>
                                                    <td>{student.year}</td>
                                                    <td>
                                                        {Object.values(studentAttendance[student.idNumber] || {})
                                                            .filter(status => status === 'P').length}/8
                                                    </td>
                                                    <td>
                                                        <button 
                                                            onClick={() => fetchUploads(student.idNumber)}
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
                        </section>
                    )}

                    {activeSection === 'completed-students' && (
                        <section className="completed-students-section">
                            <h2>Completed Students</h2>
                            <div className="students-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID Number</th>
                                            <th>Name</th>
                                            <th>Domain</th>
                                            <th>Branch</th>
                                            <th>Year</th>
                                            <th>Completion Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignedStudents
                                            .filter(student => 
                                                Object.values(studentAttendance[student.idNumber] || {})
                                                    .filter(status => status === 'P').length === 8
                                            )
                                            .map((student) => (
                                                <tr key={student.idNumber}>
                                                    <td>{student.idNumber}</td>
                                                    <td>{student.name}</td>
                                                    <td>{student.selectedDomain}</td>
                                                    <td>{student.branch}</td>
                                                    <td>{student.year}</td>
                                                    <td>
                                                        {new Date(student.completionDate || Date.now()).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </main>
            </div>

            <footer className="dashboard-footer">
                <p>© 2024 Internship Management System</p>
                <p>Developed by Karthik</p>
            </footer>

            {selectedStudent && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Student Uploads</h2>
                        <div className="students-table">
                            {uploads.length === 0 ? (
                                <p className="no-uploads">No uploads found for this student.</p>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Day</th>
                                            <th>Upload</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {uploads.map((upload) => (
                                            <tr key={upload.dayNumber}>
                                                <td>Day {upload.dayNumber}</td>
                                                <td>
                                                    <a href={upload.link} target="_blank" rel="noopener noreferrer">
                                                        View Upload
                                                    </a>
                                                </td>
                                                <td>
                                                    <div className="attendance-actions">
                                                        <button
                                                            onClick={() => markAttendance(selectedStudent, upload.dayNumber, 'P')}
                                                            className="mark-present-btn"
                                                        >
                                                            Mark Present
                                                        </button>
                                                        <button
                                                            onClick={() => markAttendance(selectedStudent, upload.dayNumber, 'A')}
                                                            className="mark-absent-btn"
                                                        >
                                                            Mark Absent
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <button className="close-modal-btn" onClick={() => setSelectedStudent(null)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}