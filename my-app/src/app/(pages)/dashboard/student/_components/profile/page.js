'use client';
import { useState, useEffect } from 'react';
import {
  UserOutlined, PhoneOutlined, HomeOutlined, MailOutlined,
  EnvironmentOutlined, EditOutlined, SaveOutlined, CloseOutlined,
  BankOutlined, CarOutlined, BookOutlined
} from '@ant-design/icons';
import toast from 'react-hot-toast';

import { stateNames } from '@/app/Data/states';
import { districtNames } from '@/app/Data/districts';
import { countryCodes } from '@/app/Data/coutries';
import { branchNames } from '@/app/Data/branches';
import { girlHostels, boyHostels, busRoutes } from '@/app/Data/locations';

/* ── Deduplicated & sorted country list ── */
const uniqueCountryCodes = countryCodes
  .filter((c, i, arr) => i === arr.findIndex(x => x.code === c.code))
  .sort((a, b) => a.name.localeCompare(b.name));

const FIELDS_OF_INTEREST = [
  'Awareness Campaigns','Content Creation (YouTube / Reels)','Cover Song Production',
  'Dance','Documentary Making','Dramatics','Environmental Activities',
  'Leadership Activities','Literature','Painting','Photography','Public Speaking',
  'Rural Development','Short Film Making','Singing','Social Service / Volunteering',
  'Spirituality','Story Telling','Technical (Hardware)','Technical (Software)',
  'Video Editing','Yoga & Meditation',
];

const SLOT_LABELS = {
  '1':'Slot 1 — May 11–17','2':'Slot 2 — May 18–24','3':'Slot 3 — May 25–31',
  '4':'Slot 4 — Jun 1–7','5':'Slot 5 — Jun 8–14','6':'Slot 6 — Jun 15–21',
  '7':'Slot 7 — Jun 22–28','8':'Slot 8 — Jun 29–Jul 5','9':'Slot 9 — Jul 6–12',
};

/* ─── Tiny reusable field components ─── */
const ViewField = ({ label, icon, value, fallback = '—' }) => (
  <div className="info-group">
    <label>{label}</label>
    <div className="info-value">
      {icon && <span className="info-icon">{icon}</span>}
      <span>{value || fallback}</span>
      <div className="value-underline" />
    </div>
  </div>
);

const EditInput = ({ label, name, value, onChange, type = 'text', placeholder }) => (
  <div className="info-group">
    <label>{label}</label>
    <div className="info-value">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="profile-input"
      />
    </div>
  </div>
);

