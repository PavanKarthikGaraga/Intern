'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  FaSearch, FaClipboardList, FaCheck, FaTimes, FaChevronDown,
  FaChevronUp, FaEdit, FaSave, FaExclamationTriangle, FaCheckCircle,
  FaStar, FaUserGraduate,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import './page.css';

const SLOT_LABELS = {
  1: 'Slot 1 — May 11–17',
  2: 'Slot 2 — May 18–24',
  3: 'Slot 3 — May 25–31',
  4: 'Slot 4 — Jun 1–7',
  5: 'Slot 5 — Jun 8–14',
  6: 'Slot 6 — Jun 15–21',
  7: 'Slot 7 — Jun 22–28',
  8: 'Slot 8 — Jun 29–Jul 5',
  9: 'Slot 9 — Jul 6–12',
};

const DAY_LABELS = {
  1: 'Day 1 — Problem Understanding (10 marks)',
  2: 'Day 2 — Survey Execution / S1 (5 marks)',
  3: 'Day 3 — Survey Execution / S2 (5 marks)',
  4: 'Day 4 — Survey Execution / S3 (5 marks)',
  5: 'Day 5 — Data Analysis (15 marks)',
  6: 'Day 6 — Intervention Activity (20 marks)',
  7: 'Day 7 — Case Study & Presentation (40 marks)',
};

/* ── Utility: word-count a text ── */
function wc(text) { return (text || '').trim().split(/\s+/).filter(Boolean).length; }

/* ── Renders key Day 1 fields ── */
function Day1Preview({ data }) {
  if (!data) return <p className="ev-no-data">No task data available.</p>;
  return (
    <div className="ev-task-preview">
      <div className="ev-field">
        <span className="ev-field-label">Understanding ({wc(data.inference)} words)</span>
        <div className="ev-field-value ev-scrollable">{data.inference || <em>Not provided</em>}</div>
      </div>
      {data.linkedinUrl && (
        <div className="ev-field">
          <span className="ev-field-label">LinkedIn</span>
          <a href={data.linkedinUrl} target="_blank" rel="noopener noreferrer" className="ev-link">
            {data.linkedinUrl}
          </a>
        </div>
      )}
      {data.youtubeUrl && (
        <div className="ev-field">
          <span className="ev-field-label">YouTube</span>
          <a href={data.youtubeUrl} target="_blank" rel="noopener noreferrer" className="ev-link">
            {data.youtubeUrl}
          </a>
        </div>
      )}
    </div>
  );
}

