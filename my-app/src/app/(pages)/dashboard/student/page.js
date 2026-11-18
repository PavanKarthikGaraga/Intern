'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { LayoutDashboard, UserRound, ListChecks, ClipboardList, FileText, Lock, BookMarked, AlertTriangle, Construction, RefreshCw } from 'lucide-react';
import './page.css';
import Loader from '@/app/components/loader/loader';
import dynamic from 'next/dynamic';
import DashboardShell, { DashboardState, useHashSection } from '@/components/DashboardShell';

// Sections are code-split: only the one being viewed is downloaded.
const SectionLoading = () => <Loader />;

const Overview = dynamic(() => import('./_components/overview/page'), { loading: SectionLoading });
const Profile = dynamic(() => import('./_components/profile/page'), { loading: SectionLoading });
const ChangePassword = dynamic(() => import('./_components/changePassword/page'), { loading: SectionLoading });
const ReportBook = dynamic(() => import('./_components/reportBook/page'), { loading: SectionLoading });
const DailyTasks = dynamic(() => import('./_components/dailyTasks/page'), { loading: SectionLoading });
const EvaluationPlan = dynamic(() => import('./_components/evaluationPlan/page'), { loading: SectionLoading });
const SurveyQuestions = dynamic(() => import('./_components/surveyQuestions/page'), { loading: SectionLoading });

const BASE_SECTIONS = ['overview', 'profile', 'daily-tasks', 'survey-questions', 'evaluation-plan', 'change-password'];

/** Report Book eligibility, unchanged from the previous inline logic. */
function getReportBookEligibility(studentData) {
  const dm = studentData?.dailyMarks || {};
  const allDaysEvaluated = [1, 2, 3, 4, 5, 6, 7].every(d => dm[`d${d}`] !== null && dm[`d${d}`] !== undefined);
  const totalMarks = dm.total || 0;
  const slotNum = parseInt(String(studentData?.slot || '1').replace(/\D/g, ''), 10) || 1;
  const day7Submitted = Boolean(studentData?.uploads?.details?.day7) || Boolean(studentData?.hasFinalDay7Task);
  // Slot 1: all days evaluated and at least 60 marks
  // Slot 10 onwards: all 7 daily tasks submitted
  // Other slots: always visible
  if (slotNum === 1) return allDaysEvaluated && totalMarks >= 60;
  if (slotNum >= 10) return day7Submitted;
  return true;
}

export default function StudentDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [slotEnabled, setSlotEnabled] = useState(false); // default locked
  const [rbookVisible, setRbookVisible] = useState(true); // admin report book visibility
  const [reloadKey, setReloadKey] = useState(0);

  const showReportBook = Boolean(studentData) && getReportBookEligibility(studentData) && rbookVisible;
  const [activeSection, setActiveSection] = useHashSection(
    'overview',
    (id) => BASE_SECTIONS.includes(id) || (id === 'report-book' && showReportBook),
    `${studentData ? 'loaded' : 'pending'}-${showReportBook}`
  );

  useEffect(() => {
    const fetchAll = async () => {
      if (authLoading) return;
      if (!user?.username) { setLoading(false); return; }

      try {
        setLoading(true);
        setError(null);

        // Fetch student data + slot status in parallel
        const [studentRes, slotRes, rbookRes] = await Promise.all([
          fetch('/api/dashboard/student/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username }),
          }),
          fetch('/api/slot-status', { credentials: 'include' }),
          fetch('/api/rbook-status', { credentials: 'include' }),
        ]);

        if (!studentRes.ok) {
          const errData = await studentRes.json().catch(() => ({}));
          throw new Error(errData.message || errData.error || `Request failed (${studentRes.status})`);
        }

        const [data, slotData, rbookData] = await Promise.all([
          studentRes.json(),
          slotRes.json().catch(() => ({})),
          rbookRes.json().catch(() => ({})),
        ]);

        if (data.success && data.student) setStudentData(data.student);
        else throw new Error(data.error || 'Failed to fetch student data');

        setSlotEnabled(slotData.enabled === true);
        setRbookVisible(rbookData.visible !== false); // default to true if missing
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load student data');
        toast.error('Could not load your dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user, authLoading, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  if (!user || authLoading) return <Loader fullscreen />;

  const navGroups = [
    {
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'profile', label: 'Profile', icon: UserRound },
      ],
    },
    {
      label: 'Internship',
      items: [
        { id: 'daily-tasks', label: 'Daily Tasks', icon: ListChecks },
        { id: 'survey-questions', label: 'Survey Questions', icon: FileText },
        { id: 'evaluation-plan', label: 'Evaluation Plan', icon: ClipboardList },
        { id: 'report-book', label: 'Report Book', icon: BookMarked, hidden: !showReportBook },
      ],
    },
    {
      label: 'Account',
      items: [{ id: 'change-password', label: 'Change Password', icon: Lock }],
    },
  ];

  const renderSection = () => {
    if (loading) return <Loader />;

    // Keep navigation available on failure and offer a retry instead of a blank screen
    if (error) {
      return (
        <DashboardState
          tone="error"
          icon={AlertTriangle}
          title="We couldn't load your dashboard"
          message="Something went wrong while fetching your internship details. Please check your connection and try again."
          action={
            <button type="button" className="ds-btn" onClick={retry}>
              <RefreshCw size={16} aria-hidden="true" /> Try again
            </button>
          }
        />
      );
    }

    switch (activeSection) {
      case 'overview':         return <Overview user={user} studentData={studentData} />;
      case 'profile':          return <Profile user={user} studentData={studentData} />;
      case 'change-password':  return <ChangePassword user={user} />;
      case 'evaluation-plan':  return <EvaluationPlan studentData={studentData} />;
      case 'survey-questions': return <SurveyQuestions studentData={studentData} />;
      case 'report-book':      return showReportBook ? <ReportBook studentData={studentData} /> : null;
      case 'daily-tasks':
        return slotEnabled
          ? <DailyTasks studentData={studentData} onSectionChange={setActiveSection} />
          : (
            <DashboardState
              tone="warning"
              icon={Lock}
              title="Your slot isn't active yet"
              message="Daily tasks will be available once your internship slot is activated by the admin. Please check back soon."
            />
          );
      default:
        return (
          <DashboardState
            icon={Construction}
            title="Coming soon"
            message="This section is being prepared and will be available soon."
          />
        );
    }
  };

  return (
    <DashboardShell
      title="Student Dashboard"
      user={user}
      navGroups={navGroups}
      activeId={activeSection}
      onNavigate={setActiveSection}
      sidebarNotice={!loading && !error && !slotEnabled
        ? 'Your slot is not active yet. Daily tasks will unlock when your slot opens.'
        : null}
    >
      {renderSection()}
    </DashboardShell>
  );
}
