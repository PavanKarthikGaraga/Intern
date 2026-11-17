import { NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/jwt";

function clearSession(response) {
  response.cookies.delete("accessToken");
  return response;
}

export async function middleware(req) {
  const pathname = req.nextUrl.pathname;

  // Explicitly allow access to reportGenerator and external APIs
  if (pathname.startsWith('/reportGenerator') || pathname.startsWith('/api/external')) {
    return NextResponse.next();
  }

  const token = req.cookies.get("accessToken")?.value;

  // Skip middleware for assets
  if (pathname.includes('_next') || pathname.includes('favicon.ico')) {
    return NextResponse.next();
  }

  // If the user is already logged in, prevent access to login/forgot-password
  if (token && (pathname === "/auth/login" || pathname === "/auth/forgot-password")) {
    try {
      const decoded = await verifyAccessToken(token, true);
      const userRole = decoded.role;
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, req.url));
    } catch (err) {
      // Expired/invalid token: clear it and show the page. Redirecting back to
      // /auth/login here would loop forever because the bad cookie is still set.
      return clearSession(NextResponse.next());
    }
  }

  // If the user is not logged in, prevent access to dashboard pages
  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // If the user is logged in but accessing the wrong dashboard, redirect them
  if (token && pathname.startsWith("/dashboard")) {
    try {
      const decoded = await verifyAccessToken(token, true);
      const userRole = decoded.role;
      const expectedPath = `/dashboard/${userRole}`;

      // Match the whole path segment: a plain startsWith would let a "student"
      // into /dashboard/studentLead.
      if (pathname !== expectedPath && !pathname.startsWith(`${expectedPath}/`)) {
        return NextResponse.redirect(new URL(expectedPath, req.url));
      }
    } catch (err) {
      return clearSession(NextResponse.redirect(new URL("/auth/login", req.url)));
    }
  }

  // Allow access if no redirection is required
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/auth/forgot-password",
    "/reportGenerator/:path*"
  ]
};
