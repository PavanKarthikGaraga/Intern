"use client";
import { useState, useEffect } from "react";
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Loader from '@/app/components/loader/loader';

export default function Overview() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeStudents: 0,
        completedStudents: 0,
        totalDomains: 0,
        totalMentors: 0,
        completionRate: 0
    });
    const [domainProgress, setDomainProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentMentors, setStudentMentors] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchDashboardStats(),
                    fetchStudentMentors()
                ]);
            } catch (error) {
                console.error('Error fetching initial data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await fetch('/api/dashboard/admin/stats');
            const data = await response.json();

            if (!data.success) {
                toast.error(data.error || 'Failed to fetch dashboard statistics');
                return;
            }

            setStats(data.stats);
            setDomainProgress(data.domainProgress || []);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast.error('Failed to load dashboard statistics');
        }
    };

    const fetchStudentMentors = async () => {
        try {
            const response = await fetch('/api/dashboard/admin/student-mentors');
            if (!response.ok) throw new Error('Failed to fetch student mentors');
            const data = await response.json();
            if (data.success) {
                setStudentMentors(data.mentors);
            }
        } catch (err) {
            console.error('Error fetching student mentors:', err);
            toast.error('Failed to load student mentors');
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="domain-stats">
            <div className="welcome-header">
                <h2>Welcome {user?.name || 'Admin'}</h2>
                <p className="welcome-subtitle">Here's an overview of your dashboard</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Students</h3>
                    <p>{stats.totalStudents}</p>
                </div>
                <div className="stat-card">
                    <h3>Active Students</h3>
                    <p>{stats.activeStudents}</p>
                </div>
                <div className="stat-card">
                    <h3>Completed Students</h3>
                    <p>{stats.completedStudents}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Domains</h3>
                    <p>{stats.totalDomains}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Mentors</h3>
                    <p>{stats.totalMentors}</p>
                </div>
                <div className="stat-card">
                    <h3>Completion Rate</h3>
                    <p>{stats.completionRate.toFixed(1)}%</p>
                </div>
            </div>

            <div className="domain-breakdown">
                <h2>Domain-wise Progress</h2>
                {domainProgress.length > 0 ? (
                    domainProgress.map((domain, index) => (
                        <div key={index} className="domain-stat-card">
                            <h4>{domain.domain}</h4>
                            <div className="domain-details">
                                <p>Total Students: <span>{domain.total}</span></p>
                                <p>Active Students: <span>{domain.active}</span></p>
                                <p>Completed Students: <span>{domain.completed}</span></p>
                                <p>Assigned Mentors: <span>{domain.mentors}</span></p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="no-data">No domain data available</p>
                )}
            </div>
        </div>
    );
} 