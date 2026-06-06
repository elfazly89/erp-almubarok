import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pengiriman, pengiriman_detail, barang, cabang, forecast_stok } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

// GET /api/distribusi/monitoring — Data pengiriman aktif + service level per cabang
export async function GET() {
  try {
    // Pengiriman aktif (status selain Draft dan Diterima)
    const activeStatuses = ["Pengambilan Barang", "Pengepakan", "Dalam Perjalanan", "Diterima Sementara", "Sedang Dicek"];

    const activeShipments = await db
      .select({
        id_pengiriman: pengiriman.id_pengiriman,
        kode_pengiriman: pengiriman.kode_pengiriman,
        armada: pengiriman.armada,
        driver: pengiriman.driver,
        status: pengiriman.status,
        tanggal_kirim: pengiriman.tanggal_kirim,
        nama_cabang_tujuan: sql<string>`t.nama_cabang`,
      })
      .from(pengiriman)
      .leftJoin(sql`cabang t`, sql`${pengiriman.id_cabang_tujuan} = t.id_cabang`)
      .where(
        and(
          eq(pengiriman.jenis_pengiriman, "DC"),
          sql`${pengiriman.status} IN ('Pengambilan Barang', 'Pengepakan', 'Dalam Perjalanan', 'Diterima Sementara', 'Sedang Dicek')`
        )
      )
      .orderBy(desc(pengiriman.tanggal_kirim));

    // Service level per cabang (30 hari terakhir)
    const date30 = new Date();
    date30.setDate(date30.getDate() - 30);
    const date30Str = date30.toISOString().split("T")[0];

    // Hitung total item dan yang diterima lengkap
    const shipmentsLast30 = await db
      .select({
        id_cabang_tujuan: pengiriman.id_cabang_tujuan,
        status: pengiriman.status,
        nama_cabang: sql<string>`t.nama_cabang`,
      })
      .from(pengiriman)
      .leftJoin(sql`cabang t`, sql`${pengiriman.id_cabang_tujuan} = t.id_cabang`)
      .where(
        and(
          eq(pengiriman.jenis_pengiriman, "DC"),
          sql`${pengiriman.tanggal_kirim} >= ${date30Str}`
        )
      );

    const serviceByBranch: Record<string, { total: number; fulfilled: number }> = {};
    for (const s of shipmentsLast30) {
      const nm = s.nama_cabang || "—";
      if (!serviceByBranch[nm]) serviceByBranch[nm] = { total: 0, fulfilled: 0 };
      serviceByBranch[nm].total++;
      if (s.status === "Diterima Lengkap" || s.status === "Selesai") {
        serviceByBranch[nm].fulfilled++;
      }
    }

    const serviceLevel = Object.entries(serviceByBranch).map(([cabang, data]) => ({
      cabang,
      totalOrder: data.total,
      fulfilledOrder: data.fulfilled,
      serviceLevelPercent:
        data.total > 0 ? parseFloat(((data.fulfilled / data.total) * 100).toFixed(1)) : 0,
    }));

    // Forecast kritis terbaru untuk informasi stok cabang
    const criticalForecast = await db
      .select({
        id_cabang: forecast_stok.id_cabang,
        status: forecast_stok.status,
        nama_cabang: cabang.nama_cabang,
      })
      .from(forecast_stok)
      .leftJoin(cabang, eq(forecast_stok.id_cabang, cabang.id_cabang))
      .where(eq(forecast_stok.status, "KRITIS"));

    const criticalBranches = [...new Set(criticalForecast.map((f) => f.nama_cabang))];

    return NextResponse.json({
      success: true,
      activeShipments,
      serviceLevel,
      criticalBranches,
    });
  } catch (error) {
    console.error("Monitoring GET error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data monitoring", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
