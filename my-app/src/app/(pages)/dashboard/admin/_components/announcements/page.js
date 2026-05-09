'use client';
import { useState, useEffect } from 'react';
import { PlusOutlined, DeleteOutlined, NotificationOutlined, SendOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/dashboard/admin/announcements');
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
      } else {
        toast.error(data.error || 'Failed to fetch announcements');
      }
    } catch (err) {
      toast.error('Error fetching announcements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.description) {
      toast.error('Title and description are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnnouncement)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Announcement published successfully');
        setNewAnnouncement({ title: '', description: '' });
        fetchAnnouncements();
      } else {
        toast.error(data.error || 'Failed to publish announcement');
      }
    } catch (err) {
      toast.error('Error publishing announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const res = await fetch(`/api/dashboard/admin/announcements?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Announcement deleted');
        fetchAnnouncements();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Error deleting announcement');
    }
  };

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="announcements-admin">
      <div className="section-header">
        <h1>Announcements Management</h1>
        <p>Send important updates and notifications to all students</p>
      </div>

      <div className="admin-card publish-form">
        <h3><NotificationOutlined /> Create New Announcement</h3>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Announcement Title</label>
            <input 
              type="text" 
              placeholder="e.g., Slot 1 Report Submission Deadline Extended"
              value={newAnnouncement.title}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description / Detailed Message</label>
            <textarea 
              placeholder="Provide all necessary details here..."
              value={newAnnouncement.description}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, description: e.target.value })}
              rows={5}
              required
            />
          </div>
          <button type="submit" className="publish-btn" disabled={isSubmitting}>
            <SendOutlined /> {isSubmitting ? 'Publishing...' : 'Publish to Students'}
          </button>
        </form>
      </div>

      <div className="admin-card history">
        <h3>Recent Announcements</h3>
        {announcements.length === 0 ? (
          <p className="no-data">No announcements sent yet.</p>
        ) : (
          <div className="announcements-list">
            {announcements.map((ann) => (
              <div key={ann.id} className="announcement-item">
                <div className="ann-content">
                  <div className="ann-header">
                    <h4>{ann.title}</h4>
                    <span className="ann-date">{new Date(ann.created_at).toLocaleString()}</span>
                  </div>
                  <p>{ann.description}</p>
                </div>
                <button className="delete-btn" onClick={() => handleDelete(ann.id)}>
                  <DeleteOutlined />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .announcements-admin {
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .admin-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          margin-bottom: 30px;
          border: 1px solid #eee;
        }
        .admin-card h3 {
          margin-bottom: 20px;
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #444;
        }
        .form-group input, .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1.5px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }
        .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: rgb(151, 0, 3);
        }
        .publish-btn {
          background: rgb(151, 0, 3);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
        }
        .publish-btn:hover:not(:disabled) {
          background: #a80003;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(151,0,3,0.3);
        }
        .publish-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .announcement-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          border: 1px solid #f0f0f0;
          border-radius: 10px;
          margin-bottom: 15px;
          background: #fafafa;
        }
        .ann-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
          gap: 20px;
        }
        .ann-header h4 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.1rem;
        }
        .ann-date {
          font-size: 0.8rem;
          color: #888;
          white-space: nowrap;
        }
        .ann-content p {
          margin: 0;
          color: #666;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        .delete-btn {
          color: #ff4d4f;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          font-size: 1.1rem;
          transition: transform 0.2s;
        }
        .delete-btn:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}
