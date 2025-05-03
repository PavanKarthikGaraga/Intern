"use client";

import React, { useState, useRef } from "react";
import toast, { Toaster } from 'react-hot-toast';
import "./page.css";

const ReportGenerator = () => {
  // Helper to parse time range and return array of 30-min slot labels
  function getTimeSlots(activityDesc) {
    // Extract time range (e.g., '5:30 am – 6:00 am')
    const match = activityDesc.match(/(\d{1,2}:\d{2} ?[ap]m) ?[–-] ?(\d{1,2}:\d{2} ?[ap]m)/i);
    if (!match) return [activityDesc];
    const [_, start, end] = match;
    // Convert to Date objects (arbitrary date)
    const toDate = t => {
      const [h, m] = t.replace(/ ?[ap]m/i, '').split(':').map(Number);
      let hour = h;
      if (/pm/i.test(t) && h !== 12) hour += 12;
      if (/am/i.test(t) && h === 12) hour = 0;
      return new Date(2000, 0, 1, hour, m);
    };
    let slots = [];
    let cur = toDate(start);
    const endDate = toDate(end);
    while (cur < endDate) {
      let next = new Date(cur.getTime() + 30 * 60000);
      if (next > endDate) next = endDate;
      const fmt = d => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/^0/, '');
      slots.push(`${fmt(cur).toLowerCase()} – ${fmt(next).toLowerCase()}`);
      cur = next;
    }
    return slots;
  }

  const activitySchedule = [
    '5:30 am – 6:00 am Physical Exercise',
    '6:00 am – 6:30 am Yoga / Meditation',
    '6:30 am – 7:30 am 7-Days Swachhata Challenge',
    '8:30 am – 10:00 am Domain Specialized Field Study',
    '10:00 am – 11:30 am Conduct a mini-survey and analyze 10 responses',
    '11:30 am – 12:00 pm Indian Heritage Culture - LIPI Task',
    '1:30 pm – 3:00 pm Domain Study assigned in your 7 Days Domain Schedule',
    '3:00 pm – 4:00 pm Field Study / Field Visit',
    '4:00 pm – 5:00 pm Interview a community elder about traditional knowledge'
  ];

  // Build initial activities state with correct number of image slots
  const initialActivities = activitySchedule.map(desc => ({
    description: desc,
    imageSlots: getTimeSlots(desc),
    images: getTimeSlots(desc).map(() => null)
  }));

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
    activities: initialActivities
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

  const handleInputChange = (e, activityIdx = null) => {
    const { name, value } = e.target;
    if (name === 'description' && activityIdx !== null) {
      setFormData(prev => {
        const updatedActivities = [...prev.activities];
        updatedActivities[activityIdx].description = value;
        return { ...prev, activities: updatedActivities };
      });
      setCharCount(value.length);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = (e, activityIdx, imageIdx) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => {
          const updatedActivities = [...prev.activities];
          const updatedImages = [...updatedActivities[activityIdx].images];
          updatedImages[imageIdx] = event.target.result;
          updatedActivities[activityIdx].images = updatedImages;
          return { ...prev, activities: updatedActivities };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const validateForm = () => {
    const { username, domain, date, location, duration, people, activities } = formData;
    
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
  
    if (activities.some(activity => !activity.description.trim() || activity.description.length > MAX_CHARS)) {
      toast.error("Activity descriptions must be under 600 characters");
      return false;
    }
  
    if (activities.some(activity => activity.images.some(img => !img))) {
      toast.error("Please upload an image for each 30-minute slot");
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

        <div className="activities-section">
          {formData.activities.map((activity, activityIdx) => (
            <div className="activity-form-block" key={activityIdx}>
              <h3>{activity.description}</h3>
              <input
                type="text"
                name="description"
                className="activity-description-input"
                value={activity.description}
                onChange={(e) => handleInputChange(e, activityIdx)}
                required
                maxLength={MAX_CHARS}
                placeholder="Enter activity description"
              />
              <div className="char-count">{activity.description.length}/{MAX_CHARS} characters</div>
              <div className="activity-images-upload">
                {activity.imageSlots.map((slot, imgIdx) => (
                  <div className="form-group" key={imgIdx}>
                    <label>Image ({slot}):</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, activityIdx, imgIdx)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
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
        <div ref={reportRef} className="pdf-template">
          {/* Header */}
          <div className="pdf-header">
            <div className="pdf-header-title">Koneru Lakshmaiah Education Foundation</div>
            <div className="pdf-header-subtitle">(Deemed to be University)</div>
          </div>

          {/* Student Info Row */}
          <div className="pdf-info-row">
            <span><strong>Student ID:</strong> {formData.username || '2300032048'}</span>
            <span><strong>Domain:</strong> {formData.domain || 'Education'}</span>
          </div>

          {/* Details Table */}
          <div className="pdf-details-table">
            <div>
              <div><strong>Date:</strong> {formatDate(formData.date) || '01/05/2025'}</div>
              <div><strong>Venue:</strong> {formData.location || 'KL University,vaddeswaram'}</div>
              <div><strong>Mode:</strong> {formData.mode || 'Remote'}</div>
              <div><strong>Duration:</strong> {formData.duration || '44'}</div>
            </div>
            <div>
              <div><strong>Slot:</strong> {formData.slot || '1'}</div>
              <div><strong>Day:</strong> {formData.day ? `Day ${formData.day}` : 'Day 2'}</div>
              <div><strong>People:</strong> {formData.people || '3'}</div>
            </div>
          </div>

          {/* Activity Sections */}
          {formData.activities.map((activity, activityIdx) => (
            <div className="pdf-activity-section" key={activityIdx}>
              <div className="pdf-activity-title">{activity.description}</div>
              <div className="pdf-activity-content">
                <ul className="pdf-activity-desc-list">
                  <li>{activity.description}</li>
                </ul>
                <div className="pdf-activity-images">
                  {activity.images.map((img, i) => (
                    img ? (
                      <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                        <img
                          src={img}
                          alt={`Activity ${activityIdx + 1} Image ${i + 1}`}
                          className="pdf-activity-img"
                        />
                        <div className="pdf-activity-timeline">{activity.imageSlots[i]}</div>
                      </div>
                    ) : (
                      <div key={i} className="pdf-activity-img" style={{background:'#eee',display:'flex',alignItems:'center',justifyContent:'center',color:'#aaa',fontSize:'0.9rem',flexDirection:'column'}}>
                        No Image
                        <div className="pdf-activity-timeline">{activity.imageSlots[i]}</div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
