import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  pengiriman,
  pengiriman_detail,
  pesan_cabang,
  pesan_cabang_detail,
  stok_barang,
  barang,
  cabang,
} from "@/lib/db/schema";
import { verifyToken, TOKEN_COOKIE } from "@/lib/auth/jwt";
import { eq, and, desc, sql, like } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idKirim = searchParams.get("id");
  const filterType = searchParams.get("filter"); // sent (we dispatched) or received (we are waiting/received)
  const statusFilter = searchParams.get("status");

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || !user.id_cabang) {
    return NextResponse.json({ error: "Sesi tidak teridentifikasi" }, { status: 401 });
  }

  const idCabang = user.id_cabang;

  // 1. Fetch single shipment with its items
  if (idKirim) {
    const [header] = await db
      .select({
        id_pengiriman: pengiriman.id_pengiriman,
        kode_pengiriman: pengiriman.kode_pengiriman,
        id_cabang_sumber: pengiriman.id_cabang_sumber,
        id_cabang_tujuan: pengiriman.id_cabang_tujuan,
        id_user_pengirim: pengiriman.id_user_pengirim,
        id_user_penerima: pengiriman.id_user_penerima,
        status: pengiriman.status,
        tanggal_kirim: pengiriman.tanggal_kirim,
        tanggal_terima: pengiriman.tanggal_terima,
        cabang_sumber: sql`c1.nama_cabang`,
        cabang_tujuan: sql`c2.nama_cabang`,
      })
      .from(pengiriman)
      .innerJoin(sql`cabang c1`, sql`c1.id_cabang = ${pengiriman.id_cabang_sumber}`)
      .innerJoin(sql`cabang c2`, sql`c2.id_cabang = ${pengiriman.id_cabang_tujuan}`)
      .where(eq(pengiriman.id_pengiriman, parseInt(idKirim)));

    if (!header) {
      return NextResponse.json({ error: "Pengiriman tidak ditemukan" }, { status: 404 });
    }

    const details = await db
      .select({
        id_detail_kirim: pengiriman_detail.id_detail_kirim,
        id_barang: pengiriman_detail.id_barang,
        jumlah_dikirim: pengiriman_detail.jumlah_dikirim,
        jumlah_diterima: pengiriman_detail.jumlah_diterima,
        id_request_detail: pengiriman_detail.id_request_detail,
        status_selisih: pengiriman_detail.status_selisih,
        catatan_penerima: pengiriman_detail.catatan_penerima,
        nama_barang: barang.nama_barang,
        barcode: barang.barcode,
        satuan_1: barang.satuan_1,
        satuan_2: barang.satuan_2,
        satuan_3: barang.satuan_3,
        isi_1: barang.isi_1,
        isi_2: barang.isi_2,
        isi_3: barang.isi_3,
      })
      .from(pengiriman_detail)
      .innerJoin(barang, eq(pengiriman_detail.id_barang, barang.id_barang))
      .where(eq(pengiriman_detail.id_pengiriman, header.id_pengiriman));

    return NextResponse.json({ header, details });
  }

  // 2. Fetch list
  const conditions = [];

  if (filterType === "sent") {
    conditions.push(eq(pengiriman.id_cabang_sumber, idCabang));
  } else if (filterType === "received") {
    conditions.push(eq(pengiriman.id_cabang_tujuan, idCabang));
  } else {
    conditions.push(
      sql`(${pengiriman.id_cabang_sumber} = ${idCabang} OR ${pengiriman.id_cabang_tujuan} = ${idCabang})`
    );
  }

  if (statusFilter) {
    conditions.push(eq(pengiriman.status, statusFilter));
  }

  const data = await db
    .select({
      id_pengiriman: pengiriman.id_pengiriman,
      kode_pengiriman: pengiriman.kode_pengiriman,
      id_cabang_sumber: pengiriman.id_cabang_sumber,
      id_cabang_tujuan: pengiriman.id_cabang_tujuan,
      status: pengiriman.status,
      tanggal_kirim: pengiriman.tanggal_kirim,
      tanggal_terima: pengiriman.tanggal_terima,
      cabang_sumber: sql`c1.nama_cabang`,
      cabang_tujuan: sql`c2.nama_cabang`,
    })
    .from(pengiriman)
    .innerJoin(sql`cabang c1`, sql`c1.id_cabang = ${pengiriman.id_cabang_sumber}`)
    .innerJoin(sql`cabang c2`, sql`c2.id_cabang = ${pengiriman.id_cabang_tujuan}`)
    .where(and(...conditions))
    .orderBy(desc(pengiriman.id_pengiriman));

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || !user.id_cabang || !user.id) {
    return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
  }

  const idCabangSumber = user.id_cabang;
  const body = await request.json();
  const { id_cabang_tujuan, id_request, items } = body;

  if (!id_cabang_tujuan || parseInt(id_cabang_tujuan) === idCabangSumber) {
    return NextResponse.json({ error: "Cabang tujuan pengiriman tidak valid" }, { status: 400 });
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Barang yang dikirim kosong" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Fetch source branch code for formatting
      const [sourceCabang] = await tx
        .select()
        .from(cabang)
        .where(eq(cabang.id_cabang, idCabangSumber));
      const kodeCabang = sourceCabang?.kode_cabang || "CAB";

      // 2. Generate shipment code: KIRIM/YYYY/MM/KODE-CABANG/URUTAN
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const monthStr = pad(now.getMonth() + 1);
      const yearStr = now.getFullYear().toString();
      const prefix = `KIRIM/${yearStr}/${monthStr}/${kodeCabang}/`;

      // Fetch the max serial sequence with this prefix
      const [lastShipment] = await tx
        .select({ max_kode: pengiriman.kode_pengiriman })
        .from(pengiriman)
        .where(like(pengiriman.kode_pengiriman, `${prefix}%`))
        .orderBy(desc(pengiriman.kode_pengiriman))
        .limit(1);

      let seq = 1;
      if (lastShipment?.max_kode) {
        const lastSeqStr = lastShipment.max_kode.substring(prefix.length);
        const parsedSeq = parseInt(lastSeqStr);
        if (!isNaN(parsedSeq)) seq = parsedSeq + 1;
      }
      const kodePengiriman = `${prefix}${String(seq).padStart(4, "0")}`;

      // 3. Save Shipment Header
      const [newShipment] = await tx
        .insert(pengiriman)
        .values({
          kode_pengiriman: kodePengiriman,
          id_cabang_sumber: idCabangSumber,
          id_cabang_tujuan: parseInt(id_cabang_tujuan),
          id_user_pengirim: user.id,
          status: "Dikirim",
          tanggal_kirim: now.toISOString().replace("T", " ").slice(0, 19),
        })
        .returning();

      // 4. Save details & deduct stock
      for (const item of items) {
        const idBarang = parseInt(item.id_barang);
        const qtyKirim = parseInt(item.jumlah_dikirim);

        if (qtyKirim <= 0) continue;

        // Fetch stock record at sender branch
        const [stockRecord] = await tx
          .select()
          .from(stok_barang)
          .where(and(eq(stok_barang.id_barang, idBarang), eq(stok_barang.id_cabang, idCabangSumber)));

        if (!stockRecord || (stockRecord.stok_akhir || 0) < qtyKirim) {
          // Allow negative stock but log warning or clamp if required by user config
          // For ERP, we can deduct anyway or error out. Let's deduct anyway to keep flow fluent but clamp negative checks if necessary.
        }

        const stockId = stockRecord?.id;
        const currentStock = stockRecord?.stok_akhir || 0;
        const currentKeluar = stockRecord?.transfer_keluar || 0;

        if (stockId) {
          await tx
            .update(stok_barang)
            .set({
              stok_akhir: currentStock - qtyKirim,
              transfer_keluar: currentKeluar + qtyKirim,
            })
            .where(eq(stok_barang.id, stockId));
        } else {
          // If no stock record exists at sender branch (rare), create one
          await tx.insert(stok_barang).values({
            id_barang: idBarang,
            id_cabang: idCabangSumber,
            stok_akhir: -qtyKirim,
            transfer_keluar: qtyKirim,
          });
        }

        // Link with request detail and adjust its status if applicable
        let idRequestDetail = null;
        if (item.id_request_detail) {
          idRequestDetail = parseInt(item.id_request_detail);

          // Get the requested detail row to compare quantities
          const [reqDetail] = await tx
            .select()
            .from(pesan_cabang_detail)
            .where(eq(pesan_cabang_detail.id, idRequestDetail));

          if (reqDetail) {
            const requested = reqDetail.jumlah_diminta;
            let statusItem = "Terkirim";
            if (qtyKirim < requested) {
              statusItem = "Terkirim Sebagian";
            } else if (qtyKirim > requested) {
              statusItem = "Over";
            }

            await tx
              .update(pesan_cabang_detail)
              .set({ status_item: statusItem })
              .where(eq(pesan_cabang_detail.id, idRequestDetail));
          }
        }

        // Save Shipment Detail
        await tx.insert(pengiriman_detail).values({
          id_pengiriman: newShipment.id_pengiriman,
          id_barang: idBarang,
          jumlah_dikirim: qtyKirim,
          id_request_detail: idRequestDetail,
        });
      }

      // 5. Update overall Request status to "Diproses" if this linked to an active request
      if (id_request) {
        await tx
          .update(pesan_cabang)
          .set({ status: "Diproses" })
          .where(eq(pesan_cabang.id_request, parseInt(id_request)));
      }

      return {
        success: true,
        id_pengiriman: newShipment.id_pengiriman,
        kode_pengiriman: kodePengiriman,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Gagal menyimpan pengiriman cabang:", error);
    return NextResponse.json({ error: "Gagal menyimpan pengiriman: " + getErrorMessage(error) }, { status: 500 });
  }
}
