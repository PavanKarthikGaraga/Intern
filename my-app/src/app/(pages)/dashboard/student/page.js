'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import './page.css';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState(Array(8).fill(false));
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);

  useEffect(() => {
    if (!user?.idNumber) {  // Changed from user?.id to user?.idNumber
      setLoading(false);    // Changed to false since we know user isn't loaded
      return;
    }

    const fetchData = async () => {
      try {
        setError(null); // Reset error state before fetching
        console.log('Fetching data for student:', user.idNumber);
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
        console.log('Data:', data);
        if (data.success) {
          setDomain(data.domain || 'Not assigned');
          setSubmissions(Array.isArray(data.submissions) ? data.submissions : Array(8).fill(false));
        } else {
          throw new Error(data.error || 'Failed to fetch data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]); // Changed dependency array to include user

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

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const handleSubmit = async (index, e) => {
    e.preventDefault();
    const link = e.target.elements.link.value;
    if (!link) return;

    try {
      const response = await fetch('/api/dashboard/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: user.idNumber,  // Changed from user.id to user.idNumber
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
        <h1>Welcome, {user?.name || 'Student'}</h1>
        <div className="domain-info">Domain: {domain || 'Not assigned'}</div>
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
        <div className="accordion">
          {Array(8).fill(null).map((_, index) => (
            <div 
              key={index} 
              className={`accordion-item ${activeAccordion === index ? 'active' : ''}`}
            >
              <div 
                className="accordion-header"
                onClick={() => toggleAccordion(index)}
              >
                <span>Day {index + 1}</span>
                {submissions[index] && <span className="submission-status">✓</span>}
              </div>
              <div className="accordion-content">
                <div className="submission-form">
                  {submissions[index] ? (
                    <div className="submitted-message">
                      Report submitted successfully
                    </div>
                  ) : (
                    <form onSubmit={(e) => handleSubmit(index, e)}>
                      <div className="upload-container">
                        <label htmlFor={`link-${index}`}>
                          Submit your report for Day {index + 1}
                        </label>
                        <input 
                          id={`link-${index}`}
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
