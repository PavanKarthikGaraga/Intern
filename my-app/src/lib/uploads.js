/**
 * Browser-side helpers for uploading student files to RustFS via /api/uploads.
 *
 * Photos are compressed in the browser first (max 1600px, JPEG) so mobile uploads
 * stay small and fast; the server re-encodes again as a safety net. Only the short
 * file URL ("/api/files/…") is kept in form state and saved to the database — never
 * base64 — so photos survive reloads, app switching and device changes.
 */

const FILE_URL_PREFIX = '/api/files/';
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const SKIP_COMPRESSION_BELOW = 400 * 1024; // small JPEGs are uploaded as-is

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB per photo (after compression)
export const MAX_PDF_BYTES = 10 * 1024 * 1024;  // 10 MB per PDF

const mb = (bytes) => (bytes / 1048576).toFixed(1);

export function isStoredFileUrl(value) {
  return typeof value === 'string' && value.startsWith(FILE_URL_PREFIX);
}

export function isBase64Image(value) {
  return typeof value === 'string' && value.startsWith('data:image');
}

/* ── Compression ───────────────────────────────────────────────────────────── */

function decodeWithImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const timer = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error('Image decode timed out'));
    }, 20000);
    img.onload = () => {
      clearTimeout(timer);
      resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight, cleanup: () => URL.revokeObjectURL(url) });
    };
    img.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      reject(new Error('Image could not be decoded'));
    };
    img.src = url;
  });
}

async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close?.() };
    } catch {
      /* fall through to <img> decoding */
    }
  }
  return decodeWithImageElement(file);
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))), 'image/jpeg', quality);
  });
}

/**
 * Downscale and re-encode a photo to JPEG. Returns a Blob, or the original file
 * when the browser can't decode it (e.g. HEIC on Android) — the server handles those.
 */
export async function compressImage(file) {
  if (file.size <= SKIP_COMPRESSION_BELOW && file.type === 'image/jpeg') return file;

  let decoded;
  try {
    decoded = await decodeImage(file);
  } catch {
    return file;
  }

  try {
    // Try progressively smaller/lower-quality encodings until the photo is
    // comfortably under the 2 MB limit.
    const attempts = [
      [MAX_DIMENSION, JPEG_QUALITY],
      [MAX_DIMENSION, 0.7],
      [1280, 0.7],
      [1024, 0.6],
    ];
    let best = null;
    for (const [maxDim, quality] of attempts) {
      const scale = Math.min(1, maxDim / Math.max(decoded.width, decoded.height));
      const w = Math.max(1, Math.round(decoded.width * scale));
      const h = Math.max(1, Math.round(decoded.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; // transparent PNG areas become white, not black
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(decoded.source, 0, 0, w, h);
      best = await canvasToBlob(canvas, quality);
      if (best.size <= 1.2 * 1024 * 1024) break;
    }
    // Never upload something bigger than the original
    return best && best.size < file.size ? best : file;
  } catch {
    return file;
  } finally {
    decoded.cleanup?.();
  }
}

/* ── Upload ────────────────────────────────────────────────────────────────── */

function friendlyError(status, serverMessage) {
  if (serverMessage) return serverMessage;
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 413) return 'This file is too large. Photos must be under 2 MB and PDFs under 10 MB.';
  if (status === 415) return 'Unsupported file type. Please upload a JPG/PNG photo or a PDF.';
  return 'Upload failed. Please check your connection and try again.';
}

/**
 * Upload a File/Blob. Retries network failures and server errors (not 4xx).
 * Resolves to { url, key, size, contentType }.
 */
export async function uploadFile(file, { day, purpose = 'file', filename } = {}) {
  const name = filename || file.name || (file.type === 'application/pdf' ? 'document.pdf' : 'photo.jpg');
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const form = new FormData();
    form.append('file', file, name);
    if (day) form.append('day', String(day));
    form.append('purpose', purpose);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.url) return data;

      const error = new Error(friendlyError(res.status, data.error));
      error.status = res.status;
      if (res.status >= 400 && res.status < 500) throw error; // don't retry client errors
      lastError = error;
    } catch (err) {
      if (err.status >= 400 && err.status < 500) throw err;
      lastError = err.name === 'AbortError'
        ? new Error('Upload timed out. Please check your connection and try again.')
        : err.message ? err : new Error(friendlyError(0));
    } finally {
      clearTimeout(timer);
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1200 * attempt));
  }
  throw lastError || new Error(friendlyError(0));
}

/** Compress (if possible) then upload a photo. Resolves to { url, ... }. */
export async function uploadImage(file, { day, purpose = 'photo' } = {}) {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name || '')) {
    throw new Error('Please choose a photo (JPG, PNG or WebP).');
  }
  const compressed = await compressImage(file);
  if (compressed.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `This photo is ${mb(file.size)} MB and couldn't be compressed below the 2 MB limit. ` +
      'Please choose a smaller photo, or take a screenshot of it and upload that.'
    );
  }
  const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '');
  return uploadFile(compressed, { day, purpose, filename: `${baseName}.jpg` });
}

/** Upload a generated jsPDF document. Resolves to { url, ... }. */
export async function uploadPdfDocument(doc, { day, purpose = 'report', filename = 'report.pdf' } = {}) {
  const blob = doc.output('blob');
  return uploadPdf(blob, { day, purpose, filename });
}

/** Upload a PDF file/blob after checking the 10 MB limit. */
export async function uploadPdf(file, { day, purpose = 'document', filename } = {}) {
  if (file.size > MAX_PDF_BYTES) {
    throw new Error(`This PDF is ${mb(file.size)} MB. The maximum is 10 MB — please reduce its size and try again.`);
  }
  return uploadFile(file, { day, purpose, filename: filename || file.name || 'document.pdf' });
}

/** Combine previously-uploaded files into one PDF on the server. */
export async function mergeUploadedFiles(urls, { day, purpose = 'combined', title } = {}) {
  const res = await fetch('/api/uploads/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ urls, day, purpose, title }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(friendlyError(res.status, data.error));
  return data;
}

/* ── PDF generation support ───────────────────────────────────────────────── */

const dataUrlCache = new Map();

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * jsPDF needs image bytes, so stored photo URLs are fetched and converted to
 * data URLs right before generating. Base64 values pass through unchanged.
 */
export async function loadImageDataUrl(src) {
  if (!src) return null;
  if (isBase64Image(src)) return src;
  if (dataUrlCache.has(src)) return dataUrlCache.get(src);

  const res = await fetch(src, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`Could not load a stored photo (${res.status}). Please re-upload it.`);
  const dataUrl = await blobToDataUrl(await res.blob());
  dataUrlCache.set(src, dataUrl);
  return dataUrl;
}

/** Resolve many photo sources at once. Returns a lookup function src → data URL. */
export async function preloadImagesForPdf(sources) {
  const unique = [...new Set(sources.filter(Boolean))];
  const resolved = await Promise.all(unique.map(async (src) => [src, await loadImageDataUrl(src)]));
  const map = new Map(resolved);
  return (src) => (src ? map.get(src) || null : null);
}
