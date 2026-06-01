import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kategori_barang } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  await db
    .update(kategori_barang)
    .set({
      kode_kategori: body.kode_kategori,
      nama_kategori: body.nama_kategori,
    })
    .where(eq(kategori_barang.id_kategori, parseInt(id)));
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await db.delete(kategori_barang).where(eq(kategori_barang.id_kategori, parseInt(id)));
  return NextResponse.json({ success: true });
}
