'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
// import './page.css';
// import Loader from '@/components/loader/loader';
import { TeamOutlined, CalendarOutlined, UserOutlined, UploadOutlined } from '@ant-design/icons';

export default function Overview({ user }) {
    const [studentLeadData, setStudentLeadData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudentLeadData = async () => {
            try {
                setError(null);
                const response = await fetch('/api/dashboard/studentLead/overview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user?.username })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch student lead data');
                }

                const data = await response.json();
                if (data.success && data.studentLead) {
                    setStudentLeadData(data.studentLead);
                } else {
                    throw new Error(data.error || 'Failed to fetch student lead data');
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
            fetchStudentLeadData();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        // return <Loader /   >;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!studentLeadData) {
        return <div className="no-data">No student lead data available</div>;
    }

    return (
        <div className="overview-section">
            <h1>Welcome {studentLeadData.name}</h1>
            <p className="role-text">Student Lead</p>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Total Students</h3>
                            <p>{studentLeadData.totalStudents || 0}</p>
                        </div>
                        <TeamOutlined className="stat-icon" />
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-content">
                        <div>
                            <h3>Faculty Mentor</h3>
                            <p>{studentLeadData.mentorName || 'Not assigned'}</p>
                        </div>
                        <UserOutlined className="stat-icon" />
                    </div>
                </div>
            </div>

            <p className="beta-note">
                Note: This is a beta version. If you experience any issues or discrepancies, please report them to SAC Department.
            </p>
        </div>
    );
}