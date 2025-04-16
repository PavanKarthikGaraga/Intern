"use client";
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import './page.css';
import Overview from './components/overview/page';
// import Profile from './components/profile/page';
import Students from './components/students/page';
import StudentLeads from './components/studentLeads/page';
import FacultyMentors from './components/facultyMentors/page';
import ChangePassword from './components/changePassword/page';
import Loader from '@/app/components/loader/loader';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AdminDashboard() {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('overview');

    if (!user) {
        return <Loader />;
    }

    return (
        <div className="admin-dashboard">
            <Navbar title="Admin Dashboard" user={user} />

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
                        className={`sidebar-item ${activeSection === 'studentLeads' ? 'active' : ''}`}
                        onClick={() => setActiveSection('studentLeads')}
                    >
                        <span className="item-label">Student Leads</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'facultyMentors' ? 'active' : ''}`}
                        onClick={() => setActiveSection('facultyMentors')}
                    >
                        <span className="item-label">Faculty Mentors</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeSection === 'changePassword' ? 'active' : ''}`}
                        onClick={() => setActiveSection('changePassword')}
                    >
                        <span className="item-label">Change Password</span>
                    </button>
                </nav>

                <main className="dashboard-main">
                    {activeSection === 'overview' ? <Overview user={user}/> : 
                     activeSection === 'profile' ? <Profile user={user}/> :
                     activeSection === 'students' ? <Students user={user}/> :
                     activeSection === 'studentLeads' ? <StudentLeads user={user}/> :
                     activeSection === 'facultyMentors' ? <FacultyMentors user={user}/> : 
                      <ChangePassword/>}
                </main>
            </div>

            <Footer />
        </div>
    );
}