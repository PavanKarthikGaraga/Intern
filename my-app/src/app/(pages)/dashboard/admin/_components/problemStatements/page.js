'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { FaDownload, FaChevronLeft, FaChevronRight, FaChartBar } from 'react-icons/fa';
import './page.css';

export default function ProblemStatements() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [filters, setFilters] = useState({ domain: '', state: '', district: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [activeTab, setActiveTab] = useState('table'); // 'table' | 'analytics'
    const [expandedDomain, setExpandedDomain] = useState(null);



    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.domain)   params.append('domain', filters.domain);
            if (filters.state)    params.append('state', filters.state);
            if (filters.district) params.append('district', filters.district);
            params.append('page', currentPage);
            params.append('limit', itemsPerPage);

            const response = await fetch(`/api/dashboard/admin/problemStatements?${params.toString()}`, {
                method: 'GET', credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch problem statements');
            }

            const result = await response.json();
            if (result.success) setData(result.data);
            else throw new Error(result.error || 'Failed to fetch problem statements');
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage, itemsPerPage]);



    useEffect(() => { if (user?.username) fetchData(); }, [user, filters, currentPage, fetchData]);
    useEffect(() => { setCurrentPage(1); }, [filters]);

    const handleDownloadExcel = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.domain)   params.append('domain', filters.domain);
            if (filters.state)    params.append('state', filters.state);
            if (filters.district) params.append('district', filters.district);
            params.append('page', 1);
            params.append('limit', 5000);

            const response = await fetch(`/api/dashboard/admin/problemStatements?${params.toString()}`, {
                method: 'GET', credentials: 'include'
            });
            const result = await response.json();

            if (!result.success || !result.data.problemStatements?.length) {
                toast.error('No data to download'); return;
            }

            const excelData = result.data.problemStatements.map(s => ({
                'Student ID': s.username,
                'Student Name': s.student_name,
                'Batch': s.batch || 'N/A',
                'Slot': `Slot ${s.slot}`,
                'Mode': s.mode,
                'Domain': s.domain,
                'Problem Statement': s.problem_statement,
                'Location': s.location,
                'District': s.district,
                'State': s.state,
            }));

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            worksheet['!cols'] = [
                { wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 8 }, { wch: 10 },
                { wch: 28 }, { wch: 45 }, { wch: 20 }, { wch: 18 }, { wch: 18 }
            ];
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Problem Statements');
            XLSX.writeFile(workbook, `problem_statements_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Excel downloaded');
        } catch (err) {
            toast.error('Failed to download Excel');
        }
    };

    if (loading) return <div className="loading">Loading problem statements...</div>;
    if (error)   return <div className="error">{error}</div>;
    if (!data)   return <div className="no-data">No problem statements available</div>;

    // Group problem-statement analytics by domain
    const psByDomain = {};
    (data.analytics?.byProblemStatement || []).forEach(row => {
        if (!psByDomain[row.domain]) psByDomain[row.domain] = [];
        psByDomain[row.domain].push(row);
    });

    const totalPs = data.stats.total || 1; // avoid /0

    return (
        <div className="problem-statements-section">
            {/* Header */}
            <div className="section-header">
                <h1>Problem Statements</h1>
                <button className="download-btn" onClick={handleDownloadExcel} disabled={!data?.problemStatements?.length}>
                    <FaDownload /> Download Excel
                </button>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid" style={{ marginBottom: '20px' }}>
                {[
                    { label: 'Total Registered', value: data.stats.totalRegistered, color: '#014a01' },
                    { label: 'Submitted PS', value: data.stats.total, color: '#1890ff' },
                    { label: 'Not Yet Submitted', value: data.stats.notSubmitted, color: '#d4380d' },
                    { label: 'Unique Domains', value: data.stats.unique_domains, color: '#722ed1' },
                    { label: 'States Covered', value: data.stats.unique_states, color: '#08979c' },
                    { label: 'Districts Covered', value: data.stats.unique_districts, color: '#d48806' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
                        <h3>{label}</h3>
                        <p style={{ color, fontSize: '1.8rem', fontWeight: '800' }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {['table', 'analytics'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '8px 22px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer',
                            border: activeTab === tab ? '2px solid #014a01' : '2px solid #ccc',
                            background: activeTab === tab ? '#014a01' : '#fff',
                            color: activeTab === tab ? '#fff' : '#333',
                            textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'analytics' ? '📊 Analytics' : '📋 Student Table'}
                    </button>
                ))}
            </div>

            {/* ─── ANALYTICS TAB ─── */}
            {activeTab === 'analytics' && (
                <div>
                    <h2 style={{ marginBottom: '16px', color: '#014a01', fontWeight: '700' }}>Domain-wise Breakdown</h2>

                    {(data.analytics?.byDomain || []).map(row => {
                        const pct = Math.round((row.count / totalPs) * 100);
                        const isOpen = expandedDomain === row.domain;
                        return (
                            <div key={row.domain} style={{
                                background: '#fff', borderRadius: '10px', marginBottom: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden',
                                border: '1px solid #e8f5e9'
                            }}>
                                {/* Domain row */}
                                <div
                                    onClick={() => setExpandedDomain(isOpen ? null : row.domain)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        padding: '14px 20px', cursor: 'pointer',
                                        background: isOpen ? '#f0f7f0' : '#fff'
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontWeight: '700', color: '#014a01', fontSize: '0.98rem' }}>{row.domain}</span>
                                            <span style={{ fontWeight: '700', color: '#014a01', fontSize: '0.95rem' }}>
                                                {row.count} students ({pct}%)
                                            </span>
                                        </div>
                                        <div style={{ height: '8px', background: '#e8f5e9', borderRadius: '99px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: '#014a01', borderRadius: '99px', transition: 'width 0.5s' }} />
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '1rem', color: '#666' }}>{isOpen ? '▲' : '▼'}</span>
                                </div>

                                {/* Problem statements under this domain */}
                                {isOpen && psByDomain[row.domain] && (
                                    <div style={{ padding: '12px 20px 16px', background: '#fafff8', borderTop: '1px solid #e8f5e9' }}>
                                        <p style={{ fontWeight: '600', fontSize: '0.85rem', color: '#555', marginBottom: '10px', textTransform: 'uppercase' }}>
                                            Problem Statements selected:
                                        </p>
                                        {psByDomain[row.domain].map((ps, idx) => {
                                            const psPct = Math.round((ps.count / row.count) * 100);
                                            return (
                                                <div key={idx} style={{ marginBottom: '10px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '0.88rem', color: '#333', flex: 1, paddingRight: '16px' }}>{ps.problem_statement}</span>
                                                        <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#014a01', whiteSpace: 'nowrap' }}>
                                                            {ps.count} ({psPct}%)
                                                        </span>
                                                    </div>
                                                    <div style={{ height: '6px', background: '#e8f5e9', borderRadius: '99px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${psPct}%`, height: '100%', background: '#52c41a', borderRadius: '99px' }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── TABLE TAB ─── */}
            {activeTab === 'table' && (
                <>
                    {/* Filters */}
                    <div className="filters-section">
                        <div className="filter-group">
                            <label htmlFor="domain">Domain</label>
                            <select id="domain" value={filters.domain}
                                onChange={(e) => setFilters(prev => ({ ...prev, domain: e.target.value }))}>
                                <option value="">All Domains</option>
                                {data.filters.domains.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="state">State</label>
                            <select id="state" value={filters.state}
                                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}>
                                <option value="">All States</option>
                                {data.filters.states.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="district">District</label>
                            <select id="district" value={filters.district}
                                onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}>
                                <option value="">All Districts</option>
                                {data.filters.districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-container">
                        <table className="problem-statements-table">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Student Name</th>
                                    <th>Batch</th>
                                    <th>Slot</th>
                                    <th>Mode</th>
                                    <th>Domain</th>
                                    <th>Problem Statement</th>
                                    <th>Location</th>
                                    <th>District</th>
                                    <th>State</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.problemStatements.length === 0 ? (
                                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#999' }}>No problem statements found</td></tr>
                                ) : data.problemStatements.map((s) => (
                                    <tr key={s.id}>
                                        <td>{s.username}</td>
                                        <td>{s.student_name}</td>
                                        <td>{s.batch || 'N/A'}</td>
                                        <td>Slot {s.slot}</td>
                                        <td>{s.mode}</td>
                                        <td>{s.domain}</td>
                                        <td>{s.problem_statement}</td>
                                        <td>{s.location}</td>
                                        <td>{s.district}</td>
                                        <td>{s.state}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="pagination">
                            <button className="pagination-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={!data.pagination.hasPrevPage}>
                                <FaChevronLeft /> Previous
                            </button>
                            <span className="pagination-info">
                                Page {data.pagination.currentPage} of {data.pagination.totalPages}
                                <span className="pagination-total"> (Total: {data.pagination.totalItems})</span>
                            </span>
                            <button className="pagination-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={!data.pagination.hasNextPage}>
                                Next <FaChevronRight />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}