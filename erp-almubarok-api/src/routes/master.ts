import { Hono } from "hono";
import { db } from "../lib/db";
import {
  barang,
  kategori_barang,
  supplier,
  cabang,
  cabang_investor,
  pelanggan,
  stok_barang,
  users,
  pengiriman,
  gudang_lokasi,
  stok_lokasi,
  kartu_stok,
  stok_adjustment,
  stok_adjustment_detail,
  daftar_akun,
  jurnal_umum,
  periode_akuntansi
} from "../lib/db/schema";
import { eq, and, or, like, ne, sql, desc, asc, lte, gte, gt, isNull } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";
import { recalculateProductLevels } from "../services/product-level.service";

export const masterRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// Centralized master data write-operation guard
masterRoutes.use("/*", async (c, next) => {
  const user = c.get("user");
  const method = c.req.method;
  const path = c.req.path;

  const isPelangganWrite = path.includes("/pelanggan") && (method === "POST" || method === "PUT");

  if ((method === "POST" || method === "PUT" || method === "DELETE") && !isPelangganWrite) {
    const jabatanId = user?.id_jabatan ? Number(user.id_jabatan) : null;
    if (jabatanId !== 1 && jabatanId !== 2) {
      return c.json({ error: "Forbidden. Hanya admin yang diizinkan melakukan modifikasi master data." }, 403);
    }
  }
  await next();
});

// ==========================================
// 1. KATEGORI BARANG
// ==========================================
masterRoutes.get("/kategori", async (c) => {
  const data = await db.select().from(kategori_barang).orderBy(kategori_barang.nama_kategori);
  return c.json(data);
});

masterRoutes.post("/kategori", async (c) => {
  const body = await c.req.json();
  if (!body.kode_kategori?.trim() || !body.nama_kategori?.trim()) {
    return c.json({ error: "Kode kategori dan nama kategori wajib diisi." }, 400);
  }

  const existing = await db
    .select()
    .from(kategori_barang)
    .where(eq(kategori_barang.kode_kategori, body.kode_kategori.trim()))
    .limit(1);
  if (existing.length > 0) {
    return c.json({ error: "Kode kategori sudah terdaftar." }, 409);
  }

  const [newKategori] = await db
    .insert(kategori_barang)
    .values({
      kode_kategori: body.kode_kategori.trim(),
      nama_kategori: body.nama_kategori.trim(),
    })
    .returning();
  return c.json(newKategori, 201);
});

masterRoutes.put("/kategori/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  if (!body.kode_kategori?.trim() || !body.nama_kategori?.trim()) {
    return c.json({ error: "Kode kategori dan nama kategori wajib diisi." }, 400);
  }

  const existing = await db
    .select()
    .from(kategori_barang)
    .where(
      and(
        eq(kategori_barang.kode_kategori, body.kode_kategori.trim()),
        ne(kategori_barang.id_kategori, parseInt(id))
      )
    )
    .limit(1);
  if (existing.length > 0) {
    return c.json({ error: "Kode kategori sudah terdaftar pada kategori lain." }, 409);
  }

  await db
    .update(kategori_barang)
    .set({
      kode_kategori: body.kode_kategori.trim(),
      nama_kategori: body.nama_kategori.trim(),
    })
    .where(eq(kategori_barang.id_kategori, parseInt(id)));
  return c.json({ success: true });
});

masterRoutes.delete("/kategori/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const barangTerkait = await db
      .select()
      .from(barang)
      .where(eq(barang.id_kategori, parseInt(id)))
      .limit(1);
    if (barangTerkait.length > 0) {
      return c.json({ error: "Kategori tidak dapat dihapus karena masih digunakan oleh beberapa barang." }, 400);
    }

    await db.delete(kategori_barang).where(eq(kategori_barang.id_kategori, parseInt(id)));
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: "Kategori tidak dapat dihapus karena sedang digunakan oleh data lain." }, 400);
  }
});

// ==========================================
// 2. SUPPLIER
// ==========================================
masterRoutes.get("/supplier", async (c) => {
  const q = c.req.query("q") || c.req.query("search");
  const statusPajak = c.req.query("status_pajak");
  const hariKunjungan = c.req.query("hari_kunjungan");
  const periodeKunjungan = c.req.query("periode_kunjungan");
  const pageParam = c.req.query("page");
  const limitParam = c.req.query("limit");
  const allParam = c.req.query("all");

  const conditions = [];

  if (q && q.trim()) {
    const term = `%${q.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${supplier.nama_supplier})`, term),
        like(sql`lower(${supplier.telepon})`, term),
        like(sql`lower(${supplier.alamat})`, term),
        like(sql`lower(${supplier.bank})`, term)
      )
    );
  }

  if (statusPajak && statusPajak !== "ALL") {
    conditions.push(eq(supplier.status_pajak, statusPajak));
  }

  if (hariKunjungan && hariKunjungan !== "ALL") {
    conditions.push(eq(supplier.hari_kunjungan, hariKunjungan));
  }

  if (periodeKunjungan && periodeKunjungan !== "ALL") {
    conditions.push(eq(supplier.periode_kunjungan, periodeKunjungan));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const isPaginationRequested = Boolean(pageParam || limitParam) && allParam !== "true";

  if (isPaginationRequested) {
    const page = Math.max(1, parseInt(pageParam || "1"));
    const limit = Math.max(1, Math.min(250, parseInt(limitParam || "50")));
    const offset = (page - 1) * limit;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(supplier)
      .where(whereClause);
    const total = Number(countResult?.count || 0);

    const data = await db
      .select()
      .from(supplier)
      .where(whereClause)
      .orderBy(supplier.nama_supplier)
      .limit(limit)
      .offset(offset);

    return c.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  const data = await db
    .select()
    .from(supplier)
    .where(whereClause)
    .orderBy(supplier.nama_supplier);

  return c.json(data);
});

masterRoutes.post("/supplier", async (c) => {
  const body = await c.req.json();
  const [newSupplier] = await db
    .insert(supplier)
    .values({
      nama_supplier: body.nama_supplier,
      alamat: body.alamat || null,
      telepon: body.telepon || null,
      email: body.email || null,
      bank: body.bank || null,
      no_rek_bank: body.no_rek_bank || null,
      hari_kunjungan: body.hari_kunjungan || null,
      periode_kunjungan: body.periode_kunjungan || null,
      status_pajak: body.status_pajak || null,
      npwp: body.npwp || null,
      keterangan_1: body.keterangan_1 || null,
      keterangan_2: body.keterangan_2 || null,
    })
    .returning();
  return c.json(newSupplier, 201);
});

masterRoutes.put("/supplier/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  await db
    .update(supplier)
    .set({
      nama_supplier: body.nama_supplier,
      alamat: body.alamat || null,
      telepon: body.telepon || null,
      email: body.email || null,
      bank: body.bank || null,
      no_rek_bank: body.no_rek_bank || null,
      hari_kunjungan: body.hari_kunjungan || null,
      periode_kunjungan: body.periode_kunjungan || null,
      status_pajak: body.status_pajak || null,
      npwp: body.npwp || null,
      keterangan_1: body.keterangan_1 || null,
      keterangan_2: body.keterangan_2 || null,
    })
    .where(eq(supplier.id_supplier, parseInt(id)));
  return c.json({ success: true });
});

masterRoutes.delete("/supplier/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(supplier).where(eq(supplier.id_supplier, parseInt(id)));
  return c.json({ success: true });
});

