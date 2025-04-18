'use client';
import { useState, useEffect } from 'react';
// import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
// import "./page.css";
import { TeamOutlined, CalendarOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { FaCheckCircle, FaCalendarAlt, FaClock } from 'react-icons/fa';

export default function Overview({ user }) {
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOverviewData = async () => {
            try {
                setError(null);
                const response = await fetch('/api/dashboard/facultyMentor/overview', {
                    headers: { 
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch overview data');
                }

                const data = await response.json();
                if (data.success) {
                    setOverviewData(data.data);
                } else {
                    throw new Error(data.error || 'Failed to fetch overview data');
                }
            } catch (err) {
                console.error('Error fetching overview data:', err);
                setError(err.message);
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user?.username) {
            fetchOverviewData();
        }
    }, [user]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!overviewData) {
        return <div className="error">No data available</div>;
    }

    const { 
        facultyInfo, 
        leadsCount, 
        studentsCount, 
        completedCount,
        totalVerifiedReports,
        totalAttendancePosted,
        pendingAttendance
    } = overviewData;

    return (
        <div className="overview-section">
            <h1>Welcome {facultyInfo?.name || 'Faculty Mentor'}</h1>
            <p className="role-text">Faculty Mentor</p>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Assigned Leads</h3>
                            <p>{leadsCount || 0}</p>
                        </div>
                        <UserOutlined className="stat-icon" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Total Students</h3>
                            <p>{studentsCount || 0}</p>
                        </div>
                        <TeamOutlined className="stat-icon" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Completed Students</h3>
                            <p>{completedCount || 0}</p>
                        </div>
                        <CheckCircleOutlined className="stat-icon" />
                    </div>
                </div>
            </div>

            <div className="stats-section">
                <h2>Verification Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-content">
                            <div>
                                <h3>Total Verified Reports</h3>
                                <p>{totalVerifiedReports || 0}</p>
                            </div>
                            <div className="stat-icon">
                                <FaCheckCircle />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="stats-section">
                <h2>Attendance Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-content">
                            <div>
                                <h3>Total Attendance Posted</h3>
                                <p>{totalAttendancePosted || 0}</p>
                            </div>
                            <div className="stat-icon">
                                <FaCalendarAlt />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-content">
                            <div>
                                <h3>Pending Attendance</h3>
                                <p>{pendingAttendance || 0}</p>
                            </div>
                            <div className="stat-icon">
                                <FaClock />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <p className="beta-note">
                Note: This is a beta version. If you experience any issues or discrepancies, please report them to SAC Department.
            </p>
        </div>
    );
}