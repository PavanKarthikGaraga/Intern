"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import "./page.css";
import { toast } from "react-hot-toast";

const FinalReportPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finalReport, setFinalReport] = useState("");
  const [finalPresentation, setFinalPresentation] = useState("");
  const [status, setStatus] = useState({
    // verified: false,
    completed: false,
    finalReport: null,
    finalPresentation: null,
    submissionOpen: false
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/student/finalReport', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
          if (data.error === 'Final report submission is not currently open for your slot.') {
            setStatus(prev => ({ ...prev, submissionOpen: false }));
            setError(null);
          } else {
            setError(data.error || 'Failed to fetch final report status');
          }
          return;
        }

        if (data.success) {
          setStatus({
            // verified: data.data.verified,
            completed: data.data.completed,
            finalReport: data.data.finalReport,
            finalPresentation: data.data.finalPresentation,
            submissionOpen: data.data.submissionOpen
          });
          if (data.data.finalReport) {
            setFinalReport(data.data.finalReport);
          }
          if (data.data.finalPresentation) {
            setFinalPresentation(data.data.finalPresentation);
          }
        }
      } catch (err) {
        console.error('Error fetching status:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/student/finalReport', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ finalReport, finalPresentation })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit final report');
      }

      if (data.success) {
        setStatus(prev => ({ ...prev, finalReport, finalPresentation }));
        toast.success('Final report submitted successfully!');
      } else {
        throw new Error(data.error || 'Failed to submit final report');
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="final-report-section">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="final-report-section">
        <div className="error">{error}</div>
      </div>
    );
  }
  
  if (!status.submissionOpen) {
    return (
      <div className="final-report-section">
        <div className="not-verified">
          <h2>Final Report Submission</h2>
          <p>Final report submission is not currently open for your slot. Please wait for the submission period to begin.</p>
        </div>
      </div>
    );
  }

  // if (!status.verified) {
  //   return (
  //     <div className="final-report-section">
  //       <div className="not-verified">
  //         <h2>Final Report Submission</h2>
  //         <p>You are not yet verified to submit your final report. Please wait for verification from your student lead.</p>
  //       </div>
  //     </div>
  //   );
  // }


  return (
    <div className="final-report-section">
      <div className="section-header">
        <h2>Final Report Submission</h2>
        <div className="status-indicator">
          <span className={`status-badge ${status.completed ? 'completed' : 'pending'}`}>
            {status.completed ? 'Completed' : 'Pending Review'}
          </span>
        </div>
      </div>

      {status.finalReport ? (
        <div className="report-form">
          <div className="submitted-report">
            <h3>Submitted Report</h3>
            <a href={status.finalReport} target="_blank" rel="noopener noreferrer" className="report-link">
              View Final Report
            </a>
            {status.finalPresentation && (
              <>
                <h3>Submitted Presentation</h3>
                <a href={status.finalPresentation} target="_blank" rel="noopener noreferrer" className="report-link">
                  View Final Presentation
                </a>
              </>
            )}
            <p className="status-message">
              {status.completed 
                ? "Your final report has been reviewed and marked as completed by your faculty mentor."
                : "Your final report has been submitted and is waiting for evaluation by your faculty mentor."}
            </p>
          </div>
        </div>
      ) : (
        <div className="report-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="finalReport">Final Report Link</label>
              <input
                type="url"
                id="finalReport"
                value={finalReport}
                onChange={(e) => setFinalReport(e.target.value)}
                placeholder="Enter the link to your final report (e.g., Google Drive, OneDrive, etc.)"
                required
              />
              <p className="input-hint">Please provide a shareable link to your final report document</p>
            </div>

            <div className="form-group">
              <label htmlFor="finalPresentation">Final Presentation Link</label>
              <input
                type="url"
                id="finalPresentation"
                value={finalPresentation}
                onChange={(e) => setFinalPresentation(e.target.value)}
                placeholder="Enter the link to your final presentation (e.g., Google Drive, OneDrive, etc.)"
                required
              />
              <p className="input-hint">Please provide a shareable link to your final presentation</p>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FinalReportPage; 