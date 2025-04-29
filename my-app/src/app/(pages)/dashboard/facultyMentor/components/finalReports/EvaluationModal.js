import React, { useState, useEffect } from 'react';
import './page.css';

const EvaluationModal = ({ isOpen, onClose, onSubmit, student }) => {
  const [marks, setMarks] = useState({
    attendanceMarks: 20,
    taskCompletionMarks: 0,
    problemIdentificationMarks: 0,
    creativeWorkMarks: 0,
    finalReportMarks: 0,
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
    const numValue = name === 'feedback' ? value : Math.min(20, Math.max(0, parseInt(value) || 0));
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
              <label>Daily Attendance and Active Participation (20 Marks)</label>
              <input
                type="number"
                name="attendanceMarks"
                value={marks.attendanceMarks}
                onChange={handleChange}
                min="0"
                max="20"
                required
                defaultValue={20}
                />
            </div>
            <div className="form-group">
              <label>Task and Field Work Completion (20 Marks)</label>
              <input
                type="number"
                name="taskCompletionMarks"
                value={marks.taskCompletionMarks}
                onChange={handleChange}
                min="0"
                max="20"
                required
              />
            </div>
            <div className="form-group">
              <label>Problem Identification (20 Marks)</label>
              <input
                type="number"
                name="problemIdentificationMarks"
                value={marks.problemIdentificationMarks}
                onChange={handleChange}
                min="0"
                max="20"
                required
              />
            </div>
            <div className="form-group">
              <label>Creative and Quality Work (20 Marks)</label>
              <input
                type="number"
                name="creativeWorkMarks"
                value={marks.creativeWorkMarks}
                onChange={handleChange}
                min="0"
                max="20"
                required
              />
            </div>
            <div className="form-group">
              <label>Final Report and Presentation (20 Marks)</label>
              <input
                type="number"
                name="finalReportMarks"
                value={marks.finalReportMarks}
                onChange={handleChange}
                min="0"
                max="20"
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