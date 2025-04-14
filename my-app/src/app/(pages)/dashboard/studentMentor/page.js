"use client";
import { useState, useEffect } from "react";
import { useAuth } from '@/context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import "./page.css";
import Loader from '@/app/components/loader/loader';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function StudentMentor() {
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [uploads, setUploads] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [studentAttendance, setStudentAttendance] = useState({});
    const [activeSection, setActiveSection] = useState('active-students');
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
    const [completedStudents, setCompletedStudents] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
    const [showAvailableStudents, setShowAvailableStudents] = useState(false);
    const [isAddingStudent, setIsAddingStudent] = useState(false);
    const [isAssigningStudents, setIsAssigningStudents] = useState(false);

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
        fetchCompletedStudents();
    }, [user]);

    useEffect(() => {
        if (activeSection === 'completed-students') {
            fetchCompletedStudents();
        }
    }, [activeSection]);

    const fetchCompletedStudents = async () => {
        try {
            const response = await fetch(`/api/dashboard/studentMentor/completed-students?mentorId=${user.idNumber}`);
            const data = await response.json();
            if (data.success) {
                setCompletedStudents(data.completedStudents);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch completed students');
        }
    };

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
            // Find the upload for this day to get the document URL
            const upload = uploads.find(u => u.dayNumber === dayNumber);
            const documentUrl = upload ? upload.link : null;
            
            const response = await fetch('/api/dashboard/studentMentor/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentId, 
                    dayNumber, 
                    status,
                    documentUrl 
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                toast.error(data.error || 'Failed to mark attendance');
                return;
            }

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

    const handleMarkCompleted = async (studentId) => {
        try {
            const response = await fetch('/api/dashboard/studentMentor/mark-completed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId,
                    mentorId: user.idNumber
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Student marked as completed successfully');
                // Refresh both lists
                fetchCompletedStudents();
            } else {
                toast.error(data.error || 'Failed to mark student as completed');
            }
        } catch (err) {
            console.error('Error marking student as completed:', err);
            toast.error('Failed to mark student as completed');
        }
    };

    const assignStudents = async () => {
        setIsAssigningStudents(true);
        try {
            const response = await fetch('/api/dashboard/studentMentor/assign-student', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mentorId: user.idNumber
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Successfully assigned ${data.assignedStudents.length} students`);
                
                // Refresh the assigned students list
                const assignedResponse = await fetch('/api/dashboard/studentMentor/assigned-students', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        mentorId: user.idNumber
                    }),
                });
                
                if (assignedResponse.ok) {
                    const assignedData = await assignedResponse.json();
                    if (assignedData.success) {
                        setAssignedStudents(assignedData.students);
                        
                        // Also fetch attendance for the newly assigned students
                        const attendancePromises = assignedData.students.map(async (student) => {
                            const attendanceResponse = await fetch('/api/dashboard/studentMentor/attendance', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ studentId: student.idNumber })
                            });
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
                }
            } else {
                toast.error(data.error || 'Failed to assign students');
            }
        } catch (err) {
            console.error('Error assigning students:', err);
            toast.error('Failed to assign students');
        } finally {
            setIsAssigningStudents(false);
        }
    };

    if (!user) {
        return <Loader />;
    }

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="student-mentor-dashboard">
            <Navbar title="Student Mentor Dashboard" user={user} />

            <div className="dashboard-content">
                <aside className="dashboard-sidebar">
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
                    <button
                        className={`sidebar-item ${activeSection === 'change-password' ? 'active' : ''}`}
                        onClick={() => setActiveSection('change-password')}
                    >
                        <span className="item-label">Change Password</span>
                    </button>
                </aside>

                <main className="dashboard-main">
                    {activeSection === 'overview' && (
                        <section className="overview-section">
                            <h2>Overview</h2>
                            <div className="stats-cards">
                                <div className="stat-card">
                                    <h3>Total Students</h3>
                                    <p>{assignedStudents.length + completedStudents.length}</p>
                                </div>
                                <div className="stat-card">
                                    <h3>Active Students</h3>
                                    <p>{assignedStudents.length}</p>
                                </div>
                                <div className="stat-card">
                                    <h3>Completed Students</h3>
                                    <p>{completedStudents.length}</p>
                                </div>
                                <div className="stat-card">
                                    <h3>Completion Rate</h3>
                                    <p>
                                        {assignedStudents.length + completedStudents.length > 0 
                                            ? Math.round((completedStudents.length / (assignedStudents.length + completedStudents.length)) * 100)
                                            : 0}%
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeSection === 'active-students' && (
                        <section className="students-section">
                            <h2>Active Students</h2>
                            <div className="students-table">
                                <div className="table-header">
                                    <h3>Your Assigned Students</h3>
                                    {assignedStudents.length < 10 && (
                                        <button 
                                            className="add-student-btn"
                                            onClick={assignStudents}
                                            disabled={isAssigningStudents}
                                        >
                                            {isAssigningStudents ? 'Assigning Students...' : 'Assign New Students'}
                                        </button>
                                    )}
                                </div>
                                
                                {showAvailableStudents && (
                                    <div className="available-students-section">
                                        <h3>Available Students</h3>
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
                                                {availableStudents.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7">No available students found</td>
                                                    </tr>
                                                ) : (
                                                    availableStudents.map((student) => (
                                                        <tr key={student.idNumber}>
                                                            <td>{student.idNumber}</td>
                                                            <td>{student.name}</td>
                                                            <td>{student.selectedDomain}</td>
                                                            <td>{student.branch}</td>
                                                            <td>{student.year}</td>
                                                            <td>{student.daysCompleted || 0}/8</td>
                                                            <td>
                                                                <button 
                                                                    onClick={() => assignStudents()}
                                                                    className="add-student-btn"
                                                                    disabled={isAssigningStudents}
                                                                >
                                                                    {isAssigningStudents ? 'Assigning...' : 'Assign Student'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                        <button 
                                            className="close-btn"
                                            onClick={() => setShowAvailableStudents(false)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}
                                
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
                                        {assignedStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="7">No Students assigned</td>
                                            </tr>
                                        ) : (
                                            assignedStudents.map((student) => {
                                                const daysCompleted = Object.values(studentAttendance[student.idNumber] || {})
                                                    .filter(status => status === 'P').length;
                                                return (
                                                    <tr key={student.idNumber}>
                                                        <td>{student.idNumber}</td>
                                                        <td>{student.name}</td>
                                                        <td>{student.selectedDomain}</td>
                                                        <td>{student.branch}</td>
                                                        <td>{student.year}</td>
                                                        <td>{daysCompleted}/8</td>
                                                        <td className="btns">
                                                            <button 
                                                                onClick={() => fetchUploads(student.idNumber)}
                                                                className="view-uploads-btn"
                                                            >
                                                                View Progress
                                                            </button>
                                                            {daysCompleted === 8 && (
                                                                <button
                                                                    onClick={() => handleMarkCompleted(student.idNumber)}
                                                                    className="view-uploads-btn"
                                                                >
                                                                    Mark Completed
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
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
                                            <th>Completion Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {completedStudents.map((student) => (
                                            <tr key={student.idNumber}>
                                                <td>{student.idNumber}</td>
                                                <td>{student.name}</td>
                                                <td>{new Date(student.completionDate).toLocaleDateString()}</td>
                                                <td>
                                                    <button 
                                                        onClick={() => fetchUploads(student.idNumber)}
                                                        className="view-reports-btn"
                                                    >
                                                        View Reports
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeSection === 'change-password' && renderChangePassword()}
                </main>
            </div>

            <Footer />

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
                                            {!completedStudents.some(student => student.idNumber === selectedStudent) && (
                                                <th>Actions</th>
                                            )}
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
                                                {!completedStudents.some(student => student.idNumber === selectedStudent) && (
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
                                                )}
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