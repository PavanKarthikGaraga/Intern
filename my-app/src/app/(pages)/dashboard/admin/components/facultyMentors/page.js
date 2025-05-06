'use client';
import { useState, useEffect } from 'react';
import { UserOutlined, EyeOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import EditModal from '../EditModal/page';
import FacultyProfile from '../facultyProfile/page';
import './page.css';

export default function FacultyMentors() {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        phoneNumber: '',
        email: '',
        branch: ''
    });

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            setError(null);
            const response = await fetch('/api/dashboard/admin/facultyMentors', {
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch faculty mentors');
            }

            const data = await response.json();
            if (data.success) {
                setMentors(data.mentors);
            } else {
                throw new Error(data.error || 'Failed to fetch faculty mentors');
            }
        } catch (err) {
            console.error('Error fetching faculty mentors:', err);
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/dashboard/admin/facultyMentors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Faculty mentor added successfully');
                setShowModal(false);
                setFormData({
                    username: '',
                    name: '',
                    phoneNumber: '',
                    email: '',
                    branch: ''
                });
                fetchMentors();
            } else {
                throw new Error(data.error || 'Failed to add faculty mentor');
            }
        } catch (err) {
            console.error('Error adding faculty mentor:', err);
            toast.error(err.message);
        }
    };

    const handleDelete = async (username) => {
        if (!window.confirm('Are you sure you want to delete this faculty mentor?')) {
            return;
        }

        try {
            const response = await fetch(`/api/dashboard/admin/facultyMentors?username=${username}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Faculty mentor deleted successfully');
                fetchMentors();
            } else {
                throw new Error(data.error || 'Failed to delete faculty mentor');
            }
        } catch (err) {
            console.error('Error deleting faculty mentor:', err);
            toast.error(err.message);
        }
    };

    const handleViewProfile = (username) => {
        setSelectedProfile(username);
    };

    const handleEditMentor = (mentor) => {
        setSelectedMentor(mentor);
        setShowEditModal(true);
    };

    const handleSaveEdit = async (result) => {
        if (result.success) {
            await fetchMentors();
        }
    };

    if (loading) {
        return <div className="loading">Loading Faculty Mentors data...</div>;
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
                    onClick={() => setShowModal(true)}
                >
                    <PlusOutlined /> Add New Mentor
                </button>
            </div>

            <div className="table-container">
                <table className="mentors-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Statistics</th>
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
                                            className="edit-btn"
                                            onClick={() => handleEditMentor(mentor)}
                                        >
                                            <EditOutlined /> Edit
                                        </button>
                                        <button 
                                            className="view-profile-btn"
                                            onClick={() => handleViewProfile(mentor.username)}
                                        >
                                            <EyeOutlined /> View Profile
                                        </button>
                                        <button 
                                            className="delete-btn"
                                            onClick={() => handleDelete(mentor.username)}
                                        >
                                            <DeleteOutlined /> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Mentor Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Add New Faculty Mentor</h2>
                            <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Branch</label>
                                <input
                                    type="text"
                                    name="branch"
                                    value={formData.branch}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="submit-btn">
                                    Add Faculty Mentor
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <EditModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    data={selectedMentor}
                    type="facultyMentors"
                    onSave={handleSaveEdit}
                />
            )}

            {/* Profile Modal */}
            {selectedProfile && (
                <FacultyProfile
                    isOpen={!!selectedProfile}
                    onClose={() => setSelectedProfile(null)}
                    username={selectedProfile}
                />
            )}
        </div>
    );
}
