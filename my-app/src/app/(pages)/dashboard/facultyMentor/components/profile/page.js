'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
// import './page.css';

export default function Profile({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/dashboard/facultyMentor/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch profile');
        }

        if (data.success) {
          setProfile(data.profile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error(error.message || 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user.username]);

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="error">Failed to load profile</div>;
  }

  return (
    <div className="profile-section">
      <h2>Profile</h2>
      <div className="profile-card">
        <div className="profile-header">
          <h3>{profile.name}</h3>
          <span className="role-badge">Faculty Mentor</span>
        </div>
        <div className="profile-details">
          <div className="detail-group">
            <label>Username</label>
            <p>{profile.username}</p>
          </div>
          <div className="detail-group">
            <label>Email</label>
            <p>{profile.email}</p>
          </div>
          <div className="detail-group">
            <label>Phone</label>
            <p>{profile.phone}</p>
          </div>
          <div className="detail-group">
            <label>College</label>
            <p>{profile.college}</p>
          </div>
          <div className="detail-group">
            <label>Department</label>
            <p>{profile.department}</p>
          </div>
          <div className="detail-group">
            <label>Joined On</label>
            <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 