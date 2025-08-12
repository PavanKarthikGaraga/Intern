import { NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/jwt";

export async function middleware(req) {
  const pathname = req.nextUrl.pathname;

  // Allow access to public routes (homepage, register, etc.)
  if (pathname === '/' || pathname.startsWith('/register') || pathname.startsWith('/auth')) {
    // If user is already logged in and accessing login page, redirect to dashboard
    if (pathname === "/auth/login" || pathname === "/auth/forgot-password") {
      const token = req.cookies.get("accessToken")?.value;
      if (token) {
        try {
          const decoded = await verifyAccessToken(token, true);
          const userRole = decoded.role;
          return NextResponse.redirect(new URL(`/dashboard/${userRole}`, req.url));
        } catch (err) {
          // Token invalid, allow access to login
        }
      }
    }
    return NextResponse.next();
  }

  // Explicitly allow access to reportGenerator
  if (pathname.startsWith('/reportGenerator')) {
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
      // If token is invalid, redirect to login
      return NextResponse.redirect(new URL("/auth/login", req.url));
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

      if (!pathname.startsWith(expectedPath)) {
        return NextResponse.redirect(new URL(expectedPath, req.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
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
