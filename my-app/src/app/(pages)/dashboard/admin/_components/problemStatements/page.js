'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { FaDownload, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './page.css';

export default function ProblemStatements() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [filters, setFilters] = useState({
        domain: '',
        state: '',
        district: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const fetchProblemStatements = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.domain) params.append('domain', filters.domain);
            if (filters.state) params.append('state', filters.state);
            if (filters.district) params.append('district', filters.district);
            params.append('page', currentPage);
            params.append('limit', itemsPerPage);

            const response = await fetch(`/api/dashboard/admin/problemStatements?${params.toString()}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch problem statements');
            }

            const result = await response.json();
            if (result.success) {
                setData(result.data);
            } else {
                throw new Error(result.error || 'Failed to fetch problem statements');
            }
        } catch (err) {
            console.error('Error fetching problem statements:', err);
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleDownloadExcel = async () => {
        try {
            // Fetch all data for Excel download
            const params = new URLSearchParams();
            if (filters.domain) params.append('domain', filters.domain);
            if (filters.state) params.append('state', filters.state);
            if (filters.district) params.append('district', filters.district);
            params.append('page', 1);
            params.append('limit', 1000); // Get all filtered data

            const response = await fetch(`/api/dashboard/admin/problemStatements?${params.toString()}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch data for download');
            }

            const result = await response.json();
            if (!result.success || !result.data.problemStatements?.length) {
                toast.error('No data available to download');
                return;
            }

            // Prepare data for Excel
            const excelData = result.data.problemStatements.map(statement => ({
                'Student Name': statement.student_name,
                'Domain': statement.domain,
                'Problem Statement': statement.problem_statement,
                'Location': statement.location,
                'District': statement.district,
                'State': statement.state,
                'Slot': `Slot ${statement.slot}`,
                'Mode': statement.mode
            }));

            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(excelData);

            // Add column widths
            const columnWidths = [
                { wch: 20 }, // Student Name
                { wch: 15 }, // Domain
                { wch: 40 }, // Problem Statement
                { wch: 20 }, // Location
                { wch: 15 }, // District
                { wch: 15 }, // State
                { wch: 8 },  // Slot
                { wch: 10 }  // Mode
            ];
            worksheet['!cols'] = columnWidths;

            // Add the worksheet to the workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Problem Statements');

            // Generate Excel file
            const fileName = `problem_statements_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            toast.success('Excel file downloaded successfully');
        } catch (err) {
            console.error('Error downloading Excel:', err);
            toast.error('Failed to download Excel file');
        }
    };

    useEffect(() => {
        if (user?.username) {
            fetchProblemStatements();
        }
    }, [user, filters, currentPage]);

    useEffect(() => {
        // Reset to first page when filters change
        setCurrentPage(1);
    }, [filters]);

    if (loading) {
        return <div className="loading">Loading problem statements...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!data) {
        return <div className="no-data">No problem statements available</div>;
    }

    return (
        <div className="problem-statements-section">
            <div className="section-header">
                <h1>Problem Statements Overview</h1>
                <button 
                    className="download-btn"
                    onClick={handleDownloadExcel}
                    disabled={!data?.problemStatements?.length}
                >
                    <FaDownload /> Download Excel
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Problem Statements</h3>
                    <p>{data.stats.total}</p>
                </div>
                <div className="stat-card">
                    <h3>Unique Domains</h3>
                    <p>{data.stats.unique_domains}</p>
                </div>
                <div className="stat-card">
                    <h3>States Covered</h3>
                    <p>{data.stats.unique_states}</p>
                </div>
                <div className="stat-card">
                    <h3>Districts Covered</h3>
                    <p>{data.stats.unique_districts}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filter-group">
                    <label htmlFor="domain">Domain</label>
                    <select
                        id="domain"
                        value={filters.domain}
                        onChange={(e) => setFilters(prev => ({ ...prev, domain: e.target.value }))}
                    >
                        <option value="">All Domains</option>
                        {data.filters.domains.map(domain => (
                            <option key={domain} value={domain}>{domain}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="state">State</label>
                    <select
                        id="state"
                        value={filters.state}
                        onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                    >
                        <option value="">All States</option>
                        {data.filters.states.map(state => (
                            <option key={state} value={state}>{state}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="district">District</label>
                    <select
                        id="district"
                        value={filters.district}
                        onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
                    >
                        <option value="">All Districts</option>
                        {data.filters.districts.map(district => (
                            <option key={district} value={district}>{district}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Problem Statements Table */}
            <div className="table-container">
                <table className="problem-statements-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Domain</th>
                            <th>Problem Statement</th>
                            <th>Location</th>
                            <th>District</th>
                            <th>State</th>
                            <th>Slot</th>
                            <th>Mode</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.problemStatements.map((statement) => (
                            <tr key={statement.id}>
                                <td>{statement.student_name}</td>
                                <td>{statement.domain}</td>
                                <td>{statement.problem_statement}</td>
                                <td>{statement.location}</td>
                                <td>{statement.district}</td>
                                <td>{statement.state}</td>
                                <td>Slot {statement.slot}</td>
                                <td>{statement.mode}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="pagination">
                    <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!data.pagination.hasPrevPage}
                    >
                        <FaChevronLeft /> Previous
                    </button>
                    <span className="pagination-info">
                        Page {data.pagination.currentPage} of {data.pagination.totalPages}
                        <span className="pagination-total">
                            (Total: {data.pagination.totalItems})
                        </span>
                    </span>
                    <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!data.pagination.hasNextPage}
                    >
                        Next <FaChevronRight />
                    </button>
                </div>
            </div>
        </div>
    );
} 