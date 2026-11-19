'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import './page.css';

export default function TokenGenerator() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGenerateToken = async (e) => {
    e.preventDefault();
    if (!username) {
      toast.error('Please enter a username');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard/admin/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to generate token');
      }

      toast.success('Successfully logged in as ' + username);
      setIsRedirecting(true);

      // Full page load (not router.push): the app's auth state must start fresh with the
      // proxied user's session. A soft navigation kept the admin as the "current user"
      // for a moment, so the dashboard requested data with the wrong ID and showed
      // "Could not load your dashboard" until the page was refreshed.
      window.location.assign(data.redirectTo || `/dashboard/${data.user?.role || ''}`);
      return;
    } catch (error) {
      toast.error(error.message);
      setIsRedirecting(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="token-generator">
        <div className="loading-container">
          <h2>Setting up session...</h2>
          <div className="loading-spinner"></div>
          <p>Please wait while we log you in as {username}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="token-generator">
      <h2>Login as User</h2>
      <form onSubmit={handleGenerateToken}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login as User'}
        </button>
      </form>
    </div>
  );
} 