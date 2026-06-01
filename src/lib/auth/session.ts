import { cookies } from "next/headers";
import { verifyToken, TOKEN_COOKIE, type JWTPayload } from "@/lib/auth/jwt";

export async function getServerSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
