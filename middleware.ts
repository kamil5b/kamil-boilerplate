import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Public routes that don't require authentication
const publicRoutes = ["/login", "/register"];
// Routes that should redirect to dashboard if already authenticated
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") && !pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }
  
  // Public API routes don't need authentication (routes in (public)/api group)
  // Note: Next.js route groups like (public) don't appear in the URL path
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Get token from cookie or authorization header
  const tokenFromCookie = request.cookies.get("auth_token")?.value;
  const tokenFromHeader = request.headers.get("authorization")?.replace("Bearer ", "");
  const token = tokenFromCookie || tokenFromHeader;

  let isAuthenticated = false;
  let decodedToken: JWTPayload | null = null;

  // Verify token if it exists
  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
      decodedToken = jwt.verify(token, secret) as JWTPayload;
      isAuthenticated = true;
    } catch (error) {
      // Token is invalid, treat as not authenticated
      isAuthenticated = false;
    }
  }

  // Handle page routes
  if (!pathname.startsWith("/api/")) {
    // If user is authenticated and trying to access auth routes (login/register)
    if (isAuthenticated && authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If user is not authenticated and trying to access protected routes
    if (!isAuthenticated && !publicRoutes.includes(pathname) && pathname !== "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  // Handle private API routes (all routes in (private)/api group require JWT)
  // Note: Route groups don't appear in the URL, so all /api/* routes except /api/auth/* are private
  if (pathname.startsWith("/api/")) {
    // All other API routes require authentication
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

    if (!isAuthenticated || !decodedToken) {
      return NextResponse.json(
        {
          message: "Invalid or expired token",
          requestedAt: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
        { status: 401 }
      );
    }

    // Create response with user info in headers for private API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", decodedToken.userId);
    requestHeaders.set("x-user-email", decodedToken.email);
    requestHeaders.set("x-user-role", decodedToken.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
