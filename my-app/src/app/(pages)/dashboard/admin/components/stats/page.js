'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { DOMAINS } from '@/app/Data/domains';
import './page.css';

export default function AdminDashboard() {
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        domain: '',
        slot: '',
        mode: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalStudents: 0,
        limit: 20
    });

    const fetchStudents = async () => {
        try {
            const queryParams = new URLSearchParams({
                page: pagination.currentPage,
                limit: pagination.limit,
                ...(filters.domain && { domain: filters.domain }),
                ...(filters.slot && { slot: filters.slot }),
                ...(filters.mode && { mode: filters.mode })
            });

            const response = await axios.get(`/api/dashboard/admin/students?${queryParams}`);
            if (response.data.success) {
                setStudents(response.data.data.students || []);
                setPagination(response.data.data.pagination || {
                    currentPage: 1,
                    totalPages: 1,
                    totalStudents: 0,
                    limit: 20
                });
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            setStudents([]);
            setPagination({
                currentPage: 1,
                totalPages: 1,
                totalStudents: 0,
                limit: 20
            });
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/dashboard/admin/stats');
            if (response.data.success) {
                setStats(response.data.stats || null);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            setStats(null);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchStudents(), fetchStats()]);
            setLoading(false);
        };
        loadData();
    }, [filters, pagination.currentPage, pagination.limit]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="admin-dashboard">
            {/* Overview Stats Section */}
            <section className="stats-section">
                <h2>Dashboard Overview</h2>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Students</h3>
                        <p>{stats?.overview?.totalStudents || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Active Students</h3>
                        <p>{stats?.overview?.totalActive || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Completed</h3>
                        <p>{stats?.overview?.totalCompleted || 0}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Completion Rate</h3>
                        <p>{stats?.overview?.completionRate || 0}%</p>
                    </div>
                </div>
            </section>

            {/* Slot Stats Section */}
            <section className="stats-section">
                <h2>Slot Statistics</h2>
                <div className="stats-grid">
                    {[1, 2, 3, 4].map(slotNum => (
                        <div key={slotNum} className="stat-card slot-card">
                            <h3>Slot {slotNum}</h3>
                            <div className="slot-stats">
                                <div className="slot-stat">
                                    <span>Total:</span>
                                    <span>{stats?.slots[`slot${slotNum}`]?.total || 0}</span>
                                </div>
                                <div className="slot-stat">
                                    <span>Remote:</span>
                                    <span>{stats?.slots[`slot${slotNum}`]?.remote || 0}</span>
                                </div>
                                <div className="slot-stat">
                                    <span>In Campus:</span>
                                    <span>{stats?.slots[`slot${slotNum}`]?.incampus || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Domain Stats Section */}
            <section className="stats-section">
                <h2>Domain Statistics</h2>
                <div className="domain-stats-container">
                    {stats?.domainStats?.map(domain => (
                        <div key={domain.selectedDomain} className="domain-stat-card">
                            <h3>{domain.selectedDomain}</h3>
                            <div className="domain-stats">
                                <div className="domain-stat">
                                    <span>Total:</span>
                                    <span>{domain.total}</span>
                                </div>
                                <div className="domain-stat">
                                    <span>Active:</span>
                                    <span>{domain.active}</span>
                                </div>
                                <div className="domain-stat">
                                    <span>Completed:</span>
                                    <span>{domain.completed}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Filters Section */}
            <section className="filters-section">
                <div className="filter-container">
                    <select 
                        value={filters.domain}
                        onChange={(e) => handleFilterChange('domain', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Domains</option>
                        {DOMAINS.map(domain => (
                            <option key={domain.id} value={domain.name}>
                                {domain.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={filters.slot}
                        onChange={(e) => handleFilterChange('slot', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Slots</option>
                        <option value="1">Slot 1</option>
                        <option value="2">Slot 2</option>
                        <option value="3">Slot 3</option>
                        <option value="4">Slot 4</option>
                    </select>

                    <select
                        value={filters.mode}
                        onChange={(e) => handleFilterChange('mode', e.target.value)}
                        className="filter-select"
                    >
                        <option value="">All Modes</option>
                        <option value="Remote">Remote</option>
                        <option value="Incampus">In Campus</option>
                    </select>
                </div>
            </section>

            {/* Students Table */}
            <section className="students-section">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID Number</th>
                                <th>Name</th>
                                <th>Domain</th>
                                <th>Mode</th>
                                <th>Slot</th>
                                {/* <th>Email</th> */}
                                {/* <th>Phone</th> */}
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.username}>
                                    <td>{student.username}</td>
                                    <td>{student.name}</td>
                                    <td>{student.selectedDomain}</td>
                                    <td>{student.mode}</td>
                                    <td>{student.slot}</td>
                                    {/* <td>{student.email}</td> */}
                                    {/* <td>{student.phoneNumber}</td> */}
                                    <td>
                                        <span className={`status ${student.completed ? 'completed' : 'active'}`}>
                                            {student.completed ? 'Completed' : 'Active'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="pagination">
                    <button 
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="page-button"
                    >
                        Previous
                    </button>
                    <span className="page-info">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button 
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="page-button"
                    >
                        Next
                    </button>
                </div>
            </section>
        </div>
    );
}
