import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { barang } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  await db
    .update(barang)
    .set({
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
    .where(eq(barang.id_barang, parseInt(id)));
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await db.delete(barang).where(eq(barang.id_barang, parseInt(id)));
  return NextResponse.json({ success: true });
}
