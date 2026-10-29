import { Hono } from "hono";
import { db } from "../lib/db";
import {
  barang,
  stok_barang,
  cabang,
  users,
  barang_batch,
  stok_opname,
  stok_opname_detail,
  daftar_akun,
  jurnal_umum,
  periode_akuntansi,
} from "../lib/db/schema";
import { eq, and, sql, desc, asc, ilike, or, lte, gte, between } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";

export const supplyChainRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// ============================================================================
// 1. BATCH NUMBER & EXPIRED DATE TRACKING ENDPOINTS
// ============================================================================

/**
 * GET /api/supply-chain/batch
 * Query params: cabang_id, status, search, alert (ALL | EXPIRING_30 | EXPIRING_60 | EXPIRED | SAFE)
 */
supplyChainRoutes.get("/batch", async (c) => {
  try {
    const user = c.get("user");
    const queryCabang = c.req.query("cabang_id");
    const queryStatus = c.req.query("status");
    const search = c.req.query("search") || "";
    const alert = c.req.query("alert") || "ALL";

    const targetCabang = queryCabang ? parseInt(queryCabang) : user.id_cabang;

    const todayStr = new Date().toISOString().split("T")[0];
    const d30 = new Date();
    d30.setDate(d30.getDate() + 30);
    const d30Str = d30.toISOString().split("T")[0];

    const d60 = new Date();
    d60.setDate(d60.getDate() + 60);
    const d60Str = d60.toISOString().split("T")[0];

    const conditions = [];

    if (targetCabang) {
      conditions.push(eq(barang_batch.id_cabang, targetCabang));
    }
    if (queryStatus) {
      conditions.push(eq(barang_batch.status, queryStatus));
    }

    if (search.trim()) {
      conditions.push(
        or(
          ilike(barang_batch.nomor_batch, `%${search.trim()}%`),
          ilike(barang.nama_barang, `%${search.trim()}%`),
          ilike(barang.barcode, `%${search.trim()}%`)
        )
      );
    }

    if (alert === "EXPIRED") {
      conditions.push(lte(barang_batch.tanggal_kadaluarsa, todayStr));
    } else if (alert === "EXPIRING_30") {
      conditions.push(
        and(
          gte(barang_batch.tanggal_kadaluarsa, todayStr),
          lte(barang_batch.tanggal_kadaluarsa, d30Str)
        )
      );
    } else if (alert === "EXPIRING_60") {
      conditions.push(
        and(
          gte(barang_batch.tanggal_kadaluarsa, todayStr),
          lte(barang_batch.tanggal_kadaluarsa, d60Str)
        )
      );
    } else if (alert === "SAFE") {
      conditions.push(gte(barang_batch.tanggal_kadaluarsa, d60Str));
    }

    const rows = await db
      .select({
        id_batch: barang_batch.id_batch,
        nomor_batch: barang_batch.nomor_batch,
        id_barang: barang_batch.id_barang,
        barcode: barang.barcode,
        nama_barang: barang.nama_barang,
        satuan_1: barang.satuan_1,
        id_cabang: barang_batch.id_cabang,
        nama_cabang: cabang.nama_cabang,
        tanggal_masuk: barang_batch.tanggal_masuk,
        tanggal_kadaluarsa: barang_batch.tanggal_kadaluarsa,
        stok_batch: barang_batch.stok_batch,
        hpp_batch: barang_batch.hpp_batch,
        status: barang_batch.status,
        catatan: barang_batch.catatan,
        created_at: barang_batch.created_at,
      })
      .from(barang_batch)
      .innerJoin(barang, eq(barang_batch.id_barang, barang.id_barang))
      .innerJoin(cabang, eq(barang_batch.id_cabang, cabang.id_cabang))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(barang_batch.tanggal_kadaluarsa));

    // Dynamic alert status enrichment per batch
    const enriched = rows.map((r) => {
      let alertLevel: "EXPIRED" | "CRITICAL" | "WARNING" | "SAFE" = "SAFE";
      if (r.tanggal_kadaluarsa < todayStr) {
        alertLevel = "EXPIRED";
      } else if (r.tanggal_kadaluarsa <= d30Str) {
        alertLevel = "CRITICAL";
      } else if (r.tanggal_kadaluarsa <= d60Str) {
        alertLevel = "WARNING";
      }
      const sisaHari = Math.ceil(
        (new Date(r.tanggal_kadaluarsa).getTime() - new Date(todayStr).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return {
        ...r,
        alert_level: alertLevel,
        sisa_hari: sisaHari,
      };
    });

    return c.json(enriched);
  } catch (error: any) {
    console.error("Error fetching batches:", error);
    return c.json({ error: error.message || "Gagal mengambil data batch" }, 500);
  }
});

/**
 * GET /api/supply-chain/batch/summary
 * KPI summary metrics
 */
supplyChainRoutes.get("/batch/summary", async (c) => {
  try {
    const user = c.get("user");
    const queryCabang = c.req.query("cabang_id");
    const targetCabang = queryCabang ? parseInt(queryCabang) : user.id_cabang;

    const todayStr = new Date().toISOString().split("T")[0];
    const d30 = new Date();
    d30.setDate(d30.getDate() + 30);
    const d30Str = d30.toISOString().split("T")[0];

    const conditions = [];
    if (targetCabang) {
      conditions.push(eq(barang_batch.id_cabang, targetCabang));
    }

    const allBatches = await db
      .select({
        id_batch: barang_batch.id_batch,
        tanggal_kadaluarsa: barang_batch.tanggal_kadaluarsa,
        stok_batch: barang_batch.stok_batch,
        hpp_batch: barang_batch.hpp_batch,
        status: barang_batch.status,
      })
      .from(barang_batch)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    let totalBatches = allBatches.length;
    let expiredBatches = 0;
    let expiring30Days = 0;
    let totalStockQty = 0;
    let totalBatchValue = 0;

    for (const b of allBatches) {
      totalStockQty += b.stok_batch;
      totalBatchValue += b.stok_batch * b.hpp_batch;
      if (b.tanggal_kadaluarsa < todayStr) {
        expiredBatches++;
      } else if (b.tanggal_kadaluarsa <= d30Str) {
        expiring30Days++;
      }
    }

    return c.json({
      total_batches: totalBatches,
      expired_batches: expiredBatches,
      expiring_30_days: expiring30Days,
      total_stock_qty: totalStockQty,
      total_batch_value: totalBatchValue,
    });
  } catch (error: any) {
    console.error("Error batch summary:", error);
    return c.json({ error: error.message || "Gagal mengambil ringkasan batch" }, 500);
  }
});

/**
 * POST /api/supply-chain/batch
 * Tambah batch barang baru
 */
supplyChainRoutes.post("/batch", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const {
      nomor_batch,
      id_barang,
      id_cabang,
      tanggal_masuk,
      tanggal_kadaluarsa,
      stok_batch,
      hpp_batch,
      catatan,
    } = body;

    if (!nomor_batch || !id_barang || !tanggal_kadaluarsa) {
      return c.json({ error: "Nomor batch, ID barang, dan tanggal kadaluarsa wajib diisi" }, 400);
    }

    const targetCabang = id_cabang ? parseInt(id_cabang) : user.id_cabang;
    if (!targetCabang) {
      return c.json({ error: "Cabang wajib ditentukan" }, 400);
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const initialStatus = tanggal_kadaluarsa < todayStr ? "KADALUARSA" : "AKTIF";

    const [inserted] = await db
      .insert(barang_batch)
      .values({
        nomor_batch: nomor_batch.trim(),
        id_barang: parseInt(id_barang),
        id_cabang: targetCabang,
        tanggal_masuk: tanggal_masuk || todayStr,
        tanggal_kadaluarsa: tanggal_kadaluarsa,
        stok_batch: parseInt(stok_batch || "0"),
        hpp_batch: parseInt(hpp_batch || "0"),
        status: initialStatus,
        catatan: catatan || null,
      })
      .returning();

    return c.json({ success: true, message: "Batch barang berhasil didaftarkan", data: inserted });
  } catch (error: any) {
    console.error("Error creating batch:", error);
    return c.json({ error: error.message || "Gagal membuat batch barang" }, 500);
  }
});

