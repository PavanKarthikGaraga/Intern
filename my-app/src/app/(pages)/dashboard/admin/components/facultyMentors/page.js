'use client';
import { useState, useEffect } from 'react';
import { FaUserPlus, FaEye, FaTrash } from 'react-icons/fa';
import './page.css';

export default function FacultyMentors() {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMentor, setNewMentor] = useState({
        username: '',
        name: '',
        phoneNumber: '',
        email: ''
    });

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            const response = await fetch('/api/dashboard/admin/facultyMentors');
            const data = await response.json();
            
            if (data.success) {
                setMentors(data.mentors);
            } else {
                setError(data.error || 'Failed to fetch mentors');
            }
        } catch (err) {
            setError('Failed to fetch mentors');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMentor = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/dashboard/admin/facultyMentors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMentor),
            });

            const data = await response.json();
            if (data.success) {
                setShowAddModal(false);
                setNewMentor({
                    username: '',
                    name: '',
                    phoneNumber: '',
                    email: ''
                });
                fetchMentors();
            } else {
                setError(data.error || 'Failed to add mentor');
            }
        } catch (err) {
            setError('Failed to add mentor');
        }
    };

    const handleDeleteMentor = async (username) => {
        if (!window.confirm('Are you sure you want to delete this mentor?')) {
            return;
        }

        try {
            const response = await fetch(`/api/dashboard/admin/facultyMentors?username=${username}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (data.success) {
                fetchMentors();
            } else {
                setError(data.error || 'Failed to delete mentor');
            }
        } catch (err) {
            setError('Failed to delete mentor');
        }
    };

    if (loading) {
        return <div className="loading">Loading faculty mentors...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="mentors-section">
            <div className="section-header">
                <h1>Faculty Mentors</h1>
                <button 
                    className="add-mentor-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    <FaUserPlus /> Add New Mentor
                </button>
            </div>

            <div className="table-container">
                {mentors.length === 0 ? (
                    <div className="no-mentors">No Faculty Mentors Found</div>
                ) : (
                    <table className="mentors-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Stats</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mentors.map((mentor) => (
                                <tr key={mentor.username}>
                                    <td>{mentor.name}</td>
                                    <td>{mentor.username}</td>
                                    <td>{mentor.email}</td>
                                    <td>{mentor.phoneNumber}</td>
                                    <td>
                                        <div className="stats-badges">
                                            <span className="student-count">
                                                {mentor.totalStudents} Students
                                            </span>
                                            <span className="lead-count">
                                                {mentor.totalLeads} Leads
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="view-profile-btn"
                                                onClick={() => {
                                                    // TODO: Implement view profile functionality
                                                    alert('View profile functionality coming soon!');
                                                }}
                                            >
                                                <FaEye /> View Profile
                                            </button>
                                            <button 
                                                className="delete-btn"
                                                onClick={() => handleDeleteMentor(mentor.username)}
                                            >
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Add New Faculty Mentor</h2>
                            <button 
                                className="close-btn"
                                onClick={() => setShowAddModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form className="modal-form" onSubmit={handleAddMentor}>
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={newMentor.username}
                                    onChange={(e) => setNewMentor({
                                        ...newMentor,
                                        username: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={newMentor.name}
                                    onChange={(e) => setNewMentor({
                                        ...newMentor,
                                        name: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phoneNumber">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    value={newMentor.phoneNumber}
                                    onChange={(e) => setNewMentor({
                                        ...newMentor,
                                        phoneNumber: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={newMentor.email}
                                    onChange={(e) => setNewMentor({
                                        ...newMentor,
                                        email: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="submit-btn">
                                    Add Mentor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
