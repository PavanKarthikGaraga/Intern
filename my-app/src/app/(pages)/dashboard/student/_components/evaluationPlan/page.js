'use client';

const CRITERIA = [
  { name: 'Problem Understanding',  marks: 10, icon: '🔍', desc: 'Clarity of problem statement analysis and inference written on Day 1' },
  { name: 'Survey Execution',       marks: 15, icon: '📋', desc: 'Quality and completeness of stakeholder surveys conducted on Days 2–4' },
  { name: 'Data Analysis',          marks: 15, icon: '📊', desc: 'Accuracy of Yes/No data tabulation, percentages, root causes on Day 5' },
  { name: 'Intervention Activity',  marks: 20, icon: '🤝', desc: 'Documentation of activities, photos and drive link submitted on Day 6' },
  { name: 'Case Study Report',      marks: 20, icon: '📄', desc: 'Quality of the written case study report submitted on Day 7' },
  { name: 'Final Presentation',     marks: 20, icon: '🎤', desc: 'YouTube presentation video quality and communication on Day 7' },
];

const GRADES = [
  { range: '≥ 90', grade: 'A', level: 'Excellence',    color: '#014a01', bg: '#e6f4ea', border: '#b7dfb7' },
  { range: '≥ 75', grade: 'B', level: 'Appreciation',  color: '#1565c0', bg: '#e3f2fd', border: '#90caf9' },
  { range: '≥ 60', grade: 'C', level: 'Participation', color: '#e65100', bg: '#fff3e0', border: '#ffcc80' },
  { range: '< 60', grade: 'F', level: 'Not Eligible',  color: '#b71c1c', bg: '#fdecea', border: '#ef9a9a' },
];

const TOTAL = CRITERIA.reduce((s, c) => s + c.marks, 0);

export default function EvaluationPlan() {
  return (
    <div style={{ padding: '28px 32px', maxWidth: 860, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#012a01', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          📝 Evaluation Plan
        </h1>
        <p style={{ color: '#666', fontSize: '0.88rem', margin: 0 }}>
          Your internship will be evaluated across 6 criteria totalling <strong>100 marks</strong>.
          A minimum of <strong>60 marks</strong> is required to receive a certificate.
        </p>
      </div>

      {/* ── Rubric Table ── */}
      <div style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        border: '1.5px solid #e8f5e9', boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        marginBottom: 28,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #014a01, #1b8f2d)',
          padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: '1.1rem' }}>📝</span>
          <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>EVALUATION RUBRIC</h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f7f0' }}>
              <th style={TH}>Criteria</th>
              <th style={{ ...TH, textAlign: 'center', width: 90 }}>Marks</th>
              <th style={{ ...TH, width: '45%' }}>What Is Evaluated</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((c, i) => {
              const pct = Math.round((c.marks / TOTAL) * 100);
              return (
                <tr key={c.name}
                  style={{ background: i % 2 === 0 ? '#fff' : '#fafdf8', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f7f0'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafdf8'}
                >
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.15rem' }}>{c.icon}</span>
                      <strong style={{ color: '#1a1a1a', fontSize: '0.92rem' }}>{c.name}</strong>
                    </div>
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        display: 'inline-block', background: '#014a01', color: '#fff',
                        fontWeight: 800, fontSize: '1rem', borderRadius: 8,
                        padding: '2px 14px', minWidth: 40, textAlign: 'center'
                      }}>{c.marks}</span>
                      <div style={{ width: 60, height: 5, background: '#e8f5e9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#014a01', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#aaa' }}>{pct}% of total</span>
                    </div>
                  </td>
                  <td style={{ ...TD, fontSize: '0.83rem', color: '#555', lineHeight: 1.5 }}>{c.desc}</td>
                </tr>
              );
            })}

            {/* Total row */}
            <tr style={{ background: 'linear-gradient(135deg, #014a01, #1b8f2d)' }}>
              <td style={{ ...TD, color: '#fff', fontWeight: 800, fontSize: '0.95rem', borderColor: 'transparent' }}>
                🏆 Total
              </td>
              <td style={{ ...TD, textAlign: 'center', color: '#fff', fontWeight: 800, fontSize: '1.2rem', borderColor: 'transparent' }}>
                {TOTAL}
              </td>
              <td style={{ ...TD, color: '#b7dfb7', fontSize: '0.82rem', borderColor: 'transparent' }}>
                Sum of all criteria above
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Grade Table ── */}
      <div style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        border: '1.5px solid #e8f5e9', boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        marginBottom: 28,
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1565c0, #1976d2)',
          padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: '1.1rem' }}>🎓</span>
          <h2 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>GRADING SCALE</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
          {GRADES.map((g, i) => (
            <div key={g.grade} style={{
              padding: '22px 18px', textAlign: 'center',
              borderRight: i < GRADES.length - 1 ? '1.5px solid #f0f0f0' : 'none',
              background: g.bg, borderBottom: `4px solid ${g.color}`,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: '2rem', fontWeight: 900, color: g.color, lineHeight: 1 }}>{g.grade}</div>
              <div style={{
                display: 'inline-block', marginTop: 6, marginBottom: 8,
                background: g.color, color: '#fff', fontWeight: 700, fontSize: '0.75rem',
                padding: '2px 12px', borderRadius: 20
              }}>{g.range} marks</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: g.color }}>{g.level}</div>
              {g.grade === 'F' && (
                <div style={{ fontSize: '0.72rem', color: '#c62828', marginTop: 6, lineHeight: 1.4 }}>
                  No certificate generated
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Info note ── */}
      <div style={{
        background: '#fff8e1', border: '1.5px solid #ffe082', borderRadius: 12,
        padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: '0.85rem', color: '#5d4037', lineHeight: 1.6 }}>
          <strong>Note:</strong> Your final marks are calculated as{' '}
          <strong>Internal Marks + Final Report + Final Presentation</strong>.
          Certificates are generated by the admin only for students who score <strong>≥ 60</strong> and are marked as Passed.
          Keep track of your daily task submissions to ensure full marks in each criterion.
        </div>
      </div>
    </div>
  );
}

const TH = {
  padding: '12px 16px', textAlign: 'left',
  fontSize: '0.78rem', fontWeight: 700, color: '#014a01',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '2px solid #d0e8d0',
};
const TD = {
  padding: '14px 16px', borderBottom: '1px solid #f0f0f0',
  verticalAlign: 'middle',
};
