import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  forecast_stok,
  sales_velocity,
  stok_setting_cabang,
  barang,
  cabang,
  stok_barang,
  penjualan_detail,
  penjualan,
  kategori_barang,
} from "@/lib/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

// GET /api/distribusi/forecast?cabang=&kategori=&search=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const cabangFilter = searchParams.get("cabang") || "";
    const searchFilter = searchParams.get("search") || "";

    // Ambil forecast yang sudah ada di DB
    let query = db
      .select({
        id: forecast_stok.id,
        id_barang: forecast_stok.id_barang,
        id_cabang: forecast_stok.id_cabang,
        stok_sekarang: forecast_stok.stok_sekarang,
        ads: forecast_stok.ads,
        estimasi_habis_hari: forecast_stok.estimasi_habis_hari,
        tanggal_habis: forecast_stok.tanggal_habis,
        status: forecast_stok.status,
        created_at: forecast_stok.created_at,
        nama_barang: barang.nama_barang,
        barcode: barang.barcode,
        kategori: kategori_barang.nama_kategori,
        nama_cabang: cabang.nama_cabang,
      })
      .from(forecast_stok)
      .leftJoin(barang, eq(forecast_stok.id_barang, barang.id_barang))
      .leftJoin(cabang, eq(forecast_stok.id_cabang, cabang.id_cabang))
      .leftJoin(kategori_barang, eq(barang.id_kategori, kategori_barang.id_kategori))
      .orderBy(forecast_stok.estimasi_habis_hari);

    const results = await query;

    // Filter di sisi app (lebih sederhana daripada SQL complex)
    const filtered = results.filter((r) => {
      const matchCabang = !cabangFilter || r.id_cabang?.toString() === cabangFilter;
      const matchSearch = !searchFilter || r.nama_barang?.toLowerCase().includes(searchFilter.toLowerCase());
      return matchCabang && matchSearch;
    });

    const data = filtered.map((r) => ({
      id: r.id,
      id_barang: r.id_barang,
      id_cabang: r.id_cabang,
      barang: r.nama_barang || "—",
      barcode: r.barcode || "",
      kategori: r.kategori || "—",
      cabang: r.nama_cabang || "—",
      stok: r.stok_sekarang,
      ads: r.ads !== null ? r.ads / 100 : 0,
      estimasiHabisHari: r.estimasi_habis_hari || 0,
      tanggalHabis: r.tanggal_habis || "—",
      status: r.status || "AMAN",
      lastUpdate: r.created_at || "—",
    }));

    return NextResponse.json({ success: true, data, total: data.length });
  } catch (error) {
    console.error("Forecast GET error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data forecast", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST /api/distribusi/forecast — Recalculate ADS & Forecast dari data penjualan aktual
export async function POST() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Ambil semua barang dan cabang
    const allBarang = await db.select({ id: barang.id_barang, nama: barang.nama_barang }).from(barang);
    const allCabang = await db.select({ id: cabang.id_cabang, nama: cabang.nama_cabang }).from(cabang);

    let processed = 0;

    for (const b of allBarang) {
      for (const c of allCabang) {
        // Ambil stok sekarang
        const stokData = await db
          .select({ jumlah: stok_barang.stok_akhir })
          .from(stok_barang)
          .where(and(eq(stok_barang.id_barang, b.id), eq(stok_barang.id_cabang, c.id)))
          .limit(1);

        const stokSekarang = stokData[0]?.jumlah ?? 0;

        // Hitung ADS 30 hari dari penjualan_detail
        const date30 = new Date(today);
        date30.setDate(today.getDate() - 30);
        const date30Str = date30.toISOString().split("T")[0];

        const salesData = await db
          .select({ totalQty: sql<number>`COALESCE(SUM(${penjualan_detail.jumlah}), 0)` })
          .from(penjualan_detail)
          .leftJoin(penjualan, eq(penjualan_detail.id_penjualan, penjualan.id_penjualan))
          .where(
            and(
              eq(penjualan_detail.id_barang, b.id),
              eq(penjualan.id_cabang, c.id),
              gte(penjualan.tanggal_invoice, date30Str)
            )
          );

        const totalQty30 = Number(salesData[0]?.totalQty ?? 0);
        const ads30 = totalQty30 / 30; // pcs per hari

        // Ambil setting jika ada
        const setting = await db
          .select()
          .from(stok_setting_cabang)
          .where(and(eq(stok_setting_cabang.id_barang, b.id), eq(stok_setting_cabang.id_cabang, c.id)))
          .limit(1);

        const leadTime = setting[0]?.lead_time_days ?? 2;
        const safetyDays = setting[0]?.safety_stock ?? 3;

        // Hitung stock cover
        const stockCoverHari = ads30 > 0 ? Math.floor(stokSekarang / ads30) : 999;

        // Determine status
        let status = "AMAN";
        if (stockCoverHari <= leadTime) status = "KRITIS";
        else if (stockCoverHari <= safetyDays) status = "PERHATIAN";

        // Hitung tanggal habis
        const habisDate = new Date(today);
        habisDate.setDate(today.getDate() + Math.min(stockCoverHari, 365));
        const tanggalHabis = ads30 > 0 ? habisDate.toISOString().split("T")[0] : null;

        // Upsert forecast_stok
        const existing = await db
          .select({ id: forecast_stok.id })
          .from(forecast_stok)
          .where(and(eq(forecast_stok.id_barang, b.id), eq(forecast_stok.id_cabang, c.id)))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(forecast_stok)
            .set({
              stok_sekarang: stokSekarang,
              ads: Math.round(ads30 * 100),
              estimasi_habis_hari: stockCoverHari > 365 ? 999 : stockCoverHari,
              tanggal_habis: tanggalHabis,
              status: status,
              created_at: todayStr,
            })
            .where(eq(forecast_stok.id, existing[0].id));
        } else {
          await db.insert(forecast_stok).values({
            id_barang: b.id,
            id_cabang: c.id,
            stok_sekarang: stokSekarang,
            ads: Math.round(ads30 * 100),
            estimasi_habis_hari: stockCoverHari > 365 ? 999 : stockCoverHari,
            tanggal_habis: tanggalHabis,
            status: status,
            created_at: todayStr,
          });
        }

        // Update sales_velocity
        const velExisting = await db
          .select({ id: sales_velocity.id })
          .from(sales_velocity)
          .where(and(eq(sales_velocity.id_barang, b.id), eq(sales_velocity.id_cabang, c.id)))
          .limit(1);

        const velData = { ads_30: Math.round(ads30 * 100), last_calculated: todayStr };

        if (velExisting.length > 0) {
          await db.update(sales_velocity).set(velData).where(eq(sales_velocity.id, velExisting[0].id));
        } else {
          await db.insert(sales_velocity).values({ id_barang: b.id, id_cabang: c.id, ...velData });
        }

        processed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menghitung ulang ${processed} kombinasi barang x cabang.`,
      processed,
    });
  } catch (error) {
    console.error("Forecast POST error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghitung ulang forecast", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
