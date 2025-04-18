import { UserOutlined, IdcardOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
// import Loader from '@/app/components/loader/loader';

export default function Lead({ user, studentData }) {
  if (!studentData) {
    return <div className="loading">Loading Lead data...</div>;
  }

  return (
    <div className="lead-section">
      <div className="section-header">
        <h1>lead Information</h1>
        <div className="header-underline"></div>
      </div>
      <div className="info-container">
        <div className="info-group">
          <label>lead Name</label>
          <div className="info-value">
            <UserOutlined className="info-icon" />
            {studentData.mentorName || 'Not Assigned'}
            <div className="value-underline"></div>
          </div>
        </div>
        <div className="info-group">
          <label>lead ID</label>
          <div className="info-value">
            <IdcardOutlined className="info-icon" />
            {studentData.mentorId || 'Not Assigned'}
            <div className="value-underline"></div>
          </div>
        </div>
        <div className="info-group">
          <label>lead Email</label>
          <div className="info-value">
            <MailOutlined className="info-icon" />
            {studentData.mentorId ? `${studentData.mentorId}@kluniversity.in` : 'Not Available'}
            <div className="value-underline"></div>
          </div>
        </div>
        <div className="info-group">
          <label>Domain</label>
          <div className="info-value">
            <TeamOutlined className="info-icon" />
            {studentData.selectedDomain || 'Not Available'}
            <div className="value-underline"></div>
          </div>
        </div>
      </div>
    </div>
  );
}