const EditSelect = ({ label, name, value, onChange, children }) => (
  <div className="info-group">
    <label>{label}</label>
    <div className="info-value">
      <select name={name} value={value} onChange={onChange} className="profile-select">
        {children}
      </select>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════ */
export default function Profile({ user, studentData: initialStudentData }) {
  const [activeTab, setActiveTab] = useState('personal');
  const [studentData, setStudentData] = useState(initialStudentData);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [domains, setDomains] = useState([]);

  /* Fetch domain list */
  useEffect(() => {
    fetch('/api/dashboard/admin/domains')
      .then(r => r.json())
      .then(d => { if (d.success) setDomains(d.domains); })
      .catch(() => {});
  }, []);

  /* Seed form whenever student data arrives */
  useEffect(() => {
    if (!initialStudentData) return;
    setStudentData(initialStudentData);
    setFormData({
      name:           initialStudentData.name           || '',
      gender:         initialStudentData.gender         || 'Male',
      branch:         initialStudentData.branch         || '',
      email:          initialStudentData.email          || '',
      phoneNumber:    initialStudentData.phoneNumber    || '',
      country:        initialStudentData.country        || 'IN',
      state:          initialStudentData.state          || '',
      district:       initialStudentData.district       || '',
      pincode:        initialStudentData.pincode        || '',
      residenceType:  initialStudentData.residenceType  || 'Day Scholar',
      hostelName:     initialStudentData.hostelName     || '',
      accommodation:  initialStudentData.accommodation  || 'No',
      transportation: initialStudentData.transportation || 'No',
      busRoute:       initialStudentData.busRoute       || '',
      selectedDomain: initialStudentData.selectedDomain || '',
      fieldOfInterest:initialStudentData.fieldOfInterest|| '',
      mode:           initialStudentData.mode           || 'Remote',
      slot:           String(initialStudentData.slot    || '1'),
      year:           String(initialStudentData.year    || '1'),
      careerChoice:   initialStudentData.careerChoice   || '',
    });
  }, [initialStudentData]);

  if (!studentData) {
    return <div className="loading">Loading Profile data…</div>;
  }

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    /* Reset form to saved values */
    setFormData({
      name:           studentData.name           || '',
      gender:         studentData.gender         || 'Male',
      branch:         studentData.branch         || '',
      email:          studentData.email          || '',
      phoneNumber:    studentData.phoneNumber    || '',
      country:        studentData.country        || 'IN',
      state:          studentData.state          || '',
      district:       studentData.district       || '',
      pincode:        studentData.pincode        || '',
      residenceType:  studentData.residenceType  || 'Day Scholar',
      hostelName:     studentData.hostelName     || '',
      accommodation:  studentData.accommodation  || 'No',
      transportation: studentData.transportation || 'No',
      busRoute:       studentData.busRoute       || '',
      selectedDomain: studentData.selectedDomain || '',
      fieldOfInterest:studentData.fieldOfInterest|| '',
      mode:           studentData.mode           || 'Remote',
      slot:           String(studentData.slot    || '1'),
      year:           String(studentData.year    || '1'),
      careerChoice:   studentData.careerChoice   || '',
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/dashboard/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Profile updated successfully!');
        setStudentData(prev => ({
          ...prev,
          ...formData,
          profileEdited: (Number(prev.profileEdited) || 0) + 1,
        }));
        setIsEditing(false);
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch {
      toast.error('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const profileEditedCount = Number(studentData.profileEdited || 0);
  const canEdit = profileEditedCount < 1;

  /* Helper: show country name from code */
  const countryName = code =>
    uniqueCountryCodes.find(c => c.code === code)?.name || code || '—';

  /* ── Tabs config ── */
  const TABS = [
    { id: 'personal',      label: 'Personal',      icon: <UserOutlined /> },
    { id: 'contact',       label: 'Contact',        icon: <PhoneOutlined /> },
    { id: 'accommodation', label: 'Accommodation',  icon: <HomeOutlined /> },
    { id: 'internship',    label: 'Internship',     icon: <BookOutlined /> },
  ];

  return (
    <div className="student-profile">

      {/* ── Header bar ── */}
      <div className="profile-header-actions">
        {!isEditing && canEdit && (
          <button className="edit-btn" onClick={() => setIsEditing(true)}>
            <EditOutlined /> Edit Profile <span className="edit-badge">One-time</span>
          </button>
        )}
        {!isEditing && !canEdit && (
          <span className="edit-disabled-msg">
            ✓ Profile already edited — no further changes allowed
          </span>
        )}
        {isEditing && (
          <div className="edit-action-group">
            <button className="cancel-btn" onClick={handleCancel}>
              <CloseOutlined /> Cancel
            </button>
            <button className="save-btn" onClick={handleSave} disabled={isSaving}>
              <SaveOutlined /> {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-button ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="profile-content">

        {/* ═══ PERSONAL ═══ */}
        {activeTab === 'personal' && (
          <div className="section-content">
            <div className="section-header">
              <h1>Personal Information</h1>
              <div className="header-underline" />
            </div>
            <div className="info-container">

              {/* ID — always read-only */}
              <ViewField label="Student ID" value={user.username} />

              {/* Name */}
              {isEditing ? (
                <EditInput label="Name" name="name" value={formData.name} onChange={handleChange} />
              ) : (
                <ViewField label="Name" value={studentData.name} />
              )}

              {/* Gender */}
              {isEditing ? (
                <EditSelect label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </EditSelect>
              ) : (
                <ViewField label="Gender" value={studentData.gender} />
              )}

              {/* Branch */}
              {isEditing ? (
                <EditSelect label="Branch" name="branch" value={formData.branch} onChange={handleChange}>
                  {formData.branch === '' && <option value="">Select Branch</option>}
                  {branchNames.map(b => (
                    <option key={b.id || b.name} value={b.name}>{b.name}</option>
                  ))}
                </EditSelect>
              ) : (
                <ViewField label="Branch" value={studentData.branch} />
              )}

              {/* Year */}
              {isEditing ? (
                <EditSelect label="Year of Study" name="year" value={formData.year} onChange={handleChange}>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </EditSelect>
              ) : (
                <ViewField label="Year of Study" value={studentData.year ? `${studentData.year} Year` : '—'} />
              )}

              {/* Batch — always read-only */}
              <ViewField label="Batch" value={studentData.batch} />

            </div>
            <p className="non-editable-notice">
              * Mode, Slot, and Batch are non-editable fields. Please contact <a href="mailto:director_sac@kluniversity.in">director_sac@kluniversity.in</a> with valid reasons if you have any issues.
            </p>
          </div>
        )}

        {/* ═══ CONTACT ═══ */}
        {activeTab === 'contact' && (
          <div className="section-content">
            <div className="section-header">
              <h1>Contact Information</h1>
              <div className="header-underline" />
            </div>
            <div className="info-container">

              {/* Email — always read-only */}
              <ViewField label="Email Address" icon={<MailOutlined />} value={studentData.email} />

              {/* Phone */}
              {isEditing ? (
                <EditInput label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} type="tel" placeholder="10-digit mobile number" />
              ) : (
                <ViewField label="Phone Number" icon={<PhoneOutlined />} value={studentData.phoneNumber} />
              )}

              {/* Country */}
              {isEditing ? (
                <EditSelect label="Country" name="country" value={formData.country} onChange={handleChange}>
                  {uniqueCountryCodes.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </EditSelect>
              ) : (
                <ViewField label="Country" icon={<EnvironmentOutlined />} value={countryName(studentData.country)} />
              )}

              {/* State */}
              {isEditing ? (
                <EditSelect label="State" name="state" value={formData.state} onChange={e => {
                  handleChange(e);
                  setFormData(prev => ({ ...prev, district: '' }));
                }}>
                  {!formData.state && <option value="">Select State</option>}
                  {stateNames.map(s => <option key={s} value={s}>{s}</option>)}
                </EditSelect>
              ) : (
                <ViewField label="State" value={studentData.state} />
              )}

              {/* District */}
              {isEditing ? (
                <EditSelect label="District" name="district" value={formData.district} onChange={handleChange}>
                  {!formData.district && <option value="">Select District</option>}
                  {(districtNames[formData.state] || []).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </EditSelect>
              ) : (
                <ViewField label="District" value={studentData.district} />
              )}

              {/* Pincode */}
              {isEditing ? (
                <EditInput label="Pincode" name="pincode" value={formData.pincode} onChange={handleChange} type="text" placeholder="6-digit pincode" />
              ) : (
                <ViewField label="Pincode" value={studentData.pincode} />
              )}

            </div>
          </div>
        )}

        {/* ═══ ACCOMMODATION ═══ */}
        {activeTab === 'accommodation' && (
          <div className="section-content">
            <div className="section-header">
              <h1>Accommodation Details</h1>
              <div className="header-underline" />
            </div>
            <div className="info-container">

              {/* Accommodation */}
              {isEditing ? (
                <EditSelect label="Accommodation Required?" name="accommodation" value={formData.accommodation} onChange={handleChange}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </EditSelect>
              ) : (
                <ViewField label="Accommodation Required?" value={studentData.accommodation || 'No'} />
              )}

              {/* Transportation */}
              {isEditing ? (
                <EditSelect label="Transportation Required?" name="transportation" value={formData.transportation} onChange={handleChange}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </EditSelect>
              ) : (
                <ViewField label="Transportation Required?" icon={<CarOutlined />} value={studentData.transportation || 'No'} />
              )}

              {/* Bus Route — only when transport = Yes */}
              {(isEditing ? formData.transportation : studentData.transportation) === 'Yes' && (
                isEditing ? (
                  <EditSelect label="Bus Route" name="busRoute" value={formData.busRoute} onChange={handleChange}>
                    {!formData.busRoute && <option value="">Select Route</option>}
                    {busRoutes.map(r => (
                      <option key={r['Route ID']} value={r['Route ID']}>
                        {r['Route ID']} — {r.Route} ({r.Location})
                      </option>
                    ))}
                  </EditSelect>
                ) : (
                  <ViewField label="Bus Route" value={studentData.busRoute || 'N/A'} />
                )
              )}

              {/* Residence Type */}
              {isEditing ? (
                <EditSelect label="Residence Type" name="residenceType" value={formData.residenceType} onChange={handleChange}>
                  <option value="Day Scholar">Day Scholar</option>
                  <option value="Hostel">Hostel</option>
                </EditSelect>
              ) : (
                <ViewField label="Residence Type" icon={<HomeOutlined />} value={studentData.residenceType} />
              )}

              {/* Hostel — only when residenceType = Hostel */}
              {(isEditing ? formData.residenceType : studentData.residenceType) === 'Hostel' && (
                isEditing ? (
                  <EditSelect label="Hostel Name" name="hostelName" value={formData.hostelName} onChange={handleChange}>
                    {!formData.hostelName && <option value="">Select Hostel</option>}
                    {(formData.gender === 'Male' ? boyHostels : girlHostels).map(h => (
                      <option key={h.hostelName} value={h.hostelName}>{h.hostelName}</option>
                    ))}
                  </EditSelect>
                ) : (
                  <ViewField label="Hostel Name" icon={<BankOutlined />} value={studentData.hostelName} />
                )
              )}

            </div>
          </div>
        )}

        {/* ═══ INTERNSHIP ═══ */}
        {activeTab === 'internship' && (
          <div className="section-content">
            <div className="section-header">
              <h1>Internship Details</h1>
              <div className="header-underline" />
            </div>
            <div className="info-container">

              {/* Domain */}
              {isEditing ? (
                <EditSelect label="Domain" name="selectedDomain" value={formData.selectedDomain} onChange={handleChange}>
                  {!formData.selectedDomain && <option value="">Select Domain</option>}
                  {domains.map(d => <option key={d} value={d}>{d}</option>)}
                </EditSelect>
              ) : (
                <ViewField label="Domain" value={studentData.selectedDomain} />
              )}

              {/* Field of Interest */}
              {isEditing ? (
                <EditSelect label="Field of Interest" name="fieldOfInterest" value={formData.fieldOfInterest} onChange={handleChange}>
                  {!formData.fieldOfInterest && <option value="">Select Field</option>}
                  {FIELDS_OF_INTEREST.map(f => <option key={f} value={f}>{f}</option>)}
                </EditSelect>
              ) : (
                <ViewField label="Field of Interest" value={studentData.fieldOfInterest} />
              )}

              {/* Mode — always read-only */}
              <ViewField label="Internship Mode" value={studentData.mode} />

              {/* Slot — always read-only */}
              <ViewField label="Slot" value={SLOT_LABELS[String(studentData.slot)] || `Slot ${studentData.slot}`} />

              {/* Career Choice */}
              {isEditing ? (
                <EditSelect label="Career Choice" name="careerChoice" value={formData.careerChoice} onChange={handleChange}>
                  {!formData.careerChoice && <option value="">Select Career Choice</option>}
                  <option value="Job">Job</option>
                  <option value="Entrepreneurship">Entrepreneurship</option>
                  <option value="Higher Studies">Higher Studies</option>
                  <option value="Competitive Exams">Competitive Exams (UPSC / GATE / etc.)</option>
                  <option value="Other">Other</option>
                </EditSelect>
              ) : (
                <ViewField label="Career Choice" value={studentData.careerChoice} />
              )}

              {/* Batch — always read-only */}
              <ViewField label="Batch" value={studentData.batch} />

            </div>
            <p className="non-editable-notice">
              * Mode, Slot, and Batch are non-editable fields. Please contact <a href="mailto:director_sac@kluniversity.in">director_sac@kluniversity.in</a> with valid reasons if you have any issues.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}