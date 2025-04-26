"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import "./page.css";

const CompletedStudentsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [completedStudents, setCompletedStudents] = useState([]);
  const [failedStudents, setFailedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("all");
  const [pagination, setPagination] = useState({
    verified: { currentPage: 1, totalPages: 1 },
    failed: { currentPage: 1, totalPages: 1 }
  });

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
      <div className="completed-section">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="completed-section">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="completed-section">
      <div className="section-header">
        <h1>Completed Students</h1>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="slot-filter">Filter by Slot</label>
          <select
            id="slot-filter"
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
      </div>

      <div className="status-sections">
        <div className="status-section">
          <h2>
            Successfully Completed ({completedStudents.length})
          </h2>
          <p className="section-description">
            Students who have successfully completed their internship
          </p>
          <div className="table-container">
            <table className="completed-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Branch</th>
                  <th>Domain</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {completedStudents.length > 0 ? (
                  completedStudents.map((student) => (
                    <tr key={student.username}>
                      <td>{student.studentName}</td>
                      <td>{student.username}</td>
                      <td>{student.branch}</td>
                      <td>{student.selectedDomain}</td>
                      <td>
                        <span className={`mode-badge ${student.mode.toLowerCase()}`}>
                          {student.mode}
                        </span>
                      </td>
                      <td>
                        <span className="slot-badge">{student.slot}</span>
                      </td>
                      <td>
                        <span className="status-badge completed">Completed</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="no-students">
                        <p className="no-students-message">
                          No completed students found
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls">
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
        </div>

        <div className="status-section">
          <h2>
            Failed Students ({failedStudents.length})
          </h2>
          <p className="section-description">
            Students who did not complete their internship successfully
          </p>
          <div className="table-container">
            <table className="completed-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Branch</th>
                  <th>Domain</th>
                  <th>Mode</th>
                  <th>Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {failedStudents.length > 0 ? (
                  failedStudents.map((student) => (
                    <tr key={student.username}>
                      <td>{student.studentName}</td>
                      <td>{student.username}</td>
                      <td>{student.branch}</td>
                      <td>{student.selectedDomain}</td>
                      <td>
                        <span className={`mode-badge ${student.mode.toLowerCase()}`}>
                          {student.mode}
                        </span>
                      </td>
                      <td>
                        <span className="slot-badge">{student.slot}</span>
                      </td>
                      <td>
                        <span className="status-badge failed">Failed</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="no-students">
                        <p className="no-students-message">
                          No failed students found
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination-controls">
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
        </div>
      </div>
    </div>
  );
};

export default CompletedStudentsPage;
