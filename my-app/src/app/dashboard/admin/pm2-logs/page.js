'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './pm2-logs.module.css';

export default function PM2Logs() {
    const [logs, setLogs] = useState('');
    const [processes, setProcesses] = useState([]);
    const [lines, setLines] = useState(100);
    const [isLive, setIsLive] = useState(true);
    const [error, setError] = useState(null);
    const eventSourceRef = useRef(null);

    useEffect(() => {
        console.log('PM2 Logs: Component mounted');
        if (isLive) {
            setupEventSource();
        } else {
            fetchLogs();
        }

        return () => {
            if (eventSourceRef.current) {
                console.log('PM2 Logs: Closing EventSource connection');
                eventSourceRef.current.close();
            }
        };
    }, [isLive, lines]);

    const setupEventSource = () => {
        console.log('PM2 Logs: Setting up EventSource');
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const eventSource = new EventSource(`/api/dashboard/admin/pm2-logs?lines=${lines}&live=true`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            console.log('PM2 Logs: Received SSE update');
            try {
                const data = JSON.parse(event.data);
                if (data.success) {
                    setLogs(data.logs);
                    setProcesses(data.processes);
                    setError(null);
                } else {
                    setError(data.error || 'Failed to fetch logs');
                }
            } catch (error) {
                console.error('PM2 Logs: Error parsing SSE data:', error);
                setError('Error parsing server response');
            }
        };

        eventSource.onerror = (error) => {
            console.error('PM2 Logs: EventSource error:', error);
            setError('Connection lost. Retrying...');
            eventSource.close();
            // Attempt to reconnect after a delay
            setTimeout(setupEventSource, 5000);
        };
    };

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

    const handleLiveToggle = () => {
        console.log('PM2 Logs: Live mode toggled:', !isLive);
        setIsLive(!isLive);
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
                    <div className={styles.inputGroup}>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                checked={isLive}
                                onChange={handleLiveToggle}
                            />
                            <span className={styles.slider}></span>
                            Live Updates
                        </label>
                    </div>
                    {!isLive && (
                        <button 
                            onClick={fetchLogs}
                            className={styles.refreshButton}
                        >
                            Refresh
                        </button>
                    )}
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