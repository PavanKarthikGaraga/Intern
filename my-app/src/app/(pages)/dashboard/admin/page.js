'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import './page.css';
import DashboardShell, { useHashSection } from '@/components/DashboardShell';
import Loader from '@/app/components/loader/loader';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard, UserRound, BarChart3, GraduationCap, Users, UserCog, ShieldCheck, UserCheck,
  Repeat, FileText, FileBarChart, Megaphone, ListChecks, Video, BadgeCheck, ClipboardCheck, Trophy,
  BookOpen, BookMarked, PieChart, Map as MapIcon, ScrollText, CalendarClock, SlidersHorizontal, CalendarDays,
  Unlock, Globe, KeyRound, LogIn, Lock, FolderDown, Terminal, Award, Wrench, FileSpreadsheet, History, Database,
} from 'lucide-react';

// Sections are code-split: only the one being viewed is downloaded.
const SectionLoading = () => <Loader />;

const Overview = dynamic(() => import('./_components/overview/page'), { loading: SectionLoading });
const Profile = dynamic(() => import('./_components/profile/page'), { loading: SectionLoading });
const ChangePassword = dynamic(() => import('./_components/changePassword/page'), { loading: SectionLoading });
const Students = dynamic(() => import('./_components/students/page'), { loading: SectionLoading });
const CompletedStudents = dynamic(() => import('./_components/completedStudents/page'), { loading: SectionLoading });
const Stats = dynamic(() => import('./_components/stats/page'), { loading: SectionLoading });
const StudentLeads = dynamic(() => import('./_components/studentLeads/page'), { loading: SectionLoading });
const FacultyMentors = dynamic(() => import('./_components/facultyMentors/page'), { loading: SectionLoading });
const Admins = dynamic(() => import('./_components/admins/page'), { loading: SectionLoading });
const DataDownload = dynamic(() => import('./_components/dataDownload/page'), { loading: SectionLoading });
const ReportControl = dynamic(() => import('./_components/reportControl/page'), { loading: SectionLoading });
const ReportDeadline = dynamic(() => import('./_components/reportDeadline/page'), { loading: SectionLoading });
const PblDeadline = dynamic(() => import('./_components/pblDeadline/page'), { loading: SectionLoading });
const TokenGenerator = dynamic(() => import('./_components/tokenGenerator/page'), { loading: SectionLoading });
const SQLExecutor = dynamic(() => import('./_components/sqlExecutor/page'), { loading: SectionLoading });
const ResetPassword = dynamic(() => import('./_components/resetPassword/page'), { loading: SectionLoading });
const SupplyStudents = dynamic(() => import('./_components/supplyStudents/page'), { loading: SectionLoading });
const CertificateDownload = dynamic(() => import('./_components/certificate/page'), { loading: SectionLoading });
const VerifyCertificates = dynamic(() => import('./_components/verifyCertificates/page'), { loading: SectionLoading });
const SFinalProfile = dynamic(() => import('./_components/sfinal/page'), { loading: SectionLoading });
const ProblemStatements = dynamic(() => import('./_components/problemStatements/page'), { loading: SectionLoading });
const ActivityLogs = dynamic(() => import('./_components/activityLogs/page'), { loading: SectionLoading });
const DailyTasksViewer = dynamic(() => import('../studentLead/_components/dailyTasksViewer/page'), { loading: SectionLoading });
const TaskUnlocker = dynamic(() => import('./_components/taskUnlocker/page'), { loading: SectionLoading });
const SlotControl = dynamic(() => import('./_components/slotControl/page'), { loading: SectionLoading });
const RegistrationControl = dynamic(() => import('./_components/registrationControl/page'), { loading: SectionLoading });
const VideoDump = dynamic(() => import('./_components/videoDump/page'), { loading: SectionLoading });
const Announcements = dynamic(() => import('./_components/announcements/page'), { loading: SectionLoading });
const Evaluate = dynamic(() => import('./_components/evaluate/page'), { loading: SectionLoading });
const SurveyAnalysis = dynamic(() => import('./_components/surveyAnalysis/page'), { loading: SectionLoading });
const SlotReport = dynamic(() => import('./_components/slotReport/page'), { loading: SectionLoading });
const FinalReports = dynamic(() => import('./_components/finalReports/page'), { loading: SectionLoading });
const Results = dynamic(() => import('./_components/results/page'), { loading: SectionLoading });
const Day5Report = dynamic(() => import('./_components/day5Report/page'), { loading: SectionLoading });
const RBookControl = dynamic(() => import('./_components/rbookControl/page'), { loading: SectionLoading });
const FullRep = dynamic(() => import('./_components/dev/fullRep/page'), { loading: SectionLoading });
const CertGen = dynamic(() => import('./_components/certGen/page'), { loading: SectionLoading });
const Y25Report = dynamic(() => import('./_components/y25Report/page'), { loading: SectionLoading });
const MyGovTasks = dynamic(() => import('./_components/mygovTasks/page'), { loading: SectionLoading });

