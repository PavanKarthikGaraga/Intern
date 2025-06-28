'use client'
import React, { useState, useEffect } from 'react';
import { FaSearch, FaEye, FaDownload, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './verifyCertificates.css';

const VerifyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCertificates, setTotalCertificates] = useState(0);
  const [viewingCertificate, setViewingCertificate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState({});

  const ITEMS_PER_PAGE = 30;

  // Fetch certificates with pagination and search
  const fetchCertificates = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/admin/certificates/list?page=${page}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(search)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch certificates');
      }

      const data = await response.json();
      setCertificates(data.certificates);
      setTotalPages(data.totalPages);
      setTotalCertificates(data.totalCertificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCertificates(currentPage, searchTerm);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCertificates(1, searchTerm);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchCertificates(page, searchTerm);
  };

  // Handle certificate view
  const handleViewCertificate = async (username) => {
    try {
      setDownloadLoading(prev => ({ ...prev, [username]: true }));
      
      const response = await fetch(`/api/dashboard/admin/certificate/download?username=${encodeURIComponent(username)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab for viewing
      window.open(url, '_blank');
      
      // Clean up
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      
      toast.success(`Certificate for ${username} opened in new tab`);
    } catch (error) {
      console.error('Error viewing certificate:', error);
      toast.error(`Failed to view certificate for ${username}`);
    } finally {
      setDownloadLoading(prev => ({ ...prev, [username]: false }));
    }
  };

  // Handle certificate download
  const handleDownloadCertificate = async (username) => {
    try {
      setDownloadLoading(prev => ({ ...prev, [username]: true }));
      
      const response = await fetch(`/api/dashboard/admin/certificate/download?username=${encodeURIComponent(username)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${username}_certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Certificate for ${username} downloaded successfully`);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error(`Failed to download certificate for ${username}`);
    } finally {
      setDownloadLoading(prev => ({ ...prev, [username]: false }));
    }
  };

  // Generate pagination buttons
  const generatePaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      buttons.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="pagination-btn"
        >
          Previous
        </button>
      );
    }

    // First page
    if (startPage > 1) {
      buttons.push(
        <button
          key="1"
          onClick={() => handlePageChange(1)}
          className="pagination-btn"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="dots1" className="pagination-dots">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="dots2" className="pagination-dots">...</span>);
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="pagination-btn"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      buttons.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="pagination-btn"
        >
          Next
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="verify-certificates-container">
      <div className="header-section">
        <h2>Verify Certificates</h2>
        <p className="subtitle">
          View and verify all generated certificates. Total: {totalCertificates} certificates
        </p>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by username, name, or UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="search-btn">
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
                fetchCertificates(1, '');
              }}
              className="clear-search-btn"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-section">
          <FaSpinner className="spinning" />
          <p>Loading certificates...</p>
        </div>
      )}

      {/* Certificates Table */}
      {!loading && (
        <div className="certificates-section">
          {certificates.length > 0 ? (
            <>
              <div className="table-container">
                <table className="certificates-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Name</th>
                      <th>UID</th>
                      <th>Slot</th>
                      <th>Total Marks</th>
                      <th>Grade</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.map((cert) => (
                      <tr key={cert.username} className="certificate-row">
                        <td className="username-cell">{cert.username}</td>
                        <td className="name-cell">{cert.name}</td>
                        <td className="uid-cell">{cert.uid}</td>
                        <td className="slot-cell">Slot {cert.slot}</td>
                        <td className="marks-cell">{cert.totalMarks}</td>
                        <td className="grade-cell">
                          <span className={`grade-badge grade-${cert.grade?.toLowerCase()}`}>
                            {cert.grade}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              onClick={() => handleViewCertificate(cert.username)}
                              disabled={downloadLoading[cert.username]}
                              className="action-btn view-btn"
                              title="View Certificate"
                            >
                              {downloadLoading[cert.username] ? (
                                <FaSpinner className="spinning" />
                              ) : (
                                <FaEye />
                              )}
                            </button>
                            <button
                              onClick={() => handleDownloadCertificate(cert.username)}
                              disabled={downloadLoading[cert.username]}
                              className="action-btn download-btn"
                              title="Download Certificate"
                            >
                              {downloadLoading[cert.username] ? (
                                <FaSpinner className="spinning" />
                              ) : (
                                <FaDownload />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-section">
                  <div className="pagination-info">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCertificates)} of {totalCertificates} certificates
                  </div>
                  <div className="pagination-buttons">
                    {generatePaginationButtons()}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-certificates">
              <p>No certificates found.</p>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                    fetchCertificates(1, '');
                  }}
                  className="clear-search-btn"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerifyCertificates; 