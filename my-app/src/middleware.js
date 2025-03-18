import { NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/jwt";

export function middleware(req) {
  const token = req.cookies.get("accessToken")?.value;
  const pathname = req.nextUrl.pathname;

  // If the user is already logged in, prevent access to login/forgot-password
  if (token && (pathname === "/auth/login" || pathname === "/auth/forgot-password")) {
    try {
      const decoded = verifyAccessToken(token, true);
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
      const decoded = verifyAccessToken(token, true);
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
  matcher: ["/dashboard/:path*", "/auth/login", "/auth/forgot-password"],
};
