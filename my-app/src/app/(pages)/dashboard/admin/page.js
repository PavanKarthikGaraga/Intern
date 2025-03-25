'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
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
import './page.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    completedStudents: 0,
    domainStats: {},
    facultyStats: {}
  });
  const [facultyList, setFacultyList] = useState([]);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    idNumber: '',
    password: ''
  });
  const [showAddFaculty, setShowAddFaculty] = useState(false);

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

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>

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
              fill="#8884d8"
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
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </div>
      </div>

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
              {/* <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newFaculty.email}
                  onChange={(e) => setNewFaculty({...newFaculty, email: e.target.value})}
                  required
                />
              </div> */}
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
                {/* <th>Email</th> */}
                <th>Students Assigned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facultyList.map((faculty) => (
                <tr key={faculty.idNumber}>
                  <td>{faculty.name}</td>
                  <td>{faculty.idNumber}</td>
                  {/* <td>{faculty.email}</td> */}
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
    </div>
  );
}