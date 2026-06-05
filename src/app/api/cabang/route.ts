import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cabang, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

function generateRandomCode(length: number = 10): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
        latitude: cabang.latitude,
        longitude: cabang.longitude,
        data_kode: cabang.data_kode,
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
    const { kode_cabang, nama_cabang, alamat, telepon, email, admin, latitude, longitude } = body;

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

    // Generate unique 10-char alphanumeric code for data_kode
    let uniqueCode = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      uniqueCode = generateRandomCode(10);
      const existingCode = await db
        .select({ id: cabang.id_cabang })
        .from(cabang)
        .where(eq(cabang.data_kode, uniqueCode))
        .limit(1);
      if (existingCode.length === 0) {
        isUnique = true;
      }
      attempts++;
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
        latitude: latitude || null,
        longitude: longitude || null,
        data_kode: uniqueCode,
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
