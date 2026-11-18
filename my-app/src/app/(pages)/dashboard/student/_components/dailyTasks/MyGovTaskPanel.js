'use client';
/**
 * The quizzes / pledges / certificate-upload part of each MyGov task section.
 * Links are fetched live from MyGov (see /api/mygov-tasks), so expired quizzes are
 * replaced automatically once their end date passes.
 */
import { useMyGovTasks, formatMyGovDate } from './useMyGovTasks';
import { CertificateUploader } from './StorageWidgets';

const linkStyle = { color: '#1d4ed8', fontSize: '0.88rem', wordBreak: 'break-word' };
const rowStyle = { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 };

export default function MyGovTaskPanel({ day, quizCount, pledgeCount, fallback, data, onChange, readOnly }) {
  const { loading, live, quizzes, pledges, fetchedAt } = useMyGovTasks({ day, quizCount, pledgeCount, fallback });
  const total = quizzes.length + pledges.length;

  if (loading) {
    return <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 14px' }}>Loading today&apos;s MyGov quizzes and pledges…</p>;
  }

  return (
    <>
      {/* Quizzes */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 8, fontSize: '0.95rem' }}>
          🧠 QUIZZES {quizzes.length > 0 && `(Complete ${quizzes.length === 1 ? 'it' : quizzes.length === 2 ? 'both' : `all ${quizzes.length}`}):`}
        </div>
        {quizzes.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>
            No MyGov quizzes are open right now. Complete the pledges below — new quizzes appear here automatically as soon as MyGov publishes them.
          </p>
        ) : quizzes.map((q) => (
          <div key={q.url} style={rowStyle}>
            <span style={{ color: '#1e40af', fontWeight: 700, minWidth: 20 }}>•</span>
            <span>
              <a href={q.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>{q.title}</a>
              {q.endDate && (
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Closes {formatMyGovDate(q.endDate)}</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Pledges */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 8, fontSize: '0.95rem' }}>
          🤝 PLEDGES {pledges.length > 0 && `(Complete ${pledges.length === 1 ? 'it' : pledges.length === 2 ? 'both' : `all ${pledges.length}`}):`}
        </div>
        {pledges.map((p) => (
          <div key={p.url} style={rowStyle}>
            <span style={{ color: '#15803d', fontWeight: 700, minWidth: 20 }}>•</span>
            <a href={p.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>{p.title}</a>
          </div>
        ))}
      </div>

      <p style={{ margin: '-6px 0 12px', fontSize: '0.75rem', color: '#64748b' }}>
        {live
          ? `Updated automatically from MyGov${fetchedAt ? ` · last checked ${new Date(fetchedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}` : ''}.`
          : 'Showing the saved list because live MyGov data could not be loaded.'}
      </p>

      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', fontSize: '0.87rem', color: '#78350f', marginBottom: 14 }}>
        ⚠️ After completing {quizzes.length > 0 && <><strong>{quizzes.length} quiz{quizzes.length === 1 ? '' : 'zes'}</strong> and </>}
        <strong>{pledges.length} pledge{pledges.length === 1 ? '' : 's'}</strong>, upload all {total} certificates below.
      </div>

      <CertificateUploader
        day={day}
        files={data.mygovFiles}
        bundleUrl={data.mygovDriveLink}
        onChange={onChange}
        readOnly={readOnly}
        expectedCount={total}
      />
    </>
  );
}
