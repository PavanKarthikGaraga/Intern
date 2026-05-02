'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import './page.css';
import Loader from '@/app/components/loader/loader';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Overview from './_components/overview/page';
import Profile from './_components/profile/page';
import ChangePassword from './_components/changePassword/page';
import Lead from './_components/Lead/page';
import Reports from './_components/submissions/reports';
import FinalReport from './_components/finalReport/page';
import ProblemStatement from './_components/problemStatment/page';
import SurveyQuestions from './_components/survey/page';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.username) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
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
        if (data.success && data.student) {
          setStudentData(data.student);
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

    fetchStudentData();
  }, [user]);

  if (!user) {
    return <Loader />;
  }

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const handleSectionClick = (section) => {
    setActiveSection(section);
  };

  return (
    <div className="student-dashboard">
      <Navbar title="Student Dashboard" user={user} />

      <div className="dashboard-content">
        <nav className="dashboard-sidebar">
          <button
            className={`sidebar-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => handleSectionClick('overview')}
          >
            <span className="item-label">Overview</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => handleSectionClick('profile')}
          >
            <span className="item-label">Profile</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'change-password' ? 'active' : ''}`}
            onClick={() => handleSectionClick('change-password')}
          >
            <span className="item-label">Change Password</span>
          </button>
          {studentData?.problemStatementData && (
            <button
              className={`sidebar-item ${activeSection === 'survey' ? 'active' : ''}`}
              onClick={() => handleSectionClick('survey')}
            >
              <span className="item-label">Survey Questions</span>
            </button>
          )}
        </nav>

        <main className="dashboard-main">
          {activeSection === 'overview' ? <Overview user={user} studentData={studentData} /> : 
           activeSection === 'profile' ? <Profile user={user} studentData={studentData} /> :
           activeSection === 'change-password' ? <ChangePassword user={user} /> :
           activeSection === 'survey' ? <SurveyQuestions studentData={studentData} /> :
           <div style={{
             display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
             padding: '60px 24px', textAlign: 'center', gap: '16px'
           }}>
             <div style={{ fontSize: '3rem' }}>🚧</div>
             <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#014a01', margin: 0 }}>Coming Soon</h2>
             <p style={{ color: '#555', fontSize: '1rem', maxWidth: '400px', lineHeight: '1.6' }}>
               This section is under preparation and will be available soon. Please check back later.
             </p>
           </div>
          }
        </main>
      </div>

      <Footer />
    </div>
  );
}