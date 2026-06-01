import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  pengiriman,
  pengiriman_detail,
  pesan_cabang,
  pesan_cabang_detail,
  stok_barang,
} from "@/lib/db/schema";
import { verifyToken, TOKEN_COOKIE } from "@/lib/auth/jwt";
import { eq, and, sql } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || !user.id_cabang || !user.id) {
    return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
  }

  const idCabangPenerima = user.id_cabang;
  const body = await request.json();
  const { id_pengiriman, items } = body;

  if (!id_pengiriman || !items || items.length === 0) {
    return NextResponse.json({ error: "Data penerimaan tidak lengkap" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Fetch shipment header
      const [shipment] = await tx
        .select()
        .from(pengiriman)
        .where(eq(pengiriman.id_pengiriman, parseInt(id_pengiriman)));

      if (!shipment) {
        throw new Error("Pengiriman tidak ditemukan");
      }

      if (shipment.id_cabang_tujuan !== idCabangPenerima) {
        throw new Error("Pengiriman ini ditujukan untuk cabang lain");
      }

      if (shipment.tanggal_terima) {
        throw new Error("Pengiriman ini sudah pernah diterima");
      }

      const now = new Date();
      let overallStatus = "Diterima Penuh";

      // 2. Loop and update details, increment target stock
      for (const item of items) {
        const idBarang = parseInt(item.id_barang);
        const qtyTerima = parseInt(item.jumlah_diterima);
        const catatan = item.catatan_penerima || "";

        // Fetch detail record to get quantity sent
        const [detailRecord] = await tx
          .select()
          .from(pengiriman_detail)
          .where(
            and(
              eq(pengiriman_detail.id_pengiriman, shipment.id_pengiriman),
              eq(pengiriman_detail.id_barang, idBarang)
            )
          );

        if (!detailRecord) {
          throw new Error(`Item barang (ID: ${idBarang}) tidak terdaftar dalam surat jalan ini`);
        }

        const qtyKirim = detailRecord.jumlah_dikirim;

        let statusSelisih = null;
        if (qtyTerima !== qtyKirim) {
          overallStatus = "Ada Selisih";
          statusSelisih = "Pending"; // Needs review from sender branch
        }

        // A. Update pengiriman_detail
        await tx
          .update(pengiriman_detail)
          .set({
            jumlah_diterima: qtyTerima,
            status_selisih: statusSelisih,
            catatan_penerima: catatan,
          })
          .where(eq(pengiriman_detail.id_detail_kirim, detailRecord.id_detail_kirim));

        // B. Increment stock at receiving branch
        if (qtyTerima > 0) {
          const [stockRecord] = await tx
            .select()
            .from(stok_barang)
            .where(
              and(eq(stok_barang.id_barang, idBarang), eq(stok_barang.id_cabang, idCabangPenerima))
            );

          const stockId = stockRecord?.id;
          const currentStock = stockRecord?.stok_akhir || 0;
          const currentMasuk = stockRecord?.transfer_masuk || 0;

          if (stockId) {
            await tx
              .update(stok_barang)
              .set({
                stok_akhir: currentStock + qtyTerima,
                transfer_masuk: currentMasuk + qtyTerima,
              })
              .where(eq(stok_barang.id, stockId));
          } else {
            await tx.insert(stok_barang).values({
              id_barang: idBarang,
              id_cabang: idCabangPenerima,
              stok_akhir: qtyTerima,
              transfer_masuk: qtyTerima,
            });
          }
        }

        // C. If this is linked to a branch request detail, update item status there too
        if (detailRecord.id_request_detail) {
          let statusItem = "Terkirim";
          if (qtyTerima < qtyKirim) {
            statusItem = "Terkirim Sebagian";
          } else if (qtyTerima > qtyKirim) {
            statusItem = "Over";
          }

          await tx
            .update(pesan_cabang_detail)
            .set({ status_item: statusItem })
            .where(eq(pesan_cabang_detail.id, detailRecord.id_request_detail));
        }
      }

      // 3. Update Shipment Header
      await tx
        .update(pengiriman)
        .set({
          status: overallStatus,
          id_user_penerima: user.id,
          tanggal_terima: now.toISOString().replace("T", " ").slice(0, 19),
        })
        .where(eq(pengiriman.id_pengiriman, shipment.id_pengiriman));

      // 4. Update linked request overall status to "Selesai" if it exists
      // We search if there's a request linked through any of the detail records
      const [anyDetailWithRequest] = await tx
        .select({ id_request_detail: pengiriman_detail.id_request_detail })
        .from(pengiriman_detail)
        .where(
          and(
            eq(pengiriman_detail.id_pengiriman, shipment.id_pengiriman),
            sql`${pengiriman_detail.id_request_detail} IS NOT NULL`
          )
        )
        .limit(1);

      if (anyDetailWithRequest?.id_request_detail) {
        const [reqDetail] = await tx
          .select({ id_request: pesan_cabang_detail.id_request })
          .from(pesan_cabang_detail)
          .where(eq(pesan_cabang_detail.id, anyDetailWithRequest.id_request_detail));

        if (reqDetail?.id_request) {
          await tx
            .update(pesan_cabang)
            .set({ status: "Selesai" })
            .where(eq(pesan_cabang.id_request, reqDetail.id_request));
        }
      }

      return {
        success: true,
        id_pengiriman: shipment.id_pengiriman,
        status: overallStatus,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Gagal memproses penerimaan cabang:", error);
    return NextResponse.json({ error: "Gagal memproses penerimaan: " + getErrorMessage(error) }, { status: 500 });
  }
}
