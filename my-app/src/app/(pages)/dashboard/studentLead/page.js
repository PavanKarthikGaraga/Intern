'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import './page.css';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Overview from './_components/overview/page';
import Profile from './_components/profile/page';
import ChangePassword from './_components/changePassword/page';
import Students from './_components/students/page';
import CompletedStudents from './_components/completedStudents/page';
import FinalReports from './_components/finalReports/page';
import SurveyResponses from './_components/surveyResponses/page';
import DailyTasksViewer from './_components/dailyTasksViewer/page';
import EvaluationPlan from '../student/_components/evaluationPlan/page';

export default function StudentLeadDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');

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
      <Navbar title="Student Lead Dashboard" user={user} />

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
            className={`sidebar-item ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => handleSectionClick('students')}
          >
            <span className="item-label">Students</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'evaluation-plan' ? 'active' : ''}`}
            onClick={() => handleSectionClick('evaluation-plan')}
          >
            <span className="item-label">Evaluation Plan</span>
          </button>
          <button
            className={`sidebar-item ${activeSection === 'daily-tasks' ? 'active' : ''}`}
            onClick={() => handleSectionClick('daily-tasks')}
          >
            <span className="item-label">Daily Tasks</span>
          </button>

          <button
            className={`sidebar-item ${activeSection === 'completed-students' ? 'active' : ''}`}
            onClick={() => handleSectionClick('completed-students')}
          >
            <span className="item-label">Completed Students</span>
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
           activeSection === 'daily-tasks' ? <DailyTasksViewer /> :
           activeSection === 'evaluation-plan' ? <EvaluationPlan /> :
           activeSection === 'completed-students' ? <CompletedStudents user={user} /> :
           activeSection === 'change-password' ? <ChangePassword user={user} /> : null}
        </main>
      </div>

      <Footer />
    </div>
  );
}