// ==========================================
// 3. BARANG
// ==========================================
masterRoutes.get("/barang", async (c) => {
  try {
    const q = c.req.query("q") || c.req.query("search");
    const barcode = c.req.query("barcode");
    const level = c.req.query("level");
    const laporPajakQuery = c.req.query("lapor_pajak");
    const pageParam = c.req.query("page");
    const limitParam = c.req.query("limit");
    const allParam = c.req.query("all");

    const user = c.get("user");
    const idCabang = user?.id_cabang ? Number(user.id_cabang) : 1;

    const conditions = [];

    if (barcode && barcode.trim()) {
      const cleanBarcode = barcode.trim();
      conditions.push(
        or(
          eq(barang.barcode, cleanBarcode),
          eq(barang.kode_barang, cleanBarcode),
          eq(barang.barcode_satuan_2, cleanBarcode),
          eq(barang.barcode_satuan_3, cleanBarcode)
        )
      );
    }

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(
        or(
          like(sql`lower(${barang.nama_barang})`, term.toLowerCase()),
          like(sql`lower(coalesce(${barang.kode_barang}, ''))`, term.toLowerCase()),
          like(sql`coalesce(${barang.barcode}, '')`, term),
          like(sql`coalesce(${barang.barcode_satuan_2}, '')`, term),
          like(sql`coalesce(${barang.barcode_satuan_3}, '')`, term)
        )
      );
    }

    if (level && ["FAST", "MEDIUM", "SLOW", "DEAD"].includes(level.toUpperCase())) {
      conditions.push(eq(barang.level_barang, level.toUpperCase()));
    }

    if (laporPajakQuery === "true") {
      conditions.push(eq(barang.lapor_pajak, true));
    } else if (laporPajakQuery === "false") {
      conditions.push(or(eq(barang.lapor_pajak, false), isNull(barang.lapor_pajak)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const isPaginationRequested = Boolean(pageParam || limitParam) && allParam !== "true";

    if (isPaginationRequested) {
      const page = Math.max(1, parseInt(pageParam || "1") || 1);
      const limit = Math.max(1, Math.min(250, parseInt(limitParam || "50") || 50));
      const offset = (page - 1) * limit;

      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(barang)
        .where(whereClause);
      const total = Number(countResult?.count || 0);

      const data = await db
        .select({
          id_barang: barang.id_barang,
          kode_barang: barang.kode_barang,
          barcode: barang.barcode,
          nama_barang: barang.nama_barang,
          id_kategori: barang.id_kategori,
          nama_kategori: kategori_barang.nama_kategori,
          id_supplier: barang.id_supplier,
          nama_supplier: supplier.nama_supplier,
          satuan_1: barang.satuan_1,
          satuan_2: barang.satuan_2,
          satuan_3: barang.satuan_3,
          isi_1: barang.isi_1,
          isi_2: barang.isi_2,
          isi_3: barang.isi_3,
          harga_beli: barang.harga_beli,
          harga_rata: barang.harga_rata,
          harga_jual_1_1: barang.harga_jual_1_1,
          harga_jual_1_2: barang.harga_jual_1_2,
          harga_jual_1_3: barang.harga_jual_1_3,
          harga_jual_2_1: barang.harga_jual_2_1,
          harga_jual_2_2: barang.harga_jual_2_2,
          harga_jual_2_3: barang.harga_jual_2_3,
          harga_jual_3_1: barang.harga_jual_3_1,
          harga_jual_3_2: barang.harga_jual_3_2,
          harga_jual_3_3: barang.harga_jual_3_3,
          jual_rugi: barang.jual_rugi,
          status: barang.status,
          status_pajak: barang.status_pajak,
          lapor_pajak: barang.lapor_pajak,
          barcode_satuan_2: barang.barcode_satuan_2,
          barcode_satuan_3: barang.barcode_satuan_3,
          tipe_barang: barang.tipe_barang,
          lacak_kadaluarsa: barang.lacak_kadaluarsa,
          keterangan_1: barang.keterangan_1,
          keterangan_2: barang.keterangan_2,
          level_barang: barang.level_barang,
          level_mode: barang.level_mode,
          terakhir_terjual: barang.terakhir_terjual,
          created_at: barang.created_at,
          stok_akhir: stok_barang.stok_akhir,
          level_cabang: stok_barang.level_cabang,
          terakhir_terjual_cabang: stok_barang.terakhir_terjual_cabang,
        })
        .from(barang)
        .leftJoin(kategori_barang, eq(barang.id_kategori, kategori_barang.id_kategori))
        .leftJoin(supplier, eq(barang.id_supplier, supplier.id_supplier))
        .leftJoin(stok_barang, and(eq(barang.id_barang, stok_barang.id_barang), eq(stok_barang.id_cabang, idCabang)))
        .where(whereClause)
        .orderBy(barang.nama_barang)
        .limit(limit)
        .offset(offset);

      return c.json({
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    const query = db
      .select({
        id_barang: barang.id_barang,
        kode_barang: barang.kode_barang,
        barcode: barang.barcode,
        nama_barang: barang.nama_barang,
        id_kategori: barang.id_kategori,
        nama_kategori: kategori_barang.nama_kategori,
        id_supplier: barang.id_supplier,
        nama_supplier: supplier.nama_supplier,
        satuan_1: barang.satuan_1,
        satuan_2: barang.satuan_2,
        satuan_3: barang.satuan_3,
        isi_1: barang.isi_1,
        isi_2: barang.isi_2,
        isi_3: barang.isi_3,
        harga_beli: barang.harga_beli,
        harga_rata: barang.harga_rata,
        harga_jual_1_1: barang.harga_jual_1_1,
        harga_jual_1_2: barang.harga_jual_1_2,
        harga_jual_1_3: barang.harga_jual_1_3,
        harga_jual_2_1: barang.harga_jual_2_1,
        harga_jual_2_2: barang.harga_jual_2_2,
        harga_jual_2_3: barang.harga_jual_2_3,
        harga_jual_3_1: barang.harga_jual_3_1,
        harga_jual_3_2: barang.harga_jual_3_2,
        harga_jual_3_3: barang.harga_jual_3_3,
        jual_rugi: barang.jual_rugi,
        status: barang.status,
        status_pajak: barang.status_pajak,
        lapor_pajak: barang.lapor_pajak,
        barcode_satuan_2: barang.barcode_satuan_2,
        barcode_satuan_3: barang.barcode_satuan_3,
        tipe_barang: barang.tipe_barang,
        lacak_kadaluarsa: barang.lacak_kadaluarsa,
        keterangan_1: barang.keterangan_1,
        keterangan_2: barang.keterangan_2,
        level_barang: barang.level_barang,
        level_mode: barang.level_mode,
        terakhir_terjual: barang.terakhir_terjual,
        created_at: barang.created_at,
        stok_akhir: stok_barang.stok_akhir,
        level_cabang: stok_barang.level_cabang,
        terakhir_terjual_cabang: stok_barang.terakhir_terjual_cabang,
      })
      .from(barang)
      .leftJoin(kategori_barang, eq(barang.id_kategori, kategori_barang.id_kategori))
      .leftJoin(supplier, eq(barang.id_supplier, supplier.id_supplier))
      .leftJoin(stok_barang, and(eq(barang.id_barang, stok_barang.id_barang), eq(stok_barang.id_cabang, idCabang)));

    if (conditions.length > 0) {
      const data = await query.where(and(...conditions)).orderBy(barang.nama_barang);
      return c.json(data);
    }

    const data = await query.orderBy(barang.nama_barang);
    return c.json(data);
  } catch (error: any) {
    console.error("Error in GET /barang:", error);
    return c.json({ error: error?.message || "Gagal memuat katalog barang." }, 500);
  }
});

// Hitung Ulang Level Barang (FSN Classification)
masterRoutes.post("/barang/recalculate-level", async (c) => {
  try {
    const result = await recalculateProductLevels();
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error recalculating product levels:", error);
    return c.json({ error: error.message || "Gagal menghitung ulang level barang" }, 500);
  }
});

masterRoutes.post("/barang", async (c) => {
  const body = await c.req.json();
  if (!body.barcode?.trim() || !body.nama_barang?.trim()) {
    return c.json({ error: "Barcode dan nama barang wajib diisi." }, 400);
  }

  // Cek duplikasi barcode secara unik global
  const existing = await db
    .select()
    .from(barang)
    .where(eq(barang.barcode, body.barcode.trim()))
    .limit(1);
  if (existing.length > 0) {
    return c.json({ error: "Barcode sudah terdaftar pada barang lain." }, 409);
  }

  const [newBarang] = await db
    .insert(barang)
    .values({
      kode_barang: body.kode_barang ? body.kode_barang.trim() : null,
      barcode: body.barcode.trim(),
      nama_barang: body.nama_barang.trim(),
      id_kategori: body.id_kategori ? parseInt(body.id_kategori) : null,
      id_supplier: body.id_supplier ? parseInt(body.id_supplier) : null,
      satuan_1: body.satuan_1 || null,
      satuan_2: body.satuan_2 || null,
      satuan_3: body.satuan_3 || null,
      isi_1: 1, // Konstan 1
      isi_2: body.isi_2 ? parseInt(body.isi_2) : null,
      isi_3: body.isi_3 ? parseInt(body.isi_3) : null,
      harga_beli: body.harga_beli ? parseInt(body.harga_beli) : null,
      harga_rata: body.harga_rata ? parseInt(body.harga_rata) : null,
      harga_jual_1_1: body.harga_jual_1_1 ? parseInt(body.harga_jual_1_1) : null,
      harga_jual_1_2: body.harga_jual_1_2 ? parseInt(body.harga_jual_1_2) : null,
      harga_jual_1_3: body.harga_jual_1_3 ? parseInt(body.harga_jual_1_3) : null,
      harga_jual_2_1: body.harga_jual_2_1 ? parseInt(body.harga_jual_2_1) : null,
      harga_jual_2_2: body.harga_jual_2_2 ? parseInt(body.harga_jual_2_2) : null,
      harga_jual_2_3: body.harga_jual_2_3 ? parseInt(body.harga_jual_2_3) : null,
      harga_jual_3_1: body.harga_jual_3_1 ? parseInt(body.harga_jual_3_1) : null,
      harga_jual_3_2: body.harga_jual_3_2 ? parseInt(body.harga_jual_3_2) : null,
      harga_jual_3_3: body.harga_jual_3_3 ? parseInt(body.harga_jual_3_3) : null,
      jual_rugi: body.jual_rugi ? parseInt(body.jual_rugi) : 0,
      status: body.status || "Aktif",
      status_pajak: body.status_pajak || null,
      lapor_pajak: body.lapor_pajak !== undefined ? Boolean(body.lapor_pajak) : true,
      barcode_satuan_2: body.barcode_satuan_2 ? body.barcode_satuan_2.trim() : null,
      barcode_satuan_3: body.barcode_satuan_3 ? body.barcode_satuan_3.trim() : null,
      tipe_barang: body.tipe_barang || "STOK",
      lacak_kadaluarsa: Boolean(body.lacak_kadaluarsa),
      keterangan_1: body.keterangan_1 || null,
      keterangan_2: body.keterangan_2 || null,
      level_barang: body.level_barang || "MEDIUM",
      level_mode: body.level_mode || "AUTO",
    })
    .returning();

  return c.json(newBarang, 201);
});

// Import Barang Massal dari Excel / JSON
masterRoutes.post("/barang/import", async (c) => {
  const body = await c.req.json();
  if (!Array.isArray(body) || body.length === 0) {
    return c.json({ error: "Payload harus berupa array data barang." }, 400);
  }

  // 1. Preload category cache: lower(nama_kategori) -> id_kategori
  const categoryCache = new Map<string, number>();
  const allCategories = await db.select().from(kategori_barang);
  allCategories.forEach((k) => {
    categoryCache.set(k.nama_kategori.toLowerCase().trim(), k.id_kategori);
  });

  // 2. Preload supplier cache: lower(nama_supplier) -> id_supplier
  const supplierCache = new Map<string, number>();
  const allSuppliers = await db.select().from(supplier);
  allSuppliers.forEach((s) => {
    supplierCache.set(s.nama_supplier.toLowerCase().trim(), s.id_supplier);
  });

  // 3. Preload existing barang
  const existingList = await db
    .select({
      id_barang: barang.id_barang,
      kode_barang: barang.kode_barang,
      barcode: barang.barcode,
      satuan_1: barang.satuan_1,
      satuan_2: barang.satuan_2,
      satuan_3: barang.satuan_3,
      isi_2: barang.isi_2,
      isi_3: barang.isi_3,
      harga_beli: barang.harga_beli,
      harga_rata: barang.harga_rata,
      harga_jual_1_1: barang.harga_jual_1_1,
      harga_jual_1_2: barang.harga_jual_1_2,
      harga_jual_1_3: barang.harga_jual_1_3,
      harga_jual_2_1: barang.harga_jual_2_1,
      harga_jual_2_2: barang.harga_jual_2_2,
      harga_jual_2_3: barang.harga_jual_2_3,
      harga_jual_3_1: barang.harga_jual_3_1,
      harga_jual_3_2: barang.harga_jual_3_2,
      harga_jual_3_3: barang.harga_jual_3_3,
      id_kategori: barang.id_kategori,
      id_supplier: barang.id_supplier,
      keterangan_1: barang.keterangan_1,
      keterangan_2: barang.keterangan_2,
    })
    .from(barang);

  const barcodeMap = new Map<string, any>();
  const kodeMap = new Map<string, any>();
  existingList.forEach((b) => {
    if (b.barcode) barcodeMap.set(b.barcode.trim(), b);
    if (b.kode_barang) kodeMap.set(b.kode_barang.trim(), b);
  });

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  const errors: { row: number; reason: string }[] = [];

  for (let idx = 0; idx < body.length; idx++) {
    const row = body[idx];
    const rowNum = row.rowNum || idx + 1;

    // Validasi: Nama Barang Wajib Terisi
    const namaBarang = (row.nama_barang || row.NMBRG || "").toString().trim();
    if (!namaBarang) {
      skippedCount++;
      errors.push({ row: rowNum, reason: "Nama Barang (NMBRG) kosong, baris dilewati." });
      continue;
    }

    const kdBrg = (row.kode_barang || row.KDBRG || "").toString().trim();
    let barcodeVal = (row.barcode || row.BARCODE || "").toString().trim();

    // Fallback: Jika BARCODE kosong, otomatis gunakan KDBRG
    if (!barcodeVal && kdBrg) {
      barcodeVal = kdBrg;
    }

    if (!barcodeVal) {
      skippedCount++;
      errors.push({ row: rowNum, reason: "Kode Barang dan Barcode keduanya kosong." });
      continue;
    }

    // Auto-create / lookup Kategori (DEPARTEMENT)
    let idKategori: number | null = null;
    const deptName = (row.departement || row.DEPARTEMENT || "").toString().trim();
    if (deptName) {
      const lowerDept = deptName.toLowerCase();
      if (categoryCache.has(lowerDept)) {
        idKategori = categoryCache.get(lowerDept)!;
      } else {
        const nextKode = `KT-${String(categoryCache.size + 1).padStart(3, "0")}`;
        try {
          const [newCat] = await db
            .insert(kategori_barang)
            .values({
              kode_kategori: nextKode,
              nama_kategori: deptName,
            })
            .returning();
          idKategori = newCat.id_kategori;
          categoryCache.set(lowerDept, idKategori);
        } catch {
          const fallbackKode = `KT-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
          const [newCat] = await db
            .insert(kategori_barang)
            .values({
              kode_kategori: fallbackKode,
              nama_kategori: deptName,
            })
            .returning();
          idKategori = newCat.id_kategori;
          categoryCache.set(lowerDept, idKategori);
        }
      }
    }

    // Auto-create / lookup Supplier (SUPPLIER)
    let idSupplier: number | null = null;
    const suppName = (row.supplier || row.SUPPLIER || "").toString().trim();
    if (suppName) {
      const lowerSupp = suppName.toLowerCase();
      if (supplierCache.has(lowerSupp)) {
        idSupplier = supplierCache.get(lowerSupp)!;
      } else {
        const [newSupp] = await db
          .insert(supplier)
          .values({
            nama_supplier: suppName,
          })
          .returning();
        idSupplier = newSupp.id_supplier;
        supplierCache.set(lowerSupp, idSupplier);
      }
    }

    // Satuan & Kemasan
    const sat1 = (row.satuan_1 || row["SAT 1"] || "PCS").toString().trim() || "PCS";
    const sat2 = (row.satuan_2 || row["SAT 2"] || "").toString().trim() || null;
    const sat3 = (row.satuan_3 || row["SAT 3"] || "").toString().trim() || null;
    const isi2Raw = parseInt(row.isi_2 || row["ISI 2"] || "0");
    const isi3Raw = parseInt(row.isi_3 || row["ISI 3"] || "0");
    const isi2 = !isNaN(isi2Raw) && isi2Raw > 0 ? isi2Raw : null;
    const isi3 = !isNaN(isi3Raw) && isi3Raw > 0 ? isi3Raw : null;

    // Harga Beli & HPP (HBT)
    const hrgBeliRaw = parseInt(row.harga_beli || row.HRGBELI || "0");
    const hrgBeli = !isNaN(hrgBeliRaw) && hrgBeliRaw >= 0 ? hrgBeliRaw : 0;
    const hbtRaw = parseInt(row.hbt || row.HBT || "0");
    const hrgRata = !isNaN(hbtRaw) && hbtRaw > 0 ? hbtRaw : hrgBeli;

    // Inisialisasi Harga Jual (dikalikan pengali kemasan)
    const hj1 = hrgBeli;
    const hj2 = hrgBeli * (isi2 || 1);
    const hj3 = hrgBeli * (isi3 || 1);

    // Keterangan: KELOMPOK -> keterangan_1, LEVEL -> keterangan_2
    const kelompok = (row.kelompok || row.KELOMPOK || "").toString().trim() || null;
    const level = (row.level || row.LEVEL || "").toString().trim() || null;

    // Deteksi Barang Eksisting
    const existing =
      (kdBrg && kodeMap.get(kdBrg)) ||
      (barcodeVal && barcodeMap.get(barcodeVal)) ||
      null;

    if (existing) {
      // UPDATE: Pertahankan harga jual jika sudah ada > 0
      const keepHj11 = existing.harga_jual_1_1 && existing.harga_jual_1_1 > 0 ? existing.harga_jual_1_1 : hj1;
      const keepHj12 = existing.harga_jual_1_2 && existing.harga_jual_1_2 > 0 ? existing.harga_jual_1_2 : hj1;
      const keepHj13 = existing.harga_jual_1_3 && existing.harga_jual_1_3 > 0 ? existing.harga_jual_1_3 : hj1;

      const keepHj21 = existing.harga_jual_2_1 && existing.harga_jual_2_1 > 0 ? existing.harga_jual_2_1 : hj2;
      const keepHj22 = existing.harga_jual_2_2 && existing.harga_jual_2_2 > 0 ? existing.harga_jual_2_2 : hj2;
      const keepHj23 = existing.harga_jual_2_3 && existing.harga_jual_2_3 > 0 ? existing.harga_jual_2_3 : hj2;

      const keepHj31 = existing.harga_jual_3_1 && existing.harga_jual_3_1 > 0 ? existing.harga_jual_3_1 : hj3;
      const keepHj32 = existing.harga_jual_3_2 && existing.harga_jual_3_2 > 0 ? existing.harga_jual_3_2 : hj3;
      const keepHj33 = existing.harga_jual_3_3 && existing.harga_jual_3_3 > 0 ? existing.harga_jual_3_3 : hj3;

      await db
        .update(barang)
        .set({
          kode_barang: kdBrg || existing.kode_barang || null,
          barcode: barcodeVal,
          nama_barang: namaBarang,
          id_kategori: idKategori || existing.id_kategori,
          id_supplier: idSupplier || existing.id_supplier,
          satuan_1: sat1 || existing.satuan_1,
          satuan_2: sat2 || existing.satuan_2,
          satuan_3: sat3 || existing.satuan_3,
          isi_1: 1,
          isi_2: isi2 !== null ? isi2 : existing.isi_2,
          isi_3: isi3 !== null ? isi3 : existing.isi_3,
          harga_beli: hrgBeli || existing.harga_beli,
          harga_rata: hrgRata || existing.harga_rata,
          harga_jual_1_1: keepHj11,
          harga_jual_1_2: keepHj12,
          harga_jual_1_3: keepHj13,
          harga_jual_2_1: keepHj21,
          harga_jual_2_2: keepHj22,
          harga_jual_2_3: keepHj23,
          harga_jual_3_1: keepHj31,
          harga_jual_3_2: keepHj32,
          harga_jual_3_3: keepHj33,
          keterangan_1: kelompok || existing.keterangan_1,
          keterangan_2: level || existing.keterangan_2,
        })
        .where(eq(barang.id_barang, existing.id_barang));

      // Refresh memory cache
      const updatedItem = {
        ...existing,
        kode_barang: kdBrg || existing.kode_barang,
        barcode: barcodeVal,
        nama_barang: namaBarang,
      };
      barcodeMap.set(barcodeVal, updatedItem);
      if (kdBrg) kodeMap.set(kdBrg, updatedItem);

      updatedCount++;
    } else {
      // INSERT Baru
      const [inserted] = await db
        .insert(barang)
        .values({
          kode_barang: kdBrg || null,
          barcode: barcodeVal,
          nama_barang: namaBarang,
          id_kategori: idKategori,
          id_supplier: idSupplier,
          satuan_1: sat1,
          satuan_2: sat2,
          satuan_3: sat3,
          isi_1: 1,
          isi_2: isi2,
          isi_3: isi3,
          harga_beli: hrgBeli,
          harga_rata: hrgRata,
          harga_jual_1_1: hj1,
          harga_jual_1_2: hj1,
          harga_jual_1_3: hj1,
          harga_jual_2_1: hj2,
          harga_jual_2_2: hj2,
          harga_jual_2_3: hj2,
          harga_jual_3_1: hj3,
          harga_jual_3_2: hj3,
          harga_jual_3_3: hj3,
          status: "Aktif",
          tipe_barang: "STOK",
          keterangan_1: kelompok,
          keterangan_2: level,
        })
        .returning();

      // Tambahkan ke in-memory cache
      if (inserted.barcode) barcodeMap.set(inserted.barcode.trim(), inserted);
      if (inserted.kode_barang) kodeMap.set(inserted.kode_barang.trim(), inserted);

      insertedCount++;
    }
  }

  return c.json({
    success: true,
    total: body.length,
    inserted: insertedCount,
    updated: updatedCount,
    skipped: skippedCount,
    errors,
  });
});

masterRoutes.put("/barang/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  if (!body.barcode?.trim() || !body.nama_barang?.trim()) {
    return c.json({ error: "Barcode dan nama barang wajib diisi." }, 400);
  }

  // Cek duplikasi barcode secara unik global exclude current id
  const existing = await db
    .select()
    .from(barang)
    .where(
      and(
        eq(barang.barcode, body.barcode.trim()),
        ne(barang.id_barang, parseInt(id))
      )
    )
    .limit(1);
  if (existing.length > 0) {
    return c.json({ error: "Barcode sudah terdaftar pada barang lain." }, 409);
  }

  await db
    .update(barang)
    .set({
      kode_barang: body.kode_barang !== undefined ? (body.kode_barang ? body.kode_barang.trim() : null) : undefined,
      barcode: body.barcode.trim(),
      nama_barang: body.nama_barang.trim(),
      id_kategori: body.id_kategori ? parseInt(body.id_kategori) : null,
      id_supplier: body.id_supplier ? parseInt(body.id_supplier) : null,
      satuan_1: body.satuan_1 || null,
      satuan_2: body.satuan_2 || null,
      satuan_3: body.satuan_3 || null,
      isi_1: 1, // Konstan 1
      isi_2: body.isi_2 ? parseInt(body.isi_2) : null,
      isi_3: body.isi_3 ? parseInt(body.isi_3) : null,
      harga_beli: body.harga_beli ? parseInt(body.harga_beli) : null,
      harga_rata: body.harga_rata ? parseInt(body.harga_rata) : null,
      harga_jual_1_1: body.harga_jual_1_1 ? parseInt(body.harga_jual_1_1) : null,
      harga_jual_1_2: body.harga_jual_1_2 ? parseInt(body.harga_jual_1_2) : null,
      harga_jual_1_3: body.harga_jual_1_3 ? parseInt(body.harga_jual_1_3) : null,
      harga_jual_2_1: body.harga_jual_2_1 ? parseInt(body.harga_jual_2_1) : null,
      harga_jual_2_2: body.harga_jual_2_2 ? parseInt(body.harga_jual_2_2) : null,
      harga_jual_2_3: body.harga_jual_2_3 ? parseInt(body.harga_jual_2_3) : null,
      harga_jual_3_1: body.harga_jual_3_1 ? parseInt(body.harga_jual_3_1) : null,
      harga_jual_3_2: body.harga_jual_3_2 ? parseInt(body.harga_jual_3_2) : null,
      harga_jual_3_3: body.harga_jual_3_3 ? parseInt(body.harga_jual_3_3) : null,
      jual_rugi: body.jual_rugi !== undefined ? parseInt(body.jual_rugi) : 0,
      status: body.status || "Aktif",
      status_pajak: body.status_pajak || null,
      lapor_pajak: body.lapor_pajak !== undefined ? Boolean(body.lapor_pajak) : undefined,
      barcode_satuan_2: body.barcode_satuan_2 !== undefined ? (body.barcode_satuan_2 ? body.barcode_satuan_2.trim() : null) : undefined,
      barcode_satuan_3: body.barcode_satuan_3 !== undefined ? (body.barcode_satuan_3 ? body.barcode_satuan_3.trim() : null) : undefined,
      tipe_barang: body.tipe_barang || "STOK",
      lacak_kadaluarsa: body.lacak_kadaluarsa !== undefined ? Boolean(body.lacak_kadaluarsa) : undefined,
      keterangan_1: body.keterangan_1 || null,
      keterangan_2: body.keterangan_2 || null,
      level_barang: body.level_barang !== undefined ? body.level_barang : undefined,
      level_mode: body.level_mode !== undefined ? body.level_mode : undefined,
    })
    .where(eq(barang.id_barang, parseInt(id)));

  return c.json({ success: true });
});

masterRoutes.delete("/barang/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ error: "ID barang tidak valid." }, 400);
  }
  try {
    // 1. Cek stok terkait di cabang
    const stokTerkait = await db
      .select()
      .from(stok_barang)
      .where(eq(stok_barang.id_barang, id));
    if (stokTerkait.some((s) => (s.stok_akhir ?? 0) > 0)) {
      return c.json({ error: "Barang tidak dapat dihapus karena masih memiliki stok aktif di cabang." }, 400);
    }

    // 2. Hapus baris stok_barang bersaldo 0 agar foreign key tidak memblokir
    await db.delete(stok_barang).where(eq(stok_barang.id_barang, id));

    // 3. Hapus data master barang
    await db.delete(barang).where(eq(barang.id_barang, id));
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: "Barang tidak dapat dihapus karena sudah digunakan dalam transaksi atau data master lainnya." }, 400);
  }
});

// ==========================================
// 4. CABANG
// ==========================================
masterRoutes.get("/cabang", async (c) => {
  try {
    const data = await db
      .select({
        id_cabang: cabang.id_cabang,
        kode_cabang: cabang.kode_cabang,
        nama_cabang: cabang.nama_cabang,
        alamat: cabang.alamat,
        telepon: cabang.telepon,
        email: cabang.email,
        admin: cabang.admin,
        nama_admin: users.nama_user,
        latitude: cabang.latitude,
        longitude: cabang.longitude,
        data_kode: cabang.data_kode,
        is_dc: cabang.is_dc,
        jenis_cabang: cabang.jenis_cabang,
        nisbah_pengelola: cabang.nisbah_pengelola,
        nisbah_investor: cabang.nisbah_investor,
        total_modal_investor: cabang.total_modal_investor,
        jumlah_investor: sql<number>`(SELECT COUNT(*)::int FROM cabang_investor WHERE cabang_investor.id_cabang = ${cabang.id_cabang} AND cabang_investor.status = 'AKTIF')`,
      })
      .from(cabang)
      .leftJoin(users, eq(cabang.admin, users.id))
      .orderBy(cabang.nama_cabang);
    return c.json(data);
  } catch (err: any) {
    console.error("GET /cabang primary query error:", err.message);
    // Defensive fallback: jika tabel cabang_investor atau kolom investor belum termigrasi di database tertentu
    try {
      const basicData = await db
        .select({
          id_cabang: cabang.id_cabang,
          kode_cabang: cabang.kode_cabang,
          nama_cabang: cabang.nama_cabang,
          alamat: cabang.alamat,
          telepon: cabang.telepon,
          email: cabang.email,
          admin: cabang.admin,
          nama_admin: users.nama_user,
          latitude: cabang.latitude,
          longitude: cabang.longitude,
          data_kode: cabang.data_kode,
          is_dc: cabang.is_dc,
        })
        .from(cabang)
        .leftJoin(users, eq(cabang.admin, users.id))
        .orderBy(cabang.nama_cabang);

      const enriched = basicData.map((b) => ({
        ...b,
        jenis_cabang: "INTERNAL" as const,
        nisbah_pengelola: "0",
        nisbah_investor: "0",
        total_modal_investor: "0",
        jumlah_investor: 0,
      }));
      return c.json(enriched);
    } catch (fallbackErr: any) {
      console.error("GET /cabang fallback query error:", fallbackErr.message);
      return c.json({ error: "Gagal memuat cabang: " + err.message }, 500);
    }
  }
});

masterRoutes.post("/cabang", async (c) => {
  try {
    const body = await c.req.json();

    // 1. Validasi parameter wajib
    if (!body.kode_cabang?.trim() || !body.nama_cabang?.trim() || !body.alamat?.trim()) {
      return c.json({ error: "Kode cabang, nama cabang, dan alamat wajib diisi." }, 400);
    }

    // 2. Validasi keunikan kode_cabang
    const [existingKode] = await db
      .select({ id: cabang.id_cabang })
      .from(cabang)
      .where(eq(cabang.kode_cabang, body.kode_cabang.trim()))
      .limit(1);
    if (existingKode) {
      return c.json({ error: "Kode cabang sudah terdaftar pada cabang lain." }, 409);
    }

    const [newCabang] = await db
      .insert(cabang)
      .values({
        kode_cabang: body.kode_cabang.trim(),
        nama_cabang: body.nama_cabang.trim(),
        alamat: body.alamat.trim(),
        telepon: body.telepon || null,
        email: body.email || null,
        admin: body.admin ? parseInt(body.admin) : null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        data_kode: body.data_kode || null,
        is_dc: body.is_dc ?? false,
        jenis_cabang: body.jenis_cabang || "INTERNAL",
        nisbah_pengelola: body.nisbah_pengelola !== undefined ? String(body.nisbah_pengelola) : "0",
        nisbah_investor: body.nisbah_investor !== undefined ? String(body.nisbah_investor) : "0",
        total_modal_investor: body.total_modal_investor !== undefined ? String(body.total_modal_investor) : "0",
      })
      .returning();
    return c.json(newCabang, 201);
  } catch (err: any) {
    return c.json({ error: "Gagal menyimpan cabang: " + err.message }, 500);
  }
});

masterRoutes.put("/cabang/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "ID Cabang tidak valid" }, 400);
    }

    const body = await c.req.json();

    // 1. Validasi parameter wajib
    if (!body.kode_cabang?.trim() || !body.nama_cabang?.trim() || !body.alamat?.trim()) {
      return c.json({ error: "Kode cabang, nama cabang, dan alamat wajib diisi." }, 400);
    }

    // 2. Validasi keunikan kode_cabang (kecuali cabang ini sendiri)
    const [existingKode] = await db
      .select({ id: cabang.id_cabang })
      .from(cabang)
      .where(and(eq(cabang.kode_cabang, body.kode_cabang.trim()), ne(cabang.id_cabang, id)))
      .limit(1);
    if (existingKode) {
      return c.json({ error: "Kode cabang sudah terdaftar pada cabang lain." }, 409);
    }

    await db
      .update(cabang)
      .set({
        kode_cabang: body.kode_cabang.trim(),
        nama_cabang: body.nama_cabang.trim(),
        alamat: body.alamat.trim(),
        telepon: body.telepon || null,
        email: body.email || null,
        admin: body.admin ? parseInt(body.admin) : null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        data_kode: body.data_kode || null,
        is_dc: body.is_dc ?? false,
        jenis_cabang: body.jenis_cabang || "INTERNAL",
        nisbah_pengelola: body.nisbah_pengelola !== undefined ? String(body.nisbah_pengelola) : undefined,
        nisbah_investor: body.nisbah_investor !== undefined ? String(body.nisbah_investor) : undefined,
        total_modal_investor: body.total_modal_investor !== undefined ? String(body.total_modal_investor) : undefined,
      })
      .where(eq(cabang.id_cabang, id));
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: "Gagal memperbarui cabang: " + err.message }, 500);
  }
});

// ==========================================
// 4.1. KONSORSIUM INVESTOR CABANG
// ==========================================
masterRoutes.get("/cabang/:id/investor", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID Cabang tidak valid" }, 400);

    const data = await db
      .select()
      .from(cabang_investor)
      .where(eq(cabang_investor.id_cabang, id))
      .orderBy(desc(cabang_investor.id_cabang_investor));
    return c.json(data);
  } catch (err: any) {
    console.error("GET /cabang/:id/investor error:", err.message);
    return c.json([]); // Kembalikan array kosong jika tabel belum tersedia
  }
});

masterRoutes.post("/cabang/:id/investor", async (c) => {
  try {
    const id_cabang = parseInt(c.req.param("id"));
    if (isNaN(id_cabang)) return c.json({ error: "ID Cabang tidak valid" }, 400);

    const body = await c.req.json();
    if (!body.nama_investor?.trim()) {
      return c.json({ error: "Nama investor wajib diisi" }, 400);
    }

    const [newInv] = await db
      .insert(cabang_investor)
      .values({
        id_cabang,
        nama_investor: body.nama_investor.trim(),
        telepon: body.telepon?.trim() || null,
        email: body.email?.trim() || null,
        nilai_investasi: String(body.nilai_investasi || 0),
        porsi_kepemilikan: String(body.porsi_kepemilikan || 0),
        nama_bank: body.nama_bank?.trim() || null,
        no_rekening: body.no_rekening?.trim() || null,
        atas_nama_rekening: body.atas_nama_rekening?.trim() || null,
        tanggal_bergabung: body.tanggal_bergabung || new Date().toISOString().slice(0, 10),
        status: body.status || "AKTIF",
        catatan: body.catatan?.trim() || null,
      })
      .returning();

    // Recalculate total_modal_investor on cabang
    const [sumModal] = await db
      .select({ total: sql<string>`COALESCE(SUM(nilai_investasi), 0)` })
      .from(cabang_investor)
      .where(and(eq(cabang_investor.id_cabang, id_cabang), eq(cabang_investor.status, "AKTIF")));

    await db
      .update(cabang)
      .set({ total_modal_investor: sumModal?.total || "0" })
      .where(eq(cabang.id_cabang, id_cabang));

    return c.json(newInv, 201);
  } catch (err: any) {
    return c.json({ error: "Gagal menambah investor: " + err.message }, 500);
  }
});

masterRoutes.put("/cabang-investor/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID Investor tidak valid" }, 400);

    const body = await c.req.json();
    if (!body.nama_investor?.trim()) {
      return c.json({ error: "Nama investor wajib diisi" }, 400);
    }

    const [existing] = await db
      .select()
      .from(cabang_investor)
      .where(eq(cabang_investor.id_cabang_investor, id));
    if (!existing) {
      return c.json({ error: "Investor tidak ditemukan" }, 404);
    }

    await db
      .update(cabang_investor)
      .set({
        nama_investor: body.nama_investor.trim(),
        telepon: body.telepon !== undefined ? (body.telepon?.trim() || null) : undefined,
        email: body.email !== undefined ? (body.email?.trim() || null) : undefined,
        nilai_investasi: body.nilai_investasi !== undefined ? String(body.nilai_investasi) : undefined,
        porsi_kepemilikan: body.porsi_kepemilikan !== undefined ? String(body.porsi_kepemilikan) : undefined,
        nama_bank: body.nama_bank !== undefined ? (body.nama_bank?.trim() || null) : undefined,
        no_rekening: body.no_rekening !== undefined ? (body.no_rekening?.trim() || null) : undefined,
        atas_nama_rekening: body.atas_nama_rekening !== undefined ? (body.atas_nama_rekening?.trim() || null) : undefined,
        status: body.status || undefined,
        catatan: body.catatan !== undefined ? (body.catatan?.trim() || null) : undefined,
        updated_at: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(cabang_investor.id_cabang_investor, id));

    // Recalculate total_modal_investor
    const [sumModal] = await db
      .select({ total: sql<string>`COALESCE(SUM(nilai_investasi), 0)` })
      .from(cabang_investor)
      .where(and(eq(cabang_investor.id_cabang, existing.id_cabang), eq(cabang_investor.status, "AKTIF")));

    await db
      .update(cabang)
      .set({ total_modal_investor: sumModal?.total || "0" })
      .where(eq(cabang.id_cabang, existing.id_cabang));

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: "Gagal memperbarui investor: " + err.message }, 500);
  }
});

masterRoutes.delete("/cabang-investor/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ error: "ID Investor tidak valid" }, 400);

    const [existing] = await db
      .select()
      .from(cabang_investor)
      .where(eq(cabang_investor.id_cabang_investor, id));
    if (!existing) {
      return c.json({ error: "Investor tidak ditemukan" }, 404);
    }

    await db
      .delete(cabang_investor)
      .where(eq(cabang_investor.id_cabang_investor, id));

    // Recalculate total_modal_investor
    const [sumModal] = await db
      .select({ total: sql<string>`COALESCE(SUM(nilai_investasi), 0)` })
      .from(cabang_investor)
      .where(and(eq(cabang_investor.id_cabang, existing.id_cabang), eq(cabang_investor.status, "AKTIF")));

    await db
      .update(cabang)
      .set({ total_modal_investor: sumModal?.total || "0" })
      .where(eq(cabang.id_cabang, existing.id_cabang));

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: "Gagal menghapus investor: " + err.message }, 500);
  }
});

masterRoutes.delete("/cabang/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ error: "ID Cabang tidak valid" }, 400);
    }

    // 1. Validasi penolakan hapus jika cabang masih memiliki staff/abdi aktif
    const [hasUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.id_cabang, id));
    if (Number(hasUsers?.count ?? 0) > 0) {
      return c.json({ error: "Cabang tidak dapat dihapus karena masih memiliki staff/abdi terdaftar." }, 409);
    }

    // 2. Validasi penolakan hapus jika cabang masih memiliki inventaris barang
    const [hasStock] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stok_barang)
      .where(eq(stok_barang.id_cabang, id));
    if (Number(hasStock?.count ?? 0) > 0) {
      return c.json({ error: "Cabang tidak dapat dihapus karena masih memiliki inventaris barang." }, 409);
    }

    // 3. Validasi penolakan hapus jika cabang memiliki riwayat pengiriman
    const [hasShipments] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pengiriman)
      .where(or(eq(pengiriman.id_cabang_sumber, id), eq(pengiriman.id_cabang_tujuan, id)));
    if (Number(hasShipments?.count ?? 0) > 0) {
      return c.json({ error: "Cabang tidak dapat dihapus karena memiliki riwayat pengiriman barang." }, 409);
    }

    await db.delete(cabang).where(eq(cabang.id_cabang, id));
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: "Gagal menghapus cabang: " + err.message }, 500);
  }
});

// ==========================================
// 5. PELANGGAN
// ==========================================
masterRoutes.get("/pelanggan", async (c) => {
  const q = c.req.query("q") || c.req.query("search");
  const levelHarga = c.req.query("level_harga");
  const pageParam = c.req.query("page");
  const limitParam = c.req.query("limit");
  const allParam = c.req.query("all");

  const conditions = [];

  if (q && q.trim()) {
    const term = `%${q.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${pelanggan.nama_lengkap})`, term),
        like(sql`lower(${pelanggan.kode_pelanggan})`, term),
        like(sql`lower(${pelanggan.telepon})`, term),
        like(sql`lower(${pelanggan.alamat})`, term)
      )
    );
  }

  if (levelHarga && levelHarga !== "ALL") {
    conditions.push(eq(pelanggan.level_harga, parseInt(levelHarga)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const isPaginationRequested = Boolean(pageParam || limitParam) && allParam !== "true";

  if (isPaginationRequested) {
    const page = Math.max(1, parseInt(pageParam || "1"));
    const limit = Math.max(1, Math.min(250, parseInt(limitParam || "50")));
    const offset = (page - 1) * limit;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pelanggan)
      .where(whereClause);
    const total = Number(countResult?.count || 0);

    const data = await db
      .select()
      .from(pelanggan)
      .where(whereClause)
      .orderBy(pelanggan.nama_lengkap)
      .limit(limit)
      .offset(offset);

    return c.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  const data = await db
    .select()
    .from(pelanggan)
    .where(whereClause)
    .orderBy(pelanggan.nama_lengkap);

  return c.json(data);
});

masterRoutes.post("/pelanggan", async (c) => {
  const body = await c.req.json();
  const [newPelanggan] = await db
    .insert(pelanggan)
    .values({
      kode_pelanggan: body.kode_pelanggan,
      nama_lengkap: body.nama_lengkap,
      email: body.email || null,
      alamat: body.alamat || null,
      telepon: body.telepon || null,
      level_harga: body.level_harga ? parseInt(body.level_harga) : 1,
      total_poin: body.total_poin ? parseInt(body.total_poin) : 0,
    })
    .returning();
  return c.json(newPelanggan, 201);
});

masterRoutes.put("/pelanggan/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  await db
    .update(pelanggan)
    .set({
      kode_pelanggan: body.kode_pelanggan,
      nama_lengkap: body.nama_lengkap,
      email: body.email || null,
      alamat: body.alamat || null,
      telepon: body.telepon || null,
      level_harga: body.level_harga ? parseInt(body.level_harga) : 1,
      total_poin: body.total_poin ? parseInt(body.total_poin) : 0,
    })
    .where(eq(pelanggan.id_pelanggan, parseInt(id)));
  return c.json({ success: true });
});

masterRoutes.delete("/pelanggan/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(pelanggan).where(eq(pelanggan.id_pelanggan, parseInt(id)));
  return c.json({ success: true });
});

// ==========================================
// 6. STOK BARANG & MULTI-CABANG BREAKDOWN
// ==========================================
masterRoutes.get("/stok", async (c) => {
  const user = c.get("user");
  const paramCabang = c.req.query("id_cabang");
  const paramBarang = c.req.query("id_barang");
  const search = c.req.query("search") || c.req.query("q");
  const pageParam = c.req.query("page");
  const limitParam = c.req.query("limit");
  const allParam = c.req.query("all");

  // Security check: Super User (1), IT (2), Bendahara (4), Admin (5), Manager (8), SPV (11) can query other branches
  const allowedRoles = [1, 2, 4, 5, 8, 11];
  const userRole = user?.id_jabatan ? Number(user.id_jabatan) : 0;
  const isManagerOrAdmin = allowedRoles.includes(userRole);

  let idCabang: number | null = user?.id_cabang ? Number(user.id_cabang) : null;
  let isAllBranches = false;

  if (isManagerOrAdmin && paramCabang) {
    if (paramCabang === "ALL") {
      isAllBranches = true;
      idCabang = null;
    } else {
      idCabang = parseInt(paramCabang);
    }
  }

  if (!idCabang && !isAllBranches) {
    return c.json({ error: "Cabang tidak teridentifikasi atau diizinkan" }, 400);
  }

  if (paramBarang) {
    const idBarang = parseInt(paramBarang);
    const [item] = await db
      .select({
        id: stok_barang.id,
        id_barang: stok_barang.id_barang,
        barcode: barang.barcode,
        nama_barang: barang.nama_barang,
        id_cabang: stok_barang.id_cabang,
        stok_akhir: stok_barang.stok_akhir,
        minimal_stok: stok_barang.minimal_stok,
        maksimal_stok: stok_barang.maksimal_stok,
      })
      .from(stok_barang)
      .innerJoin(barang, eq(stok_barang.id_barang, barang.id_barang))
      .where(
        and(
          idCabang ? eq(stok_barang.id_cabang, idCabang) : sql`1=1`,
          eq(stok_barang.id_barang, idBarang)
        )
      )
      .limit(1);

    return c.json(item || { stok_akhir: 0 });
  }

  const conditions = [];
  if (!isAllBranches && idCabang) {
    conditions.push(eq(stok_barang.id_cabang, idCabang));
  }

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${barang.nama_barang})`, term),
        like(sql`lower(${barang.kode_barang})`, term),
        like(barang.barcode, term)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const isPaginationRequested = Boolean(pageParam || limitParam) && allParam !== "true";

  if (isPaginationRequested) {
    const page = Math.max(1, parseInt(pageParam || "1"));
    const limit = Math.max(1, Math.min(250, parseInt(limitParam || "50")));
    const offset = (page - 1) * limit;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stok_barang)
      .innerJoin(barang, eq(stok_barang.id_barang, barang.id_barang))
      .where(whereClause);
    const total = Number(countResult?.count || 0);

    const data = await db
      .select({
        id: stok_barang.id,
        id_barang: stok_barang.id_barang,
        kode_barang: barang.kode_barang,
        barcode: barang.barcode,
        nama_barang: barang.nama_barang,
        id_kategori: barang.id_kategori,
        nama_kategori: kategori_barang.nama_kategori,
        id_supplier: barang.id_supplier,
        nama_supplier: supplier.nama_supplier,
        id_cabang: stok_barang.id_cabang,
        nama_cabang: cabang.nama_cabang,
        stok_akhir: stok_barang.stok_akhir,
        penjualan: stok_barang.penjualan,
        posisi_rak: stok_barang.posisi_rak,
        minimal_stok: stok_barang.minimal_stok,
        maksimal_stok: stok_barang.maksimal_stok,
        harga_beli: barang.harga_beli,
        harga_rata: barang.harga_rata,
        harga_jual_1_1: barang.harga_jual_1_1,
        satuan_1: barang.satuan_1,
        satuan_2: barang.satuan_2,
        satuan_3: barang.satuan_3,
        isi_1: barang.isi_1,
        isi_2: barang.isi_2,
        isi_3: barang.isi_3,
      })
      .from(stok_barang)
      .innerJoin(barang, eq(stok_barang.id_barang, barang.id_barang))
      .leftJoin(kategori_barang, eq(barang.id_kategori, kategori_barang.id_kategori))
      .leftJoin(supplier, eq(barang.id_supplier, supplier.id_supplier))
      .innerJoin(cabang, eq(stok_barang.id_cabang, cabang.id_cabang))
      .where(whereClause)
      .orderBy(isAllBranches ? cabang.nama_cabang : barang.nama_barang, barang.nama_barang)
      .limit(limit)
      .offset(offset);

    return c.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  const query = db
    .select({
      id: stok_barang.id,
      id_barang: stok_barang.id_barang,
      kode_barang: barang.kode_barang,
      barcode: barang.barcode,
      nama_barang: barang.nama_barang,
      id_kategori: barang.id_kategori,
      nama_kategori: kategori_barang.nama_kategori,
      id_supplier: barang.id_supplier,
      nama_supplier: supplier.nama_supplier,
      id_cabang: stok_barang.id_cabang,
      nama_cabang: cabang.nama_cabang,
      stok_akhir: stok_barang.stok_akhir,
      penjualan: stok_barang.penjualan,
      posisi_rak: stok_barang.posisi_rak,
      minimal_stok: stok_barang.minimal_stok,
      maksimal_stok: stok_barang.maksimal_stok,
      harga_beli: barang.harga_beli,
      harga_rata: barang.harga_rata,
      harga_jual_1_1: barang.harga_jual_1_1,
      satuan_1: barang.satuan_1,
      satuan_2: barang.satuan_2,
      satuan_3: barang.satuan_3,
      isi_1: barang.isi_1,
      isi_2: barang.isi_2,
      isi_3: barang.isi_3,
    })
    .from(stok_barang)
    .innerJoin(barang, eq(stok_barang.id_barang, barang.id_barang))
    .leftJoin(kategori_barang, eq(barang.id_kategori, kategori_barang.id_kategori))
    .leftJoin(supplier, eq(barang.id_supplier, supplier.id_supplier))
    .innerJoin(cabang, eq(stok_barang.id_cabang, cabang.id_cabang));

  const data = isAllBranches
    ? await query.where(whereClause).orderBy(cabang.nama_cabang, barang.nama_barang)
    : await query.where(whereClause).orderBy(barang.nama_barang);

  return c.json(data);
});

/**
 * GET /api/master/barang/:id/stok-cabang
 * Rincian Ketersediaan Stok 1 Barang di Seluruh 19 Cabang
 */
masterRoutes.get("/barang/:id/stok-cabang", async (c) => {
  try {
    const user = c.get("user");
    const id = parseInt(c.req.param("id"));

    const [item] = await db
      .select({
        id_barang: barang.id_barang,
        barcode: barang.barcode,
        nama_barang: barang.nama_barang,
        satuan_1: barang.satuan_1,
        harga_rata: barang.harga_rata,
        harga_beli: barang.harga_beli,
        level_barang: barang.level_barang,
        level_mode: barang.level_mode,
        terakhir_terjual: barang.terakhir_terjual,
        status_pajak: barang.status_pajak,
        lapor_pajak: barang.lapor_pajak,
      })
      .from(barang)
      .where(eq(barang.id_barang, id))
      .limit(1);

    if (!item) {
      return c.json({ error: "Barang tidak ditemukan" }, 404);
    }

    const allowedRoles = [1, 2, 4, 5, 8, 11];
    const userRole = user?.id_jabatan ? Number(user.id_jabatan) : 0;
    const isManagerOrAdmin = allowedRoles.includes(userRole);

    // Ambil daftar cabang
    const branchQuery = db
      .select({
        id_cabang: cabang.id_cabang,
        kode_cabang: cabang.kode_cabang,
        nama_cabang: cabang.nama_cabang,
        alamat: cabang.alamat,
      })
      .from(cabang);

    const userCabang = user?.id_cabang ? Number(user.id_cabang) : 1;
    const allBranches = isManagerOrAdmin
      ? await branchQuery.orderBy(cabang.id_cabang)
      : await branchQuery.where(eq(cabang.id_cabang, userCabang));

    // Ambil semua stok untuk barang ini
    const stockRows = await db
      .select()
      .from(stok_barang)
      .where(eq(stok_barang.id_barang, id));

    const stockMap = new Map<number, typeof stok_barang.$inferSelect>();
    for (const s of stockRows) {
      stockMap.set(s.id_cabang, s);
    }

    const hpp = item.harga_rata || item.harga_beli || 0;
    let totalStokGlobal = 0;
    let totalNilaiGlobal = 0;

    const breakdown = allBranches.map((b) => {
      const s = stockMap.get(b.id_cabang);
      const qty = s ? (s.stok_akhir ?? 0) : 0;
      const min = s ? (s.minimal_stok ?? 0) : 0;
      const max = s ? (s.maksimal_stok ?? 0) : 0;
      const rak = s ? s.posisi_rak || "-" : "-";
      const nilaiAset = qty * hpp;

      totalStokGlobal += qty;
      totalNilaiGlobal += nilaiAset;

      let statusStok = "AMAN";
      if (qty <= 0) {
        statusStok = "HABIS";
      } else if (min > 0 && qty <= min) {
        statusStok = "MENIPIS";
      } else if (max > 0 && qty > max) {
        statusStok = "OVERSTOCK";
      }

      return {
        id_cabang: b.id_cabang,
        kode_cabang: b.kode_cabang,
        nama_cabang: b.nama_cabang,
        stok_akhir: qty,
        posisi_rak: rak,
        minimal_stok: min,
        maksimal_stok: max,
        status_stok: statusStok,
        nilai_aset: nilaiAset,
        level_cabang: s ? (s.level_cabang || "MEDIUM") : "MEDIUM",
        terakhir_terjual_cabang: s ? s.terakhir_terjual_cabang || null : null,
      };
    });

    return c.json({
      barang: item,
      total_stok_global: totalStokGlobal,
      total_nilai_global: totalNilaiGlobal,
      is_manager_or_admin: isManagerOrAdmin,
      breakdown,
    });
  } catch (error: any) {
    console.error("Error fetching multi-branch stock:", error);
    return c.json({ error: error.message || "Gagal mengambil rincian stok multi-cabang" }, 500);
  }
});

masterRoutes.post("/stok", async (c) => {
  const body = await c.req.json();
  const idBarang = parseInt(body.id_barang);
  const idCabang = parseInt(body.id_cabang);
  const stokAkhir = parseInt(body.stok_akhir || "0");
  const posisiRak = body.posisi_rak || null;
  const minimalStok = parseInt(body.minimal_stok || "0");
  const maksimalStok = parseInt(body.maksimal_stok || "0");

  const [existing] = await db
    .select()
    .from(stok_barang)
    .where(and(eq(stok_barang.id_barang, idBarang), eq(stok_barang.id_cabang, idCabang)));

  if (existing) {
    const [updated] = await db
      .update(stok_barang)
      .set({
        stok_akhir: stokAkhir,
        posisi_rak: posisiRak,
        minimal_stok: minimalStok,
        maksimal_stok: maksimalStok,
      })
      .where(eq(stok_barang.id, existing.id))
      .returning();
    return c.json(updated);
  } else {
    const [newStok] = await db
      .insert(stok_barang)
      .values({
        id_barang: idBarang,
        id_cabang: idCabang,
        stok_akhir: stokAkhir,
        penjualan: 0,
        posisi_rak: posisiRak,
        minimal_stok: minimalStok,
        maksimal_stok: maksimalStok,
      })
      .returning();
    return c.json(newStok, 201);
  }
});

// Import Stok Barang dari Excel (.xlsx / .csv)
masterRoutes.post("/stok/import", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const idCabang = parseInt(body.id_cabang || c.req.query("id_cabang") || user.id_cabang);
  const items = Array.isArray(body) ? body : (body.items || body.data || []);

  if (!idCabang) {
    return c.json({ error: "Cabang tujuan wajib ditentukan." }, 400);
  }

  if (!Array.isArray(items) || items.length === 0) {
    return c.json({ error: "Payload data stok tidak boleh kosong." }, 400);
  }

  // 1. Validasi cabang
  const [branch] = await db.select().from(cabang).where(eq(cabang.id_cabang, idCabang)).limit(1);
  if (!branch) {
    return c.json({ error: "Cabang tidak ditemukan." }, 404);
  }

  // 2. Preload master barang
  const allBarang = await db
    .select({
      id_barang: barang.id_barang,
      kode_barang: barang.kode_barang,
      barcode: barang.barcode,
      nama_barang: barang.nama_barang,
      harga_beli: barang.harga_beli,
      harga_rata: barang.harga_rata,
      satuan_1: barang.satuan_1,
    })
    .from(barang);

  const barcodeMap = new Map<string, any>();
  const kodeMap = new Map<string, any>();
  allBarang.forEach((b) => {
    if (b.barcode) barcodeMap.set(b.barcode.trim().toLowerCase(), b);
    if (b.kode_barang) kodeMap.set(b.kode_barang.trim().toLowerCase(), b);
  });

  // 3. Preload current stock in target branch
  const currentBranchStocks = await db
    .select()
    .from(stok_barang)
    .where(eq(stok_barang.id_cabang, idCabang));

  const stockByBarangId = new Map<number, any>();
  currentBranchStocks.forEach((s) => {
    stockByBarangId.set(s.id_barang, s);
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
  const batchRefNo = `IMP-STK-${Date.now().toString().slice(-6)}`;

  // Ambil ID user penanggung jawab
  const [defaultUser] = await db.select({ id: users.id }).from(users).limit(1);
  const executorUserId = user?.id || defaultUser?.id || 4;

  let updatedCount = 0;
  let skippedCount = 0;
  const errors: { row: number; reason: string }[] = [];

  await db.transaction(async (tx) => {
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const rowNum = row.rowNum || i + 1;

      const kdBrg = (row.kode_barang || row.KDBRG || "").toString().trim();
      const barcodeVal = (row.barcode || row.BARCODE || "").toString().trim();
      const stockRaw = row.stock !== undefined ? row.stock : (row.STOCK !== undefined ? row.STOCK : "0");
      const stockNew = parseInt(String(stockRaw).replace(/,/g, ""));

      if (isNaN(stockNew) || stockNew < 0) {
        skippedCount++;
        errors.push({ row: rowNum, reason: `Nilai STOCK '${stockRaw}' tidak valid atau bernilai negatif.` });
        continue;
      }

      // Match item to master catalog
      const matchedItem =
        (kdBrg && kodeMap.get(kdBrg.toLowerCase())) ||
        (barcodeVal && barcodeMap.get(barcodeVal.toLowerCase())) ||
        null;

      if (!matchedItem) {
        skippedCount++;
        errors.push({
          row: rowNum,
          reason: `Barang '${row.nama_barang || kdBrg || barcodeVal}' belum terdaftar di katalog master barang.`,
        });
        continue;
      }

      const idBarang = matchedItem.id_barang;
      const currentStockRecord = stockByBarangId.get(idBarang);
      const saldoAwal = currentStockRecord ? (currentStockRecord.stok_akhir ?? 0) : 0;
      const diff = stockNew - saldoAwal;
      const hpp = matchedItem.harga_rata || matchedItem.harga_beli || 0;

      if (currentStockRecord) {
        // Update kuantitas stok_barang
        await tx
          .update(stok_barang)
          .set({
            stok_akhir: stockNew,
          })
          .where(eq(stok_barang.id, currentStockRecord.id));
      } else {
        // Insert record stok_barang baru untuk cabang ini
        const [newRecord] = await tx
          .insert(stok_barang)
          .values({
            id_barang: idBarang,
            id_cabang: idCabang,
            stok_akhir: stockNew,
            penjualan: 0,
            minimal_stok: 0,
            maksimal_stok: 0,
          })
          .returning();
        stockByBarangId.set(idBarang, newRecord);
      }

      // Catat mutasi selisih ke kartu_stok
      if (diff !== 0 || !currentStockRecord) {
        const masukQty = diff > 0 ? diff : 0;
        const keluarQty = diff < 0 ? Math.abs(diff) : 0;
        const totalNilai = Math.abs(diff) * hpp;

        await tx.insert(kartu_stok).values({
          id_barang: idBarang,
          id_cabang: idCabang,
          tanggal_transaksi: todayStr,
          tipe_transaksi: "IMPORT_STOK",
          nomor_referensi: `${batchRefNo}-${rowNum}`,
          saldo_awal: saldoAwal,
          masuk: masukQty,
          keluar: keluarQty,
          saldo_akhir: stockNew,
          hpp_satuan: hpp,
          total_nilai: totalNilai,
          keterangan: `Import stok fisik Excel (Saldo: ${saldoAwal} -> ${stockNew})`,
          id_user: executorUserId,
          created_at: nowStr,
        });
      }

      updatedCount++;
    }
  });

  return c.json({
    success: true,
    nama_cabang: branch.nama_cabang,
    total: items.length,
    updated: updatedCount,
    skipped: skippedCount,
    errors,
  });
});

masterRoutes.put("/stok/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  if (body.stok_akhir !== undefined) {
    return c.json({
      error: "Manipulasi stok_akhir secara langsung telah dinonaktifkan demi integritas audit. Harap gunakan fitur 'Penyesuaian Cepat (Quick Adjustment)' atau 'Stock Opname'."
    }, 400);
  }

  const updates: any = {};
  if (body.posisi_rak !== undefined) updates.posisi_rak = body.posisi_rak;
  if (body.minimal_stok !== undefined) updates.minimal_stok = parseInt(body.minimal_stok);
  if (body.maksimal_stok !== undefined) updates.maksimal_stok = parseInt(body.maksimal_stok);

  await db
    .update(stok_barang)
    .set(updates)
    .where(eq(stok_barang.id, parseInt(id)));

  return c.json({ success: true });
});

masterRoutes.delete("/stok/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(stok_barang).where(eq(stok_barang.id, parseInt(id)));
  return c.json({ success: true });
});

// ============================================================================
// ENTERPRISE INVENTORY & AUDIT ENDPOINTS
// ============================================================================

/**
 * POST /api/master/stok/quick-adjust
 * Penyesuaian Cepat Stok Berdokumen:
 * - Update kuantitas stok_barang
 * - Catat mutasi atomik ke kartu_stok (Stock Ledger)
 * - Simpan dokumen stok_adjustment & stok_adjustment_detail
 * - Otomatis posting jurnal akuntansi kerugian/surplus stok
 */
masterRoutes.post("/stok/quick-adjust", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const {
      id_barang,
      id_cabang,
      qty_penyesuaian,
      tipe_alasan,
      tindakan_stok,
      keterangan,
    } = body;

    if (!id_barang || qty_penyesuaian === undefined || !tipe_alasan) {
      return c.json({ error: "ID barang, kuantitas penyesuaian, dan alasan wajib diisi" }, 400);
    }

    const branchId = id_cabang ? parseInt(id_cabang) : user.id_cabang;
    const diffQty = parseInt(qty_penyesuaian);

    if (diffQty === 0) {
      return c.json({ error: "Kuantitas penyesuaian tidak boleh nol" }, 400);
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);

    // Guard Periode Akuntansi
    const [period] = await db
      .select()
      .from(periode_akuntansi)
      .where(
        and(
          lte(periode_akuntansi.tanggal_mulai, todayStr),
          gte(periode_akuntansi.tanggal_akhir, todayStr)
        )
      )
      .limit(1);

    if (period) {
      if (period.status === "HARD_CLOSED") {
        return c.json({ error: `Periode akuntansi ${period.bulan}/${period.tahun} telah HARD_CLOSED.` }, 403);
      }
      if (period.status === "SOFT_LOCKED" && user.id_jabatan !== 1) {
        return c.json({ error: `Periode akuntansi ${period.bulan}/${period.tahun} telah SOFT_LOCKED. Butuh otorisasi Super User!` }, 403);
      }
    }

    const [item] = await db.select().from(barang).where(eq(barang.id_barang, parseInt(id_barang))).limit(1);
    if (!item) {
      return c.json({ error: "Barang tidak ditemukan" }, 404);
    }

    const [currentStock] = await db
      .select()
      .from(stok_barang)
      .where(and(eq(stok_barang.id_barang, parseInt(id_barang)), eq(stok_barang.id_cabang, branchId)))
      .limit(1);

    const saldoAwal = currentStock ? (currentStock.stok_akhir ?? 0) : 0;
    const hpp = item.harga_rata || item.harga_beli || 0;
    const nomorAdj = `ADJ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await db.transaction(async (tx) => {
      let saldoAkhir = saldoAwal;
      let totalKerugian = 0;
      let createdJournalId: number | null = null;

      const [karantinaBin] = await tx
        .select()
        .from(gudang_lokasi)
        .where(and(eq(gudang_lokasi.id_cabang, branchId), eq(gudang_lokasi.tipe_lokasi, "KARANTINA")))
        .limit(1);

      const [displayBin] = await tx
        .select()
        .from(gudang_lokasi)
        .where(and(eq(gudang_lokasi.id_cabang, branchId), eq(gudang_lokasi.tipe_lokasi, "DISPLAY")))
        .limit(1);

      if (tindakan_stok === "PINDAH_KE_KARANTINA") {
        // Pindah stok internal ke Area Karantina (misal untuk retur vendor nanti)
        if (displayBin && karantinaBin) {
          const [stokDisp] = await tx
            .select()
            .from(stok_lokasi)
            .where(and(eq(stok_lokasi.id_barang, parseInt(id_barang)), eq(stok_lokasi.id_lokasi, displayBin.id_lokasi)))
            .limit(1);
          if (stokDisp) {
            await tx
              .update(stok_lokasi)
              .set({ stok_qty: Math.max(0, stokDisp.stok_qty - Math.abs(diffQty)) })
              .where(eq(stok_lokasi.id, stokDisp.id));
          }

          const [stokKrt] = await tx
            .select()
            .from(stok_lokasi)
            .where(and(eq(stok_lokasi.id_barang, parseInt(id_barang)), eq(stok_lokasi.id_lokasi, karantinaBin.id_lokasi)))
            .limit(1);
          if (stokKrt) {
            await tx
              .update(stok_lokasi)
              .set({ stok_qty: stokKrt.stok_qty + Math.abs(diffQty) })
              .where(eq(stok_lokasi.id, stokKrt.id));
          } else {
            await tx.insert(stok_lokasi).values({
              id_barang: parseInt(id_barang),
              id_lokasi: karantinaBin.id_lokasi,
              stok_qty: Math.abs(diffQty),
              posisi_rak: "Area Karantina",
            });
          }
        }

        // Catat ke kartu_stok
        await tx.insert(kartu_stok).values({
          id_barang: parseInt(id_barang),
          id_cabang: branchId,
          id_lokasi: karantinaBin?.id_lokasi,
          tanggal_transaksi: nowStr,
          tipe_transaksi: "MUTASI_INTERNAL_BIN",
          nomor_referensi: nomorAdj,
          saldo_awal: saldoAwal,
          masuk: 0,
          keluar: 0,
          saldo_akhir: saldoAwal,
          hpp_satuan: hpp,
          total_nilai: saldoAwal * hpp,
          keterangan: `Dipindahkan ke Area Karantina (${tipe_alasan}): ${keterangan || "-"}`,
          id_user: user.id,
        });

      } else {
        // BUANG_HAPUSKAN_STOK atau TAMBAH_STOK_TEMUAN
        saldoAkhir = saldoAwal + diffQty;
        if (saldoAkhir < 0) saldoAkhir = 0;

        const qtyMasuk = diffQty > 0 ? diffQty : 0;
        const qtyKeluar = diffQty < 0 ? Math.abs(diffQty) : 0;
        const nilaiSelisih = Math.abs(diffQty) * hpp;

        if (diffQty < 0) {
          totalKerugian = nilaiSelisih;
        }

        if (currentStock) {
          await tx
            .update(stok_barang)
            .set({ stok_akhir: saldoAkhir })
            .where(eq(stok_barang.id, currentStock.id));
        } else {
          await tx.insert(stok_barang).values({
            id_barang: parseInt(id_barang),
            id_cabang: branchId,
            stok_akhir: saldoAkhir,
            penjualan: 0,
            posisi_rak: "-",
            minimal_stok: 0,
            maksimal_stok: 100,
          });
        }

        // Catat Kartu Stok Universal
        await tx.insert(kartu_stok).values({
          id_barang: parseInt(id_barang),
          id_cabang: branchId,
          id_lokasi: displayBin?.id_lokasi,
          tanggal_transaksi: nowStr,
          tipe_transaksi: "QUICK_ADJUSTMENT",
          nomor_referensi: nomorAdj,
          saldo_awal: saldoAwal,
          masuk: qtyMasuk,
          keluar: qtyKeluar,
          saldo_akhir: saldoAkhir,
          hpp_satuan: hpp,
          total_nilai: saldoAkhir * hpp,
          keterangan: `Penyesuaian Cepat (${tipe_alasan}): ${keterangan || "-"}`,
          id_user: user.id,
        });

        // Auto Jurnal Akuntansi jika ada nilai selisih
        if (nilaiSelisih > 0) {
          const [persediaanAkun] = await tx
            .select()
            .from(daftar_akun)
            .where(eq(daftar_akun.kode_akun, "1.104.01"))
            .limit(1);

          if (diffQty < 0) {
            // Kerugian inventaris: Dr. 6.107.01 Beban Selisih, Cr. 1.104.01 Persediaan
            const [bebanAkun] = await tx
              .select()
              .from(daftar_akun)
              .where(eq(daftar_akun.kode_akun, "6.107.01"))
              .limit(1);

            if (bebanAkun && persediaanAkun) {
              const [jDeb] = await tx
                .insert(jurnal_umum)
                .values({
                  tanggal_transaksi: todayStr,
                  no_referensi_bukti: nomorAdj,
                  deskripsi: `Kerugian Inventaris ${nomorAdj} (${item.nama_barang} - ${tipe_alasan})`,
                  akun_id: bebanAkun.id,
                  cabang_id: branchId,
                  debit: nilaiSelisih,
                  kredit: 0,
                  dibuat_oleh: user.id,
                })
                .returning();

              await tx.insert(jurnal_umum).values({
                tanggal_transaksi: todayStr,
                no_referensi_bukti: nomorAdj,
                deskripsi: `Pengurangan Persediaan ${nomorAdj} (${item.nama_barang})`,
                akun_id: persediaanAkun.id,
                cabang_id: branchId,
                debit: 0,
                kredit: nilaiSelisih,
                dibuat_oleh: user.id,
              });

              createdJournalId = jDeb.id;
            }
          } else {
            // Kelebihan stok: Dr. 1.104.01 Persediaan, Cr. 7.102.01 Pendapatan Penyesuaian
            const [pendapatanAkun] = await tx
              .select()
              .from(daftar_akun)
              .where(eq(daftar_akun.kode_akun, "7.102.01"))
              .limit(1);

            if (pendapatanAkun && persediaanAkun) {
              const [jDeb] = await tx
                .insert(jurnal_umum)
                .values({
                  tanggal_transaksi: todayStr,
                  no_referensi_bukti: nomorAdj,
                  deskripsi: `Penyesuaian Tambah Persediaan ${nomorAdj} (${item.nama_barang})`,
                  akun_id: persediaanAkun.id,
                  cabang_id: branchId,
                  debit: nilaiSelisih,
                  kredit: 0,
                  dibuat_oleh: user.id,
                })
                .returning();

              await tx.insert(jurnal_umum).values({
                tanggal_transaksi: todayStr,
                no_referensi_bukti: nomorAdj,
                deskripsi: `Pendapatan Surplus Stok ${nomorAdj} (${item.nama_barang})`,
                akun_id: pendapatanAkun.id,
                cabang_id: branchId,
                debit: 0,
                kredit: nilaiSelisih,
                dibuat_oleh: user.id,
              });

              createdJournalId = jDeb.id;
            }
          }
        }
      }

      // Catat dokumen penyesuaian
      const [headerAdj] = await tx
        .insert(stok_adjustment)
        .values({
          nomor_adj: nomorAdj,
          id_cabang: branchId,
          tanggal_adj: todayStr,
          id_petugas: user.id,
          tipe_alasan: tipe_alasan,
          tindakan_stok: tindakan_stok || "BUANG_HAPUSKAN_STOK",
          total_item: 1,
          total_nilai_kerugian: totalKerugian,
          keterangan: keterangan || null,
          id_jurnal: createdJournalId,
        })
        .returning();

      await tx.insert(stok_adjustment_detail).values({
        id_adj: headerAdj.id_adj,
        id_barang: parseInt(id_barang),
        id_lokasi_asal: displayBin?.id_lokasi,
        id_lokasi_tujuan: tindakan_stok === "PINDAH_KE_KARANTINA" ? karantinaBin?.id_lokasi : undefined,
        stok_sebelum: saldoAwal,
        qty_penyesuaian: diffQty,
        stok_setelah: saldoAkhir,
        hpp_satuan: hpp,
        subtotal_nilai: Math.abs(diffQty) * hpp,
      });

      return { nomorAdj, saldoAwal, saldoAkhir, diffQty, journalCreated: !!createdJournalId };
    });

    return c.json({
      success: true,
      message: `Penyesuaian stok berhasil disimpan (${result.nomorAdj}).`,
      data: result,
    });
  } catch (error: any) {
    console.error("Error executing quick adjustment:", error);
    return c.json({ error: error.message || "Gagal memproses penyesuaian stok" }, 500);
  }
});

/**
 * GET /api/master/kartu-stok
 * Menampilkan riwayat pergerakan stok (Stock Ledger)
 */
masterRoutes.get("/kartu-stok", async (c) => {
  try {
    const user = c.get("user");
    const idBarang = c.req.query("id_barang");
    const idCabang = c.req.query("id_cabang");
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");
    const limit = parseInt(c.req.query("limit") || "100");

    const targetCabang = idCabang ? parseInt(idCabang) : (user?.id_cabang ? Number(user.id_cabang) : null);

    const conditions = [];
    if (targetCabang) conditions.push(eq(kartu_stok.id_cabang, targetCabang));
    if (idBarang) conditions.push(eq(kartu_stok.id_barang, parseInt(idBarang)));
    if (startDate) conditions.push(gte(kartu_stok.tanggal_transaksi, startDate));
    if (endDate) conditions.push(lte(kartu_stok.tanggal_transaksi, endDate + " 23:59:59"));

    const rows = await db
      .select({
        id_kartu: kartu_stok.id_kartu,
        id_barang: kartu_stok.id_barang,
        nama_barang: barang.nama_barang,
        barcode: barang.barcode,
        satuan_1: barang.satuan_1,
        id_cabang: kartu_stok.id_cabang,
        nama_cabang: cabang.nama_cabang,
        tanggal_transaksi: kartu_stok.tanggal_transaksi,
        tipe_transaksi: kartu_stok.tipe_transaksi,
        nomor_referensi: kartu_stok.nomor_referensi,
        saldo_awal: kartu_stok.saldo_awal,
        masuk: kartu_stok.masuk,
        keluar: kartu_stok.keluar,
        saldo_akhir: kartu_stok.saldo_akhir,
        hpp_satuan: kartu_stok.hpp_satuan,
        total_nilai: kartu_stok.total_nilai,
        keterangan: kartu_stok.keterangan,
        nama_petugas: users.nama_user,
        created_at: kartu_stok.created_at,
      })
      .from(kartu_stok)
      .innerJoin(barang, eq(kartu_stok.id_barang, barang.id_barang))
      .innerJoin(cabang, eq(kartu_stok.id_cabang, cabang.id_cabang))
      .leftJoin(users, eq(kartu_stok.id_user, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(kartu_stok.id_kartu))
      .limit(limit);

    return c.json(rows);
  } catch (error: any) {
    console.error("Error fetching kartu stok:", error);
    return c.json({ error: error.message || "Gagal mengambil kartu stok" }, 500);
  }
});

/**
 * GET /api/master/gudang-lokasi
 * List sub-lokasi penyimpanan per cabang
 */
masterRoutes.get("/gudang-lokasi", async (c) => {
  try {
    const user = c.get("user");
    const idCabang = c.req.query("id_cabang");
    const targetCabang = idCabang ? parseInt(idCabang) : (user?.id_cabang ? Number(user.id_cabang) : null);

    const rows = await db
      .select()
      .from(gudang_lokasi)
      .where(targetCabang ? eq(gudang_lokasi.id_cabang, targetCabang) : undefined)
      .orderBy(asc(gudang_lokasi.tipe_lokasi));

    return c.json(rows);
  } catch (error: any) {
    console.error("Error fetching gudang lokasi:", error);
    return c.json({ error: error.message || "Gagal mengambil sub-lokasi gudang" }, 500);
  }
});

/**
 * GET /api/master/stok/reorder-suggestions
 * Daftar stok menipis dengan rekomendasi saran pemesanan PO
 */
masterRoutes.get("/stok/reorder-suggestions", async (c) => {
  try {
    const user = c.get("user");
    const idCabang = c.req.query("id_cabang");
    const targetCabang = idCabang ? parseInt(idCabang) : (user?.id_cabang ? Number(user.id_cabang) : null);

    const rows = await db
      .select({
        id_stok: stok_barang.id,
        id_barang: barang.id_barang,
        barcode: barang.barcode,
        nama_barang: barang.nama_barang,
        id_supplier: barang.id_supplier,
        nama_supplier: supplier.nama_supplier,
        satuan_1: barang.satuan_1,
        satuan_3: barang.satuan_3,
        isi_3: barang.isi_3,
        harga_beli: barang.harga_beli,
        stok_akhir: stok_barang.stok_akhir,
        minimal_stok: stok_barang.minimal_stok,
        maksimal_stok: stok_barang.maksimal_stok,
      })
      .from(stok_barang)
      .innerJoin(barang, eq(stok_barang.id_barang, barang.id_barang))
      .leftJoin(supplier, eq(barang.id_supplier, supplier.id_supplier))
      .where(
        and(
          targetCabang ? eq(stok_barang.id_cabang, targetCabang) : sql`1=1`,
          lte(stok_barang.stok_akhir, stok_barang.minimal_stok),
          gt(stok_barang.minimal_stok, 0)
        )
      )
      .orderBy(asc(stok_barang.stok_akhir));

    const result = rows.map((r) => {
      const stokCurr = r.stok_akhir || 0;
      const maxStok = r.maksimal_stok || (r.minimal_stok ? r.minimal_stok * 2 : 50);
      const saranOrderPcs = Math.max(1, maxStok - stokCurr);
      const isi3 = r.isi_3 || 1;
      const saranOrderDus = Math.floor(saranOrderPcs / isi3);

      return {
        ...r,
        saran_order_pcs: saranOrderPcs,
        saran_order_dus: saranOrderDus > 0 ? saranOrderDus : null,
        estimasi_biaya: saranOrderPcs * (r.harga_beli || 0),
      };
    });

    return c.json(result);
  } catch (error: any) {
    console.error("Error fetching reorder suggestions:", error);
    return c.json({ error: error.message || "Gagal mengambil rekomendasi reorder" }, 500);
  }
});

