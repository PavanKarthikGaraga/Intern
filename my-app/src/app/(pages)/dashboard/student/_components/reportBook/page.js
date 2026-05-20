'use client';
import { useState, useEffect } from 'react';
import { FaBook, FaCheckCircle, FaExclamationTriangle, FaClock, FaLink, FaExternalLinkAlt, FaTimesCircle, FaQrcode, FaPrint } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function ReportBook({ studentData }) {
  const [link, setLink] = useState('');
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  
  const reportBook = studentData?.reportBook || null;
  const status = reportBook?.status;
  const adminRemarks = reportBook?.adminRemarks;

  // Deadline: Friday, 22nd May 2026, 5:00 PM IST
  const deadline = new Date('2026-05-22T17:00:00+05:30').getTime();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = deadline - now;

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
  }, [deadline]);

  const handleSubmitLink = async (e) => {
    e.preventDefault();
    if (!link || !link.trim()) {
      toast.error('Please enter a valid link');
      return;
    }

    if (!link.startsWith('http')) {
      toast.error('Link must start with http:// or https://');
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
      if (data.success) {
        toast.success('Report Book submitted successfully!');
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to submit Report Book');
      }
    } catch (err) {
      toast.error('An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUtr = async (e) => {
    e.preventDefault();
    if (!utr || !/^\d{12}$/.test(utr)) {
      toast.error('Please enter a valid 12-digit UTR ID');
      return;
    }

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
      if (data.success) {
        toast.success('Payment details submitted successfully!');
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to submit payment details');
      }
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

      {(!status || status === 'REJECTED') && (
        <div style={{ background: timeLeft === 'DEADLINE PASSED' ? '#ffebee' : '#fff3e0', border: `1.5px solid ${timeLeft === 'DEADLINE PASSED' ? '#ef9a9a' : '#ffcc80'}`, borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <FaClock style={{ fontSize: '1.5rem', color: timeLeft === 'DEADLINE PASSED' ? '#c62828' : '#e65100' }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: timeLeft === 'DEADLINE PASSED' ? '#c62828' : '#e65100', fontWeight: 700 }}>Submission Deadline</h3>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#333' }}>
              {timeLeft} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#666' }}>(Friday, 22nd May, 5:00 PM IST)</span>
            </p>
          </div>
        </div>
      )}

      {/* REJECTED STATUS */}
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
            Please make the necessary modifications in your Adobe Express project and resubmit your link below.
          </p>
        </div>
      )}

      {/* PENDING_REVIEW STATUS */}
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

      {/* APPROVED / PAYMENT REQUIRED STATUS */}
      {status === 'APPROVED' && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '24px', borderRadius: '12px', marginBottom: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <FaCheckCircle style={{ fontSize: '3rem', color: '#16a34a', marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#15803d', fontSize: '1.4rem' }}>Report Approved!</h3>
            <p style={{ margin: 0, color: '#166534', fontSize: '1rem' }}>
              Your report is perfect. Next step: Payment for printing.
            </p>
            {adminRemarks && (
              <div style={{ marginTop: 16, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0', color: '#14532d', fontSize: '0.9rem', textAlign: 'left' }}>
                <strong>Admin Remarks:</strong> {adminRemarks}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ width: 200, height: 200, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: '2px dashed #cbd5e1', marginBottom: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <FaQrcode style={{ fontSize: '3rem', color: '#94a3b8' }} />
                  <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Placeholder QR Code</p>
                </div>
              </div>
              <p style={{ margin: 0, fontWeight: 700, color: '#334155' }}>Scan to Pay</p>
            </div>

            <div style={{ flex: '1 1 300px', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.1rem' }}>Submit Payment Details</h4>
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
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', letterSpacing: '2px' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || utr.length !== 12}
                  style={{ width: '100%', padding: '14px', background: (submitting || utr.length !== 12) ? '#94a3b8' : '#014a01', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: (submitting || utr.length !== 12) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
                >
                  {submitting ? 'Submitting...' : 'Submit UTR Details'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT_SUBMITTED STATUS */}
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

      {/* PRINTING_IN_PROCESS STATUS */}
      {status === 'PRINTING_IN_PROCESS' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', padding: '30px 20px', borderRadius: '12px', textAlign: 'center', marginBottom: 24 }}>
          <FaPrint style={{ fontSize: '3rem', color: '#d97706', marginBottom: 16, animation: 'pulse 2s infinite' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#b45309', fontSize: '1.3rem' }}>Printing is being processed!</h3>
          <p style={{ margin: 0, color: '#92400e', fontSize: '1rem' }}>
            Payment verified. Your report book is currently being printed.
            <br />This status will update once your book is fully printed and ready.
          </p>
        </div>
      )}

      {/* PRINTING_COMPLETED STATUS */}
      {status === 'PRINTING_COMPLETED' && (
        <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', padding: '30px 20px', borderRadius: '12px', textAlign: 'center', marginBottom: 24 }}>
          <FaCheckCircle style={{ fontSize: '3rem', color: '#059669', marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#047857', fontSize: '1.4rem' }}>Printing Completed!</h3>
          <p style={{ margin: 0, color: '#064e3b', fontSize: '1rem' }}>
            Congratulations! Your report book has been printed successfully.
            <br />Please wait for further instructions from the admin on collection.
          </p>
        </div>
      )}


      {/* Submission Form (Shown if NOT submitted OR if REJECTED) */}
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
                <li style={{ marginBottom: 10 }}><strong>Create an Account:</strong> First, create an account in <a href="https://new.express.adobe.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>Adobe Express</a> using your personal email.</li>
                <li style={{ marginBottom: 10 }}><strong>Use the Template:</strong> Click the template link below to copy the sample report to your account.</li>
                <li style={{ marginBottom: 10 }}><strong>Edit the Report:</strong> Wherever the sample contains placeholders or dummy data, replace it with your actual information and work. Ensure that all tasks and activities mentioned in your field work are reflected accurately in the report.</li>
                <li style={{ marginBottom: 10 }}><strong>Verify:</strong> Verify your document multiple times. Make sure all formatting is professional and correct.</li>
                <li style={{ marginBottom: 10 }}><strong>Generate Link:</strong> Click on <strong>Share</strong> in Adobe Express. Set <em>Who has access</em> to <strong>&quot;Anyone with the link&quot;</strong>.</li>
                <li><strong>Submit:</strong> Copy the link and submit it below. <strong>Once submitted, the report is final and cannot be edited.</strong></li>
              </ol>

              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                <a 
                  href="https://new.express.adobe.com/id/urn:aaid:sc:AP:fb696ac2-eae2-5955-8e9f-45dbbd55e7df?promoid=GHMVY4BS&mv=other&preload=sharesheet" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#014a01', color: '#fff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#013a01'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#014a01'}
                >
                  Open Report Template in Adobe Express <FaExternalLinkAlt />
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
                  Adobe Express Share Link <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://new.express.adobe.com/..."
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s' }}
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
