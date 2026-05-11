'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import './page.css';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Overview from './_components/overview/page';
import Profile from './_components/profile/page';
import ChangePassword from './_components/changePassword/page';
import Students from './_components/students/page';
import CompletedStudents from './_components/completedStudents/page';
import Stats from './_components/stats/page';
import StudentLeads from './_components/studentLeads/page';
import FacultyMentors from './_components/facultyMentors/page';
import Admins from './_components/admins/page';
import DataDownload from './_components/dataDownload/page';
import ReportControl from './_components/reportControl/page';
// import PM2Logs from './_components/pm2-logs/page';
import TokenGenerator from './_components/tokenGenerator/page';
import SQLExecutor from './_components/sqlExecutor/page';
import ResetPassword from './_components/resetPassword/page';
import SupplyStudents from './_components/supplyStudents/page';
import CertificateDownload from './_components/certificate/page';
import VerifyCertificates from './_components/verifyCertificates/page';
import SFinalProfile from './_components/sfinal/page';
import ProblemStatements from './_components/problemStatements/page';
import ActivityLogs from './_components/activityLogs/page';
import DailyTasksViewer from '../studentLead/_components/dailyTasksViewer/page';
import TaskUnlocker from './_components/taskUnlocker/page';
import SlotControl from './_components/slotControl/page';
import RegistrationControl from './_components/registrationControl/page';
import VideoDump from './_components/videoDump/page';
import Announcements from './_components/announcements/page';
import Evaluate from './_components/evaluate/page';


