import { Hono } from "hono";
import { db } from "../lib/db";
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
  rekomendasi_pengiriman,
  rekomendasi_pengiriman_detail,
  pengiriman,
  pengiriman_detail,
  pengiriman_selisih,
  users
} from "../lib/db/schema";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { JWTPayload } from "../lib/auth/jwt";

// Global in-memory set to persist ignored transfer recommendations
const ignoredTransferKeys = new Set<string>();

export const distribusiRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// ==========================================
// 1. FORECAST STOK
// ==========================================
distribusiRoutes.get("/forecast", async (c) => {
  const cabangFilter = c.req.query("cabang") || "";
  const searchFilter = c.req.query("search") || "";

  const results = await db
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

  return c.json({ success: true, data, total: data.length });
});

distribusiRoutes.post("/forecast", async (c) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const allBarang = await db.select({ id: barang.id_barang }).from(barang);
    const allCabang = await db.select({ id: cabang.id_cabang }).from(cabang);

    // 1. Batch load all stok_barang
    const stokList = await db.select().from(stok_barang);
    const stokMap = new Map<string, number>();
    for (const s of stokList) {
      stokMap.set(`${s.id_barang}-${s.id_cabang}`, s.stok_akhir || 0);
    }

    // 2. Batch load all 30-day sales data
    const date30 = new Date(today);
    date30.setDate(today.getDate() - 30);
    const date30Str = date30.toISOString().split("T")[0];

    const salesList = await db
      .select({
        id_barang: penjualan_detail.id_barang,
        id_cabang: penjualan.id_cabang,
        totalQty: sql<number>`SUM(${penjualan_detail.jumlah})`,
      })
      .from(penjualan_detail)
      .leftJoin(penjualan, eq(penjualan_detail.id_penjualan, penjualan.id_penjualan))
      .where(gte(penjualan.tanggal_invoice, date30Str))
      .groupBy(penjualan_detail.id_barang, penjualan.id_cabang);

    const salesMap = new Map<string, number>();
    for (const s of salesList) {
      salesMap.set(`${s.id_barang}-${s.id_cabang}`, Number(s.totalQty || 0));
    }

    // 3. Batch load all stok_setting_cabang
    const settingList = await db.select().from(stok_setting_cabang);
    const settingMap = new Map<string, typeof stok_setting_cabang.$inferSelect>();
    for (const s of settingList) {
      settingMap.set(`${s.id_barang}-${s.id_cabang}`, s);
    }

    // 4. Batch load all forecast_stok
    const forecastList = await db.select().from(forecast_stok);
    const forecastMap = new Map<string, typeof forecast_stok.$inferSelect>();
    for (const f of forecastList) {
      forecastMap.set(`${f.id_barang}-${f.id_cabang}`, f);
    }

    // 5. Batch load all sales_velocity
    const velocityList = await db.select().from(sales_velocity);
    const velocityMap = new Map<string, typeof sales_velocity.$inferSelect>();
    for (const v of velocityList) {
      velocityMap.set(`${v.id_barang}-${v.id_cabang}`, v);
    }

    let processed = 0;

    for (const b of allBarang) {
      for (const cs of allCabang) {
        const key = `${b.id}-${cs.id}`;
        const stokSekarang = stokMap.get(key) ?? 0;
        const totalQty30 = salesMap.get(key) ?? 0;
        const ads30 = totalQty30 / 30;

        const setting = settingMap.get(key);
        const leadTime = setting?.lead_time_days ?? 2;
        const safetyDays = setting?.safety_stock ?? 3;

        const stockCoverHari = ads30 > 0 ? Math.floor(stokSekarang / ads30) : 999;

        let status = "AMAN";
        if (stockCoverHari <= leadTime) status = "KRITIS";
        else if (stockCoverHari <= safetyDays) status = "PERHATIAN";

        const habisDate = new Date(today);
        habisDate.setDate(today.getDate() + Math.min(stockCoverHari, 365));
        const tanggalHabis = ads30 > 0 ? habisDate.toISOString().split("T")[0] : null;

        const existing = forecastMap.get(key);
        if (existing) {
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
            .where(eq(forecast_stok.id, existing.id));
        } else {
          await db.insert(forecast_stok).values({
            id_barang: b.id,
            id_cabang: cs.id,
            stok_sekarang: stokSekarang,
            ads: Math.round(ads30 * 100),
            estimasi_habis_hari: stockCoverHari > 365 ? 999 : stockCoverHari,
            tanggal_habis: tanggalHabis,
            status: status,
            created_at: todayStr,
          });
        }

        const velExisting = velocityMap.get(key);
        const velData = { ads_30: Math.round(ads30 * 100), last_calculated: todayStr };

        if (velExisting) {
          await db.update(sales_velocity).set(velData).where(eq(sales_velocity.id, velExisting.id));
        } else {
          await db.insert(sales_velocity).values({ id_barang: b.id, id_cabang: cs.id, ...velData });
        }

        processed++;
      }
    }

    return c.json({
      success: true,
      message: `Berhasil menghitung ulang ${processed} kombinasi barang x cabang.`,
      processed,
    });
  } catch (error: any) {
    return c.json({ success: false, message: "Gagal menghitung ulang forecast: " + error.message }, 500);
  }
});

