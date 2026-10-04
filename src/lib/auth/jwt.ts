import { SignJWT, jwtVerify } from "jose";

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is missing in production!");
}

const JWT_SECRET = new TextEncoder().encode(
  SECRET_KEY || "super_secret_key_erp_al_mubarok_2026_abdi_priyayi"
);

export interface JWTPayload {
  id: number;
  kode_user: string;
  nama_user: string;
  id_jabatan: number | null;
  id_cabang: number | null;
  jabatan?: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("erp-almubarok-api")
    .setAudience("erp-almubarok-web")
    .setExpirationTime("8h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "erp-almubarok-api",
      audience: "erp-almubarok-web",
    });
    return payload as unknown as JWTPayload;
  } catch (err) {
    console.error("NextJS JWT verification failed:", err);
    return null;
  }
}

export const TOKEN_COOKIE = "erp_token";
