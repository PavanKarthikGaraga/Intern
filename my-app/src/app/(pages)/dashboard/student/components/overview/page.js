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
  // console.log(studentData)

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

  return (
    <div className="overview-section">
      <h1>Welcome {user?.name || studentData.name || 'Student'}</h1>
      <p className="role-text">Student</p>
      
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
            
            {/* <div className="stat-card">
              <div className="stat-content">
                <div>
                  <h3>Slot {studentData.sstudentData.slot} Internal Marks</h3>
                  <p>{studentData.sstudentData.marks?.internalMarks || '0'}/50</p>
                </div>
                <TrophyOutlined className="stat-icon" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <h3>Slot {studentData.sstudentData.slot} Total Marks</h3>
                  <p>{studentData.sstudentData.marks?.totalMarks || '0'}/80</p>
                </div>
                <TrophyOutlined className="stat-icon" />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <div>
                  <h3>Slot {studentData.sstudentData.slot} Grade</h3>
                  <p>{studentData.sstudentData.marks?.grade || 'Not Qualified'}</p>
                </div>
                <TrophyOutlined className="stat-icon" />
              </div>
            </div> */}

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
                      <p>{studentData.marks?.internalMarks || '0'}/60</p>
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
                      <p>{studentData.marks?.grade || 'Not Qualified'}</p>
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
      `}</style>

      <p className="beta-note">
        Note: This is a beta version. If you experience any issues or discrepancies, please report them to SAC Department.
      </p>
    </div>
  );
}