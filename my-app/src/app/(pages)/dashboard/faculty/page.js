"use client";
import { useState, useEffect } from "react";
import "./page.css";

export default function Faculty() {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [uploads, setUploads] = useState([]);

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            const response = await fetch('/api/registrations');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setRegistrations(data);
        } catch (err) {
            setError('Failed to load registrations');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUploads = async (studentId) => {
        try {
            const response = await fetch('/api/registrations/uploads', {
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
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="faculty-dashboard">
            <h1>Student Registrations</h1>
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
                        {registrations.map((reg) => (
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
                                    <span className={`status ${reg.status?.toLowerCase()}`}>
                                        {reg.status || 'Pending'}
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
                                </tr>
                            </thead>
                            <tbody>
                                {uploads.map((upload) => (
                                    <tr key={upload.id}>
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