'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function Overview({ user }) {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalStudents: 0,
    verifiedSubmissions: 0,
    pendingSubmissions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/facultyMentor/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || 'Failed to fetch stats');
          return;
        }

        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('An unexpected error occurred while fetching stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user.username]);

  if (loading) {
    return <div className="loading">Loading overview data...</div>;
  }

  return (
    <div className="overview-section">
      <h2>Overview</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Student Leads</h3>
          <p>{stats.totalLeads}</p>
        </div>
        <div className="stat-card">
          <h3>Total Students</h3>
          <p>{stats.totalStudents}</p>
        </div>
        <div className="stat-card">
          <h3>Verified Submissions</h3>
          <p>{stats.verifiedSubmissions}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Submissions</h3>
          <p>{stats.pendingSubmissions}</p>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {/* Activity items will be added here */}
          <div className="activity-item">
            <p>No recent activity to display</p>
          </div>
        </div>
      </div>
    </div>
  );
} 