/**
 * PUT /api/supply-chain/batch/:id
 * Update batch
 */
supplyChainRoutes.put("/batch/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { nomor_batch, tanggal_kadaluarsa, stok_batch, status, catatan } = body;

    const updateData: any = {};
    if (nomor_batch !== undefined) updateData.nomor_batch = nomor_batch.trim();
    if (tanggal_kadaluarsa !== undefined) updateData.tanggal_kadaluarsa = tanggal_kadaluarsa;
    if (stok_batch !== undefined) updateData.stok_batch = parseInt(stok_batch);
    if (status !== undefined) updateData.status = status;
    if (catatan !== undefined) updateData.catatan = catatan;

    const [updated] = await db
      .update(barang_batch)
      .set(updateData)
      .where(eq(barang_batch.id_batch, id))
      .returning();

    return c.json({ success: true, message: "Batch berhasil diperbarui", data: updated });
  } catch (error: any) {
    console.error("Error updating batch:", error);
    return c.json({ error: error.message || "Gagal memperbarui batch" }, 500);
  }
});

// ============================================================================
// 2. STOCK OPNAME FISIK & JURNAL SELISIH OTOMATIS
// ============================================================================

/**
 * GET /api/supply-chain/stok-opname
 * List riwayat sesi stock opname
 */
