'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import './page.css';

export default function TokenGenerator() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate token');
      }

      toast.success('Successfully logged in as ' + username);
      
      // Set redirecting state
      setIsRedirecting(true);
      
      // Wait for 2 seconds to ensure cookies are set
      
      let wait = await new Promise(resolve => setTimeout(resolve, 2000));
      // Redirect based on role
      const role = data.user.role;
      switch(role) {

        case 'student':
            wait;
          router.push('/dashboard/student');
          break;
        case 'studentLead':
          wait;
          router.push('/dashboard/studentLead');
          break;
        case 'facultyMentor':
          wait;
          router.push('/dashboard/facultyMentor');
          break;
        case 'admin':
          wait;
          router.push('/dashboard/admin');
          break;
        default:
          router.push('/auth/login');
      }
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