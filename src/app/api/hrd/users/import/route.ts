import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { inArray } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Format data tidak valid, diharapkan array." },
        { status: 400 }
      );
    }

    // Filter valid rows (kode_user, nama_user, no_hp wajib ada)
    const validRows = body.filter(
      (item) =>
        item &&
        typeof item.kode_user === "string" &&
        item.kode_user.trim() &&
        typeof item.nama_user === "string" &&
        item.nama_user.trim() &&
        typeof item.no_hp === "string" &&
        item.no_hp.trim()
    );

    if (validRows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data abdi valid untuk di-import." },
        { status: 400 }
      );
    }

    // Periksa apakah ada kode_user yang duplikat di database
    const codes = validRows.map((item) => item.kode_user.trim());
    const existingUsers = await db
      .select({ kode_user: users.kode_user })
      .from(users)
      .where(inArray(users.kode_user, codes));

    if (existingUsers.length > 0) {
      const existingCodes = existingUsers.map((u) => u.kode_user).join(", ");
      return NextResponse.json(
        { error: `Kode user berikut sudah terdaftar di database: ${existingCodes}` },
        { status: 409 }
      );
    }

    // Hash passwords in parallel
    const defaultPasswordHashed = await hashPassword("123456");

    const usersToInsert = await Promise.all(
      validRows.map(async (item) => {
        let passwordHashed = defaultPasswordHashed;
        if (item.password && String(item.password).trim().length >= 6) {
          passwordHashed = await hashPassword(String(item.password).trim());
        }

        return {
          kode_user: item.kode_user.trim(),
          nama_user: item.nama_user.trim(),
          tempat_lahir: item.tempat_lahir ? item.tempat_lahir.trim() : null,
          tanggal_lahir: item.tanggal_lahir ? item.tanggal_lahir.trim() : null,
          no_ktp: item.no_ktp ? String(item.no_ktp).trim() : null,
          pendidikan_terakhir: item.pendidikan_terakhir ? item.pendidikan_terakhir.trim() : null,
          riwayat_lembaga: item.riwayat_lembaga ? item.riwayat_lembaga.trim() : null,
          riwayat_pekerjaan: item.riwayat_pekerjaan ? item.riwayat_pekerjaan.trim() : null,
          status: item.status ? item.status.trim() : "Kontrak",
          no_hp: String(item.no_hp).trim(),
          id_jabatan: item.id_jabatan ? Number(item.id_jabatan) : null,
          id_cabang: item.id_cabang ? Number(item.id_cabang) : null,
          tanggal_masuk: item.tanggal_masuk ? item.tanggal_masuk.trim() : null,
          foto: item.foto ? item.foto.trim() : null,
          password: passwordHashed,
        };
      })
    );

    // Insert into DB
    const inserted = await db.insert(users).values(usersToInsert).returning({ id: users.id });

    return NextResponse.json(
      {
        message: `Berhasil mengimpor ${inserted.length} abdi baru.`,
        count: inserted.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error bulk importing users:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
