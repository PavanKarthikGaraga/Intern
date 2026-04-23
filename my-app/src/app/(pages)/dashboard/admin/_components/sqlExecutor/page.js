'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import './page.css';
import * as ExcelJS from 'exceljs';

export default function SQLExecutor() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);

  const handleExecuteQuery = async (e, page = 1) => {
    e.preventDefault();
    if (!query) {
      toast.error('Please enter a SQL query');
      return;
    }

    setIsLoading(true);
    setResults(null);
    setPagination(null);
    setCurrentPage(page);

    try {
      const response = await fetch('/api/dashboard/admin/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, page, limit }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute query');
      }

      setResults(data.results);
      setPagination(data.pagination);
      toast.success(data.message);
      
      // Only clear the input if it's not a SELECT query
      if (!query.trim().toLowerCase().startsWith('select')) {
        setQuery('');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    handleExecuteQuery(new Event('submit'), newPage);
  };

  // Utility to convert results to CSV
  const convertToCSV = (data) => {
    if (!Array.isArray(data) || data.length === 0) return '';
    const columns = Object.keys(data[0]);
    const header = columns.join(',');
    const rows = data.map(row => columns.map(col => JSON.stringify(row[col] ?? '')).join(','));
    return [header, ...rows].join('\n');
  };

  // Download as CSV
  const handleDownloadCSV = async () => {
    if (!query.trim().toLowerCase().startsWith('select')) return;
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard/admin/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, downloadAll: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to download CSV');
      if (!Array.isArray(data.results) || data.results.length === 0) return;
      const csv = convertToCSV(data.results);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'query_results.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Download as Excel
  const handleDownloadExcel = async () => {
    if (!query.trim().toLowerCase().startsWith('select')) return;
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard/admin/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, downloadAll: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to download Excel');
      if (!Array.isArray(data.results) || data.results.length === 0) return;
      
      // Create workbook and worksheet using ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Results');
      
      // Add headers
      if (data.results.length > 0) {
        const headers = Object.keys(data.results[0]);
        worksheet.addRow(headers);
        
        // Add data rows
        data.results.forEach(row => {
          const rowData = headers.map(header => row[header]);
          worksheet.addRow(rowData);
        });
      }
      
      // Generate and download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'query_results.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPagination = () => {
    if (!pagination) return null;

    const { page, totalPages } = pagination;
    const pages = [];
    const maxVisiblePages = 5;

    // Calculate range of pages to show
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(
        <button key="first" onClick={() => handlePageChange(1)} className="pagination-btn">
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${i === page ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
      }
      pages.push(
        <button key="last" onClick={() => handlePageChange(totalPages)} className="pagination-btn">
          {totalPages}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="pagination-btn"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="pagination-btn"
        >
          Next
        </button>
        <span className="pagination-info">
          Page {page} of {totalPages} ({pagination.total} total rows)
        </span>
      </div>
    );
  };

  const renderResults = () => {
    if (!results) return null;

    if (Array.isArray(results)) {
      if (results.length === 0) {
        return <div className="no-results">No results found</div>;
      }

      const columns = Object.keys(results[0]);
      
      return (
        <div className="results-container">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <button className="download-btn" onClick={handleDownloadCSV}>Download CSV</button>
            <button className="download-btn" onClick={handleDownloadExcel}>Download Excel</button>
          </div>
          <table className="results-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td key={`${rowIndex}-${column}`}>
                      {row[column] === null ? 'NULL' : String(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {renderPagination()}
        </div>
      );
    }

    // Handle non-SELECT query results (INSERT, UPDATE, DELETE)
    if (typeof results === 'object' && results !== null) {
      if (results.affectedRows !== undefined) {
        return (
          <div className="results-message">
            <div className="query-result">
              <div className="result-header">Query Result:</div>
              <div className="result-details">
                <div className="result-row">
                  <span className="result-label">Affected Rows:</span>
                  <span className="result-value">{results.affectedRows}</span>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }

    // Fallback for any other type of result
    return <div className="results-message">{String(results)}</div>;
  };

  return (
    <div className="sql-executor">
      <h2>SQL Query Executor</h2>
      <form onSubmit={handleExecuteQuery}>
        <div className="formgroup">
          <label htmlFor="query">SQL Query:</label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            required
            rows="10"
          />
        </div>
        <button type="submit" className="execute-btn" disabled={isLoading}>
          {isLoading ? 'Executing...' : 'Execute Query'}
        </button>
      </form>
      {renderResults()}
    </div>
  );
} 