import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forecast_stok, stok_barang, barang, cabang } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

// Transfer Antarcabang: deteksi overstock dan understock
// GET /api/distribusi/transfer
export async function GET() {
  try {
    // Ambil semua forecast untuk deteksi overstock (cover > 60 hari) dan understock (KRITIS)
    const allForecasts = await db
      .select({
        id_barang: forecast_stok.id_barang,
        id_cabang: forecast_stok.id_cabang,
        stok_sekarang: forecast_stok.stok_sekarang,
        ads: forecast_stok.ads,
        estimasi_habis_hari: forecast_stok.estimasi_habis_hari,
        status: forecast_stok.status,
        nama_barang: barang.nama_barang,
        barcode: barang.barcode,
        nama_cabang: cabang.nama_cabang,
      })
      .from(forecast_stok)
      .leftJoin(barang, eq(forecast_stok.id_barang, barang.id_barang))
      .leftJoin(cabang, eq(forecast_stok.id_cabang, cabang.id_cabang));

    // Group by barang
    const byBarang: Record<
      number,
      {
        nama: string;
        barcode: string;
        overstock: typeof allForecasts;
        understock: typeof allForecasts;
      }
    > = {};

    for (const f of allForecasts) {
      const bId = f.id_barang;
      if (!byBarang[bId]) {
        byBarang[bId] = {
          nama: f.nama_barang || "—",
          barcode: f.barcode || "",
          overstock: [],
          understock: [],
        };
      }

      const hari = f.estimasi_habis_hari || 0;
      if (hari > 60) byBarang[bId].overstock.push(f); // kelebihan stok > 60 hari
      if (f.status === "KRITIS") byBarang[bId].understock.push(f); // kekurangan stok kritis
    }

    // Buat saran transfer: untuk setiap barang dengan overstock + understock bersamaan
    const suggestions = [];
    let suggestionId = 1;

    for (const [barangId, data] of Object.entries(byBarang)) {
      if (data.overstock.length === 0 || data.understock.length === 0) continue;

      // Pasangkan overstock terbesar dengan understock terparah
      const overstockSorted = [...data.overstock].sort(
        (a, b) => (b.estimasi_habis_hari || 0) - (a.estimasi_habis_hari || 0)
      );
      const understockSorted = [...data.understock].sort(
        (a, b) => (a.estimasi_habis_hari || 0) - (b.estimasi_habis_hari || 0)
      );

      for (const over of overstockSorted) {
        for (const under of understockSorted) {
          if (over.id_cabang === under.id_cabang) continue;

          const adsOver = over.ads !== null ? over.ads / 100 : 0;
          const adsUnder = under.ads !== null ? under.ads / 100 : 0;

          // Qty transfer: cukupkan understock ke 14 hari tanpa membuat overstock kehabisan
          const kebutuhanUnder = Math.ceil(adsUnder * 14) - under.stok_sekarang;
          const maxDiAmbil = Math.floor(over.stok_sekarang * 0.4); // max 40% dari overstock diambil
          const qtyTransfer = Math.max(0, Math.min(kebutuhanUnder, maxDiAmbil));

          if (qtyTransfer <= 0) continue;

          const coverSetelahTransfer = adsUnder > 0 ? (under.stok_sekarang + qtyTransfer) / adsUnder : 999;

          suggestions.push({
            id: suggestionId++,
            id_barang: parseInt(barangId),
            barang: data.nama,
            barcode: data.barcode,
            cabangAsal: over.nama_cabang,
            id_cabang_asal: over.id_cabang,
            stokAsal: over.stok_sekarang,
            adsAsal: adsOver,
            cabangTujuan: under.nama_cabang,
            id_cabang_tujuan: under.id_cabang,
            stokTujuan: under.stok_sekarang,
            adsTujuan: adsUnder,
            qtyTransfer,
            potensiCoverHari: parseFloat(coverSetelahTransfer.toFixed(1)),
            status: "PENDING",
          });

          break; // Satu saran per overstock
        }
      }
    }

    return NextResponse.json({ success: true, data: suggestions, total: suggestions.length });
  } catch (error) {
    console.error("Transfer GET error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat saran transfer", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// PUT /api/distribusi/transfer — Process transfer (buat pengiriman TRANSFER)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, idBarang, idCabangAsal, idCabangTujuan, qtyTransfer, userId } = body;

    if (action === "process") {
      const { pengiriman, pengiriman_detail } = await import("@/lib/db/schema");

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const countSj = await db.select({ count: sql<number>`count(*)` }).from(pengiriman);
      const urutan = (Number(countSj[0]?.count ?? 0) + 1).toString().padStart(4, "0");
      const kode = `SJ-TRF-${todayStr.replace(/-/g, "")}${urutan}`;

      const [newSj] = await db
        .insert(pengiriman)
        .values({
          kode_pengiriman: kode,
          id_cabang_sumber: idCabangAsal,
          id_cabang_tujuan: idCabangTujuan,
          id_user_pengirim: userId || 1,
          jenis_pengiriman: "TRANSFER",
          status: "Draft",
          tanggal_kirim: todayStr,
        })
        .returning();

      await db.insert(pengiriman_detail).values({
        id_pengiriman: newSj.id_pengiriman,
        id_barang: idBarang,
        jumlah_dikirim: qtyTransfer,
      });

      return NextResponse.json({
        success: true,
        message: `Transfer berhasil dibuat. Kode: ${kode}`,
        kode,
        id: newSj.id_pengiriman,
      });
    }

    return NextResponse.json({ success: false, message: "Action tidak dikenal" }, { status: 400 });
  } catch (error) {
    console.error("Transfer PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses transfer", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
