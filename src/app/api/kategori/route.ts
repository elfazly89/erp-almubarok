import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kategori_barang } from "@/lib/db/schema";

export async function GET() {
  const data = await db.select().from(kategori_barang).orderBy(kategori_barang.nama_kategori);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [newKategori] = await db
    .insert(kategori_barang)
    .values({
      kode_kategori: body.kode_kategori,
      nama_kategori: body.nama_kategori,
    })
    .returning();
  return NextResponse.json(newKategori, { status: 201 });
}
