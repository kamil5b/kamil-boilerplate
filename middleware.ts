import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(request: NextRequest) {
  // Skip middleware for public routes
  if (
    request.nextUrl.pathname.startsWith("/api/auth/") ||
    request.nextUrl.pathname === "/api/health"
  ) {
    return NextResponse.next();
  }

  // Check for protected routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        {
          message: "Authentication required",
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        { status: 401 }
      );
    }

    try {
      const secret = process.env.JWT_SECRET || "your-secret-key";
      jwt.verify(token, secret);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json(
        {
          message: "Invalid or expired token",
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
