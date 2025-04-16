"use client";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import Loader from '@/app/components/loader/loader';

export default function CompletedStudents() {
    const [completedStudents, setCompletedStudents] = useState([]);
    const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [uploads, setUploads] = useState([]);

    useEffect(() => {
        fetchCompletedStudents();
    }, [currentPage, searchQuery]);

    const fetchCompletedStudents = async () => {
        setIsLoadingCompleted(true);
        try {
            const response = await fetch(
                `/api/dashboard/admin/completed-students?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`
            );
            if (!response.ok) throw new Error('Failed to fetch completed students');
            const data = await response.json();
            if (data.success) {
                setCompletedStudents(data.completedStudents || []);
                setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
            }
        } catch (err) {
            console.error('Error fetching completed students:', err);
            toast.error('Failed to load completed students');
            setCompletedStudents([]);
        } finally {
            setIsLoadingCompleted(false);
        }
    };

    const fetchUploads = async (studentId) => {
        try {
            const response = await fetch(`/api/dashboard/admin/uploads?studentId=${studentId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to fetch uploads');
            const data = await response.json();

            if (Array.isArray(data.uploads)) {
                setUploads(data.uploads);
            } else if (Array.isArray(data)) {
                setUploads(data);
            } else {
                setUploads([]);
                console.warn('Uploads data is not in expected format:', data);
            }

            setSelectedStudent(studentId);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch uploads');
            setUploads([]);
        }
    };

    const handleModalClose = () => {
        setSelectedStudent(null);
        setUploads([]);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    if (isLoadingCompleted) {
        return <div className="loading">Loading Data .......</div>;
    }

    return (
        <div className="completed-students-section">
            <h2>Completed Students</h2>
            <div className="search-pagination-controls">
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search completed students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className="domain-filter"
                    >
                        <option value="all">All Domains</option>
                        {[...new Set(completedStudents.map(student => student.selectedDomain))].map(domain => (
                            <option key={domain} value={domain}>{domain}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID Number</th>
                            <th>Name</th>
                            <th>Domain</th>
                            <th>Student Lead</th>
                            <th>Completion Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {completedStudents.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="no-students">No completed students found</td>
                            </tr>
                        ) : (
                            completedStudents
                                .filter(student => selectedDomain === 'all' || student.selectedDomain === selectedDomain)
                                .map((student) => (
                                    <tr key={student.username}>
                                        <td>{student.username}</td>
                                        <td>{student.name}</td>
                                        <td>{student.selectedDomain}</td>
                                        <td>{student.leadName || 'Not Assigned'}</td>
                                        <td>{formatDate(student.completionDate)}</td>
                                        <td>
                                            <button 
                                                className="view-progress-btn"
                                                onClick={() => {
                                                    setSelectedStudent(student.username);
                                                    fetchUploads(student.username);
                                                }}
                                            >
                                                View Reports
                                            </button>
                                        </td>
                                    </tr>
                                ))
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="pagination-controls">
                    <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}

            {selectedStudent && (
                <div className="modal-overlay" onClick={handleModalClose}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Student Reports - {selectedStudent}</h2>
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>Day</th>
                                    <th>Document</th>
                                    <th>Uploaded On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uploads.map((upload) => (
                                    <tr key={`${upload.username}-${upload.dayNumber}`}>
                                        <td>Day {upload.dayNumber}</td>
                                        <td>
                                            <a href={upload.link} target="_blank" rel="noopener noreferrer">
                                                View Document
                                            </a>
                                        </td>
                                        <td>{formatDate(upload.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="modal-footer">
                            <button className="close-modal-btn" onClick={handleModalClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 