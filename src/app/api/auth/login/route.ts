import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, jabatan } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { comparePassword } from "@/lib/auth/password";
import { signToken, TOKEN_COOKIE } from "@/lib/auth/jwt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kode_user, password } = body;

    if (!kode_user || !password) {
      return NextResponse.json(
        { error: "Kode user dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Find user
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
      return NextResponse.json(
        { error: "Kode user atau password salah" },
        { status: 401 }
      );
    }

    if (user.status === "Non-Aktif") {
      return NextResponse.json(
        { error: "Akun Anda tidak aktif. Hubungi administrator." },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Kode user atau password salah" },
        { status: 401 }
      );
    }

    // Sign JWT
    const token = await signToken({
      id: user.id,
      kode_user: user.kode_user,
      nama_user: user.nama_user,
      id_jabatan: user.id_jabatan,
      id_cabang: user.id_cabang,
      jabatan: user.jabatan ?? undefined,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nama_user: user.nama_user,
        kode_user: user.kode_user,
        jabatan: user.jabatan,
      },
    });

    response.cookies.set(TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
