'use client';
import { useState, useEffect } from 'react';
import './page.css';

export default function StudentProfile({ isOpen, onClose, username }) {
    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (username) {
            fetchStudentData();
        }
    }, [username]);

    const fetchStudentData = async () => {
        try {
            const response = await fetch(`/api/dashboard/admin/studentProfile?username=${username}`);
            const data = await response.json();

            if (data.success) {
                setStudentData(data.student);
            } else {
                setError(data.error || 'Failed to fetch student data');
            }
        } catch (err) {
            setError('An error occurred while fetching student data');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="loading">Loading...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="error-message">{error}</div>
                    <button className="close-button" onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-over">
            <div className="modal-con">
                <div className="modal-header">
                    <h2>{studentData?.name} Profile</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="profile-content">
                    <div className="profile-section">
                        <h3>Personal Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Name:</label>
                                <span>{studentData?.name}</span>
                            </div>
                            <div className="info-item">
                                <label>Username:</label>
                                <span>{studentData?.username}</span>
                            </div>
                            <div className="info-item">
                                <label>Email:</label>
                                <span>{studentData?.email}</span>
                            </div>
                            <div className="info-item">
                                <label>Phone:</label>
                                <span>{studentData?.phoneNumber}</span>
                            </div>
                            <div className="info-item">
                                <label>Branch:</label>
                                <span>{studentData?.branch}</span>
                            </div>
                            <div className="info-item">
                                <label>Year:</label>
                                <span>{studentData?.year}</span>
                            </div>
                            <div className="info-item">
                                <label>Gender:</label>
                                <span>{studentData?.gender}</span>
                            </div>
                            <div className="info-item">
                                <label>Student Lead:</label>
                                <span>{studentData?.studentLeadId || 'Not Available'}</span>
                            </div>
                            <div className="info-item">
                                <label>Mentor Id:</label>
                                <span>{studentData?.facultyMentorId || 'Not Available'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h3>Program Details</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Selected Domain:</label>
                                <span>{studentData?.selectedDomain}</span>
                            </div>
                            <div className="info-item">
                                <label>Mode:</label>
                                <span>{studentData?.mode}</span>
                            </div>
                            <div className="info-item">
                                <label>Slot:</label>
                                <span>{studentData?.slot}</span>
                            </div>
                            <div className="info-item">
                                <label>Residence Type:</label>
                                <span>{studentData?.residenceType}</span>
                            </div>
                            {studentData?.residenceType === 'Hostel' && (
                                <div className="info-item">
                                    <label>Hostel Name:</label>
                                    <span>{studentData?.hostelName}</span>
                                </div>
                            )}
                            {studentData?.busRoute && (
                                <div className="info-item">
                                    <label>Bus Route:</label>
                                    <span>{studentData?.busRoute}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile-section">
                        <h3>Address Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Country:</label>
                                <span>{studentData?.country}</span>
                            </div>
                            <div className="info-item">
                                <label>State:</label>
                                <span>{studentData?.state}</span>
                            </div>
                            <div className="info-item">
                                <label>District:</label>
                                <span>{studentData?.district}</span>
                            </div>
                            <div className="info-item">
                                <label>Pincode:</label>
                                <span>{studentData?.pincode}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h3>Daily Submissions</h3>
                        <div className="submissions-grid">
                            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                                <div key={day} className="submission-item">
                                    <h4>Day {day}</h4>
                                    <div className="submission-details">
                                        <div className="submission-status">
                                            <label>Status:</label>
                                            <span className={studentData?.verify?.[`day${day}`] ? 'verified' : 'pending'}>
                                                {studentData?.verify?.[`day${day}`] ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="submission-attendance">
                                            <label>Attendance:</label>
                                            <span className={studentData?.attendance?.[`day${day}`] === 'P' ? 'present' : 'absent'}>
                                                {studentData?.attendance?.[`day${day}`] === 'P' ? 'Present' : 'Absent'}
                                            </span>
                                        </div>
                                        {studentData?.uploads?.[`day${day}`] && (
                                            <div className="submission-link">
                                                <a href={studentData.uploads[`day${day}`]} target="_blank" rel="noopener noreferrer">
                                                    View Submission
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {studentData?.final && (
                        <div className="profile-section">
                            <h3>Final Report</h3>
                            <div className="final-report">
                                <div className="report-status">
                                    <label>Status:</label>
                                    <span className={studentData.final.completed ? 'completed' : 'pending'}>
                                        {studentData.final.completed ? 'Completed' : 'Pending'}
                                    </span>
                                </div>
                                {studentData.final.finalReport && (
                                    <div className="report-link">
                                        <a href={studentData.final.finalReport} target="_blank" rel="noopener noreferrer">
                                            View Final Report
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {studentData?.marks && (
                        <div className="profile-section">
                            <h3>Evaluation</h3>
                            <div className="marks-grid">
                                <div className="mark-item">
                                    <label>Internal Marks (Daily Submissions):</label>
                                    <span>{studentData.marks.internalMarks}/60</span>
                                </div>
                                <div className="mark-item">
                                    <label>Case Study Report:</label>
                                    <span>{studentData.marks.caseStudyReportMarks}/30</span>
                                </div>
                                <div className="mark-item">
                                    <label>Conduct & Participation:</label>
                                    <span>{studentData.marks.conductParticipationMarks}/10</span>
                                </div>
                                <div className="mark-item total">
                                    <label>Total Marks:</label>
                                    <span>{studentData.marks.totalMarks}/100</span>
                                </div>
                                <div className="mark-item grade">
                                    <label>Grade:</label>
                                    <span>{studentData.marks.grade}</span>
                                </div>
                                {studentData.marks.feedback && (
                                    <div className="mark-item feedback">
                                        <label>Feedback:</label>
                                        <p>{studentData.marks.feedback}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 