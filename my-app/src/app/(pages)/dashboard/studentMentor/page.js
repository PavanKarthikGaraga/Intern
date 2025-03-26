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
                const response = await fetch(`/api/dashboard/student-mentor/assigned-students?mentorId=${user.idNumber}`);
                if (!response.ok) throw new Error('Failed to fetch assigned students');
                const data = await response.json();
                if (data.success) {
                    setAssignedStudents(data.students);
                    
                    // Fetch attendance for each student
                    const attendancePromises = data.students.map(async (student) => {
                        const attendanceResponse = await fetch(`/api/dashboard/student-mentor/attendance?studentId=${student.idNumber}`);
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
            const response = await fetch('/api/dashboard/student-mentor/uploads', {
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
            const response = await fetch('/api/dashboard/student-mentor/attendance', {
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

    const renderAttendanceModal = () => {
        if (!selectedStudent) return null;

        return (
            <div className="modal">
                <div className="modal-content">
                    <h2>Mark Attendance</h2>
                    <div className="uploads-table">
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button className="close-modal-btn" onClick={() => setSelectedStudent(null)}>
                        Close
                    </button>
                </div>
            </div>
        );
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
            <div className="mentor-intro">
                <div className="mentor-info">
                    <div className="mentor-header">
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
                        <h3>Assigned Students</h3>
                        <p>{assignedStudents.length}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Completed Students</h3>
                        <p>{assignedStudents.filter(student => 
                            Object.values(studentAttendance[student.idNumber] || {})
                                .filter(status => status === 'P').length === 8
                        ).length}</p>
                    </div>
                </div>
            </div>

            <div className="students-section">
                <h2>Your Assigned Students</h2>
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
                            {assignedStudents.map((student) => (
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
            </div>

            {renderAttendanceModal()}
        </div>
    );
}