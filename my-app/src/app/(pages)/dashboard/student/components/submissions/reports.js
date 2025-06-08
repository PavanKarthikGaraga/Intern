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
  const [isSStudent, setIsSStudent] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('current'); // 'current' or 'previous'
  const [regularReports, setRegularReports] = useState([]);
  const [specialReports, setSpecialReports] = useState([]);
  const [regularSubmissions, setRegularSubmissions] = useState(Array(7).fill(false));
  const [specialSubmissions, setSpecialSubmissions] = useState(Array(7).fill(false));
  const [regularLinks, setRegularLinks] = useState({});
  const [specialLinks, setSpecialLinks] = useState({});

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
          setIsSStudent(!!data.student.sstudentData);
          
          // Update regular submissions and links
          const updatedRegularSubmissions = Array(7).fill(false);
          const regularLinks = {};
          for (let i = 1; i <= 7; i++) {
            const link = data.student.uploads?.details[`day${i}`];
            if (link) {
              updatedRegularSubmissions[i - 1] = true;
              regularLinks[i - 1] = link;
            }
          }
          setRegularSubmissions(updatedRegularSubmissions);
          setRegularLinks(regularLinks);

          // Update special submissions and links if available
          if (data.student.sstudentData) {
            const updatedSpecialSubmissions = Array(7).fill(false);
            const specialLinks = {};
            for (let i = 1; i <= 7; i++) {
              const link = data.student.sstudentData.uploads?.details[`day${i}`];
              if (link) {
                updatedSpecialSubmissions[i - 1] = true;
                specialLinks[i - 1] = link;
              }
            }
            setSpecialSubmissions(updatedSpecialSubmissions);
            setSpecialLinks(specialLinks);
          }

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
        // Fetch regular reports
        const regularResponse = await fetch(`/api/dashboard/student/reports?username=${user?.username}&type=regular`);
        if (!regularResponse.ok) {
          throw new Error('Failed to fetch regular reports');
        }
        const regularData = await regularResponse.json();
        if (regularData.success && regularData.data) {
          setRegularReports(regularData.data);
        }
        // Remove special reports fetch from here
        // Set initial reports based on selected slot
        setReports(selectedSlot === 'current' ? specialReports : regularReports);
        setSubmissions(selectedSlot === 'current' ? specialSubmissions : regularSubmissions);
        setSubmittedLinks(selectedSlot === 'current' ? specialLinks : regularLinks);
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

  // Fetch special reports only after studentData is loaded
  useEffect(() => {
    const fetchSpecialReports = async () => {
      if (studentData?.sstudentData) {
        try {
          const specialResponse = await fetch(`/api/dashboard/student/reports?username=${user?.username}&type=special`);
          if (!specialResponse.ok) throw new Error('Failed to fetch special student reports');
          const specialData = await specialResponse.json();
          if (specialData.success && specialData.data) {
            setSpecialReports(specialData.data);
          }
        } catch (err) {
          toast.error('Failed to load special reports');
        }
      }
    };
    fetchSpecialReports();
  }, [studentData, user]);

  // Update reports, submissions, and links when slot or reports change
  useEffect(() => {
    if (selectedSlot === 'current') {
      setReports(specialReports);
      setSubmissions(specialSubmissions);
      setSubmittedLinks(specialLinks);
    } else {
      setReports(regularReports);
      setSubmissions(regularSubmissions);
      setSubmittedLinks(regularLinks);
    }
  }, [selectedSlot, specialReports, regularReports, specialSubmissions, regularSubmissions, specialLinks, regularLinks]);

  const canSubmitDay = (dayIndex) => {
    if (dayIndex === 0) return true;
    // Check if previous day is submitted
    return submissions[dayIndex - 1];
  };

  const toggleAccordion = (index) => {
    if (!canSubmitDay(index)) {
      toast.error('Please submit the previous day\'s report first');
      return;
    }
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const getStatus = (dayNumber) => {
    const report = reports.find(r => r.dayNumber === dayNumber);
    const isSubmitted = submissions[dayNumber - 1];

    if (!isSubmitted) {
      return { text: 'Not Submitted', className: 'not-submitted' };
    }

    if (!report) {
      return { text: 'Pending Review', className: 'pending' };
    }

    // Always use attendance for both regular and special students
    if (report.attendance === 'P') {
      return { text: 'Approved', className: 'approved' };
    }
    if (report.attendance === 'A') {
      return { text: 'Rejected', className: 'rejected' };
    }

    return { text: 'Pending Review', className: 'pending' };
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
          link,
          type: selectedSlot // 'current' for special tables, 'previous' for regular tables
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Day ${index + 1} report submitted successfully`, {
          id: loadingToast,
        });

        // Update the appropriate submissions and links based on selected slot
        if (selectedSlot === 'current') {
          const newSpecialSubmissions = [...specialSubmissions];
          newSpecialSubmissions[index] = true;
          const newSpecialLinks = { ...specialLinks };
          newSpecialLinks[index] = link;
          setSpecialSubmissions(newSpecialSubmissions);
          setSpecialLinks(newSpecialLinks);
          setSubmissions(newSpecialSubmissions);
          setSubmittedLinks(newSpecialLinks);
        } else {
          const newRegularSubmissions = [...regularSubmissions];
          newRegularSubmissions[index] = true;
          const newRegularLinks = { ...regularLinks };
          newRegularLinks[index] = link;
          setRegularSubmissions(newRegularSubmissions);
          setRegularLinks(newRegularLinks);
          setSubmissions(newRegularSubmissions);
          setSubmittedLinks(newRegularLinks);
        }

        setActiveAccordion(null);
        
        // Refresh reports for the current slot type
        const reportsResponse = await fetch(`/api/dashboard/student/reports?username=${user.username}&type=${selectedSlot === 'current' ? 'special' : 'regular'}`);
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          if (reportsData.success && reportsData.data) {
            if (selectedSlot === 'current') {
              setSpecialReports(reportsData.data);
              setReports(reportsData.data);
            } else {
              setRegularReports(reportsData.data);
              setReports(reportsData.data);
            }
          }
        }

        // Refresh student data to get updated attendance status
        const studentDataResponse = await fetch('/api/dashboard/student/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });

        if (studentDataResponse.ok) {
          const studentData = await studentDataResponse.json();
          if (studentData.success && studentData.student) {
            setStudentData(studentData.student);
            // Update submissions and links after refresh
            if (selectedSlot === 'current' && studentData.student.sstudentData) {
              const updatedSpecialSubmissions = Array(7).fill(false);
              const specialLinks = {};
              for (let i = 1; i <= 7; i++) {
                const link = studentData.student.sstudentData.uploads?.details[`day${i}`];
                if (link) {
                  updatedSpecialSubmissions[i - 1] = true;
                  specialLinks[i - 1] = link;
                }
              }
              setSpecialSubmissions(updatedSpecialSubmissions);
              setSpecialLinks(specialLinks);
              setSubmissions(updatedSpecialSubmissions);
              setSubmittedLinks(specialLinks);
            } else {
              const updatedRegularSubmissions = Array(7).fill(false);
              const regularLinks = {};
              for (let i = 1; i <= 7; i++) {
                const link = studentData.student.uploads?.details[`day${i}`];
                if (link) {
                  updatedRegularSubmissions[i - 1] = true;
                  regularLinks[i - 1] = link;
                }
              }
              setRegularSubmissions(updatedRegularSubmissions);
              setRegularLinks(regularLinks);
              setSubmissions(updatedRegularSubmissions);
              setSubmittedLinks(regularLinks);
            }
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
      {isSStudent && (
        <div className="slot-filter-container">
          <select 
            className="slot-select"
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
          >
            <option value="current">Current Slot ({studentData?.sstudentData?.slot})</option>
            <option value="previous">Previous Slot ({studentData?.sstudentData?.previousSlot})</option>
          </select>
        </div>
      )}
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
                          {Number(reports.find(r => r.dayNumber === activeAccordion + 1).marks)}/8.5
                        </span>
                      </div>
                    )}
                    {reports.find(r => r.dayNumber === activeAccordion + 1)?.message && (
                      <div className="detail-item remarks">
                        <span className="detail-label">Remarks:</span>
                        <div className="remarks-list">
                          {reports.find(r => r.dayNumber === activeAccordion + 1).message.split(', ').map((msg, index) => (
                            <div key={index} className="remark-item">
                              <span className="remark-bullet">•</span>
                              <span className="remark-text">{msg}</span>
                            </div>
                          ))}
                        </div>
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

// Update styles
const styles = `
.submissions-section .slot-filter-container {
  margin-bottom: 20px;
}

.submissions-section .slot-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  min-width: 200px;
}

.submissions-section .slot-select:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}

.submissions-section .slot-select option {
  padding: 8px;
}
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}