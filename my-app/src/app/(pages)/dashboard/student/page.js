'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaHome, FaUser, FaTasks, FaClipboardList, FaUserTie, FaLock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './page.css';
import Loader from '@/app/components/loader/loader';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Overview from './_components/overview/page';
import Profile from './_components/profile/page';
import ChangePassword from './_components/changePassword/page';
import Lead from './_components/Lead/page';
import Reports from './_components/submissions/reports';
import FinalReport from './_components/finalReport/page';
import ProblemStatement from './_components/problemStatment/page';

import DailyTasks from './_components/dailyTasks/page';
import EvaluationPlan from './_components/evaluationPlan/page';

export default function StudentDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [studentData, setStudentData]     = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [slotEnabled, setSlotEnabled]     = useState(false); // default locked

  useEffect(() => {
    const fetchAll = async () => {
      if (authLoading) return;
      if (!user?.username) { setLoading(false); return; }

      try {
        setLoading(true);
        setError(null);

        // Fetch student data + slot status in parallel
        const [studentRes, slotRes] = await Promise.all([
          fetch('/api/dashboard/student/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username }),
          }),
          fetch('/api/slot-status', { credentials: 'include' }),
        ]);

        if (!studentRes.ok) {
          const errData = await studentRes.json().catch(() => ({}));
          throw new Error(errData.message || `HTTP error! status: ${studentRes.status}`);
        }

        const [data, slotData] = await Promise.all([studentRes.json(), slotRes.json()]);

        if (data.success && data.student) setStudentData(data.student);
        else throw new Error(data.error || 'Failed to fetch student data');

        setSlotEnabled(slotData.enabled === true);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load student data');
        toast.error(err.message || 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user, authLoading]);

  if (!user || authLoading) return <Loader />;
  if (loading) return <Loader />;
  if (error)   return <div className="error">{error}</div>;

  const handleSectionClick = (section) => {
    setActiveSection(section);
    setIsSidebarOpen(false);
  };

  // Whether this student's mentor is assigned
  const hasMentor = Boolean(studentData?.facultyMentorId || studentData?.mentor);

  return (
    <div className="student-dashboard">
      <Navbar title="Student Dashboard" user={user} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="dashboard-content">
        {/* Overlay for mobile */}
        <div 
          className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
          onClick={() => setIsSidebarOpen(false)}
        ></div>

        <nav className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          {/* ── Always visible ── */}
          <button className={`sidebar-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => handleSectionClick('overview')}>
            <FaHome className="sidebar-icon" />
            <span className="item-label">Overview</span>
          </button>
          <button className={`sidebar-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => handleSectionClick('profile')}>
            <FaUser className="sidebar-icon" />
            <span className="item-label">Profile</span>
          </button>
          <button className={`sidebar-item ${activeSection === 'daily-tasks' ? 'active' : ''}`}
            onClick={() => handleSectionClick('daily-tasks')}>
            <FaTasks className="sidebar-icon" />
            <span className="item-label">Daily Tasks</span>
          </button>
          <button className={`sidebar-item ${activeSection === 'evaluation-plan' ? 'active' : ''}`}
            onClick={() => handleSectionClick('evaluation-plan')}>
            <FaClipboardList className="sidebar-icon" />
            <span className="item-label">Evaluation Plan</span>
          </button>
          {hasMentor && (
            <button className={`sidebar-item ${activeSection === 'lead' ? 'active' : ''}`}
              onClick={() => handleSectionClick('lead')}>
              <FaUserTie className="sidebar-icon" />
              <span className="item-label">My Mentor</span>
            </button>
          )}
          <button className={`sidebar-item ${activeSection === 'change-password' ? 'active' : ''}`}
            onClick={() => handleSectionClick('change-password')}>
            <FaLock className="sidebar-icon" />
            <span className="item-label">Change Password</span>
          </button>

          {/* Locked notice */}
          {!slotEnabled && (
            <div style={{
              margin: '16px 12px 0',
              background: '#fff8e1',
              border: '1.5px solid #ffe082',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: '0.78rem',
              color: '#e65100',
              lineHeight: 1.5,
            }}>
              🔒 Your slot is not yet active. Other sections will unlock when your slot opens.
            </div>
          )}
        </nav>

        <main className="dashboard-main">
          {activeSection === 'overview'         ? <Overview user={user} studentData={studentData} /> :
           activeSection === 'profile'          ? <Profile user={user} studentData={studentData} /> :
           activeSection === 'change-password'  ? <ChangePassword user={user} /> :
           activeSection === 'evaluation-plan'   ? <EvaluationPlan /> :
           activeSection === 'lead'             ? <Lead studentData={studentData} /> :
           // Slot-gated
           activeSection === 'daily-tasks' && slotEnabled  ? <DailyTasks studentData={studentData} /> :
           !slotEnabled && (activeSection === 'daily-tasks') ? (
             <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', textAlign:'center', gap:16 }}>
               <div style={{ fontSize:'3rem' }}>🔒</div>
               <h2 style={{ fontSize:'1.4rem', fontWeight:700, color:'#014a01', margin:0 }}>Slot Not Active Yet</h2>
               <p style={{ color:'#555', fontSize:'0.95rem', maxWidth:380, lineHeight:1.6 }}>
                 This section will be available once your internship slot is activated by the admin. Please check back soon.
               </p>
             </div>
           ) : (
             <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', textAlign:'center', gap:16 }}>
               <div style={{ fontSize:'3rem' }}>🚧</div>
               <h2 style={{ fontSize:'1.5rem', fontWeight:'700', color:'#014a01', margin:0 }}>Coming Soon</h2>
               <p style={{ color:'#555', fontSize:'1rem', maxWidth:'400px', lineHeight:'1.6' }}>
                 This section is under preparation and will be available soon.
               </p>
             </div>
           )
          }
        </main>
      </div>

      <Footer />
    </div>
  );
}