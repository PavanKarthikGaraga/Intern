'use client';
import { useState, useEffect } from 'react';
import { FaUserPlus, FaTrash } from 'react-icons/fa';
import './page.css';

export default function Admins() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        username: '',
        name: ''
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const response = await fetch('/api/dashboard/admin/admins');
            const data = await response.json();
            
            if (data.success) {
                setAdmins(data.admins);
            } else {
                setError(data.error || 'Failed to fetch admins');
            }
        } catch (err) {
            setError('Failed to fetch admins');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/dashboard/admin/admins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newAdmin),
            });

            const data = await response.json();
            if (data.success) {
                setShowAddModal(false);
                setNewAdmin({
                    username: '',
                    name: ''
                });
                fetchAdmins();
            } else {
                setError(data.error || 'Failed to add admin');
            }
        } catch (err) {
            setError('Failed to add admin');
        }
    };

    const handleDeleteAdmin = async (username) => {
        if (!window.confirm('Are you sure you want to delete this admin?')) {
            return;
        }

        try {
            const response = await fetch(`/api/dashboard/admin/admins?username=${username}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (data.success) {
                fetchAdmins();
            } else {
                setError(data.error || 'Failed to delete admin');
            }
        } catch (err) {
            setError('Failed to delete admin');
        }
    };

    if (loading) {
        return <div className="loading">Loading admins...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="admins-section">
            <div className="section-header">
                <h1>Administrators</h1>
                <button 
                    className="add-admin-btn"
                    onClick={() => setShowAddModal(true)}
                >
                    <FaUserPlus /> Add New Admin
                </button>
            </div>

            <div className="table-container">
                {admins.length === 0 ? (
                    <div className="no-admins">No Administrators Found</div>
                ) : (
                    <table className="admins-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map((admin) => (
                                <tr key={admin.username}>
                                    <td>{admin.name}</td>
                                    <td>{admin.username}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button 
                                                className="delete-btn"
                                                onClick={() => handleDeleteAdmin(admin.username)}
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
                            <h2>Add New Administrator</h2>
                            <button 
                                className="close-btn"
                                onClick={() => setShowAddModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form className="modal-form" onSubmit={handleAddAdmin}>
                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={newAdmin.username}
                                    onChange={(e) => setNewAdmin({
                                        ...newAdmin,
                                        username: e.target.value
                                    })}
                                    required
                                />
                                <small className="help-text">Password will be set to username@sac</small>
                            </div>
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={newAdmin.name}
                                    onChange={(e) => setNewAdmin({
                                        ...newAdmin,
                                        name: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="submit-btn">
                                    Add Administrator
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 