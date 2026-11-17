import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';

/**
 * Returns the decoded access token for the current request, or null when the
 * cookie is missing, expired or invalid. Never throws.
 */
export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return null;
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

/**
 * Admin guard for route handlers.
 *
 *   const auth = await requireAdmin();
 *   if (auth.error) return auth.error;
 *   // auth.user is the decoded admin token
 */
export async function requireAdmin() {
  const user = await getSession();
  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Authentication required. Please login again.' },
        { status: 401 }
      ),
    };
  }
  if (user.role !== 'admin') {
    return {
      error: NextResponse.json(
        { success: false, error: 'Access denied. Admins only.' },
        { status: 403 }
      ),
    };
  }
  return { user };
}
