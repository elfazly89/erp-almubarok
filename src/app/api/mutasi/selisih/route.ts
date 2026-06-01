import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { pengiriman, pengiriman_detail, stok_barang, barang, cabang } from "@/lib/db/schema";
import { verifyToken, TOKEN_COOKIE } from "@/lib/auth/jwt";
import { eq, and } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || !user.id_cabang) {
    return NextResponse.json({ error: "Sesi tidak teridentifikasi" }, { status: 401 });
  }

  const idCabang = user.id_cabang;

  try {
    // List pending discrepancies where we (the user's branch) are the sender (source branch)
    // and thus the ones who need to approve/review the discrepancy.
    const data = await db
      .select({
        id_detail_kirim: pengiriman_detail.id_detail_kirim,
        id_pengiriman: pengiriman_detail.id_pengiriman,
        kode_pengiriman: pengiriman.kode_pengiriman,
        id_barang: pengiriman_detail.id_barang,
        nama_barang: barang.nama_barang,
        barcode: barang.barcode,
        jumlah_dikirim: pengiriman_detail.jumlah_dikirim,
        jumlah_diterima: pengiriman_detail.jumlah_diterima,
        status_selisih: pengiriman_detail.status_selisih,
        catatan_penerima: pengiriman_detail.catatan_penerima,
        tanggal_kirim: pengiriman.tanggal_kirim,
        tanggal_terima: pengiriman.tanggal_terima,
        cabang_tujuan: cabang.nama_cabang,
      })
      .from(pengiriman_detail)
      .innerJoin(pengiriman, eq(pengiriman_detail.id_pengiriman, pengiriman.id_pengiriman))
      .innerJoin(barang, eq(pengiriman_detail.id_barang, barang.id_barang))
      .innerJoin(cabang, eq(pengiriman.id_cabang_tujuan, cabang.id_cabang))
      .where(
        and(
          eq(pengiriman.id_cabang_sumber, idCabang),
          eq(pengiriman_detail.status_selisih, "Pending")
        )
      );

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Gagal mengambil data selisih:", error);
    return NextResponse.json({ error: "Gagal mengambil data: " + getErrorMessage(error) }, { status: 500 });
  }
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
  const { id_detail_kirim } = body;

  if (!id_detail_kirim) {
    return NextResponse.json({ error: "ID detail pengiriman tidak lengkap" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Fetch the discrepancy detail and verify ownership
      const [detail] = await tx
        .select({
          id_detail_kirim: pengiriman_detail.id_detail_kirim,
          id_barang: pengiriman_detail.id_barang,
          jumlah_dikirim: pengiriman_detail.jumlah_dikirim,
          jumlah_diterima: pengiriman_detail.jumlah_diterima,
          status_selisih: pengiriman_detail.status_selisih,
          id_cabang_sumber: pengiriman.id_cabang_sumber,
        })
        .from(pengiriman_detail)
        .innerJoin(pengiriman, eq(pengiriman_detail.id_pengiriman, pengiriman.id_pengiriman))
        .where(
          and(
            eq(pengiriman_detail.id_detail_kirim, parseInt(id_detail_kirim)),
            eq(pengiriman_detail.status_selisih, "Pending")
          )
        );

      if (!detail) {
        throw new Error("Data selisih tidak ditemukan atau sudah disetujui");
      }

      if (detail.id_cabang_sumber !== idCabangSumber) {
        throw new Error("Aksi ditolak. Hanya cabang pengirim yang dapat menyetujui selisih");
      }

      const dikirim = detail.jumlah_dikirim || 0;
      const diterima = detail.jumlah_diterima || 0;
      const selisih = dikirim - diterima;

      if (selisih <= 0) {
        throw new Error("Tidak ada selisih kekurangan barang untuk dikembalikan");
      }

      const idBarang = detail.id_barang;

      // 2. Refund the discrepancy back to the sender's stock (source branch)
      const [stockRecord] = await tx
        .select()
        .from(stok_barang)
        .where(
          and(eq(stok_barang.id_barang, idBarang), eq(stok_barang.id_cabang, idCabangSumber))
        );

      const stockId = stockRecord?.id;
      const currentStock = stockRecord?.stok_akhir || 0;

      if (stockId) {
        await tx
          .update(stok_barang)
          .set({
            stok_akhir: currentStock + selisih,
          })
          .where(eq(stok_barang.id, stockId));
      } else {
        // If no stock record exists (rare), create one
        await tx.insert(stok_barang).values({
          id_barang: idBarang,
          id_cabang: idCabangSumber,
          stok_akhir: selisih,
        });
      }

      // 3. Mark the status as Approved
      await tx
        .update(pengiriman_detail)
        .set({
          status_selisih: "Approved",
        })
        .where(eq(pengiriman_detail.id_detail_kirim, detail.id_detail_kirim));

      return {
        success: true,
        id_detail_kirim: detail.id_detail_kirim,
        refunded_amount: selisih,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Gagal menyetujui selisih pengiriman:", error);
    return NextResponse.json({ error: "Gagal menyetujui selisih: " + getErrorMessage(error) }, { status: 500 });
  }
}
