'use client';
import "./Navbar.css";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { CheckCircleOutlined, NotificationOutlined } from "@ant-design/icons";
import { Modal, Badge, Empty, Button } from "antd";
import { Bell, LogOut, Menu, X, Undo2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar({ title, user, onToggleSidebar, sidebarOpen = false }) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { exitProxy } = useAuth();
  const isProxy = Boolean(user?.impersonatedBy);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchAnnouncements();
    }
  }, [user]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/dashboard/student/announcements');
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
        setUnreadCount(data.announcements.filter(a => !a.isRead).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleLogout = async () => {
    // During an admin proxy session, "logout" returns to the admin dashboard
    if (isProxy) {
      await exitProxy();
      return;
    }
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      router.replace('/auth/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
      console.error('Logout error:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch('/api/dashboard/student/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId: id })
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(announcements.map(a => a.id === id ? { ...a, isRead: 1 } : a));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unread = announcements.filter(a => !a.isRead);
    if (unread.length === 0) return;

    try {
      await Promise.all(unread.map(a => 
        fetch('/api/dashboard/student/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ announcementId: a.id })
        })
      ));
      setAnnouncements(announcements.map(a => ({ ...a, isRead: 1 })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const initials = (user?.name || user?.username || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <header className="dashboard-header">
      <div className="header-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={Boolean(sidebarOpen)}
            aria-controls="ds-sidebar"
          >
            {sidebarOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        )}
        <img src="/klu.png" alt="KL University" className="header-logo" width={88} height={32} />
        <span className="header-divider" aria-hidden="true" />
        <h1>{title}</h1>
      </div>
      <div className="header-right">
        {user?.role === 'student' && (
          <button
            type="button"
            className="notification-bell"
            onClick={() => setIsModalOpen(true)}
            aria-label={unreadCount > 0 ? `Announcements, ${unreadCount} unread` : 'Announcements'}
          >
            <Badge count={unreadCount} overflowCount={9} size="small">
              <Bell size={20} aria-hidden="true" />
            </Badge>
          </button>
        )}
        <div className="user-chip" title={user?.name ? `${user.name} (${user?.username || ''})` : undefined}>
          <span className="user-avatar" aria-hidden="true">{initials}</span>
          <div className="user-info">
            <span className="user-name" title={user?.name}>{user?.name}</span>
            <span className="user-id">{user?.username}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className={`logout-btn ${isProxy ? 'is-proxy' : ''}`}
          aria-label={isProxy ? 'Exit proxy login and return to admin dashboard' : 'Logout'}
        >
          {isProxy ? <Undo2 size={16} aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
          <span>{isProxy ? 'Exit proxy' : 'Logout'}</span>
        </button>
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', paddingBottom: '10px', borderBottom: '1.5px solid #eee' }}>
            <NotificationOutlined style={{ color: 'rgb(151, 0, 3)' }} />
            <span>Official Announcements</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>Close</Button>,
          unreadCount > 0 && (
            <Button key="readAll" type="primary" onClick={markAllAsRead} style={{ background: '#2e7d32', borderColor: '#2e7d32' }}>
              Mark All as Read
            </Button>
          )
        ]}
        width={700}
        centered
        className="announcements-modal"
      >
        <div className="modal-content" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '10px 0' }}>
          {announcements.length === 0 ? (
            <Empty description="No announcements at the moment." style={{ padding: '40px' }} />
          ) : (
            <div className="ann-list">
              {announcements.map((ann) => (
                <div key={ann.id} className={`ann-card ${ann.isRead ? 'read' : 'unread'}`} style={{
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '15px',
                  background: ann.isRead ? '#f8f9fa' : '#fff',
                  border: ann.isRead ? '1px solid #e0e0e0' : '2px solid rgb(151, 0, 3)',
                  boxShadow: ann.isRead ? 'none' : '0 4px 12px rgba(151,0,3,0.1)',
                  position: 'relative'
                }}>
                  {!ann.isRead && <span className="unread-dot" style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'rgb(151, 0, 3)',
                    boxShadow: '0 0 8px rgb(151,0,3)'
                  }}></span>}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, color: ann.isRead ? '#555' : '#000', fontSize: '1.1rem', fontWeight: '700' }}>{ann.title}</h3>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(ann.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <p style={{ 
                    margin: '0 0 15px 0', 
                    color: ann.isRead ? '#777' : '#444', 
                    fontSize: '0.95rem', 
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {ann.description}
                  </p>
                  
                  {!ann.isRead && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        size="small" 
                        type="link" 
                        onClick={() => markAsRead(ann.id)}
                        icon={<CheckCircleOutlined />}
                        style={{ color: '#2e7d32', fontWeight: '600' }}
                      >
                        Mark as read
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <style jsx>{`
        .ann-card.unread::before {
          content: 'NEW';
          position: absolute;
          left: -10px;
          top: -10px;
          background: rgb(151, 0, 3);
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }
      `}</style>
    </header>
  );
}