import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { absensi, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tanggal = searchParams.get("tanggal") || new Date().toISOString().split("T")[0];
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  const data = await db
    .select({
      id: absensi.id,
      user_id: absensi.user_id,
      tanggal: absensi.tanggal,
      jam: absensi.jam,
      jenis: absensi.jenis,
      shift: absensi.shift,
      latitude: absensi.latitude,
      longitude: absensi.longitude,
      status_lokasi: absensi.status_lokasi,
      catatan: absensi.catatan,
      created_at: absensi.created_at,
      nama_user: users.nama_user,
      kode_user: users.kode_user,
    })
    .from(absensi)
    .leftJoin(users, eq(absensi.user_id, users.id))
    .where(eq(absensi.tanggal, tanggal))
    .limit(limit)
    .offset(offset)
    .orderBy(absensi.jam);

  const [total] = await db
    .select({ count: sql<number>`count(*)` })
    .from(absensi)
    .where(eq(absensi.tanggal, tanggal));

  return NextResponse.json({ data, total: total.count });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, jenis, shift, latitude, longitude, status_lokasi, catatan } = body;

    const now = new Date();
    const tanggal = now.toISOString().split("T")[0];
    const jam = now.toTimeString().split(" ")[0];

    const [newAbsensi] = await db
      .insert(absensi)
      .values({
        user_id,
        tanggal,
        jam,
        jenis,
        shift,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        status_lokasi: status_lokasi || "valid",
        catatan,
      })
      .returning();

    return NextResponse.json({ success: true, data: newAbsensi }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan absensi" }, { status: 500 });
  }
}