supplyChainRoutes.get("/stok-opname", async (c) => {
  try {
    const user = c.get("user");
    const queryCabang = c.req.query("cabang_id");
    const queryStatus = c.req.query("status");
    const targetCabang = queryCabang ? parseInt(queryCabang) : user.id_cabang;

    const conditions = [];
    if (targetCabang) {
      conditions.push(eq(stok_opname.id_cabang, targetCabang));
    }
    if (queryStatus) {
      conditions.push(eq(stok_opname.status, queryStatus));
    }

    const rows = await db
      .select({
        id_opname: stok_opname.id_opname,
        nomor_opname: stok_opname.nomor_opname,
        id_cabang: stok_opname.id_cabang,
        nama_cabang: cabang.nama_cabang,
        tanggal_opname: stok_opname.tanggal_opname,
        id_petugas: stok_opname.id_petugas,
        nama_petugas: users.nama_user,
        status: stok_opname.status,
        total_selisih_item: stok_opname.total_selisih_item,
        total_selisih_rupiah: stok_opname.total_selisih_rupiah,
        catatan: stok_opname.catatan,
        id_approver: stok_opname.id_approver,
        approved_at: stok_opname.approved_at,
        id_jurnal: stok_opname.id_jurnal,
        created_at: stok_opname.created_at,
      })
      .from(stok_opname)
      .innerJoin(cabang, eq(stok_opname.id_cabang, cabang.id_cabang))
      .innerJoin(users, eq(stok_opname.id_petugas, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(stok_opname.id_opname));

    return c.json(rows);
  } catch (error: any) {
    console.error("Error fetching opname list:", error);
    return c.json({ error: error.message || "Gagal mengambil daftar stock opname" }, 500);
  }
});

/**
 * GET /api/supply-chain/stok-opname/:id
 * Get detail sesi opname beserta list barang yang dihitung
 */
supplyChainRoutes.get("/stok-opname/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const [header] = await db
      .select({
        id_opname: stok_opname.id_opname,
        nomor_opname: stok_opname.nomor_opname,
        id_cabang: stok_opname.id_cabang,
        nama_cabang: cabang.nama_cabang,
        tanggal_opname: stok_opname.tanggal_opname,
        id_petugas: stok_opname.id_petugas,
        nama_petugas: users.nama_user,
        status: stok_opname.status,
        total_selisih_item: stok_opname.total_selisih_item,
        total_selisih_rupiah: stok_opname.total_selisih_rupiah,
        catatan: stok_opname.catatan,
        id_approver: stok_opname.id_approver,
        approved_at: stok_opname.approved_at,
        id_jurnal: stok_opname.id_jurnal,
        created_at: stok_opname.created_at,
      })
      .from(stok_opname)
      .innerJoin(cabang, eq(stok_opname.id_cabang, cabang.id_cabang))
      .innerJoin(users, eq(stok_opname.id_petugas, users.id))
      .where(eq(stok_opname.id_opname, id));

    if (!header) {
      return c.json({ error: "Sesi Stock Opname tidak ditemukan" }, 404);
    }

    const items = await db
      .select({
        id: stok_opname_detail.id,
        id_barang: stok_opname_detail.id_barang,
        barcode: barang.barcode,
        nama_barang: barang.nama_barang,
        satuan_1: barang.satuan_1,
        stok_sistem: stok_opname_detail.stok_sistem,
        stok_fisik: stok_opname_detail.stok_fisik,
        selisih_qty: stok_opname_detail.selisih_qty,
        hpp_satuan: stok_opname_detail.hpp_satuan,
        selisih_rupiah: stok_opname_detail.selisih_rupiah,
        alasan_selisih: stok_opname_detail.alasan_selisih,
        catatan: stok_opname_detail.catatan,
      })
      .from(stok_opname_detail)
      .innerJoin(barang, eq(stok_opname_detail.id_barang, barang.id_barang))
      .where(eq(stok_opname_detail.id_opname, id))
      .orderBy(asc(barang.nama_barang));

    return c.json({ header, items });
  } catch (error: any) {
    console.error("Error detail opname:", error);
    return c.json({ error: error.message || "Gagal mengambil detail stock opname" }, 500);
  }
});

