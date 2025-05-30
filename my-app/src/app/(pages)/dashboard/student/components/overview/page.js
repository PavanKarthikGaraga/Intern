import { TeamOutlined, CalendarOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';

export default function Overview({ user, studentData }) {
  if (!studentData) {
    return <div className="loading">Loading Data .......</div>;
  }
  console.log(studentData)

  // Calculate completed days from attendance
  const completedDays = Object.values(studentData.attendance?.details || {}).filter(status => status === 'P').length;

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
                  <p>{studentData.marks?.totalMarks || '0'}/100</p>
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
          </>
        )}
      </div>
       

      <p className="beta-note">
        Note: This is a beta version. If you experience any issues or discrepancies, please report them to SAC Department.
      </p>
    </div>
  );
}
