"use client"
import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setIsPasswordLoading(true);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      setIsPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      setIsPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="change-password-section">
      <div className="section-header">
        <h2>Change Password</h2>
      </div>
      <div className="change-password-form">
        <form onSubmit={handlePasswordChange}>
          {passwordError && (
            <div className="error-message">{passwordError}</div>
          )}
          
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type={showPasswords.current ? "text" : "password"}
              id="currentPassword"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                currentPassword: e.target.value
              })}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('current')}
              aria-label={showPasswords.current ? "Hide password" : "Show password"}
            >
              {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type={showPasswords.new ? "text" : "password"}
              id="newPassword"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                newPassword: e.target.value
              })}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('new')}
              aria-label={showPasswords.new ? "Hide password" : "Show password"}
            >
              {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type={showPasswords.confirm ? "text" : "password"}
              id="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({
                ...passwordForm,
                confirmPassword: e.target.value
              })}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('confirm')}
              aria-label={showPasswords.confirm ? "Hide password" : "Show password"}
            >
              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="button-group">
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isPasswordLoading}
            >
              {isPasswordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}