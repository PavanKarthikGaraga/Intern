"use client";

import React, { useState, useRef } from "react";
import toast, { Toaster } from 'react-hot-toast';
import { DOMAINS } from '../../Data/domains.js';
import { dailyActivities } from '../../Data/activities.js';
import styles from './page.module.css';

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
    const activity4 = getDailyActivity(day, 4);
    const activity9 = getDailyActivity(day, 9);
    return [
      { timing: '5:30 am - 6:00 am', name: 'Physical Exercise', maxLen: 100 },
      { timing: '6:00 am - 6:30 am', name: 'Yoga / Meditation', maxLen: 100 },
      { timing: '6:30 am - 7:30 am', name: '7-Days Swachhata Challenge', maxLen: 100 },
      { timing: '8:30 am - 10:00 am', name: 'Domain Specialized Field Study', maxLen: 600 },
      { timing: activity4 ? `${activity4.startTime} - ${activity4.endTime}` : '10:00 am - 11:30 am', name: activity4 ? activity4.title : 'Conduct a mini-survey and analyze 10 responses', maxLen: 100 },
      { timing: '11:30 am - 12:00 pm', name: 'Indian Heritage Culture - LIPI Task', maxLen: 100 },
      { timing: '1:30 pm - 3:00 pm', name: 'Domain Study assigned in your 7 Days Domain Schedule', maxLen: 600 },
      { timing: '3:00 pm - 4:00 pm', name: 'Field Study / Field Visit', maxLen: 100 },
      { timing: activity9 ? `${activity9.startTime} - ${activity9.endTime}` : '4:00 pm - 5:00 pm', name: activity9 ? activity9.title : 'Interview a community elder about traditional knowledge', maxLen: 100 },
    ];
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
    setIsGenerating(true);
    try {
      const element = reportRef.current;
      const opt = {
        margin: 0.3,
        filename: `report_${formData.username}_day${formData.day}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
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
                                src={activity.images[imgIdx] ? activity.images[imgIdx] : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                alt={activity.images[imgIdx] ? `Preview ${activity.imageSlots[imgIdx]}` : 'No Preview'}
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
                                src={activity.images[imgIdx] ? activity.images[imgIdx] : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                alt={activity.images[imgIdx] ? `Preview ${activity.imageSlots[imgIdx]}` : 'No Preview'}
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
                                src={activity.images[imgIdx] ? activity.images[imgIdx] : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                                alt={activity.images[imgIdx] ? `Preview ${slot}` : 'No Preview'}
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
                  <div className={styles.pdfActivitySection} key={activity.name}>
                    <div className={styles.pdfActivityTitle}>{activity.name}</div>
                    <div className={styles.pdfActivityContent}>
                      <ul className={styles.pdfActivityDescList}>
                        <li>{activity.description}</li>
                      </ul>
                      {activity.images.length === 3 ? (
                        <div className={styles.pdfActivityImages} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'row', gap: '24px', width: '100%', justifyContent: 'center' }}>
                            {[0, 1].map(i => (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {activity.images[i] ? (
                                  <img
                                    src={activity.images[i]}
                                    alt={`Activity ${activityIdx + 1} Image ${i + 1}`}
                                    className={styles.pdfActivityImg}
                                  />
                                ) : (
                                  <div className={styles.pdfActivityImg} style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.9rem', flexDirection: 'column' }}>
                                    No Image
                                  </div>
                                )}
                                <div className={styles.pdfActivityTimeline} style={{ marginTop: '6px' }}>{activity.imageSlots[i]}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: '0' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              {activity.images[2] ? (
                                <img
                                  src={activity.images[2]}
                                  alt={`Activity ${activityIdx + 1} Image 3`}
                                  className={styles.pdfActivityImg}
                                />
                              ) : (
                                <div className={styles.pdfActivityImg} style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.9rem', flexDirection: 'column' }}>
                                  No Image
                                </div>
                              )}
                              <div className={styles.pdfActivityTimeline} style={{ marginTop: '6px' }}>{activity.imageSlots[2]}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.pdfActivityImages}>
                          {activity.images.map((img, i) => (
                            img ? (
                              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <img
                                  src={img}
                                  alt={`Activity ${activityIdx + 1} Image ${i + 1}`}
                                  className={styles.pdfActivityImg}
                                />
                                <div className={styles.pdfActivityTimeline}>{activity.imageSlots[i]}</div>
                              </div>
                            ) : (
                              <div key={i} className={styles.pdfActivityImg} style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.9rem', flexDirection: 'column' }}>
                                No Image
                                <div className={styles.pdfActivityTimeline}>{activity.imageSlots[i]}</div>
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
                rendered.push(<div className={styles.pdfPageBreak} key={`break-${groupIdx}`} />);
              }
            });
            return rendered;
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