/**
 * POST /api/supply-chain/stok-opname
 * Mulai sesi opname baru: Pre-populate dari database stok sistem cabang
 */
supplyChainRoutes.post("/stok-opname", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { id_cabang, tanggal_opname, catatan, filter_kategori_id } = body;

    const targetCabang = id_cabang ? parseInt(id_cabang) : user.id_cabang;
    if (!targetCabang) {
      return c.json({ error: "Cabang wajib dipilih" }, 400);
    }

    const todayStr = tanggal_opname || new Date().toISOString().split("T")[0];

    // Generate unique nomor opname: SO-YYYYMM-XXXX
    const yearMonth = todayStr.substring(0, 7).replace("-", "");
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stok_opname)
      .where(ilike(stok_opname.nomor_opname, `SO-${yearMonth}-%`));

    const nextSeq = (Number(countRow?.count || 0) + 1).toString().padStart(4, "0");
    const nomorOpname = `SO-${yearMonth}-${nextSeq}`;

    // Ambil daftar barang dan stok sistem di cabang tersebut
    const stockConditions = [eq(stok_barang.id_cabang, targetCabang)];
    if (filter_kategori_id) {
      stockConditions.push(eq(barang.id_kategori, parseInt(filter_kategori_id)));
    }

    const currentStocks = await db
      .select({
        id_barang: barang.id_barang,
        nama_barang: barang.nama_barang,
        stok_akhir: stok_barang.stok_akhir,
        harga_rata: barang.harga_rata,
        harga_beli: barang.harga_beli,
      })
      .from(barang)
      .leftJoin(
        stok_barang,
        and(eq(stok_barang.id_barang, barang.id_barang), eq(stok_barang.id_cabang, targetCabang))
      )
      .where(filter_kategori_id ? eq(barang.id_kategori, parseInt(filter_kategori_id)) : undefined);

    if (currentStocks.length === 0) {
      return c.json({ error: "Tidak ada data barang yang tersedia untuk dicacah" }, 400);
    }

    const result = await db.transaction(async (tx) => {
      const [newOpname] = await tx
        .insert(stok_opname)
        .values({
          nomor_opname: nomorOpname,
          id_cabang: targetCabang,
          tanggal_opname: todayStr,
          id_petugas: user.id,
          status: "DRAFT",
          total_selisih_item: 0,
          total_selisih_rupiah: 0,
          catatan: catatan || "Sesi penghitungan fisik stok gudang/toko",
        })
        .returning();

      // Insert detail barangs (awal stok fisik disamakan dengan stok sistem, diff = 0)
      for (const item of currentStocks) {
        const sysQty = item.stok_akhir || 0;
        const hpp = item.harga_rata || item.harga_beli || 0;

        await tx.insert(stok_opname_detail).values({
          id_opname: newOpname.id_opname,
          id_barang: item.id_barang,
          stok_sistem: sysQty,
          stok_fisik: sysQty, // default sama sebelum dihitung petugas
          selisih_qty: 0,
          hpp_satuan: hpp,
          selisih_rupiah: 0,
          alasan_selisih: "Sesuai",
          catatan: null,
        });
      }

      return newOpname;
    });

    return c.json({
      success: true,
      message: `Sesi Stock Opname ${nomorOpname} berhasil dibuat dengan ${currentStocks.length} item`,
      data: result,
    });
  } catch (error: any) {
    console.error("Error creating stock opname:", error);
    return c.json({ error: error.message || "Gagal membuat sesi stock opname" }, 500);
  }
});

