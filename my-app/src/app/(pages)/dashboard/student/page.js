'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import './page.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState(Array(8).fill(false));
  const [student, setStudent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);

  useEffect(() => {
    if (!user?.idNumber) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        console.log('Fetching data for student:', user.idNumber);

        // Fetch student details
        const response = await fetch('/api/dashboard/student/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idNumber: user.idNumber })
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
        const reportsResponse = await fetch(`/api/dashboard/student/reports?idNumber=${user.idNumber}`, {
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

          submittedDays.forEach((day) => {
            updatedSubmissions[day] = true;
          });

          setSubmissions(updatedSubmissions);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  console.log('user:', user);

  if (!user) {
    return <div className="error">Please log in to view your dashboard</div>;
  }

  if (loading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const completedDays = submissions.filter(Boolean).length;

  const canSubmitDay = (dayIndex) => {
    if (dayIndex === 0) return true;
    return submissions[dayIndex - 1];
  };

  const toggleAccordion = (index) => {
    if (!canSubmitDay(index)) return;
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const handleSubmit = async (index, e) => {
    e.preventDefault();
    const link = e.target.elements.link.value;
    if (!link) return;

    try {
      const response = await fetch('/api/dashboard/student/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idNumber: user.idNumber,
          day: index + 1,
          link
        })
      });

      if (response.ok) {
        const newSubmissions = [...submissions];
        newSubmissions[index] = true;
        setSubmissions(newSubmissions);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <h1>Welcome, {student.name}</h1>
        <div className="student-info">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">ID Number:</span>
              <span className="info-value">{student.idNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Branch:</span>
              <span className="info-value">{student.branch}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Year:</span>
              <span className="info-value">{student.year}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Domain:</span>
              <span className="info-value">{student.selectedDomain}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone:</span>
              <span className="info-value">{student.phoneNumber}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Residence:</span>
              <span className="info-value">{student.residenceType}</span>
            </div>
            {student.residenceType === 'Hostel' && (
              <div className="info-item">
                <span className="info-label">Hostel:</span>
                <span className="info-value">{student.hostelType}</span>
              </div>
            )}
          </div>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(completedDays / 8) * 100}%` }}
          ></div>
          <span className="progress-text">{completedDays}/8 days completed</span>
        </div>
      </div>

      <div className="submissions-section">
        <h2>Daily Reports</h2>
        <div className="submissions-layout">
          <div className="days-list">
            {Array(8).fill(null).map((_, index) => (
              <div
                key={index}
                className={`day-item ${activeAccordion === index ? 'active' : ''} ${
                  canSubmitDay(index) ? 'submittable' : 'locked'
                }`}
                onClick={() => toggleAccordion(index)}
              >
                <span>Day {index + 1}</span>
                {submissions[index] ? (
                  <span className="submission-status">✓</span>
                ) : !canSubmitDay(index) ? (
                  <span className="lock-icon">🔒</span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="submission-form-container">
            {activeAccordion !== null ? (
              <div className="submission-content">
                <h3>Day {activeAccordion + 1} Submission</h3>
                {submissions[activeAccordion] ? (
                  <div className="submitted-message">
                    Report submitted successfully
                  </div>
                ) : !canSubmitDay(activeAccordion) ? (
                  <div className="locked-message">
                    Please submit the previous day's report first
                  </div>
                ) : (
                  <form onSubmit={(e) => handleSubmit(activeAccordion, e)}>
                    <div className="upload-container">
                      <label htmlFor={`link-${activeAccordion}`}>
                        Submit your report for Day {activeAccordion + 1}
                      </label>
                      <input
                        id={`link-${activeAccordion}`}
                        name="link"
                        type="url"
                        placeholder="Enter your document link"
                        className="link-input"
                        required
                      />
                      <button type="submit" className="submit-btn">
                        Submit Report
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="placeholder-content">
                <div className="placeholder-icon">📝</div>
                <h3>Select a Day</h3>
                <p>Submit your reports in order, starting from Day 1</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
