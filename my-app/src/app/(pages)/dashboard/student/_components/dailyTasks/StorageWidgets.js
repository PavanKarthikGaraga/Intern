'use client';
/**
 * Upload widgets for daily tasks. Files go to RustFS through /api/uploads and only
 * the returned "/api/files/…" URL is kept in the task data (saved to the database).
 */
import { useRef, useState } from 'react';
import { FaCamera, FaCheckCircle, FaExternalLinkAlt, FaFilePdf, FaSpinner, FaTrash, FaUpload } from 'react-icons/fa';
import { uploadImage, uploadPdf, uploadPdfDocument, mergeUploadedFiles, isStoredFileUrl } from '@/lib/uploads';

/* ── Single photo ─────────────────────────────────────────────────────────── */

/**
 * value       current photo (stored URL, or legacy base64)
 * onUploaded  (url) => void
 * onBusyChange(boolean) lets the parent block PDF generation while uploading
 */
export function PhotoUploadField({ value, onUploaded, day, purpose = 'photo', disabled = false, onBusyChange, label = 'Upload photo' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const setBusyState = (next) => {
    setBusy(next);
    onBusyChange?.(next);
  };

  const handleSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file after an error
    if (!file) return;
    setError('');
    setBusyState(true);
    try {
      const stored = await uploadImage(file, { day, purpose });
      onUploaded(stored.url);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setBusyState(false);
    }
  };

  return (
    <div className="dt-upload">
      <div className={`dt-upload-thumb ${value ? 'has-image' : ''}`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Uploaded photo preview" loading="lazy" />
        ) : (
          <span className="dt-upload-placeholder"><FaCamera aria-hidden="true" /> No photo</span>
        )}
        {busy && (
          <span className="dt-upload-overlay" role="status">
            <FaSpinner className="dt-spin" aria-hidden="true" /> Uploading…
          </span>
        )}
      </div>

      <div className="dt-upload-actions">
        {!disabled && (
          <>
            <button type="button" className="dt-upload-btn" onClick={() => inputRef.current?.click()} disabled={busy}>
              <FaUpload aria-hidden="true" /> {busy ? 'Uploading…' : value ? 'Replace photo' : label}
            </button>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleSelect} hidden />
          </>
        )}
        {!busy && value && !error && (
          <span className="dt-upload-ok"><FaCheckCircle aria-hidden="true" /> Saved</span>
        )}
        {!disabled && !value && !busy && (
          <span className="dt-upload-hint">Max 2 MB · larger photos are compressed automatically</span>
        )}
      </div>
      {error && <p className="dt-upload-error" role="alert">{error}</p>}
    </div>
  );
}

/* ── Generated report status ───────────────────────────────────────────────── */

/** Shows the stored report (or a legacy Google Drive link) in place of the old link input. */
export function StoredReportStatus({ url, title = 'Report', pendingText }) {
  if (!url) {
    return (
      <div className="dt-report-status is-pending">
        <FaFilePdf aria-hidden="true" />
        <div>
          <strong>{title} not attached yet</strong>
          <p>{pendingText || 'Generate the report above — it is saved and attached to your submission automatically.'}</p>
        </div>
      </div>
    );
  }
  const stored = isStoredFileUrl(url);
  return (
    <div className="dt-report-status is-done">
      <FaCheckCircle aria-hidden="true" />
      <div>
        <strong>{stored ? `${title} saved` : `${title} (previously submitted link)`}</strong>
        <p>{stored ? 'Attached to your submission. Regenerate the report above if you change anything.' : 'Generate the report above to replace this link with an attached PDF.'}</p>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="dt-report-open">
        Open <FaExternalLinkAlt aria-hidden="true" />
      </a>
    </div>
  );
}

/**
 * Upload a generated jsPDF document, then also give the student a local copy.
 * Returns the stored URL. Throws with a friendly message if the upload fails
 * (the local download still happens so no work is lost).
 */
export async function attachGeneratedPdf(doc, { day, purpose, filename }) {
  try {
    const stored = await uploadPdfDocument(doc, { day, purpose, filename });
    doc.save(filename);
    return stored.url;
  } catch (err) {
    doc.save(filename);
    throw new Error(`Your PDF was downloaded, but it couldn't be attached to your submission: ${err.message} Please try "Generate" again.`);
  }
}

/* ── MyGov certificates ───────────────────────────────────────────────────── */

