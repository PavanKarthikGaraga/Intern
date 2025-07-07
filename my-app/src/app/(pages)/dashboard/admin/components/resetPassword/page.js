'use client';
import { useState } from 'react';
import './page.css';
import { toast } from 'react-hot-toast';

export default function ResetPassword() {
    const [usernames, setUsernames] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleCopyPassword = () => {
        navigator.clipboard.writeText('sac@123');
        toast.success('Password copied to clipboard');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError(null);

        try {
            // Split usernames by newline and filter out empty lines
            const usernameList = usernames
                .split('\n')
                .map(username => username.trim())
                .filter(username => username !== '');

            // Validate username format (must start with 24 and be exactly 10 digits)
            const invalidUsernames = usernameList.filter(username => 
                !/^24\d{8}$/.test(username)
            );

            if (invalidUsernames.length > 0) {
                setError(`Invalid username format: ${invalidUsernames.join(', ')}. Usernames must start with 24 and be exactly 10 digits.`);
                setLoading(false);
                return;
            }

            const response = await fetch('/api/dashboard/admin/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ usernames: usernameList }),
            });

            const data = await response.json();
            
            if (data.success) {
                setSuccess(true);
                setUsernames('');
            } else {
                setError(data.error || 'Failed to reset passwords');
            }
        } catch (err) {
            setError('Failed to reset passwords');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-password-section">
            <div className="section-header">
                <h1>Reset Passwords</h1>
            </div>

            <div className="reset-password-container">
                <form onSubmit={handleSubmit}>
                    <div className="formgr">
                        <label htmlFor="usernames">Enter Usernames (one per line)</label>
                        <textarea
                            id="usernames"
                            value={usernames}
                            onChange={(e) => setUsernames(e.target.value)}
                            placeholder={`24xxxxxxxx\n24xxxxxxxx`}
                            required
                        />
                        <small className="help-text">
                            Enter usernames in format 24XXXXXXXX (must start with 24 and be exactly 10 digits)
                        </small>
                    </div>

                    <button 
                        type="submit" 
                        className="reset-btn"
                        disabled={loading}
                    >
                        {loading ? 'Resetting...' : 'Reset Passwords'}
                    </button>
                </form>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-container">
                        <div className="success-message">
                            Passwords have been reset successfully to
                        </div>
                        <div className="password-copy-container">
                            <div className="password-text">sac@123</div>
                            <button 
                                className="copy-btn"
                                onClick={handleCopyPassword}
                                title="Copy to clipboard"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 