// ==========================================
// 2. REKOMENDASI PENGIRIMAN
// ==========================================
distribusiRoutes.get("/rekomendasi", async (c) => {
  const idFilter = c.req.query("id");

  if (idFilter) {
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

    return c.json({ success: true, header: header[0] || null, details });
  }

  const headers = await db
    .select()
    .from(rekomendasi_pengiriman)
    .orderBy(desc(rekomendasi_pengiriman.created_at));

  if (headers.length === 0) {
    return c.json({ success: true, data: [] });
  }

  // Load all details in one batch query to avoid N+1 queries
  const allDetails = await db
    .select({
      id: rekomendasi_pengiriman_detail.id,
      id_rekomendasi: rekomendasi_pengiriman_detail.id_rekomendasi,
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
    .leftJoin(cabang, eq(rekomendasi_pengiriman_detail.id_cabang_tujuan, cabang.id_cabang));

  const detailsMap = new Map<number, typeof allDetails>();
  for (const d of allDetails) {
    const list = detailsMap.get(d.id_rekomendasi) ?? [];
    list.push(d);
    detailsMap.set(d.id_rekomendasi, list);
  }

  const results = headers.map((h) => ({
    ...h,
    details: detailsMap.get(h.id) ?? [],
  }));

  return c.json({ success: true, data: results });
});

distribusiRoutes.post("/rekomendasi", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const { targetDays = 14, catatanHeader = "" } = body;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Count today's recommendations (PostgreSQL compatible)
    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(rekomendasi_pengiriman)
      .where(sql`substring(${rekomendasi_pengiriman.tanggal_rekomendasi} from 1 for 7) = to_char(now(), 'YYYY-MM')`);

    const urutan = (Number(count[0]?.count ?? 0) + 1).toString().padStart(3, "0");
    const kodeRkm = `RKM/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${urutan}`;

    const [newRkm] = await db
      .insert(rekomendasi_pengiriman)
      .values({
        kode_rekomendasi: kodeRkm,
        tanggal_rekomendasi: todayStr,
        status: "DRAFT",
        dibuat_oleh: activeUser.id,
        catatan: catatanHeader,
      })
      .returning();

    const criticalForecasts = await db
      .select()
      .from(forecast_stok)
      .where(sql`${forecast_stok.status} IN ('KRITIS', 'PERHATIAN')`);

    const detailInserts = [];
    for (const fc of criticalForecasts) {
      const ads = fc.ads !== null ? fc.ads / 100 : 0;
      const targetStock = Math.ceil(ads * targetDays);
      const qtyRekomendasi = Math.max(0, targetStock - fc.stok_sekarang);

      if (qtyRekomendasi <= 0) continue;

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

    return c.json({
      success: true,
      message: `Rekomendasi ${kodeRkm} berhasil dibuat.`,
      id: newRkm.id,
      kode: kodeRkm,
      totalItem: detailInserts.length,
    });
  } catch (error: any) {
    return c.json({ success: false, message: "Gagal membuat rekomendasi: " + error.message }, 500);
  }
});

distribusiRoutes.put("/rekomendasi", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const { action, id, detailId, newStatus, qtyApproved, armada, driver } = body;

    if (action === "update_status") {
      await db
        .update(rekomendasi_pengiriman)
        .set({ status: newStatus, updated_at: new Date().toISOString().split("T")[0] })
        .where(eq(rekomendasi_pengiriman.id, id));
      return c.json({ success: true, message: `Status diubah ke ${newStatus}` });
    }

    if (action === "update_qty") {
      await db
        .update(rekomendasi_pengiriman_detail)
        .set({ qty_approved: parseInt(qtyApproved) })
        .where(eq(rekomendasi_pengiriman_detail.id, detailId));
      return c.json({ success: true, message: "Kuantitas disetujui berhasil diperbarui" });
    }

    if (action === "generate_shipment") {
      const details = await db
        .select()
        .from(rekomendasi_pengiriman_detail)
        .where(eq(rekomendasi_pengiriman_detail.id_rekomendasi, id));

      if (details.length === 0) {
        return c.json({ success: false, message: "Rekomendasi tidak memiliki item" }, 400);
      }

      // Dynamic DC Source Branch Detection (DK-3 Fix)
      const dcBranch = await db
        .select({ id: cabang.id_cabang })
        .from(cabang)
        .where(eq(cabang.is_dc, true))
        .limit(1);
      const dcBranchId = dcBranch[0]?.id ?? 3; // Fallback to 3 (DC Pusat)

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // Group details by id_cabang_tujuan (DK-2 Fix)
      const detailsByBranch = new Map<number, typeof details>();
      for (const d of details) {
        const list = detailsByBranch.get(d.id_cabang_tujuan) ?? [];
        list.push(d);
        detailsByBranch.set(d.id_cabang_tujuan, list);
      }

      // Get initial counter for shipments
      const shipCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(pengiriman)
        .where(eq(pengiriman.tanggal_kirim, todayStr));
      let count = Number(shipCount[0]?.count ?? 0);

      const generatedShipments = [];

      await db.transaction(async (tx) => {
        for (const [idCabangTujuan, itemsForBranch] of detailsByBranch.entries()) {
          count++;
          const seqNum = count.toString().padStart(3, "0");
          const rand = Math.floor(1000 + Math.random() * 9000); // Random suffix to prevent duplicates (DB-2 Fix)
          const kodeShipment = `KIRIM/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/DC/${seqNum}-${rand}`;

          const [newShipment] = await tx
            .insert(pengiriman)
            .values({
              kode_pengiriman: kodeShipment,
              id_cabang_sumber: dcBranchId,
              id_cabang_tujuan: idCabangTujuan,
              id_user_pengirim: activeUser.id,
              jenis_pengiriman: "DC",
              id_rekomendasi: id,
              armada: armada || "Manual DC",
              driver: driver || "Driver DC",
              status: "Draft",
              tanggal_kirim: todayStr,
            })
            .returning();

          const shipDetails = itemsForBranch.map((d) => ({
            id_pengiriman: newShipment.id_pengiriman,
            id_barang: d.id_barang,
            jumlah_dikirim: d.qty_approved || d.qty_rekomendasi,
            jumlah_diterima: null,
          }));

          await tx.insert(pengiriman_detail).values(shipDetails);
          generatedShipments.push(newShipment);
        }

        // Update status recommendation
        await tx
          .update(rekomendasi_pengiriman)
          .set({ status: "GENERATED_TO_SHIPMENT" })
          .where(eq(rekomendasi_pengiriman.id, id));
      });

      return c.json({
        success: true,
        message: `Berhasil men-generate ${generatedShipments.length} surat jalan pengiriman dari rekomendasi.`,
        id: generatedShipments[0]?.id_pengiriman,
      });
    }

    return c.json({ success: false, message: "Action tidak dikenali" }, 400);
  } catch (error: any) {
    return c.json({ success: false, message: "Gagal memproses rekomendasi: " + error.message }, 500);
  }
});

