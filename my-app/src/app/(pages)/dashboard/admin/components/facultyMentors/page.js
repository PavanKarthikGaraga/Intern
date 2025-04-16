"use client";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import Loader from '@/app/components/loader/loader';

export default function Mentors() {
    const [mentors, setMentors] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddMentorModal, setShowAddMentorModal] = useState(false);
    const [newMentor, setNewMentor] = useState({
        name: '',
        username: '',
        password: ''
    });

    useEffect(() => {
        fetchMentors();
    }, [currentPage, searchQuery]);

    const fetchMentors = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/dashboard/admin/mentors?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`
            );
            if (!response.ok) throw new Error('Failed to fetch mentors');
            const data = await response.json();
            if (data.success) {
                setMentors(data.mentors || []);
                setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
            }
        } catch (err) {
            console.error('Error fetching mentors:', err);
            toast.error('Failed to load mentors');
            setMentors([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMentor = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/dashboard/admin/add-mentor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newMentor.name,
                    username: newMentor.username,
                    password: newMentor.password,
                    role: 'facultyMentor'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add mentor');
            }

            const data = await response.json();
            if (data.success) {
                toast.success('Mentor added successfully');
                setShowAddMentorModal(false);
                setNewMentor({
                    name: '',
                    username: '',
                    password: ''
                });
                fetchMentors();
            }
        } catch (err) {
            console.error('Error adding mentor:', err);
            toast.error(err.message || 'Failed to add mentor');
        }
    };

    const handleDeleteMentor = async (mentorId) => {
        if (!window.confirm('Are you sure you want to delete this mentor? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/dashboard/admin/delete-mentor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mentorId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete mentor');
            }

            const data = await response.json();
            if (data.success) {
                toast.success('Mentor deleted successfully');
                fetchMentors();
            }
        } catch (err) {
            console.error('Error deleting mentor:', err);
            toast.error(err.message || 'Failed to delete mentor');
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    if (isLoading) {
        return <div className="loading">Loading Data .......</div>;
    }

    return (
        <div className="mentors-section">
            <div className="section-header">
                <h2>Mentors</h2>
                <button 
                    className="add-mentor-btn"
                    onClick={() => setShowAddMentorModal(true)}
                >
                    Add New Mentor
                </button>
            </div>

            <div className="search-pagination-controls">
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search mentors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mentors.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="no-mentors">No mentors found</td>
                            </tr>
                        ) : (
                            mentors.map((mentor) => (
                                <tr key={mentor.id}>
                                    <td>{mentor.id}</td>
                                    <td>{mentor.name}</td>
                                    <td>{mentor.username}</td>
                                    <td>
                                        <button
                                            className="delete-mentor-btn"
                                            onClick={() => handleDeleteMentor(mentor.id)}
                                        >
                                            Delete
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

            {showAddMentorModal && (
                <div className="modal-overlay" onClick={() => setShowAddMentorModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Add New Mentor</h2>
                        <form onSubmit={handleAddMentor}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={newMentor.name}
                                    onChange={(e) => setNewMentor({ ...newMentor, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={newMentor.username}
                                    onChange={(e) => setNewMentor({ ...newMentor, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={newMentor.password}
                                    onChange={(e) => setNewMentor({ ...newMentor, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowAddMentorModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit">Add Mentor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 