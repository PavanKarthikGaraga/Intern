'use client';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import axios from "axios";
import './page.css';

import { DOMAINS } from '../../Data/domains';
import { RULES, UNDERTAKING_POINTS } from '../../Data/rules';
import { girlHostels, boyHostels, busRoutes } from '../../Data/locations';
import { stateNames } from '../../Data/states';
import { districtNames } from '../../Data/districts';
import { countryCodes,countryNames } from '../../Data/coutries';
import { branchNames } from '../../Data/branches';

// Remove duplicate country codes and sort alphabetically
const uniqueCountryCodes = countryCodes
  .filter((country, index, self) =>
    index === self.findIndex((c) => c.code === country.code)
  )
  .sort((a, b) => a.name.localeCompare(b.name));

const PhoneInput = ({ value, onChange, countryCode }) => {
  const getCountryCode = (code) => {
    const country = countryCodes.find(c => c.code === code);
    return country ? country.dial_code : '+91';
  };

  return (
    <div className="phone-input-group">
      <select
        value={countryCode}
        onChange={(e) => onChange(e.target.value)}
        className="country-code-select"
      >
        {uniqueCountryCodes.map(country => (
          <option key={country.code} value={country.code}>
            {country.code} ({country.dial_code})
          </option>
        ))}
      </select>
      <input
        type="tel"
        placeholder="Phone Number"
        // value={formData.studentInfo.phoneNumber}
        onChange={(e) => {
          const onlyNums = e.target.value.replace(/[^\d]/g, '');
          onChange(onlyNums);
        }}
        maxLength={10}
      />
    </div>
  );
};



