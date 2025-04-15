'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function StudentLeads({ user }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/dashboard/facultyMentor/studentLeads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || 'Failed to fetch student leads');
          return;
        }

        if (data.success) {
          setLeads(data.leads || []);
        }
      } catch (error) {
        console.error('Error fetching student leads:', error);
        toast.error('An unexpected error occurred while fetching student leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [user.username]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = leads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(leads.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return <div className="loading">Loading student leads data...</div>;
  }

  return (
    <div className="student-leads-section">
      <h2>Student Leads</h2>
      
      {leads.length === 0 ? (
        <div className="no-leads">No student leads assigned to you yet.</div>
      ) : (
        <>
          <div className="table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Total Students</th>
                  <th>Verified Submissions</th>
                  <th>Pending Submissions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((lead) => (
                  <tr key={lead.username}>
                    <td>{lead.name}</td>
                    <td>{lead.username}</td>
                    <td>{lead.totalStudents}</td>
                    <td>{lead.verifiedSubmissions}</td>
                    <td>{lead.pendingSubmissions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {leads.length > 0 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, leads.length)} of {leads.length} leads
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
    </div>
  );
} 