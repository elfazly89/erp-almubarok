import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { db } from "../lib/db";
import { users, jabatan, pengaturan_aplikasi } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { comparePassword } from "../lib/auth/password";
import {
  signToken,
  TOKEN_COOKIE,
  generateRefreshToken,
  getRefreshTokenExpiry,
} from "../lib/auth/jwt";

export const authRoutes = new Hono();

// In-memory brute-force protection
interface LoginAttempt {
  attempts: number;
  lockUntil: number | null;
}
const loginAttempts = new Map<string, LoginAttempt>();
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 menit

function handleRateLimit(kode_user: string): { allowed: boolean; remainingMinutes?: number } {
  const record = loginAttempts.get(kode_user);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.lockUntil && record.lockUntil > now) {
    const remainingMs = record.lockUntil - now;
    return { allowed: false, remainingMinutes: Math.ceil(remainingMs / 60000) };
  }

  // Jika waktu lock sudah lewat, reset record
  if (record.lockUntil && record.lockUntil <= now) {
    loginAttempts.delete(kode_user);
  }

  return { allowed: true };
}

function recordFailure(kode_user: string) {
  const record = loginAttempts.get(kode_user) || { attempts: 0, lockUntil: null };
  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockUntil = Date.now() + LOCK_TIME_MS;
  }

  loginAttempts.set(kode_user, record);
}

function recordSuccess(kode_user: string) {
  loginAttempts.delete(kode_user);
}

// ==========================================
// LOGIN — Web (cookie-based, 8h)
// ==========================================
authRoutes.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const { kode_user, password } = body;

    if (!kode_user || !password) {
      return c.json({ error: "Kode user dan password wajib diisi" }, 400);
    }

    // Input length validation
    if (kode_user.length > 50 || password.length > 128) {
      return c.json({ error: "Format input tidak valid" }, 400);
    }

    // Check rate limit
    const limitCheck = handleRateLimit(kode_user);
    if (!limitCheck.allowed) {
      return c.json(
        { error: `Terlalu banyak percobaan login. Akun dikunci. Coba lagi dalam ${limitCheck.remainingMinutes} menit.` },
        429
      );
    }

    const result = await db
      .select({
        id: users.id,
        kode_user: users.kode_user,
        nama_user: users.nama_user,
        password: users.password,
        id_jabatan: users.id_jabatan,
        id_cabang: users.id_cabang,
        status: users.status,
        jabatan: jabatan.jabatan,
      })
      .from(users)
      .leftJoin(jabatan, eq(users.id_jabatan, jabatan.id_jabatan))
      .where(eq(users.kode_user, kode_user))
      .limit(1);

    const user = result[0];

    if (!user) {
      recordFailure(kode_user);
      return c.json({ error: "Kode user atau password salah" }, 401);
    }

    if (user.status === "Non-Aktif") {
      return c.json({ error: "Akun Anda tidak aktif. Hubungi administrator." }, 403);
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      recordFailure(kode_user);
      return c.json({ error: "Kode user atau password salah" }, 401);
    }

    // Reset attempts on success
    recordSuccess(kode_user);

    const token = await signToken(
      {
        id: user.id,
        kode_user: user.kode_user,
        nama_user: user.nama_user,
        id_jabatan: user.id_jabatan,
        id_cabang: user.id_cabang,
        jabatan: user.jabatan ?? undefined,
      },
      "8h"
    );

    setCookie(c, TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    return c.json({
      success: true,
      user: {
        id: user.id,
        nama_user: user.nama_user,
        kode_user: user.kode_user,
        jabatan: user.jabatan,
      },
      // Hapus token dari JSON body untuk web client demi keamanan (HttpOnly cookie sudah cukup)
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Terjadi kesalahan server" }, 500);
  }
});

