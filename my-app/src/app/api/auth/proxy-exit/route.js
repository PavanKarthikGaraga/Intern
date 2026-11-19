/**
 * POST /api/auth/proxy-exit — end an admin "proxy login" session and restore the
 * admin's own session, so they land back on /dashboard/admin instead of the login page.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateAuthTokens } from '@/lib/jwt';
import { getProxyAdmin, getSession, PROXY_COOKIE } from '@/lib/auth';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge,
});

export async function POST() {
  const cookieStore = await cookies();
  const admin = await getProxyAdmin();
  const proxied = await getSession(); // the account being viewed (may have expired)

  if (!admin) {
    // No valid return ticket (expired after 8 h, or never proxied): sign out cleanly.
    cookieStore.delete({ name: PROXY_COOKIE, path: '/' });
    cookieStore.delete({ name: 'accessToken', path: '/' });
    cookieStore.delete({ name: 'refreshToken', path: '/' });
    return NextResponse.json(
      { success: false, error: 'Your admin session has expired. Please log in again.', redirectTo: '/auth/login' },
      { status: 401 }
    );
  }

  const { accessToken, refreshToken } = await generateAuthTokens({
    username: admin.username,
    name: admin.name,
    role: 'admin',
  });
  cookieStore.set('accessToken', accessToken, cookieOptions(8 * 60 * 60));
  cookieStore.set('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60));
  cookieStore.delete({ name: PROXY_COOKIE, path: '/' });

  logActivity({
    action: 'ADMIN_PROXY_EXIT',
    actorUsername: admin.username,
    actorName: admin.name,
    actorRole: 'admin',
    targetUsername: proxied?.username,
    details: { targetRole: proxied?.role },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    redirectTo: '/dashboard/admin',
    user: { username: admin.username, name: admin.name, role: 'admin' },
  });
}
