'use client';
import { useState, useEffect } from 'react';
import { FaBook, FaSearch, FaExternalLinkAlt, FaDownload, FaSave, FaEdit, FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function FinalReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slot, setSlot] = useState('1');
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editMarks, setEditMarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const STATUS_OPTIONS = [
    { value: 'PENDING_REVIEW',     label: 'Pending Review',           color: '#0369a1', bg: '#f0f9ff' },
    { value: 'REJECTED',           label: 'Rejected',                 color: '#991b1b', bg: '#fef2f2' },
    { value: 'APPROVED',           label: 'Approved',                 color: '#16a34a', bg: '#f0fdf4' },
    { value: 'PAYMENT_SUBMITTED',  label: 'Payment Submitted',        color: '#86198f', bg: '#fdf4ff' },
    { value: 'PRINTING_IN_PROCESS',label: 'Printing In Process',      color: '#b45309', bg: '#fffbeb' },
    { value: 'PRINTING_COMPLETED', label: 'Printing Completed',       color: '#047857', bg: '#ecfdf5' },
  ];

  const isSlot1 = Number(slot) === 1;

  const fetchReports = async (selectedSlot) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/admin/final-reports?slot=${selectedSlot}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      } else {
        toast.error(data.error || 'Failed to fetch reports');
      }
    } catch (err) {
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(slot);
    setEditingId(null);
  }, [slot]);

  const filteredReports = reports.filter(r => {
    if (searchQuery.trim() === '') return true;
    const q = searchQuery.toLowerCase().trim();
    return r.username.toLowerCase().includes(q) || r.name.toLowerCase().includes(q);
  });

  const handleExport = () => {
    if (filteredReports.length === 0) { toast.error('No data to export'); return; }
    const exportData = filteredReports.map(r => ({
      'Username': r.username,
      'Name': r.name,
      'Slot': r.slot,
      'Daily Marks': r.totalMarks,
      'Report Book Marks': r.reportBookMarks ?? '',
      'Status': r.status,
      'Admin Remarks': r.adminRemarks || '',
      'UTR ID': r.utrId || '',
      'Report Link': r.reportLink,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Slot_${slot}_Reports`);
    XLSX.writeFile(wb, `Slot_${slot}_Final_Reports.xlsx`);
  };

  const handleEditClick = (r) => {
    setEditingId(r.username);
    setEditStatus(r.status);
    setEditRemarks(r.adminRemarks || '');
    setEditMarks(r.reportBookMarks !== null && r.reportBookMarks !== undefined ? String(r.reportBookMarks) : '');
  };

  const handleCancelEdit = () => setEditingId(null);

  const handleSave = async (username) => {
    setSaving(true);
    try {
      const payload = { username, status: editStatus, adminRemarks: editRemarks };

      // For slot 2+, if marks filled in, send marks (will auto-approve)
      if (!isSlot1 && editMarks !== '') {
        const m = Number(editMarks);
        if (isNaN(m) || m < 0 || m > 20) {
          toast.error('Report Book Marks must be between 0 and 20');
          setSaving(false);
          return;
        }
        payload.reportBookMarks = m;
        // Don't send status manually — API will auto-approve
        delete payload.status;
      }

      const res = await fetch('/api/dashboard/admin/final-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Updated successfully');
        setReports(reports.map(r => r.username === username ? {
          ...r,
          status: (!isSlot1 && editMarks !== '') ? 'APPROVED' : editStatus,
          adminRemarks: editRemarks,
          reportBookMarks: (!isSlot1 && editMarks !== '') ? Number(editMarks) : r.reportBookMarks,
        } : r));
        setEditingId(null);
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch (err) {
      toast.error('Error saving data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', minHeight: '80vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#014a01', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaBook /> Report Books Management
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '220px' }}>
            <FaSearch style={{ color: '#94a3b8', fontSize: '0.9rem' }} />
            <input
              type="text"
              placeholder="Search ID / Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: '#0f172a', width: '140px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Select Slot:</span>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(s => (
                <option key={s} value={s}>Slot {s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={filteredReports.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: filteredReports.length === 0 ? '#cbd5e1' : '#014a01', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: filteredReports.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            <FaDownload /> Export Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <FaSearch style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#334155' }}>No Reports Found</h3>
          <p style={{ margin: 0, color: '#64748b' }}>No students in Slot {slot} have submitted their final report book yet.</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <FaSearch style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#334155' }}>No Search Matches</h3>
          <p style={{ margin: 0, color: '#64748b' }}>No reports match &quot;{searchQuery}&quot;.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                <th style={TH}>Student</th>
                <th style={TH}>Daily Marks</th>
                {!isSlot1 && <th style={TH}>Report Book Marks<br /><span style={{ fontSize: '0.7rem', textTransform: 'none', fontWeight: 500 }}>(out of 20)</span></th>}
                <th style={TH}>Report Link</th>
                <th style={TH}>UTR ID</th>
                <th style={{ ...TH, minWidth: 320 }}>Status & Remarks</th>
                <th style={{ ...TH, width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r, idx) => {
                const isEditing = editingId === r.username;
                const statusObj = STATUS_OPTIONS.find(s => s.value === r.status) || STATUS_OPTIONS[0];

                return (
                  <tr key={r.username} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#fafaf9', verticalAlign: 'top' }}>
                    <td style={TD}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.username}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{r.name}</div>
                    </td>
                    <td style={TD}>
                      <span style={{ background: Number(r.totalMarks) >= 60 ? '#dcfce7' : '#fee2e2', color: Number(r.totalMarks) >= 60 ? '#166534' : '#991b1b', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem' }}>
                        {Number(r.totalMarks)}
                      </span>
                    </td>

                    {/* Report Book Marks (slot 2+ only) */}
                    {!isSlot1 && (
                      <td style={TD}>
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            max={20}
                            step={0.5}
                            value={editMarks}
                            onChange={(e) => setEditMarks(e.target.value)}
                            placeholder="0–20"
                            style={{ width: '70px', padding: '6px 8px', borderRadius: '6px', border: '1.5px solid #014a01', fontSize: '1rem', outline: 'none', fontWeight: 700, textAlign: 'center' }}
                          />
                        ) : (
                          r.reportBookMarks !== null && r.reportBookMarks !== undefined ? (
                            <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <FaStar style={{ fontSize: '0.75rem' }} /> {Number(r.reportBookMarks)}/20
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Not evaluated</span>
                          )
                        )}
                      </td>
                    )}

                    <td style={TD}>
                      <a
                        href={r.reportLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2563eb', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}
                      >
                        View Link <FaExternalLinkAlt style={{ fontSize: '0.75rem' }} />
                      </a>
                    </td>

                    <td style={TD}>
                      {r.utrId ? (
                        <div style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: '6px', fontSize: '0.9rem', fontFamily: 'monospace', color: '#374151', border: '1px solid #d1d5db', letterSpacing: '1px', textAlign: 'center' }}>
                          {r.utrId}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>—</span>
                      )}
                    </td>

                    {/* STATUS & REMARKS */}
                    <td style={TD}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {!isSlot1 && editMarks !== '' ? (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 10px', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                              ✅ Saving marks will auto-approve the submission
                            </div>
                          ) : (
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                            >
                              {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          )}
                          <textarea
                            value={editRemarks}
                            onChange={(e) => setEditRemarks(e.target.value)}
                            placeholder="Optional remarks"
                            rows={2}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                          />
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'inline-block', background: statusObj.bg, color: statusObj.color, padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, border: `1px solid ${statusObj.color}33`, marginBottom: '6px' }}>
                            {statusObj.label}
                          </div>
                          {r.adminRemarks && (
                            <div style={{ fontSize: '0.85rem', color: '#475569', background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid #94a3b8' }}>
                              {r.adminRemarks}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td style={TD}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            onClick={() => handleSave(r.username)}
                            disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#014a01', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.85rem', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                          >
                            <FaSave /> Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={saving}
                            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(r)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#f8fafc'}
                        >
                          <FaEdit /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ marginTop: '16px', fontSize: '0.9rem', color: '#64748b' }}>
            Showing {filteredReports.length} report(s) for Slot {slot}.
            {!isSlot1 && <span style={{ marginLeft: 12, color: '#014a01', fontWeight: 600 }}>💡 Enter Report Book Marks (0–20) to auto-approve submissions.</span>}
          </div>
        </div>
      )}
    </div>
  );
}

const TH = { padding: '12px 16px', borderBottom: '2px solid #e2e8f0', minWidth: 100, fontWeight: 700 };
const TD = { padding: '12px 16px', verticalAlign: 'top' };
