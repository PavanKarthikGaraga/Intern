'use client';
import { useState, useEffect } from 'react';
// import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
// import './page.css';
import { TeamOutlined, CalendarOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { FaCheckCircle, FaCalendarAlt, FaClock } from 'react-icons/fa';

export default function Overview({ user }) {
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statistics, setStatistics] = useState({
        totalVerifiedReports: 0,
        totalAttendancePosted: 0,
        pendingAttendance: 0
    });

    useEffect(() => {
        const fetchOverviewData = async () => {
            try {
                setError(null);
                const response = await fetch('/api/dashboard/facultyMentor/overview', {
                    credentials: 'include'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch overview data');
                }

                const data = await response.json();
                setOverviewData(data);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchStats = async () => {
            try {
                const response = await fetch('/api/dashboard/facultyMentor/stats', {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch statistics');
                }

                const data = await response.json();
                return {
                    totalVerifiedReports: data.totalVerifiedReports || 0,
                    totalAttendancePosted: data.totalAttendancePosted || 0,
                    pendingAttendance: data.pendingAttendance || 0
                };
            } catch (error) {
                console.error('Error fetching stats:', error);
                return {
                    totalVerifiedReports: 0,
                    totalAttendancePosted: 0,
                    pendingAttendance: 0
                };
            }
        };

        const loadStats = async () => {
            const stats = await fetchStats();
            setStatistics(stats);
        };

        if (user?.username) {
            fetchOverviewData();
            loadStats();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!overviewData) {
        return <div className="no-data">No overview data available</div>;
    }

    const { 
        facultyInfo, 
        leadsCount, 
        studentsCount, 
        completedCount, 
    } = overviewData;

    return (
        <div className="overview-section">
            <h1>Welcome {facultyInfo.facultyName}</h1>
            <p className="role-text">Faculty Mentor</p>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Assigned Leads</h3>
                            <p>{leadsCount}</p>
                        </div>
                        <UserOutlined className="stat-icon" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Total Students</h3>
                            <p>{studentsCount}</p>
                        </div>
                        <TeamOutlined className="stat-icon" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Completed Students</h3>
                            <p>{completedCount}</p>
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
                                <p>{statistics.totalVerifiedReports}</p>
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
                                <p>{statistics.totalAttendancePosted}</p>
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
                                <p>{statistics.pendingAttendance}</p>
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