export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  const [showDevDropdown, setShowDevDropdown] = useState(false);
  const [showSupplyDropdown, setShowSupplyDropdown] = useState(false);
  const [isLegacy, setIsLegacy] = useState(false);
  const [isTogglingDB, setIsTogglingDB] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.replace('/auth/login');
    }
    
    // Check current DB state
    const checkDBState = async () => {
      try {
        const res = await fetch('/api/dashboard/admin/toggle-db');
        const data = await res.json();
        if (data.success) {
          setIsLegacy(data.isLegacy);
        }
      } catch (err) {
        console.error('Failed to fetch DB state');
      }
    };
    
    if (isAuthenticated) checkDBState();
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSectionClick = (section) => {
    setActiveSection(section);
    setShowUsersDropdown(false);
    setShowDevDropdown(false);
    setShowSupplyDropdown(false);
    setIsSidebarOpen(false); // Close sidebar on mobile after clicking a link
  };

  const handleToggleDB = async () => {
    if (isTogglingDB) return;
    
    const confirmMsg = isLegacy 
      ? "Switch back to Current (2026) Database?"
      : "WARNING: Switch to Legacy (2025) Database? \n\nAll data shown will be from last year. Use with caution.";
      
    if (!window.confirm(confirmMsg)) return;

    setIsTogglingDB(true);
    try {
      const res = await fetch('/api/dashboard/admin/toggle-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useLegacy: !isLegacy })
      });
      
      const data = await res.json();
      if (data.success) {
        setIsLegacy(data.isLegacy);
        // Reload the page to ensure all components fetch from the new DB
        window.location.reload();
      } else {
        alert(data.error || 'Failed to switch database');
      }
    } catch (err) {
      alert('Error connecting to server');
    } finally {
      setIsTogglingDB(false);
    }
  };

  return (
    <div className={`student-dashboard ${isSidebarOpen ? 'sidebar-mobile-open' : ''}`}>
      <Navbar 
        title={isLegacy ? "Legacy Dashboard (2025)" : "Admin Dashboard"} 
        user={user} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      {isLegacy && (
        <div className="legacy-warning-banner">
          ⚠️ YOU ARE VIEWING THE LEGACY (2025) DATABASE. CHANGES MADE HERE WILL NOT AFFECT THE 2026 PROGRAM.
          <button onClick={handleToggleDB} className="banner-switch-btn">Switch Back to 2026</button>
        </div>
      )}

      <div className="dashboard-content">
        <nav className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
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
            className={`sidebar-item ${activeSection === 'stats' ? 'active' : ''}`}
            onClick={() => handleSectionClick('stats')}
          >
            <span className="item-label">Statistics</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => handleSectionClick('students')}
          >
            <span className="item-label">Students</span>
          </button>

          {/* Users Dropdown */}
          <div className="dropdown">
            <button
              className={`sidebar-item ${['student-leads', 'faculty-mentors', 'admins'].includes(activeSection) ? 'active' : ''}`}
              onClick={() => setShowUsersDropdown(!showUsersDropdown)}
            >
              <span className="item-label">Users</span>
            </button>
            {showUsersDropdown && (
              <div className="dropdown-content">
                <button
                  className={`dropdown-item ${activeSection === 'student-leads' ? 'active' : ''}`}
                  onClick={() => handleSectionClick('student-leads')}
                >
                  Student Leads
                </button>
                <button
                  className={`dropdown-item ${activeSection === 'faculty-mentors' ? 'active' : ''}`}
                  onClick={() => handleSectionClick('faculty-mentors')}
                >
                  Faculty Mentors
                </button>
                <button
                  className={`dropdown-item ${activeSection === 'admins' ? 'active' : ''}`}
                  onClick={() => handleSectionClick('admins')}
                >
                  Administrators
                </button>
              </div>
            )}
          </div>

          {/* Supply Students Section */}
            <div className="dropdown">
              <button
                className={`sidebar-item ${['supply-students', 'supply-final'].includes(activeSection) ? 'active' : ''}`}
                onClick={() => setShowSupplyDropdown(!showSupplyDropdown)}
              >
                <span className="item-label">Supply</span>
              </button>
              {showSupplyDropdown && (
                <div className="dropdown-content">
                  <button
                    className={`dropdown-item ${activeSection === 'supply-students' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('supply-students')}
                  >
                    Supply Students
                  </button>
                  <button
                    className={`dropdown-item ${activeSection === 'supply-final' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('supply-final')}
                  >
                    Supply Final
                  </button>
                </div>
              )}
            </div>
        
          <button
            className={`sidebar-item ${activeSection === 'completed-students' ? 'active' : ''}`}
            onClick={() => handleSectionClick('completed-students')}
          >
            <span className="item-label">Completed Students</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'verify-certificates' ? 'active' : ''}`}
            onClick={() => handleSectionClick('verify-certificates')}
          >
            <span className="item-label">Verify Certificates</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'problem-statements' ? 'active' : ''}`}
            onClick={() => handleSectionClick('problem-statements')}
          >
            <span className="item-label">Problem Statements</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'announcements' ? 'active' : ''}`}
            onClick={() => handleSectionClick('announcements')}
          >
            <span className="item-label">Announcements</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'videoDump' ? 'active' : ''}`}
            onClick={() => handleSectionClick('videoDump')}
          >
            <span className="item-label">Video Dump</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'activity-logs' ? 'active' : ''}`}
            onClick={() => handleSectionClick('activity-logs')}
          >
            <span className="item-label">Activity Log</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'slot-control' ? 'active' : ''}`}
            onClick={() => handleSectionClick('slot-control')}
          >
            <span className="item-label">Slot Control</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'registration-control' ? 'active' : ''}`}
            onClick={() => handleSectionClick('registration-control')}
          >
            <span className="item-label">Registration Control</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'evaluate' ? 'active' : ''}`}
            onClick={() => handleSectionClick('evaluate')}
          >
            <span className="item-label">⭐ Evaluate</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'daily-tasks' ? 'active' : ''}`}
            onClick={() => handleSectionClick('daily-tasks')}
          >
            <span className="item-label">Daily Tasks</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'task-unlocker' ? 'active' : ''}`}
            onClick={() => handleSectionClick('task-unlocker')}
          >
            <span className="item-label">Task Unlocker</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'reset-password' ? 'active' : ''}`}
            onClick={() => handleSectionClick('reset-password')}
          >
            <span className="item-label">Reset Password</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'token-generator' ? 'active' : ''}`}
            onClick={() => handleSectionClick('token-generator')}
          >
            <span className="item-label">Proxy Login</span>
          </button>

          {/* Dev Tools Dropdown */}
          {(user.username === '2300032048' || user.username === '2400030188@kluniversity.in' || user.username === '2400030188') && (
            <div className="dropdown">
              <button
                className={`sidebar-item ${['data-download', 'sql-executor','certificate-download','report-control'].includes(activeSection) ? 'active' : ''}`}
                onClick={() => setShowDevDropdown(!showDevDropdown)}
              >
                <span className="item-label">Dev</span>
              </button>
              {showDevDropdown && (
                <div className="dropdown-content">
                  <button
                    className={`dropdown-item ${activeSection === 'data-download' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('data-download')}
                  >
                    Data Download
                  </button>
                  <button
                    className={`dropdown-item ${activeSection === 'sql-executor' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('sql-executor')}
                  >
                    SQL Executor
                  </button>
                  <button
                    className={`dropdown-item ${activeSection === 'certificate-download' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('certificate-download')}
                  >
                    Certificate Download
                  </button>
                  <button
                    className={`dropdown-item ${activeSection === 'report-control' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('report-control')}
                  >
                    Report Control
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            className={`sidebar-item db-toggle-btn ${isLegacy ? 'legacy-active' : ''}`}
            onClick={handleToggleDB}
            disabled={isTogglingDB}
          >
            <span className="item-label">
              {isTogglingDB ? 'Switching...' : isLegacy ? 'Switch to 2026 DB' : 'Switch to 2025 DB'}
            </span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'change-password' ? 'active' : ''}`}
            onClick={() => handleSectionClick('change-password')}
          >
            <span className="item-label">Change Password</span>
          </button>
        </nav>

        <main className="dashboard-main">
          {activeSection === 'overview' ? <Overview /> : 
           activeSection === 'profile' ? <Profile /> :
           activeSection === 'stats' ? <Stats /> :
           activeSection === 'students' ? <Students /> :
           activeSection === 'supply-students' ? <SupplyStudents /> :
           activeSection === 'completed-students' ? <CompletedStudents /> :
           activeSection === 'student-leads' ? <StudentLeads /> :
           activeSection === 'faculty-mentors' ? <FacultyMentors /> :
           activeSection === 'admins' ? <Admins /> :
           activeSection === 'data-download' ? <DataDownload /> :
           activeSection === 'report-control' ? <ReportControl /> :
           activeSection === 'token-generator' ? <TokenGenerator /> :
           activeSection === 'sql-executor' ? <SQLExecutor /> :
           activeSection === 'reset-password' ? <ResetPassword /> :
           activeSection === 'verify-certificates' ? <VerifyCertificates/> :
           activeSection === 'certificate-download' ? <CertificateDownload /> :
           activeSection === 'supply-final' ? <SFinalProfile /> :
           activeSection === 'problem-statements' ? <ProblemStatements /> :
           activeSection === 'videoDump' ? <VideoDump /> :
           activeSection === 'announcements' ? <Announcements /> :
           activeSection === 'activity-logs' ? <ActivityLogs /> :
           activeSection === 'slot-control' ? <SlotControl /> :
           activeSection === 'registration-control' ? <RegistrationControl /> :
           activeSection === 'daily-tasks' ? <DailyTasksViewer /> :
           activeSection === 'task-unlocker' ? <TaskUnlocker /> :
           activeSection === 'evaluate' ? <Evaluate /> :
           <ChangePassword />}
        </main>
      </div>

      <Footer />
    </div>
  );
}