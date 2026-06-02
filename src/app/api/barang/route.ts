import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { barang, kategori_barang, supplier } from "@/lib/db/schema";
import { like, or, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || searchParams.get("search");
  const barcode = searchParams.get("barcode");

  const query = db
    .select({
      id_barang: barang.id_barang,
      barcode: barang.barcode,
      nama_barang: barang.nama_barang,
      id_kategori: barang.id_kategori,
      nama_kategori: kategori_barang.nama_kategori,
      id_supplier: barang.id_supplier,
      nama_supplier: supplier.nama_supplier,
      satuan_1: barang.satuan_1,
      satuan_2: barang.satuan_2,
      satuan_3: barang.satuan_3,
      isi_1: barang.isi_1,
      isi_2: barang.isi_2,
      isi_3: barang.isi_3,
      harga_beli: barang.harga_beli,
      harga_rata: barang.harga_rata,
      harga_jual_1_1: barang.harga_jual_1_1,
      harga_jual_1_2: barang.harga_jual_1_2,
      harga_jual_1_3: barang.harga_jual_1_3,
      harga_jual_2_1: barang.harga_jual_2_1,
      harga_jual_2_2: barang.harga_jual_2_2,
      harga_jual_2_3: barang.harga_jual_2_3,
      harga_jual_3_1: barang.harga_jual_3_1,
      harga_jual_3_2: barang.harga_jual_3_2,
      harga_jual_3_3: barang.harga_jual_3_3,
      jual_rugi: barang.jual_rugi,
      status: barang.status,
      status_pajak: barang.status_pajak,
      keterangan_1: barang.keterangan_1,
      keterangan_2: barang.keterangan_2,
    })
    .from(barang)
    .leftJoin(kategori_barang, eq(barang.id_kategori, kategori_barang.id_kategori))
    .leftJoin(supplier, eq(barang.id_supplier, supplier.id_supplier));

  if (barcode) {
    const data = await query.where(eq(barang.barcode, barcode));
    return NextResponse.json(data);
  }

  if (q) {
    const data = await query.where(
      or(
        like(barang.nama_barang, `%${q}%`),
        like(barang.barcode, `%${q}%`)
      )
    );
    return NextResponse.json(data);
  }

  const data = await query.orderBy(barang.nama_barang);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [newBarang] = await db
    .insert(barang)
    .values({
      barcode: body.barcode,
      nama_barang: body.nama_barang,
      id_kategori: body.id_kategori ? parseInt(body.id_kategori) : null,
      id_supplier: body.id_supplier ? parseInt(body.id_supplier) : null,
      satuan_1: body.satuan_1 || null,
      satuan_2: body.satuan_2 || null,
      satuan_3: body.satuan_3 || null,
      isi_1: body.isi_1 ? parseInt(body.isi_1) : null,
      isi_2: body.isi_2 ? parseInt(body.isi_2) : null,
      isi_3: body.isi_3 ? parseInt(body.isi_3) : null,
      harga_beli: body.harga_beli ? parseInt(body.harga_beli) : null,
      harga_rata: body.harga_rata ? parseInt(body.harga_rata) : null,
      harga_jual_1_1: body.harga_jual_1_1 ? parseInt(body.harga_jual_1_1) : null,
      harga_jual_1_2: body.harga_jual_1_2 ? parseInt(body.harga_jual_1_2) : null,
      harga_jual_1_3: body.harga_jual_1_3 ? parseInt(body.harga_jual_1_3) : null,
      harga_jual_2_1: body.harga_jual_2_1 ? parseInt(body.harga_jual_2_1) : null,
      harga_jual_2_2: body.harga_jual_2_2 ? parseInt(body.harga_jual_2_2) : null,
      harga_jual_2_3: body.harga_jual_2_3 ? parseInt(body.harga_jual_2_3) : null,
      harga_jual_3_1: body.harga_jual_3_1 ? parseInt(body.harga_jual_3_1) : null,
      harga_jual_3_2: body.harga_jual_3_2 ? parseInt(body.harga_jual_3_2) : null,
      harga_jual_3_3: body.harga_jual_3_3 ? parseInt(body.harga_jual_3_3) : null,
      jual_rugi: body.jual_rugi ? parseInt(body.jual_rugi) : 0,
      status: body.status || "Aktif",
      status_pajak: body.status_pajak || null,
      keterangan_1: body.keterangan_1 || null,
      keterangan_2: body.keterangan_2 || null,
    })
    .returning();

  return NextResponse.json(newBarang, { status: 201 });
}
