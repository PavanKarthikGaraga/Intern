"use client";
import { useState } from 'react';
import './page.css';
import Overview from './components/overview/page';
import Students from './components/students/page';
import CompletedStudents from './components/completed-students/page';
import Mentors from './components/mentors/page';
import StudentLeads from './components/student-leads/page';
import AdminManagement from './components/admin-management/page';
import ChangePassword from './components/change-password/page';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AdminDashboard() {
    const [activeSection, setActiveSection] = useState('overview');
    const router = useRouter();

    const handleLogout = () => {
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        router.push('/login');
        toast.success('Logged out successfully');
    };

    const renderSection = () => {
        switch (activeSection) {
            case 'overview':
                return <Overview />;
            case 'students':
                return <Students />;
            case 'completed':
                return <CompletedStudents />;
            case 'mentors':
                return <Mentors />;
            case 'student-leads':
                return <StudentLeads />;
            case 'admin':
                return <AdminManagement />;
            case 'password':
                return <ChangePassword />;
            default:
                return <Overview />;
        }
    };

    return (
        <div className="admin-dashboard">
            <Navbar />
            <div className="dashboard-container">
                <div className="sidebar">
                    <div className="sidebar-header">
                        <h2>Admin Dashboard</h2>
                        <p className="role-text">Admin</p>
                    </div>
                    <div className="sidebar-menu">
                        <button
                            className={activeSection === 'overview' ? 'active' : ''} 
                            onClick={() => setActiveSection('overview')}
                        >
                            Overview
                        </button>
                        <button
                            className={activeSection === 'students' ? 'active' : ''} 
                            onClick={() => setActiveSection('students')}
                        >
                            Active Students
                        </button>
                        <button
                            className={activeSection === 'completed' ? 'active' : ''} 
                            onClick={() => setActiveSection('completed')}
                        >
                            Completed Students
                        </button>
                        <button
                            className={activeSection === 'mentors' ? 'active' : ''} 
                            onClick={() => setActiveSection('mentors')}
                        >
                            Faculty Mentors
                        </button>
                        <button
                            className={activeSection === 'student-leads' ? 'active' : ''} 
                            onClick={() => setActiveSection('student-leads')}
                        >
                            Student Leads
                        </button>
                        <button
                            className={activeSection === 'admin' ? 'active' : ''} 
                            onClick={() => setActiveSection('admin')}
                        >
                            Admin Management
                        </button>
                        <button
                            className={activeSection === 'password' ? 'active' : ''} 
                            onClick={() => setActiveSection('password')}
                        >
                            Change Password
                        </button>
                        <button className="logout-btn" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>
                <div className="main-content">
                    {renderSection()}
                </div>
            </div>
            <Footer />
        </div>
    );
}