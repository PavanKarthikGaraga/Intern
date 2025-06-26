import { useState, useEffect } from 'react';
import { DOMAINS } from '@/app/Data/domains';
import { stateNames } from '@/app/Data/states';
import { districtNames } from '@/app/Data/districts';
import './ProblemStatement.css';

export default function ProblemStatement({ user }) {
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
    if (problemStatement.length > 50) {
      setError('Problem statement must be 50 characters or less.');
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
            <p>You have already submitted your problem statement in final Book in offline. Now make it concise to 50 letters and submit here.</p>
            {!fieldsVisible && <p>Loading fields in {timer} seconds...</p>}
          </div>
        )}
        {fieldsVisible && (
          <>
            <div className="form-group">
              <label>Problem Statement (max 50 chars)</label>
              <input
                type="text"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                maxLength={50}
                required
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