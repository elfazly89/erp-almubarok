import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getErrorMessage } from "@/lib/utils";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { message: "Sesi Anda telah berakhir, silakan login kembali" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: "Semua kolom wajib diisi" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "Konfirmasi password baru tidak cocok" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: "Password baru minimal harus 6 karakter" },
        { status: 400 }
      );
    }

    // Fetch user record to check current password
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });

    if (!user) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Compare current password hash
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Password saat ini salah" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, session.id));

    return NextResponse.json({ message: "Password berhasil diubah!" });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal mengubah password", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
