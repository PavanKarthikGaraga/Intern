import React, { useState, useEffect } from 'react';
import './page.css';

const EvaluationModal = ({ isOpen, onClose, onSubmit, student }) => {
  const [marks, setMarks] = useState({
    caseStudyReportMarks: 0,
    conductParticipationMarks: 0,
    feedback: ''
  });

  const [totalMarks, setTotalMarks] = useState(0);
  const [grade, setGrade] = useState('Not Qualified');

  // Internal marks from dailyMarks
  const internalMarks = typeof student.internalMarks === 'number' ? student.internalMarks : parseFloat(student.internalMarks) || 0;

  useEffect(() => {
    const total =
      (parseFloat(marks.caseStudyReportMarks) || 0) +
      (parseFloat(marks.conductParticipationMarks) || 0);
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
    const numValue = name === 'feedback' ? value : Math.min(30, Math.max(0, parseInt(value) || 0));
    setMarks(prev => ({ ...prev, [name]: numValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...marks,
      totalMarks,
      grade,
      internalMarks
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
              <label>Case Study Report (30 Marks)</label>
              <input
                type="number"
                name="caseStudyReportMarks"
                value={marks.caseStudyReportMarks}
                onChange={handleChange}
                min="0"
                max="30"
                required
              />
            </div>
            <div className="form-group">
              <label>Conduct & Participation (10 Marks)</label>
              <input
                type="number"
                name="conductParticipationMarks"
                value={marks.conductParticipationMarks}
                onChange={handleChange}
                min="0"
                max="10"
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