'use client';
/**
 * Evaluator-side display of files students uploaded to server storage (RustFS).
 * Only used for new-style submissions whose links start with "/api/files/".
 * Older submissions with Google Drive links keep their original rendering.
 */
import { useState } from 'react';
import { FaFilePdf, FaExternalLinkAlt, FaDownload, FaEye, FaEyeSlash, FaImages } from 'react-icons/fa';
import { isStoredFileUrl } from '@/lib/uploads';
import './SubmissionFiles.css';

export { isStoredFileUrl };

/** A stored PDF: open / download / inline preview. */
export function StoredPdfCard({ url, label, meta }) {
  const [preview, setPreview] = useState(false);
  if (!isStoredFileUrl(url)) return null;
  return (
    <div className="sf-card">
      <div className="sf-card-row">
        <FaFilePdf className="sf-card-icon" aria-hidden="true" />
        <div className="sf-card-text">
          <strong>{label}</strong>
          <span>{meta || 'Uploaded to the portal'}</span>
        </div>
        <div className="sf-card-actions">
          <button type="button" className="sf-btn" onClick={() => setPreview((v) => !v)} aria-expanded={preview}>
            {preview ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />} {preview ? 'Hide' : 'Preview'}
          </button>
          <a className="sf-btn" href={url} target="_blank" rel="noopener noreferrer">
            <FaExternalLinkAlt aria-hidden="true" /> Open
          </a>
          <a className="sf-btn" href={`${url}?download=1`}>
            <FaDownload aria-hidden="true" /> Download
          </a>
        </div>
      </div>
      {preview && <iframe className="sf-pdf-frame" src={url} title={label} loading="lazy" />}
    </div>
  );
}

/** Thumbnails of stored photos with captions; click to open full size. */
export function StoredPhotoGallery({ title = 'Uploaded photos', photos = [] }) {
  const items = photos.filter((p) => isStoredFileUrl(p?.url));
  if (items.length === 0) return null;
  return (
    <div className="sf-gallery">
      <div className="sf-gallery-title"><FaImages aria-hidden="true" /> {title} ({items.length})</div>
      <div className="sf-gallery-grid">
        {items.map((p, i) => (
          <figure key={p.url + i} className="sf-photo">
            <a href={p.url} target="_blank" rel="noopener noreferrer" title="Open full size">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption || `Photo ${i + 1}`} loading="lazy" />
            </a>
            {(p.label || p.caption) && (
              <figcaption>
                {p.label && <strong>{p.label}</strong>}
                {p.caption && <span>{p.caption}</span>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </div>
  );
}

/** MyGov certificates: combined PDF + individual files. */
export function StoredCertificates({ bundleUrl, files = [] }) {
  if (!isStoredFileUrl(bundleUrl)) return null;
  const list = Array.isArray(files) ? files.filter((f) => isStoredFileUrl(f?.url)) : [];
  return (
    <div>
      <StoredPdfCard url={bundleUrl} label="MyGov Certificates" meta={list.length ? `${list.length} certificate${list.length === 1 ? '' : 's'} combined into one PDF` : undefined} />
      {list.length > 0 && (
        <ul className="sf-file-list">
          {list.map((f, i) => (
            <li key={f.url}>
              <a href={f.url} target="_blank" rel="noopener noreferrer">{f.name || `Certificate ${i + 1}`}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Extract photos from each day's task data ─────────────────────────────── */

export function surveyDayPhotos(data) {
  return (Array.isArray(data?.reportSlots) ? data.reportSlots : []).map((s, i) => ({
    url: s.image,
    label: s.name || `Photo ${i + 1}`,
    caption: s.description,
  }));
}

export function interventionPhotos(data) {
  return [
    ['coverPhoto', 'coverDesc', 'Cover photo'],
    ['photo2', 'photo2Desc', 'Photo 2'],
    ['photo3', 'photo3Desc', 'Photo 3'],
    ['photo4', 'photo4Desc', 'Photo 4'],
    ['photo5', 'photo5Desc', 'Photo 5'],
  ].map(([k, d, label]) => ({ url: data?.[k], label, caption: data?.[d] }));
}

export function caseStudyPhotos(data) {
  const answers = data?.generatorAnswers || {};
  return Object.keys(answers)
    .filter((k) => /__photo\d$/.test(k))
    .sort()
    .map((k) => {
      const parts = k.split('__'); // "<section>__<field>__photoN"
      const n = parts[parts.length - 1].replace('photo', '');
      const field = parts[parts.length - 2] === 'InterventionPhotos' ? 'Intervention' : parts[parts.length - 2];
      return { url: answers[k], label: `${field} – Photo ${n}`, caption: answers[k.replace(/photo(\d)$/, 'desc$1')] };
    });
}
