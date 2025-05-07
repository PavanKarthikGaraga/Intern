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

  useEffect(() => {
    const total = Object.entries(marks)
      .filter(([key]) => key !== 'feedback')
      .reduce((sum, [_, value]) => sum + (value || 0), 0);
    
    setTotalMarks(total);
    
    if (total >= 90) {
      setGrade('Certificate of Excellence');
    } else if (total >= 75) {
      setGrade('Certificate of Appreciation');
    } else if (total >= 60) {
      setGrade('Certificate of Participation');
    } else {
      setGrade('Not Qualified');
    }
  }, [marks]);

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
      grade
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
              <h3>External Marks: {totalMarks}/40</h3>
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