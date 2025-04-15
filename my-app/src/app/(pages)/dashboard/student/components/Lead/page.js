import { useState, useEffect } from 'react';
import { UserOutlined, IdcardOutlined, MailOutlined, TeamOutlined } from '@ant-design/icons';
import Loader from '@/app/components/loader/loader';
import toast from 'react-hot-toast';

export default function Lead({ user }) {
  const [student, setStudent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leadDetails, setleadDetails] = useState(null);
  const [isleadLoading, setIsleadLoading] = useState(false);

  useEffect(() => {
    if (!user?.username) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);
        console.log('Fetching data for student:', user.username);

        // Fetch student details
        const response = await fetch('/api/dashboard/student/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received student data:', data);

        if (data.success && data.student) {
          setStudent(data.student);
        } else {
          throw new Error(data.error || 'Failed to fetch student data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load student data');
        toast.error(error.message || 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (student.studentleadId) {
      fetchleadDetails();
    }
  }, [student.studentleadId]);

  const fetchleadDetails = async () => {
    if (!student.studentleadId || leadDetails) return;
    
    setIsleadLoading(true);
    try {
      const response = await fetch('/api/dashboard/student/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: student.studentleadId })
      });

      const data = await response.json();
      if (data.success) {
        setleadDetails(data.lead);
      } else {
        console.error('Failed to fetch lead details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
    } finally {
      setIsleadLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading Lead data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="lead-section">
      <div className="section-header">
        <h1>lead Information</h1>
        <div className="header-underline"></div>
      </div>
      {isleadLoading ? (
        <div className="loading-state">
          <Loader />
        </div>
      ) : (
        <div className="info-container">
          <div className="info-group">
            <label>lead Name</label>
            <div className="info-value">
              <UserOutlined className="info-icon" />
              {leadDetails?.name || 'Not Assigned'}
              <div className="value-underline"></div>
            </div>
          </div>
          <div className="info-group">
            <label>lead ID</label>
            <div className="info-value">
              <IdcardOutlined className="info-icon" />
              {student.studentleadId || 'Not Assigned'}
              <div className="value-underline"></div>
            </div>
          </div>
          <div className="info-group">
            <label>lead Email</label>
            <div className="info-value">
              <MailOutlined className="info-icon" />
              {student.studentleadId ? `${student.studentleadId}@kluniversity.in` : 'Not Available'}
              <div className="value-underline"></div>
            </div>
          </div>
          <div className="info-group">
            <label>Domain</label>
            <div className="info-value">
              <TeamOutlined className="info-icon" />
              {leadDetails?.domain || 'Not Available'}
              <div className="value-underline"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}