/**
 * PUT /api/supply-chain/stok-opname/:id/items
 * Batch simpan hasil hitung fisik oleh petugas
 */
supplyChainRoutes.put("/stok-opname/:id/items", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { items, catatan } = body; // items: [{ id_detail, stok_fisik, alasan_selisih, catatan }]

    const [header] = await db
      .select()
      .from(stok_opname)
      .where(eq(stok_opname.id_opname, id));

    if (!header) {
      return c.json({ error: "Sesi Stock Opname tidak ditemukan" }, 404);
    }

    if (header.status !== "DRAFT" && header.status !== "MENUNGGU_APPROVAL") {
      return c.json({ error: `Sesi berstatus ${header.status} tidak dapat diubah lagi` }, 400);
    }

    await db.transaction(async (tx) => {
      let selisihItemCount = 0;
      let totalSelisihRp = 0;

      for (const it of items) {
        const [existing] = await tx
          .select()
          .from(stok_opname_detail)
          .where(eq(stok_opname_detail.id, it.id_detail));

        if (existing) {
          const physicalQty = parseInt(it.stok_fisik);
          const diffQty = physicalQty - existing.stok_sistem;
          const diffRp = diffQty * existing.hpp_satuan;

          if (diffQty !== 0) {
            selisihItemCount++;
          }
          totalSelisihRp += diffRp;

          await tx
            .update(stok_opname_detail)
            .set({
              stok_fisik: physicalQty,
              selisih_qty: diffQty,
              selisih_rupiah: diffRp,
              alasan_selisih: it.alasan_selisih || (diffQty === 0 ? "Sesuai" : "Penghitungan Fisik"),
              catatan: it.catatan || null,
            })
            .where(eq(stok_opname_detail.id, it.id_detail));
        }
      }

      await tx
        .update(stok_opname)
        .set({
          total_selisih_item: selisihItemCount,
          total_selisih_rupiah: totalSelisihRp,
          catatan: catatan !== undefined ? catatan : header.catatan,
        })
        .where(eq(stok_opname.id_opname, id));
    });

    return c.json({ success: true, message: "Hasil hitung fisik berhasil disimpan" });
  } catch (error: any) {
    console.error("Error saving opname items:", error);
    return c.json({ error: error.message || "Gagal menyimpan hasil hitung fisik" }, 500);
  }
});

/**
 * POST /api/supply-chain/stok-opname/:id/submit
 * Ajukan sesi opname untuk approval supervisor/manager
 */
supplyChainRoutes.post("/stok-opname/:id/submit", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const [header] = await db
      .select()
      .from(stok_opname)
      .where(eq(stok_opname.id_opname, id));

    if (!header) {
      return c.json({ error: "Sesi Stock Opname tidak ditemukan" }, 404);
    }

    if (header.status !== "DRAFT") {
      return c.json({ error: "Hanya sesi DRAFT yang dapat diajukan" }, 400);
    }

    await db
      .update(stok_opname)
      .set({ status: "MENUNGGU_APPROVAL" })
      .where(eq(stok_opname.id_opname, id));

    return c.json({ success: true, message: "Sesi Stock Opname berhasil diajukan untuk approval" });
  } catch (error: any) {
    console.error("Error submit opname:", error);
    return c.json({ error: error.message || "Gagal mengajukan stock opname" }, 500);
  }
});

