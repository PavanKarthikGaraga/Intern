'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaEye, FaEyeSlash, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUser, FaIdCard, FaVenusMars, FaHome } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './page.css';
import Loader from '@/app/components/loader/loader';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserOutlined, PhoneOutlined, HomeOutlined, BookOutlined, MailOutlined, EnvironmentOutlined, TeamOutlined, CalendarOutlined, IdcardOutlined } from '@ant-design/icons';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [submissions, setSubmissions] = useState(Array(8).fill(false));
  const [student, setStudent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [submittedLinks, setSubmittedLinks] = useState({});
  const [attendance, setAttendance] = useState({});
  const [activeSection, setActiveSection] = useState('overview');
  const [activeProfileSection, setActiveProfileSection] = useState('personal');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [mentorDetails, setMentorDetails] = useState(null);
  const [isMentorLoading, setIsMentorLoading] = useState(false);

  useEffect(() => {
    if (!user?.idNumber) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        console.log('Fetching data for student:', user.idNumber);

        // Fetch student details
        const response = await fetch('/api/dashboard/student/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idNumber: user.idNumber })
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

        // Fetch submitted reports
        const reportsResponse = await fetch(`/api/dashboard/student/reports?idNumber=${user.idNumber}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!reportsResponse.ok) {
          throw new Error('Failed to fetch reports');
        }

        const reportsData = await reportsResponse.json();
        console.log('Fetched reports:', reportsData);

        if (reportsData.success) {
          const submittedDays = reportsData.data.map((report) => report.dayNumber - 1);
          const updatedSubmissions = Array(8).fill(false);
          const links = {};

          reportsData.data.forEach((report) => {
            updatedSubmissions[report.dayNumber - 1] = true;
            links[report.dayNumber - 1] = report.link;
          });

          setSubmissions(updatedSubmissions);
          setSubmittedLinks(links);
        }

        // Add fetch attendance data
        const attendanceResponse = await fetch(`/api/dashboard/studentMentor/attendance?studentId=${user.idNumber}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          if (attendanceData.success) {
            setAttendance(attendanceData.data || {});
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load dashboard data');
        toast.error(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (student.studentMentorId) {
      fetchMentorDetails();
    }
  }, [student.studentMentorId]);

  console.log('user:', user);

  if (!user) {
    return <Loader />;
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const completedDays = Object.values(attendance).filter(status => status === 'P').length;

  const canSubmitDay = (dayIndex) => {
    if (dayIndex === 0) return true;
    return submissions[dayIndex - 1];
  };

  const toggleAccordion = (index) => {
    if (!canSubmitDay(index)) {
      toast.error('Please submit the previous day\'s report first');
      return;
    }
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const handleSubmit = async (index, e) => {
    e.preventDefault();
    const link = e.target.elements.link.value;
    if (!link) {
      toast.error('Please enter a valid document link');
      return;
    }

    const loadingToast = toast.loading('Submitting your report...');

    try {
      const response = await fetch('/api/dashboard/student/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idNumber: user.idNumber,
          day: index + 1,
          link
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newSubmissions = [...submissions];
        newSubmissions[index] = true;
        
        const newSubmittedLinks = { ...submittedLinks };
        newSubmittedLinks[index] = link;
        
        setSubmissions(newSubmissions);
        setSubmittedLinks(newSubmittedLinks);
        
        toast.success(`Day ${index + 1} report submitted successfully`, {
          id: loadingToast,
        });
      } else {
        toast.error(data.message || 'Failed to submit report', {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Error submitting report. Please try again.', {
        id: loadingToast,
      });
    }
  };

  const getAttendanceStatus = (dayNumber) => {
    const day = `day${dayNumber}`;
    const status = attendance[day];

    console.log("attendence",attendance);

    if (!submissions[dayNumber - 1]) {
      return { text: '', className: '' };
    }

    // If there's no attendance record and student is completed, show present
    if (!status && student.completed) {
      return { text: 'Present', className: 'present' };
    }

    if (!status) {
      return { text: 'Attendance is yet to be posted', className: 'pending' };
    }

    if (status === 'P') {
      return { text: 'Present', className: 'present' };
    }

    return { 
      text: 'You have been marked absent due to incorrect submission', 
      className: 'absent' 
    };
  };

  const handleResubmit = (index) => {
    setActiveAccordion(index);
    const newSubmissions = [...submissions];
    newSubmissions[index] = false;
    setSubmissions(newSubmissions);
    delete submittedLinks[index];
    setSubmittedLinks({...submittedLinks});
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setIsPasswordLoading(true);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      setIsPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      setIsPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const renderChangePassword = () => (
    <div className="change-password-section">
      <div className="section-header">
        <h2>Change Password</h2>
      </div>
      <div className="change-password-form">
        <form onSubmit={handlePasswordChange}>
          {passwordError && (
            <div className="error-message">{passwordError}</div>
          )}
          
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type={showPasswords.current ? "text" : "password"}
              id="currentPassword"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                currentPassword: e.target.value
              })}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('current')}
              aria-label={showPasswords.current ? "Hide password" : "Show password"}
            >
              {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type={showPasswords.new ? "text" : "password"}
              id="newPassword"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                newPassword: e.target.value
              })}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('new')}
              aria-label={showPasswords.new ? "Hide password" : "Show password"}
            >
              {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type={showPasswords.confirm ? "text" : "password"}
              id="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                confirmPassword: e.target.value
              })}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('confirm')}
              aria-label={showPasswords.confirm ? "Hide password" : "Show password"}
            >
              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="button-group">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isPasswordLoading}
            >
              {isPasswordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderOverview = () => {
    return (
      <div className="overview-section">
        <h1>Welcome {user?.name || 'Student'}</h1>
        <p className="role-text">Student</p>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div>
                <h3>Selected Domain</h3>
                <p>{student.selectedDomain || 'Not Selected'}</p>
              </div>
              <TeamOutlined className="stat-icon" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div>
                <h3>Days Completed</h3>
                <p>{completedDays || '0'}/8</p>
              </div>
              <CalendarOutlined className="stat-icon" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div>
                <h3>Mentor ID</h3>
                <p>{student.studentMentorId || 'Not Assigned'}</p>
              </div>
              <UserOutlined className="stat-icon" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div>
                <h3>Completion Status</h3>
                <p>{student.completed ? 'Completed' : 'In Progress'}</p>
              </div>
              <CalendarOutlined className="stat-icon" />
            </div>
          </div>
        </div>

        <p className="beta-note">
          Note: This is a beta version. If you experience any issues or discrepancies, please report them to SAC Department.
        </p>
      </div>
    );
  };

  const renderProfile = () => {
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
                    {student.idNumber}
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
                      {student.hostelType}
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
  };

  const fetchMentorDetails = async () => {
    if (!student.studentMentorId || mentorDetails) return;
    
    setIsMentorLoading(true);
    try {
      const response = await fetch('/api/dashboard/student/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId: student.studentMentorId })
      });

      const data = await response.json();
      if (data.success) {
        setMentorDetails(data.mentor);
      } else {
        console.error('Failed to fetch mentor details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching mentor details:', error);
    } finally {
      setIsMentorLoading(false);
    }
  };

  const renderMentor = () => (
    <div className="mentor-section">
      <div className="section-header">
        <h1>Mentor Information</h1>
        <div className="header-underline"></div>
      </div>
      {isMentorLoading ? (
        <div className="loading-state">
          <Loader />
        </div>
      ) : (
        <div className="info-container">
          <div className="info-group">
            <label>Mentor Name</label>
            <div className="info-value">
              <UserOutlined className="info-icon" />
              {mentorDetails?.name || 'Not Assigned'}
              <div className="value-underline"></div>
            </div>
          </div>
          <div className="info-group">
            <label>Mentor ID</label>
            <div className="info-value">
              <IdcardOutlined className="info-icon" />
              {student.studentMentorId || 'Not Assigned'}
              <div className="value-underline"></div>
            </div>
          </div>
          <div className="info-group">
            <label>Mentor Email</label>
            <div className="info-value">
              <MailOutlined className="info-icon" />
              {mentorDetails?.email || 'Not Available'}
              <div className="value-underline"></div>
            </div>
          </div>
          <div className="info-group">
            <label>Domain</label>
            <div className="info-value">
              <TeamOutlined className="info-icon" />
              {mentorDetails?.domain || 'Not Available'}
              <div className="value-underline"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSubmissions = () => (
    <section className="submissions-section">
        <h2>Daily Reports</h2>
      <div className="submissions-header">
        <div className="progress-tracker">
          {/* <div className="progress-stats">
            <div className="stat">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{submissions.filter(Boolean).length}/8</span>
            </div>
            <div className="stat">
              <span className="stat-label">Approved</span>
              <span className="stat-value">
                {Object.values(attendance).filter(status => status === 'P').length}/8
              </span>
            </div>
          </div> */}
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(submissions.filter(Boolean).length / 8) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="submissions-layout">
        <div className="days-grid">
          {Array(8).fill(null).map((_, index) => {
            const status = attendance[`day${index + 1}`];
            const isSubmitted = submissions[index];
            const isLocked = !canSubmitDay(index);
            
            return (
              <div
                key={index}
                className={`day-card ${activeAccordion === index ? 'active' : ''} ${
                  isLocked ? 'locked' : isSubmitted ? 'submitted' : 'submittable'
                }`}
                onClick={() => toggleAccordion(index)}
              >
                <div className="day-header">
                  <span className="day-number">Day {index + 1}</span>
                  <div className="day-status">
                    {isSubmitted ? (
                      status === 'P' ? (
                        <div className="status approved">
                          <span className="status-icon">✓</span>
                          <span className="status-text">Approved</span>
                        </div>
                      ) : status === 'A' ? (
                        <div className="status rejected">
                          <span className="status-icon">✕</span>
                          <span className="status-text">Rejected</span>
                        </div>
                      ) : (
                        <div className="status pending">
                          <span className="status-icon">⏳</span>
                          <span className="status-text">Pending</span>
                        </div>
                      )
                    ) : isLocked ? (
                      <div className="status locked">
                        <span className="status-icon">🔒</span>
                        <span className="status-text">Locked</span>
                      </div>
                    ) : (
                      <div className="status available">
                        <span className="status-text">Available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="submission-details">
          {activeAccordion !== null ? (
            <div className="submission-content">
              <div className="submission-header">
                <h3>Day {activeAccordion + 1} Report Submission</h3>
                <div className="submission-status">
                  {submissions[activeAccordion] && (
                    <span className={`status-badge ${
                      attendance[`day${activeAccordion + 1}`] === 'P' ? 'approved' :
                      attendance[`day${activeAccordion + 1}`] === 'A' ? 'rejected' : 'pending'
                    }`}>
                      {attendance[`day${activeAccordion + 1}`] === 'P' ? 'Approved' :
                       attendance[`day${activeAccordion + 1}`] === 'A' ? 'Rejected' : 'Pending Review'}
                    </span>
                  )}
                </div>
              </div>

              {submissions[activeAccordion] ? (
                <div className="submitted-content">
                  <div className="submitted-details">
                    <div className="detail-item">
                      <span className="detail-label">Submission Status:</span>
                      <span className="detail-value">Submitted</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Document Link:</span>
                      <a 
                        href={submittedLinks[activeAccordion]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="document-link"
                      >
                        View Document
                      </a>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Review Status:</span>
                      <span className="detail-value">
                        {getAttendanceStatus(activeAccordion + 1).text}
                      </span>
                    </div>
                  </div>

                  {attendance[`day${activeAccordion + 1}`] === 'A' && (
                    <div className="resubmission-section">
                      <p className="rejection-note">
                        Your submission has been rejected. Please review and resubmit your report.
                      </p>
                      <button 
                        onClick={() => handleResubmit(activeAccordion)}
                        className="resubmit-button"
                      >
                        Resubmit Report
                      </button>
                    </div>
                  )}

                  <div className="submission-notes">
                    <p className="note">
                      <span className="note-icon">ℹ️</span>
                      {attendance[`day${activeAccordion + 1}`] !== 'A' 
                        ? "To modify your submission, please contact your student mentor."
                        : "Please ensure your resubmission meets all the requirements."}
                    </p>
                  </div>
                </div>
              ) : !canSubmitDay(activeAccordion) ? (
                <div className="locked-message">
                  <span className="lock-icon">🔒</span>
                  <p>This day is locked. Please complete and submit the previous day's report first.</p>
                </div>
              ) : (
                <form onSubmit={(e) => handleSubmit(activeAccordion, e)} className="submission-form">
                  <div className="form-header">
                    <h4>Submit Your Report</h4>
                    <p>Please ensure your document contains all required information before submitting.</p>
                  </div>
                  
                  <div className="form-content">
                    <div className="input-group">
                      <label htmlFor={`link-${activeAccordion}`}>
                        Document Link <span className="required">*</span>
                      </label>
                      <input
                        id={`link-${activeAccordion}`}
                        name="link"
                        type="url"
                        placeholder="Enter your document link (Google Docs, Drive, etc.)"
                        className="link-input"
                        required
                      />
                    </div>
                    
                    <div className="submission-guidelines">
                      <h5>Submission Guidelines:</h5>
                      <ul>
                        <li>Ensure your document is accessible and properly shared</li>
                        <li>Include all required sections as per the template</li>
                        <li>Double-check your content before submitting</li>
                      </ul>
                    </div>

                    <button type="submit" className="submit-button">
                      Submit Report
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="placeholder-content">
              <div className="placeholder-icon">📝</div>
              <h3>Select a Day to Begin</h3>
              <p>Choose a day from the grid to view details or submit your report.</p>
              <div className="status-legend">
                <h4>Status Guide:</h4>
                <div className="legend-items">
                  <div className="legend-item">
                    <span className="legend-icon approved">✓</span>
                    <span>Approved</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-icon pending">⏳</span>
                    <span>Pending Review</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-icon rejected">✕</span>
                    <span>Rejected</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-icon locked">🔒</span>
                    <span>Locked</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  return (
    <div className="student-dashboard">
      <Navbar title="Student Dashboard" user={user} />

      <div className="dashboard-content">
        <nav className="dashboard-sidebar">
          <button
            className={`sidebar-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            <span className="item-label">Overview</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <span className="item-label">Profile</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'mentor' ? 'active' : ''}`}
            onClick={() => setActiveSection('mentor')}
          >
            <span className="item-label">Mentor</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveSection('submissions')}
          >
            <span className="item-label">Daily Reports</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'change-password' ? 'active' : ''}`}
            onClick={() => setActiveSection('change-password')}
          >
            <span className="item-label">Change Password</span>
          </button>
        </nav>

        <main className="dashboard-main">
          {activeSection === 'overview' ? renderOverview() : 
           activeSection === 'profile' ? renderProfile() :
           activeSection === 'mentor' ? renderMentor() :
           activeSection === 'submissions' ? renderSubmissions() : 
           renderChangePassword()}
        </main>
      </div>

      <Footer />
    </div>
  );
}