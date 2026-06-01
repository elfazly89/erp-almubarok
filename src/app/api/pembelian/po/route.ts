import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { pesan_beli, pesan_beli_detail, supplier } from "@/lib/db/schema";
import { verifyToken, TOKEN_COOKIE } from "@/lib/auth/jwt";
import { eq, and, desc } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idPo = searchParams.get("id");
  const statusFilter = searchParams.get("status");

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  const idCabang = user?.id_cabang;

  if (!idCabang) {
    return NextResponse.json({ error: "Cabang tidak teridentifikasi" }, { status: 400 });
  }

  // Fetch a single PO with details
  if (idPo) {
    const [po] = await db
      .select({
        id_pesan_beli: pesan_beli.id_pesan_beli,
        id_supplier: pesan_beli.id_supplier,
        nama_supplier: supplier.nama_supplier,
        tanggal_pesan_beli: pesan_beli.tanggal_pesan_beli,
        nomor_pesan_beli: pesan_beli.nomor_pesan_beli,
        keterangan: pesan_beli.keterangan,
        total_harga_pesan_beli: pesan_beli.total_harga_pesan_beli,
        status: pesan_beli.status,
      })
      .from(pesan_beli)
      .innerJoin(supplier, eq(pesan_beli.id_supplier, supplier.id_supplier))
      .where(and(eq(pesan_beli.id_pesan_beli, parseInt(idPo)), eq(pesan_beli.id_cabang, idCabang)));

    if (!po) {
      return NextResponse.json({ error: "PO tidak ditemukan" }, { status: 404 });
    }

    const details = await db
      .select()
      .from(pesan_beli_detail)
      .where(eq(pesan_beli_detail.id_pesan_beli, po.id_pesan_beli));

    return NextResponse.json({ po, details });
  }

  // Otherwise list all POs
  const conditions = [eq(pesan_beli.id_cabang, idCabang)];
  if (statusFilter) {
    conditions.push(eq(pesan_beli.status, statusFilter));
  }

  const data = await db
    .select({
      id_pesan_beli: pesan_beli.id_pesan_beli,
      nomor_pesan_beli: pesan_beli.nomor_pesan_beli,
      tanggal_pesan_beli: pesan_beli.tanggal_pesan_beli,
      nama_supplier: supplier.nama_supplier,
      total_harga_pesan_beli: pesan_beli.total_harga_pesan_beli,
      status: pesan_beli.status,
      keterangan: pesan_beli.keterangan,
    })
    .from(pesan_beli)
    .innerJoin(supplier, eq(pesan_beli.id_supplier, supplier.id_supplier))
    .where(and(...conditions))
    .orderBy(desc(pesan_beli.id_pesan_beli));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || !user.id_cabang) {
    return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
  }

  const body = await request.json();
  const idCabang = user.id_cabang;

  const { id_supplier, tanggal_pesan_beli, keterangan, total_harga_pesan_beli, items } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Daftar barang PO kosong" }, { status: 400 });
  }

  // Generate PB number: PB-YYYYMMDD-[4 random hex]
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomHex = Math.floor(Math.random() * 65536).toString(16).padStart(4, "0");
  const nomorPO = `PB-${todayStr}-${randomHex}`;

  try {
    const poResult = await db.transaction(async (tx) => {
      // 1. Insert header
      const [newPO] = await tx
        .insert(pesan_beli)
        .values({
          id_cabang: idCabang,
          id_supplier: parseInt(id_supplier),
          tanggal_pesan_beli: tanggal_pesan_beli,
          nomor_pesan_beli: nomorPO,
          keterangan: keterangan || "",
          total_harga_pesan_beli: parseInt(total_harga_pesan_beli),
          status: "PENDING",
        })
        .returning();

      // 2. Insert details
      for (const item of items) {
        await tx.insert(pesan_beli_detail).values({
          id_pesan_beli: newPO.id_pesan_beli,
          id_barang: parseInt(item.id_barang),
          nama_barang: item.nama_barang,
          jumlah_barang: parseInt(item.jumlah_barang), // in pcs (qty * conversion)
          harga_satuan: parseInt(item.harga_satuan),
          subtotal: parseInt(item.subtotal),
        });
      }

      return { success: true, id_pesan_beli: newPO.id_pesan_beli, nomor_pesan_beli: nomorPO };
    });

    return NextResponse.json(poResult);
  } catch (error: unknown) {
    console.error("Gagal menyimpan PO:", error);
    return NextResponse.json({ error: "Gagal menyimpan PO: " + getErrorMessage(error) }, { status: 500 });
  }
}
