'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import toast from 'react-hot-toast';
import './page.css';
import Loader from '@/app/components/loader/loader';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const COLORS = ['#2e7d32', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    completedStudents: 0,
    domainStats: {},
    branchStats: {}
  });
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('analytics');
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [studentsList, setStudentsList] = useState([]);
  const [mentorsList, setMentorsList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    idNumber: '',
    password: ''
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch faculty list
      const facultyResponse = await fetch('/api/dashboard/admin/faculty');
      if (!facultyResponse.ok) throw new Error('Failed to fetch faculty list');
      const facultyData = await facultyResponse.json();
      if (facultyData.success) {
        setFacultyList(facultyData.faculty);
      }

      const [statsResponse, studentsResponse, mentorsResponse] = await Promise.all([
        fetch('/api/dashboard/admin/stats'),
        fetch('/api/dashboard/admin/students'),
        fetch('/api/dashboard/admin/mentors')
      ]);

      if (!statsResponse.ok || !studentsResponse.ok || !mentorsResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsResponse.json();
      const studentsData = await studentsResponse.json();
      const mentorsData = await mentorsResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
      if (studentsData.success) {
        setStudentsList(studentsData.students);
      }
      if (mentorsData.success) {
        setMentorsList(mentorsData.mentors);
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/dashboard/admin/faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFaculty)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Faculty added successfully');
        setShowAddFaculty(false);
        setNewFaculty({ name: '', idNumber: '', password: '' });
        fetchDashboardData();
      } else {
        throw new Error(data.error || 'Failed to add faculty');
      }
    } catch (error) {
      console.error('Error adding faculty:', error);
      toast.error(error.message || 'Failed to add faculty');
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const handleEditStudent = (studentId) => {
    window.location.href = `/dashboard/admin/students/${studentId}/edit`;
  };

  const handleViewMentor = (mentor) => {
    setSelectedMentor(mentor);
    setShowMentorModal(true);
  };

  const handleEditMentor = (mentorId) => {
    window.location.href = `/dashboard/admin/mentors/${mentorId}/edit`;
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
        setShowChangePassword(false);
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

  const handleDeleteFaculty = async (idNumber) => {
    try {
      const response = await fetch(`/api/dashboard/admin/faculty?idNumber=${idNumber}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Faculty deleted successfully');
        setFacultyList(facultyList.filter(faculty => faculty.idNumber !== idNumber));
      } else {
        throw new Error(data.error || 'Failed to delete faculty');
      }
    } catch (error) {
      console.error('Error deleting faculty:', error);
      toast.error(error.message || 'Failed to delete faculty');
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="error">Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const domainData = Object.entries(stats.domainStats || {}).map(([name, value]) => ({
    name,
    value
  }));

  const branchData = Object.entries(stats.branchStats || {}).map(([name, value]) => ({
    name,
    value
  }));

  const renderAnalytics = () => (
    <div className="analytics-section">
      <div className="stats-overview">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p>{stats.totalStudents}</p>
        </div>
        <div className="stat-card">
          <h3>Completed Students</h3>
          <p>{stats.completedStudents}</p>
        </div>
        <div className="stat-card">
          <h3>Completion Rate</h3>
          <p>{((stats.completedStudents / stats.totalStudents) * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <h2>Students by Domain</h2>
          <PieChart width={400} height={300}>
            <Pie
              data={domainData}
              cx={200}
              cy={150}
              labelLine={false}
              outerRadius={80}
              fill="#2e7d32"
              dataKey="value"
            >
              {domainData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div className="chart-container">
          <h2>Students by Branch</h2>
          <BarChart width={400} height={300} data={branchData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#c8e6c9" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#2e7d32" />
          </BarChart>
        </div>
      </div>
    </div>
  );

  const renderFacultyManagement = () => (
    <div className="faculty-management">
      <div className="section-header">
        <h2>Faculties</h2>
        <button 
          className="add-faculty-btn"
          onClick={() => setShowAddFaculty(true)}
        >
          Add New Faculty
        </button>
      </div>

      {showAddFaculty && (
        <div className="add-faculty-modal">
          <form onSubmit={handleAddFaculty}>
            <h3>Add New Faculty</h3>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={newFaculty.name}
                onChange={(e) => setNewFaculty({...newFaculty, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>ID Number:</label>
              <input
                type="text"
                value={newFaculty.idNumber}
                onChange={(e) => setNewFaculty({...newFaculty, idNumber: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={newFaculty.password}
                onChange={(e) => setNewFaculty({...newFaculty, password: e.target.value})}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">Add Faculty</button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowAddFaculty(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="faculty-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>ID Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facultyList.map((faculty) => (
              <tr key={faculty.idNumber}>
                <td>{faculty.name}</td>
                <td>{faculty.idNumber}</td>
                <td>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDeleteFaculty(faculty.idNumber)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStudentModal = () => {
    if (!selectedStudent) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Student Details</h2>
            <button className="close-btn" onClick={() => setShowStudentModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="info-section">
              <h3>Basic Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name</label>
                  <span>{selectedStudent.name}</span>
                </div>
                <div className="info-item">
                  <label>Roll Number</label>
                  <span>{selectedStudent.idNumber}</span>
                </div>
                <div className="info-item">
                  <label>Branch</label>
                  <span>{selectedStudent.branch}</span>
                </div>
                <div className="info-item">
                  <label>Year</label>
                  <span>{selectedStudent.year}</span>
                </div>
                <div className="info-item">
                  <label>Email</label>
                  <span>{selectedStudent.email}</span>
                </div>
                <div className="info-item">
                  <label>Phone</label>
                  <span>{selectedStudent.phone}</span>
                </div>
                <div className="info-item">
                  <label>Domain</label>
                  <span>{selectedStudent.domain}</span>
                </div>
                <div className="info-item">
                  <label>Status</label>
                  <span className={`status-badge ${selectedStudent.status.toLowerCase()}`}>
                    {selectedStudent.status}
                  </span>
                </div>
                <div className="info-item">
                  <label>Mentor</label>
                  <span>{selectedStudent.mentorName || 'Not Assigned'}</span>
                </div>
              </div>
            </div>
            <div className="info-section">
              <h3>Daily Reports</h3>
              <div className="reports-grid">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="report-item">
                    <label>Day {index + 1}</label>
                    {selectedStudent.reports?.[index] ? (
                      <a 
                        href={selectedStudent.reports[index]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="report-link"
                      >
                        View Report
                      </a>
                    ) : (
                      <span className="report-not-submitted">Not Submitted</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMentorModal = () => {
    if (!selectedMentor) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowMentorModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Mentor Details</h2>
            <button className="close-btn" onClick={() => setShowMentorModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="info-section">
              <h3>Basic Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name</label>
                  <span>{selectedMentor.name}</span>
                </div>
                <div className="info-item">
                  <label>ID</label>
                  <span>{selectedMentor.mentorId}</span>
                </div>
                <div className="info-item">
                  <label>Domain</label>
                  <span>{selectedMentor.domain}</span>
                </div>
                <div className="info-item">
                  <label>Students Assigned</label>
                  <span>{selectedMentor.studentsAssigned}</span>
                </div>
              </div>
            </div>
            <div className="info-section">
              <h3>Assigned Students</h3>
              <div className="students-list">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Roll Number</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMentor.assignedStudents?.map((student) => (
                      <tr key={student.idNumber}>
                        <td>{student.name}</td>
                        <td>{student.idNumber}</td>
                        <td>
                          <span className={`status-badge ${student.status.toLowerCase()}`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!selectedMentor.assignedStudents?.length && (
                      <tr>
                        <td colSpan="3" className="no-students">No students assigned</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentsList = () => (
    <div className="students-section">
      <div className="section-header">
        <h2>Students List</h2>
      </div>
      <div className="students-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll Number</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {studentsList.map((student) => (
              <tr key={student.idNumber}>
                <td>{student.name}</td>
                <td>{student.idNumber}</td>
                <td>{student.branch}</td>
                <td>
                  <span className={`status-badge ${student.status.toLowerCase()}`}>
                    {student.status}
                  </span>
                </td>
                <td>
                  <button 
                    className="action-btn view"
                    onClick={() => handleViewStudent(student)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMentorsList = () => (
    <div className="mentors-section">
      <div className="section-header">
        <h2>Mentors List</h2>
      </div>
      <div className="mentors-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Domain</th>
              <th>Students Assigned</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mentorsList.map((mentor) => (
              <tr key={mentor.mentorId}>
                <td>{mentor.name}</td>
                <td>{mentor.domain}</td>
                <td>{mentor.domain}</td>
                <td>{mentor.studentsAssigned}</td>
                <td>
                  <button 
                    className="action-btn view"
                    onClick={() => handleViewMentor(mentor)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

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

  return (
    <div className="admin-dashboard">
      <Navbar title="Admin Dashboard" user={user} />

      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <button
            className={`sidebar-item ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveSection('analytics')}
          >
            <span>Analytics</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'faculty' ? 'active' : ''}`}
            onClick={() => setActiveSection('faculty')}
          >
            <span>Faculty Management</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => setActiveSection('students')}
          >
            <span>Students</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'mentors' ? 'active' : ''}`}
            onClick={() => setActiveSection('mentors')}
          >
            <span>Mentors</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'change-password' ? 'active' : ''}`}
            onClick={() => setActiveSection('change-password')}
          >
            <span>Change Password</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {activeSection === 'analytics' ? renderAnalytics() : 
           activeSection === 'faculty' ? renderFacultyManagement() : 
           activeSection === 'students' ? renderStudentsList() : 
           activeSection === 'mentors' ? renderMentorsList() :
           renderChangePassword()}
        </main>
      </div>

      <Footer />

      {/* Modals */}
      {showStudentModal && renderStudentModal()}
      {showMentorModal && renderMentorModal()}
    </div>
  );
}