import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { izin_cuti, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const where = status ? eq(izin_cuti.status, status as "pending" | "approved" | "rejected") : undefined;

  const data = await db
    .select({
      id: izin_cuti.id,
      user_id: izin_cuti.user_id,
      jenis: izin_cuti.jenis,
      tanggal_mulai: izin_cuti.tanggal_mulai,
      tanggal_selesai: izin_cuti.tanggal_selesai,
      keterangan: izin_cuti.keterangan,
      status: izin_cuti.status,
      tanggal_pengajuan: izin_cuti.tanggal_pengajuan,
      catatan_approval: izin_cuti.catatan_approval,
      nama_user: users.nama_user,
    })
    .from(izin_cuti)
    .leftJoin(users, eq(izin_cuti.user_id, users.id))
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(sql`${izin_cuti.tanggal_pengajuan} DESC`);

  const [total] = await db
    .select({ count: sql<number>`count(*)` })
    .from(izin_cuti)
    .where(where);

  return NextResponse.json({ data, total: total.count });
}

export async function POST(request: Request) {
  const body = await request.json();
  const [newIzin] = await db.insert(izin_cuti).values(body).returning();
  return NextResponse.json(newIzin, { status: 201 });
}
