'use client'
import { useState, useEffect } from 'react';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
// import Loader from '@/components/loader/loader';
import toast from 'react-hot-toast';

export default function Profile({ user }) {
  const [studentLead, setStudentLead] = useState({});
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

        const response = await fetch('/api/dashboard/studentLead/overview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received student lead data:', data);

        if (data.success && data.studentLead) {
          setStudentLead(data.studentLead);
        } else {
          throw new Error(data.error || 'Failed to fetch student lead data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load student lead data');
        toast.error(error.message || 'Failed to load student lead data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <div className="loading">Loading Profile data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="student-profile">
      <div className="profile-tabs">
          <UserOutlined className="tab-icon" />
          Personal Information
      </div>

      <div className="profile-content">
          <div className="section-content">
            <div className="section-header">
              <h1>Personal Information</h1>
              <div className="header-underline"></div>
            </div>
            <div className="info-container">
              <div className="info-group">
                <label>Name</label>
                <div className="info-value">
                  {studentLead.name}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>ID Number</label>
                <div className="info-value">
                  {studentLead.username}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>Faculty Mentor</label>
                <div className="info-value">
                  {studentLead.mentorName || 'Not assigned'}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>Total Students</label>
                <div className="info-value">
                  {studentLead.totalStudents || 0}
                  <div className="value-underline"></div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}