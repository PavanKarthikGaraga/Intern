'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import './page.css';
import Overview from './components/overview/page';
import ChangePassword from './components/changePassword/page';
import Profile from './components/profile/page';
import Students from './components/students/page';
import Loader from '@/app/components/loader/loader';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function StudentLeadDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');

  if (!user) {
    return <Loader />;
  }

  return (
    <div className="student-dashboard">
      <Navbar title="Student Lead Dashboard" user={user} />

      <div className="dashboard-content">
        <nav className="dashboard-sidebar">
          <button
            className={`sidebar-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            <span className="item-label">Overview</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <span className="item-label">Profile</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => setActiveSection('students')}
          >
            <span className="item-label">Students</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'change-password' ? 'active' : ''}`}
            onClick={() => setActiveSection('change-password')}
          >
            <span className="item-label">Change Password</span>
          </button>
        </nav>

        <main className="dashboard-main">
          {activeSection === 'overview' ? <Overview user={user}/> : 
           activeSection === 'profile' ? <Profile user={user}/> :
           activeSection === 'students' ? <Students user={user}/> : 
            <ChangePassword/>}
        </main>
      </div>

      <Footer />
    </div>
  );
}