// ==========================================
// 3. SHIPMENT PENGIRIMAN
// ==========================================
distribusiRoutes.get("/pengiriman", async (c) => {
  const user = c.get("user");
  const idFilter = c.req.query("id");
  const jenisFilter = c.req.query("jenis") || "DC";

  const cSrc = alias(cabang, "c_src");
  const cDest = alias(cabang, "c_dest");

  if (idFilter) {
    const [header] = await db
      .select({
        id_pengiriman: pengiriman.id_pengiriman,
        kode_pengiriman: pengiriman.kode_pengiriman,
        id_cabang_sumber: pengiriman.id_cabang_sumber,
        id_cabang_tujuan: pengiriman.id_cabang_tujuan,
        id_user_pengirim: pengiriman.id_user_pengirim,
        id_user_penerima: pengiriman.id_user_penerima,
        jenis_pengiriman: pengiriman.jenis_pengiriman,
        id_rekomendasi: pengiriman.id_rekomendasi,
        armada: pengiriman.armada,
        driver: pengiriman.driver,
        status: pengiriman.status,
        tanggal_kirim: pengiriman.tanggal_kirim,
        tanggal_terima: pengiriman.tanggal_terima,
        created_at: pengiriman.created_at,
        nama_cabang_sumber: cSrc.nama_cabang,
        nama_cabang_tujuan: cDest.nama_cabang,
      })
      .from(pengiriman)
      .leftJoin(cSrc, eq(pengiriman.id_cabang_sumber, cSrc.id_cabang))
      .leftJoin(cDest, eq(pengiriman.id_cabang_tujuan, cDest.id_cabang))
      .where(eq(pengiriman.id_pengiriman, parseInt(idFilter)))
      .limit(1);

    if (!header) {
      return c.json({ error: "Shipment tidak ditemukan" }, 404);
    }

    const details = await db
      .select({
        id: pengiriman_detail.id_detail_kirim,
        id_detail_kirim: pengiriman_detail.id_detail_kirim,
        id_pengiriman: pengiriman_detail.id_pengiriman,
        id_barang: pengiriman_detail.id_barang,
        jumlah_dikirim: pengiriman_detail.jumlah_dikirim,
        jumlah_diterima: pengiriman_detail.jumlah_diterima,
        nama_barang: barang.nama_barang,
        satuan: barang.satuan_1,
      })
      .from(pengiriman_detail)
      .leftJoin(barang, eq(pengiriman_detail.id_barang, barang.id_barang))
      .where(eq(pengiriman_detail.id_pengiriman, header.id_pengiriman));

    const items = details.map(d => ({
      ...d,
      satuan: d.satuan || "pcs"
    }));

    return c.json({ success: true, header, details: items });
  }

  // Filter based on user branch access and jenis (DK-6 Fix)
  let conditions = [eq(pengiriman.jenis_pengiriman, jenisFilter)];
  if (user.id_jabatan !== 1 && user.id_jabatan !== 2) {
    conditions.push(sql`(${pengiriman.id_cabang_sumber} = ${user.id_cabang} OR ${pengiriman.id_cabang_tujuan} = ${user.id_cabang})`);
  }

  const list = await db
    .select({
      id_pengiriman: pengiriman.id_pengiriman,
      kode_pengiriman: pengiriman.kode_pengiriman,
      id_cabang_sumber: pengiriman.id_cabang_sumber,
      id_cabang_tujuan: pengiriman.id_cabang_tujuan,
      id_user_pengirim: pengiriman.id_user_pengirim,
      id_user_penerima: pengiriman.id_user_penerima,
      jenis_pengiriman: pengiriman.jenis_pengiriman,
      id_rekomendasi: pengiriman.id_rekomendasi,
      armada: pengiriman.armada,
      driver: pengiriman.driver,
      status: pengiriman.status,
      tanggal_kirim: pengiriman.tanggal_kirim,
      tanggal_terima: pengiriman.tanggal_terima,
      created_at: pengiriman.created_at,
      nama_cabang_sumber: cSrc.nama_cabang,
      nama_cabang_tujuan: cDest.nama_cabang,
    })
    .from(pengiriman)
    .leftJoin(cSrc, eq(pengiriman.id_cabang_sumber, cSrc.id_cabang))
    .leftJoin(cDest, eq(pengiriman.id_cabang_tujuan, cDest.id_cabang))
    .where(and(...conditions))
    .orderBy(desc(pengiriman.id_pengiriman));

  // Populate items for each shipment in the list
  const data = await Promise.all(list.map(async (s) => {
    const items = await db
      .select({
        id: pengiriman_detail.id_detail_kirim,
        id_detail_kirim: pengiriman_detail.id_detail_kirim,
        id_pengiriman: pengiriman_detail.id_pengiriman,
        id_barang: pengiriman_detail.id_barang,
        jumlah_dikirim: pengiriman_detail.jumlah_dikirim,
        jumlah_diterima: pengiriman_detail.jumlah_diterima,
        nama_barang: barang.nama_barang,
        satuan: sql<string>`COALESCE(${barang.satuan_1}, 'pcs')`,
      })
      .from(pengiriman_detail)
      .leftJoin(barang, eq(pengiriman_detail.id_barang, barang.id_barang))
      .where(eq(pengiriman_detail.id_pengiriman, s.id_pengiriman));

    return { ...s, items };
  }));

  return c.json({ success: true, data });
});

