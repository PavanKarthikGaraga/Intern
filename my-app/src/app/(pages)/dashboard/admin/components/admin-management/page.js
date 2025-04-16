"use client";
import { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import Loader from '@/app/components/loader/loader';

export default function AdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        name: '',
        username: '',
        password: ''
    });

    useEffect(() => {
        fetchAdmins();
    }, [currentPage, searchQuery]);

    const fetchAdmins = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/dashboard/admin/admins?page=${currentPage}&limit=${itemsPerPage}&search=${searchQuery}`
            );
            if (!response.ok) throw new Error('Failed to fetch admins');
            const data = await response.json();
            if (data.success) {
                setAdmins(data.admins || []);
                setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
            }
        } catch (err) {
            console.error('Error fetching admins:', err);
            toast.error('Failed to load admins');
            setAdmins([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/dashboard/admin/add-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newAdmin.name,
                    username: newAdmin.username,
                    password: newAdmin.password,
                    role: 'admin'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add admin');
            }

            const data = await response.json();
            if (data.success) {
                toast.success('Admin added successfully');
                setShowAddAdminModal(false);
                setNewAdmin({
                    name: '',
                    username: '',
                    password: ''
                });
                fetchAdmins();
            }
        } catch (err) {
            console.error('Error adding admin:', err);
            toast.error(err.message || 'Failed to add admin');
        }
    };

    const handleDeleteAdmin = async (adminId) => {
        if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/dashboard/admin/delete-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ adminId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete admin');
            }

            const data = await response.json();
            if (data.success) {
                toast.success('Admin deleted successfully');
                fetchAdmins();
            }
        } catch (err) {
            console.error('Error deleting admin:', err);
            toast.error(err.message || 'Failed to delete admin');
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    if (isLoading) {
        return <div className="loading">Loading Data .......</div>;
    }

    return (
        <div className="admin-management-section">
            <div className="section-header">
                <h2>Admin Management</h2>
                <button 
                    className="add-admin-btn"
                    onClick={() => setShowAddAdminModal(true)}
                >
                    Add New Admin
                </button>
            </div>

            <div className="search-pagination-controls">
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search admins..."
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
                        {admins.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="no-admins">No admins found</td>
                            </tr>
                        ) : (
                            admins.map((admin) => (
                                <tr key={admin.id}>
                                    <td>{admin.id}</td>
                                    <td>{admin.name}</td>
                                    <td>{admin.username}</td>
                                    <td>
                                        <button
                                            className="delete-admin-btn"
                                            onClick={() => handleDeleteAdmin(admin.id)}
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

            {showAddAdminModal && (
                <div className="modal-overlay" onClick={() => setShowAddAdminModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Add New Admin</h2>
                        <form onSubmit={handleAddAdmin}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={newAdmin.name}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={newAdmin.username}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowAddAdminModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit">Add Admin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 