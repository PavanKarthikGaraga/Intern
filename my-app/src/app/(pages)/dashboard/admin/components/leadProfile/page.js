'use client';
import { useState, useEffect } from 'react';
import './page.css';

export default function LeadProfile({ isOpen, onClose, username }) {
    const [leadData, setLeadData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (username) {
            fetchLeadData();
        }
    }, [username]);

    const fetchLeadData = async () => {
        try {
            const response = await fetch(`/api/dashboard/admin/leadProfile?username=${username}`);
            const data = await response.json();

            if (data.success) {
                setLeadData(data.lead);
            } else {
                setError(data.error || 'Failed to fetch lead data');
            }
        } catch (err) {
            setError('An error occurred while fetching lead data');
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
                    <h2>Student Lead Profile</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="profile-content">
                    <div className="profile-section">
                        <h3>Personal Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Name:</label>
                                <span>{leadData?.name}</span>
                            </div>
                            <div className="info-item">
                                <label>Username:</label>
                                <span>{leadData?.username}</span>
                            </div>
                            <div className="info-item">
                                <label>Email:</label>
                                <span>{leadData?.email}</span>
                            </div>
                            <div className="info-item">
                                <label>Phone:</label>
                                <span>{leadData?.phoneNumber}</span>
                            </div>
                            <div className="info-item">
                                <label>Branch:</label>
                                <span>{leadData?.branch}</span>
                            </div>
                            <div className="info-item">
                                <label>Slot:</label>
                                <span>Slot {leadData?.slot}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h3>Statistics</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h4>Total Students</h4>
                                <p>{leadData?.stats?.totalStudents || 0}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Completed Students</h4>
                                <p>{leadData?.stats?.completedStudents || 0}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Active Students</h4>
                                <p>{leadData?.stats?.activeStudents || 0}</p>
                            </div>
                            <div className="stat-card">
                                <h4>Completion Rate</h4>
                                <p>{leadData?.stats?.completionRate || 0}%</p>
                            </div>
                        </div>
                    </div>

                    {leadData?.students && leadData.students.length > 0 && (
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
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leadData.students
                                                .filter(student => !student.completed)
                                                .map(student => (
                                                    <tr key={student.username}>
                                                        <td>{student.name}</td>
                                                        <td>{student.username}</td>
                                                        <td>{student.selectedDomain}</td>
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
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leadData.students
                                                .filter(student => student.completed)
                                                .map(student => (
                                                    <tr key={student.username}>
                                                        <td>{student.name}</td>
                                                        <td>{student.username}</td>
                                                        <td>{student.selectedDomain}</td>
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