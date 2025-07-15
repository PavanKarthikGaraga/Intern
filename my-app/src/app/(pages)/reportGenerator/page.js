"use client";

import React, { useState, useRef } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { DOMAINS } from '../../Data/domains.js';
import { dailyActivities } from '../../Data/activities.js';
import styles from './page.module.css';

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

const ReportGenerator = () => {
  // Helper to get daily activity titles and timings for the selected day
  function getDailyActivity(day, id) {
    const dayObj = dailyActivities.find(d => d.day === Number(day));
    if (!dayObj) return null;
    return dayObj.activities.find(a => a.id === id) || null;
  }

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

  // Define activities with timing, name, and maxLen
  function getActivityDefinitions(day) {
    const dayObj = dailyActivities.find(d => d.day === Number(day));
    const activity4 = dayObj ? dayObj.activities.find(a => a.id === 4) : null;
    const activity9 = dayObj ? dayObj.activities.find(a => a.id === 9) : null;

    // List of activity definitions
    const defs = [
      { timing: '5:30 am - 6:00 am', name: 'Physical Exercise', maxLen: 100 },
      { timing: '6:00 am - 6:30 am', name: 'Yoga / Meditation', maxLen: 100 },
      { timing: '6:30 am - 7:30 am', name: '7-Days Swachhata Challenge', maxLen: 150 },
      { timing: '8:30 am - 10:00 am', name: 'Domain Specialized Field Study', maxLen: 600 },
      { 
        timing: activity4 ? `${activity4.startTime} - ${activity4.endTime}` : '10:00 am - 11:30 am', 
        name: activity4 ? activity4.title : 'Conduct a mini-survey and analyze 10 responses', 
        maxLen: 600 
      },
      { timing: '11:30 am - 12:00 pm', name: 'Indian Heritage Culture - LIPI Task', maxLen: 100 },
      { timing: '1:30 pm - 3:00 pm', name: 'Domain Study assigned in your 7 Days Domain Schedule', maxLen: 600 },
      { timing: '3:00 pm - 4:00 pm', name: 'Field Study / Field Visit', maxLen: 150 },
      { 
        timing: activity9 ? `${activity9.startTime} - ${activity9.endTime}` : '4:00 pm - 5:00 pm', 
        name: activity9 ? activity9.title : 'Interview a community elder about traditional knowledge', 
        maxLen: 150
      },
    ];

    // Set maxLen to 150 for 1hr activities with 2 images
    return defs.map(def => {
      const duration = getDurationMinutes(def.timing);
      const imageSlots = getTimeSlotsFromTiming(def.timing);
      if (duration === 60 && imageSlots.length === 2) {
        return { ...def, maxLen: 150 };
      }
      return def;
    });
  }

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
    activities: getActivityDefinitions("1").map(def => {
      const imageSlots = getTimeSlotsFromTiming(def.timing);
      return {
        name: def.name,
        timing: def.timing,
        maxLen: def.maxLen,
        imageSlots,
        images: imageSlots.map(() => null),
        description: ''
      };
    })
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef();
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 600;

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleInputChange = (e, activityIdx = null) => {
    const { name, value } = e.target;
    if (name === 'description' && activityIdx !== null) {
      const activity = formData.activities[activityIdx];
      
      // Only check maximum length during typing
      if (value.length > activity.maxLen) {
        toast.error(`Description for "${activity.name}" cannot exceed ${activity.maxLen} characters`);
        return;
      }

      setFormData(prev => {
        const updatedActivities = [...prev.activities];
        updatedActivities[activityIdx].description = value;
        return { ...prev, activities: updatedActivities };
      });
      // Update char count for this specific activity
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
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        // Create a new image to get dimensions
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with reduced quality
          const resizedImage = canvas.toDataURL('image/jpeg', 0.8);

          // Validate the generated image before storing
          const validImage = validateImageSrc(resizedImage);
          if (!validImage) {
            toast.error('Invalid image format generated. Please try again.');
            return;
          }

          setFormData(prev => {
            const updatedActivities = [...prev.activities];
            const updatedImages = [...updatedActivities[activityIdx].images];
            updatedImages[imageIdx] = validImage;
            updatedActivities[activityIdx].images = updatedImages;
            return { ...prev, activities: updatedActivities };
          });
        };
        img.src = event.target.result;
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

    // Check each activity individually
    for (let i = 0; i < activities.length; i++) {
      const activity = activities[i];
      const description = activity.description.trim();
      
      // Check if description is empty
      if (!description) {
        toast.error(`Description is required for activity: "${activity.name}"`);
        return false;
      }

      // Check minimum length requirements only during PDF generation
      if (activity.maxLen === 600 && description.length < 100) {
        toast.error(`Description for "${activity.name}" must be at least 100 characters (currently ${description.length} characters)`);
        return false;
      } else if (activity.maxLen === 100 && description.length < 50) {
        toast.error(`Description for "${activity.name}" must be at least 50 characters (currently ${description.length} characters)`);
        return false;
      }

      // Check if description exceeds max length
      if (description.length > activity.maxLen) {
        toast.error(`Description for "${activity.name}" exceeds ${activity.maxLen} characters (currently ${description.length} characters)`);
        return false;
      }

      // Check if all images are uploaded
      const missingImages = activity.images.findIndex(img => !img);
      if (missingImages !== -1) {
        toast.error(`Please upload an image for "${activity.name}" at ${activity.imageSlots[missingImages]}`);
        return false;
      }
    }
  
    return true;
  };
  

  const handleDownload = async () => {
    if (!validateForm()) return;
    setIsGenerating(true);
    try {
      const element = reportRef.current;
      
      // Wait for all images to load
      const images = element.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      const opt = {
        margin: 0.3,
        filename: `report_${formData.username}_day${formData.day}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true
        },
        jsPDF: { 
          unit: "in", 
          format: "a4", 
          orientation: "portrait",
          compress: true
        },
      };
      
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Update activities when day changes
  React.useEffect(() => {
    const newDefs = getActivityDefinitions(formData.day);
    setFormData(prev => ({
      ...prev,
      activities: newDefs.map((def, idx) => {
        // Try to preserve existing descriptions and images if possible
        const prevAct = prev.activities[idx] || {};
        const imageSlots = getTimeSlotsFromTiming(def.timing);
        let images = prevAct.images || [];
        // If the number of image slots changed, reset images
        if (images.length !== imageSlots.length) {
          images = imageSlots.map(() => null);
        }
        return {
          name: def.name,
          timing: def.timing,
          maxLen: def.maxLen,
          imageSlots,
          images,
          description: prevAct.description || ''
        };
      })
    }));
  }, [formData.day]);

  // Add this function to handle text overflow
  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Add function to validate and sanitize image sources
  const validateImageSrc = (imgSrc) => {
    if (!imgSrc || typeof imgSrc !== 'string') {
      return null;
    }
    
    // Check if it's a valid data URL for images
    const dataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp);base64,([A-Za-z0-9+/=]+)$/;
    if (!dataUrlPattern.test(imgSrc)) {
      return null;
    }
    
    return imgSrc;
  };

  // Add function to sanitize alt text
  const sanitizeAltText = (text) => {
    if (!text || typeof text !== 'string') {
      return 'Image';
    }
    
    // Remove any HTML tags and potentially dangerous characters
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>"'&]/g, '') // Remove dangerous characters
      .trim() || 'Image';
  };

  // Update the activity description rendering
  const renderActivityDescription = (description, maxLen) => {
    const truncatedDesc = truncateText(description, maxLen);
    return (
      <ul className={styles.pdfActivityDescList}>
        <li style={{ 
          fontSize: '12px', 
          lineHeight: '1.5',
          marginBottom: '10px',
          wordWrap: 'break-word'
        }}>
          {truncatedDesc}
        </li>
      </ul>
    );
  };

  return (
    <div className={styles.reportContainer}>
      <Toaster position="top-right" />
      <h1>Report Generator</h1>
      <div className={styles.reportForm}>
        <div className={styles.formStudentInfo}>
          <div className={styles.formGroup}>
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
          <div className={styles.formGroup}>
            <label>Domain:</label>
            <select name="domain" value={formData.domain} onChange={handleInputChange}>
              {DOMAINS.map(domain => (
                <option key={domain.id} value={domain.name}>{domain.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formDetailsContainer}>
          <div className={styles.formDetailsLeft}>
            <div className={styles.formGroup}>
              <label>Date:</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Venue:</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Mode:</label>
              <select name="mode" value={formData.mode} onChange={handleInputChange}>
                <option value="Remote">Remote</option>
                <option value="In Campus">In Campus</option>
                <option value="In Village">In Village</option>
              </select>
            </div>
            <div className={styles.formGroup}>
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

          <div className={styles.formDetailsRight}>
            <div className={styles.formGroup}>
              <label>Slot:</label>
              <select name="slot" value={formData.slot} onChange={handleInputChange}>
                <option value="1">Slot 1</option>
                <option value="2">Slot 2</option>
                <option value="3">Slot 3</option>
                <option value="4">Slot 4</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Day:</label>
              <select name="day" value={formData.day} onChange={handleInputChange}>
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <option key={day} value={day}>Day {day}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
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

        <div className={styles.activitiesSection}>
          {formData.activities.map((activity, activityIdx) => {
            const maxLen = activity.maxLen;
            const isThreeImages = activity.imageSlots.length === 3;
            const duration = getDurationMinutes(activity.timing);
            return (
              <div className={styles.activityFormBlock} key={activityIdx}>
                <h3>{activity.name}</h3>
                <div className={styles.activityRowFlex}>
                  <div className={styles.activityDescCol}>
                    <textarea
                      name="description"
                      className={styles.activityDescriptionInput}
                      value={activity.description}
                      onChange={(e) => handleInputChange(e, activityIdx)}
                      required
                      maxLength={maxLen}
                      rows={maxLen > 100 ? 8 : 3}
                      cols={100}
                      placeholder="Enter activity description"
                    />
                    <div className={styles.charCount}>{activity.description.length}/{maxLen} characters</div>
                    {isThreeImages && (
                      <div className={`${styles.activityImagesUpload} ${styles.activityImagesUploadBelow}`}>
                        {[1, 2].map((imgIdx) => (
                          <div className={`${styles.formGroup} ${styles.imageUploadGroup}`} key={imgIdx}>
                            <div className={styles.imageUploadRowTop}>
                              <label>Image ({activity.imageSlots[imgIdx]}):</label>
                              <img
                                src={validateImageSrc(activity.images[imgIdx]) || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                alt={activity.images[imgIdx] ? sanitizeAltText(`Preview ${activity.imageSlots[imgIdx]}`) : 'No Preview'}
                                className={styles.activityImagePreview}
                                style={{ visibility: activity.images[imgIdx] ? 'visible' : 'hidden' }}
                              />
                            </div>
                            <div className={styles.imageUploadRowBottom}>
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
                  <div className={styles.activityImagesUpload}>
                    {isThreeImages
                      ? [0].map((imgIdx) => (
                          <div className={`${styles.formGroup} ${styles.imageUploadGroup}`} key={imgIdx}>
                            <div className={styles.imageUploadRowTop}>
                              <label>Image ({activity.imageSlots[imgIdx]}):</label>
                              <img
                                src={validateImageSrc(activity.images[imgIdx]) || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                alt={activity.images[imgIdx] ? sanitizeAltText(`Preview ${activity.imageSlots[imgIdx]}`) : 'No Preview'}
                                className={styles.activityImagePreview}
                                style={{ visibility: activity.images[imgIdx] ? 'visible' : 'hidden' }}
                              />
                            </div>
                            <div className={styles.imageUploadRowBottom}>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e, activityIdx, imgIdx)}
                              />
                            </div>
                          </div>
                        ))
                      : activity.imageSlots.map((slot, imgIdx) => (
                          <div className={`${styles.formGroup} ${styles.imageUploadGroup}`} key={imgIdx}>
                            <div className={styles.imageUploadRowTop}>
                              <label>Image ({slot}):</label>
                              <img
                                src={validateImageSrc(activity.images[imgIdx]) || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                alt={activity.images[imgIdx] ? sanitizeAltText(`Preview ${slot}`) : 'No Preview'}
                                className={styles.activityImagePreview}
                                style={{ visibility: activity.images[imgIdx] ? 'visible' : 'hidden' }}
                              />
                            </div>
                            <div className={styles.imageUploadRowBottom}>
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
          className={styles.downloadBtn} 
          onClick={handleDownload}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>

      {/* Hidden report template for PDF generation */}
      <div style={{ display: 'none' }}>
        <div ref={reportRef} className={styles.pdfTemplate}>
          {/* Header */}
          <div className={styles.pdfHeader}>
            <div className={styles.pdfHeaderTitle}>Koneru Lakshmaiah Education Foundation</div>
            <div className={styles.pdfHeaderSubtitle}>(Deemed to be University)</div>
          </div>
          {/* SAC Logo and Social Internship 2025 below header */}
          <div className={styles.pdfHeaderRow} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', margin: '12px 0' }}>
            <img src="/sac.webp" alt="SAC Logo" style={{ height: '48px', width: 'auto' }} />
            <div className={styles.pdfHeaderInternship} style={{ fontWeight: 600, fontSize: '1.2rem', color: '#8b0000' }}>Social Internship 2025</div>
          </div>
          {/* Student Info Row */}
          <div className={styles.pdfInfoRow}>
            <span><strong>Student ID:</strong> {formData.username}</span>
            <span><strong>Domain:</strong> {formData.domain}</span>
          </div>
          {/* Details Table */}
          <div className={styles.pdfDetailsTable}>
            <div>
              <div className={styles.pdfDetailsTableItem}><strong>Date:</strong> {formatDate(formData.date)}</div>
              <div className={styles.pdfDetailsTableItem}><strong>Venue:</strong> {formData.location}</div>
              <div className={styles.pdfDetailsTableItem}><strong>Mode:</strong> {formData.mode}</div>
              <div className={styles.pdfDetailsTableItem}><strong>Duration:</strong> {formData.duration}</div>
            </div>
            <div>
              <div className={styles.pdfDetailsTableItem}><strong>Slot:</strong> {formData.slot}</div>
              <div className={styles.pdfDetailsTableItem}><strong>Day:</strong> {`Day ${formData.day}`}</div>
              <div className={styles.pdfDetailsTableItem}><strong>People:</strong> {formData.people}</div>
            </div>
          </div>
          
          {/* Activity Sections (PDF) */}
          {(() => {
            // Chunk activities into groups of 3 for each page
            const chunkSize = 3;
            const pages = [];
            for (let i = 0; i < formData.activities.length; i += chunkSize) {
              const chunk = formData.activities.slice(i, i + chunkSize);
              pages.push(
                <div key={`pdf-page-${i / chunkSize}`}>
                  {chunk.map((activity, activityIdx) => (
                    <div className={styles.pdfActivitySection} key={`${activity.name}-${activityIdx}`}>
                      <div className={styles.pdfActivityTitle}>{activity.name}</div>
                      <div className={styles.pdfActivityContent}>
                        {renderActivityDescription(activity.description, activity.maxLen)}
                        {activity.images.length === 3 ? (
                          <div className={styles.pdfActivityImages} style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '8px',
                            marginTop: '10px'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', width: '100%', justifyContent: 'center' }}>
                              {[0, 1].map(i => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45%' }}>
                                  {activity.images[i] ? (
                                    <img
                                      src={validateImageSrc(activity.images[i]) || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                      alt={sanitizeAltText(`Activity ${activityIdx + 1} Image ${i + 1}`)}
                                      className={styles.pdfActivityImg}
                                      style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div className={styles.pdfActivityImg} style={{ 
                                      background: '#eee', 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center', 
                                      color: '#aaa', 
                                      fontSize: '0.9rem', 
                                      flexDirection: 'column',
                                      width: '100%',
                                      height: '200px'
                                    }}>
                                      No Image
                                    </div>
                                  )}
                                  <div className={styles.pdfActivityTimeline} style={{ marginTop: '6px' }}>{activity.imageSlots[i]}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: '8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45%' }}>
                                {activity.images[2] ? (
                                  <img
                                    src={validateImageSrc(activity.images[2]) || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                    alt={sanitizeAltText(`Activity ${activityIdx + 1} Image 3`)}
                                    className={styles.pdfActivityImg}
                                    style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div className={styles.pdfActivityImg} style={{ 
                                    background: '#eee', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    color: '#aaa', 
                                    fontSize: '0.9rem', 
                                    flexDirection: 'column',
                                    width: '100%',
                                    height: '200px'
                                  }}>
                                    No Image
                                  </div>
                                )}
                                <div className={styles.pdfActivityTimeline} style={{ marginTop: '6px' }}>{activity.imageSlots[2]}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.pdfActivityImages} style={{ 
                            display: 'flex', 
                            flexDirection: 'row', 
                            gap: '24px', 
                            justifyContent: 'center',
                            marginTop: '10px'
                          }}>
                            {activity.images.map((img, i) => (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '45%' }}>
                                {img ? (
                                  <img
                                    src={validateImageSrc(img) || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                    alt={sanitizeAltText(`Activity ${activityIdx + 1} Image ${i + 1}`)}
                                    className={styles.pdfActivityImg}
                                    style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div className={styles.pdfActivityImg} style={{ 
                                    background: '#eee', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    color: '#aaa', 
                                    fontSize: '0.9rem', 
                                    flexDirection: 'column',
                                    width: '100%',
                                    height: '200px'
                                  }}>
                                    No Image
                                  </div>
                                )}
                                <div className={styles.pdfActivityTimeline}>{activity.imageSlots[i]}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Page break after each chunk except the last */}
                  {i + chunkSize < formData.activities.length && (
                    <div className={styles.pdfPageBreak} key={`break-${i / chunkSize}`} />
                  )}
                </div>
              );
            }
            return pages;
          })()}
          {/* PDF Footer (only after last page) */}
          <div className={styles.pdfFooter}>
            <div>KLSAC</div>
            <div>Social Internship 2025</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;