"use client";
import { useState } from "react";
import "./page.css";
import "./styles.css";

export default function Student() {
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadStatus, setUploadStatus] = useState({ status: '', message: '' });
    const [dayNumber, setDayNumber] = useState('');
    const [studentId, setStudentId] = useState('');

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        validateAndSetFile(files[0]);
    };

    const handleChange = (e) => {
        validateAndSetFile(e.target.files[0]);
    };

    const validateAndSetFile = (file) => {
        if (!file) return;
        
        // Check file type
        if (file.type !== "application/pdf") {
            alert("Please upload a PDF file");
            return;
        }

        // Check file size (max 10MB)
        if (file.size >  1024 * 1024) {
            alert("File size should be less than 1MB");
            return;
        }

        setFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !dayNumber || !studentId) {
            alert("Please fill in all fields and select a file");
            return;
        }

        try {
            setUploadStatus({ status: 'uploading', message: 'Uploading...' });
            const formData = new FormData();
            formData.append('file', file);
            formData.append('dayNumber', dayNumber);
            formData.append('studentId', studentId);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setUploadStatus({ 
                status: 'success', 
                message: `File "${file.name}" uploaded successfully for Day ${dayNumber}!` 
            });
        } catch (error) {
            setUploadStatus({ 
                status: 'error', 
                message: 'Failed to upload file. Please try again.' 
            });
        }
    };

    return (
        <div className="container">
            <form
                className="upload-container"
                onDragEnter={handleDrag}
                onSubmit={handleSubmit}
            >
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
                <input 
                    type="file"
                    id="file-upload"
                    className="file-input"
                    accept=".pdf"
                    onChange={handleChange}
                />
                <label 
                    htmlFor="file-upload"
                    className={`upload-label ${dragActive ? 'drag-active' : ''}`}
                >
                    
                    {file ? (
                        <div className="file-info">
                        <p>Selected file: {file.name}</p>
                        <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button 
                            type="submit" 
                            className="submit-button"
                            disabled={uploadStatus.status === 'uploading'}
                        >
                            {uploadStatus.status === 'uploading' ? 'Uploading...' : 'Upload PDF'}
                        </button>
                    </div>) : (
                    <div>
                        <p>Drag and drop your PDF here or</p>
                        
                        <button type="button" className="upload-button">
                            Choose file
                        </button>
                    </div>)}
                </label>
                {uploadStatus.message && (
                    <div className={`upload-status ${uploadStatus.status}`}>
                        {uploadStatus.message}
                    </div>
                )}
                {dragActive && 
                    <div 
                        className="drag-overlay"
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    />
                }
            </form>
        </div>
    );
}