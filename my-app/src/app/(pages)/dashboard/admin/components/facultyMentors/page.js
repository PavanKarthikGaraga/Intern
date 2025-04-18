'use client';
import { useState, useEffect } from 'react';
import { UserOutlined, EyeOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import './page.css';

export default function FacultyMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setError(null);
        const response = await fetch('/api/dashboard/admin/facultyMentors', {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch faculty mentors');
        }

        const data = await response.json();
        if (data.success) {
          setMentors(data.mentors);
        } else {
          throw new Error(data.error || 'Failed to fetch faculty mentors');
        }
      } catch (err) {
        console.error('Error fetching faculty mentors:', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const handleViewProfile = (username) => {
    // Navigate to the faculty mentor's profile page
    window.location.href = `/dashboard/facultyMentor/profile?username=${username}`;
  };

  if (loading) {
    return <div className="loading">Loading Faculty Mentors data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!mentors || mentors.length === 0) {
    return <div>No faculty mentors available</div>;
  }

  return (
    <div className="mentors-section">
      <div className="section-header">
        <h1>Faculty Mentors</h1>
      </div>

      <div className="table-container">
        <table className="mentors-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              {/* <th>Email</th>
              <th>Phone</th>
              <th>Domain</th> */}
              <th>Total Leads</th>
              <th>Total Students</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mentors.map((mentor) => (
              <tr key={mentor.username}>
                <td>{mentor.name}</td>
                <td>{mentor.username}</td>
                {/* <td>{mentor.email}</td>
                <td>{mentor.phoneNumber}</td>
                <td>{mentor.domain}</td> */}
                <td>{mentor.totalLeads}</td>
                <td>{mentor.totalStudents}</td>
                <td>
                  <button 
                    className="view-profile-btn"
                    onClick={() => handleViewProfile(mentor.username)}
                  >
                    <EyeOutlined /> View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
