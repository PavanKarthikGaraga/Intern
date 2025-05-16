import React, { useState, useEffect } from 'react';
import './page.css';

const EvaluationModal = ({ isOpen, onClose, onSubmit, student }) => {
  const [marks, setMarks] = useState({
    finalReport: 0,
    finalPresentation: 0,
    feedback: ''
  });

  const [totalMarks, setTotalMarks] = useState(0);
  const [grade, setGrade] = useState('Not Qualified');

  // Internal marks from dailyMarks
  // Ensure internalMarks is a number
const internalMarks = Number(student.internalMarks) || 0;


  useEffect(() => {
    const total = (parseInt(marks.finalReport) || 0) + (parseInt(marks.finalPresentation) || 0);
    setTotalMarks(internalMarks + total);
    if (internalMarks + total >= 90) {
      setGrade('Certificate of Excellence');
    } else if (internalMarks + total >= 75) {
      setGrade('Certificate of Appreciation');
    } else if (internalMarks + total >= 60) {
      setGrade('Certificate of Participation');
    } else {
      setGrade('Not Qualified');
    }
  }, [marks, internalMarks]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'finalPresentation') {
      const numValue = Math.min(15, Math.max(0, parseInt(value) || 0));
      setMarks(prev => ({ ...prev, [name]: numValue }));
    } else if (name === 'finalReport') {
      const numValue = Math.min(25, Math.max(0, parseInt(value) || 0));
      setMarks(prev => ({ ...prev, [name]: numValue }));
    } else {
      setMarks(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      finalReportMarks: marks.finalReport,
      finalPresentationMarks: marks.finalPresentation,
      feedback: marks.feedback
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Evaluate Final Report - {student?.name}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="evaluation-form">
            <div className="form-group">
              <label>Internal Marks (Daily Submissions, out of 60)</label>
              <input
                type="number"
                value={internalMarks}
                readOnly
                style={{ background: '#f5f5f5', color: '#333', fontWeight: 600 }}
              />
            </div>
            <div className="form-group">
              <label>Final Report (25 Marks)</label>
              <input
                type="number"
                name="finalReport"
                value={marks.finalReport}
                onChange={handleChange}
                min="0"
                max="25"
                required
              />
            </div>
            <div className="form-group">
              <label>Final Presentation (15 Marks)</label>
              <input
                type="number"
                name="finalPresentation"
                value={marks.finalPresentation}
                onChange={handleChange}
                min="0"
                max="15"
                required
              />
            </div>
            <div className="form-group">
              <label>Feedback</label>
              <textarea
                name="feedback"
                value={marks.feedback}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>
            <div className="total-section">
              <h3>Total Marks: {totalMarks}/100</h3>
              <h3>Grade: {grade}</h3>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="submit">Submit Evaluation</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluationModal; 