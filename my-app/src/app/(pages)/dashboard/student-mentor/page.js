'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './page.css';

export default function StudentMentorDashboard() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState('mentees');
    const [userInfo, setUserInfo] = useState({
        name: 'John Doe',
        id: 'SM001',
        role: 'Student Mentor'
    });

    const handleLogout = () => {
        // Implement logout logic
        router.push('/login');
    };

    return (
        <div className="student-mentor-dashboard">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>Student Mentor Dashboard</h1>
                </div>
                <div className="header-right">
                    <div className="user-info">
                        <span>{userInfo.name}</span>
                        <span className="user-id">{userInfo.id} - {userInfo.role}</span>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <div className="dashboard-content">
                <aside className="dashboard-sidebar">
                    <button
                        className={`sidebar-item ${activeSection === 'mentees' ? 'active' : ''}`}
                        onClick={() => setActiveSection('mentees')}
                    >
                        <span className="item-label">My Mentees</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'progress' ? 'active' : ''}`}
                        onClick={() => setActiveSection('progress')}
                    >
                        <span className="item-label">Progress Tracking</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'meetings' ? 'active' : ''}`}
                        onClick={() => setActiveSection('meetings')}
                    >
                        <span className="item-label">Meeting Schedule</span>
                    </button>
                </aside>

                <main className="dashboard-main">
                    {activeSection === 'mentees' && (
                        <section className="mentees-section">
                            <h2>My Mentees</h2>
                            <div className="search-pagination-controls">
                                <input
                                    type="text"
                                    placeholder="Search mentees..."
                                    className="search-input"
                                />
                                <div className="pagination-controls">
                                    <button disabled>Previous</button>
                                    <span>Page 1 of 1</span>
                                    <button disabled>Next</button>
                                </div>
                            </div>
                            <div className="mentees-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Student ID</th>
                                            <th>Name</th>
                                            <th>Domain</th>
                                            <th>Progress</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>ST001</td>
                                            <td>Alice Johnson</td>
                                            <td>Web Development</td>
                                            <td>75%</td>
                                            <td>
                                                <button className="view-details-btn">View Details</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {activeSection === 'progress' && (
                        <section className="progress-section">
                            <h2>Progress Tracking</h2>
                            <div className="stats-overview">
                                <div className="stat-card">
                                    <h3>Average Progress</h3>
                                    <p>78%</p>
                                </div>
                                <div className="stat-card">
                                    <h3>Active Mentees</h3>
                                    <p>5</p>
                                </div>
                                <div className="stat-card">
                                    <h3>Completed Projects</h3>
                                    <p>12</p>
                                </div>
                            </div>
                            <div className="progress-charts">
                                {/* Add charts/graphs here */}
                            </div>
                        </section>
                    )}

                    {activeSection === 'meetings' && (
                        <section className="meetings-section">
                            <h2>Meeting Schedule</h2>
                            <div className="schedule-controls">
                                <button className="schedule-btn">Schedule New Meeting</button>
                            </div>
                            <div className="meetings-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Mentee</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>2024-03-20</td>
                                            <td>10:00 AM</td>
                                            <td>Alice Johnson</td>
                                            <td>Scheduled</td>
                                            <td>
                                                <button className="reschedule-btn">Reschedule</button>
                                                <button className="cancel-btn">Cancel</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </main>
            </div>

            <footer className="dashboard-footer">
                <p>&copy; 2024 Student Management System. All rights reserved.</p>
                <p>Developed by Your Organization</p>
            </footer>
        </div>
    );
} 