distribusiRoutes.post("/pengiriman", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const { id_cabang_tujuan, id_cabang_sumber, armada, driver, items } = body;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const shipCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(pengiriman)
      .where(eq(pengiriman.tanggal_kirim, todayStr));

    const seqNum = (Number(shipCount[0]?.count ?? 0) + 1).toString().padStart(3, "0");
    const rand = Math.floor(1000 + Math.random() * 9000); // Random suffix to prevent duplicates (DB-2 Fix)
    const kodeShipment = `KIRIM/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${id_cabang_sumber}/${seqNum}-${rand}`;

    const result = await db.transaction(async (tx) => {
      // Validate source branch stock level before shipping (DB-3 Fix)
      for (const item of items) {
        const idBarang = parseInt(item.id_barang);
        const qtyKirim = parseInt(item.jumlah_dikirim);

        const [stockSource] = await tx
          .select()
          .from(stok_barang)
          .where(and(eq(stok_barang.id_barang, idBarang), eq(stok_barang.id_cabang, parseInt(id_cabang_sumber))))
          .limit(1);

        if (!stockSource || (stockSource.stok_akhir || 0) < qtyKirim) {
          throw new Error(`Stok kurang untuk barang ID ${idBarang} di cabang sumber. Tersedia: ${stockSource?.stok_akhir || 0}, Diminta: ${qtyKirim}`);
        }
      }

      const [newShipment] = await tx
        .insert(pengiriman)
        .values({
          kode_pengiriman: kodeShipment,
          id_cabang_sumber: parseInt(id_cabang_sumber),
          id_cabang_tujuan: parseInt(id_cabang_tujuan),
          id_user_pengirim: activeUser.id,
          jenis_pengiriman: "CABANG",
          armada: armada || "",
          driver: driver || "",
          status: "Draft",
          tanggal_kirim: todayStr,
        })
        .returning();

      const shipDetails = items.map((item: any) => ({
        id_pengiriman: newShipment.id_pengiriman,
        id_barang: parseInt(item.id_barang),
        jumlah_dikirim: parseInt(item.jumlah_dikirim),
        jumlah_diterima: null,
      }));

      await tx.insert(pengiriman_detail).values(shipDetails);
      return newShipment;
    });

    return c.json({ success: true, shipment: result }, 201);
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal membuat pengiriman: " + err.message }, 500);
  }
});

distribusiRoutes.put("/pengiriman", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const { action, id, status, items } = body;

    if (action === "update_status") {
      const [shipmentRecord] = await db
        .select()
        .from(pengiriman)
        .where(eq(pengiriman.id_pengiriman, id))
        .limit(1);

      if (!shipmentRecord) {
        return c.json({ success: false, message: "Shipment tidak ditemukan" }, 404);
      }

      // Idempotency Guard: prevent double submit (DK-4 Fix)
      if (shipmentRecord.status === "Diterima Lengkap" || shipmentRecord.status === "Ada Selisih") {
        return c.json({ success: false, message: "Transaksi ini sudah selesai diproses sebelumnya." }, 409);
      }

      await db.transaction(async (tx) => {
        // Update header status
        const updateValues: any = { status };
        if (status === "Diterima Lengkap" || status === "Ada Selisih") {
          updateValues.tanggal_terima = new Date().toISOString().split("T")[0];
          updateValues.id_user_penerima = activeUser.id;
        }

        await tx.update(pengiriman).set(updateValues).where(eq(pengiriman.id_pengiriman, id));

        const shipmentDetails = await tx
          .select()
          .from(pengiriman_detail)
          .where(eq(pengiriman_detail.id_pengiriman, id));

        // 1. Deduct stock from source branch when transitioning to "Dalam Perjalanan" (DK-1 Fix)
        if (status === "Dalam Perjalanan" && shipmentRecord.status !== "Dalam Perjalanan") {
          for (const item of shipmentDetails) {
            const [stockSource] = await tx
              .select()
              .from(stok_barang)
              .where(and(eq(stok_barang.id_barang, item.id_barang), eq(stok_barang.id_cabang, shipmentRecord.id_cabang_sumber)))
              .limit(1);

            if (!stockSource || (stockSource.stok_akhir || 0) < item.jumlah_dikirim) {
              throw new Error(`Stok kurang di cabang sumber untuk barang ID ${item.id_barang}`);
            }

            await tx
              .update(stok_barang)
              .set({ stok_akhir: (stockSource.stok_akhir || 0) - item.jumlah_dikirim })
              .where(eq(stok_barang.id, stockSource.id));
          }
        }

        // 2. If status is received, update received quantities, source stock (if not already done), and destination stock
        if (status === "Diterima Lengkap" || status === "Ada Selisih") {
          const checkItems = items || shipmentDetails.map(d => ({
            id_detail_kirim: d.id_detail_kirim,
            id_barang: d.id_barang,
            jumlah_dikirim: d.jumlah_dikirim,
            jumlah_diterima: d.jumlah_dikirim // default to full
          }));

          for (const item of checkItems) {
            const detailId = parseInt(item.id_detail_kirim);
            const qtyRec = parseInt(item.jumlah_diterima);
            const qtySent = parseInt(item.jumlah_dikirim);

            // Update details
            await tx
              .update(pengiriman_detail)
              .set({ jumlah_diterima: qtyRec })
              .where(eq(pengiriman_detail.id_detail_kirim, detailId));

            // Reduce stock in SOURCE branch if not already done in "Dalam Perjalanan" (DK-1 Fix)
            if (shipmentRecord.status !== "Dalam Perjalanan") {
              const [stockSource] = await tx
                .select()
                .from(stok_barang)
                .where(and(eq(stok_barang.id_barang, item.id_barang), eq(stok_barang.id_cabang, shipmentRecord.id_cabang_sumber)))
                .limit(1);

              if (stockSource) {
                await tx
                  .update(stok_barang)
                  .set({ stok_akhir: (stockSource.stok_akhir || 0) - qtySent })
                  .where(eq(stok_barang.id, stockSource.id));
              }
            }

            // Increase stock in DESTINATION branch
            const [stockDest] = await tx
              .select()
              .from(stok_barang)
              .where(and(eq(stok_barang.id_barang, item.id_barang), eq(stok_barang.id_cabang, shipmentRecord.id_cabang_tujuan)))
              .limit(1);

            if (stockDest) {
              await tx
                .update(stok_barang)
                .set({ stok_akhir: (stockDest.stok_akhir || 0) + qtyRec })
                .where(eq(stok_barang.id, stockDest.id));
            } else {
              await tx.insert(stok_barang).values({
                id_barang: item.id_barang,
                id_cabang: shipmentRecord.id_cabang_tujuan,
                stok_akhir: qtyRec,
                penjualan: 0,
              });
            }

            // Record discrepancy if any
            if (qtyRec !== qtySent) {
              const diff = qtySent - qtyRec; // positive = missing/under, negative = excess/over
              await tx.insert(pengiriman_selisih).values({
                id_pengiriman: id,
                id_barang: item.id_barang,
                jumlah_dikirim: qtySent,
                jumlah_diterima: qtyRec,
                selisih: diff,
                jenis_selisih: diff > 0 ? "KURANG" : "LEBIH",
                alasan: "Pemeriksaan masuk gudang",
                status: "MENUNGGU_PEMERIKSAAN",
                dibuat_oleh: activeUser.nama_user,
              });
            }
          }
        }
      });

      return c.json({ success: true, message: `Status shipment diperbarui ke ${status}` });
    }

    return c.json({ success: false, message: "Action tidak dikenali" }, 400);
  } catch (error: any) {
    return c.json({ success: false, message: "Gagal memperbarui shipment: " + error.message }, 500);
  }
});

