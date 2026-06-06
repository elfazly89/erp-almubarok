import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  rekomendasi_pengiriman,
  rekomendasi_pengiriman_detail,
  forecast_stok,
  stok_setting_cabang,
  barang,
  cabang,
  pengiriman,
  pengiriman_detail,
  users,
} from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

// GET /api/distribusi/rekomendasi — Daftar semua rekomendasi dengan detail
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const idFilter = searchParams.get("id"); // get single rekomendasi detail

    if (idFilter) {
      // Ambil detail rekomendasi tertentu
      const details = await db
        .select({
          id: rekomendasi_pengiriman_detail.id,
          id_barang: rekomendasi_pengiriman_detail.id_barang,
          id_cabang_tujuan: rekomendasi_pengiriman_detail.id_cabang_tujuan,
          stok_sekarang: rekomendasi_pengiriman_detail.stok_sekarang,
          ads: rekomendasi_pengiriman_detail.ads,
          qty_rekomendasi: rekomendasi_pengiriman_detail.qty_rekomendasi,
          target_stock: rekomendasi_pengiriman_detail.target_stock,
          prioritas_score: rekomendasi_pengiriman_detail.prioritas_score,
          qty_approved: rekomendasi_pengiriman_detail.qty_approved,
          nama_barang: barang.nama_barang,
          nama_cabang: cabang.nama_cabang,
        })
        .from(rekomendasi_pengiriman_detail)
        .leftJoin(barang, eq(rekomendasi_pengiriman_detail.id_barang, barang.id_barang))
        .leftJoin(cabang, eq(rekomendasi_pengiriman_detail.id_cabang_tujuan, cabang.id_cabang))
        .where(eq(rekomendasi_pengiriman_detail.id_rekomendasi, parseInt(idFilter)));

      const header = await db
        .select()
        .from(rekomendasi_pengiriman)
        .where(eq(rekomendasi_pengiriman.id, parseInt(idFilter)))
        .limit(1);

      return NextResponse.json({ success: true, header: header[0] || null, details });
    }

    // Daftar semua rekomendasi
    const headers = await db
      .select()
      .from(rekomendasi_pengiriman)
      .orderBy(desc(rekomendasi_pengiriman.created_at));

    // Untuk setiap header, ambil detail singkat
    const results = await Promise.all(
      headers.map(async (h) => {
        const details = await db
          .select({
            id: rekomendasi_pengiriman_detail.id,
            id_barang: rekomendasi_pengiriman_detail.id_barang,
            id_cabang_tujuan: rekomendasi_pengiriman_detail.id_cabang_tujuan,
            stok_sekarang: rekomendasi_pengiriman_detail.stok_sekarang,
            ads: rekomendasi_pengiriman_detail.ads,
            qty_rekomendasi: rekomendasi_pengiriman_detail.qty_rekomendasi,
            qty_approved: rekomendasi_pengiriman_detail.qty_approved,
            target_stock: rekomendasi_pengiriman_detail.target_stock,
            prioritas_score: rekomendasi_pengiriman_detail.prioritas_score,
            nama_barang: barang.nama_barang,
            nama_cabang: cabang.nama_cabang,
          })
          .from(rekomendasi_pengiriman_detail)
          .leftJoin(barang, eq(rekomendasi_pengiriman_detail.id_barang, barang.id_barang))
          .leftJoin(cabang, eq(rekomendasi_pengiriman_detail.id_cabang_tujuan, cabang.id_cabang))
          .where(eq(rekomendasi_pengiriman_detail.id_rekomendasi, h.id));

        return { ...h, details };
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Rekomendasi GET error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat rekomendasi", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST /api/distribusi/rekomendasi — Generate rekomendasi baru dari forecast
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, targetDays = 14, catatanHeader = "" } = body;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Kode rekomendasi otomatis
    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(rekomendasi_pengiriman)
      .where(sql`strftime('%Y-%m', ${rekomendasi_pengiriman.tanggal_rekomendasi}) = strftime('%Y-%m', 'now')`);

    const urutan = (Number(count[0]?.count ?? 0) + 1).toString().padStart(3, "0");
    const kodeRkm = `RKM/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${urutan}`;

    // Buat header rekomendasi
    const [newRkm] = await db
      .insert(rekomendasi_pengiriman)
      .values({
        kode_rekomendasi: kodeRkm,
        tanggal_rekomendasi: todayStr,
        status: "DRAFT",
        dibuat_oleh: userId || null,
        catatan: catatanHeader,
      })
      .returning();

    // Ambil semua forecast KRITIS dan PERHATIAN
    const criticalForecasts = await db
      .select({
        id: forecast_stok.id,
        id_barang: forecast_stok.id_barang,
        id_cabang: forecast_stok.id_cabang,
        stok_sekarang: forecast_stok.stok_sekarang,
        ads: forecast_stok.ads,
        estimasi_habis_hari: forecast_stok.estimasi_habis_hari,
        status: forecast_stok.status,
      })
      .from(forecast_stok)
      .where(sql`${forecast_stok.status} IN ('KRITIS', 'PERHATIAN')`);

    // Generate detail per item
    const detailInserts = [];
    for (const fc of criticalForecasts) {
      const ads = fc.ads !== null ? fc.ads / 100 : 0;
      const targetStock = Math.ceil(ads * targetDays);
      const qtyRekomendasi = Math.max(0, targetStock - fc.stok_sekarang);

      if (qtyRekomendasi <= 0) continue;

      // Hitung skor prioritas (0-100)
      const habis = fc.estimasi_habis_hari || 999;
      const faktorHabis = Math.max(0, Math.min(100, (1 / (habis + 0.1)) * 200));
      const faktorAds = Math.min(100, ads * 2);
      const prioritas = Math.round(0.7 * faktorHabis + 0.3 * faktorAds);

      detailInserts.push({
        id_rekomendasi: newRkm.id,
        id_barang: fc.id_barang,
        id_cabang_tujuan: fc.id_cabang,
        stok_sekarang: fc.stok_sekarang,
        ads: Math.round(ads * 100),
        qty_rekomendasi: qtyRekomendasi,
        target_stock: targetStock,
        prioritas_score: prioritas,
        qty_approved: qtyRekomendasi,
      });
    }

    if (detailInserts.length > 0) {
      await db.insert(rekomendasi_pengiriman_detail).values(detailInserts);
    }

    return NextResponse.json({
      success: true,
      message: `Rekomendasi ${kodeRkm} berhasil dibuat dengan ${detailInserts.length} item.`,
      id: newRkm.id,
      kode: kodeRkm,
      totalItem: detailInserts.length,
    });
  } catch (error) {
    console.error("Rekomendasi POST error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat rekomendasi", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// PUT /api/distribusi/rekomendasi — Update status, edit qty, atau generate ke pengiriman
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, detailId, newStatus, qtyApproved, userId, armada, driver } = body;

    if (action === "update_status") {
      // Update status rekomendasi header
      await db
        .update(rekomendasi_pengiriman)
        .set({ status: newStatus, updated_at: new Date().toISOString().split("T")[0] })
        .where(eq(rekomendasi_pengiriman.id, id));

      return NextResponse.json({ success: true, message: `Status rekomendasi diubah ke ${newStatus}` });
    }

    if (action === "update_qty") {
      // Update qty_approved pada detail
      await db
        .update(rekomendasi_pengiriman_detail)
        .set({ qty_approved: qtyApproved })
        .where(eq(rekomendasi_pengiriman_detail.id, detailId));

      return NextResponse.json({ success: true, message: "Jumlah rekomendasi berhasil diperbarui" });
    }

    if (action === "generate_shipment") {
      // Ambil rekomendasi dan detailnya
      const header = await db
        .select()
        .from(rekomendasi_pengiriman)
        .where(and(eq(rekomendasi_pengiriman.id, id), eq(rekomendasi_pengiriman.status, "APPROVED")))
        .limit(1);

      if (!header[0]) {
        return NextResponse.json(
          { success: false, message: "Rekomendasi tidak ditemukan atau belum APPROVED" },
          { status: 400 }
        );
      }

      const details = await db
        .select({
          id: rekomendasi_pengiriman_detail.id,
          id_barang: rekomendasi_pengiriman_detail.id_barang,
          id_cabang_tujuan: rekomendasi_pengiriman_detail.id_cabang_tujuan,
          qty_approved: rekomendasi_pengiriman_detail.qty_approved,
          qty_rekomendasi: rekomendasi_pengiriman_detail.qty_rekomendasi,
        })
        .from(rekomendasi_pengiriman_detail)
        .where(eq(rekomendasi_pengiriman_detail.id_rekomendasi, id));

      // Group by cabang
      const byBranch: Record<number, typeof details> = {};
      for (const d of details) {
        const cid = d.id_cabang_tujuan!;
        if (!byBranch[cid]) byBranch[cid] = [];
        byBranch[cid].push(d);
      }

      // Ambil ID cabang DC (cabang sumber)
      const dcCabang = await db.select().from(cabang).where(eq(cabang.nama_cabang, "PUSAT")).limit(1);
      const idDC = dcCabang[0]?.id_cabang || 1;

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const shipmentIds = [];
      for (const [cabangId, items] of Object.entries(byBranch)) {
        // Kode surat jalan
        const countSj = await db.select({ count: sql<number>`count(*)` }).from(pengiriman);
        const urutanSj = (Number(countSj[0]?.count ?? 0) + 1).toString().padStart(4, "0");
        const kodeSj = `SJ-DC-${todayStr.replace(/-/g, "")}${urutanSj}`;

        const [newSj] = await db
          .insert(pengiriman)
          .values({
            kode_pengiriman: kodeSj,
            id_cabang_sumber: idDC,
            id_cabang_tujuan: parseInt(cabangId),
            id_user_pengirim: userId || 1,
            jenis_pengiriman: "DC",
            id_rekomendasi: id,
            armada: armada || null,
            driver: driver || null,
            status: "Draft",
            tanggal_kirim: todayStr,
          })
          .returning();

        // Insert detail
        const detailRows = items.map((item) => ({
          id_pengiriman: newSj.id_pengiriman,
          id_barang: item.id_barang,
          jumlah_dikirim: item.qty_approved ?? item.qty_rekomendasi,
        }));

        if (detailRows.length > 0) {
          await db.insert(pengiriman_detail).values(detailRows);
        }

        shipmentIds.push(newSj.id_pengiriman);
      }

      // Update status rekomendasi
      await db
        .update(rekomendasi_pengiriman)
        .set({ status: "GENERATED_TO_SHIPMENT", updated_at: todayStr })
        .where(eq(rekomendasi_pengiriman.id, id));

      return NextResponse.json({
        success: true,
        message: `${Object.keys(byBranch).length} surat jalan DC berhasil dibuat.`,
        shipmentIds,
      });
    }

    return NextResponse.json({ success: false, message: "Action tidak dikenal" }, { status: 400 });
  } catch (error) {
    console.error("Rekomendasi PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses rekomendasi", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
