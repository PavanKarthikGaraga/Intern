'use client'
import { useState, useEffect } from 'react';
import { UserOutlined, PhoneOutlined, HomeOutlined, MailOutlined, EnvironmentOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import Loader from '@/app/components/loader/loader';
import toast from 'react-hot-toast';

import { stateNames } from '@/app/Data/states';
import { districtNames } from '@/app/Data/districts';
import { countryCodes } from '@/app/Data/coutries';
import { branchNames } from '@/app/Data/branches';
import { girlHostels, boyHostels, busRoutes } from '@/app/Data/locations';

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
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch('/api/dashboard/admin/domains');
        const data = await response.json();
        if (data.success) setDomains(data.domains);
      } catch (error) {
        console.error('Error fetching domains:', error);
      }
    };
    fetchDomains();
  }, []);

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
        accommodation: initialStudentData.accommodation || 'No',
        transportation: initialStudentData.transportation || 'No',
        busRoute: initialStudentData.busRoute || '',
        selectedDomain: initialStudentData.selectedDomain || '',
        fieldOfInterest: initialStudentData.fieldOfInterest || '',
        mode: initialStudentData.mode || '',
        slot: initialStudentData.slot || '',
        year: initialStudentData.year || '',
        batch: initialStudentData.batch || '',
        careerChoice: initialStudentData.careerChoice || '',
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
        setStudentData(prev => ({ ...prev, ...formData, profileEdited: (prev.profileEdited || 0) + 1 }));
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

  const profileEditedCount = Number(studentData.profileEdited || 0);
  const canEdit = profileEditedCount < 1;
  const isResidenceOnlyEdit = false; // Overriding previous 2-tier logic as per new 1-time request

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
        <button 
          className={`tab-button ${activeProfileSection === 'internship' ? 'active' : ''}`}
          onClick={() => setActiveProfileSection('internship')}
        >
          <EditOutlined className="tab-icon" />
          Internship Details
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
                  {isEditing && !isResidenceOnlyEdit ? (
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
                  {isEditing && !isResidenceOnlyEdit ? (
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
                  {isEditing && !isResidenceOnlyEdit ? (
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
                  {isEditing && !isResidenceOnlyEdit ? (
                    <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} style={{ width: '100%', padding: '5px', marginLeft: '5px' }} />
                  ) : (
                    <>{studentData.phoneNumber}<div className="value-underline"></div></>
                  )}
                </div>
              </div>
              
              {isEditing && !isResidenceOnlyEdit ? (
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
                <label>Accommodation Required?</label>
                <div className="info-value">
                  {isEditing ? (
                    <select name="accommodation" value={formData.accommodation} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    <>{studentData.accommodation || 'No'}<div className="value-underline"></div></>
                  )}
                </div>
              </div>

              <div className="info-group">
                <label>Transportation Required?</label>
                <div className="info-value">
                  {isEditing ? (
                    <select name="transportation" value={formData.transportation} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    <>{studentData.transportation || 'No'}<div className="value-underline"></div></>
                  )}
                </div>
              </div>

              {((isEditing ? formData.transportation === 'Yes' : studentData.transportation === 'Yes')) && (
                <div className="info-group">
                  <label>Bus Route</label>
                  <div className="info-value">
                    {isEditing ? (
                      <select name="busRoute" value={formData.busRoute} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                        <option value="">Select Route</option>
                        {busRoutes.map(route => (
                          <option key={route['Route ID']} value={route['Route ID']}>
                            {route['Route ID']} - {route.Route} ({route.Location})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>{studentData.busRoute || 'N/A'}<div className="value-underline"></div></>
                    )}
                  </div>
                </div>
              )}

              <div className="info-group">
                <label>Residence Type</label>
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

        {activeProfileSection === 'internship' && (
          <div className="section-content">
            <div className="section-header">
              <h1>Internship Details</h1>
              <div className="header-underline"></div>
            </div>
            <div className="info-container">
              <div className="info-group">
                <label>Domain</label>
                <div className="info-value">
                  {isEditing ? (
                    <select name="selectedDomain" value={formData.selectedDomain} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                      <option value="">Select Domain</option>
                      {domains.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : (
                    <>{studentData.selectedDomain}<div className="value-underline"></div></>
                  )}
                </div>
              </div>

              <div className="info-group">
                <label>Field of Interest</label>
                <div className="info-value">
                  {isEditing ? (
                    <select name="fieldOfInterest" value={formData.fieldOfInterest} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                      <option value="">Select Field</option>
                      <option value="Awareness Campaigns">Awareness Campaigns</option>
                      <option value="Content Creation (YouTube / Reels)">Content Creation (YouTube / Reels)</option>
                      <option value="Cover Song Production">Cover Song Production</option>
                      <option value="Dance">Dance</option>
                      <option value="Documentary Making">Documentary Making</option>
                      <option value="Dramatics">Dramatics</option>
                      <option value="Environmental Activities">Environmental Activities</option>
                      <option value="Leadership Activities">Leadership Activities</option>
                      <option value="Literature">Literature</option>
                      <option value="Painting">Painting</option>
                      <option value="Photography">Photography</option>
                      <option value="Public Speaking">Public Speaking</option>
                      <option value="Rural Development">Rural Development</option>
                      <option value="Short Film Making">Short Film Making</option>
                      <option value="Singing">Singing</option>
                      <option value="Social Service / Volunteering">Social Service / Volunteering</option>
                      <option value="Spirituality">Spirituality</option>
                      <option value="Story Telling">Story Telling</option>
                      <option value="Technical (Hardware)">Technical (Hardware)</option>
                      <option value="Technical (Software)">Technical (Software)</option>
                      <option value="Video Editing">Video Editing</option>
                      <option value="Yoga & Meditation">Yoga & Meditation</option>
                    </select>
                  ) : (
                    <>{studentData.fieldOfInterest}<div className="value-underline"></div></>
                  )}
                </div>
              </div>

              <div className="info-group">
                <label>Internship Mode</label>
                <div className="info-value">
                  {isEditing ? (
                    <select name="mode" value={formData.mode} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                      <option value="Remote">Remote</option>
                      <option value="Incampus">In Campus</option>
                      <option value="InVillage">In Village</option>
                    </select>
                  ) : (
                    <>{studentData.mode}<div className="value-underline"></div></>
                  )}
                </div>
              </div>

              <div className="info-group">
                <label>Slot</label>
                <div className="info-value">
                  {isEditing ? (
                    <select name="slot" value={formData.slot} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                      <option value="1">Slot 1 — May 11–17</option>
                      <option value="2">Slot 2 — May 18–24</option>
                      <option value="3">Slot 3 — May 25–31</option>
                      <option value="4">Slot 4 — Jun 1–7</option>
                      <option value="5">Slot 5 — Jun 8–14</option>
                      <option value="6">Slot 6 — Jun 15–21</option>
                      <option value="7">Slot 7 — Jun 22–28</option>
                      <option value="8">Slot 8 — Jun 29–Jul 5</option>
                      <option value="9">Slot 9 — Jul 6–12</option>
                    </select>
                  ) : (
                    <>Slot {studentData.slot}<div className="value-underline"></div></>
                  )}
                </div>
              </div>

              <div className="info-group">
                <label>Year</label>
                <div className="info-value">
                  {isEditing ? (
                    <select name="year" value={formData.year} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  ) : (
                    <>{studentData.year} Year<div className="value-underline"></div></>
                  )}
                </div>
              </div>

              <div className="info-group">
                <label>Batch</label>
                <div className="info-value">
                  {isEditing ? (
                    <input type="text" name="batch" value={formData.batch} onChange={handleChange} placeholder="e.g. 2022-26" style={{ width: '100%', padding: '5px' }} />
                  ) : (
                    <>{studentData.batch}<div className="value-underline"></div></>
                  )}
                </div>
              </div>

              <div className="info-group">
                <label>Career Choice</label>
                <div className="info-value">
                  {isEditing ? (
                    <select name="careerChoice" value={formData.careerChoice} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
                      <option value="">Select Career Choice</option>
                      <option value="Job">Job</option>
                      <option value="Entrepreneurship">Entrepreneurship</option>
                      <option value="Higher Studies">Higher Studies</option>
                      <option value="Competitive Exams">Competitive Exams (UPSC/GATE/etc)</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <>{studentData.careerChoice}<div className="value-underline"></div></>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}