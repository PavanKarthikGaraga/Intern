'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import './page.css';
// import Loader from '@/components/loader/loader';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Overview from './components/overview/page';
import Profile from './components/profile/page';
import ChangePassword from './components/changePassword/page';
import Students from './components/students/page';
import Leads from './components/leads/page';
import CompletedStudents from './components/completedStudents/page';
import FinalReports from './components/finalReports/page';
import { FaCheckCircle, FaCalendarAlt, FaClock } from 'react-icons/fa';

export default function FacultyMentorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');

  // console.log('FacultyMentorDashboard mounted with user:', user);

  if (!user) {
    console.log('No user found, showing loader');
    // return <Loader />;
  }

  if (loading) {
    // return <Loader />;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const handleSectionClick = (section) => {
    // console.log('Section clicked:', section);
    setActiveSection(section);
  };

  return (
    <div className="student-dashboard">
      <Navbar title="Faculty Mentor Dashboard" user={user} />

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
          <button  className={`sidebar-item ${activeSection === 'leads' ? 'active' : ''}`}
            onClick={() => handleSectionClick('leads')}
          >
            <span className="item-label">Leads</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => handleSectionClick('students')}
          >
            <span className="item-label">Students</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'completed-students' ? 'active' : ''}`}
            onClick={() => handleSectionClick('completed-students')}
          >
            <span className="item-label">Completed Students</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'final-reports' ? 'active' : ''}`}
            onClick={() => handleSectionClick('final-reports')}
          >
            <span className="item-label">Final Reports</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'change-password' ? 'active' : ''}`}
            onClick={() => handleSectionClick('change-password')}
          >
            <span className="item-label">Change Password</span>
          </button>
        </nav>

        <main className="dashboard-main">
          {activeSection === 'overview' ? <Overview user={user} /> : 
           activeSection === 'profile' ? <Profile user={user} /> :
           activeSection === 'students' ? <Students user={user} /> :
           activeSection === 'leads' ? <Leads user={user} /> :
           activeSection === 'completed-students' ? <CompletedStudents user={user} /> :
           activeSection === 'final-reports' ? <FinalReports user={user} /> :
           <ChangePassword user={user} />}
        </main>
      </div>

      <Footer />
    </div>
  );
}