import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/auth/jwt";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(TOKEN_COOKIE, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}
