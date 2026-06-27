import React, { useState } from 'react';
import './fullRep.css';

export default function FullRep() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReportHtml = async () => {
    try {
      const res = await fetch('/api/dashboard/admin/dev/full-rep');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to fetch report');
      return data.html;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const generateWordDoc = async () => {
    setLoading(true);
    setError('');
    
    const html = await fetchReportHtml();
    if (html) {
      const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Social_Internship_Report_May_2026.doc';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    
    setLoading(false);
  };

  const generatePDF = async () => {
    setLoading(true);
    setError('');
    
    const html = await fetchReportHtml();
    if (html) {
      // Create a temporary hidden iframe or new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for styles and images to load before printing
        printWindow.setTimeout(() => {
          printWindow.print();
          // Optional: close window after print dialog is closed
          // printWindow.close();
        }, 500);
      } else {
        setError('Popup blocked! Please allow popups to generate PDF.');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="full-rep-container">
      <h2>Generate Full Social Internship Report</h2>
      <p>This tool automatically aggregates all database statistics and formats them into the official Monthly Progress Report template.</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="action-cards">
        <div className="action-card">
          <div className="card-icon">📄</div>
          <h3>Word Document</h3>
          <p>Generates a .doc file perfect for manual editing and adding gallery images.</p>
          <button onClick={generateWordDoc} disabled={loading} className="generate-btn word-btn">
            {loading ? 'Generating...' : 'Generate Word Doc'}
          </button>
        </div>

        <div className="action-card">
          <div className="card-icon">🖨️</div>
          <h3>PDF Document</h3>
          <p>Opens a print-ready formatted view. Simply select "Save as PDF" in the print dialog.</p>
          <button onClick={generatePDF} disabled={loading} className="generate-btn pdf-btn">
            {loading ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}
