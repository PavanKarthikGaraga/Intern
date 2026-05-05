'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import './page.css';

const MAX_MARKS_MAPPING = {
  1: 10,
  2: 5,
  3: 5,
  4: 5,
  5: 15,
  6: 20,
  7: 40
};

function MarksContent() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username');
  const name = searchParams.get('name');
  const day = parseInt(searchParams.get('day'));
  
  const [totalMarks, setTotalMarks] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const maxMarks = MAX_MARKS_MAPPING[day] || 10;

  const handleSave = () => {
    if (totalMarks < 0 || totalMarks > maxMarks) {
      setError(`Marks must be between 0 and ${maxMarks}`);
      return;
    }
    if (window.opener) {
      window.opener.postMessage({ 
        type: 'MARKS_SAVED', 
        marks: totalMarks, 
        day,
        message 
      }, '*');
    }
    window.close();
  };

  const handleMarkZero = () => {
    if (window.opener) {
      window.opener.postMessage({ 
        type: 'MARKS_SAVED', 
        marks: 0, 
        day,
        message 
      }, '*');
    }
    window.close();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content marks-modal" style={{ maxWidth: 420, padding: '24px 32px', textAlign: 'center', borderRadius: 16 }}>
        <div className="marks-userinfo" style={{ marginBottom: 12 }}>
          <span className="marks-username" title={username} style={{ color: '#888', fontSize: '0.85rem' }}>{username}</span>
          {name && <span className="marks-name" title={name} style={{ display: 'block', fontWeight: 600, color: '#333' }}>{name}</span>}
        </div>
        <div className="modal-header" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.4rem', color: '#014a01', margin: 0 }}>Day {day} Evaluation</h2>
          <button className="close-btn" onClick={() => window.close()} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ color: '#555', marginBottom: 20, fontSize: '0.95rem' }}>
            Enter marks for Day {day} based on the Evaluation Plan.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <label style={{ fontWeight: 600, fontSize: '1.1rem', color: '#333' }}>
              Marks Awarded
            </label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <input 
                type="number" 
                value={totalMarks} 
                onChange={(e) => { setTotalMarks(Number(e.target.value)); setError(''); }}
                min={0}
                max={maxMarks}
                step={0.5}
                style={{ 
                  width: 90, padding: '12px', fontSize: '1.4rem', 
                  textAlign: 'center', border: '2px solid #ccc', borderRadius: 8, outline: 'none' 
                }}
              />
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#888' }}>
                / {maxMarks}
              </span>
            </div>
          </div>
          
          <div style={{ marginBottom: 20, textAlign: 'left' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#333', display: 'block', marginBottom: 8 }}>
              Remarks / Message (Optional)
            </label>
            <textarea
              className="message-textarea"
              placeholder="Add a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              style={{ width: '100%', borderRadius: 8, border: '1px solid #ccc', padding: 12, outline: 'none', resize: 'vertical' }}
            />
          </div>

          {error && <div style={{ color: '#d32f2f', fontSize: '0.9rem', marginBottom: 16, background: '#fdecea', padding: '8px', borderRadius: '6px' }}>{error}</div>}
          
          <div className="marks-buttons" style={{ display: 'flex', gap: 12 }}>
            <button className="save-marks-btn" onClick={handleSave} style={{ flex: 1, padding: '12px', fontSize: '1rem', background: '#014a01', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              Save Marks
            </button>
            <button className="reject-marks-btn" onClick={handleMarkZero} style={{ flex: 1, padding: '12px', fontSize: '1rem', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              Mark 0
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarksPage() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <MarksContent />
    </Suspense>
  );
}