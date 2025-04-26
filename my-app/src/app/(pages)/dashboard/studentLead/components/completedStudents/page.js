'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import './page.css';

export default function CompletedStudents() {
  const [completedStudents, setCompletedStudents] = useState([]);
  const [failedStudents, setFailedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('all');
  const [pagination, setPagination] = useState({
    verified: { currentPage: 1, totalPages: 1 },
    failed: { currentPage: 1, totalPages: 1 }
  });
  const router = useRouter();
  const { user } = useAuth();

  const fetchStudents = async (page = 1, slot = selectedSlot) => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/studentLead/completedStudents', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: user?.username,
          page,
          limit: 10,
          slot: slot === 'all' ? null : parseInt(slot)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      if (data.success) {
        setCompletedStudents(data.verifiedStudents || []);
        setFailedStudents(data.failedStudents || []);
        setPagination({
          verified: {
            currentPage: data.pagination.currentPage,
            totalPages: data.pagination.totalPages.verified
          },
          failed: {
            currentPage: data.pagination.currentPage,
            totalPages: data.pagination.totalPages.failed
          }
        });
      } else {
        throw new Error(data.error || 'Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.username) {
      fetchStudents();
    }
  }, [user]);

  const handleSlotChange = (e) => {
    const newSlot = e.target.value;
    setSelectedSlot(newSlot);
    fetchStudents(1, newSlot);
  };

  const handlePageChange = (type, page) => {
    fetchStudents(page, selectedSlot);
  };

  if (loading) {
    return (
      <div className="loadingState">
        Loading students...
      </div>
    );
  }

  if (error) {
    return (
      <div className="errorState">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="studentsContainer">
      <div className="filterBar">
        <select 
          className="slotDropdown"
          value={selectedSlot}
          onChange={handleSlotChange}
        >
          <option value="all">All Slots</option>
          <option value="1">Slot 1</option>
          <option value="2">Slot 2</option>
          <option value="3">Slot 3</option>
          <option value="4">Slot 4</option>
        </select>
      </div>

      <div className="studentSection">
        <h2>Completed Students</h2>
        {completedStudents.length > 0 ? (
          <>
            <table className="studentTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  {/* <th>Email</th> */}
                  <th>Branch</th>
                  <th>Domain</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {completedStudents.map((student) => (
                  <tr key={student.username}>
                    <td>{student.studentName}</td>
                    <td>{student.username}</td>
                    {/* <td>{student.email}</td> */}
                    <td>{student.branch}</td>
                    <td>{student.selectedDomain}</td>
                    <td>{student.mode}</td>
                    <td>{student.slot}</td>
                    <td>
                      <span className="statusBadge completedStatus">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="paginationControls">
              <button
                onClick={() => handlePageChange('verified', pagination.verified.currentPage - 1)}
                disabled={pagination.verified.currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {pagination.verified.currentPage} of {pagination.verified.totalPages}
              </span>
              <button
                onClick={() => handlePageChange('verified', pagination.verified.currentPage + 1)}
                disabled={pagination.verified.currentPage === pagination.verified.totalPages}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="noDataMessage">
            No completed students found
          </div>
        )}
      </div>

      <div className="studentSection">
        <h2>Failed Students</h2>
        {failedStudents.length > 0 ? (
          <>
            <table className="studentTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  {/* <th>Email</th> */}
                  <th>Branch</th>
                  <th>Domain</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {failedStudents.map((student) => (
                  <tr key={student.username}>
                    <td>{student.studentName}</td>
                    <td>{student.username}</td>
                    {/* <td>{student.email}</td> */}
                    <td>{student.branch}</td>
                    <td>{student.selectedDomain}</td>
                    <td>{student.mode}</td>
                    <td>{student.slot}</td>
                    <td>
                      <span className="statusBadge failedStatus">
                        Failed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="paginationControls">
              <button
                onClick={() => handlePageChange('failed', pagination.failed.currentPage - 1)}
                disabled={pagination.failed.currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {pagination.failed.currentPage} of {pagination.failed.totalPages}
              </span>
              <button
                onClick={() => handlePageChange('failed', pagination.failed.currentPage + 1)}
                disabled={pagination.failed.currentPage === pagination.failed.totalPages}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="noDataMessage">
            No failed students found
          </div>
        )}
      </div>
    </div>
  );
}
