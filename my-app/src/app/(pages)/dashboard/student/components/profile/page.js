import { useState, useEffect } from 'react';
import { UserOutlined, PhoneOutlined, HomeOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons';
import Loader from '@/app/components/loader/loader';
import toast from 'react-hot-toast';

export default function Profile({ user }) {
  const [student, setStudent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeProfileSection, setActiveProfileSection] = useState('personal');

  useEffect(() => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        console.log('Fetching data for student:', user.username);

        // Fetch student details
        const response = await fetch('/api/dashboard/student/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received student data:', data);

        if (data.success && data.student) {
          setStudent(data.student);
        } else {
          throw new Error(data.error || 'Failed to fetch student data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load student data');
        toast.error(error.message || 'Failed to load student data');
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
                  {student.name}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>ID Number</label>
                <div className="info-value">
                  {student.username}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>Gender</label>
                <div className="info-value">
                  {student.gender}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>Branch</label>
                <div className="info-value">
                  {student.branch}
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
                  {student.email}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>Phone</label>
                <div className="info-value">
                  <PhoneOutlined className="info-icon" />
                  {student.phoneNumber}
                  <div className="value-underline"></div>
                </div>
              </div>
              <div className="info-group">
                <label>Address</label>
                <div className="info-value">
                  <EnvironmentOutlined className="info-icon" />
                  {student.district}, {student.state}, {student.country} - {student.pincode}
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
                  {student.residenceType}
                  <div className="value-underline"></div>
                </div>
              </div>
              {student.residenceType === 'Hostel' && (
                <div className="info-group">
                  <label>Hostel</label>
                  <div className="info-value">
                    <HomeOutlined className="info-icon" />
                    {student.hostelName}
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