/**
 * Students upload certificate photos/PDFs directly. Every change re-combines them
 * into one PDF on the server, stored as `mygovDriveLink` so evaluators get a single link.
 *
 * files     [{ url, name, type }]   (persisted as `mygovFiles`)
 * onChange  (field, value) => void  (the day's field setter)
 */
export function CertificateUploader({ day, files = [], bundleUrl = '', onChange, readOnly = false, expectedCount }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const list = Array.isArray(files) ? files : [];
  const legacyLink = bundleUrl && !isStoredFileUrl(bundleUrl) ? bundleUrl : '';

  const rebuildBundle = async (nextFiles) => {
    onChange('mygovFiles', nextFiles);
    if (nextFiles.length === 0) {
      onChange('mygovDriveLink', '');
      return;
    }
    setBusy('Combining certificates into one PDF…');
    const merged = await mergeUploadedFiles(nextFiles.map((f) => f.url), {
      day,
      purpose: 'mygov-certificates',
      title: `MyGov Certificates – Day ${day}`,
    });
    onChange('mygovDriveLink', merged.url);
  };

  const handleSelect = async (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    if (selected.length === 0) return;
    setError('');
    const uploaded = [];
    try {
      for (let i = 0; i < selected.length; i++) {
        const file = selected[i];
        setBusy(`Uploading ${i + 1} of ${selected.length}…`);
        const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
        const stored = isPdf
          ? await uploadPdf(file, { day, purpose: 'mygov-certificate', filename: file.name })
          : await uploadImage(file, { day, purpose: 'mygov-certificate' });
        uploaded.push({ url: stored.url, name: file.name || `Certificate ${list.length + uploaded.length}`, type: isPdf ? 'pdf' : 'image' });
      }
      await rebuildBundle([...list, ...uploaded]);
    } catch (err) {
      // Keep whatever did upload successfully
      if (uploaded.length) onChange('mygovFiles', [...list, ...uploaded]);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setBusy('');
    }
  };

  const removeFile = async (index) => {
    setError('');
    try {
      await rebuildBundle(list.filter((_, i) => i !== index));
    } catch (err) {
      setError(err.message || 'Could not update your certificates. Please try again.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="dt-cert-uploader">
      <div className="dt-cert-head">
        <strong>Upload your MyGov certificates – Day {day}</strong>
        <span>
          {list.length} uploaded{expectedCount ? ` · ${expectedCount} required` : ''}
        </span>
      </div>
      <p className="dt-cert-hint">
        Upload each certificate as a PDF (max 10 MB) or a clear photo/screenshot (max 2 MB, large photos are compressed automatically). They are combined into one PDF and attached to your submission automatically — no Google Drive link needed.
      </p>

      {legacyLink && list.length === 0 && (
        <p className="dt-cert-legacy">
          Previously submitted link: <a href={legacyLink} target="_blank" rel="noopener noreferrer">{legacyLink}</a>
        </p>
      )}

      {list.length > 0 && (
        <ul className="dt-cert-list">
          {list.map((f, i) => (
            <li key={f.url}>
              <span className="dt-cert-name">{f.type === 'pdf' ? <FaFilePdf aria-hidden="true" /> : <FaCamera aria-hidden="true" />} {f.name}</span>
              <a href={f.url} target="_blank" rel="noopener noreferrer">View</a>
              {!readOnly && (
                <button type="button" onClick={() => removeFile(i)} disabled={Boolean(busy)} aria-label={`Remove ${f.name}`}>
                  <FaTrash aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <>
          <button type="button" className="dt-upload-btn" onClick={() => inputRef.current?.click()} disabled={Boolean(busy)}>
            <FaUpload aria-hidden="true" /> {busy ? 'Please wait…' : list.length ? 'Add more certificates' : 'Upload certificates'}
          </button>
          <input ref={inputRef} type="file" accept="image/*,application/pdf" multiple onChange={handleSelect} hidden />
        </>
      )}

      {busy && <p className="dt-cert-busy" role="status"><FaSpinner className="dt-spin" aria-hidden="true" /> {busy}</p>}
      {error && <p className="dt-upload-error" role="alert">{error}</p>}

      {isStoredFileUrl(bundleUrl) && list.length > 0 && !busy && (
        <a className="dt-report-open" href={bundleUrl} target="_blank" rel="noopener noreferrer">
          <FaFilePdf aria-hidden="true" /> Open combined certificates PDF <FaExternalLinkAlt aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
