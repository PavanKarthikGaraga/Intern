'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import './page.css';
import DashboardShell, { useHashSection } from '@/components/DashboardShell';
import Loader from '@/app/components/loader/loader';
import { LayoutDashboard, UserRound, Users, GraduationCap, UserCheck, ClipboardList, ClipboardCheck, Lock } from 'lucide-react';
import Overview from './_components/overview/page';
import Profile from './_components/profile/page';
import ChangePassword from './_components/changePassword/page';
import Students from './_components/students/page';
import Leads from './_components/leads/page';
import CompletedStudents from './_components/completedStudents/page';
import FinalReports from './_components/finalReports/page';
import EvaluationPlan from '../student/_components/evaluationPlan/page';

const SECTION_IDS = ['overview', 'profile', 'leads', 'students', 'completed-students', 'evaluation-plan', 'evaluate', 'change-password'];

export default function FacultyMentorDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useHashSection('overview', (id) => SECTION_IDS.includes(id));
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

  if (isLoading) return <Loader fullscreen />;
  if (!isAuthenticated || !user) return null;

  const navGroups = [
    {
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'profile', label: 'Profile', icon: UserRound },
      ],
    },
    {
      label: 'Mentoring',
      items: [
        { id: 'leads', label: 'Student Leads', icon: Users },
        { id: 'students', label: 'Students', icon: GraduationCap },
        { id: 'completed-students', label: 'Completed Students', icon: UserCheck },
      ],
    },
    {
      label: 'Evaluation',
      items: [
        { id: 'evaluation-plan', label: 'Evaluation Plan', icon: ClipboardList },
        { id: 'evaluate', label: 'Evaluate', icon: ClipboardCheck, badge: pendingCount },
      ],
    },
    {
      label: 'Account',
      items: [{ id: 'change-password', label: 'Change Password', icon: Lock }],
    },
  ];

  return (
    <DashboardShell
      title="Faculty Mentor Dashboard"
      user={user}
      navGroups={navGroups}
      activeId={activeSection}
      onNavigate={setActiveSection}
    >
      {activeSection === 'overview' ? <Overview user={user} /> :
       activeSection === 'profile' ? <Profile user={user} /> :
       activeSection === 'students' ? <Students user={user} /> :
       activeSection === 'leads' ? <Leads user={user} /> :
       activeSection === 'completed-students' ? <CompletedStudents user={user} /> :
       activeSection === 'evaluation-plan' ? <EvaluationPlan /> :
       activeSection === 'evaluate' ? <FinalReports /> :
       <ChangePassword user={user} />}
    </DashboardShell>
  );
}