/**
 * POST /api/supply-chain/stok-opname/:id/approve
 * APPROVAL & AUTOMATED GENERAL LEDGER ADJUSTMENT POSTING:
 * 1. Cek periode akuntansi (tidak boleh terkunci).
 * 2. Update stok fisik ke stok_barang.
 * 3. Jika ada selisih nilai rupiah (positif / negatif), posting Jurnal Umum otomatis:
 *    - Selisih Negatif (Fisik < Sistem):
 *      Dr. 6.107.01 Beban Selisih Stok & Kerugian Inventaris
 *      Cr. 1.104.01 Persediaan Barang Dagang
 *    - Selisih Positif (Fisik > Sistem):
 *      Dr. 1.104.01 Persediaan Barang Dagang
 *      Cr. 7.102.01 Pendapatan Penyesuaian Selisih Stok
 */
supplyChainRoutes.post("/stok-opname/:id/approve", async (c) => {
  try {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));

    const [header] = await db
      .select()
      .from(stok_opname)
      .where(eq(stok_opname.id_opname, id));

    if (!header) {
      return c.json({ error: "Sesi Stock Opname tidak ditemukan" }, 404);
    }

    if (header.status === "DISETUJUI") {
      return c.json({ error: "Sesi Stock Opname ini sudah disetujui sebelumnya" }, 400);
    }

    if (header.status === "DIBATALKAN") {
      return c.json({ error: "Sesi Stock Opname yang dibatalkan tidak dapat disetujui" }, 400);
    }

    // Guard Periode Akuntansi
    const opnameDate = header.tanggal_opname;
    const [period] = await db
      .select()
      .from(periode_akuntansi)
      .where(
        and(
          lte(periode_akuntansi.tanggal_mulai, opnameDate),
          gte(periode_akuntansi.tanggal_akhir, opnameDate)
        )
      )
      .limit(1);

    if (period) {
      if (period.status === "HARD_CLOSED") {
        return c.json({ error: `Periode akuntansi ${period.bulan}/${period.tahun} telah HARD_CLOSED. Tidak dapat posting penyesuaian!` }, 403);
      }
      if (period.status === "SOFT_LOCKED" && user.id_jabatan !== 1) {
        return c.json({ error: `Periode akuntansi ${period.bulan}/${period.tahun} telah SOFT_LOCKED. Butuh otorisasi Super User!` }, 403);
      }
    }

    const items = await db
      .select()
      .from(stok_opname_detail)
      .where(eq(stok_opname_detail.id_opname, id));

    // Ambil CoA akun persediaan, beban selisih, dan pendapatan penyesuaian
    const [persediaanAkun] = await db
      .select()
      .from(daftar_akun)
      .where(eq(daftar_akun.kode_akun, "1.104.01"))
      .limit(1);

    const [bebanSelisihAkun] = await db
      .select()
      .from(daftar_akun)
      .where(eq(daftar_akun.kode_akun, "6.107.01"))
      .limit(1);

    const [pendapatanSelisihAkun] = await db
      .select()
      .from(daftar_akun)
      .where(eq(daftar_akun.kode_akun, "7.102.01"))
      .limit(1);

    const nowStr = new Date().toISOString();

    const result = await db.transaction(async (tx) => {
      // 1. Update stok_barang untuk setiap item sesuai stok_fisik
      for (const it of items) {
        const [curr] = await tx
          .select()
          .from(stok_barang)
          .where(and(eq(stok_barang.id_barang, it.id_barang), eq(stok_barang.id_cabang, header.id_cabang)));

        if (curr) {
          await tx
            .update(stok_barang)
            .set({ stok_akhir: it.stok_fisik })
            .where(eq(stok_barang.id, curr.id));
        } else {
          await tx.insert(stok_barang).values({
            id_barang: it.id_barang,
            id_cabang: header.id_cabang,
            stok_akhir: it.stok_fisik,
            penjualan: 0,
            posisi_rak: "-",
            minimal_stok: 0,
            maksimal_stok: 100,
          });
        }
      }

      // 2. Automated Jurnal Posting jika ada selisih rupiah
      let createdJournalId: number | null = null;
      const netSelisihRp = header.total_selisih_rupiah || 0;

      if (netSelisihRp !== 0 && persediaanAkun) {
        if (netSelisihRp < 0 && bebanSelisihAkun) {
          // Defisit (Fisik < Sistem): Dr Beban Selisih, Cr Persediaan
          const absAmount = Math.abs(netSelisihRp);

          // Debit Beban
          const [jDeb] = await tx
            .insert(jurnal_umum)
            .values({
              tanggal_transaksi: header.tanggal_opname,
              no_referensi_bukti: header.nomor_opname,
              deskripsi: `Penyesuaian Selisih Kurang Stock Opname ${header.nomor_opname}`,
              akun_id: bebanSelisihAkun.id,
              cabang_id: header.id_cabang,
              debit: absAmount,
              kredit: 0,
              dibuat_oleh: user.id,
            })
            .returning();

          // Credit Persediaan
          await tx.insert(jurnal_umum).values({
            tanggal_transaksi: header.tanggal_opname,
            no_referensi_bukti: header.nomor_opname,
            deskripsi: `Penyesuaian Nilai Persediaan Stock Opname ${header.nomor_opname}`,
            akun_id: persediaanAkun.id,
            cabang_id: header.id_cabang,
            debit: 0,
            kredit: absAmount,
            dibuat_oleh: user.id,
          });

          createdJournalId = jDeb.id;
        } else if (netSelisihRp > 0 && pendapatanSelisihAkun) {
          // Surplus (Fisik > Sistem): Dr Persediaan, Cr Pendapatan Penyesuaian
          const absAmount = netSelisihRp;

          // Debit Persediaan
          const [jDeb] = await tx
            .insert(jurnal_umum)
            .values({
              tanggal_transaksi: header.tanggal_opname,
              no_referensi_bukti: header.nomor_opname,
              deskripsi: `Penyesuaian Nilai Persediaan Surplus Stock Opname ${header.nomor_opname}`,
              akun_id: persediaanAkun.id,
              cabang_id: header.id_cabang,
              debit: absAmount,
              kredit: 0,
              dibuat_oleh: user.id,
            })
            .returning();

          // Credit Pendapatan Penyesuaian
          await tx.insert(jurnal_umum).values({
            tanggal_transaksi: header.tanggal_opname,
            no_referensi_bukti: header.nomor_opname,
            deskripsi: `Pendapatan Penyesuaian Selisih Lebih Stock Opname ${header.nomor_opname}`,
            akun_id: pendapatanSelisihAkun.id,
            cabang_id: header.id_cabang,
            debit: 0,
            kredit: absAmount,
            dibuat_oleh: user.id,
          });

          createdJournalId = jDeb.id;
        }
      }

      // 3. Update Status Opname
      const [finalHeader] = await tx
        .update(stok_opname)
        .set({
          status: "DISETUJUI",
          id_approver: user.id,
          approved_at: nowStr,
          id_jurnal: createdJournalId,
        })
        .where(eq(stok_opname.id_opname, id))
        .returning();

      return { header: finalHeader, journalPosted: !!createdJournalId };
    });

    return c.json({
      success: true,
      message: `Stock Opname ${header.nomor_opname} berhasil disetujui. Stok kartu gudang telah disinkronkan${
        result.journalPosted ? " dan Jurnal Penyesuaian Selisih telah diposting otomatis ke Buku Besar." : "."
      }`,
      data: result.header,
    });
  } catch (error: any) {
    console.error("Error approving opname:", error);
    return c.json({ error: error.message || "Gagal menyetujui stock opname" }, 500);
  }
});

/**
 * POST /api/supply-chain/stok-opname/:id/cancel
 * Batalkan sesi opname
 */
supplyChainRoutes.post("/stok-opname/:id/cancel", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const [header] = await db
      .select()
      .from(stok_opname)
      .where(eq(stok_opname.id_opname, id));

    if (!header) {
      return c.json({ error: "Sesi Stock Opname tidak ditemukan" }, 404);
    }

    if (header.status === "DISETUJUI") {
      return c.json({ error: "Sesi yang sudah disetujui tidak dapat dibatalkan" }, 400);
    }

    await db
      .update(stok_opname)
      .set({ status: "DIBATALKAN" })
      .where(eq(stok_opname.id_opname, id));

    return c.json({ success: true, message: "Sesi Stock Opname berhasil dibatalkan" });
  } catch (error: any) {
    console.error("Error canceling opname:", error);
    return c.json({ error: error.message || "Gagal membatalkan stock opname" }, 500);
  }
});
