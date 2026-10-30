import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, TOKEN_COOKIE } from "@/lib/auth/jwt";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/app-settings"];

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  // Redirect logged-in users away from login page
  if (pathname === "/login" && token) {
    const payload = await verifyToken(token);
    if (payload) {
      const response = NextResponse.redirect(new URL("/dashboard", request.url));
      addSecurityHeaders(response);
      return response;
    }
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // Allow static files and public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (!token) {
    // If request is for an API, return 401 JSON instead of redirecting to login page
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      addSecurityHeaders(response);
      return response;
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    addSecurityHeaders(response);
    return response;
  }

  const payload = await verifyToken(token);

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json({ error: "Session expired" }, { status: 401 });
      addSecurityHeaders(response);
      return response;
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(TOKEN_COOKIE);
    addSecurityHeaders(response);
    return response;
  }

  // Attach user info to request headers for server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", String(payload.id));
  requestHeaders.set("x-user-name", payload.nama_user);
  requestHeaders.set("x-jabatan-id", String(payload.id_jabatan ?? ""));
  requestHeaders.set("x-cabang-id", String(payload.id_cabang ?? ""));

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  addSecurityHeaders(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
