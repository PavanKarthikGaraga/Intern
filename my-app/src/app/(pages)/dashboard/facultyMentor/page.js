'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import './page.css';
import Overview from './components/overview/page';
import Profile from './components/profile/page';
import StudentLeads from './components/studentLeads/page';
import Submissions from './components/submissions/page';
import ChangePassword from './components/changePassword/page';
import Loader from '@/app/components/loader/loader';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function FacultyMentorDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');

  if (!user) {
    return <Loader />;
  }

  return (
    <div className="faculty-dashboard">
      <Navbar title="Faculty Mentor Dashboard" user={user} />
      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>Menu</h2>
          </div>
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveSection('overview')}
            >
              Overview
            </button>
            <button
              className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveSection('profile')}
            >
              Profile
            </button>
            <button
              className={`nav-item ${activeSection === 'studentLeads' ? 'active' : ''}`}
              onClick={() => setActiveSection('studentLeads')}
            >
              Student Leads
            </button>
            <button
              className={`nav-item ${activeSection === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveSection('submissions')}
            >
              Verified Submissions
            </button>
            <button
              className={`nav-item ${activeSection === 'changePassword' ? 'active' : ''}`}
              onClick={() => setActiveSection('changePassword')}
            >
              Change Password
            </button>
          </nav>
        </div>

        <div className="dashboard-main">
          {activeSection === 'overview' && <Overview user={user} />}
          {activeSection === 'profile' && <Profile user={user} />}
          {activeSection === 'studentLeads' && <StudentLeads user={user} />}
          {activeSection === 'submissions' && <Submissions user={user} />}
          {activeSection === 'changePassword' && <ChangePassword user={user} />}
        </div>
      </div>
      <Footer />
    </div>
  );
} 