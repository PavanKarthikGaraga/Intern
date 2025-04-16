'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import SubmissionModal from './SubmissionModal';
// import './page.css';

export default function Submissions({ user }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch('/api/dashboard/facultyMentor/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch submissions');
        }

        if (data.success) {
          setSubmissions(data.submissions || []);
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error(error.message || 'Failed to fetch submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [user.username]);

  const handleViewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowModal(true);
  };

  const handleUpdateAttendance = async (studentUsername, day, status) => {
    try {
      const response = await fetch('/api/dashboard/facultyMentor/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          studentUsername,
          day,
          status
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update attendance');
      }

      if (data.success) {
        toast.success('Attendance updated successfully');
        // Update the local state to reflect the change
        const updatedSubmissions = submissions.map(sub => {
          if (sub.studentUsername === studentUsername) {
            return {
              ...sub,
              [`day${day}Attendance`]: status
            };
          }
          return sub;
        });
        setSubmissions(updatedSubmissions);
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error(error.message || 'Failed to update attendance');
      throw error;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(submissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubmissions = submissions.slice(startIndex, endIndex);

  if (loading) {
    return <div className="loading">Loading submissions...</div>;
  }

  return (
    <div className="submissions-container">
      <h2>Student Submissions</h2>
      
      {submissions.length === 0 ? (
        <div className="no-submissions">No submissions found.</div>
      ) : (
        <>
          <div className="table-container">
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Domain</th>
                  <th>Mode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSubmissions.map((submission) => (
                  <tr key={submission.studentUsername}>
                    <td>{submission.studentName}</td>
                    <td>{submission.studentUsername}</td>
                    <td>{submission.selectedDomain}</td>
                    <td>{submission.mode}</td>
                    <td>
                      <button 
                        className="view-btn"
                        onClick={() => handleViewSubmission(submission)}
                      >
                        View Submissions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Showing {startIndex + 1} to {Math.min(endIndex, submissions.length)} of {submissions.length} students
            </div>
            <div className="pagination-controls">
              <button
                className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="current-page">{currentPage}</span>
              <button
                className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {showModal && selectedSubmission && (
        <SubmissionModal
          submission={selectedSubmission}
          onClose={() => setShowModal(false)}
          onUpdateAttendance={handleUpdateAttendance}
        />
      )}
    </div>
  );
} 