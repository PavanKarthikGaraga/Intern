import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import JSZip from 'jszip';
import crypto from 'crypto';

// In-memory store for progress and zips (for demo; use Redis or DB for production)
globalThis.__zipProgressStore = globalThis.__zipProgressStore || {};
const zipProgressStore = globalThis.__zipProgressStore;

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');

    if (!accessToken?.value) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required. Please login again.' 
      }, { status: 401 });
    }

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only administrators can download certificates.' 
      }, { status: 403 });
    }

    const { usernames } = await request.json();

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usernames array is required and must not be empty' 
      }, { status: 400 });
    }

    // Generate a unique progress ID
    const progressId = crypto.randomBytes(16).toString('hex');
    zipProgressStore[progressId] = {
      total: usernames.length,
      current: 0,
      done: false,
      missingUsernames: [],
      found: 0,
      error: null,
      ready: false,
      file: null,
      startedAt: Date.now(),
    };

    // Start zip creation in background (async, not blocking response)
    (async () => {
      try {
        const zip = new JSZip();
        const batchSize = 50; // Fetch in batches to avoid SQL limits
        let found = 0;
        let missingUsernames = [];
        for (let i = 0; i < usernames.length; i += batchSize) {
          const batch = usernames.slice(i, i + batchSize);
          const placeholders = batch.map(() => '?').join(',');
          const [certificates] = await db.query(
            `SELECT username, pdf_data, uid FROM certificates WHERE username IN (${placeholders})`,
            batch
          );
          const foundUsernames = certificates.map(cert => cert.username);
          missingUsernames.push(...batch.filter(u => !foundUsernames.includes(u)));
          certificates.forEach(cert => {
            zip.file(`${cert.username}_certificate.pdf`, cert.pdf_data);
          });
          found += certificates.length;
          zipProgressStore[progressId].current = Math.min(i + batch.length, usernames.length);
          zipProgressStore[progressId].found = found;
          zipProgressStore[progressId].missingUsernames = missingUsernames;
        }
        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' }, (metadata) => {
          // Optionally update progress here if needed
        });
        zipProgressStore[progressId].file = zipBuffer;
        zipProgressStore[progressId].done = true;
        zipProgressStore[progressId].ready = true;
        zipProgressStore[progressId].finishedAt = Date.now();
      } catch (err) {
        zipProgressStore[progressId].error = err.message;
        zipProgressStore[progressId].done = true;
      }
    })();

    return NextResponse.json({ success: true, progressId });
  } catch (error) {
    console.error('Error starting certificates zip:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 