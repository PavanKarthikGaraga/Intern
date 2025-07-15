'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import './page.css';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Overview from './components/overview/page';
import Profile from './components/profile/page';
import ChangePassword from './components/changePassword/page';
import Students from './components/students/page';
import CompletedStudents from './components/completedStudents/page';
import Stats from './components/stats/page';
import StudentLeads from './components/studentLeads/page';
import FacultyMentors from './components/facultyMentors/page';
import Admins from './components/admins/page';
import DataDownload from './components/dataDownload/page';
import ReportControl from './components/reportControl/page';
// import PM2Logs from './components/pm2-logs/page';
import TokenGenerator from './components/tokenGenerator/page';
import SQLExecutor from './components/sqlExecutor/page';
import ResetPassword from './components/resetPassword/page';
import SupplyStudents from './components/supplyStudents/page';
import CertificateDownload from './components/certificate/page';
import GenerateCertificates from './components/generateCertificates/page';
import VerifyCertificates from './components/verifyCertificates/page';
import SFinalProfile from './components/sfinal/page';
import ProblemStatements from './components/problemStatements/page';

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  const [showDevDropdown, setShowDevDropdown] = useState(false);
  const [showSupplyDropdown, setShowSupplyDropdown] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.replace('/auth/login');
    }
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
  };

  return (
    <div className="student-dashboard">
      <Navbar title="Admin Dashboard" user={user} />

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
          
          {/* <button
                    className={`dropdown-item ${activeSection === 'generate-certificates' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('generate-certificates')}
                  >
                  Generate Certificates
                  </button> */}

          {/* Dev Tools Dropdown */}
          {user.username === '2300032048' && (
            <div className="dropdown">
              <button
                className={`sidebar-item ${['data-download', 'sql-executor', 'generate-certificates'].includes(activeSection) ? 'active' : ''}`}
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
                    className={`sidebar-item ${activeSection === 'generate-certificates' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('generate-certificates')}
                  >
                    <span className="item-label">Generate Certificates</span>
                  </button>
                  {/* <button
                    className={`dropdown-item ${activeSection === 'certificate-download' ? 'active' : ''}`}
                    onClick={() => handleSectionClick('certificate-download')}
                  >
                    Certificate Download
                  </button> */}
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
           activeSection === 'generate-certificates' ? <GenerateCertificates /> :
           activeSection === 'supply-final' ? <SFinalProfile /> :
           activeSection === 'problem-statements' ? <ProblemStatements /> :
           <ChangePassword />}
        </main>
      </div>

      <Footer />
    </div>
  );
}