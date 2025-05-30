'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import './page.css';

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
        <div className="form-group">
          <label htmlFor="query">SQL Query:</label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            required
            rows="6"
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