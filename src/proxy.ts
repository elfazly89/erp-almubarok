import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, TOKEN_COOKIE } from "@/lib/auth/jwt";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(TOKEN_COOKIE);
    return response;
  }

  // Attach user info to request headers for server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", String(payload.id));
  requestHeaders.set("x-user-name", payload.nama_user);
  requestHeaders.set("x-jabatan-id", String(payload.id_jabatan ?? ""));
  requestHeaders.set("x-cabang-id", String(payload.id_cabang ?? ""));

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const proxyConfig = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
