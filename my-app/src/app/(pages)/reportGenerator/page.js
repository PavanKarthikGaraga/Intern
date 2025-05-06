"use client";

import React, { useState, useRef } from "react";
import toast, { Toaster } from 'react-hot-toast';
import "./page.css";
import { DOMAINS } from '../../Data/domains.js';

const ReportGenerator = () => {
  // Define activities with timing, name, and maxLen
  const activityDefinitions = [
    { timing: '5:30 am - 6:00 am', name: 'Physical Exercise', maxLen: 100 },
    { timing: '6:00 am - 6:30 am', name: 'Yoga / Meditation', maxLen: 100 },
    { timing: '6:30 am - 7:30 am', name: '7-Days Swachhata Challenge', maxLen: 100 },
    { timing: '8:30 am - 10:00 am', name: 'Domain Specialized Field Study', maxLen: 600 },
    { timing: '10:00 am - 11:30 am', name: 'Conduct a mini-survey and analyze 10 responses', maxLen: 100 },
    { timing: '11:30 am - 12:00 pm', name: 'Indian Heritage Culture - LIPI Task', maxLen: 100 },
    { timing: '1:30 pm - 3:00 pm', name: 'Domain Study assigned in your 7 Days Domain Schedule', maxLen: 600 },
    { timing: '3:00 pm - 4:00 pm', name: 'Field Study / Field Visit', maxLen: 100 },
    { timing: '4:00 pm - 5:00 pm', name: 'Interview a community elder about traditional knowledge', maxLen: 100 },
  ];

  // Helper to parse time range and return array of 30-min slot labels
  function getTimeSlotsFromTiming(timing) {
    const match = timing.match(/(\d{1,2}:\d{2} ?[ap]m) ?[–-] ?(\d{1,2}:\d{2} ?[ap]m)/i);
    if (!match) return [timing];
    const [_, start, end] = match;
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

  // Helper to parse time range and activity name
  function parseActivity(desc) {
    // e.g., '5:30 am – 6:00 am Physical Exercise'
    const match = desc.match(/^(\d{1,2}:\d{2} ?[ap]m ?[–-] ?\d{1,2}:\d{2} ?[ap]m) (.+)$/i);
    if (match) {
      return { timing: match[1], name: match[2] };
    }
    return { timing: '', name: desc };
  }

  const activitySchedule = [
    '5:30 am - 6:00 am Physical Exercise',
    '6:00 am - 6:30 am Yoga / Meditation',
    '6:30 am - 7:30 am 7-Days Swachhata Challenge',
    '8:30 am - 10:00 am Domain Specialized Field Study',
    '10:00 am - 11:30 am Conduct a mini-survey and analyze 10 responses',
    '11:30 am - 12:00 pm Indian Heritage Culture - LIPI Task',
    '1:30 pm - 3:00 pm Domain Study assigned in your 7 Days Domain Schedule',
    '3:00 pm - 4:00 pm Field Study / Field Visit',
    '4:00 pm - 5:00 pm Interview a community elder about traditional knowledge'
  ];

  // Build initial activities state with correct number of image slots
  const initialActivities = activityDefinitions.map(def => {
    const imageSlots = getTimeSlotsFromTiming(def.timing);
    return {
      name: def.name,
      timing: def.timing,
      maxLen: def.maxLen,
      imageSlots,
      images: imageSlots.map(() => null),
      description: ''
    };
  });

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

  // Helper to get duration in minutes from timing string
  function getDurationMinutes(timing) {
    const match = timing.match(/(\d{1,2}):(\d{2}) ?([ap]m)[ –-]+(\d{1,2}):(\d{2}) ?([ap]m)/i);
    if (!match) return 30;
    let [ , sh, sm, sap, eh, em, eap ] = match;
    sh = parseInt(sh, 10); sm = parseInt(sm, 10); eh = parseInt(eh, 10); em = parseInt(em, 10);
    if (sap.toLowerCase() === 'pm' && sh !== 12) sh += 12;
    if (sap.toLowerCase() === 'am' && sh === 12) sh = 0;
    if (eap.toLowerCase() === 'pm' && eh !== 12) eh += 12;
    if (eap.toLowerCase() === 'am' && eh === 12) eh = 0;
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    return end - start;
  }

  // Before rendering activities in the PDF, reorder so 'Domain Study assigned in your 7 Days Domain Schedule' comes before 'Domain Specialized Field Study'
  const reorderedActivities = [...formData.activities];
  const idxDomainStudy = reorderedActivities.findIndex(a => a.name === 'Domain Study assigned in your 7 Days Domain Schedule');
  const idxDomainSpecialized = reorderedActivities.findIndex(a => a.name === 'Domain Specialized Field Study');
  if (idxDomainStudy > -1 && idxDomainSpecialized > -1 && idxDomainStudy > idxDomainSpecialized) {
    const [domainStudy] = reorderedActivities.splice(idxDomainStudy, 1);
    reorderedActivities.splice(idxDomainSpecialized, 0, domainStudy);
  }

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
            <select name="domain" value={formData.domain} onChange={handleInputChange}>
              {DOMAINS.map(domain => (
                <option key={domain.id} value={domain.name}>{domain.name}</option>
              ))}
            </select>
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
                <option value="In Village">In Village</option>
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
          {formData.activities.map((activity, activityIdx) => {
            const maxLen = activity.maxLen;
            const isThreeImages = activity.imageSlots.length === 3;
            const duration = getDurationMinutes(activity.timing);
            return (
              <div className="activity-form-block" key={activityIdx}>
                <h3>{activity.name}</h3>
                <div className="activity-row-flex">
                  <div className="activity-desc-col">
                    <textarea
                      name="description"
                      className="activity-description-input"
                      value={activity.description}
                      onChange={(e) => handleInputChange(e, activityIdx)}
                      required
                      maxLength={maxLen}
                      rows={maxLen > 100 ? 8 : 3}
                      cols={100}
                      placeholder="Enter activity description"
                    />
                    <div className="char-count">{activity.description.length}/{maxLen} characters</div>
                    {/* If 3 images, render 2 image uploads below textarea */}
                    {isThreeImages && (
                      <div className="activity-images-upload activity-images-upload-below">
                        {[1, 2].map((imgIdx) => (
                          <div className="form-group image-upload-group" key={imgIdx}>
                            <div className="image-upload-row-top">
                              <label>Image ({activity.imageSlots[imgIdx]}):</label>
                              <img
                                src={activity.images[imgIdx] ? activity.images[imgIdx] : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                alt={activity.images[imgIdx] ? `Preview ${activity.imageSlots[imgIdx]}` : 'No Preview'}
                                className="activity-image-preview"
                                style={{ visibility: activity.images[imgIdx] ? 'visible' : 'hidden' }}
                              />
                            </div>
                            <div className="image-upload-row-bottom">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, activityIdx, imgIdx)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="activity-images-upload">
                    {/* If 3 images, render the first image upload beside textarea, else render all here */}
                    {isThreeImages
                      ? [0].map((imgIdx) => (
                          <div className="form-group image-upload-group" key={imgIdx}>
                            <div className="image-upload-row-top">
                              <label>Image ({activity.imageSlots[imgIdx]}):</label>
                              <img
                                src={activity.images[imgIdx] ? activity.images[imgIdx] : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                alt={activity.images[imgIdx] ? `Preview ${activity.imageSlots[imgIdx]}` : 'No Preview'}
                                className="activity-image-preview"
                                style={{ visibility: activity.images[imgIdx] ? 'visible' : 'hidden' }}
                              />
                            </div>
                            <div className="image-upload-row-bottom">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, activityIdx, imgIdx)}
                              />
                            </div>
                          </div>
                        ))
                      : activity.imageSlots.map((slot, imgIdx) => (
                          <div className="form-group image-upload-group" key={imgIdx}>
                            <div className="image-upload-row-top">
                              <label>Image ({slot}):</label>
                              <img
                                src={activity.images[imgIdx] ? activity.images[imgIdx] : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                alt={activity.images[imgIdx] ? `Preview ${slot}` : 'No Preview'}
                                className="activity-image-preview"
                                style={{ visibility: activity.images[imgIdx] ? 'visible' : 'hidden' }}
                              />
                            </div>
                            <div className="image-upload-row-bottom">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, activityIdx, imgIdx)}
                              />
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          className="download-btn" 
          onClick={handleDownload}
          disabled={isLoading}
        >
          {isLoading ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      {/* Hidden report template for PDF generation */}
      <div style={{ display: 'none' }}>
        <div ref={reportRef} className="pdf-template">
          {/* Header */}
          <div className="pdf-header">
            <div className="pdf-header-title">Koneru Lakshmaiah Education Foundation</div>
            <div className="pdf-header-subtitle">(Deemed to be University)</div>
          </div>
          {/* SAC Logo and Social Internship 2025 below header */}
          <div className="pdf-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', margin: '12px 0' }}>
            <img src="/sac.webp" alt="SAC Logo" style={{ height: '48px', width: 'auto' }} />
            <div className="pdf-header-internship" style={{ fontWeight: 600, fontSize: '1.2rem', color: '#8b0000' }}>Social Internship 2025</div>
          </div>
          {/* Student Info Row */}
          <div className="pdf-info-row">
            <span><strong>Student ID:</strong> {formData.username }</span>
            <span><strong>Domain:</strong> {formData.domain }</span>
          </div>
          {/* Details Table */}
          <div className="pdf-details-table">
            <div>
              <div className="pdf-details-table-item"><strong>Date:</strong> {formatDate(formData.date) }</div>
              <div className="pdf-details-table-item"><strong>Venue:</strong> {formData.location }</div>
              <div className="pdf-details-table-item"><strong>Mode:</strong> {formData.mode }</div>
              <div className="pdf-details-table-item"><strong>Duration:</strong> {formData.duration }</div>
            </div>
            <div>
              <div className="pdf-details-table-item"><strong>Slot:</strong> {formData.slot }</div>
              <div className="pdf-details-table-item"><strong>Day:</strong> {`Day ${formData.day}`}</div>
              <div className="pdf-details-table-item"><strong>People:</strong> {formData.people }</div>
            </div>
          </div>
          
          {/* Activity Sections (PDF) */}
          {(() => {
            // Group activities for PDF pages
            const group1 = ['Physical Exercise', 'Yoga / Meditation', '7-Days Swachhata Challenge'];
            const group2 = ['Domain Study assigned in your 7 Days Domain Schedule', 'Domain Specialized Field Study'];
            const group3 = ['Conduct a mini-survey and analyze 10 responses', 'Indian Heritage Culture - LIPI Task', 'Field Study / Field Visit'];
            const group4 = ['Interview a community elder about traditional knowledge'];
            const groups = [group1, group2, group3, group4];
            let rendered = [];
            groups.forEach((group, groupIdx) => {
              const acts = reorderedActivities.filter(a => group.includes(a.name));
              acts.forEach((activity, activityIdx) => {
                rendered.push(
                  <div className="pdf-activity-section" key={activity.name}>
                    <div className="pdf-activity-title">{activity.name}</div>
                    <div className="pdf-activity-content">
                      <ul className="pdf-activity-desc-list">
                        <li>{activity.description}</li>
                      </ul>
                      {activity.images.length === 3 ? (
                        <div className="pdf-activity-images" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', width: '100%', justifyContent: 'center' }}>
                            {[0, 1].map(i => (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {activity.images[i] ? (
                                  <img
                                    src={activity.images[i]}
                                    alt={`Activity ${activityIdx + 1} Image ${i + 1}`}
                                    className="pdf-activity-img"
                                  />
                                ) : (
                                  <div className="pdf-activity-img" style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.9rem', flexDirection: 'column' }}>
                                    No Image
                                  </div>
                                )}
                                <div className="pdf-activity-timeline" style={{ marginTop: '6px' }}>{activity.imageSlots[i]}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: '0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              {activity.images[2] ? (
                                <img
                                  src={activity.images[2]}
                                  alt={`Activity ${activityIdx + 1} Image 3`}
                                  className="pdf-activity-img"
                                />
                              ) : (
                                <div className="pdf-activity-img" style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.9rem', flexDirection: 'column' }}>
                                  No Image
                                </div>
                              )}
                              <div className="pdf-activity-timeline" style={{ marginTop: '6px' }}>{activity.imageSlots[2]}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="pdf-activity-images">
                          {activity.images.map((img, i) => (
                            img ? (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <img
                                  src={img}
                                  alt={`Activity ${activityIdx + 1} Image ${i + 1}`}
                                  className="pdf-activity-img"
                                />
                                <div className="pdf-activity-timeline">{activity.imageSlots[i]}</div>
                              </div>
                            ) : (
                              <div key={i} className="pdf-activity-img" style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.9rem', flexDirection: 'column' }}>
                                No Image
                                <div className="pdf-activity-timeline">{activity.imageSlots[i]}</div>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
              if (groupIdx < groups.length - 1) {
                rendered.push(<div className="pdf-page-break" key={`break-${groupIdx}`} />);
              }
            });
            return rendered;
          })()}
          {/* PDF Footer (only after last page) */}
          <div className="pdf-footer">
            <div>KLSAC</div>
            <div>Social Internship 2025</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