/* ── Renders survey days 2/3/4 ── */
function SurveyDayPreview({ data, day }) {
  if (!data) return <p className="ev-no-data">No task data available.</p>;
  const persons = [];
  const pCount = data.personCount || 3;
  for (let i = 1; i <= pCount; i++) {
    const p = data[`p${i}`];
    if (p) persons.push({ num: i, ...p });
  }
  return (
    <div className="ev-task-preview">
      {data.driveLink && (
        <div className="ev-field">
          <span className="ev-field-label">Google Drive Report</span>
          <a href={data.driveLink} target="_blank" rel="noopener noreferrer" className="ev-link">{data.driveLink}</a>
        </div>
      )}
      <div className="ev-field">
        <span className="ev-field-label">Persons Surveyed ({persons.length})</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
          {persons.map(p => (
            <span key={p.num} className="ev-person-chip">
              {p.name || `Person ${p.num}`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Day 5 preview ── */
function Day5Preview({ data }) {
  if (!data) return <p className="ev-no-data">No task data available.</p>;
  return (
    <div className="ev-task-preview">
      {[2, 3, 4].map(d => (
        <div key={d} className="ev-field">
          <span className="ev-field-label">Day {d} Analysis Summary ({wc(data[`day${d}_topProblems`])} + {wc(data[`day${d}_rootCauses`])} + {wc(data[`day${d}_recommendations`])} words)</span>
          <div className="ev-field-value ev-scrollable" style={{ maxHeight: 80 }}>
            {data[`day${d}_topProblems`]?.slice(0, 200) || <em>Not provided</em>}…
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Day 6 preview ── */
function Day6Preview({ data }) {
  if (!data) return <p className="ev-no-data">No task data available.</p>;
  return (
    <div className="ev-task-preview">
      <div className="ev-field">
        <span className="ev-field-label">Activity</span>
        <div className="ev-field-value">{data.activityTitle || <em>Not set</em>}</div>
      </div>
      {data.driveLink && (
        <div className="ev-field">
          <span className="ev-field-label">Drive Report</span>
          <a href={data.driveLink} target="_blank" rel="noopener noreferrer" className="ev-link">{data.driveLink}</a>
        </div>
      )}
      <div className="ev-field">
        <span className="ev-field-label">Cover Description ({wc(data.coverDesc)} words)</span>
        <div className="ev-field-value ev-scrollable">{data.coverDesc?.slice(0, 300) || <em>Not provided</em>}</div>
      </div>
    </div>
  );
}

/* ── Day 7 preview ── */
function Day7Preview({ data }) {
  if (!data) return <p className="ev-no-data">No task data available.</p>;
  return (
    <div className="ev-task-preview">
      {data.youtubeUrl && (
        <div className="ev-field">
          <span className="ev-field-label">YouTube Presentation</span>
          <a href={data.youtubeUrl} target="_blank" rel="noopener noreferrer" className="ev-link">{data.youtubeUrl}</a>
        </div>
      )}
      {data.linkedinPost && (
        <div className="ev-field">
          <span className="ev-field-label">LinkedIn Article</span>
          <a href={data.linkedinPost} target="_blank" rel="noopener noreferrer" className="ev-link">{data.linkedinPost}</a>
        </div>
      )}
      {data.driveLink && (
        <div className="ev-field">
          <span className="ev-field-label">Case Study Report</span>
          <a href={data.driveLink} target="_blank" rel="noopener noreferrer" className="ev-link">{data.driveLink}</a>
        </div>
      )}
    </div>
  );
}

function TaskPreview({ day, data }) {
  if (day === 1) return <Day1Preview data={data} />;
  if (day === 2 || day === 3 || day === 4) return <SurveyDayPreview data={data} day={day} />;
  if (day === 5) return <Day5Preview data={data} />;
  if (day === 6) return <Day6Preview data={data} />;
  if (day === 7) return <Day7Preview data={data} />;
  return null;
}

/* ── Single student evaluation row ── */
function EvalRow({ student, day, maxMarks, onSave }) {
  const [expanded, setExpanded] = useState(false);
  const [editMark, setEditMark] = useState(String(student.dayMark ?? 0));
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(student.evaluated);

  // Validate: numeric, 0–maxMarks, max 1 decimal place
  const numVal  = parseFloat(editMark);
  const isValid =
    editMark !== '' &&
    !isNaN(numVal) &&
    numVal >= 0 &&
    numVal <= maxMarks &&
    /^\d+(\.\d)?$/.test(editMark); // 0–1 decimal only

  const handleChange = (e) => {
    let raw = e.target.value;

    // Strip any character that isn't a digit or single dot
    raw = raw.replace(/[^0-9.]/g, '');

    // Allow only one decimal point
    const parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');

    // Allow at most 1 decimal digit
    if (parts[1]?.length > 1) raw = parts[0] + '.' + parts[1][0];

    // Don't allow value > maxMarks (clamp silently)
    if (raw !== '' && parseFloat(raw) > maxMarks) raw = String(maxMarks);

    setEditMark(raw);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.error(`Enter a value between 0 and ${maxMarks} (max 1 decimal place)`);
      return;
    }
    setSaving(true);
    const ok = await onSave(student.username, numVal);
    setSaving(false);
    if (ok) setSaved(true);
  };

  const pct      = maxMarks > 0 ? Math.round((Math.min(numVal || 0, maxMarks) / maxMarks) * 100) : 0;
  const barColor = pct >= 80 ? '#014a01' : pct >= 50 ? '#e65100' : '#c62828';
  const inputErr = editMark !== '' && !isValid;

  return (
    <div className={`ev-row ${saved ? 'ev-row-done' : ''}`}>
      <div className="ev-row-header" onClick={() => setExpanded(e => !e)}>
        <div className="ev-row-left">
          <div className="ev-avatar">{student.name?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <div className="ev-student-name">{student.name}</div>
            <div className="ev-student-meta">{student.username} · {student.selectedDomain}</div>
          </div>
        </div>
        <div className="ev-row-right">
          {saved && <span className="ev-done-badge"><FaCheckCircle /> Evaluated</span>}
          <div className="ev-marks-group" onClick={e => e.stopPropagation()}>
            <div className="ev-input-wrap" title={inputErr ? `Must be 0 – ${maxMarks}, max 1 decimal` : ''}>
              <input
                type="text"
                inputMode="decimal"
                className={`ev-marks-input ${inputErr ? 'ev-input-error' : ''}`}
                value={editMark}
                onChange={handleChange}
                placeholder="0"
              />
              {inputErr && <span className="ev-input-err-icon" title={`Must be 0 – ${maxMarks}`}>!</span>}
            </div>
            <span className="ev-marks-max">/ {maxMarks}</span>
            <button className="ev-save-btn" onClick={handleSave} disabled={saving || !isValid}>
              {saving ? <span className="ev-spinner" /> : <FaSave />}
            </button>
          </div>
          <button className="ev-expand-btn">
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      {/* Validation error message */}
      {inputErr && (
        <div className="ev-err-msg">
          ⚠ Value must be between 0 and {maxMarks} with at most 1 decimal place (e.g. 7.5)
        </div>
      )}

      {/* Progress bar */}
      <div className="ev-progress-bar-wrap">
        <div className="ev-progress-bar" style={{ width: `${pct}%`, background: barColor }} />
      </div>

      {/* Submission time */}
      {student.submittedAt && (
        <div className="ev-submitted-at">
          Submitted: {new Date(student.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
      )}

      {/* Expanded task preview */}
      {expanded && (
        <div className="ev-task-body">
          <TaskPreview day={day} data={student.taskData} />
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function Evaluate() {
  const [slot, setSlot]       = useState('');
  const [day, setDay]         = useState('');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');
  const [tab, setTab]         = useState('submitted');  // 'submitted' | 'not_submitted'
  const [subTab, setSubTab]   = useState('pending_eval'); // 'pending_eval' | 'evaluated'

  const fetchData = useCallback(async () => {
    if (!slot || !day) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/dashboard/admin/evaluate?slot=${slot}&day=${day}`);
      const json = await res.json();
      if (json.success) setData(json);
      else toast.error(json.error || 'Failed to load');
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }, [slot, day]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (username, marks) => {
    try {
      const res  = await fetch('/api/dashboard/admin/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, day: Number(day), marks }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`✓ Saved ${marks}/${data?.maxMarks} for ${username}`);
        // Optimistically update local data
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            submitted: prev.submitted.map(s =>
              s.username === username
                ? { ...s, dayMark: marks, evaluated: true }
                : s
            ),
          };
        });
        return true;
      } else {
        toast.error(json.error || 'Save failed');
        return false;
      }
    } catch {
      toast.error('Network error');
      return false;
    }
  };

  const filterStudents = (list) =>
    (list || []).filter(s =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.username?.includes(search)
    );

  const allSubmitted  = filterStudents(data?.submitted);
  const evalDone      = allSubmitted.filter(s => s.evaluated);
  const evalPending   = allSubmitted.filter(s => !s.evaluated);
  const notSubmitted  = filterStudents(data?.notSubmitted);

  return (
    <div className="ev-wrap">
      {/* ── Header ── */}
      <div className="ev-header">
        <div>
          <h1 className="ev-title"><FaStar /> Evaluate Students</h1>
          <p className="ev-subtitle">Select a slot and day to view and grade student task submissions.</p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="ev-filter-bar">
        <div className="ev-filter-group">
          <label>Slot</label>
          <select value={slot} onChange={e => { setSlot(e.target.value); setData(null); }}>
            <option value="">— Select Slot —</option>
            {Object.entries(SLOT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="ev-filter-group">
          <label>Day</label>
          <select value={day} onChange={e => { setDay(e.target.value); setData(null); }} disabled={!slot}>
            <option value="">— Select Day —</option>
            {Object.entries(DAY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="ev-filter-group" style={{ flex: 2 }}>
          <label>Search</label>
          <div className="ev-search-wrap">
            <FaSearch className="ev-search-icon" />
            <input
              type="text"
              placeholder="Name or Student ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="ev-search-input"
            />
          </div>
        </div>
      </div>

      {/* ── No selection ── */}
      {!slot || !day ? (
        <div className="ev-empty">
          <FaClipboardList />
          <h3>Select a slot and day to start evaluating</h3>
        </div>
      ) : loading ? (
        <div className="ev-loading"><div className="ev-spinner-lg" /> Loading students…</div>
      ) : data ? (
        <>
          {/* ── Stats row (clickable) ── */}
          <div className="ev-stats-row">
            <div
              className={`ev-stat-card ev-stat-blue ev-stat-click ${tab === 'submitted' ? 'ev-stat-active' : ''}`}
              onClick={() => { setTab('submitted'); }}
            >
              <div className="ev-stat-num">{allSubmitted.length}</div>
              <div className="ev-stat-lbl">Submitted</div>
            </div>
            <div
              className={`ev-stat-card ev-stat-green ev-stat-click ${tab === 'submitted' && subTab === 'evaluated' ? 'ev-stat-active' : ''}`}
              onClick={() => { setTab('submitted'); setSubTab('evaluated'); }}
            >
              <div className="ev-stat-num">{evalDone.length}</div>
              <div className="ev-stat-lbl">Evaluated</div>
            </div>
            <div
              className={`ev-stat-card ev-stat-orange ev-stat-click ${tab === 'submitted' && subTab === 'pending_eval' ? 'ev-stat-active' : ''}`}
              onClick={() => { setTab('submitted'); setSubTab('pending_eval'); }}
            >
              <div className="ev-stat-num">{evalPending.length}</div>
              <div className="ev-stat-lbl">Pending Evaluation</div>
            </div>
            <div
              className={`ev-stat-card ev-stat-red ev-stat-click ${tab === 'not_submitted' ? 'ev-stat-active' : ''}`}
              onClick={() => setTab('not_submitted')}
            >
              <div className="ev-stat-num">{notSubmitted.length}</div>
              <div className="ev-stat-lbl">Not Submitted</div>
            </div>
            <div className="ev-stat-card ev-stat-info">
              <div className="ev-stat-num">{data.maxMarks}</div>
              <div className="ev-stat-lbl">Max Marks</div>
            </div>
          </div>

          {/* ── Main tabs ── */}
          <div className="ev-tabs">
            <button
              className={`ev-tab ${tab === 'submitted' ? 'active' : ''}`}
              onClick={() => setTab('submitted')}
            >
              <FaCheck /> Submitted ({allSubmitted.length})
            </button>
            <button
              className={`ev-tab ${tab === 'not_submitted' ? 'active' : ''}`}
              onClick={() => setTab('not_submitted')}
            >
              <FaTimes /> Not Submitted ({notSubmitted.length})
            </button>
          </div>

          {/* ── Submitted section ── */}
          {tab === 'submitted' && (
            <>
              {/* Sub-tabs: Pending Eval / Evaluated */}
              <div className="ev-sub-tabs">
                <button
                  className={`ev-sub-tab ${subTab === 'pending_eval' ? 'active' : ''}`}
                  onClick={() => setSubTab('pending_eval')}
                >
                  ⏳ Pending Evaluation ({evalPending.length})
                </button>
                <button
                  className={`ev-sub-tab ${subTab === 'evaluated' ? 'active' : ''}`}
                  onClick={() => setSubTab('evaluated')}
                >
                  ✅ Evaluated ({evalDone.length})
                </button>
              </div>

              {/* Pending Evaluation list */}
              {subTab === 'pending_eval' && (
                <div className="ev-list">
                  {evalPending.length === 0 ? (
                    <div className="ev-empty-sm">🎉 All submitted students have been evaluated!</div>
                  ) : evalPending.map(s => (
                    <EvalRow
                      key={s.username}
                      student={s}
                      day={Number(day)}
                      maxMarks={data.maxMarks}
                      onSave={handleSave}
                    />
                  ))}
                </div>
              )}

              {/* Evaluated list */}
              {subTab === 'evaluated' && (
                <div className="ev-list">
                  {evalDone.length === 0 ? (
                    <div className="ev-empty-sm">No students evaluated yet.</div>
                  ) : evalDone.map(s => (
                    <EvalRow
                      key={s.username}
                      student={s}
                      day={Number(day)}
                      maxMarks={data.maxMarks}
                      onSave={handleSave}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Not Submitted list ── */}
          {tab === 'not_submitted' && (
            <div className="ev-list">
              {notSubmitted.length === 0 ? (
                <div className="ev-empty-sm">All students have submitted! 🎉</div>
              ) : notSubmitted.map(s => (
                <div key={s.username} className="ev-row ev-row-missing">
                  <div className="ev-row-header">
                    <div className="ev-row-left">
                      <div className="ev-avatar ev-avatar-missing">{s.name?.[0]?.toUpperCase() || '?'}</div>
                      <div>
                        <div className="ev-student-name">{s.name}</div>
                        <div className="ev-student-meta">{s.username} · {s.selectedDomain}</div>
                      </div>
                    </div>
                    <div className="ev-row-right">
                      <span className="ev-missing-badge"><FaExclamationTriangle /> Not Submitted</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
