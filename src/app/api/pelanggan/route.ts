import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pelanggan } from "@/lib/db/schema";
import { like, or } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  const query = db.select().from(pelanggan);

  if (q) {
    const data = await query.where(
      or(
        like(pelanggan.nama_lengkap, `%${q}%`),
        like(pelanggan.kode_pelanggan, `%${q}%`),
        like(pelanggan.telepon, `%${q}%`)
      )
    );
    return NextResponse.json(data);
  }

  const data = await query.orderBy(pelanggan.nama_lengkap);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Auto-generate kode_pelanggan if not provided
  let kode = body.kode_pelanggan;
  if (!kode) {
    const countResult = await db.select().from(pelanggan);
    kode = `PLG-${String(countResult.length + 1).padStart(3, "0")}`;
  }

  const [newPelanggan] = await db
    .insert(pelanggan)
    .values({
      kode_pelanggan: kode,
      nama_lengkap: body.nama_lengkap,
      alamat: body.alamat || "-",
      telepon: body.telepon || "-",
      total_poin: body.total_poin ? parseInt(body.total_poin) : 0,
    })
    .returning();

  return NextResponse.json(newPelanggan, { status: 201 });
}
