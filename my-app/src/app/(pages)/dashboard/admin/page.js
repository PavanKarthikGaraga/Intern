'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
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

const COLORS = ['#2e7d32', '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    completedStudents: 0,
    domainStats: {},
    facultyStats: {}
  });
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('analytics');
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    idNumber: '',
    password: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, facultyResponse] = await Promise.all([
        fetch('/api/dashboard/admin/stats'),
        fetch('/api/dashboard/admin/faculty')
      ]);

      if (!statsResponse.ok || !facultyResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsResponse.json();
      const facultyData = await facultyResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
      if (facultyData.success) {
        setFacultyList(facultyData.faculty);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      toast.error('Failed to load dashboard data');
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

  if (!user || user.role !== 'admin') {
    return <div className="error">Access denied. Admin privileges required.</div>;
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const domainData = Object.entries(stats.domainStats).map(([name, value]) => ({
    name,
    value
  }));

  const facultyData = Object.entries(stats.facultyStats).map(([name, value]) => ({
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
          <h2>Students by Faculty</h2>
          <BarChart width={400} height={300} data={facultyData}>
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
        <h2>Faculty Management</h2>
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
              <th>Students Assigned</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facultyList.map((faculty) => (
              <tr key={faculty.idNumber}>
                <td>{faculty.name}</td>
                <td>{faculty.idNumber}</td>
                <td>{stats.facultyStats[faculty.name] || 0}</td>
                <td>
                  <button className="action-btn edit">Edit</button>
                  <button className="action-btn delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Admin Dashboard</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span>{user?.name}</span>
            <span className="user-id">ID: {user?.idNumber}</span>
          </div>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <button
            className={`sidebar-item ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveSection('analytics')}
          >
            <span className="item-icon">📊</span>
            <span>Analytics</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'faculty' ? 'active' : ''}`}
            onClick={() => setActiveSection('faculty')}
          >
            <span className="item-icon">👥</span>
            <span>Faculty Management</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {activeSection === 'analytics' ? renderAnalytics() : renderFacultyManagement()}
        </main>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© 2024 Smart Village Revolution. All Rights Reserved.</p>
        <p>Designed and Developed by ZeroOne CodeClub</p>
      </footer>
    </div>
  );
}