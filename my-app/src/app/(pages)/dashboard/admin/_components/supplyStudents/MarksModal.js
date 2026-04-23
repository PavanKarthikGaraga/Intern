import { useState, useEffect } from 'react';
import { commonActivities, dailyActivities } from '@/app/Data/activities';
import './page.css';

export default function MarksModal({ day, onClose, onSave, initialMarks = 0, initialRemarks = '' }) {
  const [checkedActivities, setCheckedActivities] = useState({});
  const [totalMarks, setTotalMarks] = useState(initialMarks);
  const [remarks, setRemarks] = useState(initialRemarks);
  const [remarksError, setRemarksError] = useState('');

  // Helper to get all keys for the current day
  const getAllKeysForDay = () => {
    const keys = [];
    commonActivities.forEach(activity => keys.push(`common-${activity.id}`));
    const dayActs = dailyActivities.find(d => d.day === day)?.activities || [];
    dayActs.forEach(activity => keys.push(`daily-${day}-${activity.id}`));
    return keys;
  };

  const allKeys = getAllKeysForDay();
  const allChecked = allKeys.every(key => checkedActivities[key]);
  const someChecked = allKeys.some(key => checkedActivities[key]);

  const handleSelectAll = (checked) => {
    const newChecked = { ...checkedActivities };
    allKeys.forEach(key => {
      newChecked[key] = checked;
    });
    setCheckedActivities(newChecked);
  };

  const handleActivityCheck = (key, checked) => {
    setCheckedActivities(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  useEffect(() => {
    let total = 0;
    commonActivities.forEach(activity => {
      if (checkedActivities[`common-${activity.id}`]) {
        total += activity.marks;
      }
    });
    const dayActivities = dailyActivities.find(d => d.day === day)?.activities || [];
    dayActivities.forEach(activity => {
      if (checkedActivities[`daily-${day}-${activity.id}`]) {
        total += activity.marks || 0;
      }
    });
    setTotalMarks(total);
  }, [checkedActivities, day]);

  const handleSave = () => {
    if (!remarks.trim()) {
      setRemarksError('Remarks are required');
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

  const handleMarkZero = () => {
    if (!remarks.trim()) {
      setRemarksError('Remarks are required');
      return;
    }
    if (onSave) {
      onSave(0, remarks);
    } else if (window.opener) {
      window.opener.postMessage({ type: 'MARKS_SAVED', day, totalMarks: 0, remarks }, '*');
      window.close();
      return;
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content marks-modal">
        <div className="modal-header">
          <h2>Day {day} Activities & Marks</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="activities-checklist">
            <div className="activity-item">
              <label>
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                  onChange={e => handleSelectAll(e.target.checked)}
                />
                Select All
              </label>
            </div>
            {/* Common Activities */}
            {commonActivities.slice(0, 4).map(activity => (
              <div key={activity.id} className="activity-item">
                <label>
                  <input
                    type="checkbox"
                    checked={checkedActivities[`common-${activity.id}`] || false}
                    onChange={e => handleActivityCheck(`common-${activity.id}`, e.target.checked)}
                  />
                  {activity.title} ({activity.marks})
                </label>
              </div>
            ))}
            {/* Daily Activities (first) */}
            {dailyActivities.find(d => d.day === day)?.activities.slice(0, 1).map(activity => (
              <div key={activity.id} className="activity-item">
                <label>
                  <input
                    type="checkbox"
                    checked={checkedActivities[`daily-${day}-${activity.id}`] || false}
                    onChange={e => handleActivityCheck(`daily-${day}-${activity.id}`, e.target.checked)}
                  />
                  {activity.title} ({activity.marks || 0})
                </label>
              </div>
            ))}
            {/* Common Activities (contd.) */}
            {commonActivities.slice(4, 7).map(activity => (
              <div key={activity.id} className="activity-item">
                <label>
                  <input
                    type="checkbox"
                    checked={checkedActivities[`common-${activity.id}`] || false}
                    onChange={e => handleActivityCheck(`common-${activity.id}`, e.target.checked)}
                  />
                  {activity.title} ({activity.marks})
                </label>
              </div>
            ))}
            {/* Daily Activities (contd.) */}
            {dailyActivities.find(d => d.day === day)?.activities.slice(1).map(activity => (
              <div key={activity.id} className="activity-item">
                <label>
                  <input
                    type="checkbox"
                    checked={checkedActivities[`daily-${day}-${activity.id}`] || false}
                    onChange={e => handleActivityCheck(`daily-${day}-${activity.id}`, e.target.checked)}
                  />
                  {activity.title} ({activity.marks || 0})
                </label>
              </div>
            ))}
          </div>
          <div className="marks-summary">
            <div className="total-marks-display">
              Total Marks: <span>{totalMarks} / 8.5</span>
            </div>
            <textarea
              className="remarks-textarea"
              placeholder="Enter remarks (required)"
              value={remarks}
              onChange={e => { setRemarks(e.target.value); setRemarksError(''); }}
              rows={3}
              style={{ width: '100%', marginTop: 10, borderRadius: 6, border: '1px solid #ccc', padding: 8 }}
            />
            {remarksError && <div style={{ color: 'red', fontSize: 13 }}>{remarksError}</div>}
            <div className="marks-actions">
              <button className="save-marks-btn" onClick={handleSave}>
                Save Marks
              </button>
              <button 
                className="mark-zero-btn"
                onClick={handleMarkZero}
              >
                Mark 0
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 