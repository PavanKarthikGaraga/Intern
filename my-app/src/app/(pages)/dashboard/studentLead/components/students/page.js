'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
// import Loader from '@/components/loader/loader';
import toast from 'react-hot-toast';
import './page.css';
import VerifyModal from './VerifyModal';

export default function Students({ user }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setError(null);
        const response = await fetch('/api/dashboard/studentLead/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user?.username })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }

        const data = await response.json();
        if (data.success) {
          setStudents(data.students);
          setTotalStudents(data.total);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      fetchStudents();
    }
  }, [user]);

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

  const handleVerify = (day, status) => {
    setStudents(prevStudents => 
      prevStudents.map(student => {
        if (student.username === selectedStudent.username) {
          return {
            ...student,
            verify: {
              ...student.verify,
              [`day${day}`]: status
            }
          };
        }
        return student;
      })
    );
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
        <div className="total-students">
          Total Students: {totalStudents}
        </div>
      </div>
      
      <div className="table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>ID</th>
              {/* <th>Branch</th> */}
              {/* <th>Year</th> */}
              <th>Domain</th>
              <th>Mode</th>
              <th>Slot</th>
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
                  {/* <td>{student.branch}</td> */}
                  {/* <td>{student.year}</td> */}
                  <td>{student.selectedDomain}</td>
                  <td>{student.mode}</td>
                  <td>{student.slot}</td>
                  <td>
                    <div className="upload-status">
                      <span className={`upload-count ${uploadCount === 7 ? 'completed' : 'pending'}`}>
                        {uploadCount}/7
                      </span>
                      {/* <div className="upload-days">
                        {[1, 2, 3, 4, 5, 6, 7].map(day => (
                          <span 
                            key={day} 
                            className={`upload-day ${student.uploads[`day${day}Link`] ? 'uploaded' : 'pending'}`}
                            title={student.uploads[`day${day}Link`] ? 'Uploaded' : 'Pending'}
                          >
                            {day}
                          </span>
                        ))}
                      </div> */}
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
                      {/* <button className="contact-btn">Contact</button> */}
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
