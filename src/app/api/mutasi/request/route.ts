import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { pesan_cabang, pesan_cabang_detail, barang, cabang } from "@/lib/db/schema";
import { verifyToken, TOKEN_COOKIE } from "@/lib/auth/jwt";
import { eq, and, desc, sql } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idReq = searchParams.get("id");
  const filterType = searchParams.get("filter"); // incoming (to fulfill) or outgoing (we asked for)
  const statusFilter = searchParams.get("status");

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || !user.id_cabang) {
    return NextResponse.json({ error: "Sesi tidak teridentifikasi" }, { status: 401 });
  }

  const idCabang = user.id_cabang;

  // 1. Single Request Details
  if (idReq) {
    const [header] = await db
      .select({
        id_request: pesan_cabang.id_request,
        kode_request: pesan_cabang.kode_request,
        id_cabang_peminta: pesan_cabang.id_cabang_peminta,
        id_cabang_sumber: pesan_cabang.id_cabang_sumber,
        id_user_peminta: pesan_cabang.id_user_peminta,
        status: pesan_cabang.status,
        tanggal_request: pesan_cabang.tanggal_request,
        created_at: pesan_cabang.created_at,
        nama_cabang_peminta: cabang.nama_cabang,
      })
      .from(pesan_cabang)
      .innerJoin(cabang, eq(pesan_cabang.id_cabang_peminta, cabang.id_cabang))
      .where(eq(pesan_cabang.id_request, parseInt(idReq)));

    if (!header) {
      return NextResponse.json({ error: "Permintaan tidak ditemukan" }, { status: 404 });
    }

    const details = await db
      .select({
        id: pesan_cabang_detail.id,
        id_request: pesan_cabang_detail.id_request,
        id_barang: pesan_cabang_detail.id_barang,
        jumlah_diminta: pesan_cabang_detail.jumlah_diminta,
        status_item: pesan_cabang_detail.status_item,
        nama_barang: barang.nama_barang,
        barcode: barang.barcode,
        satuan_1: barang.satuan_1,
        satuan_2: barang.satuan_2,
        satuan_3: barang.satuan_3,
        isi_1: barang.isi_1,
        isi_2: barang.isi_2,
        isi_3: barang.isi_3,
      })
      .from(pesan_cabang_detail)
      .innerJoin(barang, eq(pesan_cabang_detail.id_barang, barang.id_barang))
      .where(eq(pesan_cabang_detail.id_request, header.id_request));

    return NextResponse.json({ header, details });
  }

  // 2. Filtered list
  const conditions = [];

  if (filterType === "incoming") {
    // Other branches requested from our branch (we are the source)
    conditions.push(eq(pesan_cabang.id_cabang_sumber, idCabang));
  } else if (filterType === "outgoing") {
    // We requested from other branches (we are the requester)
    conditions.push(eq(pesan_cabang.id_cabang_peminta, idCabang));
  } else {
    // Default both
    conditions.push(
      sql`(${pesan_cabang.id_cabang_peminta} = ${idCabang} OR ${pesan_cabang.id_cabang_sumber} = ${idCabang})`
    );
  }

  if (statusFilter) {
    conditions.push(eq(pesan_cabang.status, statusFilter));
  }

  const data = await db
    .select({
      id_request: pesan_cabang.id_request,
      kode_request: pesan_cabang.kode_request,
      id_cabang_peminta: pesan_cabang.id_cabang_peminta,
      id_cabang_sumber: pesan_cabang.id_cabang_sumber,
      status: pesan_cabang.status,
      tanggal_request: pesan_cabang.tanggal_request,
      created_at: pesan_cabang.created_at,
      cabang_peminta: sql`c1.nama_cabang`,
      cabang_sumber: sql`c2.nama_cabang`,
    })
    .from(pesan_cabang)
    .innerJoin(sql`cabang c1`, sql`c1.id_cabang = ${pesan_cabang.id_cabang_peminta}`)
    .innerJoin(sql`cabang c2`, sql`c2.id_cabang = ${pesan_cabang.id_cabang_sumber}`)
    .where(and(...conditions))
    .orderBy(desc(pesan_cabang.id_request));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || !user.id_cabang || !user.id) {
    return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
  }

  const idCabangPeminta = user.id_cabang;
  const body = await request.json();
  const { id_cabang_sumber, tanggal_request, items } = body;

  if (!id_cabang_sumber || parseInt(id_cabang_sumber) === idCabangPeminta) {
    return NextResponse.json({ error: "Cabang sumber tidak valid" }, { status: 400 });
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Daftar barang permintaan kosong" }, { status: 400 });
  }

  // Generate Request Code: TR-YYYYMMDDHHMMSS
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestampStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const kodeRequest = `TR-${timestampStr}`;

  try {
    const result = db.transaction((tx) => {
      // 1. Save header
      const [newReq] = tx
        .insert(pesan_cabang)
        .values({
          kode_request: kodeRequest,
          id_cabang_peminta: idCabangPeminta,
          id_cabang_sumber: parseInt(id_cabang_sumber),
          id_user_peminta: user.id,
          tanggal_request: tanggal_request || now.toISOString().slice(0, 10),
          status: "Pending",
        })
        .returning()
        .all();

      // 2. Save items
      for (const item of items) {
        tx.insert(pesan_cabang_detail).values({
          id_request: newReq.id_request,
          id_barang: parseInt(item.id_barang),
          jumlah_diminta: parseInt(item.jumlah_diminta), // in base units (pcs)
          status_item: "Diproses",
        }).run();
      }

      return { success: true, id_request: newReq.id_request, kode_request: kodeRequest };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Gagal menyimpan permintaan cabang:", error);
    return NextResponse.json({ error: "Gagal menyimpan permintaan: " + getErrorMessage(error) }, { status: 500 });
  }
}
