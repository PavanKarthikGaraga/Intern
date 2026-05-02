'use client';
import { useState, useEffect } from 'react';

export default function SurveyResponses({ user }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  // Fetch all survey responses for assigned students
  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch('/api/dashboard/mentor/survey');
        const json = await res.json();
        setStudents(json.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setListLoading(false);
      }
    }
    fetchAll();
  }, []);

  const viewStudent = async (username) => {
    setSelected(username);
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/mentor/survey?username=${username}`);
      const json = await res.json();
      setResponseData(json.data?.[0] || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getAnswerStats = (responses) => {
    if (!responses) return { yes: 0, no: 0, total: 0 };
    const values = Object.values(responses);
    return {
      yes: values.filter(v => v === 'Yes').length,
      no: values.filter(v => v === 'No').length,
      total: values.length,
    };
  };

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '20px', color: '#1a1a1a', fontSize: '1.6rem' }}>📋 Survey Responses</h2>

      {listLoading ? (
        <p style={{ color: '#666' }}>Loading...</p>
      ) : students.length === 0 ? (
        <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#6c757d' }}>
          No students have submitted survey responses yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '320px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          {/* Student List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {students.map((s) => {
              const stats = getAnswerStats(s.responses);
              return (
                <div
                  key={s.username}
                  onClick={() => viewStudent(s.username)}
                  style={{
                    background: selected === s.username ? '#e3f2fd' : 'white',
                    border: `2px solid ${selected === s.username ? '#2196f3' : '#e9ecef'}`,
                    borderRadius: '10px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: '600', color: '#1a1a1a' }}>{s.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>@{s.username} · {s.branch}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '6px' }}>{s.problem_statement}</div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <span style={{ background: '#d4edda', color: '#155724', padding: '2px 10px', borderRadius: '12px', fontSize: '0.78rem' }}>✓ {stats.yes} Yes</span>
                    <span style={{ background: '#f8d7da', color: '#721c24', padding: '2px 10px', borderRadius: '12px', fontSize: '0.78rem' }}>✗ {stats.no} No</span>
                    <span style={{ background: '#e9ecef', color: '#495057', padding: '2px 10px', borderRadius: '12px', fontSize: '0.78rem' }}>{stats.total} total</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e9ecef', padding: '24px' }}>
              {loading ? (
                <p>Loading responses...</p>
              ) : !responseData ? (
                <p style={{ color: '#6c757d' }}>No response data found.</p>
              ) : (
                <>
                  <div style={{ marginBottom: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '16px' }}>
                    <h3 style={{ margin: '0 0 6px', color: '#1a1a1a' }}>{responseData.name}</h3>
                    <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '4px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '600' }}>{responseData.domain}</span>
                    <p style={{ color: '#555', marginTop: '8px', fontSize: '0.95rem' }}><strong>Problem:</strong> {responseData.problem_statement}</p>
                    <p style={{ color: '#888', fontSize: '0.82rem' }}>Submitted: {new Date(responseData.submittedAt).toLocaleString()}</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(responseData.responses).map(([key, val]) => {
                      const [stakeholder, qIdx] = key.split('__');
                      return (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.88rem' }}>
                          <span style={{ color: '#495057' }}><strong style={{ color: '#1565c0' }}>{stakeholder}</strong> · Q{parseInt(qIdx) + 1}</span>
                          <span style={{
                            padding: '3px 14px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '0.82rem',
                            background: val === 'Yes' ? '#d4edda' : '#f8d7da',
                            color: val === 'Yes' ? '#155724' : '#721c24',
                          }}>{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
