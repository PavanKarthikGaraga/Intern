'use client';
import { useState, useEffect } from 'react';
import { UserOutlined } from '@ant-design/icons';
import Loader from '@/app/components/loader/loader';
import toast from 'react-hot-toast';

export default function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setError(null);
        console.log('Fetching profile for student lead:', user.username);

        const response = await fetch('/api/dashboard/studentLead/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received profile data:', data);

        if (data.success) {
          setProfile(data.profile);
        } else {
          throw new Error(data.error || 'Failed to fetch profile data');
        }

      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error.message || 'Failed to load profile data');
        toast.error(error.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return <div className="loading">Loading Profile Data .......</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="profile-section">
      <div className="profile-header">
        <h2>Profile Information</h2>
      </div>

      <div className="profile-content">
        <div className="info-card">
          <h3>Personal Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Name</span>
              <span className="info-value">
                <UserOutlined /> {profile?.name || 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Username</span>
              <span className="info-value">
                <UserOutlined /> {profile?.username || 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Member Since</span>
              <span className="info-value">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Last Updated</span>
              <span className="info-value">
                {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 