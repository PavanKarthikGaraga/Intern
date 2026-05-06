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
import Leads from './_components/leads/page';
import CompletedStudents from './_components/completedStudents/page';
import FinalReports from './_components/finalReports/page';
import EvaluationPlan from '../student/_components/evaluationPlan/page';

export default function FacultyMentorDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch('/api/dashboard/facultyMentor/finalReports', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const submitted = data.data?.submittedReports || [];
          const pending = submitted.filter(s => !s.completed && !(s.marksCompleted === 'P')).length;
          setPendingCount(pending);
        }
      })
      .catch(() => {});
  }, [user]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSectionClick = (section) => {
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
            className={`sidebar-item ${activeSection === 'evaluation-plan' ? 'active' : ''}`}
            onClick={() => handleSectionClick('evaluation-plan')}
          >
            <span className="item-label">Evaluation Plan</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'evaluate' ? 'active' : ''}`}
            onClick={() => handleSectionClick('evaluate')}
            style={{ position: 'relative' }}
          >
            <span className="item-label">Evaluate</span>
            {pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: '6px', right: '10px',
                background: '#e53e3e', color: '#fff', borderRadius: '50%',
                minWidth: '20px', height: '20px', fontSize: '0.72rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px'
              }}>{pendingCount}</span>
            )}
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
           activeSection === 'evaluation-plan' ? <EvaluationPlan /> :
           activeSection === 'evaluate' ? <FinalReports /> :
           <ChangePassword user={user} />}
        </main>
      </div>

      <Footer />
    </div>
  );
}