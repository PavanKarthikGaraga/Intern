'use client';
import { useState, useEffect } from 'react';
import { TeamOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import Loader from '@/app/components/loader/loader';
import toast from 'react-hot-toast';

export default function Overview({ user }) {
  const [stats, setStats] = useState({
    totalStudents: 0,
    completedStudents: 0,
    currentStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        console.log('Fetching data for student lead:', user.username);

        // Fetch student lead statistics
        const response = await fetch('/api/dashboard/studentLead/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });

        const data = await response.json();
        console.log('API Response:', data);

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 401) {
            throw new Error('Session expired. Please login again.');
          } else if (response.status === 403) {
            throw new Error('You do not have permission to access this resource. Only student leads can access this page.');
          } else if (response.status === 404) {
            throw new Error('User not found in database.');
          } else {
            throw new Error(data.error || 'Failed to fetch dashboard data');
          }
        }

        // const data = await response.json();
        console.log('Received student lead data:', data);

        if (data.success) {
          setStats({
            totalStudents: data.totalStudents || 0,
            completedStudents: data.completedStudents || 0,
            currentStudents: data.currentStudents || 0
          });
        } else {
          toast.error(data.message || 'Failed to fetch dashboard data');
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <div className="loading">Loading Data .......</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="overview-section">
      <h1>Welcome {user?.name || 'Student Lead'}</h1>
      <p className="role-text">Student Lead</p>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <h3>Total Students</h3>
              <p>{stats.totalStudents}</p>
            </div>
            <TeamOutlined className="stat-icon" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div>
              <h3>Completed Students</h3>
              <p>{stats.completedStudents}</p>
            </div>
            <CheckCircleOutlined className="stat-icon" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div>
              <h3>Currently Assigned</h3>
              <p>{stats.currentStudents}</p>
            </div>
            <UserOutlined className="stat-icon" />
          </div>
        </div>
      </div>
    </div>
  );
} 