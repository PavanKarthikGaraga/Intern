"use client";

import React, { useState, useRef } from "react";
import toast, { Toaster } from 'react-hot-toast';
import "./page.css";

const ReportGenerator = () => {
  const [formData, setFormData] = useState({
    username: "",
    slot: "1",
    mode: "Remote",
    day: "1",
    domain: "",
    date: "",
    location: "",
    duration: "",
    people: "",
    description: "",
    geotaggedImages: {
      start: null,
      middle: null,
      end: null
    },
    normalImages: {
      first: null,
      second: null,
      third: null
    }
  });

  // const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const reportRef = useRef();
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 600;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'description') {
      if (value.length <= MAX_CHARS) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        setCharCount(value.length);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = (e, type, position) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            [position]: event.target.result
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const validateForm = () => {
    const { username, domain, date, location, duration, people, description, geotaggedImages } = formData;
    
    if (!username || !/^\d{10}$/.test(username)) {
      toast.error("Enter a valid 10-digit Student ID");
      return false;
    }
  
    if (!domain.trim()) {
      toast.error("Domain is required");
      return false;
    }
  
    if (!date) {
      toast.error("Date is required");
      return false;
    }
  
    if (!location.trim()) {
      toast.error("Venue is required");
      return false;
    }
  
    if (!duration.trim()) {
      toast.error("Duration is required");
      return false;
    }
  
    if (!people.trim()) {
      toast.error("People field is required");
      return false;
    }
  
    if (!description.trim() || description.length > MAX_CHARS) {
      toast.error("Description is required and must be under 600 characters");
      return false;
    }
  
    const geoImages = Object.values(geotaggedImages);
    if (geoImages.some(img => !img)) {
      toast.error("Please upload all 3 geotagged images (Start, Middle, End)");
      return false;
    }
  
    return true;
  };
  

  const handleDownload = async () => {
    if (!validateForm()) return;

    const element = reportRef.current;
    const opt = {
      margin: 0.3,
      filename: `report_${formData.username}_day${formData.day}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    
    toast.promise(
      (async () => {
        const html2pdf = (await import('html2pdf.js')).default;
        await html2pdf().set(opt).from(element).save();
      })(),
      {
        loading: 'Generating PDF...',
        success: 'PDF generated successfully!',
        error: 'Failed to generate PDF'
      }
    );
  };

  return (
    <div className="report-container">
      <Toaster position="top-right" />
      <h1>Report Generator</h1>
      <div className="report-form">
        <div className="form-student-info">
          <div className="form-group">
            <label>Student ID:</label>
            <input
              type="text"
              name="username"
              maxLength="10"
              pattern="[0-9]{10}"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Domain:</label>
            <input
              type="text"
              name="domain"
              value={formData.domain}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-details-container">
          <div className="form-details-left">
            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Venue:</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Mode:</label>
              <select name="mode" value={formData.mode} onChange={handleInputChange}>
                <option value="Remote">Remote</option>
                <option value="In Campus">In Campus</option>
              </select>
            </div>
            <div className="form-group">
              <label>Duration:</label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-details-right">
            <div className="form-group">
              <label>Slot:</label>
              <select name="slot" value={formData.slot} onChange={handleInputChange}>
                <option value="1">Slot 1</option>
                <option value="2">Slot 2</option>
                <option value="3">Slot 3</option>
                <option value="4">Slot 4</option>
              </select>
            </div>
            <div className="form-group">
              <label>Day:</label>
              <select name="day" value={formData.day} onChange={handleInputChange}>
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <option key={day} value={day}>Day {day}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>People:</label>
              <input
                type="text"
                name="people"
                value={formData.people}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="description-section">
          <h3>Description</h3>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            maxLength={MAX_CHARS}
          />
          <div className={`char-count ${charCount === MAX_CHARS ? 'limit-reached' : ''}`}>
            {charCount}/{MAX_CHARS} characters
          </div>
        </div>

        <div className="images-section">
          <h3>Geotagged Images</h3>
          <div className="images-grid">
            <div className="form-group">
              <label>Start:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'geotaggedImages', 'start')}
              />
            </div>
            <div className="form-group">
              <label>Middle:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'geotaggedImages', 'middle')}
              />
            </div>
            <div className="form-group">
              <label>End:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'geotaggedImages', 'end')}
              />
            </div>
          </div>

          <h3>Additional Images</h3>
          <div className="images-grid">
            {['first', 'second', 'third'].map((position) => (
              <div key={position} className="form-group">
                <label>Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'normalImages', position)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* <button className="preview-btn" onClick={handlePreview}>
          Show Preview
        </button> */}

        <button 
          className="download-btn" 
          onClick={handleDownload}
          disabled={isLoading}
        >
          {isLoading ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      {/* {showPreview && (
        <div className="report-preview">
          <div ref={reportRef}>
            <div className="header-wrapper">
              <div className="custom-header">
                <h1>Koneru Lakshmaiah Education Foundation</h1>
                <h2>(Deemed to be University)</h2>
              </div>
            </div>

            <div className="content-wrapper">
              <div className="event-info">
                <div className="student-info">
                  <div className="student-info-item">
                    <strong>Student ID:</strong>
                    <span>{formData.username}</span>
                  </div>
                  <div className="student-info-item">
                    <strong>Domain:</strong>
                    <span>{formData.domain}</span>
                  </div>
                </div>
                <div className="details-container">
                  <div className="details-left">
                    <div className="detail-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{formatDate(formData.date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Venue:</span>
                      <span className="detail-value">{formData.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Mode:</span>
                      <span className="detail-value">{formData.mode}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{formData.duration}</span>
                    </div>
                  </div>
                  <div className="details-right">
                    <div className="detail-item">
                      <span className="detail-label">Slot:</span>
                      <span className="detail-value">{formData.slot}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Day:</span>
                      <span className="detail-value">Day {formData.day}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">People:</span>
                      <span className="detail-value">{formData.people}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="description-section">
                <h3>Description</h3>
                <p>{formData.description}</p>
              </div>

              <div className="images-section">
                <h3>Geotagged Images</h3>
                <div className="images-grid">
                  {Object.entries(formData.geotaggedImages).map(([key, value]) => (
                    value && (
                      <div key={key} className="image-container">
                        <img src={value} alt={`Geotagged ${key}`} />
                        <div className="image-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                      </div>
                    )
                  ))}
                </div>

                <h3>Additional Images</h3>
                <div className="images-grid">
                  {Object.entries(formData.normalImages).map(([key, value]) => (
                    value && (
                      <div key={key} className="image-container">
                        <img src={value} alt={`Additional ${key}`} />
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Hidden report template for PDF generation */}
      <div style={{ display: 'none' }}>
        <div ref={reportRef}>
          <div className="header-wrapper">
            <div className="custom-header">
              <h1>Koneru Lakshmaiah Education Foundation</h1>
              <h2>(Deemed to be University)</h2>
            </div>
          </div>

          <div className="content-wrapper">
            <div className="event-info">
              <div className="student-info">
                <div className="student-info-item">
                  <strong>Student ID:</strong>
                  <span>{formData.username}</span>
                </div>
                <div className="student-info-item">
                  <strong>Domain:</strong>
                  <span>{formData.domain}</span>
                </div>
              </div>
              <div className="details-container">
                <div className="details-left">
                  <div className="detail-item">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{formatDate(formData.date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Venue:</span>
                    <span className="detail-value">{formData.location}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Mode:</span>
                    <span className="detail-value">{formData.mode}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{formData.duration}</span>
                  </div>
                </div>
                <div className="details-right">
                  <div className="detail-item">
                    <span className="detail-label">Slot:</span>
                    <span className="detail-value">{formData.slot}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Day:</span>
                    <span className="detail-value">Day {formData.day}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">People:</span>
                    <span className="detail-value">{formData.people}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="description-section">
              <h3>Description</h3>
              <p>{formData.description}</p>
            </div>

            <div className="images-section">
              <h3>Geotagged Images</h3>
              <div className="images-grid">
                {Object.entries(formData.geotaggedImages).map(([key, value]) => (
                  value && (
                    <div key={key} className="image-container">
                      <img src={value} alt={`Geotagged ${key}`} />
                      <div className="image-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                    </div>
                  )
                ))}
              </div>

              <h3>Additional Images</h3>
              <div className="images-grid">
                {Object.entries(formData.normalImages).map(([key, value]) => (
                  value && (
                    <div key={key} className="image-container">
                      <img src={value} alt={`Additional ${key}`} />
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
