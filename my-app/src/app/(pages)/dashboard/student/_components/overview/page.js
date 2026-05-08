'use client'
import { TeamOutlined, CalendarOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import { FaExclamationTriangle, FaClipboardList, FaCheckCircle } from 'react-icons/fa';
import { useState } from 'react';
import { Modal, Button, message } from 'antd';
import { useRouter } from 'next/navigation';
import { PROBLEM_STATEMENTS } from '@/app/Data/problemStatements';

export default function Overview({ user, studentData }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [psStatement, setPsStatement] = useState('');
  const [psSubmitting, setPsSubmitting] = useState(false);
  const [psSuccess, setPsSuccess] = useState(false);
  const router = useRouter();

  if (!studentData) {
    return <div className="loading">Loading Data .......</div>;
  }

  // console.log(studentData);

  // Calculate completed days from attendance
  const completedDays = Object.values(studentData.attendance?.details || {}).filter(status => status === 'P').length;

  // Check if student is eligible for slot 5 or 6
  const getEligibleSlot = () => {
    // If student is already registered in slot 5/6, return null
    if (studentData.sstudentData) return null;

    if (!studentData.marks?.totalMarks || !studentData.slot || !studentData.reportOpen) return null;
    
    const totalMarks = parseFloat(studentData.marks.totalMarks);
    const isEligible = totalMarks < 60;

    if (!isEligible) return null;

    // Check slot 5 eligibility - only for slot 1 students
    if (studentData.slot === 1 && studentData.reportOpen.slot5) {
      return 5;
    }

    // Check slot 6 eligibility
    if ((studentData.slot === 2 || studentData.slot === 3 || studentData.slot === 4) && 
        studentData.reportOpen.slot6) {
      return 6;
    }

    return null;
  };

  const eligibleSlot = getEligibleSlot();

  const handleSlotRegistration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/student/register-slot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          previousSlot: studentData.slot,
          previousSlotMarks: studentData.marks.totalMarks,
          mode: studentData.mode,
          newSlot: selectedSlot
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      message.success(`Successfully registered for Slot ${selectedSlot}!`);
      setIsModalOpen(false);
      // Force a hard refresh of the page
      window.location.reload();
    } catch (error) {
      message.error(error.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (slot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  // const handleProblemStatement = () => {
  //   router.push('/dashboard/student/problemStatement');
  // };

  const m = studentData.marks || {};
  const evalComponents = [
    { label: 'Problem Understanding', score: m.d1 || 0, max: 10, weight: '10%' },
    { label: 'Survey Execution',     score: m.survey || 0, max: 15, weight: '15%' },
    { label: 'Data Analysis',        score: m.d5 || 0, max: 15, weight: '15%' },
    { label: 'Intervention Activity', score: m.d6 || 0, max: 20, weight: '20%' },
    { label: 'Case Study Report',    score: m.d7 || 0, max: 20, weight: '20%' },
    { label: 'Final Presentation',   score: m.finalPresentation || 0, max: 20, weight: '20%' },
  ];

  const totalMarks = evalComponents.reduce((acc, c) => acc + Number(c.score), 0);

  // Helper to calculate grade from marks
  const getGrade = (marks) => {
    if (marks >= 85) return 'S';
    if (marks >= 75) return 'A';
    if (marks >= 65) return 'B';
    if (marks >= 55) return 'C';
    if (marks >= 50) return 'D';
    return 'F';
  };

  const getSlotRules = (slot) => {
    const baseRules = [
      `Slot ${slot} is specifically designed for students who scored between 40-60 marks in their previous slot.`,
      'This is your final opportunity to improve your performance.',
      'Attendance is mandatory for all days.',
      '20 marks will be deducted so your maximum marks will be 80.',
      '50 marks for daily report submissions and 30 marks for final report submission.',
      'You must complete all daily submissions and assignments.',
      'Final evaluation will be based on your performance in this slot only.',
      'Previous slot marks will not be considered in the final evaluation.',
      'Once registered, you cannot revert back to your previous slot.',
      'You must maintain the same mode of participation (Remote/Incampus) as your previous slot.'
    ];

    return baseRules;
  };

  const handleDownloadCertificate = async () => {
    try {
      const response = await fetch('/api/dashboard/student/certificate/download', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to download certificate');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user.username}_certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      message.error(err.message || 'Failed to download certificate.');
    }
  };

  const SLOT_DATES = {
    1: 'May 11 – May 17', 2: 'May 18 – May 24', 3: 'May 25 – May 31',
    4: 'Jun 1 – Jun 7', 5: 'Jun 8 – Jun 14', 6: 'Jun 15 – Jun 21',
    7: 'Jun 22 – Jun 28', 8: 'Jun 29 – Jul 5', 9: 'Jul 6 – Jul 12'
  };

  const handlePsSubmit = async (e) => {
    e.preventDefault();
    if (!psStatement) { message.error('Please select a problem statement.'); return; }
    setPsSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/student/problem-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          domain: studentData.selectedDomain,
          problem_statement: psStatement,
          location: studentData.district || 'N/A',
          district: studentData.district || 'N/A',
          state: studentData.state || 'N/A'
        })
      });
      const data = await res.json();
      if (data.success) { setPsSuccess(true); message.success('Problem statement saved!'); setTimeout(() => window.location.reload(), 1200); }
      else message.error(data.error || 'Failed to save.');
    } catch { message.error('Network error. Please try again.'); }
    finally { setPsSubmitting(false); }
  };

  return (
    <div className="overview-section">
      <h1>Welcome {user?.name || studentData.name || 'Student'}</h1>
      <p className="role-text">Student</p>
      
      {/* Important Notification */}
      <div className="notification-banner">
        <div className="notification-icon" style={{ display: 'flex', alignItems: 'center', color: '#ffc107' }}>
          <FaExclamationTriangle />
        </div>
        <div className="notification-content">
          <h3>Important Notice - Social Internship 2026</h3>
          <p>Registration is now open. Your slot details are shown below. The full dashboard (daily reports, mentor, final report) will be activated closer to your slot dates.</p>
        </div>
      </div>

      {/* Registration Details Card */}
      <div style={{ background: '#fff', border: '2px solid #014a01', borderRadius: '12px', padding: '24px', margin: '16px 0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: '#014a01', marginBottom: '20px', fontWeight: '700', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #e8f5e9', paddingBottom: '12px' }}>
          <FaClipboardList /> Your Registration Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[  
            { label: 'Slot', value: studentData.slot ? `Slot ${studentData.slot} (${SLOT_DATES[studentData.slot] || ''})` : 'N/A' },
            { label: 'Batch', value: studentData.batch || 'N/A' },
            { label: 'Mode', value: studentData.mode || 'N/A' },
            { label: 'Domain', value: studentData.selectedDomain || 'N/A' },
            { label: 'Problem Statement', value: studentData.problemStatementData?.problem_statement || 'NOT_SELECTED' },
            { label: 'State', value: studentData.state || 'N/A' },
            { label: 'District', value: studentData.district || 'N/A' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#f9f9f9', borderRadius: '10px', padding: '14px', border: '1px solid #eee' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#666', textTransform: 'uppercase', margin: '0 0 6px', letterSpacing: '0.5px' }}>{label}</p>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: value === 'NOT_SELECTED' ? '#970003' : '#333', margin: 0 }}>
                {value === 'NOT_SELECTED' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaExclamationTriangle /> Not Selected Yet</span>
                ) : value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Problem Statement Picker — shown only if not yet selected */}
      {!studentData.problemStatementData && studentData.selectedDomain && (
        <div style={{ background: '#fff8e1', border: '2px solid #f0a500', borderRadius: '12px', padding: '20px', margin: '16px 0' }}>
          <h3 style={{ color: '#856404', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaExclamationTriangle /> Action Required: Select Your Problem Statement
          </h3>
          <p style={{ color: '#6c5700', fontSize: '0.9rem', marginBottom: '14px' }}>
            You registered before problem statements were introduced. Please select your problem statement from the list below based on your domain: <strong>{studentData.selectedDomain}</strong>.
          </p>
          {psSuccess ? (
            <p style={{ color: '#014a01', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><FaCheckCircle /> Problem statement saved! Refreshing...</p>
          ) : (
            <form onSubmit={handlePsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px' }}>
              <select
                value={psStatement}
                onChange={(e) => setPsStatement(e.target.value)}
                required
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem' }}
              >
                <option value="">Select Problem Statement</option>
                {(PROBLEM_STATEMENTS[studentData.selectedDomain] || []).map((stmt, idx) => (
                  <option key={idx} value={stmt}>{stmt}</option>
                ))}
              </select>
              {PROBLEM_STATEMENTS[studentData.selectedDomain]?.length === 0 && (
                <p style={{ color: '#888', fontSize: '0.85rem' }}>No predefined statements for this domain. Contact admin.</p>
              )}
              <button
                type="submit"
                disabled={psSubmitting}
                style={{ padding: '10px 24px', background: '#014a01', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-start' }}
              >
                {psSubmitting ? 'Saving...' : 'Save Problem Statement'}
              </button>
            </form>
          )}
        </div>
      )}
      
      <div className="stats-grid">
        <div className="stat-card" style={{ gridColumn: '1 / -1', background: '#fff', border: '2px solid #014a01', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '0' }}>
            <h3 style={{ color: '#014a01', fontSize: '1.2rem', marginBottom: '20px', borderBottom: '2px solid #e8f5e9', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <TrophyOutlined /> Performance Overview (100 Marks Rubric)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {evalComponents.map((c, idx) => (
                <div key={idx} style={{ background: '#f9f9f9', padding: '15px', borderRadius: '10px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>{c.label}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#999' }}>Weightage: {c.weight}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#014a01' }}>{c.score}</span>
                    <span style={{ fontSize: '0.9rem', color: '#888' }}> / {c.max}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px dashed #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                {(m.completed === 'P' || m.completed === 1) ? (
                  <>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Score</p>
                      <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: '#014a01' }}>{Math.round(totalMarks)}<span style={{ fontSize: '1.2rem', color: '#888', fontWeight: '400' }}> / 100</span></p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Final Grade</p>
                      <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: '900', color: totalMarks >= 50 ? '#014a01' : '#970003' }}>{getGrade(totalMarks)}</p>
                    </div>
                  </>
                ) : (
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Overall Status</p>
                    <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#e65100', marginTop: '4px' }}>Evaluation Pending</p>
                  </div>
                )}
              </div>
              
              {eligibleSlot && (
                <div style={{ background: '#fff8e1', padding: '15px 20px', borderRadius: '10px', border: '1px solid #ffe082', maxWidth: '350px' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: '#e65100' }}>Slot Registration Available!</p>
                  <p style={{ margin: '4px 0 10px', fontSize: '0.8rem', color: '#666' }}>You are eligible for Slot {eligibleSlot} to improve your marks.</p>
                  <Button type="primary" onClick={() => showModal(eligibleSlot)} style={{ background: '#e65100', border: 'none' }}>Register for Slot {eligibleSlot}</Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {studentData.certificate?.exists && (
          <div className="stat-card certificate-download-card">
            <div className="stat-content">
              <div>
                <h3>Download Certificate</h3>
                {!studentData.problemStatementData ? (
                  <div>
                    <p style={{ fontSize: '1rem', color: '#d4380d', fontWeight: 'bold', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <FaExclamationTriangle style={{ marginTop: '2px' }} /> <span>Your certificate is ready, but you need to submit your problem statement first!</span>
                    </p>
                    <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                      Please submit your problem statement to download your certificate.
                    </p>
                    <button 
                      type="primary"
                      // onClick={handleProblemStatement}
                      style={{
                        outline:'none',
                        border:'none',
                        padding:'8px 16px',
                        borderRadius:'4px',
                        cursor:'pointer',
                        fontWeight:'700',
                        fontSize:'1rem',
                        backgroundColor: '#1890ff'
                      }}
                    >
                      Submit Problem Statement
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '1rem' }}>
                      Your certificate is ready! Please download and print a <span style={{color:'#d4380d', fontWeight:'bold'}}>color copy</span>, 
                      get it signed by the Director SAC, and store it safely.
                    </p>
                    <button
                      type="primary"
                      onClick={handleDownloadCertificate}
                      style={{
                        outline:'none',
                        border:'none',
                        padding:'8px 16px',
                        borderRadius:'4px',
                        cursor:'pointer',
                        fontWeight:'700',
                        fontSize:'1rem',
                        backgroundColor: '#1890ff'
                      }}
                    >
                      Download Certificate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
       

      <Modal
        title={`Slot ${selectedSlot} Registration Rules`}
        open={isModalOpen}
        onOk={handleSlotRegistration}
        onCancel={handleCancel}
        confirmLoading={loading}
        okText="I Agree & Register"
        cancelText="Cancel"
        destroyOnHidden
      >
        <div className="slot-rules">
          <h3>Important Rules for Slot {selectedSlot}:</h3>
          <ol>
            {selectedSlot && getSlotRules(selectedSlot).map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ol>
          <p className="warning-text">
            By clicking &quot;I Agree &amp; Register&quot;, you confirm that you understand and agree to these rules.
          </p>
        </div>
      </Modal>

    

      <style jsx>{`
        .notification-banner {
          background: linear-gradient(135deg, #fff3cd, #ffeaa7);
          border: 2px solid #ffc107;
          border-radius: 12px;
          padding: 10px;
          margin: 5px;
          display: flex;
          align-items: flex-start;
          gap: 15px;
          box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
          animation: pulse 2s infinite;
        }
        
        .notification-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        
        .notification-content {
          flex: 1;
        }
        
        .notification-content h3 {
          color: #856404;
          font-size: 1rem;
          font-weight: 700;
        }
        
        .notification-content p {
          margin: 5px;
          color: #6c5700;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        
        .warning-notice {
          color: #dc3545 !important;
          background: rgba(220, 53, 69, 0.1);
          padding: 5px;
          border-radius: 6px;
          border-left: 4px solid #dc3545;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
          }
          50% {
            box-shadow: 0 4px 20px rgba(255, 193, 7, 0.4);
          }
          100% {
            box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);
          }
        }
        
        .slot-registration-card {
          background-color: #f6ffed;
          border: 1px solid #b7eb8f;
        }
        .slot-stats-card {
          background-color: #e6f7ff;
          border: 1px solid #91d5ff;
        }
        .slot-registration-button {
          margin-top: 10px;
          background-color: #52c41a;
        }
        .slot-registration-button:hover {
          background-color: #389e0d;
        }
        .slot-rules {
          max-height: 600px;
          overflow-y: auto;
          padding: 0 10px;
        }
        .slot-rules ol {
          padding-left: 20px;
        }
        .slot-rules li {
          margin-bottom: 10px;
        }
        .warning-text {
          margin-top: 20px;
          color: #ff4d4f;
          font-weight: bold;
        }
        .problem-statement-warning {
          padding: 0 10px;
        }
        .problem-statement-warning h3 {
          color: #faad14;
          margin-bottom: 15px;
        }
        .problem-statement-warning ol {
          padding-left: 20px;
          margin: 15px 0;
        }
        .problem-statement-warning li {
          margin-bottom: 8px;
        }
        
        @media (max-width: 768px) {
          .notification-banner {
            flex-direction: column;
            text-align: center;
            padding: 15px;
          }
          
          .notification-icon {
            font-size: 1.5rem;
            margin-top: 0;
          }
          
          .notification-content h3 {
            font-size: 1.1rem;
          }
          
          .notification-content p {
            font-size: 0.9rem;
          }
        }
      `}</style>

      <p className="beta-note">
        Note: This is a beta version. If you experience any issues or discrepancies, please report them to SAC Department.
      </p>
    </div>
  );
}