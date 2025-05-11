'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import './page.css';

export default function SQLExecutor() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleExecuteQuery = async (e) => {
    e.preventDefault();
    if (!query) {
      toast.error('Please enter a SQL query');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard/admin/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute query');
      }

      toast.success('Query executed successfully');
      setQuery(''); // Clear the input after successful execution
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
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
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Executing...' : 'Execute Query'}
        </button>
      </form>
    </div>
  );
} 