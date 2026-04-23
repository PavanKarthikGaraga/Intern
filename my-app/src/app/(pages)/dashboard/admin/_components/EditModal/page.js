'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { branchNames } from '@/app/Data/branches';
import './page.css';

export default function EditModal({ isOpen, onClose, data, type, onSave }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (data) {
            // console.log(data);
            setFormData({
                username: data.username || '',
                name: data.name || '',
                email: data.email || '',
                phoneNumber: data.phoneNumber || '',
                slot: data.slot || '',
                branch: data.branch || ''
            });
        }
    }, [data]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/dashboard/admin/${type}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(`${type === 'facultyMentors' ? 'Faculty Mentor' : 'Student Lead'} updated successfully`);
                onSave(result);
                onClose();
            } else {
                const errorMessage = result.error || 'Failed to update';
                setError(errorMessage);
                toast.error(errorMessage);
            }
        } catch (err) {
            const errorMessage = 'An error occurred while updating';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Edit {type === 'facultyMentors' ? 'Faculty Mentor' : 'Student Lead'}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username || ''}
                            disabled
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="branch">Branch</label>
                        <select
                            id="branch"
                            name="branch"
                            value={formData.branch || ''}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Branch</option>
                            {branchNames.map((branch) => (
                                <option key={branch.id} value={branch.name}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {type === 'studentLeads' && (
                        <div className="form-group">
                            <label htmlFor="slot">Slot</label>
                            <input
                                type="number"
                                id="slot"
                                name="slot"
                                value={formData.slot || ''}
                                onChange={handleChange}
                                required
                                min="1"
                                max="10"
                            />
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    <div className="modal-actions">
                        <button type="button" className="cancel-button" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="save-button" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 