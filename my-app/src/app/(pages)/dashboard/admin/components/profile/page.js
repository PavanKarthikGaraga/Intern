'use client';
import { useState, useEffect } from 'react';
import { UserOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
// import './page.css';

export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setError(null);
        const response = await fetch('/api/dashboard/admin/profile', {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch profile data');
        }

        const data = await response.json();
        if (data.success) {
          setProfileData(data.profile);
        } else {
          throw new Error(data.error || 'Failed to fetch profile data');
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (loading) {
    return <div>Loading Profile data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!profileData) {
    return <div>No profile data available</div>;
  }

  return (
    <div className="student-profile">
      <div className="section-header">
        <h1>Profile</h1>
        <div className="header-underline"></div>
      </div>

      <div className="profile-content">
        <div className="info-container">
          <div className="info-group">
            <label>Name</label>
            <div className="info-value">
              <UserOutlined className="info-icon" />
              {profileData.name}
            </div>
          </div>
          <div className="info-group">
            <label>Username</label>
            <div className="info-value">
              <UserOutlined className="info-icon" />
              {profileData.username}
            </div>
          </div>
          <div className="info-group">
            <label>Role</label>
            <div className="info-value">
              <UserOutlined className="info-icon" />
              {profileData.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}