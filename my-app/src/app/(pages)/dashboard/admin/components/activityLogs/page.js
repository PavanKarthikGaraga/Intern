'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import './page.css';

const ACTION_COLORS = {
  ADMIN_DELETE_STUDENT: 'red',
  LEAD_REJECT_REPORT: 'red',
  MENTOR_REJECT_REPORT: 'red',
  AUTH_LOGIN_FAILED: 'red',
  LEAD_VERIFY_REPORT: 'green',
  MENTOR_VERIFY_REPORT: 'green',
  STUDENT_REGISTER: 'green',
  AUTH_LOGIN: 'blue',
  MENTOR_EVALUATE_REPORT: 'blue',
  ADMIN_PROXY_LOGIN: 'orange',
  ADMIN_RESET_PASSWORD: 'yellow',
  ADMIN_REPORT_CONTROL: 'yellow',
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionTypes, setActionTypes] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      if (filters.action) params.append('action', filters.action);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/dashboard/admin/activityLogs?${params.toString()}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }

      const data = await response.json();
      if (data.success) {
        setLogs(data.data.logs);
        setActionTypes(data.data.actionTypes);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    fetchLogs(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearFilters = () => {
    setFilters({ action: '', search: '', startDate: '', endDate: '' });
    setTimeout(() => fetchLogs(1), 0);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const parseDetails = (details) => {
    if (!details) return null;
    try {
      return typeof details === 'string' ? JSON.parse(details) : details;
    } catch {
      return details;
    }
  };

  const renderDetails = (details) => {
    const parsed = parseDetails(details);
    if (!parsed) return '-';
    if (typeof parsed === 'string') return parsed;
    return Object.entries(parsed)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
  };

  if (loading && logs.length === 0) {
    return <div className="activity-logs-section"><div className="loading">Loading activity logs...</div></div>;
  }

  return (
    <div className="activity-logs-section">
      <div className="section-header">
        <h1>Activity Log</h1>
        <div className="total-count">Total: {pagination.totalItems} logs</div>
      </div>

      <div className="filters-row">
        <select
          value={filters.action}
          onChange={(e) => handleFilterChange('action', e.target.value)}
          className="filter-select"
        >
          <option value="">All Actions</option>
          {actionTypes.map(type => (
            <option key={type} value={type}>{formatAction(type)}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search by username or name..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          onKeyDown={handleKeyDown}
          className="filter-input"
        />

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          className="filter-date"
        />
        <span className="date-separator">to</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          className="filter-date"
        />

        <button className="search-btn" onClick={handleSearch}>Search</button>
        <button className="clear-btn" onClick={handleClearFilters}>Clear</button>
      </div>

      <div className="table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date / Time</th>
              <th>Actor</th>
              <th>Role</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="7" className="no-data">No activity logs found</td></tr>
            ) : (
              logs.map((log, index) => (
                <tr key={log.id}>
                  <td>{(pagination.currentPage - 1) * 30 + index + 1}</td>
                  <td className="date-cell">{formatDate(log.createdAt)}</td>
                  <td>
                    <div className="actor-info">
                      <span className="actor-name">{log.actorName || '-'}</span>
                      {log.actorUsername && <small className="actor-id">{log.actorUsername}</small>}
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${log.actorRole || ''}`}>
                      {log.actorRole || '-'}
                    </span>
                  </td>
                  <td>
                    <span className={`action-badge ${ACTION_COLORS[log.action] || 'default'}`}>
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td>{log.targetUsername || '-'}</td>
                  <td className="details-cell">
                    {log.details ? (
                      <span
                        className="details-text"
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                        title="Click to expand"
                      >
                        {expandedRow === log.id
                          ? renderDetails(log.details)
                          : renderDetails(log.details).substring(0, 50) + (renderDetails(log.details).length > 50 ? '...' : '')}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={pagination.currentPage <= 1}
            onClick={() => fetchLogs(pagination.currentPage - 1)}
          >
            Previous
          </button>
          <span className="page-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            className="page-btn"
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => fetchLogs(pagination.currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
