import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cabang, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function GET() {
  try {
    const list = await db
      .select({
        id_cabang: cabang.id_cabang,
        kode_cabang: cabang.kode_cabang,
        nama_cabang: cabang.nama_cabang,
        alamat: cabang.alamat,
        telepon: cabang.telepon,
        email: cabang.email,
        admin: cabang.admin,
        nama_admin: users.nama_user,
      })
      .from(cabang)
      .leftJoin(users, eq(cabang.admin, users.id))
      .orderBy(asc(cabang.nama_cabang));

    return NextResponse.json(list);
  } catch (error: unknown) {
    console.error("Gagal mengambil daftar cabang:", error);
    return NextResponse.json(
      { message: "Gagal mengambil daftar cabang", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kode_cabang, nama_cabang, alamat, telepon, email, admin } = body;

    if (!kode_cabang || !nama_cabang || !alamat) {
      return NextResponse.json(
        { message: "Kode cabang, nama cabang, dan alamat wajib diisi" },
        { status: 400 }
      );
    }

    // Periksa apakah kode cabang sudah terdaftar
    const existing = await db
      .select({ id_cabang: cabang.id_cabang })
      .from(cabang)
      .where(eq(cabang.kode_cabang, kode_cabang))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { message: `Kode cabang "${kode_cabang}" sudah terdaftar` },
        { status: 400 }
      );
    }

    const [newCabang] = await db
      .insert(cabang)
      .values({
        kode_cabang,
        nama_cabang,
        alamat,
        telepon: telepon || null,
        email: email || null,
        admin: admin ? parseInt(admin) : null,
      })
      .returning();

    return NextResponse.json(newCabang, { status: 201 });
  } catch (error: unknown) {
    console.error("Gagal membuat cabang baru:", error);
    return NextResponse.json(
      { message: "Gagal membuat cabang baru", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
