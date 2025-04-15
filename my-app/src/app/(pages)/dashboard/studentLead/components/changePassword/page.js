'use client';
import { useState } from 'react';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/dashboard/studentLead/changePassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Password changed successfully');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.message || 'Failed to change password');
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-section">
      <h2>Change Password</h2>
      
      <form onSubmit={handleSubmit} className="change-password-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="currentPassword">
            Current Password <span className="required">*</span>
          </label>
          <div className="password-field">
            <input
              type={showPasswords.current ? "text" : "password"}
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('current')}
            >
              {showPasswords.current ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">
            New Password <span className="required">*</span>
          </label>
          <div className="password-field">
            <input
              type={showPasswords.new ? "text" : "password"}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('new')}
            >
              {showPasswords.new ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">
            Confirm New Password <span className="required">*</span>
          </label>
          <div className="password-field">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => togglePasswordVisibility('confirm')}
            >
              {showPasswords.confirm ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </button>
          </div>
        </div>

        <div className="button-group">
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
} 