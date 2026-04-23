'use client';
import { useState, useEffect } from 'react';
import './page.css';

export default function FacultyProfile({ isOpen, onClose, username }) {
    const [facultyData, setFacultyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (username) {
            fetchFacultyData();
        }
    }, [username]);

    const fetchFacultyData = async () => {
        try {
            const response = await fetch(`/api/dashboard/admin/facultyProfile?username=${username}`);
            const data = await response.json();

            if (data.success) {
                setFacultyData(data.faculty);
            } else {
                setError(data.error || 'Failed to fetch faculty data');
            }
        } catch (err) {
            setError('An error occurred while fetching faculty data');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="modal-over">
                <div className="modal-con">
                    <div className="loading">Loading...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="modal-over">
                <div className="modal-con">
                    <div className="error-message">{error}</div>
                    <button className="close-button" onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-over">
            <div className="modal-con">
                <div className="modal-header">
                    <h2>Faculty Mentor Profile</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="profile-content">
                    <div className="profile-section">
                        <h3>Personal Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Name:</label>
                                <span>{facultyData?.name}</span>
                            </div>
                            <div className="info-item">
                                <label>Username:</label>
                                <span>{facultyData?.username}</span>
                            </div>
                            <div className="info-item">
                                <label>Email:</label>
                                <span>{facultyData?.email}</span>
                            </div>
                            <div className="info-item">
                                <label>Phone:</label>
                                <span>{facultyData?.phoneNumber}</span>
                            </div>
                            <div className="info-item">
                                <label>Branch:</label>
                                <span>{facultyData?.branch}</span>
                            </div>
                            <div className="info-item">
                                <label>Department:</label>
                                <span>{facultyData?.department}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h3>Statistics</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h4>Total Students</h4>
                                <p>{facultyData?.stats?.totalStudents || 0}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Total Leads</h4>
                                <p>{facultyData?.stats?.totalLeads || 0}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Completed Students</h4>
                                <p>{facultyData?.stats?.completedStudents || 0}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Active Students</h4>
                                <p>{facultyData?.stats?.activeStudents || 0}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Completion Rate</h4>
                                <p>{facultyData?.stats?.completionRate || 0}%</p>
                            </div>
                        </div>
                    </div>

                    {facultyData?.leads && facultyData.leads.length > 0 && (
                        <div className="profile-section">
                            <h3>Assigned Student Leads</h3>
                            <div className="leads-list">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Username</th>
                                            <th>Slot</th>
                                            <th>Total Students</th>
                                            <th>Completed</th>
                                            <th>Active</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {facultyData.leads.map(lead => (
                                            <tr key={lead.username}>
                                                <td>{lead.name}</td>
                                                <td>{lead.username}</td>
                                                <td>Slot {lead.slot}</td>
                                                <td>{lead.totalStudents}</td>
                                                <td>{lead.completedStudents}</td>
                                                <td>{lead.activeStudents}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {facultyData?.students && facultyData.students.length > 0 && (
                        <>
                            <div className="profile-section">
                                <h3>In Progress Students</h3>
                                <div className="students-list">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Username</th>
                                                <th>Domain</th>
                                                <th>Student Lead</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {facultyData.students
                                                .filter(student => !student.completed)
                                                .map(student => (
                                                    <tr key={student.username}>
                                                        <td>{student.name}</td>
                                                        <td>{student.username}</td>
                                                        <td>{student.selectedDomain}</td>
                                                        <td>{student.leadName}</td>
                                                        <td>
                                                            <span className="status-badge active">
                                                                Active
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="profile-section">
                                <h3>Completed Students</h3>
                                <div className="students-list">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Username</th>
                                                <th>Domain</th>
                                                <th>Student Lead</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {facultyData.students
                                                .filter(student => student.completed)
                                                .map(student => (
                                                    <tr key={student.username}>
                                                        <td>{student.name}</td>
                                                        <td>{student.username}</td>
                                                        <td>{student.selectedDomain}</td>
                                                        <td>{student.leadName}</td>
                                                        <td>
                                                            <span className="status-badge completed">
                                                                Completed
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
} 