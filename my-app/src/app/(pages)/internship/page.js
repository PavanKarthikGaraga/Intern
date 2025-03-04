'use client';
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import axios from "axios";
import './page.css';

import { DOMAINS } from '../../Data/domains';
import { RULES, UNDERTAKING_POINTS } from '../../Data/rules';
import { BUS_ROUTES, BOYS_HOSTELS, GIRLS_HOSTELS, COUNTRIES, INDIAN_STATES } from '../../Data/locations';


const PhoneInput = ({ value, onChange, countryCode }) => {
    const getCountryCode = (code) => {
    return '+91';
  };

  return (
    <div className="phone-input-group">
      <span className="country-code">{getCountryCode(countryCode)}</span>
      <input
        type="tel"
        placeholder="Phone Number"
        value={value}
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
      hostelType: '',
      busRoute: '',
      country: 'IN',
      state: '',
      district: '',
      pincode: '',
    },
  });

  const [selectedDomainInfo, setSelectedDomainInfo] = useState('');


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
        toast.success('Moving to domain selection...');
        setCurrentStep(prev => prev + 1);
        break;
      }
      
      case 2: {
        if (!formData.selectedDomain) {
          toast.error('Please select a domain to continue');
          return;
        }
        toast.success('Domain selected successfully!');
        setCurrentStep(prev => prev + 1);
        break;
      }
      
      case 3: {
        // Rules - no validation needed
        toast.success('Moving to undertaking...');
        setCurrentStep(prev => prev + 1);
        break;
      }
      
      case 4: {
        if (!formData.agreedToRules) {
          toast.error('Please agree to the terms to continue');
          return;
        }
        toast.success('Terms accepted!');
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

        if (formData.residence.type === 'hostel' && !formData.residence.hostelType) {
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
      const loadingToast = toast.loading('Submitting registration...');

      const response = await axios.post("/api/register",formData,{
        headers:{"Content-Type":"application/json"}
      });

      const data = response.data;

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success('Registration successful! Please check your email for confirmation.');
        // Wait for toast to be visible before redirecting
        setTimeout(() => {
          window.location.href = '/registration-success';
        }, 2000);
      } else {
        toast.error(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      // toast.dismiss(loadingToast);

      if (error.response) {
        console.log("Registration error:", error.response.data);
        toast.error(error.response.data.message || "Registration failed. Please try again.");
      } else {
        console.log("Registration error:", error);
        toast.error("A network error occurred. Please try again.");
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <section className="section">
            <h2>Social Internship Details</h2>
            <div className="program-content">
              <div className="program-header">
                <h3>Welcome to the Social Internship Program at KL University!</h3>
                <div className="program-highlights">
                  <div className="highlight-item">
                    <span className="highlight-label">Duration</span>
                    <span className="highlight-value">6 weeks</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">Credits</span>
                    <span className="highlight-value">2</span>
                  </div>
                  <div className="highlight-item">
                    <span className="highlight-label">Start Date</span>
                    <span className="highlight-value">June 1, 2024</span>
                  </div>
                </div>
              </div>

              <div className="program-sections">
                <div className="program-section">
                  <h4>Program Overview</h4>
                  <p>The Social Internship Program is designed to provide students with hands-on experience in community service while developing essential life skills and social responsibility.</p>
                </div>

                <div className="program-section">
                  <h4>Learning Outcomes</h4>
                  <div className="outcomes-grid">
                    <div className="outcome-card">
                      <div className="outcome-icon">🤝</div>
                      <h5>Social Responsibility</h5>
                      <p>Understanding community needs and developing empathy</p>
                    </div>
                    <div className="outcome-card">
                      <div className="outcome-icon">👥</div>
                      <h5>Leadership Skills</h5>
                      <p>Leading initiatives and managing teams effectively</p>
                    </div>
                    <div className="outcome-card">
                      <div className="outcome-icon">🌟</div>
                      <h5>Community Engagement</h5>
                      <p>Active participation in social welfare activities</p>
                    </div>
                    <div className="outcome-card">
                      <div className="outcome-icon">📊</div>
                      <h5>Project Management</h5>
                      <p>Planning and executing community projects</p>
                    </div>
                  </div>
                </div>

                <div className="program-section">
                  <h4>Key Benefits</h4>
                  <ul className="benefits-list">
                    <li>Real-world experience in social service</li>
                    <li>Professional networking opportunities</li>
                    <li>Certificate of completion</li>
                    <li>Letter of recommendation for outstanding performers</li>
                  </ul>
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
            <h2>Select Your Domain</h2>
            <div className="domain-container">
              <div className="domain-list">
                {DOMAINS.map(domain => (
                  <button 
                    key={domain.id} 
                    className={`domain-list-item ${formData.selectedDomain === domain.name ? 'selected' : ''}`}
                    onClick={() => handleDomainClick(domain)}
                  >
                    {domain.name}
                  </button>
                ))}
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
            </div>
            <div className="button-group">
              <button className="back-button" onClick={handleBack}>Back</button>
              <button 
                className="next-button" 
                onClick={handleNext}
                disabled={!formData.selectedDomain}
              >
                Next
              </button>
            </div>
          </section>
        );

      case 3:
        return (
          <section className="section">
            <h2>Rules and Guidelines</h2>
            <div className="content-container">
              <div className="rules-content">
                <ul className="rules-list">
                  {RULES.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="button-group">
              <button className="back-button" onClick={handleBack}>Back</button>
              <button className="next-button" onClick={handleNext}>Next</button>
            </div>
          </section>
        );

      case 4:
        return (
          <section className="section">
            <h2>Undertaking</h2>
            <div className="undertaking-content">
              <p className="undertaking-intro">I hereby declare that:</p>
              <ul className="undertaking-list">
                {UNDERTAKING_POINTS.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={formData.agreedToRules}
                  onChange={(e) => setFormData(prev => ({...prev, agreedToRules: e.target.checked}))}
                />
                I have read and agree to all the terms mentioned above
              </label>
            </div>
            <div className="button-group">
              <button className="back-button" onClick={handleBack}>Back</button>
              <button 
                className="next-button" 
                onClick={handleNext}
                disabled={!formData.agreedToRules}
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
              <div className="id-input-group">
                <input
                  type="text"
                  placeholder="ID Number"
                  value={formData.studentInfo.idNumber}
                  onChange={(e) => handleInputChange('studentInfo', 'idNumber', e.target.value)}
                />
                {formData.studentInfo.idNumber && (
                  <button 
                    className="delete-button"
                    onClick={handleDeleteId}
                    aria-label="Delete ID"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="email-input-group">
                <input
                  type="email"
                  placeholder="Contact Email"
                  value={formData.studentInfo.email}
                  onChange={(e) => handleInputChange('studentInfo', 'email', e.target.value)}
                />
                <small className="email-note">
                  * Registration confirmation will be sent to your KL University email ({formData.studentInfo.idNumber ? `${formData.studentInfo.idNumber}@kluniversity.in` : 'based on your ID number'})
                </small>
              </div>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.studentInfo.name}
                onChange={(e) => handleInputChange('studentInfo', 'name', e.target.value)}
              />
              <select
                value={formData.studentInfo.branch}
                onChange={(e) => handleInputChange('studentInfo', 'branch', e.target.value)}
              >
                <option value="">Select Branch</option>
                <option value="CSE">Computer Science Engineering</option>
                <option value="ECE">Electronics & Communication Engineering</option>
                <option value="MECH">Mechanical Engineering</option>
                <option value="CIVIL">Civil Engineering</option>
              </select>
              <select
                value={formData.studentInfo.gender}
                onChange={(e) => handleInputChange('studentInfo', 'gender', e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <select
                value={formData.studentInfo.year}
                onChange={(e) => handleInputChange('studentInfo', 'year', e.target.value)}
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              <PhoneInput
                value={formData.studentInfo.phoneNumber}
                onChange={(value) => handleInputChange('studentInfo', 'phoneNumber', value)}
                countryCode={formData.residence.country}
              />
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
                  <option value="">Select Residence Type</option>
                  <option value="hostel">Hostel</option>
                  <option value="dayscholar">Day Scholar</option>
                </select>

                {formData.residence.type === 'hostel' && (
                  <select
                    value={formData.residence.hostelType}
                    onChange={(e) => handleInputChange('residence', 'hostelType', e.target.value)}
                  >
                    <option value="">Select Hostel</option>
                    {formData.studentInfo.gender === 'male' 
                      ? BOYS_HOSTELS.map(hostel => (
                          <option key={hostel} value={hostel}>{hostel}</option>
                        ))
                      : GIRLS_HOSTELS.map(hostel => (
                          <option key={hostel} value={hostel}>{hostel}</option>
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
                      {BUS_ROUTES.map(route => (
                        <option key={route} value={route}>{route}</option>
                      ))}
                    </optgroup>
                  </select>
                )}

                <select
                  value={formData.residence.country}
                  onChange={(e) => handleInputChange('residence', 'country', e.target.value)}
                >
                  <option value="">Select Country</option>
                  {COUNTRIES.map(country => (
                    <option
                    className="residence-form-select"
                     key={country.code} value={country.code}>
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
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="District"
                      value={formData.residence.district}
                      onChange={(e) => handleInputChange('residence', 'district', e.target.value)}
                    />
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
                disabled={!formData.residence.type || !formData.residence.country}
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
                <h3>Selected Domain</h3>
                <p>{formData.selectedDomain}</p>
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
                      <span>{formData.residence.hostelType}</span>
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
      <Toaster position="top-center" />
      
      <div className="register-component-in">
        {/* Progress indicator */}
        <div className="progress-bar">
          <div className="progress-step">
            <div className={`step-number ${currentStep >= 1 ? 'active' : ''}`}>1</div>
            <span>Program Details</span>
          </div>
          <div className="progress-step">
            <div className={`step-number ${currentStep >= 2 ? 'active' : ''}`}>2</div>
            <span>Domain Selection</span>
          </div>
          <div className="progress-step">
            <div className={`step-number ${currentStep >= 3 ? 'active' : ''}`}>3</div>
            <span>Rules</span>
          </div>
          <div className="progress-step">
            <div className={`step-number ${currentStep >= 4 ? 'active' : ''}`}>4</div>
            <span>Undertaking</span>
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