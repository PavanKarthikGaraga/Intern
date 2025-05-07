'use client';
import { useState, useEffect } from 'react';
import { UserOutlined, EyeOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import EditModal from '../EditModal/page';
import LeadProfile from '../leadProfile/page';
import './page.css';
import {branchNames} from '../../../../../Data/branches';

export default function StudentLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    phoneNumber: '',
    email: '',
    slot: '',
    branch: ''
  });

  useEffect(() => {
    fetchLeads();
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/dashboard/admin/studentLeads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Student lead added successfully');
        setShowModal(false);
        setFormData({
          username: '',
          name: '',
          phoneNumber: '',
          email: '',
          slot: '',
          branch: ''
        });
        fetchLeads();
      } else {
        throw new Error(data.error || 'Failed to add student lead');
      }
    } catch (err) {
      console.error('Error adding student lead:', err);
      toast.error(err.message);
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm('Are you sure you want to delete this student lead?')) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/admin/studentLeads?username=${username}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Student lead deleted successfully');
        fetchLeads();
      } else {
        throw new Error(data.error || 'Failed to delete student lead');
      }
    } catch (err) {
      console.error('Error deleting student lead:', err);
      toast.error(err.message);
    }
  };

  const handleViewProfile = (username) => {
    setSelectedProfile(username);
  };

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (result) => {
    if (result.success) {
      await fetchLeads();
    }
  };

  if (loading) {
    return <div className="loading">Loading Student Leads data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="leads-section">
      <div className="section-header">
        <h1>Student Leads</h1>
        <button 
          className="add-lead-btn"
          onClick={() => setShowModal(true)}
        >
          <PlusOutlined /> Add New Lead
        </button>
      </div>

      <div className="table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
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
                <td>Slot {lead.slot}</td>
                <td>{lead.facultyMentorName || 'Not Assigned'}</td>
                <td>{lead.totalStudents}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditLead(lead)}
                    >
                      <EditOutlined /> Edit
                    </button>
                    <button 
                      className="view-profile-btn"
                      onClick={() => handleViewProfile(lead.username)}
                    >
                      <EyeOutlined /> View Profile
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(lead.username)}
                    >
                      <DeleteOutlined /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Student Lead</h2>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Branch</label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Branch</option>
                  {branchNames.map((branch) => (
                    <option key={branch.id} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Slot</label>
                <select
                  name="slot"
                  value={formData.slot}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Slot</option>
                  <option value="1">Slot 1</option>
                  <option value="2">Slot 2</option>
                  <option value="3">Slot 3</option>
                  <option value="4">Slot 4</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  Add Student Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <EditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          data={selectedLead}
          type="studentLeads"
          onSave={handleSaveEdit}
        />
      )}

      {selectedProfile && (
        <LeadProfile
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          username={selectedProfile}
        />
      )}
    </div>
  );
}
