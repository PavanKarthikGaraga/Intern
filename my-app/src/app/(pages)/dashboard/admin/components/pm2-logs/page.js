'use client';

import { useState, useEffect } from 'react';
import styles from './pm2-logs.module.css';

export default function PM2Logs() {
    const [logs, setLogs] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lines, setLines] = useState(100);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/admin/pm2-logs?lines=${lines}`);
            const data = await response.json();
            
            if (data.success) {
                setLogs(data.logs);
                setError(null);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        // Refresh logs every 5 seconds
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, [lines]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>PM2 Logs</h1>
                <div className={styles.controls}>
                    <label>
                        Lines to show:
                        <input
                            type="number"
                            value={lines}
                            onChange={(e) => setLines(e.target.value)}
                            min="1"
                            max="1000"
                        />
                    </label>
                    <button onClick={fetchLogs}>Refresh</button>
                </div>
            </div>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.logsContainer}>
                {loading ? (
                    <div className={styles.loading}>Loading logs...</div>
                ) : (
                    <pre className={styles.logs}>{logs}</pre>
                )}
            </div>
        </div>
    );
} 