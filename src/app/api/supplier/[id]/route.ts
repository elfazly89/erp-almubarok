import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supplier } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  await db
    .update(supplier)
    .set({
      nama_supplier: body.nama_supplier,
      alamat: body.alamat,
      telepon: body.telepon,
      email: body.email,
      bank: body.bank,
      no_rek_bank: body.no_rek_bank,
      hari_kunjungan: body.hari_kunjungan,
      periode_kunjungan: body.periode_kunjungan,
      status_pajak: body.status_pajak,
      npwp: body.npwp,
      keterangan_1: body.keterangan_1,
      keterangan_2: body.keterangan_2,
    })
    .where(eq(supplier.id_supplier, parseInt(id)));
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await db.delete(supplier).where(eq(supplier.id_supplier, parseInt(id)));
  return NextResponse.json({ success: true });
}
