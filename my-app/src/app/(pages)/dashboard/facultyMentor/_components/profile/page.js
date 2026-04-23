'use client';
import { useState, useEffect } from 'react';
import { UserOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';

export default function Profile({ user }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setError(null);
        const response = await fetch('/api/dashboard/facultyMentor/profile', {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch profile data');
        }

        const data = await response.json();
        setProfileData(data);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <div className="loading">Loading Profile data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!profileData) {
    return <div className="no-data">No profile data available</div>;
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
                {profileData.name}
                <div className="value-underline"></div>
              </div>
            </div>
            <div className="info-group">
              <label>Username</label>
              <div className="info-value">
                {profileData.username}
                <div className="value-underline"></div>
              </div>
            </div>
            <div className="info-group">
              <label>Role</label>
              <div className="info-value">
                {profileData.role}
                <div className="value-underline"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}