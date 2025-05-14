'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { commonActivities, dailyActivities } from '@/app/Data/activities';
import './page.css';

export default function MarksPage() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username');
  const name = searchParams.get('name');
  const day = parseInt(searchParams.get('day'));
  
  console.log('Marks Modal - Day value:', day, typeof day); // Debug log

  const [checkedActivities, setCheckedActivities] = useState({});
  const [totalMarks, setTotalMarks] = useState(0);

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
    console.log('Saving marks for day:', day, typeof day); // Debug log
    if (window.opener) {
      window.opener.postMessage({ type: 'MARKS_SAVED', marks: totalMarks, day }, '*');
    }
    window.close();
  };

  const handleMarkZero = () => {
    console.log('Marking zero for day:', day, typeof day); // Debug log
    if (window.opener) {
      window.opener.postMessage({ type: 'MARKS_SAVED', marks: 0, day }, '*');
    }
    window.close();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content marks-modal">
        {/* Small username and name display */}
        <div className="marks-userinfo">
          <span className="marks-username" title={username}>{username}</span>
          {name && <span className="marks-name" title={name}>{name}</span>}
        </div>
        <div className="modal-header">
          <h2>Day {day} Activities & Marks</h2>
          <button className="close-btn" onClick={() => window.close()}>×</button>
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
            <div className="marks-buttons">
            <button className="save-marks-btn" onClick={handleSave}>
              Save Marks
            </button>
            <button className="reject-marks-btn" onClick={handleMarkZero}>
                Mark 0
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}