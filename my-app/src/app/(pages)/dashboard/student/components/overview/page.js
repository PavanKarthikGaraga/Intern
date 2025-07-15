'use client'
import { TeamOutlined, CalendarOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Modal, Button, message } from 'antd';
import { useRouter } from 'next/navigation';

export default function Overview({ user, studentData }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
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

  const totalMarks = Number(studentData.marks?.internalMarks) + Number(studentData.marks?.finalReport) + Number(studentData.marks?.finalPresentation);

  // Helper to calculate grade from marks
  const getGrade = (marks) => {
    console.log(marks);
    if (marks >= 90) return 'A';
    if (marks >= 75) return 'B';
    if (marks >= 60) return 'C';
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

  return (
    <div className="overview-section">
      <h1>Welcome {user?.name || studentData.name || 'Student'}</h1>
      <p className="role-text">Student</p>
      
      {/* Important Notification */}
      <div className="notification-banner">
        <div className="notification-icon">⚠️</div>
        <div className="notification-content">
          <h3>Important Notice - Social Internship Closure</h3>
          <p>
            This is to inform you that the Social Internship process will be officially closed on <strong>19-07-2025</strong>.
          </p>
          <p>
            All students (whether they have completed their Social Internship or not) are requested to visit the SAC Office for any queries or issues.
          </p>
          <p>
            Kindly ensure that you resolve your concerns between <strong>16-07-2025 and 17-07-2025</strong>.
          </p>
          <p className="warning-notice">
            <strong>No queries will be entertained after the mentioned dates.</strong>
          </p>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <h3>Selected Domain</h3>
              <p>{studentData.selectedDomain || 'Not Selected'}</p>
            </div>
            <TeamOutlined className="stat-icon" />
          </div>
        </div>

        {studentData.sstudentData ? (
          // Show slot 5/6 stats
          <>
            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <h3>Previous Slot:</h3>
                  <p>{studentData.sstudentData.previousSlot}</p>
                </div>
                <TrophyOutlined className="stat-icon" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <h3>Slot {studentData.sstudentData.slot} Internal Marks</h3>
                  <p>{Math.round(studentData.marks?.internalMarks) || '0'}/60</p>
                </div>
                <TrophyOutlined className="stat-icon" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <h3>Slot {studentData.sstudentData.slot} Final Report</h3>
                  <p>{Math.round(studentData.marks?.finalReport) || '0'}/25</p>
                </div>
                <TrophyOutlined className="stat-icon" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <h3>Slot {studentData.sstudentData.slot} Final Presentation</h3>
                  <p>{Math.round(studentData.marks?.finalPresentation) || '0'}/15</p>
                </div>
                <TrophyOutlined className="stat-icon" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <h3>Slot {studentData.sstudentData.slot} Total Marks</h3>
                  <p>{Math.round(totalMarks || 0)}/100</p>
                </div>
                <TrophyOutlined className="stat-icon" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <h3>Slot {studentData.sstudentData.slot} Grade</h3>
                  <p>{studentData.marks?.grade || 'Not Qualified'} ({getGrade(studentData.marks?.totalMarks)})</p>
                </div>
                <TrophyOutlined className="stat-icon" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <h3>Slot {studentData.sstudentData.slot} Attendance</h3>
                  <p>{studentData.sstudentData.attendance?.presentDays || '0'}/7</p>
                </div>
                <CalendarOutlined className="stat-icon" />
              </div>
            </div>
          </>
        ) : (
          // Show original stats
          <>
            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <h3>Days Completed</h3>
                  <p>{completedDays || '0'}/7</p>
                </div>
                <CalendarOutlined className="stat-icon" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <h3>Faculty Mentor Id</h3>
                  <p>{studentData.mentorId || 'Not Assigned'}</p>
                </div>
                <UserOutlined className="stat-icon" />
              </div>
            </div>

            {studentData.marks.completed !== null && (
              <>
                <div className="stat-card">
                  <div className="stat-content">
                    <div>
                      <h3>Internal Marks</h3>
                      <p>{Number(studentData.marks?.internalMarks) || '0'}/60</p>
                    </div>
                    <TrophyOutlined className="stat-icon" />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-content">
                    <div>
                      <h3>Final Report</h3>
                      <p>{Number(studentData.marks?.finalReport) || '0'}/25</p>
                    </div>
                    <TrophyOutlined className="stat-icon" />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-content">
                    <div>
                      <h3>Final Presentation</h3>
                      <p>{Number(studentData.marks?.finalPresentation) || '0'}/10</p>
                    </div>
                    <TrophyOutlined className="stat-icon" />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-content">
                    <div>
                      <h3>Total Marks</h3>
                      <p>{Math.round(studentData.marks?.totalMarks || 0)}/100</p>
                    </div>
                    <TrophyOutlined className="stat-icon" />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-content">
                    <div>
                      <h3>Grade</h3>
                      <p>{studentData.marks?.grade || 'Not Qualified'} ({getGrade(studentData.marks?.totalMarks)})</p>
                    </div>
                    <TrophyOutlined className="stat-icon" />
                  </div>
                </div>

                {eligibleSlot && (
                  <div className="stat-card slot-registration-card">
                    <div className="stat-content">
                      <div>
                        <h3>Additional Slot Registration</h3>
                        <p>You are eligible for Slot {eligibleSlot}!</p>
                        <Button 
                          type="primary" 
                          onClick={() => showModal(eligibleSlot)}
                          className="slot-registration-button"
                        >
                          Register for Slot {eligibleSlot}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {studentData.certificate?.exists && (
          <div className="stat-card certificate-download-card">
            <div className="stat-content">
              <div>
                <h3>Download Certificate</h3>
                {!studentData.problemStatementData ? (
                  <div>
                    <p style={{ fontSize: '1rem', color: '#d4380d', fontWeight: 'bold' }}>
                      ⚠️ Your certificate is ready, but you need to submit your problem statement first!
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
            By clicking "I Agree & Register", you confirm that you understand and agree to these rules.
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