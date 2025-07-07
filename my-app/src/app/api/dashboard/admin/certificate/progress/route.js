import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request) {
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
      error: 'Access denied. Only admins can access progress updates.',
    }, { status: 403 });
  }

  // Set up SSE headers
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Keep track of progress
      let currentBatch = 0;
      let totalBatches = 0;

      // Function to send progress updates
      const sendProgress = (batch, total) => {
        const data = {
          type: 'progress',
          currentBatch: batch,
          totalBatches: total
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Store the progress update function globally
      global.certificateProgress = sendProgress;

      // Clean up function
      return () => {
        delete global.certificateProgress;
        controller.close();
      };
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
} 