// ==========================================
// 4. STOCK SETTING PER CABANG (DMS SETTING)
// ==========================================
distribusiRoutes.get("/setting", async (c) => {
  const user = c.get("user");
  let paramCabang = c.req.query("id_cabang");

  if (!paramCabang) {
    return c.json({ error: "Cabang wajib dispesifikasi" }, 400);
  }

  let idCabang = parseInt(paramCabang);
  if (user.id_jabatan !== 1 && user.id_jabatan !== 2) {
    idCabang = user.id_cabang;
  }

  const data = await db
    .select({
      id: stok_setting_cabang.id,
      id_barang: stok_setting_cabang.id_barang,
      id_cabang: stok_setting_cabang.id_cabang,
      minimum_stock: stok_setting_cabang.minimum_stock,
      safety_stock: stok_setting_cabang.safety_stock,
      target_days_stock: stok_setting_cabang.target_days_stock,
      lead_time_days: stok_setting_cabang.lead_time_days,
      nama_barang: barang.nama_barang,
      barcode: barang.barcode,
    })
    .from(stok_setting_cabang)
    .innerJoin(barang, eq(stok_setting_cabang.id_barang, barang.id_barang))
    .where(eq(stok_setting_cabang.id_cabang, idCabang))
    .orderBy(barang.nama_barang);

  return c.json(data);
});

distribusiRoutes.post("/setting", async (c) => {
  const user = c.get("user");
  try {
    const body = await c.req.json();
    const { id_barang, minimum_stock, safety_stock, target_days_stock, lead_time_days } = body;
    const itemBarang = parseInt(id_barang);

    let itemCabang = parseInt(body.id_cabang);
    if (user.id_jabatan !== 1 && user.id_jabatan !== 2) {
      itemCabang = user.id_cabang;
    }

    const [existing] = await db
      .select()
      .from(stok_setting_cabang)
      .where(and(eq(stok_setting_cabang.id_barang, itemBarang), eq(stok_setting_cabang.id_cabang, itemCabang)))
      .limit(1);

    const values = {
      id_barang: itemBarang,
      id_cabang: itemCabang,
      minimum_stock: parseInt(minimum_stock || "0"),
      safety_stock: parseInt(safety_stock || "0"),
      target_days_stock: parseInt(target_days_stock || "14"),
      lead_time_days: parseInt(lead_time_days || "2"),
    };

    if (existing) {
      const [updated] = await db
        .update(stok_setting_cabang)
        .set(values)
        .where(eq(stok_setting_cabang.id, existing.id))
        .returning();
      return c.json(updated);
    } else {
      const [inserted] = await db.insert(stok_setting_cabang).values(values).returning();
      return c.json(inserted, 201);
    }
  } catch (err: any) {
    return c.json({ error: "Gagal menyimpan setting: " + err.message }, 500);
  }
});

// ==========================================
// 5. TRANSFER ANTAR CABANG
// ==========================================
distribusiRoutes.get("/transfer", async (c) => {
  const user = c.get("user");
  try {
    // Fetch all forecast_stok joined with barang and cabang
    const forecasts = await db
      .select({
        id: forecast_stok.id,
        id_barang: forecast_stok.id_barang,
        id_cabang: forecast_stok.id_cabang,
        stok_sekarang: forecast_stok.stok_sekarang,
        ads: forecast_stok.ads,
        status: forecast_stok.status,
        nama_barang: barang.nama_barang,
        barcode: barang.barcode,
        nama_cabang: cabang.nama_cabang,
      })
      .from(forecast_stok)
      .leftJoin(barang, eq(forecast_stok.id_barang, barang.id_barang))
      .leftJoin(cabang, eq(forecast_stok.id_cabang, cabang.id_cabang));

    // Split into understock (destination candidates) and overstock (source candidates)
    const targets = forecasts.filter(f => f.status === "KRITIS" || f.status === "PERHATIAN");
    const sources = forecasts.filter(f => f.status === "AMAN" && f.stok_sekarang > 10);

    const data: any[] = [];
    let suggestionId = 1;

    for (const t of targets) {
      // Find potential source branch for the same barang
      const matchingSources = sources.filter(s => s.id_barang === t.id_barang && s.id_cabang !== t.id_cabang);
      if (matchingSources.length === 0) continue;

      // Sort by stock descending (most stock first)
      matchingSources.sort((a, b) => b.stok_sekarang - a.stok_sekarang);

      const bestSource = matchingSources[0];

      // Calculate how much we want to transfer
      const adsT = (t.ads || 0) / 100;
      const adsS = (bestSource.ads || 0) / 100;
      const targetDays = 14;
      const targetStock = Math.ceil(adsT * targetDays);
      const deficit = Math.max(1, targetStock - t.stok_sekarang);

      // Source must keep at least some safety stock
      const sourceKeep = Math.max(5, Math.ceil(adsS * 7));
      const excess = Math.max(0, bestSource.stok_sekarang - sourceKeep);

      const qtyTransfer = Math.min(deficit, excess);
      if (qtyTransfer <= 0) continue;

      const key = `${t.id_barang}-${bestSource.id_cabang}-${t.id_cabang}`;
      
      // Check if ignored (DK-8 Fix)
      if (ignoredTransferKeys.has(key)) continue;

      // Check if already processed (exists a draft shipment)
      const [existingShipment] = await db
        .select({ id: pengiriman.id_pengiriman })
        .from(pengiriman)
        .leftJoin(pengiriman_detail, eq(pengiriman.id_pengiriman, pengiriman_detail.id_pengiriman))
        .where(
          and(
            eq(pengiriman.id_cabang_sumber, bestSource.id_cabang),
            eq(pengiriman.id_cabang_tujuan, t.id_cabang),
            eq(pengiriman_detail.id_barang, t.id_barang),
            eq(pengiriman.status, "Draft")
          )
        )
        .limit(1);

      const status = existingShipment ? "PROCESSED" : "PENDING";

      data.push({
        id: suggestionId++,
        id_barang: t.id_barang,
        barang: t.nama_barang || "—",
        barcode: t.barcode || "",
        cabangAsal: bestSource.nama_cabang || "—",
        id_cabang_asal: bestSource.id_cabang,
        stokAsal: bestSource.stok_sekarang,
        adsAsal: Math.round(adsS * 10) / 10,
        cabangTujuan: t.nama_cabang || "—",
        id_cabang_tujuan: t.id_cabang,
        stokTujuan: t.stok_sekarang,
        adsTujuan: Math.round(adsT * 10) / 10,
        qtyTransfer,
        potensiCoverHari: adsT > 0 ? Math.round(qtyTransfer / adsT) : 99,
        status,
      });
    }

    return c.json({ success: true, data });
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal memuat rekomendasi transfer: " + err.message }, 500);
  }
});

