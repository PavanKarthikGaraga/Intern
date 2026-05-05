'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import axios from "axios";

import { DOMAINS } from '../../Data/domains';
import { RULES, UNDERTAKING_POINTS } from '../../Data/rules';
import { girlHostels, boyHostels, busRoutes } from '../../Data/locations';
import { stateNames } from '../../Data/states';
import { districtNames } from '../../Data/districts';
import { countryCodes,countryNames } from '../../Data/coutries';
import { branchNames } from '../../Data/branches';
import { PROBLEM_STATEMENTS } from '../../Data/problemStatements';

// Remove duplicate country codes and sort alphabetically
const uniqueCountryCodes = countryCodes
  .filter((country, index, self) =>
    index === self.findIndex((c) => c.code === country.code)
  )
  .sort((a, b) => a.name.localeCompare(b.name));

export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    selectedDomain: '',
    problemStatement: '',
    fieldOfInterest: '',
    careerChoice: '',
    batch: '',
    agreedToRules: false,
    mode: '',
    accommodationRequired: '',
    transportationRequired: '',
    slot: '',
    studentInfo: {
      name: '',
      idNumber: '',
      email: '',
      branch: '',
      gender: '',
      year: '',
      phoneNumber: '',
    },
    residence: {
      type: '',
      country: 'IN',
      state: '',
      district: '',
      pincode: '',
      hostelName: '',
      busRoute: ''
    }
  });

  const SLOT_DATES = {
    1: "May 11 – May 17",
    2: "May 18 – May 24",
    3: "May 25 – May 31",
    4: "Jun 1 – Jun 7",
    5: "Jun 8 – Jun 14",
    6: "Jun 15 – Jun 21",
    7: "Jun 22 – Jun 28",
    8: "Jun 29 – Jul 5",
    9: "Jul 6 – Jul 12"
  };

  const SLOT_BATCH = {
    1: 'Y-25-VJA', 2: 'Y-25-VJA', 3: 'Y-25-VJA', 4: 'Y-25-VJA', 5: 'Y-25-VJA', 6: 'Y-25-VJA',
    7: 'Y-24', 8: 'Y-24', 9: 'Y-24'
  };

  // Batches that only support Remote mode
  const REMOTE_ONLY_BATCHES = ['Y-25-HYD', 'Y-24'];
  const isRemoteOnly = (batch) => REMOTE_ONLY_BATCHES.includes(batch);

  const [selectedDomainInfo, setSelectedDomainInfo] = useState('');
  const [stats, setStats] = useState(null);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Add new useEffect for initial stats loading
  useEffect(() => {
    const loadInitialStats = async () => {
      try {
        const response = await axios.get('/api/register/stats');
        const data = response.data;
        
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error loading initial stats:', error);
      }
    };

    loadInitialStats();
  }, []); // Empty dependency array means this runs once on mount

  const handleDomainClick = (domain) => {
    setSelectedDomainInfo(domain.description);
    setFormData(prev => ({
      ...prev,
      selectedDomain: domain.name
    }));
  };

  const router = useRouter();

  const GoToHome = () => {
    router.push('/'); // Navigate to the home page
  };


  const handleInputChange = (section, field, value) => {
    if (section === 'studentInfo') {
      if (field === 'idNumber') {
        // When ID changes, update email with default format
        setFormData(prev => ({
          ...prev,
          studentInfo: {
            ...prev.studentInfo,
            idNumber: value,
            email: value ? `${value}@kluniversity.in` : ''
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          studentInfo: {
            ...prev.studentInfo,
            [field]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        residence: {
          ...prev.residence,
          [field]: value
        }
      }));
    }
  };

  const handleDeleteId = () => {
    setFormData(prev => ({
      ...prev,
      studentInfo: {
        ...prev.studentInfo,
        idNumber: '',
        email: ''
      }
    }));
  };

  const handleNext = () => {
    // Validation for each step
    switch (currentStep) {
      case 1: {
        // Program details - no validation needed
        toast.success('Moving to rules...');
        setCurrentStep(prev => prev + 1);
        break;
      }
      
      case 2: {
        // Rules - no validation needed
        toast.success('Moving to undertaking...');
        setCurrentStep(prev => prev + 1);
        break;
      }
      
      case 3: {
        if (!formData.agreedToRules) {
          toast.error('Please agree to the terms to continue');
          return;
        }
        toast.success('Terms accepted!');
        setCurrentStep(prev => prev + 1);
        break;
      }
      
      case 4: {
        if (!formData.selectedDomain) {
          toast.error('Please select a domain to continue');
          return;
        }
        if (formData.mode === 'Incampus') {
          if (!formData.accommodationRequired) {
            toast.error('Please select whether accommodation is required');
            return;
          }
          if (formData.accommodationRequired === 'No' && !formData.transportationRequired) {
            toast.error('Please select whether transportation is required');
            return;
          }
        }
        if (!formData.problemStatement) {
          toast.error('Please select a Problem Statement to continue');
          return;
        }
        toast.success('Domain selected successfully!');
        setCurrentStep(prev => prev + 1);
        break;
      }
      
      case 5: {
        // Student Information validation
        const studentValidation = [
          { field: 'idNumber', message: 'Please enter your ID number' },
          { field: 'name', message: 'Please enter your name' },
          { field: 'email', message: 'Please enter your email' },
          { field: 'branch', message: 'Please select your branch' },
          { field: 'gender', message: 'Please select your gender' },
          { field: 'year', message: 'Please select your year' },
          { field: 'phoneNumber', message: 'Please enter your phone number' }
        ];

        for (const validation of studentValidation) {
          if (!formData.studentInfo[validation.field]) {
            toast.error(validation.message);
            return;
          }
        }

        if (formData.studentInfo.phoneNumber.length !== 10) {
          toast.error('Please enter a valid 10-digit phone number');
          return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@kluniversity\.in$/;
        if (!emailRegex.test(formData.studentInfo.email)) {
          toast.error('Please enter a valid KL University email address');
          return;
        }

        if (!/^(24|25)\d{8}$/.test(formData.studentInfo.idNumber)) {
          toast.error('Please enter a valid 10-digit ID number starting with 24 or 25');
          return;
        }

        toast.success('Student information saved successfully!');
        setCurrentStep(prev => prev + 1);
        break;
      }
      
      case 6: {
        // Residence validation
        if (!formData.residence.type) {
          toast.error('Please select your residence type');
          return;
        }

        if (formData.residence.type === 'hostel' && !formData.residence.hostelName) {
          toast.error('Please select your hostel');
          return;
        }

        if (formData.residence.type === 'dayscholar' && !formData.residence.busRoute) {
          toast.error('Please select your transport mode');
          return;
        }

        if (!formData.residence.country) {
          toast.error('Please select your country');
          return;
        }

        if (formData.residence.country === 'IN') {
          const indiaValidation = [
            { field: 'state', message: 'Please select your state' },
            { field: 'district', message: 'Please enter your district' },
            { field: 'pincode', message: 'Please enter your PIN code' }
          ];

          for (const validation of indiaValidation) {
            if (!formData.residence[validation.field]) {
              toast.error(validation.message);
              return;
            }
          }

          // Validate PIN code format
          if (!/^\d{6}$/.test(formData.residence.pincode)) {
            toast.error('Please enter a valid 6-digit PIN code');
            return;
          }
        }

        toast.success('Current Residence information saved successfully!');
        setCurrentStep(prev => prev + 1);
        break;
      }

      default: {
        setCurrentStep(prev => prev + 1);
        break;
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    let loadingToast;
    try {
      // Basic validation
      if (!formData.studentInfo.idNumber || !formData.studentInfo.name || !formData.selectedDomain || !formData.problemStatement) {
        toast.error('Please fill in all required fields');
        return;
      }
  
      // Email validation
      const emailRegex = /^[^\s@]+@kluniversity\.in$/;
      if (!emailRegex.test(formData.studentInfo.email)) {
        toast.error('Please enter a valid KL University email address');
        return;
      }
  
      // Phone number validation
      if (formData.studentInfo.phoneNumber.length !== 10) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }
  
      // ID number validation
      if (!/^(24|25)\d{8}$/.test(formData.studentInfo.idNumber)) {
        toast.error('Please enter a valid 10-digit ID number starting with 24 or 25');
        return;
      }
  
      // Show loading toast
      loadingToast = toast.loading('Submitting registration...');
  
      // Send request to backend
      const response = await axios.post("/api/register", formData, {
        headers: { "Content-Type": "application/json" }
      });
  
      const data = response.data;
  
      // Dismiss loading toast
      toast.dismiss(loadingToast);
  
      if (data.success) {
        toast.dismiss();
        setRegistrationSuccess(true);
      } else {
        console.log("Registration error:", data);
        toast.error(data.error || 'Registration failed. Please try again.'); // Display specific error message from backend
      }
    } catch (error) {
      // Ensure loading toast is dismissed
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
  
      // Handling different error scenarios
      if (error.response) {
        console.log("Registration error:", error.response.data);
        // Display error from backend (if available)
        toast.error(error.response.data.error || error.response.data.message || "Registration failed. Please try again.");
      } else {
        console.log("Registration error:", error);
        toast.error("A network error occurred. Please try again.");
      }
    }
  };
  

  const checkAvailability = useCallback(async () => {
    if (formData.mode && formData.slot) {
      try {
        const response = await axios.get('/api/register/stats');
        const data = response.data;
        
        if (data.success) {
          setStats(data.stats);
          const currentStats = data.stats;
          const slotField = `slot${formData.slot}`;
          const slotModeField = formData.mode === 'Remote' ? `slot${formData.slot}Remote` : 
                              formData.mode === 'Incampus' ? `slot${formData.slot}Incamp` : 
                              `slot${formData.slot}Invillage`;
          
          // Capacity limits removed

          // If both checks pass, show available message
          setAvailabilityMessage('Available');
          setIsAvailable(true);
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailabilityMessage('Error checking availability. Please try again.');
        setIsAvailable(false);
      }
    } else {
      setAvailabilityMessage('');
    }
  }, [formData.mode, formData.slot]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const checkSlotAvailability = (slot, mode) => {
    if (!stats) return 'Loading...';
    
    const slotField = `slot${slot}`;
    const slotModeField = `slot${slot}${mode}`;
    
    // Capacity limits removed

    return 'Available';
  };

  const handleSlotChange = (slot) => {
    setFormData(prev => ({...prev, slot: slot.toString()}));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <section className="section">
            {/* <h2>Social Internship Details</h2> */}
            <div className="program-content">
              <div className="program-header">
                <h3>Social Internship Program — 2026</h3>
                <div className="program-highlights">
                  <div className="highlight-item">
                    <span className="highlight-label">Duration</span>
                    <span className="highlight-value">7 Days / Slot</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">Min Hours</span>
                    <span className="highlight-value">80 hrs</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">Max Hours</span>
                    <span className="highlight-value">120 hrs</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">Start Date</span>
                    <span className="highlight-value">May 11, 2026</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">End Date</span>
                    <span className="highlight-value">Jul 11, 2026</span>
                  </div>
                </div>
              </div>

              <div className="program-sections">
                <div className="program-section">
                  <h4>Program Overview</h4>
                  <p>The Social Internship (Smart Village Revolution) is a mandatory part of the Summer Academic Curriculum for Y-25 students (Vijayawada &amp; Hyderabad Off-Campus). Students must complete <strong>80–120 hours</strong> within their selected 7-day slot.</p>
                </div>
                <div className="slots-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Slot</th>
                        <th>Batch</th>
                        <th>Dates</th>
                        <th>Remote (Home Town)</th>
                        <th>In-Campus (Campus → Villages)</th>
                        <th>In-Village (KLU Adopted Villages)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Y-25 Slots */}
                      <tr><td colSpan={6} style={{background:'linear-gradient(135deg, #014a01 0%, #006400 50%, #008a00 100%)',color:'#fff',fontWeight:700,textAlign:'center',padding:'10px 16px',fontSize:'0.92rem',letterSpacing:'0.06em',textShadow:'0 1px 4px rgba(0,0,0,0.3)',borderRadius:'4px 4px 0 0'}}>Y-25 Batch — Vijayawada &amp; Hyderabad Off-Campus</td></tr>
                      {[1, 2, 3, 4, 5, 6].map((slot) => (
                        <tr 
                          key={slot}
                          className={formData.slot === slot.toString() ? 'selected-row' : ''}
                          onClick={() => handleSlotChange(slot)}
                          style={{cursor:'pointer'}}
                        >
                          <td>Slot {slot}</td>
                          <td><span className="batch-tag y25">Y-25</span></td>
                          <td>{SLOT_DATES[slot]}</td>
                          <td data-status={checkSlotAvailability(slot, 'Remote').toLowerCase().replace(' ', '-')}>
                            {stats ? stats[`slot${slot}Remote`] || 0 : 0} Registered
                          </td>
                          <td data-status={checkSlotAvailability(slot, 'Incampus').toLowerCase().replace(' ', '-')}>
                            {stats ? stats[`slot${slot}Incamp`] || 0 : 0} Registered
                          </td>
                          <td data-status={checkSlotAvailability(slot, 'InVillage').toLowerCase().replace(' ', '-')}>
                            {stats ? stats[`slot${slot}Invillage`] || 0 : 0} Registered
                          </td>
                        </tr>
                      ))}
                      
                      {/* Y-24 Slots */}
                      <tr><td colSpan={6} style={{background:'linear-gradient(135deg, #7a0002 0%, #970003 50%, #c00004 100%)',color:'#fff',fontWeight:700,textAlign:'center',padding:'10px 16px',fontSize:'0.92rem',letterSpacing:'0.06em',textShadow:'0 1px 4px rgba(0,0,0,0.3)'}}>Y-24 Batch (Detained) / Supply Students</td></tr>
                      {[7, 8, 9].map((slot) => (
                        <tr 
                          key={slot}
                          className={formData.slot === slot.toString() ? 'selected-row' : ''}
                          onClick={() => handleSlotChange(slot)}
                          style={{cursor:'pointer'}}
                        >
                          <td>Slot {slot}</td>
                          <td><span className="batch-tag y24">Y-24</span></td>
                          <td>{SLOT_DATES[slot]}</td>
                          <td data-status={checkSlotAvailability(slot, 'Remote').toLowerCase().replace(' ', '-')}>
                            {stats ? stats[`slot${slot}Remote`] || 0 : 0} Registered
                          </td>
                          <td data-status={checkSlotAvailability(slot, 'Incampus').toLowerCase().replace(' ', '-')}>
                            {stats ? stats[`slot${slot}Incamp`] || 0 : 0} Registered
                          </td>
                          <td data-status={checkSlotAvailability(slot, 'InVillage').toLowerCase().replace(' ', '-')}>
                            {stats ? stats[`slot${slot}Invillage`] || 0 : 0} Registered
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="button-group">
            <button className="back-button" onClick={GoToHome}>Back</button>
              <button className="next-button" onClick={handleNext}>
                Next
              </button>
            </div>
          </section>
        );

      case 2:
        return (
          <section className="section">
            <h2>Rules and Guidelines</h2>
            <div className="rules-content">
              <ul className="rules-list">
                {RULES.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            </div>
            <div className="button-group">
              <button className="back-button" onClick={handleBack}>Back</button>
              <button className="next-button" onClick={handleNext}>Next</button>
            </div>
          </section>
        );

      case 3:
        return (
          <section className="section">
            <h2>Under Taking</h2>
            <div className="undertaking-content">
              <p className="undertaking-intro">Please read the following information carefully and agree to the under taking form.</p>
              
              <div className="undertaking-text">
                <p>
                  I hereby declare that I have read, understood, and agree to abide by all the rules and regulations related to the internship program. I am fully aware of the expectations regarding weekly progress report submissions, attendance marking, professional conduct, and confidentiality of organizational data.
                </p>
                <p>
                  By proceeding with the registration, I accept full responsibility for my actions and performance during the internship. I understand that I must submit weekly progress reports, maintain professional behavior, and inform my StudentLead or FacultyMentor of any absences in advance.
                </p>
                <p>
                  I acknowledge that failure to meet these requirements, including non-compliance with the attendance and report submission policies, may result in penalties, including removal from the program or other disciplinary actions as determined by my mentor or admin.
                </p>
                <p>
                  Additionally, I am aware that my final internship report is due on the 7th day for admin approval, and I commit to completing all assigned tasks in a timely manner.
                </p>
              </div>

              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={formData.agreedToRules}
                  onChange={(e) => setFormData(prev => ({...prev, agreedToRules: e.target.checked}))}
                />
                By clicking &quot;Proceed,&quot; I confirm my acceptance of this undertaking and agree to abide by the rules set forth during my internship.
              </label>
            </div>
            <div className="button-group">
              <button className="back-button" onClick={handleBack}>Back</button>
              <button 
                className="next-button" 
                onClick={handleNext}
                disabled={!formData.agreedToRules}
              >
                Proceed
              </button>
            </div>
          </section>
        );

      case 4:
        return (
          <section className="section">
            <div className="form-grid">
              <div className="input-row">
                <label>Select Your Batch *</label>
                <select
                  value={formData.batch}
                  onChange={(e) => {
                    const newBatch = e.target.value;
                    const remoteOnly = REMOTE_ONLY_BATCHES.includes(newBatch);
                    setFormData(prev => ({
                      ...prev,
                      batch: newBatch,
                      slot: '',
                      // If switching to a remote-only batch, force mode to Remote
                      mode: remoteOnly ? 'Remote' : prev.mode === 'Remote' ? prev.mode : '',
                      accommodationRequired: '',
                      transportationRequired: ''
                    }));
                  }}
                >
                  <option value="">Select Batch</option>
                  <option value="Y-25-VJA">Y-25 (Vijayawada Campus)</option>
                  <option value="Y-25-HYD">Y-25 (Hyderabad Campus)</option>
                  <option value="Y-24">Y-24 (Detained) / Supply (Both Campuses)</option>
                </select>
              </div>

              <div className="input-row">
                <label>Select Internship Mode *</label>
                {isRemoteOnly(formData.batch) ? (
                  <>
                    <select value="Remote" disabled style={{ background: '#f0f0f0', color: '#555' }}>
                      <option value="Remote">Remote (HomeTown)</option>
                    </select>
                    <span style={{ fontSize: '0.82rem', color: '#555', marginTop: '4px', display: 'block' }}>Only Remote mode is available for this batch.</span>
                  </>
                ) : (
                  <select
                    value={formData.mode}
                    onChange={(e) => {
                      const newMode = e.target.value;
                      setFormData(prev => ({
                        ...prev, 
                        mode: newMode,
                        accommodationRequired: '',
                        transportationRequired: ''
                      }));
                    }}
                    disabled={!formData.batch}
                  >
                    <option value="">{formData.batch ? 'Select Mode' : 'Select Batch first'}</option>
                    <option value="Remote">Remote (HomeTown)</option>
                    <option value="Incampus">In Campus</option>
                    <option value="InVillage">In Village</option>
                  </select>
                )}
              </div>

              {formData.mode === 'Incampus' && (
                <>
                  <div className="input-row">
                    <label>Accommodation required? *</label>
                    <select
                      value={formData.accommodationRequired}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          accommodationRequired: val,
                          transportationRequired: val === 'Yes' ? 'Free' : ''
                        }))
                      }}
                    >
                      <option value="">Select Option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    {formData.accommodationRequired === 'Yes' && (
                      <span style={{ fontSize: '0.85rem', color: '#006400', marginTop: '4px', display: 'block', fontWeight: '500' }}>Transportation is free.</span>
                    )}
                  </div>

                  {formData.accommodationRequired === 'No' && (
                    <div className="input-row">
                      <label>Transportation required? *</label>
                      <select
                        value={formData.transportationRequired}
                        onChange={(e) => setFormData(prev => ({...prev, transportationRequired: e.target.value}))}
                      >
                        <option value="">Select Option</option>
                        <option value="Yes">Yes</option>
                        <option value="Own Transport">Own Transport</option>
                      </select>
                      {formData.transportationRequired === 'Yes' && (
                        <span style={{ fontSize: '0.85rem', color: '#970003', marginTop: '4px', display: 'block', fontWeight: '500' }}>Fees will be applicable, will inform later via email.</span>
                      )}
                    </div>
                  )}

                  <div className="input-row" style={{ gridColumn: '1 / -1', background: '#f0f7ff', padding: '12px', borderRadius: '6px', border: '1px solid #cce3ff' }}>
                    <p style={{ fontSize: '0.85rem', color: '#004085', margin: 0 }}>
                      <strong>Note:</strong> Accommodation and transportation charges will be released via email furtherly. For accommodation selected student free transportation.
                    </p>
                  </div>
                </>
              )}

              <div className="input-row">
                <label>Select Your Slot *</label>
                <select
                  value={formData.slot}
                  onChange={(e) => setFormData(prev => ({...prev, slot: e.target.value}))}
                  disabled={!formData.batch}
                >
                  <option value="">{formData.batch ? 'Select Slot' : 'Select Batch first'}</option>
                  {(formData.batch === 'Y-25-VJA' || formData.batch === 'Y-25-HYD') && (
                    <>
                      <option value="1">Slot 1 — May 11–17</option>
                      <option value="2">Slot 2 — May 18–24</option>
                      <option value="3">Slot 3 — May 25–31</option>
                      <option value="4">Slot 4 — Jun 1–7</option>
                      <option value="5">Slot 5 — Jun 8–14</option>
                      <option value="6">Slot 6 — Jun 15–21</option>
                    </>
                  )}
                  {formData.batch === 'Y-24' && (
                    <>
                      <option value="7">Slot 7 — Jun 22–28</option>
                      <option value="8">Slot 8 — Jun 29–Jul 5</option>
                      <option value="9">Slot 9 — Jul 6–12</option>
                    </>
                  )}
                </select>
              </div>

              <div className="input-row">
                <label>Select Your Domain *</label>
                <select
                  value={formData.selectedDomain}
                  onChange={(e) => {
                    const selectedDomain = DOMAINS.find(d => d.name === e.target.value);
                    setSelectedDomainInfo(selectedDomain ? selectedDomain.description : '');
                    setFormData(prev => ({...prev, selectedDomain: e.target.value, problemStatement: ''}));
                  }}
                >
                  <option value="">Select Domain</option>
                  {DOMAINS.map(domain => (
                    <option key={domain.id} value={domain.name}>{domain.name}</option>
                  ))}
                </select>
              </div>

              {formData.selectedDomain && PROBLEM_STATEMENTS[formData.selectedDomain] && (
                <div className="input-row" style={{ gridColumn: '1 / -1' }}>
                  <label>Problem Statement *</label>
                  <select
                    value={formData.problemStatement}
                    onChange={(e) => setFormData(prev => ({...prev, problemStatement: e.target.value}))}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">Select Problem Statement</option>
                    {PROBLEM_STATEMENTS[formData.selectedDomain].map((statement, idx) => (
                      <option key={idx} value={statement}>{statement}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="input-row">
                <label>Field of Interest *</label>
                <select
                  value={formData.fieldOfInterest}
                  onChange={(e) => setFormData(prev => ({...prev, fieldOfInterest: e.target.value}))}
                >
                  <option value="">Select Field of Interest</option>
                  <option>Awareness Campaigns</option>
                  <option>Content Creation (YouTube / Reels)</option>
                  <option>Cover Song Production</option>
                  <option>Dance</option>
                  <option>Documentary Making</option>
                  <option>Dramatics</option>
                  <option>Environmental Activities</option>
                  <option>Leadership Activities</option>
                  <option>Literature</option>
                  <option>Painting</option>
                  <option>Photography</option>
                  <option>Public Speaking</option>
                  <option>Rural Development</option>
                  <option>Short Film Making</option>
                  <option>Singing</option>
                  <option>Social Service / Volunteering</option>
                  <option>Spirituality</option>
                  <option>Story Telling</option>
                  <option>Technical (Hardware)</option>
                  <option>Technical (Software)</option>
                  <option>Video Editing</option>
                  <option>Yoga &amp; Meditation</option>
                </select>
              </div>

              <div className="input-row">
                <label>Career Choice *</label>
                <select
                  value={formData.careerChoice}
                  onChange={(e) => setFormData(prev => ({...prev, careerChoice: e.target.value}))}
                >
                  <option value="">Select Career Choice</option>
                  <option>Placement</option>
                  <option>Entrepreneurship</option>
                  <option>Higher Education</option>
                  <option>Social Service</option>
                  <option>Research &amp; Development</option>
                </select>
              </div>
            </div>

            <div className="domain-details" style={{ marginTop: '2rem' }}>
              {selectedDomainInfo ? (
                <>
                  <h3>About this Domain</h3>
                  <p className="domain-description">{selectedDomainInfo}</p>

                  <div className="execution-framework" style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ color: 'var(--primary-color)', marginBottom: '0.75rem', fontWeight: '700', fontSize: '1rem', textTransform: 'uppercase' }}>7-Day Execution Framework</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.5rem 0', fontWeight: '700', color: '#333', width: '70px' }}>Day 1</td><td style={{ padding: '0.5rem 0', color: '#444' }}>Village entry, rapport building, basic survey</td></tr>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.5rem 0', fontWeight: '700', color: '#333' }}>Day 2</td><td style={{ padding: '0.5rem 0', color: '#444' }}>Problem identification &amp; team allocation</td></tr>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.5rem 0', fontWeight: '700', color: '#333' }}>Day 3</td><td style={{ padding: '0.5rem 0', color: '#444' }}>Planning &amp; solution design</td></tr>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.5rem 0', fontWeight: '700', color: '#333' }}>Day 4</td><td style={{ padding: '0.5rem 0', color: '#444' }}>Execution Phase 1</td></tr>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.5rem 0', fontWeight: '700', color: '#333' }}>Day 5</td><td style={{ padding: '0.5rem 0', color: '#444' }}>Execution Phase 2</td></tr>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}><td style={{ padding: '0.5rem 0', fontWeight: '700', color: '#333' }}>Day 6</td><td style={{ padding: '0.5rem 0', color: '#444' }}>Impact measurement &amp; refinement</td></tr>
                        <tr><td style={{ padding: '0.5rem 0', fontWeight: '700', color: '#333' }}>Day 7</td><td style={{ padding: '0.5rem 0', color: '#444' }}>Final presentation &amp; exit strategy</td></tr>
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="select-prompt">
                  <p>Select a domain from the list to view details</p>
                </div>
              )}
            </div>
            <div className="button-group">
              <button className="back-button" onClick={handleBack}>Back</button>
              <button 
                className="next-button" 
                onClick={handleNext}
                disabled={(() => {
                  const effectiveMode = isRemoteOnly(formData.batch) ? 'Remote' : formData.mode;
                  return !formData.batch || !formData.selectedDomain || !formData.fieldOfInterest || !formData.careerChoice || !effectiveMode || !formData.slot ||
                    (effectiveMode === 'Incampus' && (!formData.accommodationRequired || (formData.accommodationRequired === 'No' && !formData.transportationRequired)));
                })()}
              >
                Next
              </button>
            </div>
          </section>
        );

      case 5:
        return (
          <section className="section">
            <h2>Student Information</h2>
            <div className="form-grid">
              <div className="input-row" style={{ gridColumn: '1 / -1' }}>
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.studentInfo.name}
                  onChange={(e) => handleInputChange('studentInfo', 'name', e.target.value)}
                />
              </div>

              <div className="input-row">
                <label>ID Number *</label>
                <input
                  type="text"
                  placeholder="Enter 10-digit ID (starts with 24/25)"
                  value={formData.studentInfo.idNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    if (value.length <= 10) { // Only allow up to 10 digits
                      handleInputChange('studentInfo', 'idNumber', value);
                    }
                  }}
                  pattern="(24|25)[0-9]{8}"
                />
              </div>

              <div className="input-row">
                <label>Email *</label>
                <input
                  type="email"
                  placeholder="Auto-generated email"
                  value={formData.studentInfo.email}
                  readOnly
                  style={{ background: '#f8fafc', color: '#64748b' }}
                />
              </div>

              <div className="input-row">
                <label>Select Branch *</label>
                <select
                  value={formData.studentInfo.branch}
                  onChange={(e) => handleInputChange('studentInfo', 'branch', e.target.value)}
                >
                  <option value="">Select Branch</option>
                  {branchNames.map(branch => (
                    <option key={branch.id} value={branch.name}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-row">
                <label>Select Gender *</label>
                <select
                  value={formData.studentInfo.gender}
                  onChange={(e) => handleInputChange('studentInfo', 'gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="input-row">
                <label>Select Year *</label>
                <select
                  value={formData.studentInfo.year}
                  onChange={(e) => handleInputChange('studentInfo', 'year', e.target.value)}
                >
                  <option value="">Select Year</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>

              <div className="input-row" style={{ gridColumn: '1 / -1' }}>
                <label>Phone Number *</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <select
                    value={formData.residence.country}
                    onChange={(e) => {
                      handleInputChange('residence', 'country', e.target.value);
                      const country = countryCodes.find(c => c.code === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        studentInfo: {
                          ...prev.studentInfo,
                          countryCode: country ? country.dial_code : '+91'
                        }
                      }));
                    }}
                    style={{ width: '130px' }}
                  >
                    {uniqueCountryCodes.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.dial_code} ({country.name})
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={formData.studentInfo.phoneNumber}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/[^\d]/g, '');
                      handleInputChange('studentInfo', 'phoneNumber', onlyNums);
                    }}
                    maxLength={10}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
            <div className="button-group">
              <button className="back-button" onClick={handleBack}>
                Back
              </button>
              <button 
                className="next-button" 
                onClick={handleNext}
                disabled={!formData.studentInfo.name || !formData.studentInfo.idNumber}
              >
                Next
              </button>
            </div>
          </section>
        );

      case 6:
        return (
          <section className="section">
            <h2>Current Residence Information</h2>
            <div className="residence-content">
              <div className="form-grid">
                <div className="input-row">
                  <label>Select Residence Type *</label>
                  <select
                    value={formData.residence.type}
                    onChange={(e) => handleInputChange('residence', 'type', e.target.value)}
                  >
                    <option value="" disabled>Select Residence Type</option>
                    <option value="hostel">Hostel</option>
                    <option value="dayscholar">Day Scholar</option>
                  </select>
                </div>

                {formData.residence.type === 'hostel' && (
                  <div className="input-row">
                    <label>Select Hostel *</label>
                    <select
                      value={formData.residence.hostelName}
                      onChange={(e) => handleInputChange('residence', 'hostelName', e.target.value)}
                    >
                      <option value="">Select Hostel</option>
                      {formData.studentInfo.gender === 'Male' 
                        ? boyHostels.map(hostel => (
                            <option key={hostel.hostelName} value={hostel.hostelName}>{hostel.hostelName}</option>
                          ))
                        : girlHostels.map(hostel => (
                            <option key={hostel.hostelName} value={hostel.hostelName}>{hostel.hostelName}</option>
                          ))
                      }
                    </select>
                  </div>
                )}

                {formData.residence.type === 'dayscholar' && (
                  <div className="input-row">
                    <label>Select Transport Mode *</label>
                    <select
                      value={formData.residence.busRoute}
                      onChange={(e) => handleInputChange('residence', 'busRoute', e.target.value)}
                    >
                      <option value="">Select Transport Mode</option>
                      <option value="own">Own Transport</option>
                      <optgroup label="Bus Routes">
                        {busRoutes.map((route, index) => (
                          <option key={`${route["Route ID"]}-${index}`} value={`${route["Route ID"]} - ${route.Route}`}>
                            {route["Route ID"]} - {route.Route} ({route.Location})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                )}

                <div className="input-row">
                  <label>Select Country *</label>
                  <select
                    value={formData.residence.country}
                    onChange={(e) => handleInputChange('residence', 'country', e.target.value)}
                  >
                    <option value="">Select Country</option>
                    {uniqueCountryCodes.map(country => (
                      <option key={country.code} value={country.code}>{country.name}</option>
                    ))}
                  </select>
                </div>

                {formData.residence.country === 'IN' && (
                  <>
                    <div className="input-row">
                      <label>Select State *</label>
                      <select
                        value={formData.residence.state}
                        onChange={(e) => handleInputChange('residence', 'state', e.target.value)}
                      >
                        <option value="">Select State</option>
                        {stateNames.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    {formData.residence.state && (
                      <div className="input-row">
                        <label>Select District *</label>
                        <select
                          value={formData.residence.district}
                          onChange={(e) => handleInputChange('residence', 'district', e.target.value)}
                        >
                          <option value="">Select District</option>
                          {districtNames[formData.residence.state]?.map(district => (
                            <option key={district} value={district}>{district}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="input-row">
                      <label>PIN Code *</label>
                      <input
                        type="text"
                        placeholder="e.g. 522502"
                        value={formData.residence.pincode}
                        onChange={(e) => handleInputChange('residence', 'pincode', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="button-group">
              <button className="back-button" onClick={handleBack}>
                Back
              </button>
              <button 
                className="next-button" 
                onClick={handleNext}
                disabled={!formData.residence.type || !formData.residence.country || 
                  (formData.residence.type === 'hostel' && !formData.residence.hostelName) ||
                  (formData.residence.type === 'dayscholar' && !formData.residence.busRoute) ||
                  (formData.residence.country === 'IN' && (!formData.residence.state || !formData.residence.district || !formData.residence.pincode))}
              >
                Next
              </button>
            </div>
          </section>
        );

      case 7:
        return (
          <section className="section">
            <h2>Confirm Your Details</h2>

            <div className="confirmation-content">
              <div className="confirm-section">
                  <h3>Social Internship Details</h3>
                <div className="confirm-grid">
                  <div className="confirm-item">
                    <span>Batch</span>
                    <span><span className={`batch-tag ${formData.batch === 'Y-24' ? 'y24' : 'y25'}`}>
                      {formData.batch === 'Y-25-VJA' ? 'Y-25 (Vijayawada Campus)' :
                       formData.batch === 'Y-25-HYD' ? 'Y-25 (Hyderabad Campus)' :
                       'Y-24 (Detained) / Supply'}
                    </span></span>
                  </div>
                  <div className="confirm-item">
                    <span>Selected Domain</span>
                    <span>{formData.selectedDomain}</span>
                  </div>
                  <div className="confirm-item">
                    <span>Field of Interest</span>
                    <span>{formData.fieldOfInterest}</span>
                  </div>
                  <div className="confirm-item">
                    <span>Career Choice</span>
                    <span>{formData.careerChoice}</span>
                  </div>
                  <div className="confirm-item">
                    <span>Internship Mode</span>
                    <span>{formData.mode}</span>
                  </div>
                  {formData.mode === 'Incampus' && (
                    <>
                      <div className="confirm-item">
                        <span>Accommodation</span>
                        <span>{formData.accommodationRequired}</span>
                      </div>
                      <div className="confirm-item">
                        <span>Transportation</span>
                        <span>{formData.transportationRequired}</span>
                      </div>
                    </>
                  )}
                  <div className="confirm-item">
                    <span>Slot</span>
                    <span>Slot {formData.slot} — {SLOT_DATES[parseInt(formData.slot)]}</span>
                  </div>
                </div>
              </div>

              <div className="confirm-section">
                <h3>Student Information</h3>
                <div className="confirm-grid">
                  <div className="confirm-item">
                    <span>ID Number:</span>
                    <span>{formData.studentInfo.idNumber}</span>
                  </div>
                  <div className="confirm-item">
                    <span>Name:</span>
                    <span>{formData.studentInfo.name}</span>
                  </div>
                  <div className="confirm-item">
                    <span>Email:</span>
                    <span>{formData.studentInfo.email}</span>
                  </div>
                  <div className="confirm-item">
                    <span>Branch:</span>
                    <span>{formData.studentInfo.branch}</span>
                  </div>
                  <div className="confirm-item">
                    <span>Year:</span>
                    <span>{formData.studentInfo.year}{formData.studentInfo.year === '1' ? 'st' : formData.studentInfo.year === '2' ? 'nd' : formData.studentInfo.year === '3' ? 'rd' : 'th'} Year</span>
                  </div>
                  <div className="confirm-item">
                    <span>Phone:</span>
                    <span>{formData.studentInfo.phoneNumber}</span>
                  </div>
                </div>
              </div>

              <div className="confirm-section">
                <h3>Current Residence Information</h3>
                <div className="confirm-grid">
                  <div className="confirm-item">
                    <span>Type:</span>
                    <span>{formData.residence.type}</span>
                  </div>
                  {formData.residence.type === 'hostel' && (
                    <div className="confirm-item">
                      <span>Hostel:</span>
                      <span>{formData.residence.hostelName}</span>
                    </div>
                  )}
                  {formData.residence.type === 'dayscholar' && (
                    <div className="confirm-item">
                      <span>Transport:</span>
                      <span>{formData.residence.busRoute}</span>
                    </div>
                  )}
                  <div className="confirm-item">
                    <span>Country:</span>
                    <span>{formData.residence.country}</span>
                  </div>
                  {formData.residence.country === 'IN' && (
                    <>
                      <div className="confirm-item">
                        <span>State:</span>
                        <span>{formData.residence.state}</span>
                      </div>
                      <div className="confirm-item">
                        <span>District:</span>
                        <span>{formData.residence.district}</span>
                      </div>
                      <div className="confirm-item">
                        <span>PIN Code:</span>
                        <span>{formData.residence.pincode}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="button-group">
              <button className="back-button" onClick={handleBack}>
                Back
              </button>
              <button className="submit-button" onClick={handleSubmit}>
                Register
              </button>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="register-component">
      {/* <Toaster position="top-center" /> */}
      
      <div className="register-component-in">
        {/* Progress indicator */}
        <div className="progress-bar">
          {[
            { n: 1, label: 'Program Details' },
            { n: 2, label: 'Rules' },
            { n: 3, label: 'Undertaking' },
            { n: 4, label: 'Domain' },
            { n: 5, label: 'Student Info' },
            { n: 6, label: 'Residence' },
            { n: 7, label: 'Confirm' }
          ].map(({ n, label }) => (
            <div
              key={n}
              className={`progress-step${currentStep > n ? ' done' : ''}`}
            >
              <div className={`step-number${currentStep >= n ? ' active' : ''}`}>{n}</div>
              <span className={currentStep === n ? 'active-label' : ''}>{label}</span>
            </div>
          ))}
        </div>

        {/* Current step content */}
        {renderStep()}
      </div>

      {registrationSuccess && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '90%', textAlign: 'left', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ color: '#006400', marginTop: 0, marginBottom: '15px' }}>Registration Successful! 🎉</h2>
            <p style={{ fontSize: '1.1rem', fontWeight: '500', color: '#111' }}>Welcome to Social Internship 2025–26.</p>
            <p style={{ color: '#444' }}>You have been successfully registered.</p>
            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#333' }}>Please proceed to login using the following credentials:</p>
              <ul style={{ paddingLeft: '20px', margin: '10px 0', color: '#444' }}>
                <li style={{ marginBottom: '5px' }}><strong>Username:</strong> Your ID Number</li>
                <li><strong>Password:</strong> Your ID Number followed by last 4 digits of your Phone Number</li>
              </ul>
              <div style={{ marginTop: '15px', padding: '10px', background: '#e0f2fe', borderRadius: '6px', fontSize: '0.9rem', color: '#0369a1' }}>
                <strong>Example:</strong><br/>
                If your ID is <strong style={{ color: '#000' }}>2400030188</strong> and your phone number is XXXXXX<strong style={{ color: '#000' }}>9508</strong>,<br/>
                then your password will be: <strong style={{ color: '#000', fontSize: '1rem' }}>24000301889508</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '25px' }}>
              <button 
                onClick={() => window.location.href = '/'}
                style={{ padding: '10px 20px', border: '1px solid #ccc', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#333' }}
              >
                Close
              </button>
              <button 
                onClick={() => router.push('/auth/login')}
                style={{ padding: '10px 20px', border: 'none', background: '#006400', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                Login to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// import "./page.css";
// export default function Register() {
//   return (
//     <div className="register-closed">
//       <div className="register-closed-content">
//         <h1>Registration is closed</h1>
//         <p>Please check back later</p>
//       </div>
//     </div>
//   );
// }

