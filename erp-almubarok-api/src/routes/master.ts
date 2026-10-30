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
import { eq, and, or, like, ne, sql, desc, asc, lte, gte, gt } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";

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
    if (user.id_jabatan !== 1 && user.id_jabatan !== 2) {
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
  const data = await db.select().from(supplier).orderBy(supplier.nama_supplier);
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
  const q = c.req.query("q") || c.req.query("search");
  const barcode = c.req.query("barcode");
  const user = c.get("user");
  const idCabang = user.id_cabang || 1;

  const query = db
    .select({
      id_barang: barang.id_barang,
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
      barcode_satuan_2: barang.barcode_satuan_2,
      barcode_satuan_3: barang.barcode_satuan_3,
      tipe_barang: barang.tipe_barang,
      lacak_kadaluarsa: barang.lacak_kadaluarsa,
      keterangan_1: barang.keterangan_1,
      keterangan_2: barang.keterangan_2,
      stok_akhir: stok_barang.stok_akhir,
    })
    .from(barang)
    .leftJoin(kategori_barang, eq(barang.id_kategori, kategori_barang.id_kategori))
    .leftJoin(supplier, eq(barang.id_supplier, supplier.id_supplier))
    .leftJoin(stok_barang, and(eq(barang.id_barang, stok_barang.id_barang), eq(stok_barang.id_cabang, idCabang)));

  if (barcode) {
    const data = await query.where(
      or(
        eq(barang.barcode, barcode),
        eq(barang.barcode_satuan_2, barcode),
        eq(barang.barcode_satuan_3, barcode)
      )
    );
    return c.json(data);
  }

  if (q) {
    const data = await query.where(
      or(
        like(barang.nama_barang, `%${q}%`),
        like(barang.barcode, `%${q}%`),
        like(barang.barcode_satuan_2, `%${q}%`),
        like(barang.barcode_satuan_3, `%${q}%`)
      )
    );
    return c.json(data);
  }

  const data = await query.orderBy(barang.nama_barang);
  return c.json(data);
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
      barcode_satuan_2: body.barcode_satuan_2 ? body.barcode_satuan_2.trim() : null,
      barcode_satuan_3: body.barcode_satuan_3 ? body.barcode_satuan_3.trim() : null,
      tipe_barang: body.tipe_barang || "STOK",
      lacak_kadaluarsa: Boolean(body.lacak_kadaluarsa),
      keterangan_1: body.keterangan_1 || null,
      keterangan_2: body.keterangan_2 || null,
    })
    .returning();

  return c.json(newBarang, 201);
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
      barcode_satuan_2: body.barcode_satuan_2 !== undefined ? (body.barcode_satuan_2 ? body.barcode_satuan_2.trim() : null) : undefined,
      barcode_satuan_3: body.barcode_satuan_3 !== undefined ? (body.barcode_satuan_3 ? body.barcode_satuan_3.trim() : null) : undefined,
      tipe_barang: body.tipe_barang || "STOK",
      lacak_kadaluarsa: body.lacak_kadaluarsa !== undefined ? Boolean(body.lacak_kadaluarsa) : undefined,
      keterangan_1: body.keterangan_1 || null,
      keterangan_2: body.keterangan_2 || null,
    })
    .where(eq(barang.id_barang, parseInt(id)));

  return c.json({ success: true });
});

masterRoutes.delete("/barang/:id", async (c) => {
  const id = c.req.param("id");
  try {
    // Cek stok terkait di cabang
    const stokTerkait = await db
      .select()
      .from(stok_barang)
      .where(eq(stok_barang.id_barang, parseInt(id)));
    if (stokTerkait.some((s) => (s.stok_akhir ?? 0) > 0)) {
      return c.json({ error: "Barang tidak dapat dihapus karena masih memiliki stok aktif di cabang." }, 400);
    }

    await db.delete(barang).where(eq(barang.id_barang, parseInt(id)));
    return c.json({ success: true });
  } catch (err) {
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
    return c.json({ error: "Gagal memuat cabang: " + err.message }, 500);
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
    return c.json({ error: "Gagal memuat investor: " + err.message }, 500);
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
  const data = await db.select().from(pelanggan).orderBy(pelanggan.nama_lengkap);
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

  // Security check: Super User (1), IT (2), Bendahara (4), Admin (5), Manager (8), SPV (11) can query other branches
  const allowedRoles = [1, 2, 4, 5, 8, 11];
  const isManagerOrAdmin = allowedRoles.includes(user.id_jabatan);

  let idCabang: number | null = user.id_cabang;
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

  const query = db
    .select({
      id: stok_barang.id,
      id_barang: stok_barang.id_barang,
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
    ? await query.orderBy(cabang.nama_cabang, barang.nama_barang)
    : await query.where(eq(stok_barang.id_cabang, idCabang!)).orderBy(barang.nama_barang);

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
      })
      .from(barang)
      .where(eq(barang.id_barang, id))
      .limit(1);

    if (!item) {
      return c.json({ error: "Barang tidak ditemukan" }, 404);
    }

    const allowedRoles = [1, 2, 4, 5, 8, 11];
    const isManagerOrAdmin = allowedRoles.includes(user.id_jabatan);

    // Ambil daftar cabang
    const branchQuery = db
      .select({
        id_cabang: cabang.id_cabang,
        kode_cabang: cabang.kode_cabang,
        nama_cabang: cabang.nama_cabang,
        alamat: cabang.alamat,
      })
      .from(cabang);

    const allBranches = isManagerOrAdmin
      ? await branchQuery.orderBy(cabang.id_cabang)
      : await branchQuery.where(eq(cabang.id_cabang, user.id_cabang));

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

    const targetCabang = idCabang ? parseInt(idCabang) : user.id_cabang;

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
    const targetCabang = idCabang ? parseInt(idCabang) : user.id_cabang;

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
    const targetCabang = idCabang ? parseInt(idCabang) : user.id_cabang;

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

