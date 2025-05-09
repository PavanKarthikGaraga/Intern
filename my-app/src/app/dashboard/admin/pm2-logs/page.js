'use client';

import { useState, useEffect } from 'react';
import styles from './pm2-logs.module.css';

export default function PM2Logs() {
    const [logs, setLogs] = useState('');
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lines, setLines] = useState(100);

    const fetchLogs = async () => {
        console.log('PM2 Logs Frontend: Fetching logs, lines:', lines);
        try {
            setLoading(true);
            const response = await fetch(`/api/dashboard/admin/pm2-logs?lines=${lines}`);
            console.log('PM2 Logs Frontend: Response status:', response.status);
            
            const data = await response.json();
            console.log('PM2 Logs Frontend: Response data:', {
                success: data.success,
                hasLogs: !!data.logs,
                processCount: data.processes?.length
            });
            
            if (data.success) {
                setLogs(data.logs);
                setProcesses(data.processes || []);
                setError(null);
                console.log('PM2 Logs Frontend: Successfully updated logs and processes');
            } else {
                console.error('PM2 Logs Frontend: Error in response:', data.error);
                setError(data.error || 'Failed to fetch logs');
            }
        } catch (err) {
            console.error('PM2 Logs Frontend: Fetch error:', err);
            setError('Failed to fetch logs: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('PM2 Logs Frontend: Component mounted, initial fetch');
        fetchLogs();
        // Refresh logs every 5 seconds
        const interval = setInterval(() => {
            console.log('PM2 Logs Frontend: Auto-refresh triggered');
            fetchLogs();
        }, 5000);
        return () => {
            console.log('PM2 Logs Frontend: Component unmounting, clearing interval');
            clearInterval(interval);
        };
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
                            onChange={(e) => {
                                console.log('PM2 Logs Frontend: Lines changed to:', e.target.value);
                                setLines(e.target.value);
                            }}
                            min="1"
                            max="1000"
                        />
                    </label>
                    <button onClick={() => {
                        console.log('PM2 Logs Frontend: Manual refresh clicked');
                        fetchLogs();
                    }}>Refresh</button>
                </div>
            </div>
            
            {error && <div className={styles.error}>{error}</div>}
            
            {processes.length > 0 && (
                <div className={styles.processes}>
                    <h2>Running Processes</h2>
                    <div className={styles.processList}>
                        {processes.map((proc) => (
                            <div key={proc.pm_id} className={styles.process}>
                                <span className={styles.processName}>{proc.name}</span>
                                <span className={styles.processStatus} data-status={proc.pm2_env?.status}>
                                    {proc.pm2_env?.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
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