export default function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    selectedDomain: '',
    agreedToRules: false,
    mode: '',
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
    1: "11th May - 17th May",
    2: "18th May - 24th May",
    3: "25th May - 31st May",
    4: "1st June - 7th June"
  };

  const [selectedDomainInfo, setSelectedDomainInfo] = useState('');
  const [stats, setStats] = useState(null);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

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

        toast.success('Residence information saved successfully!');
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
      if (!formData.studentInfo.idNumber || !formData.studentInfo.name || !formData.selectedDomain) {
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
        toast.success('Registration successful! Please check your email for confirmation.');
        // Wait for toast to be visible before redirecting
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
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
  

  const checkAvailability = async () => {
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
          
          // Check total slot capacity (1200)
          if (currentStats[slotField] >= 1200) {
            setAvailabilityMessage('Not Available - Slot is full');
            setIsAvailable(false);
            return;
          }

          // Check mode-specific capacity
          const maxCapacity = {
            Remote: 1000,
            Incampus: 150,
            InVillage: 50
          }[formData.mode] || 0;

          if (currentStats[slotModeField] >= maxCapacity) {
            setAvailabilityMessage(`Not Available - ${formData.mode} mode is full`);
            setIsAvailable(false);
            return;
          }

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
  };

  useEffect(() => {
    checkAvailability();
  }, [formData.mode, formData.slot]);

  const checkSlotAvailability = (slot, mode) => {
    if (!stats) return 'Loading...';
    
    const slotField = `slot${slot}`;
    const slotModeField = `slot${slot}${mode}`;
    
    // Check total slot capacity (1200)
    if (stats[slotField] >= 1200) {
      return 'Not Available';
    }

    // Check mode-specific capacity
    const maxCapacity = {
      Remote: 1000,
      Incampus: 150,
      InVillage: 50
    }[mode] || 0;

    if (stats[slotModeField] >= maxCapacity) {
      return 'Not Available';
    }

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
                <h3>Social Internship Program </h3>
                <div className="program-highlights">
                  <div className="highlight-item">
                    <span className="highlight-label">Duration</span>
                    <span className="highlight-value">7 Days</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">Credits</span>
                    <span className="highlight-value">1</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">Start Date</span>
                    <span className="highlight-value">May 11, 2025</span>
                  </div>
                </div>
              </div>

              <div className="program-sections">
                <div className="program-section">
                  <h4>Program Overview</h4>
                  <p>The Social Internship Program is a transformative initiative aimed at providing students with real-world exposure to community service. The program is structured across four internship slots, accommodating a total of 1200 students per slot — comprising 900 remote and 300 in-campus students.</p>
                </div>
                <div className="slots-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Slot</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Remote</th>
                        <th>In-Campus</th>
                        <th>In-Village(Only KLU Adopted Villages)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4].map((slot) => (
                        <tr 
                          key={slot}
                          className={formData.slot === slot.toString() ? 'selected-row' : ''}
                          onClick={() => handleSlotChange(slot)}
                        >
                          <td>Slot {slot}</td>
                          <td>{SLOT_DATES[slot]}</td>
                          <td data-status={checkSlotAvailability(slot, 'Remote').toLowerCase().replace(' ', '-')}>
                            {checkSlotAvailability(slot, 'Remote')}
                          </td>
                          <td data-status={checkSlotAvailability(slot, 'Remote').toLowerCase().replace(' ', '-')}>
                            {stats ? stats[`slot${slot}Remote`] || 0 : 'Loading...'} / 1000
                          </td>
                          <td data-status={checkSlotAvailability(slot, 'Incampus').toLowerCase().replace(' ', '-')}>
                            {stats ? stats[`slot${slot}Incamp`] || 0 : 'Loading...'} / 150
                          </td>
                          <td data-status={checkSlotAvailability(slot, 'InVillage').toLowerCase().replace(' ', '-')}>
                            {stats ? stats[`slot${slot}Invillage`] || 0 : 'Loading...'} / 50
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
                By clicking "Proceed," I confirm my acceptance of this undertaking and agree to abide by the rules set forth during my internship.
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
            <div className="selection-row">
              <div className="internship-mode-container">
                <h2>Select Internship Mode</h2>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData(prev => ({...prev, mode: e.target.value}))}
                  className="internship-mode-select"
                >
                  <option value="">Select Mode</option>
                  <option value="Remote">Remote</option>
                  <option value="Incampus">In Campus</option>
                  <option value="InVillage">In Village</option>
                </select>
              </div>   

              <div className="slot-container">
                <h2>Select Your Slot</h2>
                <select
                  value={formData.slot}
                  onChange={(e) => setFormData(prev => ({...prev, slot: e.target.value}))}
                  className="slot-select"
                >
                  <option value="">Select Slot</option>
                  <option value="1">Slot 1</option>
                  <option value="2">Slot 2</option>
                  <option value="3">Slot 3</option>
                  <option value="4">Slot 4</option>
                </select>
                {availabilityMessage && (
                  <div className={`availability-message ${isAvailable ? 'available' : 'not-available'}`}>
                    {availabilityMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="domain-container">
              <h2>Select Your Domain</h2>
              <select
                value={formData.selectedDomain}
                onChange={(e) => {
                  const selectedDomain = DOMAINS.find(d => d.name === e.target.value);
                  setSelectedDomainInfo(selectedDomain ? selectedDomain.description : '');
                  setFormData(prev => ({...prev, selectedDomain: e.target.value}));
                }}
                className="domain-select"
              >
                <option value="">Select Domain</option>
                {DOMAINS.map(domain => (
                  <option key={domain.id} value={domain.name}>{domain.name}</option>
                ))}
              </select>
            </div>
            <div className="domain-details">
              {selectedDomainInfo ? (
                <>
                  <h3>About this Domain</h3>
                  <p className="domain-description">{selectedDomainInfo}</p>
                  <h4>Key Activities:</h4>
                  <ul className="domain-activities">
                    {DOMAINS.find(d => d.name === formData.selectedDomain)?.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
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
                disabled={!formData.selectedDomain || !formData.mode || !formData.slot}
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
            <div className="form-section">
              <div className="input-row">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.studentInfo.name}
                  onChange={(e) => handleInputChange('studentInfo', 'name', e.target.value)}
                  className="full-width"
                />
              </div>

              <div className="input-row two-columns">
                <input
                  type="number"
                  placeholder="ID Number"
                  value={formData.studentInfo.idNumber}
                  onChange={(e) => handleInputChange('studentInfo', 'idNumber', e.target.value)}
                  maxLength={10}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.studentInfo.email}
                  onChange={(e) => handleInputChange('studentInfo', 'email', e.target.value)}
                  readOnly
                />
              </div>

              <div className="input-row three-columns">
                <select
                  value={formData.studentInfo.branch}
                  onChange={(e) => handleInputChange('studentInfo', 'branch', e.target.value)}
                >
                  <option value="">Select Branch</option>
                  {branchNames.map(branch => (
                    <option key={branch.id} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>

                <select
                  value={formData.studentInfo.gender}
                  onChange={(e) => handleInputChange('studentInfo', 'gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>

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

              <div className="input-row phone-row">
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
                  className="country-code-select"
                >
                  {uniqueCountryCodes.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.dial_code} ({country.name})
                    </option>
                  ))}
                </select>

                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.studentInfo.phoneNumber}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/[^\d]/g, '');
                    handleInputChange('studentInfo', 'phoneNumber', onlyNums);
                  }}
                  maxLength={10}
                  className="phone-input"
                />
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
            <h2>Residence Information</h2>
            <div className="residence-content">
              <div className="residence-form">
                <select
                  value={formData.residence.type}
                  onChange={(e) => handleInputChange('residence', 'type', e.target.value)}
                >
                  <option value="" disabled>Select Residence Type</option>
                  <option value="hostel">Hostel</option>
                  <option value="dayscholar">Day Scholar</option>
                </select>

                {formData.residence.type === 'hostel' && (
                  <select
                    value={formData.residence.hostelName}
                    onChange={(e) => handleInputChange('residence', 'hostelName', e.target.value)}
                  >
                    <option value="">Select Hostel</option>
                    {formData.studentInfo.gender === 'Male' 
                      ? boyHostels.map(hostel => (
                          <option key={hostel.hostelName} value={hostel.hostelName}>
                            {hostel.hostelName}
                          </option>
                        ))
                      : girlHostels.map(hostel => (
                          <option key={hostel.hostelName} value={hostel.hostelName}>
                            {hostel.hostelName}
                          </option>
                        ))
                    }
                  </select>
                )}

                {formData.residence.type === 'dayscholar' && (
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
                )}

                <select
                  value={formData.residence.country}
                  onChange={(e) => handleInputChange('residence', 'country', e.target.value)}
                >
                  <option value="">Select Country</option>
                  {uniqueCountryCodes.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>

                {formData.residence.country === 'IN' && (
                  <div className="residence-section">
                    <select
                      value={formData.residence.state}
                      onChange={(e) => handleInputChange('residence', 'state', e.target.value)}
                    >
                      <option value="">Select State</option>
                      {stateNames.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>

                    {formData.residence.state && (
                      <select
                        value={formData.residence.district}
                        onChange={(e) => handleInputChange('residence', 'district', e.target.value)}
                      >
                        <option value="">Select District</option>
                        {districtNames[formData.residence.state]?.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    )}

                    <input
                      type="text"
                      placeholder="PIN Code"
                      value={formData.residence.pincode}
                      onChange={(e) => handleInputChange('residence', 'pincode', e.target.value)}
                    />
                  </div>
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
                  <h3>Social Intership Details</h3>
                <div className="confirm-grid">
                  <div className="confirm-item">
                    <span>Select Domain</span>
                    <span>{formData.selectedDomain}</span>
                  </div>
                  <div className="confirm-item">
                    <span>Internship Mode</span>
                    <span>{formData.mode}</span>
                  </div>
                  <div className="confirm-item">
                    <span>Slot</span>
                    <span>{formData.slot}</span>
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
                    <span>{formData.studentInfo.year}st Year</span>
                  </div>
                  <div className="confirm-item">
                    <span>Phone:</span>
                    <span>{formData.studentInfo.phoneNumber}</span>
                  </div>
                </div>
              </div>

              <div className="confirm-section">
                <h3>Residence Information</h3>
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
          <div className="progress-step">
            <div className={`step-number ${currentStep >= 1 ? 'active' : ''}`}>1</div>
            <span>Program Details</span>
          </div>
          <div className="progress-step">
            <div className={`step-number ${currentStep >= 2 ? 'active' : ''}`}>2</div>
            <span>Rules</span>
          </div>
          <div className="progress-step">
            <div className={`step-number ${currentStep >= 3 ? 'active' : ''}`}>3</div>
            <span>Undertaking</span>
          </div>
          <div className="progress-step">
            <div className={`step-number ${currentStep >= 4 ? 'active' : ''}`}>4</div>
            <span>Domain Selection</span>
          </div>
          <div className="progress-step">
            <div className={`step-number ${currentStep >= 5 ? 'active' : ''}`}>5</div>
            <span>Student Info</span>
          </div>
          <div className="progress-step">
            <div className={`step-number ${currentStep >= 6 ? 'active' : ''}`}>6</div>
            <span>Residence</span>
          </div>
          <div className="progress-step">
            <div className={`step-number ${currentStep >= 7 ? 'active' : ''}`}>7</div>
            <span>Confirm</span>
          </div>
        </div>

        {/* Current step content */}
        {renderStep()}
      </div>
    </div>
  );
}