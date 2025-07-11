'use client'
import { useState, useEffect } from 'react';
import { DOMAINS } from '@/app/Data/domains';
import { stateNames } from '@/app/Data/states';
import { districtNames } from '@/app/Data/districts';
import './ProblemStatement.css';

export default function ProblemStatement({ user, studentData }) {
  const [domain, setDomain] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [timer, setTimer] = useState(5);
  const [fieldsVisible, setFieldsVisible] = useState(false);
  const [problemStatement, setProblemStatement] = useState('');
  const [location, setLocation] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [districtOptions, setDistrictOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (state && districtNames[state]) {
      setDistrictOptions(districtNames[state]);
    } else {
      setDistrictOptions([]);
    }
  }, [state]);

  useEffect(() => {
    if (showNote && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (showNote && timer === 0) {
      setFieldsVisible(true);
    }
  }, [showNote, timer]);

  const handleDomainChange = (e) => {
    setDomain(e.target.value);
    setShowNote(true);
    setTimer(5);
    setFieldsVisible(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    if (problemStatement.length > 100) {
      setError('Problem statement must be 100 characters or less.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/dashboard/student/problem-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          domain,
          problem_statement: problemStatement,
          location,
          district,
          state
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Problem statement submitted successfully!');
        setProblemStatement('');
        setLocation('');
        setState('');
        setDistrict('');
        setDomain('');
        setShowNote(false);
        setFieldsVisible(false);
      } else {
        setError(data.error || 'Submission failed.');
      }
    } catch (err) {
      setError('Submission failed.');
    } finally {
      setLoading(false);
    }
  };

  // If already submitted, show message and data
  if (studentData?.problemStatementData) {
    const ps = studentData.problemStatementData;
    return (
      <div className="problem-statement-box">
        <h2>Problem Statement Already Submitted</h2>
        <div className="submitted-problem-statement">
          <p><strong>Domain:</strong> {ps.domain}</p>
          <p><strong>Problem Statement:</strong> {ps.problem_statement}</p>
          <p><strong>Location:</strong> {ps.location}</p>
          <p><strong>State:</strong> {ps.state}</p>
          <p><strong>District:</strong> {ps.district}</p>
        </div>
        <div className="success-message">You have already submitted your problem statement.</div>
      </div>
    );
  }

  return (
    <div className="problem-statement-box">
      <h2>Submit Problem Statement</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Domain</label>
          <select value={domain} onChange={handleDomainChange} required>
            <option value="">Select Domain</option>
            {DOMAINS.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
        {showNote && (
          <div className="note-box">
            <p>You have already submitted your problem statement in final Book in offline. Now make it concise to 100 letters and submit here.</p>
            {!fieldsVisible && <p>Loading fields in {timer} seconds...</p>}
          </div>
        )}
        {fieldsVisible && (
          <>
            <div className="form-group">
              <label>Problem Statement (max 100 chars)</label>
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                maxLength={100}
                required
                className="problem-statement-textarea"
                rows={3}
                cols={50}
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <select value={state} onChange={(e) => setState(e.target.value)} required>
                <option value="">Select State</option>
                {stateNames.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>District</label>
              <select value={district} onChange={(e) => setDistrict(e.target.value)} required>
                <option value="">Select District</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
          </>
        )}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </form>
    </div>
  );
} 