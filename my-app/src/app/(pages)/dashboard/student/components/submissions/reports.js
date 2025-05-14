'use client';
import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaVideo } from 'react-icons/fa';
import toast from 'react-hot-toast';
// import Loader from '@/app/components/loader/loader';

export default function Reports({ user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [submissions, setSubmissions] = useState(Array(7).fill(false));
  const [submittedLinks, setSubmittedLinks] = useState({});
  const [reports, setReports] = useState([]);
  const [verifyStatus, setVerifyStatus] = useState({});
  const [marks, setMarks] = useState({});

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setError(null);
        const response = await fetch('/api/dashboard/student/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user?.username })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch student data');
        }

        const data = await response.json();
        if (data.success && data.student) {
          setStudentData(data.student);
          // Update submissions and links based on uploads data
          const updatedSubmissions = Array(7).fill(false);
          const links = {};
          for (let i = 1; i <= 7; i++) {
            const link = data.student.uploads?.details[`day${i}`];
            if (link) {
              updatedSubmissions[i - 1] = true;
              links[i - 1] = link;
            }
          }
          setSubmissions(updatedSubmissions);
          setSubmittedLinks(links);
          setVerifyStatus(data.student.verify || {});
          setMarks(data.student.marks || {});
        } else {
          throw new Error(data.error || 'Failed to fetch student data');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchReports = async () => {
      try {
        const response = await fetch(`/api/dashboard/student/reports?username=${user?.username}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        const data = await response.json();
        if (data.success && data.data) {
          setReports(data.data);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
        toast.error('Failed to load reports');
      }
    };

    if (user?.username) {
      fetchStudentData();
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [user]);

  const canSubmitDay = (dayIndex) => {
    if (dayIndex === 0) return true;
    const prevDayKey = `day${dayIndex}`;
    const prevAttendance = studentData?.attendance?.details[prevDayKey];
    return submissions[dayIndex - 1] || prevAttendance === 'P' || prevAttendance === 'A';
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
      if (data.success) {
        toast.success(`Day ${index + 1} report submitted successfully`, {
          id: loadingToast,
        });
        const newSubmissions = [...submissions];
        newSubmissions[index] = true;
        const newSubmittedLinks = { ...submittedLinks };
        newSubmittedLinks[index] = link;
        setSubmissions(newSubmissions);
        setSubmittedLinks(newSubmittedLinks);
        setActiveAccordion(null);
        
        // Refresh reports
        const reportsResponse = await fetch(`/api/dashboard/student/reports?username=${user.username}`);
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          if (reportsData.success && reportsData.data) {
            setReports(reportsData.data);
          }
        }
      } else {
        throw new Error(data.error || 'Failed to submit report');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit report', {
        id: loadingToast,
      });
    }
  };

  const handleResubmit = (index) => {
    setActiveAccordion(index);
    const newSubmissions = [...submissions];
    newSubmissions[index] = false;
    setSubmissions(newSubmissions);
    delete submittedLinks[index];
    setSubmittedLinks({...submittedLinks});
  };

  const getStatus = (dayNumber) => {
    const report = reports.find(r => r.dayNumber === dayNumber);
    const isSubmitted = submissions[dayNumber - 1];

    if (!isSubmitted) {
      return { text: 'Not Submitted', className: 'not-submitted' };
    }

    if (report?.attendance === 'P') {
      return { text: 'Approved', className: 'approved' };
    }
    
    if (report?.verified) {
      return { text: 'Verified', className: 'verified' };
    }

    if (report?.attendance === 'A') {
      return { text: 'Rejected', className: 'rejected' };
    }



    // if (report?.status === 'new') {
    //   return { text: 'New Submission', className: 'pending' };
    // }

    return { text: 'Pending Review', className: 'pending' };
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!studentData) {
    return <div className="no-data">No student data available</div>;
  }

  // Check if mentor is assigned
  if (!studentData.facultyMentorId && !studentData.completed) {
    return (
      <section className="submissions-section">
        <h2>Daily Reports</h2>
        <div className="locked-message">
          <span className="lock-icon">🔒</span>
          <p>Daily reports are locked. Please wait for a mentor to be assigned to you.</p>
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
              style={{ width: `${(submissions.filter(Boolean).length / 7) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="submissions-layout">
        <div className="days-grid">
          {Array(7).fill(null).map((_, index) => {
            const report = reports.find(r => r.dayNumber === index + 1);
            const status = getStatus(index + 1);
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
                    <span className={`status-badge ${status.className}`}>
                      {status.text}
                    </span>
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
                    <span className={`status-badge ${getStatus(activeAccordion + 1).className}`}>
                      {getStatus(activeAccordion + 1).text}
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
                      <span className={`detail-value ${getStatus(activeAccordion + 1).className}`}>
                        {getStatus(activeAccordion + 1).text}
                      </span>
                    </div>
                    {getStatus(activeAccordion + 1).className === 'approved' && 
                      reports.find(r => r.dayNumber === activeAccordion + 1)?.marks && (
                      <div className="detail-item marks">
                        <span className="detail-label">Marks:</span>
                        <span className="detail-value marks-value">
                          {/* {reports.find(r => r.dayNumber === activeAccordion + 1).marks}/8.5 */}
                          {Number(reports.find(r => r.dayNumber === activeAccordion + 1).marks)}/8.5
                        </span>
                      </div>
                    )}
                  </div>

                  {getStatus(activeAccordion + 1).className === 'rejected' && (
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
                      {getStatus(activeAccordion + 1).className !== 'rejected' 
                        ? "To modify your submission, please contact your student mentor."
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
                    <ul className="upload-instructions">
                      <li><b>Step 1:</b> Upload your report document to <b>Google Drive</b> or <b>OneDrive</b>.</li>
                      <li><b>Step 2:</b> Set the sharing settings to <b>Anyone with the link can view</b> (public link).</li>
                      <li><b>Step 3:</b> Copy the public link and paste it below.</li>
                      <li className="warning"><b>Important:</b> <span style={{color: 'red'}}>Do NOT submit a private or restricted link. Private links will be <b>rejected</b>.</span></li>
                      <li>Check this video for reference <FaVideo
                        style={{ cursor: 'pointer', color: '#1976d2', fontSize: '1.5em' }}  
                        title="Open link in new tab"
                        onClick={() => window.open('https://streamable.com/b6a23r', '_blank')} /></li>
                    </ul>
                    <p>Please ensure your document contains all required information before submitting.</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="link">Document Link</label> 
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="url"
                        id="link"
                        name="link"
                        placeholder="Enter the link to your document"
                        required
                        style={{ flex: 1 }}
                      />
                      <FaVideo
                        style={{ cursor: 'pointer', color: '#1976d2', fontSize: '1.5em' }}
                        title="Open link in new tab"
                        onClick={() => {
                          const input = document.getElementById('link');
                          if (input && input.value) {
                            window.open(input.value, '_blank');
                          }
                        }}
                      />
                    </div>
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
                    <span className="legend-icon verified">✓</span>
                    <span>Verified</span>
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