"use client";
import { useState, useEffect } from "react";
import "./page.css";

export default function Faculty() {
    const [registrations, setRegistrations] = useState([]);
    const [filteredRegistrations, setFilteredRegistrations] = useState([]);
    const [selectedDomain, setSelectedDomain] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [uploads, setUploads] = useState([]);

    useEffect(() => {
        fetchRegistrations();
    }, []);

    useEffect(() => {
        if (registrations.length > 0) {
            setFilteredRegistrations(
                selectedDomain === 'all' 
                    ? registrations 
                    : registrations.filter(reg => reg.selectedDomain === selectedDomain)
            );
        }
    }, [selectedDomain, registrations]);

    const fetchRegistrations = async () => {
        try {
            const response = await fetch('/api/dashboard/faculty', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setRegistrations(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Failed to load registrations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUploads = async (studentId) => {
        try {
            const response = await fetch('/api/dashboard/faculty', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ studentId })
            });
            
            if (!response.ok) throw new Error('Failed to fetch uploads');
            const data = await response.json();
            setUploads(data);
            setSelectedStudent(studentId);
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch uploads');
        }
    };

    const getStats = () => {
        const totalStudents = registrations.length;
        const domains = [...new Set(registrations.map(reg => reg.selectedDomain))];
        const studentsPerDomain = domains.reduce((acc, domain) => {
            acc[domain] = registrations.filter(reg => reg.selectedDomain === domain).length;
            return acc;
        }, {});
        return { totalStudents, domains, studentsPerDomain };
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="faculty-dashboard">
            <div className="faculty-intro">
                <div className="faculty-info">
                    <h1>Welcome, Faculty Mentor</h1>
                    <p>ID: FM001</p>
                </div>
                
                <div className="stats-cards">
                    <div className="stat-card">
                        <h3>Total Students</h3>
                        <p>{getStats().totalStudents}</p>
                    </div>
                    {Object.entries(getStats().studentsPerDomain).map(([domain, count]) => (
                        <div key={domain} className="stat-card">
                            <h3>{domain}</h3>
                            <p>{count} students</p>
                        </div>
                    ))}
                </div>

                <div className="filters">
                    <select 
                        value={selectedDomain} 
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className="domain-filter"
                    >
                        <option value="all">All Domains</option>
                        {getStats().domains.map(domain => (
                            <option key={domain} value={domain}>{domain}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="registrations-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID Number</th>
                            <th>Name</th>
                            <th>Domain</th>
                            <th>Branch</th>
                            <th>Year</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Uploads</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(filteredRegistrations || []).map((reg) => (
                            <tr key={reg.idNumber}>
                                <td>{reg.idNumber}</td>
                                <td>{reg.name}</td>
                                <td>{reg.selectedDomain}</td>
                                <td>{reg.branch}</td>
                                <td>{reg.year}</td>
                                <td>{reg.email}</td>
                                <td>{reg.phoneNumber}</td>
                                <td>
                                    <button 
                                        onClick={() => fetchUploads(reg.idNumber)}
                                        className="view-uploads-btn"
                                    >
                                        View Uploads ({reg.uploadsCount || 0})
                                    </button>
                                </td>
                                <td>
                                    <span className={`status ${reg.uploadStatus?.toLowerCase()}`}>
                                        {reg.uploadStatus || 'No uploads'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedStudent && (
                <div className="uploads-modal">
                    <div className="modal-content">
                        <h2>Student Uploads</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Day</th>
                                    <th>Link</th>
                                    <th>Uploaded At</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uploads.map((upload) => (
                                    <tr key={`${upload.idNumber}-${upload.dayNumber}`}>
                                        <td>Day {upload.dayNumber}</td>
                                        <td>
                                            <a 
                                                href={upload.link} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                View Document
                                            </a>
                                        </td>
                                        <td>
                                            {new Date(upload.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>{upload.uploadStatus}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button 
                            className="close-modal-btn"
                            onClick={() => setSelectedStudent(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}