'use client';
import { useState, useEffect, useMemo } from 'react';
import { FaEye, FaEyeSlash, FaVideo } from 'react-icons/fa';
import toast from 'react-hot-toast';
// import Loader from '@/app/components/loader/loader';

export default function Reports({ user }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [reports, setReports] = useState([]);
  const [verifyStatus, setVerifyStatus] = useState({});
  const [marks, setMarks] = useState({});
  const [isSStudent, setIsSStudent] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('current'); // 'current' or 'previous'
  const [regularReports, setRegularReports] = useState([]);
  const [specialReports, setSpecialReports] = useState([]);
  const [supply, setSupply] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- Fetch Student Data ---
        const studentResponse = await fetch('/api/dashboard/student/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user?.username })
        });

        if (!studentResponse.ok) {
          const errorData = await studentResponse.json();
          throw new Error(errorData.error || 'Failed to fetch student data');
        }

        const studentDataResult = await studentResponse.json();
        if (studentDataResult.success && studentDataResult.student) {
          setStudentData(studentDataResult.student);
          const isSpecial = !!studentDataResult.student.sstudentData;
          setIsSStudent(isSpecial);
          setSupply(studentDataResult.student.supply);
          
          setVerifyStatus(studentDataResult.student.verify || {});
          setMarks(studentDataResult.student.marks || {});

          // --- Fetch Reports ---
          const reportsResponse = await fetch(`/api/dashboard/student/reports?username=${user?.username}&supply=${studentDataResult.student.supply}`);
          if (!reportsResponse.ok) {
            throw new Error('Failed to fetch reports');
          }
          const reportsData = await reportsResponse.json();
          if (reportsData.success) {
            if (studentDataResult.student.supply) {
              setRegularReports(reportsData.data.regular);
              setSpecialReports(reportsData.data.special);
            } else {
              setRegularReports(reportsData.data);
            }
          }
        } else {
          throw new Error(studentDataResult.error || 'Failed to fetch student data');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Derived values using useMemo
  const currentReportsArray = useMemo(() => {
    if (supply) {
      return selectedSlot === 'current' ? specialReports : regularReports;
    } else {
      return regularReports;
    }
  }, [selectedSlot, supply, regularReports, specialReports]);

  const submissions = useMemo(() => {
    const derived = Array(7).fill(false);
    console.log("Calculating submissions:", currentReportsArray);
    currentReportsArray.forEach((report, index) => {
      console.log(`Report for Day ${index + 1}:`, report);
      if (report && report.link) {
        derived[index] = true;
        console.log(`Day ${index + 1} has link. Setting derived[${index}] to true. derived array now:`, derived);
      }
    });
    console.log("Final derived submissions before return:", derived);
    return derived;
  }, [currentReportsArray]);

  const submittedLinks = useMemo(() => {
    const derived = {};
    currentReportsArray.forEach((report, index) => {
      if (report && report.link) {
        derived[index] = report.link;
      }
    });
    return derived;
  }, [currentReportsArray]);

  // This useEffect now just sets the 'reports' state from the derived 'currentReportsArray'
  useEffect(() => {
    setReports(currentReportsArray);
  }, [currentReportsArray]);

  const canSubmitDay = (dayIndex) => {
    // If the current day is already submitted (has a link), it cannot be re-submitted via this path (resubmit button handles that)
    if (currentReportsArray[dayIndex] && currentReportsArray[dayIndex].link) {
      return false; 
    }

    // For Day 1, if it's not submitted, it can always be submitted
    if (dayIndex === 0) {
      return true;
    }

    // For any other day, check if the previous day has a link (meaning it was submitted)
    return currentReportsArray[dayIndex - 1] && currentReportsArray[dayIndex - 1].link;
  };

  const toggleAccordion = (index) => {
    // Always allow viewing of any day's report.
    // If the accordion for this day is already open, close it.
    if (activeAccordion === index) {
      setActiveAccordion(null);
    } else {
      // Otherwise, open the accordion for this day.
      setActiveAccordion(index);
    }
  };

  const getStatus = (dayNumber) => {
    const report = reports.find(r => r.dayNumber === dayNumber);
    const isSubmitted = submissions[dayNumber - 1];

    console.log(`getStatus for Day ${dayNumber}: submissions = ${submissions}, isSubmitted = ${isSubmitted}, report = `, report);

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
          type: selectedSlot,
          supply
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Day ${index + 1} report submitted successfully`, {
          id: loadingToast,
        });

        // Update the appropriate reports array based on supply and selected slot
        if (supply) {
          let currentReportsArray = selectedSlot === 'current' ? [...specialReports] : [...regularReports];
          let reportToUpdate = currentReportsArray.find(r => r.dayNumber === index + 1);
          if (reportToUpdate) {
            reportToUpdate.link = link;
            reportToUpdate.attendance = null;
            reportToUpdate.status = 'new';
            reportToUpdate.marks = null;
            reportToUpdate.message = null;
          }

          if (selectedSlot === 'current') {
            setSpecialReports(currentReportsArray);
          } else {
            setRegularReports(currentReportsArray);
          }
        } else {
          let currentReportsArray = [...regularReports];
          let reportToUpdate = currentReportsArray.find(r => r.dayNumber === index + 1);
          if (reportToUpdate) {
            reportToUpdate.link = link;
            reportToUpdate.attendance = null;
            reportToUpdate.status = 'new';
            reportToUpdate.marks = null;
            reportToUpdate.message = null;
          }
          setRegularReports(currentReportsArray);
        }

        setActiveAccordion(null);
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
    
    if (supply) {
      let currentReportsArray = selectedSlot === 'current' ? [...specialReports] : [...regularReports];
      let reportToResubmit = currentReportsArray.find(r => r.dayNumber === index + 1);

      if (reportToResubmit) {
        reportToResubmit.link = null;
        reportToResubmit.attendance = null;
        reportToResubmit.status = 'new';
        reportToResubmit.marks = null;
        reportToResubmit.message = null;
      }

      if (selectedSlot === 'current') {
        setSpecialReports(currentReportsArray);
      } else {
        setRegularReports(currentReportsArray);
      }
    } else {
      let currentReportsArray = [...regularReports];
      let reportToResubmit = currentReportsArray.find(r => r.dayNumber === index + 1);

      if (reportToResubmit) {
        reportToResubmit.link = null;
        reportToResubmit.attendance = null;
        reportToResubmit.status = 'new';
        reportToResubmit.marks = null;
        reportToResubmit.message = null;
      }
      setRegularReports(currentReportsArray);
    }
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
      {/* <div className="submissions-header">
        <div className="progress-tracker">
          <div className="progress-bar">image.pngimage.png
            <div 
              className="progress-fill" 
              style={{ width: `${(submissions.filter(Boolean).length / 7) * 100}%` }}
            ></div>
          </div>
        </div>
      </div> */}

      <div className="submissions-layout">
        <div className="days-grid">
          {Array(7).fill(null).map((_, index) => {
            const report = reports.find(r => r.dayNumber === index + 1);
            const status = getStatus(index + 1);
            const isSubmitted = submissions[index];
            const isLocked = !canSubmitDay(index);
            
            console.log(`Rendering Day ${index + 1}: status = ${status.text}, isSubmitted = ${isSubmitted}, submissions state = `, submissions);

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