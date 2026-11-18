/**
 * Object storage (RustFS — S3-compatible) for student uploads.
 *
 * Server-only. Configure in .env:
 *   S3_ENDPOINT          e.g. http://127.0.0.1:9000
 *   S3_ACCESS_KEY
 *   S3_SECRET_KEY
 *   S3_BUCKET            default: uploads
 *   S3_REGION            default: us-east-1 (RustFS ignores it, the SDK requires one)
 *   S3_FORCE_PATH_STYLE  default: true (required for RustFS)
 *
 * Files are never served from RustFS directly; they are streamed through the
 * authenticated /api/files/[...key] route so access control stays in the app.
 */
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const env = (name) => process.env[`S3_${name}`] || process.env[`RUSTFS_${name}`] || '';
const BUCKET = env('BUCKET') || 'uploads';

/** Public URL prefix used by the app for stored files. */
export const FILE_URL_PREFIX = '/api/files/';

export function isStorageConfigured() {
  return Boolean(env('ENDPOINT') && env('ACCESS_KEY') && env('SECRET_KEY'));
}

let client = null;
function getClient() {
  if (!isStorageConfigured()) {
    throw new StorageNotConfiguredError();
  }
  if (!client) {
    client = new S3Client({
      endpoint: env('ENDPOINT'),
      region: env('REGION') || 'us-east-1',
      credentials: {
        accessKeyId: env('ACCESS_KEY'),
        secretAccessKey: env('SECRET_KEY'),
      },
      // RustFS (like MinIO) addresses buckets by path, not by sub-domain
      forcePathStyle: env('FORCE_PATH_STYLE') !== 'false',
      // Newer AWS SDKs add CRC checksums / chunked uploads by default, which
      // S3-compatible servers don't always accept. Only send them when required.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }
  return client;
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super('File storage is not configured on the server (S3_* environment variables are missing).');
    this.name = 'StorageNotConfiguredError';
  }
}

// Create the bucket once per process if it doesn't exist yet.
let bucketReady = null;
async function ensureBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const s3 = getClient();
      try {
        await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
      } catch (err) {
        const status = err?.$metadata?.httpStatusCode;
        if (status === 404 || err?.name === 'NotFound' || err?.name === 'NoSuchBucket') {
          await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
        } else {
          throw err;
        }
      }
    })().catch((err) => {
      bucketReady = null; // retry on the next call instead of caching the failure
      throw err;
    });
  }
  return bucketReady;
}

export async function putObject(key, body, contentType, metadata = {}) {
  await ensureBucket();
  await getClient().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: body.length,
      Metadata: metadata,
    })
  );
  return { key, url: fileUrl(key) };
}

/** Returns { body: ReadableStream|Readable, contentType, contentLength } or null if missing. */
export async function getObject(key) {
  try {
    const res = await getClient().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return {
      body: res.Body,
      contentType: res.ContentType || 'application/octet-stream',
      contentLength: res.ContentLength,
      lastModified: res.LastModified,
    };
  } catch (err) {
    const status = err?.$metadata?.httpStatusCode;
    if (status === 404 || err?.name === 'NoSuchKey' || err?.name === 'NotFound') return null;
    throw err;
  }
}

/** Reads a whole object into a Buffer (used for server-side PDF merging). */
export async function getObjectBuffer(key) {
  const obj = await getObject(key);
  if (!obj) return null;
  const bytes = await obj.body.transformToByteArray();
  // Copy into a standalone ArrayBuffer starting at offset 0. Small Buffers are often
  // slices of Node's shared memory pool, and pdf-lib's JPEG parser reads the underlying
  // ArrayBuffer from position 0 (ignoring byteOffset), which breaks small images.
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return { buffer: Buffer.from(copy.buffer), contentType: obj.contentType };
}

export async function deleteObject(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export function fileUrl(key) {
  return FILE_URL_PREFIX + key.split('/').map(encodeURIComponent).join('/');
}

/** Extracts the storage key from an app file URL, or null if it isn't one. */
export function keyFromFileUrl(url) {
  if (typeof url !== 'string' || !url.startsWith(FILE_URL_PREFIX)) return null;
  try {
    return url
      .slice(FILE_URL_PREFIX.length)
      .split('/')
      .map(decodeURIComponent)
      .join('/');
  } catch {
    return null;
  }
}

/**
 * Storage keys are always namespaced per student:
 *   students/<username>/day<N>/<purpose>/<timestamp>-<random>.<ext>
 * Username and purpose are sanitised so they can never escape the prefix.
 */
export function studentKey(username, { day, purpose, ext }) {
  const safeUser = String(username).replace(/[^A-Za-z0-9@._-]/g, '_');
  const safePurpose = String(purpose || 'file').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40) || 'file';
  const safeDay = Number.isInteger(day) && day >= 1 && day <= 7 ? `day${day}` : 'misc';
  const rand = Math.random().toString(36).slice(2, 10);
  return `students/${safeUser}/${safeDay}/${safePurpose}/${Date.now()}-${rand}.${ext}`;
}

export function studentPrefix(username) {
  return `students/${String(username).replace(/[^A-Za-z0-9@._-]/g, '_')}/`;
}
