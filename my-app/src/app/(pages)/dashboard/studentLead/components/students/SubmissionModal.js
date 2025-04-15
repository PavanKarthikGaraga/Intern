'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function SubmissionModal({ student, onClose, onVerify }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const isVerifying = useRef(false);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch('/api/dashboard/studentLead/verifySubmissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: student.username,
            action: 'getSubmissions'
          }),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('Session expired. Please login again.');
            return;
          }
          throw new Error(data.error || 'Failed to fetch submissions');
        }

        if (data.success) {
          setSubmissions(data.submissions || []);
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error(error.message || 'An unexpected error occurred while fetching submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [student.username]);

  const getStatusColor = (verified) => {
    if (verified === null) return 'status-pending';
    return verified ? 'status-verified' : 'status-rejected';
  };

  const getStatusText = (verified) => {
    if (verified === null) return 'Pending';
    return verified ? 'Verified' : 'Rejected';
  };

  const handleVerify = async (day, verified) => {
    if (isVerifying.current) return;
    
    try {
      isVerifying.current = true;
      
      const response = await fetch('/api/dashboard/studentLead/verifySubmissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: student.username,
          day: parseInt(day),
          verified: verified,
          action: 'verify'
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please login again.');
          return;
        }
        throw new Error(data.error || 'Failed to verify submission');
      }

      if (data.success) {
        toast.success(`Submission ${verified ? 'verified' : 'rejected'} successfully`);
        onVerify(day, verified);
      }
    } catch (error) {
      console.error('Error verifying submission:', error);
      toast.error(error.message || 'An unexpected error occurred while verifying submission');
    } finally {
      isVerifying.current = false;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Submissions for {student.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="no-submissions">No submissions found for this student</div>
          ) : (
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Submission</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.day}>
                    <td>Day {submission.day}</td>
                    <td>
                      <a href={submission.link} target="_blank" rel="noopener noreferrer" className="submission-link">
                        View Report
                      </a>
                    </td>
                    <td>
                      <span className={`status-tag ${getStatusColor(submission.verified)}`}>
                        {getStatusText(submission.verified)}
                      </span>
                    </td>
                    <td>
                      <div className="verification-actions">
                        <button
                          className="verify-btn"
                          onClick={() => handleVerify(submission.day, true)}
                          disabled={submission.verified === true || isVerifying.current}
                        >
                          Verify
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => handleVerify(submission.day, false)}
                          disabled={submission.verified === false || isVerifying.current}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 