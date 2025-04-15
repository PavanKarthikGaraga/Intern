'use client';
import { useState, useEffect } from 'react';
import Loader from '@/app/components/loader/loader';
import toast from 'react-hot-toast';
import SubmissionModal from './SubmissionModal';

export default function Students({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      try {
        console.log('Fetching students for lead:', user.username);

        const response = await fetch('/api/dashboard/studentLead/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || 'Failed to fetch students data');
          return;
        }

        if (data.success) {
          setStudents(data.students || []);
        } else {
          toast.error(data.message || 'Failed to fetch students data');
        }

      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('An unexpected error occurred while fetching students data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user]);

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };

  const handleVerifySubmission = (day, verified) => {
    // Update the local state to reflect the verification
    const updatedStudents = students.map(student => {
      if (student.username === selectedStudent.username) {
        return {
          ...student,
          [`day${day}Verified`]: verified
        };
      }
      return student;
    });
    setStudents(updatedStudents);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = students.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(students.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return <div className="loading">Loading Students Data .......</div>;
  }

  return (
    <div className="students-container">
      <h2>Your Students</h2>
      
      {students.length === 0 ? (
        <div className="no-students">No students assigned to you yet.</div>
      ) : (
        <>
          <div className="table-container">
            <table className="students-table">
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
                {currentItems.map((student) => (
                  <tr key={student.username}>
                    <td>{student.name}</td>
                    <td>{student.username}</td>
                    <td>{student.selectedDomain}</td>
                    <td>{student.mode}</td>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewStudent(student)}
                      >
                        View Submissions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {students.length > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, students.length)} of {students.length} students
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`pagination-btn ${pageNumber === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && selectedStudent && (
        <SubmissionModal
          student={selectedStudent}
          onClose={handleCloseModal}
          onVerify={handleVerifySubmission}
        />
      )}
    </div>
  );
} 