import { Hono } from "hono";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { comparePassword, hashPassword } from "../lib/auth/password";
import { JWTPayload } from "../lib/auth/jwt";

export const userRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

userRoutes.get("/me", (c) => {
  const payload = c.get("user");
  return c.json({ success: true, user: payload });
});

// ==========================================
// UBAH PASSWORD
// ==========================================
userRoutes.put("/change-password", async (c) => {
  try {
    const payload = c.get("user");
    if (!payload || !payload.id) {
      return c.json({ message: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return c.json({ message: "Semua kolom wajib diisi" }, 400);
    }

    if (newPassword !== confirmPassword) {
      return c.json({ message: "Konfirmasi password baru tidak cocok" }, 400);
    }

    // Kebijakan Kompleksitas Password:
    // - Minimal 8 karakter
    // - Harus mengandung minimal satu huruf besar (A-Z)
    // - Harus mengandung minimal satu huruf kecil (a-z)
    // - Harus mengandung minimal satu angka (0-9)
    // - Harus mengandung minimal satu karakter khusus/simbol
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!complexityRegex.test(newPassword)) {
      return c.json(
        {
          message:
            "Password baru minimal 8 karakter dan harus mengandung kombinasi huruf besar, huruf kecil, angka, serta simbol (@$!%*?&).",
        },
        400
      );
    }

    // Ambil data user dari database untuk mendapatkan password hash saat ini
    const result = await db
      .select({
        id: users.id,
        password: users.password,
      })
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    const user = result[0];
    if (!user) {
      return c.json({ message: "User tidak ditemukan" }, 404);
    }

    // Verifikasi password saat ini
    const isCurrentValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentValid) {
      return c.json({ message: "Password saat ini salah" }, 400);
    }

    // Pastikan password baru tidak sama dengan password saat ini
    const isSameAsCurrent = await comparePassword(newPassword, user.password);
    if (isSameAsCurrent) {
      return c.json({ message: "Password baru tidak boleh sama dengan password saat ini" }, 400);
    }

    // Hash password baru dan update
    const hashed = await hashPassword(newPassword);
    await db
      .update(users)
      .set({
        password: hashed,
        updated_at: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    return c.json({ success: true, message: "Password berhasil diperbarui" });
  } catch (error) {
    console.error("Change password error:", error);
    return c.json({ message: "Terjadi kesalahan server" }, 500);
  }
});
