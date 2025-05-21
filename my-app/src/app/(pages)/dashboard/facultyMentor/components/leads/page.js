'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import './page.css';

export default function Leads({ user }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/dashboard/facultyMentor/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user?.username })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }

      const data = await response.json();
      if (data.success) {
        console.log(data.leads);
        setLeads(data.leads);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads when component mounts and when user changes
  useEffect(() => {
    if (user?.username) {
      fetchLeads();
    }
  }, [user?.username]);

  const handleFetchNewLeads = async () => {
    setFetching(true);
    try {
      const response = await fetch('/api/dashboard/facultyMentor/fetchLeads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch new leads');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(`Successfully fetched ${data.leads.length} new leads`);
        // Refresh the leads list after fetching new ones
        await fetchLeads();
      }
    } catch (err) {
      console.error('Error fetching new leads:', err);
      toast.error(err.message);
    } finally {
      setFetching(false);
      setShowConfirmDialog(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="leads-section">
      <div className="section-header">
        <h1>Your Student Leads</h1>
        <div className="header-actions">
          <div className="total-leads">
            Total Leads: {leads.length}/2
          </div>
          {leads.length < 2 && (
            <button 
              className="fetch-btn"
              onClick={() => setShowConfirmDialog(true)}
              disabled={fetching}
            >
              {fetching ? 'Fetching...' : 'Fetch New Leads'}
            </button>
          )}
        </div>
      </div>
      
      <div className="table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>ID</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Slot</th>
              {/* <th>Students</th> */}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.username}>
                <td>{lead.name}</td>
                <td>{lead.username}</td>
                <td>{lead.email}</td>
                <td>{lead.phoneNumber}</td>
                <td>{lead.slot}</td>
                {/* <td>
                  <div className="student-count">
                    {Object.values(lead).filter(value => 
                      typeof value === 'string' && 
                      value.startsWith('student') && 
                      value.endsWith('Username') && 
                      lead[value]
                    ).length}/30
                  </div>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showConfirmDialog && (
        <div className="modal-overlay">
          <div className="confirm-dialog">
            <h2>Fetch New Leads</h2>
            <p>Are you sure you want to fetch new student leads? This will assign up to 2 new leads to you.</p>
            <div className="dialog-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowConfirmDialog(false)}
                disabled={fetching}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={handleFetchNewLeads}
                disabled={fetching}
              >
                {fetching ? 'Fetching...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 