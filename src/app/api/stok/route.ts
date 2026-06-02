import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { stok_barang, barang, kategori_barang, supplier, cabang } from "@/lib/db/schema";
import { verifyToken, TOKEN_COOKIE } from "@/lib/auth/jwt";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paramCabang = searchParams.get("id_cabang");
  const paramBarang = searchParams.get("id_barang");

  let idCabang: number | null = paramCabang ? parseInt(paramCabang) : null;

  if (!idCabang) {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE)?.value;
    const user = token ? await verifyToken(token) : null;
    idCabang = user?.id_cabang || null;
  }

  if (!idCabang) {
    return NextResponse.json({ error: "Cabang tidak teridentifikasi" }, { status: 400 });
  }

  if (paramBarang) {
    const idBarang = parseInt(paramBarang);
    const [item] = await db
      .select({
        id: stok_barang.id,
        id_barang: stok_barang.id_barang,
        barcode: barang.barcode,
        nama_barang: barang.nama_barang,
        id_cabang: stok_barang.id_cabang,
        stok_akhir: stok_barang.stok_akhir,
        minimal_stok: stok_barang.minimal_stok,
        maksimal_stok: stok_barang.maksimal_stok,
      })
      .from(stok_barang)
      .innerJoin(barang, eq(stok_barang.id_barang, barang.id_barang))
      .where(
        and(
          eq(stok_barang.id_cabang, idCabang),
          eq(stok_barang.id_barang, idBarang)
        )
      )
      .limit(1);

    return NextResponse.json(item || { stok_akhir: 0 });
  }

  const data = await db
    .select({
      id: stok_barang.id,
      id_barang: stok_barang.id_barang,
      barcode: barang.barcode,
      nama_barang: barang.nama_barang,
      id_kategori: barang.id_kategori,
      nama_kategori: kategori_barang.nama_kategori,
      id_supplier: barang.id_supplier,
      nama_supplier: supplier.nama_supplier,
      id_cabang: stok_barang.id_cabang,
      nama_cabang: cabang.nama_cabang,
      stok_akhir: stok_barang.stok_akhir,
      penjualan: stok_barang.penjualan,
      posisi_rak: stok_barang.posisi_rak,
      minimal_stok: stok_barang.minimal_stok,
      maksimal_stok: stok_barang.maksimal_stok,
      harga_beli: barang.harga_beli,
      harga_rata: barang.harga_rata,
      harga_jual_1_1: barang.harga_jual_1_1,
      satuan_1: barang.satuan_1,
      satuan_2: barang.satuan_2,
      satuan_3: barang.satuan_3,
      isi_1: barang.isi_1,
      isi_2: barang.isi_2,
      isi_3: barang.isi_3,
    })
    .from(stok_barang)
    .innerJoin(barang, eq(stok_barang.id_barang, barang.id_barang))
    .leftJoin(kategori_barang, eq(barang.id_kategori, kategori_barang.id_kategori))
    .leftJoin(supplier, eq(barang.id_supplier, supplier.id_supplier))
    .innerJoin(cabang, eq(stok_barang.id_cabang, cabang.id_cabang))
    .where(eq(stok_barang.id_cabang, idCabang))
    .orderBy(barang.nama_barang);

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const idBarang = parseInt(body.id_barang);
  const idCabang = parseInt(body.id_cabang);
  const stokAkhir = parseInt(body.stok_akhir || "0");
  const posisiRak = body.posisi_rak || null;
  const minimalStok = parseInt(body.minimal_stok || "0");
  const maksimalStok = parseInt(body.maksimal_stok || "0");

  // Check if stock record already exists for this product in this branch
  const [existing] = await db
    .select()
    .from(stok_barang)
    .where(and(eq(stok_barang.id_barang, idBarang), eq(stok_barang.id_cabang, idCabang)));

  if (existing) {
    const [updated] = await db
      .update(stok_barang)
      .set({
        stok_akhir: stokAkhir,
        posisi_rak: posisiRak,
        minimal_stok: minimalStok,
        maksimal_stok: maksimalStok,
      })
      .where(eq(stok_barang.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  } else {
    const [newStok] = await db
      .insert(stok_barang)
      .values({
        id_barang: idBarang,
        id_cabang: idCabang,
        stok_akhir: stokAkhir,
        penjualan: 0,
        posisi_rak: posisiRak,
        minimal_stok: minimalStok,
        maksimal_stok: maksimalStok,
      })
      .returning();
    return NextResponse.json(newStok, { status: 201 });
  }
}
