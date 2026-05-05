import { useState } from 'react';
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

export default function MarksModal({ day, onClose, onSave, initialMarks = 0, initialRemarks = '', showRemarks = false }) {
  const [totalMarks, setTotalMarks] = useState(initialMarks);
  const [remarks, setRemarks] = useState(initialRemarks);
  const [error, setError] = useState('');
  
  const maxMarks = MAX_MARKS_MAPPING[day] || 10;

  const handleSave = () => {
    if (totalMarks < 0 || totalMarks > maxMarks) {
      setError(`Marks must be between 0 and ${maxMarks}`);
      return;
    }
    if (showRemarks && !remarks.trim()) {
      setError('Remarks are required');
      return;
    }
    
    if (onSave) {
      onSave(totalMarks, remarks);
    } else if (window.opener) {
      window.opener.postMessage({ type: 'MARKS_SAVED', day, totalMarks, remarks }, '*');
      window.close();
      return;
    }
    onClose();
  };

  const handleReject = () => {
    if (showRemarks && !remarks.trim()) {
      setError('Remarks are required to reject');
      return;
    }
    if (window.opener) {
      window.opener.postMessage({ type: 'MARKS_REJECTED', day, remarks }, '*');
      window.close();
      return;
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content marks-modal" style={{ maxWidth: 420, padding: '24px 32px', textAlign: 'center', borderRadius: 16 }}>
        <div className="modal-header" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.4rem', color: '#014a01', margin: 0 }}>Day {day} Evaluation</h2>
          <button className="close-btn" onClick={onClose} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
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
          
          {showRemarks && (
            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#333', display: 'block', marginBottom: 8 }}>
                Remarks (Required)
              </label>
              <textarea
                className="remarks-textarea"
                placeholder="Enter remarks here..."
                value={remarks}
                onChange={e => { setRemarks(e.target.value); setError(''); }}
                rows={3}
                style={{ width: '100%', borderRadius: 8, border: '1px solid #ccc', padding: 12, outline: 'none', resize: 'vertical' }}
              />
            </div>
          )}

          {error && <div style={{ color: '#d32f2f', fontSize: '0.9rem', marginBottom: 16, background: '#fdecea', padding: '8px', borderRadius: '6px' }}>{error}</div>}
          
          <div className="marks-summary" style={{ display: 'flex', gap: 12 }}>
            <button className="save-marks-btn" onClick={handleSave} style={{ flex: 1, padding: '12px', fontSize: '1rem', background: '#014a01', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              Save Marks
            </button>
            <button className="reject-marks-btn" onClick={handleReject} style={{ flex: 1, padding: '12px', fontSize: '1rem', background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              Reject / Absent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}