// Accounts allowed to see the Developer tools group (server routes enforce their own checks)
const DEV_USERNAMES = ['2300032048', '2400030188@kluniversity.in', '2400030188', '5387'];

const SECTIONS = {
  'overview': Overview,
  'profile': Profile,
  'stats': Stats,
  'students': Students,
  'student-leads': StudentLeads,
  'faculty-mentors': FacultyMentors,
  'admins': Admins,
  'completed-students': CompletedStudents,
  'supply-students': SupplyStudents,
  'supply-final': SFinalProfile,
  'problem-statements': ProblemStatements,
  'announcements': Announcements,
  'daily-tasks': DailyTasksViewer,
  'videoDump': VideoDump,
  'verify-certificates': VerifyCertificates,
  'evaluate': Evaluate,
  'results': Results,
  'final-reports': FinalReports,
  'rbook-control': RBookControl,
  'survey-analysis': SurveyAnalysis,
  'slot-report': SlotReport,
  'y25-report': Y25Report,
  'day5Report': Day5Report,
  'activity-logs': ActivityLogs,
  'slot-control': SlotControl,
  'registration-control': RegistrationControl,
  'report-deadline': ReportDeadline,
  'pbl-deadline': PblDeadline,
  'task-unlocker': TaskUnlocker,
  'mygov-tasks': MyGovTasks,
  'reset-password': ResetPassword,
  'token-generator': TokenGenerator,
  'change-password': ChangePassword,
  // Developer tools
  'data-download': DataDownload,
  'sql-executor': SQLExecutor,
  'certificate-download': CertificateDownload,
  'report-control': ReportControl,
  'full-rep': FullRep,
  'cert-gen': CertGen,
};