// ==========================================
// MOBILE LOGIN — access_token (1h) + refresh_token (30d)
// Untuk React Native / Mobile App
// ==========================================
authRoutes.post("/mobile-login", async (c) => {
  try {
    const body = await c.req.json();
    const { kode_user, password } = body;

    if (!kode_user || !password) {
      return c.json({ error: "Kode user dan password wajib diisi" }, 400);
    }

    // Input length validation
    if (kode_user.length > 50 || password.length > 128) {
      return c.json({ error: "Format input tidak valid" }, 400);
    }

    // Check rate limit
    const limitCheck = handleRateLimit(kode_user);
    if (!limitCheck.allowed) {
      return c.json(
        { error: `Terlalu banyak percobaan login. Akun dikunci. Coba lagi dalam ${limitCheck.remainingMinutes} menit.` },
        429
      );
    }

    const result = await db
      .select({
        id: users.id,
        kode_user: users.kode_user,
        nama_user: users.nama_user,
        foto: users.foto,
        password: users.password,
        id_jabatan: users.id_jabatan,
        id_cabang: users.id_cabang,
        status: users.status,
        jabatan: jabatan.jabatan,
      })
      .from(users)
      .leftJoin(jabatan, eq(users.id_jabatan, jabatan.id_jabatan))
      .where(eq(users.kode_user, kode_user))
      .limit(1);

    const user = result[0];

    if (!user) {
      recordFailure(kode_user);
      return c.json({ error: "Kode user atau password salah" }, 401);
    }

    if (user.status === "Non-Aktif") {
      return c.json({ error: "Akun Anda tidak aktif. Hubungi administrator." }, 403);
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      recordFailure(kode_user);
      return c.json({ error: "Kode user atau password salah" }, 401);
    }

    // Reset attempts on success
    recordSuccess(kode_user);

    const payload = {
      id: user.id,
      kode_user: user.kode_user,
      nama_user: user.nama_user,
      id_jabatan: user.id_jabatan,
      id_cabang: user.id_cabang,
      jabatan: user.jabatan ?? undefined,
    };

    // Access token lebih singkat (1h) untuk mobile
    const accessToken = await signToken(payload, "1h");
    const refreshToken = generateRefreshToken();
    const refreshTokenExpires = getRefreshTokenExpiry();

    // Simpan refresh token di database
    await db
      .update(users)
      .set({
        refresh_token: refreshToken,
        refresh_token_expires: refreshTokenExpires,
        updated_at: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return c.json({
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600, // 1 jam dalam detik
      user: {
        id: user.id,
        nama_user: user.nama_user,
        kode_user: user.kode_user,
        jabatan: user.jabatan,
        foto: user.foto,
        id_cabang: user.id_cabang,
      },
    });
  } catch (error) {
    console.error("Mobile login error:", error);
    return c.json({ error: "Terjadi kesalahan server" }, 500);
  }
});

// ==========================================
// REFRESH TOKEN — Tukar refresh token lama dengan access token baru
// Gunakan dari mobile saat access_token sudah expired
// ==========================================
authRoutes.post("/refresh", async (c) => {
  try {
    const body = await c.req.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return c.json({ error: "Refresh token wajib diisi" }, 400);
    }

    const result = await db
      .select({
        id: users.id,
        kode_user: users.kode_user,
        nama_user: users.nama_user,
        id_jabatan: users.id_jabatan,
        id_cabang: users.id_cabang,
        status: users.status,
        refresh_token: users.refresh_token,
        refresh_token_expires: users.refresh_token_expires,
        jabatan: jabatan.jabatan,
      })
      .from(users)
      .leftJoin(jabatan, eq(users.id_jabatan, jabatan.id_jabatan))
      .where(eq(users.refresh_token, refresh_token))
      .limit(1);

    const user = result[0];

    if (!user) {
      return c.json({ error: "Refresh token tidak valid" }, 401);
    }

    if (user.status === "Non-Aktif") {
      return c.json({ error: "Akun tidak aktif" }, 403);
    }

    // Cek apakah refresh token sudah kadaluarsa
    if (!user.refresh_token_expires || new Date(user.refresh_token_expires) < new Date()) {
      await db
        .update(users)
        .set({ refresh_token: null, refresh_token_expires: null })
        .where(eq(users.id, user.id));
      return c.json({ error: "Refresh token sudah kadaluarsa. Silakan login ulang." }, 401);
    }

    // Issue access token baru (1 jam)
    const newAccessToken = await signToken(
      {
        id: user.id,
        kode_user: user.kode_user,
        nama_user: user.nama_user,
        id_jabatan: user.id_jabatan,
        id_cabang: user.id_cabang,
        jabatan: user.jabatan ?? undefined,
      },
      "1h"
    );

    // Rotate refresh token untuk keamanan tambahan
    const newRefreshToken = generateRefreshToken();
    const newRefreshExpires = getRefreshTokenExpiry();

    await db
      .update(users)
      .set({
        refresh_token: newRefreshToken,
        refresh_token_expires: newRefreshExpires,
        updated_at: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return c.json({
      success: true,
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 3600,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return c.json({ error: "Terjadi kesalahan server" }, 500);
  }
});

// ==========================================
// LOGOUT — Hapus cookie dan invalidasi refresh token
// ==========================================
authRoutes.post("/logout", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    if (body.refresh_token) {
      await db
        .update(users)
        .set({ refresh_token: null, refresh_token_expires: null })
        .where(eq(users.refresh_token, body.refresh_token));
    }
  } catch {
    // ignore body parse error
  }
  deleteCookie(c, TOKEN_COOKIE, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    httpOnly: true,
  });
  return c.json({ success: true });
});

// ==========================================
// PUBLIC APP SETTINGS
// ==========================================
authRoutes.get("/app-settings", async (c) => {
  try {
    const settings = await db.select().from(pengaturan_aplikasi);
    const config: Record<string, string> = {
      app_name: "ERP Al-Mubarok",
      company_name: "Yayasan Al-Mubarok",
    };
    for (const item of settings) {
      config[item.key] = item.value;
    }
    return c.json({ success: true, data: config });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
