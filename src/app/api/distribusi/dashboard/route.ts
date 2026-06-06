import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  stok_setting_cabang,
  sales_velocity,
  forecast_stok,
  barang,
  cabang,
  stok_barang,
  penjualan_detail,
  penjualan,
  rekomendasi_pengiriman,
} from "@/lib/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

// GET /api/distribusi/dashboard
// Menghitung 4 widget: barang kritis, cabang kritis, top fast moving, prioritas distribusi
export async function GET() {
  try {
    // 1. Ambil semua forecast_stok yang ada
    const forecasts = await db
      .select({
        id: forecast_stok.id,
        id_barang: forecast_stok.id_barang,
        id_cabang: forecast_stok.id_cabang,
        stok_sekarang: forecast_stok.stok_sekarang,
        ads: forecast_stok.ads,
        estimasi_habis_hari: forecast_stok.estimasi_habis_hari,
        tanggal_habis: forecast_stok.tanggal_habis,
        status: forecast_stok.status,
        nama_barang: barang.nama_barang,
        nama_cabang: cabang.nama_cabang,
      })
      .from(forecast_stok)
      .leftJoin(barang, eq(forecast_stok.id_barang, barang.id_barang))
      .leftJoin(cabang, eq(forecast_stok.id_cabang, cabang.id_cabang))
      .orderBy(forecast_stok.estimasi_habis_hari);

    // 2. Widget 1 - Barang Kritis (status KRITIS atau PERHATIAN, sort by estimasi habis)
    const barangKritis = forecasts
      .filter((f) => f.status === "KRITIS" || f.status === "PERHATIAN")
      .slice(0, 10)
      .map((f) => ({
        cabang: f.nama_cabang || "—",
        barang: f.nama_barang || "—",
        stok: f.stok_sekarang,
        ads: f.ads !== null ? f.ads / 100 : 0,
        habis: f.estimasi_habis_hari || 0,
        status: f.status,
      }));

    // 3. Widget 2 - Cabang Kritis (count barang kritis per cabang)
    const cabangKritisMap: Record<string, { jmlKritis: number; totalItem: number; status: string }> = {};
    for (const f of forecasts) {
      const nm = f.nama_cabang || "—";
      if (!cabangKritisMap[nm]) {
        cabangKritisMap[nm] = { jmlKritis: 0, totalItem: 0, status: "Aman" };
      }
      cabangKritisMap[nm].totalItem++;
      if (f.status === "KRITIS") {
        cabangKritisMap[nm].jmlKritis++;
        cabangKritisMap[nm].status = "Kritis";
      } else if (f.status === "PERHATIAN" && cabangKritisMap[nm].status !== "Kritis") {
        cabangKritisMap[nm].status = "Perhatian";
      }
    }
    const cabangKritis = Object.entries(cabangKritisMap)
      .map(([cabang, data]) => ({ cabang, ...data }))
      .sort((a, b) => b.jmlKritis - a.jmlKritis)
      .slice(0, 8);

    // 4. Widget 3 - Top Fast Moving (berdasarkan ADS dari sales_velocity)
    const velocities = await db
      .select({
        nama_barang: barang.nama_barang,
        ads_30: sales_velocity.ads_30,
        nama_cabang: cabang.nama_cabang,
      })
      .from(sales_velocity)
      .leftJoin(barang, eq(sales_velocity.id_barang, barang.id_barang))
      .leftJoin(cabang, eq(sales_velocity.id_cabang, cabang.id_cabang))
      .orderBy(desc(sales_velocity.ads_30))
      .limit(10);

    const fastMoving = velocities.map((v) => ({
      barang: v.nama_barang || "—",
      ads: v.ads_30 !== null ? v.ads_30 / 100 : 0,
      cabang: v.nama_cabang || "—",
    }));

    // 5. Widget 4 - Prioritas Distribusi (skor per cabang)
    const prioritasMap: Record<string, { totalSkor: number; count: number; alasan: string }> = {};
    for (const f of forecasts) {
      const nm = f.nama_cabang || "—";
      if (!prioritasMap[nm]) prioritasMap[nm] = { totalSkor: 0, count: 0, alasan: "" };
      
      // Hitung skor prioritas per item
      const ads = f.ads !== null ? f.ads / 100 : 0;
      const habis = f.estimasi_habis_hari || 999;
      const faktorHabis = Math.max(0, 100 - habis * 10);
      const faktorAds = Math.min(100, ads * 2);
      const skor = Math.round(0.6 * faktorHabis + 0.4 * faktorAds);

      prioritasMap[nm].totalSkor += skor;
      prioritasMap[nm].count++;
      if (f.status === "KRITIS") prioritasMap[nm].alasan = `Estimasi habis ${habis} hari & stok kritis`;
    }

    const prioritas = Object.entries(prioritasMap)
      .map(([cab, data]) => ({
        cabang: cab,
        skor: data.count > 0 ? Math.min(100, Math.round(data.totalSkor / data.count)) : 0,
        status:
          data.totalSkor / (data.count || 1) >= 70
            ? "Sangat Tinggi"
            : data.totalSkor / (data.count || 1) >= 50
            ? "Tinggi"
            : "Sedang",
        alasan: data.alasan || "Stok dalam kondisi normal",
      }))
      .sort((a, b) => b.skor - a.skor)
      .slice(0, 8);

    // 6. KPI ringkasan
    const totalCabang = await db.select({ count: sql<number>`count(distinct ${cabang.id_cabang})` }).from(cabang);
    const totalKritis = forecasts.filter((f) => f.status === "KRITIS").length;
    const totalForecast = forecasts.length;
    const totalAman = forecasts.filter((f) => f.status === "AMAN").length;
    const serviceLevel = totalForecast > 0 ? ((totalAman / totalForecast) * 100).toFixed(1) : "0.0";

    const pendingRekoms = await db
      .select({ count: sql<number>`count(*)` })
      .from(rekomendasi_pengiriman)
      .where(eq(rekomendasi_pengiriman.status, "DRAFT"));

    return NextResponse.json({
      success: true,
      kpi: {
        totalCabang: totalCabang[0]?.count || 0,
        totalKritis,
        serviceLevel: parseFloat(serviceLevel),
        pendingRekomendasi: pendingRekoms[0]?.count || 0,
      },
      barangKritis,
      cabangKritis,
      fastMoving,
      prioritas,
    });
  } catch (error) {
    console.error("Dashboard distribusi error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data dashboard distribusi", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
