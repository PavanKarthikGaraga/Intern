import { useState, useEffect } from 'react';
import { TeamOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
// import Loader from '@/app/components/loader/loader';
import toast from 'react-hot-toast';

export default function Overview({ user }) {
  const [student, setStudent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendance, setAttendance] = useState({});

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

        // Fetch attendance data
        // const attendanceResponse = await fetch(`/api/dashboard/studentMentor/attendance?studentId=${user.username}`, {
        //   method: 'GET',
        //   headers: { 'Content-Type': 'application/json' }
        // });

        // if (attendanceResponse.ok) {
        //   const attendanceData = await attendanceResponse.json();
        //   if (attendanceData.success) {
        //     setAttendance(attendanceData.data || {});
        //   }
        // }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load dashboard data');
        toast.error(error.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return <div className="loading">Loading Data .......</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Calculate completed days from attendance
  const completedDays = Object.values(attendance).filter(status => status === 'P').length;

  return (
    <div className="overview-section">
      <h1>Welcome {user?.name || student.name || 'Student'}</h1>
      <p className="role-text">Student</p>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <div>
              <h3>Selected Domain</h3>
              <p>{student.selectedDomain || 'Not Selected'}</p>
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
              <h3>StudentLead ID</h3>
              <p>{student.leadId || 'Not Assigned'}</p>
            </div>
            <UserOutlined className="stat-icon" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div>
              <h3>Completion Status</h3>
              <p>{student.completed ? 'Completed' : 'In Progress'}</p>
            </div>
            <CalendarOutlined className="stat-icon" />
          </div>
        </div>
      </div>

      <p className="beta-note">
        Note: This is a beta version. If you experience any issues or discrepancies, please report them to SAC Department.
      </p>
    </div>
  );
}
