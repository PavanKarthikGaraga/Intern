'use client';

import { useState, useEffect } from 'react';
import './page.css';

export default function ReportControl() {
    const [reportStatus, setReportStatus] = useState({
        slot1: false,
        slot2: false,
        slot3: false,
        slot4: false
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchReportStatus();
    }, []);

    const fetchReportStatus = async () => {
        try {
            const response = await fetch('/api/dashboard/admin/reportControl', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setReportStatus({
                    slot1: data.data.slot1 || false,
                    slot2: data.data.slot2 || false,
                    slot3: data.data.slot3 || false,
                    slot4: data.data.slot4 || false
                });
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch report status');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (slot) => {
        try {
            const newStatus = {
                ...reportStatus,
                [slot]: !reportStatus[slot]
            };

            const response = await fetch('/api/dashboard/admin/reportControl', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(newStatus)
            });

            const data = await response.json();
            if (response.ok) {
                setReportStatus(newStatus);
                setSuccess('Report submission status updated successfully');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.error);
                setTimeout(() => setError(null), 3000);
            }
        } catch (err) {
            setError('Failed to update report status');
            setTimeout(() => setError(null), 3000);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="report-control-container">
            <h2>Final Report Submission Control</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="slots-container">
                {[1, 2, 3, 4].map((slot) => (
                    <div key={slot} className="slot-control">
                        <h3>Slot {slot}</h3>
                        <div className="toggle-container">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={reportStatus[`slot${slot}`] || false}
                                    onChange={() => handleToggle(`slot${slot}`)}
                                />
                                <span className="slider round"></span>
                            </label>
                            <span className="status-text">
                                {reportStatus[`slot${slot}`] ? 'Open' : 'Closed'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 