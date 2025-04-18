'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
// import './page.css';
import { TeamOutlined, CalendarOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { FaCheckCircle, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import './page.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Overview() {
    const { user } = useAuth();
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOverviewData = async () => {
            try {
                setError(null);
                const response = await fetch('/api/dashboard/admin/overview', {
                    method: 'GET',
                    credentials: 'include'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch overview data');
                }

                const data = await response.json();
                if (data.success) {
                    setOverviewData({
                        ...data.overviewData,
                        statistics: data.statistics || {
                            totalVerifiedReports: 0,
                            totalAttendancePosted: 0,
                            pendingAttendance: 0,
                            day1Completed: 0,
                            day1Pending: 0,
                            day2Completed: 0,
                            day2Pending: 0,
                            day3Completed: 0,
                            day3Pending: 0,
                            day4Completed: 0,
                            day4Pending: 0,
                            day5Completed: 0,
                            day5Pending: 0,
                            day6Completed: 0,
                            day6Pending: 0,
                            day7Completed: 0,
                            day7Pending: 0
                        }
                    });
                } else {
                    throw new Error(data.error || 'Failed to fetch overview data');
                }
            } catch (err) {
                console.error('Error fetching data:', err);
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
        return <div className="no-data">No overview data available</div>;
    }

    const { 
        facultyInfo, 
        leadsCount, 
        studentsCount, 
        completedCount,
        facultyCount,
        statistics 
    } = overviewData;

    // Prepare data for charts
    const completionData = [
        { name: 'Completed', value: completedCount },
        { name: 'In Progress', value: studentsCount - completedCount }
    ];

    const attendanceData = [
        { name: 'Posted', value: statistics?.totalAttendancePosted || 0 },
        { name: 'Pending', value: statistics?.pendingAttendance || 0 }
    ];

    const dailyProgressData = [
        { name: 'Day 1', completed: statistics?.day1Completed || 0, pending: statistics?.day1Pending || 0 },
        { name: 'Day 2', completed: statistics?.day2Completed || 0, pending: statistics?.day2Pending || 0 },
        { name: 'Day 3', completed: statistics?.day3Completed || 0, pending: statistics?.day3Pending || 0 },
        { name: 'Day 4', completed: statistics?.day4Completed || 0, pending: statistics?.day4Pending || 0 },
        { name: 'Day 5', completed: statistics?.day5Completed || 0, pending: statistics?.day5Pending || 0 },
        { name: 'Day 6', completed: statistics?.day6Completed || 0, pending: statistics?.day6Pending || 0 },
        { name: 'Day 7', completed: statistics?.day7Completed || 0, pending: statistics?.day7Pending || 0 }
    ];

    return (
        <div className="overview-section">
            <h1>Admin Dashboard Overview</h1>
            <p className="role-text">Administrator</p>
            
            <div className="stats-grid">
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

                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Student Leads</h3>
                            <p>{leadsCount}</p>
                        </div>
                        <UserOutlined className="stat-icon" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Faculty Mentors</h3>
                            <p>{facultyCount}</p>
                        </div>
                        <UserOutlined className="stat-icon" />
                    </div>
                </div>
            </div>

            <div className="charts-section">
                <div className="chart-container">
                    <h2>Completion Status</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={completionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {completionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <h2>Attendance Status</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={attendanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <h2>Daily Progress</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dailyProgressData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="completed" stroke="#8884d8" />
                            <Line type="monotone" dataKey="pending" stroke="#82ca9d" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="stats-section">
                <h2>Verification Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-content">
                            <div>
                                <h3>Total Verified Reports</h3>
                                <p>{statistics?.totalVerifiedReports || 0}</p>
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
                                <p>{statistics?.totalAttendancePosted || 0}</p>
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
                                <p>{statistics?.pendingAttendance || 0}</p>
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