const DEV_SECTIONS = new Set(['data-download', 'sql-executor', 'certificate-download', 'report-control', 'full-rep', 'cert-gen']);

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const isDev = DEV_USERNAMES.includes(user?.username);
  const [activeSection, setActiveSection] = useHashSection(
    'overview',
    (id) => id in SECTIONS && (!DEV_SECTIONS.has(id) || DEV_USERNAMES.includes(user?.username)),
    user?.username || ''
  );
  const [isLegacy, setIsLegacy] = useState(false);
  const [isTogglingDB, setIsTogglingDB] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.replace('/auth/login');
    }

    const checkDBState = async () => {
      try {
        const res = await fetch('/api/dashboard/admin/toggle-db');
        const data = await res.json();
        if (data.success) setIsLegacy(data.isLegacy);
      } catch (err) {
        console.error('Failed to fetch DB state');
      }
    };

    if (isAuthenticated) checkDBState();
  }, [isLoading, isAuthenticated]);

  if (isLoading) return <Loader fullscreen />;
  if (!isAuthenticated || !user) return null;

  const handleToggleDB = async () => {
    if (isTogglingDB) return;

    const confirmMsg = isLegacy
      ? 'Switch back to the current (2026) database?'
      : 'Switch to the legacy (2025) database?\n\nAll data shown will be from last year. Use with caution.';
    if (!window.confirm(confirmMsg)) return;

    setIsTogglingDB(true);
    try {
      const res = await fetch('/api/dashboard/admin/toggle-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useLegacy: !isLegacy }),
      });
      const data = await res.json();
      if (data.success) {
        setIsLegacy(data.isLegacy);
        // Reload so every component re-fetches from the newly selected database
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

  const navGroups = [
    {
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'stats', label: 'Statistics', icon: BarChart3 },
        { id: 'profile', label: 'Profile', icon: UserRound },
      ],
    },
    {
      label: 'People',
      items: [
        { id: 'students', label: 'Students', icon: GraduationCap },
        { id: 'student-leads', label: 'Student Leads', icon: Users },
        { id: 'faculty-mentors', label: 'Faculty Mentors', icon: UserCog },
        { id: 'admins', label: 'Administrators', icon: ShieldCheck },
        { id: 'completed-students', label: 'Completed Students', icon: UserCheck },
      ],
    },
    {
      label: 'Supply',
      items: [
        { id: 'supply-students', label: 'Supply Students', icon: Repeat },
        { id: 'supply-final', label: 'Supply Final', icon: FileText },
      ],
    },
    {
      label: 'Programme',
      items: [
        { id: 'problem-statements', label: 'Problem Statements', icon: FileBarChart },
        { id: 'announcements', label: 'Announcements', icon: Megaphone },
        { id: 'daily-tasks', label: 'Daily Tasks', icon: ListChecks },
        { id: 'videoDump', label: 'Video Dump', icon: Video },
        { id: 'verify-certificates', label: 'Verify Certificates', icon: BadgeCheck },
      ],
    },
    {
      label: 'Evaluation',
      items: [
        { id: 'evaluate', label: 'Evaluate', icon: ClipboardCheck },
        { id: 'results', label: 'Results', icon: Trophy },
        { id: 'final-reports', label: 'Final Reports', icon: BookOpen },
        { id: 'rbook-control', label: 'Report Book', icon: BookMarked },
      ],
    },
    {
      label: 'Reports',
      items: [
        { id: 'survey-analysis', label: 'Survey Analysis', icon: PieChart },
        { id: 'slot-report', label: 'Slot-wise Report', icon: MapIcon },
        { id: 'y25-report', label: 'Y25 Report', icon: FileSpreadsheet },
        { id: 'day5Report', label: 'Day 5 Report (PDF)', icon: ScrollText },
        { id: 'activity-logs', label: 'Activity Log', icon: History },
      ],
    },
    {
      label: 'Controls',
      items: [
        { id: 'slot-control', label: 'Slot Control', icon: SlidersHorizontal },
        { id: 'registration-control', label: 'Registration Control', icon: CalendarDays },
        { id: 'report-deadline', label: 'Report Deadline', icon: CalendarClock },
        { id: 'pbl-deadline', label: 'PBL Deadline', icon: CalendarClock },
        { id: 'task-unlocker', label: 'Task Unlocker', icon: Unlock },
        { id: 'mygov-tasks', label: 'MyGov Tasks', icon: Globe },
      ],
    },
    {
      label: 'Accounts',
      items: [
        { id: 'reset-password', label: 'Reset Student Password', icon: KeyRound },
        { id: 'token-generator', label: 'Proxy Login', icon: LogIn },
        { id: 'change-password', label: 'Change My Password', icon: Lock },
      ],
    },
    {
      label: 'Developer',
      items: [
        { id: 'data-download', label: 'Data Download', icon: FolderDown, hidden: !isDev },
        { id: 'sql-executor', label: 'SQL Executor', icon: Terminal, hidden: !isDev },
        { id: 'certificate-download', label: 'Certificate Download', icon: Award, hidden: !isDev },
        { id: 'report-control', label: 'Report Control', icon: Wrench, hidden: !isDev },
        { id: 'full-rep', label: 'Full Report', icon: FileBarChart, hidden: !isDev },
        { id: 'cert-gen', label: 'Certificate Generator', icon: Award, hidden: !isDev },
      ],
    },
    {
      label: 'Database',
      items: [
        {
          id: 'toggle-db',
          label: isTogglingDB ? 'Switching…' : isLegacy ? 'Switch to 2026 database' : 'Switch to 2025 database',
          icon: Database,
          onClick: handleToggleDB,
          disabled: isTogglingDB,
          tone: isLegacy ? 'warning' : undefined,
        },
      ],
    },
  ];

  const ActiveSection = SECTIONS[activeSection] || Overview;

  return (
    <DashboardShell
      title={isLegacy ? 'Admin · Legacy 2025 database' : 'Admin Dashboard'}
      user={user}
      navGroups={navGroups}
      activeId={activeSection}
      onNavigate={setActiveSection}
      banner={isLegacy && (
        <div className="ds-banner" role="status">
          <span>You are viewing the legacy 2025 database. Changes here do not affect the 2026 programme.</span>
          <button type="button" onClick={handleToggleDB}>Switch back to 2026</button>
        </div>
      )}
    >
      <ActiveSection />
    </DashboardShell>
  );
}