distribusiRoutes.put("/transfer", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const { action, idBarang, idCabangAsal, idCabangTujuan, qtyTransfer } = body;

    if (action === "ignore") {
      const key = `${idBarang}-${idCabangAsal}-${idCabangTujuan}`;
      ignoredTransferKeys.add(key);
      return c.json({ success: true, message: "Rekomendasi transfer diabaikan." });
    }

    if (action === "process") {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // Get count for shipment code
      const shipCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(pengiriman)
        .where(eq(pengiriman.tanggal_kirim, todayStr));

      const seqNum = (Number(shipCount[0]?.count ?? 0) + 1).toString().padStart(3, "0");
      const rand = Math.floor(1000 + Math.random() * 9000);
      const kodeShipment = `KIRIM/${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${idCabangAsal}/${seqNum}-${rand}`;

      const newShipment = await db.transaction(async (tx) => {
        const [shipment] = await tx
          .insert(pengiriman)
          .values({
            kode_pengiriman: kodeShipment,
            id_cabang_sumber: parseInt(idCabangAsal),
            id_cabang_tujuan: parseInt(idCabangTujuan),
            id_user_pengirim: activeUser.id, // DK-7 Fix: use logged-in user context
            jenis_pengiriman: "CABANG",
            armada: "Manual Transfer",
            driver: "Sopir Cabang",
            status: "Draft",
            tanggal_kirim: todayStr,
          })
          .returning();

        await tx.insert(pengiriman_detail).values({
          id_pengiriman: shipment.id_pengiriman,
          id_barang: parseInt(idBarang),
          jumlah_dikirim: parseInt(qtyTransfer),
          jumlah_diterima: null,
        });

        return shipment;
      });

      return c.json({ success: true, kode: newShipment.kode_pengiriman });
    }

    return c.json({ success: false, message: "Action tidak dikenali" }, 400);
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal memproses transfer: " + err.message }, 500);
  }
});

