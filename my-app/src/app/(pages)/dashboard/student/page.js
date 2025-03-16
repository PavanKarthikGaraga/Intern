"use client";
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import './page.css';

export default function Student() {
    const [link, setLink] = useState('');
    const [dayNumber, setDayNumber] = useState('');
    const [studentId, setStudentId] = useState('');
    const [uploadStatus, setUploadStatus] = useState({ status: '', message: '' });
    const [isValidated, setIsValidated] = useState(false);
    const [isValidating, setIsValidating] = useState(false);

    const validateLink = async () => {
        if (!link) {
            toast.error("Please enter a link");
            return;
        }

        try {
            // First check if it's a valid URL format
            new URL(link);
            
            setIsValidating(true);
            toast.loading('Validating link...', { id: 'validating' });
            
            const response = await fetch('/api/validate-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ link }),
            });

            if (!response.ok) {
                throw new Error('Link validation failed');
            }

            const data = await response.json();
            if (data.valid) {
                setIsValidated(true);
                if (data.type === 'onedrive') {
                    toast.success('OneDrive link format validated!', { id: 'validating' });
                } else {
                    toast.success('Link validated successfully!', { id: 'validating' });
                }
                window.open(link, '_blank');
            } else {
                toast.error('Invalid link format. Please check the URL.', { id: 'validating' });
                setIsValidated(false);
            }
        } catch (error) {
            toast.error('Please enter a valid URL', { id: 'validating' });
            setIsValidated(false);
        } finally {
            setIsValidating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isValidated) {
            toast.error("Please validate the link first");
            return;
        }

        if (!link || !dayNumber || !studentId) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            setUploadStatus({ status: 'uploading', message: 'Submitting...' });
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    link,
                    dayNumber,
                    studentId
                }),
            });

            if (!response.ok) throw new Error('Submission failed');

            const data = await response.json();
            setUploadStatus({ 
                status: 'success', 
                message: `Link submitted successfully for Day ${dayNumber}!` 
            });
            setLink('');
            setDayNumber('');
        } catch (error) {
            setUploadStatus({ 
                status: 'error', 
                message: 'Failed to submit link. Please try again.' 
            });
        }
    };

    return (
        <div className="container">
            <Toaster position="top-center" />
            <form className="upload-container" onSubmit={handleSubmit}>
                <div className="input-group">
                    <div className="day-input-container">
                        <label htmlFor="day-number">Day Number:</label>
                        <input
                            type="number"
                            id="day-number"
                            value={dayNumber}
                            onChange={(e) => setDayNumber(e.target.value)}
                            min="1"
                            required
                            className="day-input"
                        />
                    </div>
                    <div className="student-id-container">
                        <label htmlFor="student-id">Student ID:</label>
                        <input
                            type="text"
                            id="student-id"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            required
                            className="student-id-input"
                        />
                    </div>
                </div>
                <div className="link-input-container">
                    <label htmlFor="link">Document Link:</label>
                    <div className="link-validation-group">
                        <input
                            type="url"
                            id="link"
                            value={link}
                            onChange={(e) => {
                                setLink(e.target.value);
                                setIsValidated(false);
                            }}
                            placeholder="Enter your document link here"
                            required
                            className="link-input"
                        />
                        <button 
                            type="button"
                            onClick={validateLink}
                            disabled={isValidating || !link}
                            className="validate-button"
                        >
                            {isValidating ? 'Validating...' : 'Validate & Preview'}
                        </button>
                    </div>
                    {isValidated && (
                        <div className="validation-success">
                            ✓ Link validated successfully
                        </div>
                    )}
                </div>
                <button 
                    type="submit" 
                    className="submit-button"
                    disabled={!isValidated || uploadStatus.status === 'uploading'}
                >
                    {uploadStatus.status === 'uploading' ? 'Submitting...' : 'Submit Link'}
                </button>
                {uploadStatus.message && (
                    <div className={`upload-status ${uploadStatus.status}`}>
                        {uploadStatus.message}
                    </div>
                )}
            </form>
        </div>
    );
}