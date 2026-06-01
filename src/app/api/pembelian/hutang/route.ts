import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supplier, bayar_hutang } from "@/lib/db/schema";
import { eq, desc, gt } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode"); // mode=history to fetch payment logs

  if (mode === "history") {
    const history = await db
      .select({
        id: bayar_hutang.id,
        nama_supplier: supplier.nama_supplier,
        tanggal_bayar: bayar_hutang.tanggal_bayar,
        jumlah_bayar: bayar_hutang.jumlah_bayar,
        metode_pembayaran: bayar_hutang.metode_pembayaran,
        keterangan: bayar_hutang.keterangan,
      })
      .from(bayar_hutang)
      .innerJoin(supplier, eq(bayar_hutang.id_supplier, supplier.id_supplier))
      .orderBy(desc(bayar_hutang.id));
    return NextResponse.json(history);
  }

  // Get suppliers with debt > 0
  const suppliersWithDebt = await db
    .select({
      id_supplier: supplier.id_supplier,
      nama_supplier: supplier.nama_supplier,
      alamat: supplier.alamat,
      telepon: supplier.telepon,
      hutang: supplier.hutang,
    })
    .from(supplier)
    .where(gt(supplier.hutang, 0))
    .orderBy(supplier.nama_supplier);

  return NextResponse.json(suppliersWithDebt);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { id_supplier, tanggal_bayar, jumlah_bayar, metode_pembayaran, keterangan } = body;

  const supplierId = parseInt(id_supplier);
  const payAmt = parseInt(jumlah_bayar);

  if (!supplierId || !payAmt || payAmt <= 0) {
    return NextResponse.json({ error: "Data pembayaran tidak valid" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Get supplier to check current debt
      const [sup] = await tx
        .select()
        .from(supplier)
        .where(eq(supplier.id_supplier, supplierId));

      if (!sup) {
        throw new Error("Supplier tidak ditemukan");
      }

      const currentDebt = sup.hutang || 0;
      if (payAmt > currentDebt) {
        throw new Error(`Jumlah bayar (${payAmt}) melebihi jumlah hutang (${currentDebt})`);
      }

      // 2. Insert bayar_hutang log
      const [newPayment] = await tx
        .insert(bayar_hutang)
        .values({
          id_supplier: supplierId,
          tanggal_bayar: tanggal_bayar,
          jumlah_bayar: payAmt,
          metode_pembayaran: metode_pembayaran || "Transfer",
          keterangan: keterangan || "",
        })
        .returning();

      // 3. Deduct debt from supplier table
      await tx
        .update(supplier)
        .set({
          hutang: currentDebt - payAmt,
        })
        .where(eq(supplier.id_supplier, supplierId));

      return { success: true, id_bayar: newPayment.id };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Gagal mencatat pembayaran hutang:", error);
    return NextResponse.json({ error: getErrorMessage(error) || "Gagal mencatat pembayaran" }, { status: 500 });
  }
}
