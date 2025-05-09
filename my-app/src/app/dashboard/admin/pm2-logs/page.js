'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './pm2-logs.module.css';

export default function PM2Logs() {
    const [logs, setLogs] = useState('');
    const [processes, setProcesses] = useState([]);
    const [lines, setLines] = useState(500);
    const [isLive, setIsLive] = useState(false);
    const [error, setError] = useState(null);
    const eventSourceRef = useRef(null);

    useEffect(() => {
        console.log('PM2 Logs: Component mounted');
        fetchLogs();

        return () => {
            if (eventSourceRef.current) {
                console.log('PM2 Logs: Closing EventSource connection');
                eventSourceRef.current.close();
            }
        };
    }, []);

    const fetchLogs = async () => {
        console.log('PM2 Logs: Fetching logs, lines:', lines);
        try {
            const response = await fetch(`/api/dashboard/admin/pm2-logs?lines=${lines}`);
            console.log('PM2 Logs: Response status:', response.status);
            
            const data = await response.json();
            console.log('PM2 Logs: Response data:', { 
                success: data.success, 
                processCount: data.processes?.length 
            });

            if (data.success) {
                setLogs(data.logs);
                setProcesses(data.processes);
                setError(null);
            } else {
                setError(data.error || 'Failed to fetch logs');
            }
        } catch (error) {
            console.error('PM2 Logs: Fetch error:', error);
            setError('Failed to fetch logs');
        }
    };

    const handleLinesChange = (e) => {
        const value = parseInt(e.target.value);
        console.log('PM2 Logs: Lines changed to:', value);
        if (!isNaN(value) && value > 0) {
            setLines(value);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>PM2 Logs</h1>
                <div className={styles.controls}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="lines">Number of Lines:</label>
                        <input
                            type="number"
                            id="lines"
                            value={lines}
                            onChange={handleLinesChange}
                            min="1"
                            max="1000"
                        />
                    </div>
                    <button 
                        onClick={fetchLogs}
                        className={styles.refreshButton}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            <div className={styles.content}>
                <div className={styles.processList}>
                    <h2>Running Processes</h2>
                    {processes.length > 0 ? (
                        <ul>
                            {processes.map((proc) => (
                                <li key={proc.pm_id} className={styles.processItem}>
                                    <span className={styles.processName}>{proc.name}</span>
                                    <span className={styles.processStatus} data-status={proc.pm2_env?.status}>
                                        {proc.pm2_env?.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No processes running</p>
                    )}
                </div>

                <div className={styles.logContainer}>
                    <pre className={styles.logs}>{logs || 'No logs available'}</pre>
                </div>
            </div>
        </div>
    );
} 