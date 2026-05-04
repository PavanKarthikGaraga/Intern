'use client'
import { useState, useEffect } from 'react';
import { UserOutlined, PhoneOutlined, HomeOutlined, MailOutlined, EnvironmentOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import Loader from '@/app/components/loader/loader';
import toast from 'react-hot-toast';

import { stateNames } from '@/app/Data/states';
import { districtNames } from '@/app/Data/districts';
import { countryCodes } from '@/app/Data/coutries';
import { branchNames } from '@/app/Data/branches';
import { girlHostels, boyHostels } from '@/app/Data/locations';

const uniqueCountryCodes = countryCodes
  .filter((country, index, self) =>
    index === self.findIndex((c) => c.code === country.code)
  )
  .sort((a, b) => a.name.localeCompare(b.name));

export default function Profile({ user, studentData: initialStudentData }) {
  const [activeProfileSection, setActiveProfileSection] = useState('personal');
  const [studentData, setStudentData] = useState(initialStudentData);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialStudentData) {
      setStudentData(initialStudentData);
      setFormData({
        name: initialStudentData.name || '',
        gender: initialStudentData.gender || '',
        branch: initialStudentData.branch || '',
        email: initialStudentData.email || '',
        phoneNumber: initialStudentData.phoneNumber || '',
        district: initialStudentData.district || '',
        state: initialStudentData.state || '',
        country: initialStudentData.country || 'IN',
        pincode: initialStudentData.pincode || '',
        residenceType: initialStudentData.residenceType || '',
        hostelName: initialStudentData.hostelName || '',
      });
    }
  }, [initialStudentData]);

  if (!studentData) {
    return <div className="loading">Loading Profile data...</div>;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/dashboard/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Profile updated successfully!');
        setStudentData(prev => ({ ...prev, ...formData, profileEdited: 1 }));
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      toast.error('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = !studentData.profileEdited;

  return (
    <div className="student-profile">
      <div className="profile-header-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        {canEdit && !isEditing && (
          <button className="edit-btn" onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: 'rgb(151, 0, 3)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            <EditOutlined /> Edit Profile (One-time only)
          </button>
        )}
        {isEditing && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="cancel-btn" onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button className="save-btn" onClick={handleSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              <SaveOutlined /> {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

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
                  {isEditing ? (
                    <input type="text" name="name" value={formData.name} onChange={handleChange} style={{ width: '100%', padding: '5px' }} />
                  ) : (
                    <>{studentData.name}<div className="value-underline"></div></>
                  )}
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
                  {isEditing ? (
                    <select name="gender" value={formData.gender} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <>{studentData.gender}<div className="value-underline"></div></>
                  )}
                </div>
              </div>
              <div className="info-group">
                <label>Branch</label>
                <div className="info-value">
                  {isEditing ? (
                    <select name="branch" value={formData.branch} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                      <option value="">Select Branch</option>
                      {branchNames.map(branch => (
                        <option key={branch.id || branch.name} value={branch.name}>{branch.name}</option>
                      ))}
                    </select>
                  ) : (
                    <>{studentData.branch}<div className="value-underline"></div></>
                  )}
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
                  {isEditing ? (
                    <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} style={{ width: '100%', padding: '5px', marginLeft: '5px' }} />
                  ) : (
                    <>{studentData.phoneNumber}<div className="value-underline"></div></>
                  )}
                </div>
              </div>
              
              {isEditing ? (
                <>
                  <div className="info-group">
                    <label>Country</label>
                    <div className="info-value">
                      <select name="country" value={formData.country} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                        <option value="">Select Country</option>
                        {uniqueCountryCodes.map(country => (
                          <option key={country.code} value={country.code}>{country.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {formData.country === 'IN' && (
                    <>
                      <div className="info-group">
                        <label>State</label>
                        <div className="info-value">
                          <select name="state" value={formData.state} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                            <option value="">Select State</option>
                            {stateNames.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {formData.state && (
                        <div className="info-group">
                          <label>District</label>
                          <div className="info-value">
                            <select name="district" value={formData.district} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                              <option value="">Select District</option>
                              {districtNames[formData.state]?.map(district => (
                                <option key={district} value={district}>{district}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div className="info-group">
                    <label>Pincode</label>
                    <div className="info-value">
                      <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} style={{ width: '100%', padding: '5px' }} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="info-group">
                  <label>Address</label>
                  <div className="info-value">
                    <EnvironmentOutlined className="info-icon" />
                    {studentData.district}, {studentData.state}, {studentData.country} - {studentData.pincode}
                    <div className="value-underline"></div>
                  </div>
                </div>
              )}
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
                  {isEditing ? (
                    <select name="residenceType" value={formData.residenceType} onChange={handleChange} style={{ width: '100%', padding: '5px', marginLeft: '5px' }}>
                      <option value="Day Scholar">Day Scholar</option>
                      <option value="Hostel">Hostel</option>
                    </select>
                  ) : (
                    <>{studentData.residenceType}<div className="value-underline"></div></>
                  )}
                </div>
              </div>
              {(isEditing ? formData.residenceType === 'Hostel' : studentData.residenceType === 'Hostel') && (
                <div className="info-group">
                  <label>Hostel</label>
                  <div className="info-value">
                    <HomeOutlined className="info-icon" />
                    {isEditing ? (
                      <select name="hostelName" value={formData.hostelName} onChange={handleChange} style={{ width: '100%', padding: '5px', marginLeft: '5px' }}>
                        <option value="">Select Hostel</option>
                        {(formData.gender === 'Male' ? boyHostels : girlHostels).map(hostel => (
                          <option key={hostel.hostelName} value={hostel.hostelName}>{hostel.hostelName}</option>
                        ))}
                      </select>
                    ) : (
                      <>{studentData.hostelName}<div className="value-underline"></div></>
                    )}
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