'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import './page.css';
import { FaSearch, FaUnlock, FaLock, FaEdit } from 'react-icons/fa';

export default function TaskUnlocker() {
  const [username, setUsername] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // tracks which day is in-progress
  const [msg, setMsg] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/api/dashboard/admin/unlockedTasks?username=${encodeURIComponent(username.trim())}`);
      const data = await res.json();
      if (data.success) {
        setStudentData(data);
      } else {
        setStudentData(null);
        setMsg(data.error || 'Student not found');
      }
    } catch (err) {
      setMsg('Error fetching student');
    }
    setLoading(false);
  };

  const handleToggleUnlock = async (day, isUnlocked) => {
    setActionLoading(day);
    try {
      const res = await fetch('/api/dashboard/admin/unlockedTasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: studentData.username, day, unlock: !isUnlocked })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Day ${day} ${!isUnlocked ? 'unlocked' : 'locked'} successfully`);
        setStudentData(prev => ({
          ...prev,
          unlockedDays: !isUnlocked 
            ? [...prev.unlockedDays, day] 
            : prev.unlockedDays.filter(d => d !== day)
        }));
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch (err) {
      toast.error('Network error');
    }
    setActionLoading(null);
  };

  const handleAllowEdit = async (day) => {
    const confirmed = window.confirm(
      `Allow ${studentData.name} (${studentData.username}) to re-edit and re-submit Day ${day}?\n\nThis will reset their submission status. Their survey answers will be preserved, but their Drive link and final submission flag will be cleared.`
    );
    if (!confirmed) return;

    setActionLoading(`edit-${day}`);
    try {
      const res = await fetch('/api/dashboard/admin/unlockedTasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: studentData.username, day, action: 'allowEdit' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Day ${day} reset — ${studentData.name} can now re-edit and re-submit.`);
        // Remove from submittedDays in local state so UI updates immediately
        setStudentData(prev => ({
          ...prev,
          submittedDays: prev.submittedDays.filter(d => d !== day)
        }));
      } else {
        toast.error(data.error || 'Failed to reset submission');
      }
    } catch (err) {
      toast.error('Network error');
    }
    setActionLoading(null);
  };

  return (
    <div className="task-unlocker-section">
      <div className="section-header">
        <h1>Unlock Missed Days</h1>
        <p>Grant special access for students to submit past deadlines.</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Enter student ID (e.g., 2400030001)"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="search-input"
        />
        <button type="submit" disabled={loading} className="search-btn">
          <FaSearch /> {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {msg && <p className="error-msg">{msg}</p>}

      {studentData && (
        <div className="student-details">
          <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#014a01' }}>Student: {studentData.name} ({studentData.username})</h3>
            <p style={{ margin: '0', color: '#555' }}>Slot: <strong>{studentData.slot || 'Not assigned'}</strong></p>
          </div>
          
          <div className="days-grid">
            {[1, 2, 3, 4, 5, 6, 7].map(day => {
              const isSubmitted = studentData.submittedDays.includes(day);
              const isUnlocked = studentData.unlockedDays.includes(day);
              const isActing = actionLoading === day || actionLoading === `edit-${day}`;
              
              return (
                <div key={day} className={`day-card ${isSubmitted ? 'submitted' : isUnlocked ? 'unlocked' : ''}`}>
                  <div className="day-info">
                    <h4 style={{ margin: '0 0 4px 0' }}>Day {day}</h4>
                    {isSubmitted ? (
                      <span className="status submitted">✓ Submitted</span>
                    ) : isUnlocked ? (
                      <span className="status unlocked">🔓 Unlocked by Admin</span>
                    ) : (
                      <span className="status locked">🔒 Default / Locked</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {/* Allow Edit — only for submitted days */}
                    {isSubmitted && (
                      <button
                        onClick={() => handleAllowEdit(day)}
                        disabled={isActing}
                        style={{
                          padding: '7px 14px', borderRadius: 8, border: 'none',
                          background: isActing ? '#ccc' : '#f59e0b',
                          color: '#fff', fontWeight: 600, cursor: isActing ? 'not-allowed' : 'pointer',
                          fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <FaEdit /> {isActing ? 'Resetting...' : `Allow Re-edit Day ${day}`}
                      </button>
                    )}

                    {/* Unlock / Re-lock — only for non-submitted days */}
                    {!isSubmitted && (
                      <button 
                        onClick={() => handleToggleUnlock(day, isUnlocked)}
                        disabled={isActing}
                        className={`toggle-btn ${isUnlocked ? 'lock-btn' : 'unlock-btn'}`}
                      >
                        {isUnlocked ? <><FaLock /> Re-Lock</> : <><FaUnlock /> Unlock Day {day}</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
