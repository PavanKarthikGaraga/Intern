'use client'
import { useState, useEffect } from 'react';
import { stateNames } from '@/app/Data/states';
import { districtNames } from '@/app/Data/districts';
import { PROBLEM_STATEMENTS } from '@/app/Data/problemStatements';
import './ProblemStatement.css';

export default function ProblemStatement({ user, studentData }) {
  // Lock domain to the student's registered domain
  const registeredDomain = studentData?.selectedDomain || '';
  const existingData = studentData?.problemStatementData;

  const [isEditing, setIsEditing] = useState(!existingData);
  const [problemStatement, setProblemStatement] = useState('');
  const [location, setLocation] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [districtOptions, setDistrictOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const availableStatements = PROBLEM_STATEMENTS[registeredDomain] || [];

  useEffect(() => {
    if (state && districtNames[state]) {
      setDistrictOptions(districtNames[state]);
    } else {
      setDistrictOptions([]);
      setDistrict('');
    }
  }, [state]);

  // Pre-fill when entering edit mode
  useEffect(() => {
    if (isEditing && existingData) {
      setProblemStatement(existingData.problem_statement || '');
      setLocation(existingData.location || '');
      setState(existingData.state || '');
      setDistrict(existingData.district || '');
    } else if (!existingData) {
      // Fresh submission — pre-fill location from registration data
      setState(studentData?.state || '');
      setDistrict(studentData?.district || '');
    }
  }, [isEditing, existingData, studentData?.state, studentData?.district]);

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!problemStatement) {
      setError('Please select a problem statement.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/dashboard/student/problem-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          domain: registeredDomain,
          problem_statement: problemStatement,
          location,
          district,
          state
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(existingData ? 'Problem statement updated successfully!' : 'Problem statement submitted successfully!');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(data.error || 'Submission failed.');
      }
    } catch (err) {
      setError('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // View mode — show existing submitted data
  if (existingData && !isEditing) {
    return (
      <div className="problem-statement-box">
        <h2>Problem Statement</h2>
        <div className="submitted-problem-statement">
          <p><strong>Domain:</strong> {existingData.domain}</p>
          <p><strong>Problem Statement:</strong> {existingData.problem_statement}</p>
          <p><strong>Location:</strong> {existingData.location}</p>
          <p><strong>State:</strong> {existingData.state}</p>
          <p><strong>District:</strong> {existingData.district}</p>
        </div>
        <div className="success-message" style={{ marginBottom: '1rem' }}>
          ✅ Problem statement submitted.
        </div>
        <button
          onClick={() => setIsEditing(true)}
          style={{
            padding: '8px 20px', background: '#014a01', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
          }}
        >
          ✏️ Update Problem Statement
        </button>
      </div>
    );
  }

  return (
    <div className="problem-statement-box">
      <h2>{existingData ? 'Update Problem Statement' : 'Submit Problem Statement'}</h2>

      {!registeredDomain && (
        <div className="note-box" style={{ color: '#970003', fontWeight: '600' }}>
          ⚠️ No domain found in your registration. Please contact admin.
        </div>
      )}

      {registeredDomain && (
        <form onSubmit={handleSubmit}>
          {/* Domain — read-only */}
          <div className="form-group">
            <label>Domain</label>
            <input
              type="text"
              value={registeredDomain}
              readOnly
              style={{ background: '#f0f4f0', cursor: 'not-allowed', fontWeight: '600' }}
            />
          </div>

          {/* Problem Statement Dropdown */}
          <div className="form-group">
            <label>Problem Statement *</label>
            {availableStatements.length > 0 ? (
              <select
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                required
              >
                <option value="">Select Problem Statement</option>
                {availableStatements.map((stmt, idx) => (
                  <option key={idx} value={stmt}>{stmt}</option>
                ))}
              </select>
            ) : (
              <p style={{ color: '#888', fontSize: '0.9rem' }}>
                No predefined statements for your domain. Please contact admin.
              </p>
            )}
          </div>

          {/* Location */}
          <div className="form-group">
            <label>Location (Village / Area Name) *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Gannavaram Village"
              required
            />
          </div>

          {/* State */}
          <div className="form-group">
            <label>State *</label>
            <select value={state} onChange={(e) => setState(e.target.value)} required>
              <option value="">Select State</option>
              {stateNames.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District */}
          <div className="form-group">
            <label>District *</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              required
              disabled={!state}
            >
              <option value="">{state ? 'Select District' : 'Select State first'}</option>
              {districtOptions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" disabled={loading || availableStatements.length === 0}>
              {loading ? 'Saving...' : existingData ? 'Update' : 'Submit'}
            </button>
            {existingData && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: '#888', color: '#fff', border: 'none',
                  padding: '8px 18px', borderRadius: '6px', cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>

          {error && <div className="error-message" style={{ marginTop: '12px' }}>{error}</div>}
          {success && <div className="success-message" style={{ marginTop: '12px' }}>{success}</div>}
        </form>
      )}
    </div>
  );
}