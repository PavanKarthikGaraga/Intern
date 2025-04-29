'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import './page.css';

export default function BulkEmail() {
    const { user } = useAuth();
    const [ids, setIds] = useState('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [totalEmails, setTotalEmails] = useState(0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ids.trim()) {
            toast.error('Please enter at least one ID');
            return;
        }

        const idList = ids.split(/[\n, ]+/).filter(id => id.trim());
        
        // Check if number of IDs exceeds recommended limit
        if (idList.length > 200) {
            toast.error('Please enter maximum 200 IDs at a time');
            return;
        }

        setLoading(true);
        setProgress(0);
        setTotalEmails(idList.length);

        try {
            const response = await fetch('/api/dashboard/admin/bulk-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: idList }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Successfully queued ${data.totalSent} emails`);
                setIds('');
                setProgress(100);
            } else {
                throw new Error(data.error || 'Failed to send emails');
            }
        } catch (error) {
            console.error('Error sending bulk emails:', error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bulk-email-container">
            <h1>Bulk Email Sender</h1>
            
            <div className="instructions">
                <h3>How to Use:</h3>
                <ol>
                    <li>Enter student IDs (one per line or comma-separated)</li>
                    <li>Maximum 200 IDs can be processed at once</li>
                    <li>System will process 5 emails concurrently</li>
                    <li>Rate limit: 100 emails per minute</li>
                </ol>
                
                <h3>Example Format:</h3>
                <div className="example">
                    <p>2300032048</p>
                    <p>2300032049</p>
                    <p>2300032050</p>
                    <p className="or">OR</p>
                    <p>2300032048, 2300032049, 2300032050</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bulk-email-form">
                <div className="form-group">
                    <label htmlFor="ids">Student IDs</label>
                    <textarea
                        id="ids"
                        value={ids}
                        onChange={(e) => setIds(e.target.value)}
                        placeholder="Enter IDs (one per line or comma-separated)"
                        rows={10}
                        disabled={loading}
                    />
                    <p className="count">{ids.split(/[\n, ]+/).filter(id => id.trim()).length} IDs entered</p>
                </div>

                <div className="progress-container" style={{ display: loading ? 'block' : 'none' }}>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="progress-text">
                        Processing: {progress}% ({Math.round((progress/100) * totalEmails)} of {totalEmails} emails)
                    </p>
                </div>

                <button 
                    type="submit" 
                    className="submit-button"
                    disabled={loading || !ids.trim()}
                >
                    {loading ? 'Sending...' : 'Send Emails'}
                </button>
            </form>
        </div>
    );
} 