'use client';
import { useState, useEffect } from 'react';
import './page.css';

export default function ReportDeadline() {
    const [deadlines, setDeadlines] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('1');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchDeadlines();
    }, []);

    const fetchDeadlines = async () => {
        try {
            const response = await fetch('/api/dashboard/admin/reportDeadline', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setDeadlines(data.data);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch report deadlines');
        } finally {
            setLoading(false);
        }
    };

    const handleExtend = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        
        if (!newDate || !newTime) {
            setError('Please select both date and time');
            return;
        }

        const dateTimeStr = `${newDate}T${newTime}`;
        
        setSubmitting(true);
        try {
            const response = await fetch('/api/dashboard/admin/reportDeadline', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    slot: parseInt(selectedSlot),
                    deadline: dateTimeStr
                })
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess('Deadline extended successfully');
                // Refresh list
                await fetchDeadlines();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to update deadline');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading deadlines...</div>;
    }

    const currentSlotDeadline = deadlines?.find(d => d.slot === parseInt(selectedSlot))?.deadline;

    return (
        <div className="report-deadline-container">
            <h2>Extend Report Deadline</h2>
            
            {error && <div className="message error">{error}</div>}
            {success && <div className="message success">{success}</div>}

            <form onSubmit={handleExtend}>
                <div className="form-group">
                    <label>Select Slot</label>
                    <select 
                        className="form-control"
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(e.target.value)}
                    >
                        {[1, 2, 3, 4, 5, 6].map(slot => (
                            <option key={slot} value={slot}>Slot {slot}</option>
                        ))}
                    </select>
                </div>

                <div className="deadline-display">
                    <p>Current Deadline for Slot {selectedSlot}:</p>
                    <strong>
                        {currentSlotDeadline 
                            ? new Date(currentSlotDeadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) 
                            : 'Not set'}
                    </strong>
                </div>

                <div className="form-group">
                    <label>New Deadline Date</label>
                    <input 
                        type="date" 
                        className="form-control"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>New Deadline Time</label>
                    <input 
                        type="time" 
                        className="form-control"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={submitting}
                >
                    {submitting ? 'Updating...' : 'Extend Deadline'}
                </button>
            </form>
        </div>
    );
}
