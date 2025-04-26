'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
// import Loader from '@/components/loader/loader';
import toast from 'react-hot-toast';
import './page.css';
import VerifyModal from './VerifyModal';
import { FaSync } from 'react-icons/fa';

export default function Students({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStudents = async () => {
    try {
      setError(null);
      const response = await fetch('/api/dashboard/facultyMentor/students', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      if (data.success) {
        setStudents(data.students || []);
      } else {
        throw new Error(data.error || 'Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []); // Empty dependency array to run only once on mount

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  const getUploadCount = (uploads) => {
    if (!uploads) return 0;
    let count = 0;
    for (let i = 1; i <= 7; i++) {
      if (uploads[`day${i}`]) {
        count++;
      }
    }
    return count;
  };

  const handleVerify = async (day, status) => {
    try {
      const response = await fetch('/api/dashboard/facultyMentor/students', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedStudent.username,
          day,
          verified: status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }

      setStudents(prevStudents => 
        prevStudents.map(student => {
          if (student.username === selectedStudent.username) {
            return {
              ...student,
              verify: {
                ...student.verify,
                [day]: status
              }
            };
          }
          return student;
        })
      );

      toast.success('Verification status updated successfully');
    } catch (err) {
      console.error('Error updating verification:', err);
      toast.error(err.message);
    }
  };

  if (loading) {
    // return <Loader />;
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="students-section">
      <div className="section-header">
        <h1>Your Students</h1>
        <div className="header-actions">
          <div className="total-students">
            Total Students: {students.length}
          </div>
          <button 
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div className="table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>ID</th>
              <th>Domain</th>
              <th>Mode</th>
              <th>Slot</th>
              <th>Student Lead</th>
              <th>Uploads</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const uploadCount = getUploadCount(student.uploads);
              return (
                <tr key={student.username}>
                  <td>{student.name}</td>
                  <td>{student.username}</td>
                  <td>{student.selectedDomain}</td>
                  <td>{student.mode}</td>
                  <td>{student.slot}</td>
                  <td>{student.studentLeadId}</td>
                  <td>
                    <div className="upload-status">
                      <span className={`upload-count ${uploadCount === 7 ? 'completed' : 'pending'}`}>
                        {uploadCount}/7
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="verify-btn"
                        onClick={() => setSelectedStudent(student)}
                      >
                        Verify Docs
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedStudent && (
        <VerifyModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onVerify={handleVerify}
        />
      )}
    </div>
  );
}
