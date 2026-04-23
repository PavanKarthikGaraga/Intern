'use client'
import { useState } from 'react';
import { UserOutlined, PhoneOutlined, HomeOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons';
import Loader from '@/app/components/loader/loader';

export default function Profile({ user, studentData }) {
  const [activeProfileSection, setActiveProfileSection] = useState('personal');

  if (!studentData) {
    return <div className="loading">Loading Profile data...</div>;
  }

  return (
    <div className="student-profile">
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeProfileSection === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveProfileSection('personal')}
        >
          <UserOutlined className="tab-icon" />
          Personal Information
        </button>
        <button 
          className={`tab-button ${activeProfileSection === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveProfileSection('contact')}
        >
          <PhoneOutlined className="tab-icon" />
          Contact Information
        </button>
        <button 
          className={`tab-button ${activeProfileSection === 'accommodation' ? 'active' : ''}`}
          onClick={() => setActiveProfileSection('accommodation')}
        >
          <HomeOutlined className="tab-icon" />
          Accommodation Details
        </button>
      </div>

      <div className="profile-content">
        {activeProfileSection === 'personal' && (
          <div className="section-content">
            <div className="section-header">
              <h1>Personal Information</h1>
              <div className="header-underline"></div>
            </div>
            <div className="info-container">
              <div className="info-group">
                <label>Name</label>
                <div className="info-value">
                  {studentData.name}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>ID Number</label>
                <div className="info-value">
                  {user.username}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>Gender</label>
                <div className="info-value">
                  {studentData.gender}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>Branch</label>
                <div className="info-value">
                  {studentData.branch}
                  <div className="value-underline"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeProfileSection === 'contact' && (
          <div className="section-content">
            <div className="section-header">
              <h1>Contact Information</h1>
              <div className="header-underline"></div>
            </div>
            <div className="info-container">
              <div className="info-group">
                <label>Email</label>
                <div className="info-value">
                  <MailOutlined className="info-icon" />
                  {studentData.email}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>Phone</label>
                <div className="info-value">
                  <PhoneOutlined className="info-icon" />
                  {studentData.phoneNumber}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>Address</label>
                <div className="info-value">
                  <EnvironmentOutlined className="info-icon" />
                  {studentData.district}, {studentData.state}, {studentData.country} - {studentData.pincode}
                  <div className="value-underline"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeProfileSection === 'accommodation' && (
          <div className="section-content">
            <div className="section-header">
              <h1>Accommodation Details</h1>
              <div className="header-underline"></div>
            </div>
            <div className="info-container">
              <div className="info-group">
                <label>Type</label>
                <div className="info-value">
                  <HomeOutlined className="info-icon" />
                  {studentData.residenceType}
                  <div className="value-underline"></div>
                </div>
              </div>
              {studentData.residenceType === 'Hostel' && (
                <div className="info-group">
                  <label>Hostel</label>
                  <div className="info-value">
                    <HomeOutlined className="info-icon" />
                    {studentData.hostelName}
                    <div className="value-underline"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}