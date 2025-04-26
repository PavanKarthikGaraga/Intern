'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import './page.css';

export default function DataDownload() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDownload = async (tableName) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/dashboard/admin/download/${tableName}`);
            if (!response.ok) {
                throw new Error('Failed to download data');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tableName}_data.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (user?.username !== '2300032048') {
        return null;
    }

    return (
        <div className="data-download-section">
            <h1>Data Download</h1>
            <p className="section-description">Download complete data from all tables</p>
            
            {error && <div className="error">{error}</div>}
            
            <div className="download-grid">
                <button 
                    className="download-btn"
                    onClick={() => handleDownload('users')}
                    disabled={loading}
                >
                    Download Users Data
                </button>
                <button 
                    className="download-btn"
                    onClick={() => handleDownload('studentLeads')}
                    disabled={loading}
                >
                    Download Student Leads Data
                </button>
                <button 
                    className="download-btn"
                    onClick={() => handleDownload('facultyMentors')}
                    disabled={loading}
                >
                    Download Faculty Mentors Data
                </button>
                <button 
                    className="download-btn"
                    onClick={() => handleDownload('registrations')}
                    disabled={loading}
                >
                    Download Registrations Data
                </button>
                <button 
                    className="download-btn"
                    onClick={() => handleDownload('uploads')}
                    disabled={loading}
                >
                    Download Uploads Data
                </button>
                <button 
                    className="download-btn"
                    onClick={() => handleDownload('verify')}
                    disabled={loading}
                >
                    Download Verification Data
                </button>
                <button 
                    className="download-btn"
                    onClick={() => handleDownload('attendance')}
                    disabled={loading}
                >
                    Download Attendance Data
                </button>
                <button 
                    className="download-btn"
                    onClick={() => handleDownload('final')}
                    disabled={loading}
                >
                    Download Final Reports Data
                </button>
                <button 
                    className="download-btn"
                    onClick={() => handleDownload('stats')}
                    disabled={loading}
                >
                    Download Statistics Data
                </button>
            </div>
            
            {loading && <div className="loading">Downloading data...</div>}
        </div>
    );
} 