// ==========================================
// 6. MONITORING DISTRIBUSI
// ==========================================
distribusiRoutes.get("/monitoring", async (c) => {
  try {
    const cDest = alias(cabang, "c_dest");

    const activeList = await db
      .select({
        id_pengiriman: pengiriman.id_pengiriman,
        kode_pengiriman: pengiriman.kode_pengiriman,
        status: pengiriman.status,
        driver: pengiriman.driver,
        armada: pengiriman.armada,
        nama_cabang_tujuan: cDest.nama_cabang,
      })
      .from(pengiriman)
      .leftJoin(cDest, eq(pengiriman.id_cabang_tujuan, cDest.id_cabang))
      .where(sql`${pengiriman.status} NOT IN ('Diterima Lengkap', 'Ada Selisih', 'Selesai', 'Rejected')`);

    // Service level (calculated from last 30 days)
    const branches = await db.select().from(cabang);
    const serviceLevel = await Promise.all(branches.map(async (cb) => {
      const [totalCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pengiriman)
        .where(eq(pengiriman.id_cabang_tujuan, cb.id_cabang));

      const [fulfilledCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(pengiriman)
        .where(
          and(
            eq(pengiriman.id_cabang_tujuan, cb.id_cabang),
            sql`${pengiriman.status} IN ('Diterima Lengkap', 'Ada Selisih', 'Selesai')`
          )
        );

      const total = Number(totalCount?.count ?? 0);
      const fulfilled = Number(fulfilledCount?.count ?? 0);
      
      const serviceLevelPercent = total > 0 ? Math.round((fulfilled / total) * 100) : 100;

      return {
        cabang: cb.nama_cabang,
        totalOrder: total || 10,
        fulfilledOrder: fulfilled || 10,
        serviceLevelPercent: total > 0 ? serviceLevelPercent : 100,
      };
    }));

    return c.json({
      success: true,
      activeShipments: activeList,
      serviceLevel,
    });
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal memuat monitoring: " + err.message }, 500);
  }
});

// ==========================================
// 7. SELISIH PENGIRIMAN
// ==========================================
distribusiRoutes.get("/selisih", async (c) => {
  const mode = c.req.query("mode");
  try {
    if (mode === "antrian") {
      const cDest = alias(cabang, "c_dest");
      const list = await db
        .select({
          id_pengiriman: pengiriman.id_pengiriman,
          kode_pengiriman: pengiriman.kode_pengiriman,
          tanggal_kirim: pengiriman.tanggal_kirim,
          driver: pengiriman.driver,
          nama_cabang_tujuan: cDest.nama_cabang,
        })
        .from(pengiriman)
        .leftJoin(cDest, eq(pengiriman.id_cabang_tujuan, cDest.id_cabang))
        .where(eq(pengiriman.status, "Dalam Perjalanan"));

      const data = await Promise.all(list.map(async (s) => {
        const items = await db
          .select({
            id: pengiriman_detail.id_detail_kirim,
            id_barang: pengiriman_detail.id_barang,
            jumlah_dikirim: pengiriman_detail.jumlah_dikirim,
            nama_barang: barang.nama_barang,
            barcode: barang.barcode,
          })
          .from(pengiriman_detail)
          .leftJoin(barang, eq(pengiriman_detail.id_barang, barang.id_barang))
          .where(eq(pengiriman_detail.id_pengiriman, s.id_pengiriman));

        return { ...s, items };
      }));

      return c.json({ success: true, data });
    }

    if (mode === "laporan") {
      const cDest = alias(cabang, "c_dest");
      const reports = await db
        .select({
          id: pengiriman_selisih.id,
          kode_pengiriman: pengiriman.kode_pengiriman,
          nama_cabang: cDest.nama_cabang,
          nama_barang: barang.nama_barang,
          jumlah_dikirim: pengiriman_selisih.jumlah_dikirim,
          jumlah_diterima: pengiriman_selisih.jumlah_diterima,
          selisih: pengiriman_selisih.selisih,
          jenis_selisih: pengiriman_selisih.jenis_selisih,
          alasan: pengiriman_selisih.alasan,
          foto_bukti: pengiriman_selisih.foto_bukti,
          status: pengiriman_selisih.status,
          dibuat_oleh: pengiriman_selisih.dibuat_oleh,
          created_at: pengiriman_selisih.created_at,
        })
        .from(pengiriman_selisih)
        .leftJoin(pengiriman, eq(pengiriman_selisih.id_pengiriman, pengiriman.id_pengiriman))
        .leftJoin(cDest, eq(pengiriman.id_cabang_tujuan, cDest.id_cabang))
        .leftJoin(barang, eq(pengiriman_selisih.id_barang, barang.id_barang))
        .orderBy(desc(pengiriman_selisih.id));

      return c.json({ success: true, data: reports });
    }

    return c.json({ success: false, message: "Mode tidak dikenali" }, 400);
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal memuat selisih: " + err.message }, 500);
  }
});

distribusiRoutes.post("/selisih", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const { idPengiriman, pemeriksaName, items } = body;

    const [shipmentRecord] = await db
      .select()
      .from(pengiriman)
      .where(eq(pengiriman.id_pengiriman, idPengiriman))
      .limit(1);

    if (!shipmentRecord) {
      return c.json({ success: false, message: "Shipment tidak ditemukan" }, 404);
    }

    let hasDiscrepancy = false;
    for (const item of items) {
      if (parseInt(item.jumlahDikirim) !== parseInt(item.jumlahDiterima)) {
        hasDiscrepancy = true;
        break;
      }
    }

    const finalStatus = hasDiscrepancy ? "Ada Selisih" : "Diterima Lengkap";

    await db.transaction(async (tx) => {
      await tx
        .update(pengiriman)
        .set({
          status: finalStatus,
          tanggal_terima: new Date().toISOString().split("T")[0],
          id_user_penerima: activeUser.id,
        })
        .where(eq(pengiriman.id_pengiriman, idPengiriman));

      for (const item of items) {
        const qtyRec = parseInt(item.jumlahDiterima);
        const qtySent = parseInt(item.jumlahDikirim);

        await tx
          .update(pengiriman_detail)
          .set({ jumlah_diterima: qtyRec })
          .where(
            and(
              eq(pengiriman_detail.id_pengiriman, idPengiriman),
              eq(pengiriman_detail.id_barang, item.idBarang)
            )
          );

        // Reduce stock in SOURCE branch if not already done in "Dalam Perjalanan" (DK-1 Fix)
        if (shipmentRecord.status !== "Dalam Perjalanan") {
          const [stockSource] = await tx
            .select()
            .from(stok_barang)
            .where(and(eq(stok_barang.id_barang, item.idBarang), eq(stok_barang.id_cabang, shipmentRecord.id_cabang_sumber)))
            .limit(1);

          if (stockSource) {
            await tx
              .update(stok_barang)
              .set({ stok_akhir: (stockSource.stok_akhir || 0) - qtySent })
              .where(eq(stok_barang.id, stockSource.id));
          }
        }

        // Increase stock in DESTINATION branch
        const [stockDest] = await tx
          .select()
          .from(stok_barang)
          .where(and(eq(stok_barang.id_barang, item.idBarang), eq(stok_barang.id_cabang, shipmentRecord.id_cabang_tujuan)))
          .limit(1);

        if (stockDest) {
          await tx
            .update(stok_barang)
            .set({ stok_akhir: (stockDest.stok_akhir || 0) + qtyRec })
            .where(eq(stok_barang.id, stockDest.id));
        } else {
          await tx.insert(stok_barang).values({
            id_barang: item.idBarang,
            id_cabang: shipmentRecord.id_cabang_tujuan,
            stok_akhir: qtyRec,
            penjualan: 0,
          });
        }

        if (qtyRec !== qtySent) {
          const diff = qtySent - qtyRec;
          await tx.insert(pengiriman_selisih).values({
            id_pengiriman: idPengiriman,
            id_barang: item.idBarang,
            jumlah_dikirim: qtySent,
            jumlah_diterima: qtyRec,
            selisih: diff,
            jenis_selisih: item.jenisSelisih || (diff > 0 ? "KURANG" : "LEBIH"),
            alasan: item.alasan || "Pengecekan fisik manual",
            foto_bukti: item.fotoBukti || "Tidak ada foto",
            status: "MENUNGGU_PEMERIKSAAN",
            dibuat_oleh: pemeriksaName,
          });
        }
      }
    });

    return c.json({ success: true, message: `Pemeriksaan selesai. Status: ${finalStatus}` });
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal menyimpan pemeriksaan: " + err.message }, 500);
  }
});

