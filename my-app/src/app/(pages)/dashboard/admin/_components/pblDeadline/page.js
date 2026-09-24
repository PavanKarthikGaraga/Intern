'use client';
import { useState, useEffect } from 'react';
import './page.css';

export default function PblDeadline() {
    const [deadlines, setDeadlines] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('10');
    const [newStartDate, setNewStartDate] = useState('');
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndDate, setNewEndDate] = useState('');
    const [newEndTime, setNewEndTime] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchDeadlines();
    }, []);

    const fetchDeadlines = async () => {
        try {
            const response = await fetch('/api/dashboard/admin/pblDeadline', {
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
            setError('Failed to fetch PBL deadlines');
        } finally {
            setLoading(false);
        }
    };

    const handleExtend = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        
        if (!newStartDate || !newStartTime || !newEndDate || !newEndTime) {
            setError('Please select both start and end date/time');
            return;
        }

        const startDateTimeStr = `${newStartDate}T${newStartTime}`;
        const endDateTimeStr = `${newEndDate}T${newEndTime}`;
        
        setSubmitting(true);
        try {
            const response = await fetch('/api/dashboard/admin/pblDeadline', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    slot: parseInt(selectedSlot),
                    start_date: startDateTimeStr,
                    end_date: endDateTimeStr
                })
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess('PBL deadline updated successfully');
                // Refresh list
                await fetchDeadlines();
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to update PBL deadline');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading PBL deadlines...</div>;
    }

    const currentSlotData = deadlines?.find(d => d.slot === parseInt(selectedSlot));

    return (
        <div className="pbl-deadline-container">
            <h2>Set PBL Batch Deadline (Slot 10+)</h2>
            
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
                        {[10, 11, 12, 13, 14, 15].map(slot => (
                            <option key={slot} value={slot}>Slot {slot} (PBL)</option>
                        ))}
                    </select>
                </div>

                <div className="deadline-display">
                    <p>Current Start Window for Slot {selectedSlot}:</p>
                    <strong>
                        {currentSlotData?.start_date 
                            ? new Date(currentSlotData.start_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) 
                            : 'Not set'}
                    </strong>
                    <br/><br/>
                    <p>Current End Deadline for Slot {selectedSlot}:</p>
                    <strong>
                        {currentSlotData?.end_date 
                            ? new Date(currentSlotData.end_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) 
                            : 'Not set'}
                    </strong>
                </div>

                <div className="form-group">
                    <label>New Start Date</label>
                    <input 
                        type="date" 
                        className="form-control"
                        value={newStartDate}
                        onChange={(e) => setNewStartDate(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>New Start Time</label>
                    <input 
                        type="time" 
                        className="form-control"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>New End Date</label>
                    <input 
                        type="date" 
                        className="form-control"
                        value={newEndDate}
                        onChange={(e) => setNewEndDate(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>New End Time</label>
                    <input 
                        type="time" 
                        className="form-control"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={submitting}
                >
                    {submitting ? 'Updating...' : 'Set Deadline'}
                </button>
            </form>
        </div>
    );
}
