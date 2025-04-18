'use client';
import { useState, useEffect } from 'react';
import { UserOutlined, EyeOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import './page.css';

export default function StudentLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setError(null);
        const response = await fetch('/api/dashboard/admin/studentLeads', {
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch student leads');
        }

        const data = await response.json();
        if (data.success) {
          setLeads(data.leads);
        } else {
          throw new Error(data.error || 'Failed to fetch student leads');
        }
      } catch (err) {
        console.error('Error fetching student leads:', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const handleViewProfile = (username) => {
    // Navigate to the student lead's profile page
    window.location.href = `/dashboard/studentLead/profile?username=${username}`;
  };

  if (loading) {
    return <div className="loading">Loading Student Leads data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!leads || leads.length === 0) {
    return <div>No student leads available</div>;
  }

  return (
    <div className="leads-section">
      <div className="section-header">
        <h1>Student Leads</h1>
      </div>

      <div className="table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              {/* <th>Email</th> */}
              {/* <th>Phone</th> */}
              <th>Slot</th>
              <th>Faculty Mentor</th>
              <th>Total Students</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.username}>
                <td>{lead.name}</td>
                <td>{lead.username}</td>
                {/* <td>{lead.email}</td> */}
                {/* <td>{lead.phoneNumber}</td> */}
                <td>Slot {lead.slot}</td>
                <td>{lead.facultyMentorName || 'Not Assigned'}</td>
                <td>{lead.totalStudents}</td>
                <td>
                  <button 
                    className="view-profile-btn"
                    onClick={() => handleViewProfile(lead.username)}
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
