import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';

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

/* ── Proxy login ("login as user") ─────────────────────────────────────────
 * When an admin proxies into another account, a separate httpOnly cookie holds a
 * signed admin refresh token. It lets the admin return to their own dashboard
 * without logging in again, and tells the UI to show the "Exit proxy" banner.
 */
export const PROXY_COOKIE = 'proxyAdminSession';
export const PROXY_COOKIE_MAX_AGE = 8 * 60 * 60; // 8 hours

export function proxyCookieOptions(maxAge = PROXY_COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}

/** The admin who started the current proxy session, or null. Never throws. */
export async function getProxyAdmin() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PROXY_COOKIE)?.value;
    if (!token) return null;
    const payload = await verifyRefreshToken(token);
    if (!payload || payload.role !== 'admin') return null;
    return { username: payload.username, name: payload.name };
  } catch {
    return null;
  }
}
