'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function Submissions({ user }) {
  const [submissions, setSubmissions] = useState(Array(8).fill(false));
  const [student, setStudent] = useState('');
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [submittedLinks, setSubmittedLinks] = useState({});
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data when component mounts
  useEffect(() => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        console.log('Fetching data for student:', user.username);

        // Fetch student details
        const response = await fetch('/api/dashboard/student/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received student data:', data);

        if (data.success && data.student) {
          setStudent(data.student);
        } else {
          throw new Error(data.error || 'Failed to fetch student data');
        }

        // Fetch submitted reports
        const reportsResponse = await fetch(`/api/dashboard/student/reports?username=${user.username}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!reportsResponse.ok) {
          throw new Error('Failed to fetch reports');
        }

        const reportsData = await reportsResponse.json();
        console.log('Fetched reports:', reportsData);

        if (reportsData.success) {
          const submittedDays = reportsData.data.map((report) => report.dayNumber - 1);
          const updatedSubmissions = Array(8).fill(false);
          const links = {};

          reportsData.data.forEach((report) => {
            updatedSubmissions[report.dayNumber - 1] = true;
            links[report.dayNumber - 1] = report.link;
          });

          setSubmissions(updatedSubmissions);
          setSubmittedLinks(links);
        }

        // Add fetch attendance data
        const attendanceResponse = await fetch(`/api/dashboard/studentMentor/attendance?studentId=${user.username}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          if (attendanceData.success) {
            setAttendance(attendanceData.data || {});
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load dashboard data');
        toast.error(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <div className="loading">Loading submissions data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const completedDays = Object.values(attendance).filter(status => status === 'P').length;

  const canSubmitDay = (dayIndex) => {
    if (dayIndex === 0) return true;
    return submissions[dayIndex - 1];
  };

  const toggleAccordion = (index) => {
    if (!canSubmitDay(index)) {
      toast.error('Please submit the previous day\'s report first');
      return;
    }
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const handleSubmit = async (index, e) => {
    e.preventDefault();
    const link = e.target.elements.link.value;
    if (!link) {
      toast.error('Please enter a valid document link');
      return;
    }

    const loadingToast = toast.loading('Submitting your report...');

    try {
      const response = await fetch('/api/dashboard/student/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          day: index + 1,
          link
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newSubmissions = [...submissions];
        newSubmissions[index] = true;
        
        const newSubmittedLinks = { ...submittedLinks };
        newSubmittedLinks[index] = link;
        
        setSubmissions(newSubmissions);
        setSubmittedLinks(newSubmittedLinks);
        
        toast.success(`Day ${index + 1} report submitted successfully`, {
          id: loadingToast,
        });
      } else {
        toast.error(data.message || 'Failed to submit report', {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Error submitting report. Please try again.', {
        id: loadingToast,
      });
    }
  };

  const getAttendanceStatus = (dayNumber) => {
    const day = `day${dayNumber}`;
    const status = attendance[day];

    if (!submissions[dayNumber - 1]) {
      return { text: '', className: '' };
    }

    // If there's no attendance record and student is completed, show present
    if (!status && student.completed) {
      return { text: 'Present', className: 'present' };
    }

    if (!status) {
      return { text: 'Attendance is yet to be posted', className: 'pending' };
    }

    if (status === 'P') {
      return { text: 'Present', className: 'present' };
    }

    return { 
      text: 'You have been marked absent due to incorrect submission', 
      className: 'absent' 
    };
  };

  const handleResubmit = (index) => {
    setActiveAccordion(index);
    const newSubmissions = [...submissions];
    newSubmissions[index] = false;
    setSubmissions(newSubmissions);
    delete submittedLinks[index];
    setSubmittedLinks({...submittedLinks});
  };

  // Check if lead is assigned
  if (!student.leadId && !student.completed) {
    return (
      <section className="submissions-section">
        <h2>Daily Reports</h2>
        <div className="locked-message">
          <span className="lock-icon">🔒</span>
          <p>Daily reports are locked. Please wait for a Student Lead to be assigned to you.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="submissions-section">
      <h2>Daily Reports</h2>
      <div className="submissions-header">
        <div className="progress-tracker">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(submissions.filter(Boolean).length / 8) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="submissions-layout">
        <div className="days-grid">
          {Array(8).fill(null).map((_, index) => {
            const status = attendance[`day${index + 1}`];
            const isSubmitted = submissions[index];
            const isLocked = !canSubmitDay(index);
            
            return (
              <div
                key={index}
                className={`day-card ${activeAccordion === index ? 'active' : ''} ${
                  isLocked ? 'locked' : isSubmitted ? 'submitted' : 'submittable'
                }`}
                onClick={() => toggleAccordion(index)}
              >
                <div className="day-header">
                  <span className="day-number">Day {index + 1}</span>
                  <div className="day-status">
                    {isSubmitted ? (
                      <span className={`status-badge ${
                        status === 'P' ? 'approved' :
                        status === 'A' ? 'rejected' : 'pending'
                      }`}>
                        {status === 'P' ? 'Approved' :
                         status === 'A' ? 'Rejected' : 'Pending Review'}
                      </span>
                    ) : (
                      <span className="status-badge not-submitted">
                        Not Submitted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="submission-details">
          {activeAccordion !== null ? (
            <div className="submission-content">
              <div className="submission-header">
                <h3>Day {activeAccordion + 1} Report Submission</h3>
                <div className="submission-status">
                  {submissions[activeAccordion] && (
                    <span className={`status-badge ${
                      attendance[`day${activeAccordion + 1}`] === 'P' ? 'approved' :
                      attendance[`day${activeAccordion + 1}`] === 'A' ? 'rejected' : 'pending'
                    }`}>
                      {attendance[`day${activeAccordion + 1}`] === 'P' ? 'Approved' :
                       attendance[`day${activeAccordion + 1}`] === 'A' ? 'Rejected' : 'Pending Review'}
                    </span>
                  )}
                </div>
              </div>

              {submissions[activeAccordion] ? (
                <div className="submitted-content">
                  <div className="submitted-details">
                    <div className="detail-item">
                      <span className="detail-label">Submission Status:</span>
                      <span className="detail-value">Submitted</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Document Link:</span>
                      <a 
                        href={submittedLinks[activeAccordion]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="document-link"
                      >
                        View Document
                      </a>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Review Status:</span>
                      <span className="detail-value">
                        {getAttendanceStatus(activeAccordion + 1).text}
                      </span>
                    </div>
                  </div>

                  {attendance[`day${activeAccordion + 1}`] === 'A' && (
                    <div className="resubmission-section">
                      <p className="rejection-note">
                        Your submission has been rejected. Please review and resubmit your report.
                      </p>
                      <button 
                        onClick={() => handleResubmit(activeAccordion)}
                        className="resubmit-button"
                      >
                        Resubmit Report
                      </button>
                    </div>
                  )}

                  <div className="submission-notes">
                    <p className="note">
                      <span className="note-icon">ℹ️</span>
                      {attendance[`day${activeAccordion + 1}`] !== 'A' 
                        ? "To modify your submission, please contact your student Lead."
                        : "Please ensure your resubmission meets all the requirements."}
                    </p>
                  </div>
                </div>
              ) : !canSubmitDay(activeAccordion) ? (
                <div className="locked-message">
                  <span className="lock-icon">🔒</span>
                  <p>This day is locked. Please complete and submit the previous day's report first.</p>
                </div>
              ) : (
                <form onSubmit={(e) => handleSubmit(activeAccordion, e)} className="submission-form">
                  <div className="form-header">
                    <h4>Submit Your Report</h4>
                    <p>Please ensure your document contains all required information before submitting.</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="link">Document Link</label>
                    <input
                      type="url"
                      id="link"
                      name="link"
                      placeholder="Enter the link to your document"
                      required
                    />
                  </div>
                  <button type="submit" className="submit-button">
                    Submit Report
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="placeholder-content">
              <div className="placeholder-icon">📝</div>
              <h3>Select a Day to Begin</h3>
              <p>Choose a day from the grid to view details or submit your report.</p>
              <div className="status-legend">
                <h4>Status Guide:</h4>
                <div className="legend-items">
                  <div className="legend-item">
                    <span className="legend-icon approved">✓</span>
                    <span>Approved</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-icon pending">⏳</span>
                    <span>Pending Review</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-icon rejected">✕</span>
                    <span>Rejected</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-icon locked">🔒</span>
                    <span>Locked</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}