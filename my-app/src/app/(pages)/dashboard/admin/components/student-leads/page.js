"use client";
import { useState, useEffect } from "react";
import { toast } from 'react-hot-toast';
import Loader from '@/app/components/loader/loader';

export default function StudentLeads() {
    const [studentLeads, setStudentLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchStudentLeads();
    }, [currentPage, searchQuery]);

    const fetchStudentLeads = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/dashboard/admin/student-leads?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`
            );
            if (!response.ok) throw new Error('Failed to fetch student leads');
            const data = await response.json();
            
            if (data.success) {
                setStudentLeads(data.studentLeads || []);
                setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
            } else {
                toast.error(data.error || 'Failed to fetch student leads');
            }
        } catch (error) {
            console.error('Error fetching student leads:', error);
            toast.error('Failed to load student leads');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className="student-leads-section">
            <div className="section-header">
                <h2>Student Leads</h2>
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search student leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {studentLeads.length > 0 ? (
                <>
                    <div className="leads-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Name</th>
                                    <th>Created At</th>
                                    <th>Last Updated</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentLeads.map((lead) => (
                                    <tr key={lead.id}>
                                        <td>{lead.id}</td>
                                        <td>{lead.username}</td>
                                        <td>{lead.name}</td>
                                        <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
                                        <td>{new Date(lead.updatedAt).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                onClick={() => handleViewStudents(lead.id)}
                                                className="view-students-btn"
                                            >
                                                View Students
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

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
                </>
            ) : (
                <p className="no-leads">No student leads found</p>
            )}
        </div>
    );
} 