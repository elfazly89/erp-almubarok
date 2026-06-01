import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supplier } from "@/lib/db/schema";

export async function GET() {
  const data = await db.select().from(supplier).orderBy(supplier.nama_supplier);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [newSupplier] = await db
    .insert(supplier)
    .values({
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
    .returning();
  return NextResponse.json(newSupplier, { status: 201 });
}