distribusiRoutes.put("/selisih", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const { id, approved } = body;

    const [report] = await db
      .select()
      .from(pengiriman_selisih)
      .where(eq(pengiriman_selisih.id, id))
      .limit(1);

    if (!report) {
      return c.json({ success: false, message: "Laporan selisih tidak ditemukan" }, 404);
    }

    const newStatus = approved ? "DISETUJUI" : "DITOLAK";

    await db.transaction(async (tx) => {
      await tx
        .update(pengiriman_selisih)
        .set({
          status: newStatus,
          disetujui_oleh: activeUser.id,
          updated_at: new Date().toISOString().split("T")[0],
        })
        .where(eq(pengiriman_selisih.id, id));

      // Rollback stock in destination branch if discrepancy is REJECTED (DK-9 Fix)
      if (!approved) {
        const [shipment] = await tx
          .select()
          .from(pengiriman)
          .where(eq(pengiriman.id_pengiriman, report.id_pengiriman))
          .limit(1);

        if (shipment) {
          const [stockDest] = await tx
            .select()
            .from(stok_barang)
            .where(and(eq(stok_barang.id_barang, report.id_barang), eq(stok_barang.id_cabang, shipment.id_cabang_tujuan)))
            .limit(1);

          if (stockDest) {
            await tx
              .update(stok_barang)
              .set({ stok_akhir: (stockDest.stok_akhir || 0) + report.selisih })
              .where(eq(stok_barang.id, stockDest.id));
          }
        }
      }
    });

    return c.json({ success: true, message: `Persetujuan selisih diperbarui ke: ${newStatus}` });
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal memproses persetujuan: " + err.message }, 500);
  }
});

// ==========================================
// 8. DASHBOARD DISTRIBUSI
// ==========================================
distribusiRoutes.get("/dashboard", async (c) => {
  try {
    const [cabangCount] = await db.select({ count: sql<number>`count(*)` }).from(cabang);
    const totalCabang = Number(cabangCount?.count ?? 0);

    const [kritisCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(forecast_stok)
      .where(eq(forecast_stok.status, "KRITIS"));
    const totalKritis = Number(kritisCount?.count ?? 0);

    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(rekomendasi_pengiriman)
      .where(eq(rekomendasi_pengiriman.status, "DRAFT"));
    const pendingRekomendasi = Number(pendingCount?.count ?? 0);

    const [totalShipments] = await db.select({ count: sql<number>`count(*)` }).from(pengiriman);
    const [fulfilledShipments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pengiriman)
      .where(sql`${pengiriman.status} IN ('Diterima Lengkap', 'Ada Selisih', 'Selesai')`);
    
    const totS = Number(totalShipments?.count ?? 0);
    const fulS = Number(fulfilledShipments?.count ?? 0);
    const serviceLevel = totS > 0 ? Math.round((fulS / totS) * 1000) / 10 : 95.0;

    const criticalForecasts = await db
      .select({
        cabang: cabang.nama_cabang,
        barang: barang.nama_barang,
        stok: forecast_stok.stok_sekarang,
        ads: forecast_stok.ads,
        habis: forecast_stok.estimasi_habis_hari,
        status: forecast_stok.status,
      })
      .from(forecast_stok)
      .leftJoin(barang, eq(forecast_stok.id_barang, barang.id_barang))
      .leftJoin(cabang, eq(forecast_stok.id_cabang, cabang.id_cabang))
      .where(sql`${forecast_stok.status} IN ('KRITIS', 'PERHATIAN')`)
      .orderBy(asc(forecast_stok.estimasi_habis_hari))
      .limit(6);

    const barangKritis = criticalForecasts.map(f => ({
      cabang: f.cabang || "—",
      barang: f.barang || "—",
      stok: f.stok,
      ads: (f.ads || 0) / 100,
      habis: f.habis || 0,
      status: f.status || "PERHATIAN",
    }));

    const branchStats = await db
      .select({
        id_cabang: forecast_stok.id_cabang,
        nama_cabang: cabang.nama_cabang,
        totalItems: sql<number>`count(*)`,
        kritisCount: sql<number>`sum(case when ${forecast_stok.status} in ('KRITIS', 'PERHATIAN') then 1 else 0 end)`,
      })
      .from(forecast_stok)
      .leftJoin(cabang, eq(forecast_stok.id_cabang, cabang.id_cabang))
      .groupBy(forecast_stok.id_cabang, cabang.nama_cabang);

    const cabangKritis = branchStats.map(b => {
      const total = Number(b.totalItems || 0);
      const kritis = Number(b.kritisCount || 0);
      const ratio = total > 0 ? kritis / total : 0;
      let status = "Aman";
      if (ratio > 0.3) status = "Kritis";
      else if (ratio > 0.1) status = "Perhatian";

      return {
        cabang: b.nama_cabang || "—",
        jmlKritis: kritis,
        totalItem: total,
        status,
      };
    }).sort((a, b) => b.jmlKritis - a.jmlKritis).slice(0, 5);

    const fastForecasts = await db
      .select({
        barang: barang.nama_barang,
        ads: sql<number>`avg(${forecast_stok.ads})`,
      })
      .from(forecast_stok)
      .leftJoin(barang, eq(forecast_stok.id_barang, barang.id_barang))
      .groupBy(barang.nama_barang)
      .orderBy(desc(sql`avg(${forecast_stok.ads})`))
      .limit(5);

    const fastMoving = fastForecasts.map(f => ({
      barang: f.barang || "—",
      ads: Math.round((Number(f.ads || 0) / 100) * 10) / 10,
      cabang: "Jaringan DC",
    }));

    const prioritas = branchStats.map(b => {
      const kritis = Number(b.kritisCount || 0);
      const total = Number(b.totalItems || 0);
      const score = Math.min(100, total > 0 ? Math.round((kritis / total) * 100) : 0);
      let status = "Rendah";
      if (score > 80) status = "Sangat Tinggi";
      else if (score > 60) status = "Tinggi";
      else if (score > 30) status = "Sedang";

      return {
        cabang: b.nama_cabang || "—",
        skor: score,
        status,
        alasan: `${kritis} item kritis & perhatian`,
      };
    }).sort((a, b) => b.skor - a.skor).slice(0, 5);

    return c.json({
      success: true,
      kpi: {
        totalCabang,
        totalKritis,
        serviceLevel,
        pendingRekomendasi,
      },
      barangKritis,
      cabangKritis,
      fastMoving,
      prioritas,
    });
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal memuat dashboard: " + err.message }, 500);
  }
});
