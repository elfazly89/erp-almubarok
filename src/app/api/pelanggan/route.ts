import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pelanggan } from "@/lib/db/schema";
import { like, or, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || searchParams.get("search");

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
    kode = `PLG-${String(countResult.length + 1).padStart(4, "0")}`;
  }

  const [newPelanggan] = await db
    .insert(pelanggan)
    .values({
      kode_pelanggan: kode,
      nama_lengkap: body.nama_lengkap,
      alamat: body.alamat || "-",
      telepon: body.telepon || "-",
      email: body.email || null,
      level_harga: body.level_harga ? parseInt(body.level_harga) : 1,
      total_poin: body.total_poin ? parseInt(body.total_poin) : 0,
    })
    .returning();

  return NextResponse.json(newPelanggan, { status: 201 });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id_pelanggan, nama_lengkap, email, alamat, telepon, level_harga, total_poin } = body;

    if (!id_pelanggan) {
      return NextResponse.json({ error: "ID Pelanggan wajib diisi" }, { status: 400 });
    }

    const [updatedPelanggan] = await db
      .update(pelanggan)
      .set({
        nama_lengkap,
        email: email || null,
        alamat: alamat || "-",
        telepon: telepon || "-",
        level_harga: level_harga ? parseInt(level_harga) : 1,
        total_poin: total_poin !== undefined ? parseInt(total_poin) : 0,
      })
      .where(eq(pelanggan.id_pelanggan, parseInt(id_pelanggan)))
      .returning();

    if (!updatedPelanggan) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(updatedPelanggan);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID Pelanggan wajib diisi" }, { status: 400 });
    }

    const [deletedPelanggan] = await db
      .delete(pelanggan)
      .where(eq(pelanggan.id_pelanggan, parseInt(id)))
      .returning();

    if (!deletedPelanggan) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: deletedPelanggan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
