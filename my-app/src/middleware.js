import { NextResponse } from "next/server";
import { verifyAccessToken } from "./lib/jwt"; // Now Edge-compatible

export function middleware(req) {
  const token = req.cookies.get("accessToken")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    const decoded = verifyAccessToken(token, true); // Pass true for middleware usage
    const userRole = decoded.role;

    if (!userRole) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    const pathname = req.nextUrl.pathname;
    const expectedPath = `/dashboard/${userRole}`;

    if (!pathname.startsWith(expectedPath)) {
      return NextResponse.redirect(new URL(expectedPath, req.url));
    }
  } catch (err) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
