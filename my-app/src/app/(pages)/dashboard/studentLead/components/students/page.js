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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [reportOpen, setReportOpen] = useState({});
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, [user]);

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
        setReportOpen(data.reportOpen);
      }
      console.log(data.students);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNewStudents = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const response = await fetch('/api/dashboard/studentLead/fetchStudents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (!data.success) {
        if (data.error === 'limit is over') {
          toast.error('You have reached the maximum limit of students (slot 4)');
        } else {
          toast.error(data.error || 'Failed to fetch new students');
          setFetchError(data.error);
        }
        return;
      }

      toast.success(`Successfully fetched ${data.students.length} new students`);
      setStudents(prevStudents => [...prevStudents, ...data.students]);
      setTotalStudents(prevTotal => prevTotal + data.students.length);
    } catch (err) {
      console.error('Error fetching new students:', err);
      toast.error(err.message);
      setFetchError(err.message);
    } finally {
      setFetching(false);
      setShowConfirmDialog(false);
    }
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
        <div className="header-actions">
          <div className="total-students">
            Total Students: {totalStudents}
            <button 
              className="refresh-btn"
              onClick={fetchStudents}
              disabled={loading}
            >
              <span className="refresh-icon">↻</span>
            </button>
          </div>
          {(() => {
            const currentSlot = students[0]?.slot || 1;
            const hasStudents = students.length > 0;
            let canFetch, errorMsg;
            if (!hasStudents) {
              canFetch = reportOpen[`slot${currentSlot}`];
              if (!canFetch) errorMsg = `Fetching for slot ${currentSlot} is not open yet.`;
            } else {
              const nextSlot = currentSlot + 1;
              canFetch = reportOpen[`slot${nextSlot}`];
              if (!canFetch) errorMsg = `Fetching for slot ${nextSlot} is not open yet.`;
            }
            return (
              <>
                <button 
                  className="fetch-btn"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={fetching || !canFetch}
                >
                  {fetching ? 'Fetching...' : 'Fetch New Students'}
                </button>
                {errorMsg && (
                  <div className="error" style={{marginTop: '0.5rem'}}>
                    {errorMsg}
                  </div>
                )}
                {fetchError && (
                  <div className="error" style={{marginTop: '0.5rem'}}>
                    {fetchError}
                  </div>
                )}
              </>
            );
          })()}
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

      {showConfirmDialog && (
        <div className="modal-overlay">
          <div className="confirm-dialog">
            <h2>Fetch New Students</h2>
            
              {students.length === 0 
                ? (<p>You currently have no students. This will fetch students for slot 1.</p>
            ):(<>`You currently have students in slot {students[0].slot}. This will move you to slot {students[0].slot + 1} and fetch new students.`
              <p className="warning-text">
              ⚠️ Important: This action cannot be undone. Once you move to the next slot, you won't be able to:
            </p>
            <ul className="warning-list">
              <li>Return to the previous slot</li>
              <li>Fetch students from the previous slot again</li>
              <li>Verify students from the previous slot</li>
            </ul>
            </>)}
            <div className="dialog-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowConfirmDialog(false)}
                disabled={fetching}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={handleFetchNewStudents}
                disabled={fetching}
              >
                {fetching ? 'Fetching...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
