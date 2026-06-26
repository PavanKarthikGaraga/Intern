'use client';
import { useState, useEffect } from 'react';
import { FaBook, FaCheckCircle, FaExclamationTriangle, FaClock, FaLink, FaExternalLinkAlt, FaTimesCircle, FaPrint, FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function ReportBook({ studentData }) {
  const [link, setLink] = useState('');
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const isSlot1 = Number(studentData?.slot) === 1;
  const reportBook = studentData?.reportBook || null;
  const status = reportBook?.status;
  const adminRemarks = reportBook?.adminRemarks;
  const reportBookMarks = reportBook?.reportBookMarks;

  const [deadlineTime, setDeadlineTime] = useState(null);

  useEffect(() => {
    const fetchDeadline = async () => {
      try {
        const slot = studentData?.slot || 1;
        const res = await fetch(`/api/dashboard/student/deadline?slot=${slot}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        const data = await res.json();
        if (data.success && data.data?.deadline) {
          const d = new Date(data.data.deadline);
          // If the date string doesn't include timezone information, it might be parsed as local time.
          // In our API, it's returning a standard UTC string or ISO string depending on MySQL dialect.
          // Actually, let's just use the JS Date object returned. If it's an ISO string ending in Z,
          // it's already properly timezone-aware.
          setDeadlineTime(d.getTime());
        } else {
          setDeadlineTime(isSlot1 
            ? new Date('2026-05-29T18:00:00+05:30').getTime()
            : new Date('2026-05-30T18:00:00+05:30').getTime());
        }
      } catch (e) {
        setDeadlineTime(isSlot1 
          ? new Date('2026-05-29T18:00:00+05:30').getTime()
          : new Date('2026-05-30T18:00:00+05:30').getTime());
      }
    };
    fetchDeadline();
  }, [studentData, isSlot1]);

  useEffect(() => {
    if (!deadlineTime) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = deadlineTime - now;
      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft('DEADLINE PASSED');
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [deadlineTime]);

  const handleSubmitLink = async (e) => {
    e.preventDefault();
    if (!link || !link.trim()) { toast.error('Please enter a valid link'); return; }
    if (!link.startsWith('http')) { toast.error('Link must start with http:// or https://'); return; }
    
    // Canva / Google Drive link validation
    const lowerLink = link.toLowerCase();
    if (!lowerLink.includes('canva.com') && !lowerLink.includes('canva.link') && !lowerLink.includes('drive.google.com')) {
      toast.error('Invalid link! You must submit a Canva URL or Google Drive URL. Other links are not accepted.', { duration: 5000 });
      return;
    }

    const confirmSubmit = window.confirm('Are you sure you want to submit?');
    if (!confirmSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/student/report-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: studentData.username, link: link.trim() }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Report Book submitted successfully!'); window.location.reload(); }
      else toast.error(data.error || 'Failed to submit Report Book');
    } catch (err) {
      toast.error('An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUtr = async (e) => {
    e.preventDefault();
    if (!utr || !/^\d{12}$/.test(utr)) { toast.error('Please enter a valid 12-digit UTR ID'); return; }
    const confirmSubmit = window.confirm('Are you sure this is the correct UTR ID?');
    if (!confirmSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/student/report-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: studentData.username, utrId: utr }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Payment details submitted successfully!'); window.location.reload(); }
      else toast.error(data.error || 'Failed to submit payment details');
    } catch (err) {
      toast.error('An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitOwnPrinting = async () => {
    const confirmSubmit = window.confirm('Are you sure you want to confirm your own printing choice?');
    if (!confirmSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/student/report-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: studentData.username, ownPrinting: true }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Printing choice saved successfully!'); window.location.reload(); }
      else toast.error(data.error || 'Failed to save choice');
    } catch (err) {
      toast.error('An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 860, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#014a01', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FaBook /> Report Book Workflow
        </h1>
        <p style={{ color: '#666', fontSize: '0.95rem', marginTop: '8px' }}>
          Complete your final report submission and printing process.
        </p>
      </div>

      {/* Countdown Timer — only when pending/rejected */}
      {(!status || status === 'REJECTED') && (
        <div style={{ background: timeLeft === 'DEADLINE PASSED' ? '#ffebee' : '#fff3e0', border: `1.5px solid ${timeLeft === 'DEADLINE PASSED' ? '#ef9a9a' : '#ffcc80'}`, borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <FaClock style={{ fontSize: '1.5rem', color: timeLeft === 'DEADLINE PASSED' ? '#c62828' : '#e65100' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: timeLeft === 'DEADLINE PASSED' ? '#c62828' : '#e65100', fontWeight: 700 }}>Submission Deadline</h3>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#333' }}>
              {timeLeft} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#666' }}>
                {deadlineTime ? `(${new Date(deadlineTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric', hour12: true })} IST)` : ''}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* REJECTED */}
      {status === 'REJECTED' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '20px', borderRadius: '12px', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaTimesCircle style={{ fontSize: '1.2rem' }} /> Report Rejected
          </h3>
          <p style={{ margin: '0 0 8px 0', color: '#7f1d1d', fontWeight: 600 }}>Admin Remarks:</p>
          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', color: '#450a0a', fontSize: '0.95rem' }}>
            {adminRemarks || 'No remarks provided.'}
          </div>
          <p style={{ margin: '12px 0 0 0', color: '#b91c1c', fontSize: '0.9rem' }}>
            Please make the necessary modifications in your report project and resubmit your link below.
          </p>
        </div>
      )}

      {/* PENDING REVIEW */}
      {status === 'PENDING_REVIEW' && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '30px 20px', borderRadius: '12px', textAlign: 'center', marginBottom: 24 }}>
          <FaClock style={{ fontSize: '3rem', color: '#0284c7', marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#0369a1', fontSize: '1.3rem' }}>Submitted for Review</h3>
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '1rem' }}>
            Your report link has been successfully submitted. An admin will review it shortly.
            <br />Check back later for approval or feedback!
          </p>
          <div style={{ marginTop: '16px', display: 'inline-block', background: '#fff', padding: '8px 16px', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '0.9rem', color: '#0369a1' }}>
            <a href={reportBook.reportLink} target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
              View Submitted Link <FaExternalLinkAlt style={{ fontSize: '0.8rem', marginLeft: 4 }} />
            </a>
          </div>
        </div>
      )}

      {/* APPROVED — choose printing option */}
      {status === 'APPROVED' && (
        <ApprovedSection
          studentData={studentData}
          adminRemarks={adminRemarks}
          reportBookMarks={reportBookMarks}
          isSlot1={isSlot1}
          utr={utr}
          setUtr={setUtr}
          submitting={submitting}
          handleSubmitUtr={handleSubmitUtr}
          handleSubmitOwnPrinting={handleSubmitOwnPrinting}
        />
      )}

      {/* OWN_PRINTING */}
      {status === 'OWN_PRINTING' && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '30px 20px', borderRadius: '12px', textAlign: 'center', marginBottom: 24 }}>
          <FaCheckCircle style={{ fontSize: '3rem', color: '#16a34a', marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '1.4rem' }}>Self-Printing Confirmed! ✅</h3>
          <p style={{ margin: 0, color: '#166534', fontSize: '1rem' }}>
            You have chosen to print the report book on your own.
            <br />Please download your report from Canva, print 2 copies, and submit 1 copy to the college when it reopens.
          </p>
        </div>
      )}

      {/* PAYMENT_SUBMITTED */}
      {status === 'PAYMENT_SUBMITTED' && (
        <div style={{ background: '#fdf4ff', border: '1px solid #f0abfc', padding: '30px 20px', borderRadius: '12px', textAlign: 'center', marginBottom: 24 }}>
          <FaCheckCircle style={{ fontSize: '3rem', color: '#c026d3', marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#86198f', fontSize: '1.3rem' }}>Payment Submitted</h3>
          <p style={{ margin: 0, color: '#701a75', fontSize: '1rem' }}>
            UTR ID: <strong>{reportBook.utrId}</strong>
            <br />The admin is currently verifying your payment.
          </p>
        </div>
      )}

      {/* PRINTING_IN_PROCESS */}
      {status === 'PRINTING_IN_PROCESS' && (
        <PrintingInProcessSection reportBookMarks={reportBookMarks} isSlot1={isSlot1} />
      )}

      {/* PRINTING_COMPLETED */}
      {status === 'PRINTING_COMPLETED' && (
        <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', padding: '30px 20px', borderRadius: '12px', textAlign: 'center', marginBottom: 24 }}>
          <FaCheckCircle style={{ fontSize: '3rem', color: '#059669', marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#047857', fontSize: '1.4rem' }}>Printing Completed!</h3>
          <p style={{ margin: 0, color: '#064e3b', fontSize: '1rem' }}>
            Congratulations! Your report book has been printed successfully.
            <br />You can collect your books from <strong>SAC HALL</strong> when the college reopens.
          </p>
        </div>
      )}

      {/* SUBMISSION FORM — not submitted OR rejected */}
      {(!status || status === 'REJECTED') && (
        <>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '24px', marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginTop: 0, borderBottom: '2px solid #f1f5f9', paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaExclamationTriangle style={{ color: '#f59e0b' }} /> Instructions
            </h2>
            <div style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6 }}>
              <p>Dear Students,</p>
              <p>A sample report document is provided to you as a reference. Your report <strong>must follow the structure and components</strong> in the sample file.</p>

              <ol style={{ paddingLeft: 20, marginBottom: 20 }}>
                <li style={{ marginBottom: 10 }}><strong>Create an Account:</strong> First, create an account in <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>Canva</a> using your personal email.</li>
                <li style={{ marginBottom: 10 }}><strong>Use the Template:</strong> Click the template link below to copy the sample report to your Canva account.</li>
                <li style={{ marginBottom: 10 }}><strong>Edit the Report:</strong> Wherever the sample contains placeholders or dummy data, replace it with your actual information and work.</li>
                <li style={{ marginBottom: 10 }}><strong>Verify:</strong> Verify your document multiple times. Make sure all formatting is professional and correct.</li>
                <li style={{ marginBottom: 10 }}><strong>Generate Link:</strong> Click on <strong>Share</strong> in Canva. Set <em>Who has access</em> to <strong>&quot;Anyone with the link&quot;</strong>.</li>
                <li><strong>Submit:</strong> Copy the link and submit it below. <strong>Once submitted, the report is final and cannot be edited.</strong></li>
              </ol>
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <a
                  href="https://canva.link/0n7w5lblhy293oc"
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#014a01', color: '#fff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#013a01'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#014a01'}
                >
                  Open Report Template in Canva <FaExternalLinkAlt />
                </a>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaLink style={{ color: '#3b82f6' }} /> {status === 'REJECTED' ? 'Resubmit Your Report Link' : 'Submit Your Report Link'}
            </h2>
            <form onSubmit={handleSubmitLink}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                  Canva / Google Drive Link <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://www.canva.com/... or https://drive.google.com/..."
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                  onFocus={(e) => e.target.style.borderColor = '#014a01'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Make sure access is set to &quot;Anyone with the link&quot;.</p>
              </div>
              <button
                type="submit"
                disabled={submitting || timeLeft === 'DEADLINE PASSED'}
                style={{ width: '100%', padding: '14px', background: (submitting || timeLeft === 'DEADLINE PASSED') ? '#94a3b8' : '#014a01', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: (submitting || timeLeft === 'DEADLINE PASSED') ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
              >
                {submitting ? 'Submitting...' : 'Final Submit Report'}
              </button>
            </form>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ── Marks Badge ── */
function MarksBadge({ reportBookMarks }) {
  if (reportBookMarks === null || reportBookMarks === undefined) return null;
  return (
    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
      <FaStar style={{ fontSize: '1.8rem', color: '#16a34a' }} />
      <div>
        <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>Report Book Evaluation</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#014a01' }}>
          {Number(reportBookMarks)} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#166534' }}>/ 20 marks</span>
        </div>
      </div>
    </div>
  );
}

/* ── Grand Total Marks Banner ── */
function TotalMarksBanner({ dailyTotal, reportBookMarks }) {
  const rbMarks  = (reportBookMarks !== null && reportBookMarks !== undefined) ? Number(reportBookMarks) : null;
  const grandTotal = rbMarks !== null ? (Number(dailyTotal) + rbMarks) : null;
  const passed   = grandTotal !== null ? grandTotal >= 60 : null;

  if (grandTotal === null) return null; // marks not yet assigned

  return (
    <div style={{
      borderRadius: 14,
      padding: '18px 22px',
      marginBottom: 24,
      border: `2px solid ${passed ? '#86efac' : '#fca5a5'}`,
      background: passed ? '#f0fdf4' : '#fef2f2',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: passed ? '#166534' : '#991b1b', letterSpacing: '0.03em' }}>
        {passed ? '🏆 MARKS SUMMARY — PASS' : '❌ MARKS SUMMARY — FAIL'}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: '1 1 130px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Daily Marks</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#014a01' }}>{Number(dailyTotal)}<span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>/80</span></div>
        </div>
        <div style={{ flex: '1 1 130px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Report Book</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#014a01' }}>{rbMarks}<span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>/20</span></div>
        </div>
        <div style={{
          flex: '1 1 130px',
          background: passed ? '#014a01' : '#dc2626',
          borderRadius: 10, padding: '10px 14px',
        }}>
          <div style={{ fontSize: '0.75rem', color: passed ? '#bbf7d0' : '#fecaca', fontWeight: 600 }}>Grand Total</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>{grandTotal}<span style={{ fontSize: '0.85rem', fontWeight: 500, color: passed ? '#bbf7d0' : '#fecaca' }}>/100</span></div>
        </div>
      </div>
      {!passed && (
        <div style={{ fontSize: '0.85rem', color: '#7f1d1d', fontWeight: 500, lineHeight: 1.5 }}>
          Minimum passing score is <strong>60/100</strong>. You need at least 60 marks to proceed with Report Book printing.
        </div>
      )}
    </div>
  );
}

/* ── APPROVED SECTION ── */
function ApprovedSection({ studentData, adminRemarks, reportBookMarks, isSlot1, utr, setUtr, submitting, handleSubmitUtr, handleSubmitOwnPrinting }) {
  const [printingChoice, setPrintingChoice] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);

  // Compute pass/fail
  const dailyTotal  = Number(studentData?.dailyMarks?.total || 0);
  const rbMarks     = (reportBookMarks !== null && reportBookMarks !== undefined) ? Number(reportBookMarks) : null;
  const grandTotal  = rbMarks !== null ? dailyTotal + rbMarks : null;
  const hasPassed   = grandTotal !== null ? grandTotal >= 60 : true; // if marks not yet set, don't block
  
  const dm = studentData?.dailyMarks;
  const isDailyFullyEvaluated = dm ? [1,2,3,4,5,6,7].every(i => dm[`d${i}`] !== null && dm[`d${i}`] !== undefined) : false;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Approved Banner */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '24px', borderRadius: '12px', textAlign: 'center', marginBottom: 24 }}>
        <FaCheckCircle style={{ fontSize: '3rem', color: '#16a34a', marginBottom: 12 }} />
        <h3 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '1.4rem' }}>Report Approved! 🎉</h3>
        <p style={{ margin: 0, color: '#166534', fontSize: '1rem' }}>
          Your report has been reviewed and approved.
          {hasPassed ? ' Please choose your preferred printing option below.' : ''}
        </p>
        {adminRemarks && (
          <div style={{ marginTop: 16, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#14532d', fontSize: '0.9rem', textAlign: 'left' }}>
            <strong>Admin Remarks:</strong> {adminRemarks}
          </div>
        )}
      </div>

      {/* Grand Total Marks Banner — always shown when marks are available */}
      <TotalMarksBanner dailyTotal={dailyTotal} reportBookMarks={reportBookMarks} />

      {/* Evaluation Marks (slot 2+ fallback badge when grandTotal not yet computed) */}
      {!isSlot1 && grandTotal === null && <MarksBadge reportBookMarks={reportBookMarks} />}

      {/* ── PENDING EVALUATION (Score < 60 but not fully evaluated) ── */}
      {!hasPassed && !isDailyFullyEvaluated && (
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '2px solid #fcd34d',
          borderRadius: 16,
          padding: '32px 28px',
          textAlign: 'center',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 12 }}>⏳</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#b45309', fontSize: '1.5rem', fontWeight: 800 }}>
            Evaluation in Progress
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#92400e', fontSize: '1rem', lineHeight: 1.7, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Please wait until your daily tasks are completely evaluated. A minimum score of <strong>60 out of 100</strong> is required to proceed with Report Book printing.
          </p>
        </div>
      )}

      {/* ── FAILED — no printing ── */}
      {!hasPassed && isDailyFullyEvaluated && (
        <div style={{
          background: 'linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)',
          border: '2px solid #fca5a5',
          borderRadius: 16,
          padding: '32px 28px',
          textAlign: 'center',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 12 }}>😔</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#991b1b', fontSize: '1.5rem', fontWeight: 800 }}>
            You did not qualify for printing.
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#7f1d1d', fontSize: '1rem', lineHeight: 1.7, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            A minimum score of <strong>60 out of 100</strong> is required to proceed with Report Book printing.
            Your grand total is <strong style={{ color: '#dc2626' }}>{grandTotal}/100</strong>.
          </p>
          <div style={{
            display: 'inline-block',
            background: '#fef2f2',
            border: '1.5px solid #fca5a5',
            borderRadius: 10,
            padding: '14px 22px',
            color: '#7f1d1d',
            fontSize: '0.92rem',
            lineHeight: 1.6,
            textAlign: 'left',
            maxWidth: 440,
          }}>
            <strong>ℹ️ What this means:</strong><br />
            Since your total score is below 60, you are not eligible to print the Report Book as part of this internship program.
            Your Report Book has been reviewed and will remain on record.
          </div>
        </div>
      )}

      {/* ── PASSED — show printing options ── */}
      {hasPassed && (
        <>
          {/* Printing Options */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', padding: '24px', marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.15rem', fontWeight: 700 }}>
              📋 Click Here for Printing Assistance
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <button
                onClick={() => setPrintingChoice('college')}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(1, 74, 1, 0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                style={{ flex: '1 1 260px', padding: '20px', borderRadius: '12px', border: `2px solid ${printingChoice === 'college' ? '#014a01' : '#e2e8f0'}`, background: printingChoice === 'college' ? '#f0fdf4' : '#f8fafc', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease-in-out' }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏫</div>
                <h4 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '1rem', fontWeight: 700 }}>I need assistance for printing (Optional)</h4>
                <ul style={{ margin: 0, padding: '0 0 0 18px', color: '#475569', fontSize: '0.88rem', lineHeight: 1.7 }}>
                  <li>Printing of <strong>2 copies</strong> will be arranged.</li>
                  <li><strong>1 copy</strong> will be submitted to the office directly.</li>
                  <li>Collect <strong>1 copy</strong> from <strong>SAC HALL</strong> when college reopens.</li>
                  <li style={{ color: '#014a01', fontWeight: 700 }}>Total Charge: ₹600 (₹300 × 2 books)</li>
                </ul>
              </button>
            </div>
            
            <div style={{ marginTop: '20px', color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <strong>Note:</strong> This option is for students who prefer a hassle-free printing process. Your report books will be printed and delivered to the SAC Hall, where you can collect them when the college reopens. This service is <strong>completely optional</strong>.<br/><br/>
              You may also choose to print the books on your own and submit them directly to the SAC Hall. You are required to print <strong>2 copies</strong> (one for college submission and one for personal use).<br/>
              <strong style={{ color: '#b45309' }}>Important:</strong> Both copies must be signed and verified by the Director, SAC.
            </div>
          </div>

          {/* SELF PRINT DETAILS */}
          {printingChoice === 'self' && (
            <SelfPrintSection submitting={submitting} handleSubmitOwnPrinting={handleSubmitOwnPrinting} />
          )}

          {/* COLLEGE PRINT DETAILS */}
          {printingChoice === 'college' && (
            <CollegeAssistSection
              studentData={studentData}
              utr={utr}
              setUtr={setUtr}
              submitting={submitting}
              handleSubmitUtr={handleSubmitUtr}
              acknowledged={acknowledged}
              setAcknowledged={setAcknowledged}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ── SELF PRINT SECTION ── */
function SelfPrintSection({ submitting, handleSubmitOwnPrinting }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '30px 24px', textAlign: 'center' }}>
        <FaCheckCircle style={{ fontSize: '3rem', color: '#16a34a', marginBottom: 12 }} />
        <h3 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '1.3rem' }}>You&apos;re all set! ✅</h3>
        <p style={{ margin: 0, color: '#166534', fontSize: '1rem' }}>
          Download your report PDF from <strong>Canva</strong>, get 2 copies printed, and submit 1 copy to the college when it reopens.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '24px', marginBottom: 16 }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#15803d', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
        <FaPrint /> Self-Print Instructions
      </h4>

      <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px 20px', color: '#14532d', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: 16 }}>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li><strong>Download</strong> your Final Report Book PDF directly from Canva (Download → PDF Print).</li>
          <li>Get the PDF printed at any print shop - <strong>2 copies</strong>.</li>
          <li>Use <strong>A4 size, single-sided</strong> and the 1st and last pages should be hard binding, the final report book should be submitted in a properly hard-bound book format.</li>
          <li>Submit <strong>1 copy</strong> to the college office when the college reopens.</li>
          <li>Keep <strong>1 copy</strong> for yourself.</li>
        </ol>
      </div>

      <div style={{ background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: '8px', padding: '12px 16px', color: '#92400e', fontSize: '0.9rem', marginBottom: 16 }}>
        ⚠️ Make sure the printed copy matches the template format exactly.
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <input
          type="checkbox"
          id="self-ack"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          style={{ marginTop: 3, width: 18, height: 18, cursor: 'pointer', accentColor: '#014a01', flexShrink: 0 }}
        />
        <label htmlFor="self-ack" style={{ fontSize: '0.9rem', color: '#166534', lineHeight: 1.6, cursor: 'pointer' }}>
          I understand the printing instructions and will download my PDF from Canva and get it printed accordingly.
        </label>
      </div>

      <button
        disabled={!acknowledged || submitting}
        onClick={handleSubmitOwnPrinting}
        style={{ width: '100%', padding: '14px', background: (!acknowledged || submitting) ? '#94a3b8' : '#014a01', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: (!acknowledged || submitting) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
      >
        {submitting ? 'Confirming...' : 'Confirm — I will print my report'}
      </button>
    </div>
  );
}

/* ── COLLEGE ASSIST SECTION ── */
function CollegeAssistSection({ studentData, utr, setUtr, submitting, handleSubmitUtr, acknowledged, setAcknowledged }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Step 1: Download from Canva */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '24px' }}>
        <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: 700 }}>
          Step 1 — Download Your Report PDF from Canva
        </h4>
        <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.88rem' }}>
          Open your report in Canva → click <strong>Share</strong> → <strong>Download</strong> → select <strong>PDF Print</strong>.
        </p>
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '12px 16px', color: '#0369a1', fontSize: '0.9rem' }}>
          📥 Download the PDF before sending the email — you will need to attach it.
        </div>
      </div>

      {/* Step 2: Scan QR & Pay */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '24px' }}>
        <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: 700 }}>
          Step 2 — Scan QR Code &amp; Pay ₹600
        </h4>
        <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.88rem' }}>
          Scan the QR code and complete the payment of ₹600 (₹300 × 2 books).
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img src="/QR.jpeg" alt="Payment QR Code" style={{ width: 320, height: 320, objectFit: 'contain', borderRadius: '8px', display: 'block' }} />
            </div>
            <div style={{ marginTop: 16, background: '#014a01', color: '#fff', borderRadius: '8px', padding: '10px 24px', fontWeight: 800, fontSize: '1.2rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(1, 74, 1, 0.2)' }}>
              Amount: ₹600
            </div>
          </div>
          <div style={{ flex: '1 1 220px', color: '#475569', fontSize: '0.9rem', lineHeight: 1.8 }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 600, color: '#1e293b' }}>Payment Instructions:</p>
            <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
              <li>Open any UPI app (PhonePe, GPay, Paytm, etc.)</li>
              <li>Scan the QR code and pay exactly <strong>₹600</strong>.</li>
              <li>Take a <strong>screenshot</strong> of the transaction confirmation.</li>
              <li>Note down the <strong>12-digit UTR / Transaction ID</strong>.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Step 3: Send Email */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '24px' }}>
        <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: 700 }}>
          Step 3 — Send an Email to Handngo
        </h4>
        <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.88rem' }}>
          After payment, send an email with all the required details and your report PDF.
        </p>
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.2rem' }}>📨</span>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534' }}>Send your email to:</p>
            <a href="mailto:Handngo.org@gmail.com" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#014a01', textDecoration: 'none' }}>
              Handngo.org@gmail.com
            </a>
          </div>
        </div>
        <p style={{ margin: '0 0 10px 0', fontWeight: 600, color: '#374151', fontSize: '0.92rem' }}>
          Your email must include all of the following:
        </p>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: 16 }}>
          <ol style={{ margin: 0, padding: '0 0 0 18px', color: '#374151', fontSize: '0.92rem', lineHeight: 2 }}>
            <li><strong>Full Name</strong></li>
            <li><strong>Registration No</strong></li>
            <li><strong>Contact Number</strong></li>
            <li><strong>Email ID</strong></li>
            <li><strong>12-digit UTR ID</strong></li>
            <li><strong>Transaction Date</strong></li>
            <li><strong>Transaction Screenshot</strong> (as attachment)</li>
            <li><strong>Final Report Book PDF</strong> (downloaded from Canva — attach to email)</li>
          </ol>
        </div>
        <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '8px', padding: '12px 16px', color: '#9a3412', fontSize: '0.9rem', fontWeight: 600 }}>
          ⚠️ Do not forget to <strong>download your PDF from Canva</strong> and attach it to the email.
        </div>
      </div>

      {/* Step 4: Submit UTR */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '24px' }}>
        <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '1.05rem', fontWeight: 700 }}>
          Step 4 — Submit Your UTR ID Here
        </h4>
        <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '0.88rem' }}>
          Enter your 12-digit UTR / Transaction ID to complete the submission on this platform.
        </p>
        <form onSubmit={handleSubmitUtr}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: 8 }}>
              12-Digit UTR Number / Transaction ID <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={utr}
              onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
              maxLength={12}
              minLength={12}
              placeholder="Enter exactly 12 digits"
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.05rem', outline: 'none', letterSpacing: '3px', fontFamily: 'monospace', boxSizing: 'border-box' }}
            />
            <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>{utr.length}/12 digits entered</p>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <input
              type="checkbox"
              id="college-ack"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              style={{ marginTop: 3, width: 18, height: 18, cursor: 'pointer', accentColor: '#014a01', flexShrink: 0 }}
            />
            <label htmlFor="college-ack" style={{ fontSize: '0.9rem', color: '#166534', lineHeight: 1.6, cursor: 'pointer' }}>
              I have downloaded my Report Book PDF from Canva, and have sent all the required details along with the PDF and payment screenshot to{' '}
              <strong>Handngo.org@gmail.com</strong>.
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || utr.length !== 12 || !acknowledged}
            style={{ width: '100%', padding: '14px', background: (submitting || utr.length !== 12 || !acknowledged) ? '#94a3b8' : '#014a01', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: (submitting || utr.length !== 12 || !acknowledged) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
          >
            {submitting ? 'Submitting...' : 'Submit Payment & Confirm'}
          </button>
          {(!acknowledged && utr.length === 12) && (
            <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: '#b45309', textAlign: 'center' }}>
              ⚠️ Please check the acknowledgement box above before submitting.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

/* ── PRINTING IN PROCESS ── */
function PrintingInProcessSection({ reportBookMarks, isSlot1 }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {!isSlot1 && reportBookMarks !== null && reportBookMarks !== undefined && (
        <MarksBadge reportBookMarks={reportBookMarks} />
      )}
      <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '30px 20px', borderRadius: '12px', textAlign: 'center' }}>
        <FaPrint style={{ fontSize: '3rem', color: '#d97706', marginBottom: 16, animation: 'pulse 2s infinite' }} />
        <h3 style={{ margin: '0 0 8px 0', color: '#b45309', fontSize: '1.3rem' }}>Printing is being processed!</h3>
        <p style={{ margin: '0 0 16px 0', color: '#92400e', fontSize: '1rem' }}>
          Payment verified. Your report book is currently being printed.
        </p>
        <div style={{ background: '#fff', border: '1px solid #fcd34d', borderRadius: '10px', padding: '16px 20px', color: '#78350f', fontSize: '0.95rem', lineHeight: 1.7, textAlign: 'left', maxWidth: 500, margin: '0 auto' }}>
          📧 <strong>You will be notified via email</strong> once the printing is completed.<br />
          📚 You can <strong>collect your books at SAC HALL</strong> when the college reopens.<br />
          No further action is needed from your side at this point.
        </div>
      </div>
    </div>
  );
}
