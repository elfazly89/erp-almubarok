import { Hono } from "hono";
import { db } from "../lib/db";
import {
  barang,
  kategori_barang,
  supplier,
  cabang,
  pelanggan,
  stok_barang,
  users,
  pengiriman
} from "../lib/db/schema";
import { eq, and, or, like, ne, sql } from "drizzle-orm";
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
      keterangan_1: barang.keterangan_1,
      keterangan_2: barang.keterangan_2,
      stok_akhir: stok_barang.stok_akhir,
    })
    .from(barang)
    .leftJoin(kategori_barang, eq(barang.id_kategori, kategori_barang.id_kategori))
    .leftJoin(supplier, eq(barang.id_supplier, supplier.id_supplier))
    .leftJoin(stok_barang, and(eq(barang.id_barang, stok_barang.id_barang), eq(stok_barang.id_cabang, idCabang)));

  if (barcode) {
    const data = await query.where(eq(barang.barcode, barcode));
    return c.json(data);
  }

  if (q) {
    const data = await query.where(
      or(
        like(barang.nama_barang, `%${q}%`),
        like(barang.barcode, `%${q}%`)
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
      jual_rugi: body.jual_rugi ? parseInt(body.jual_rugi) : 0,
      status: body.status || "Aktif",
      status_pajak: body.status_pajak || null,
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

    // 3. Validasi keunikan nama_cabang
    const [existingNama] = await db
      .select({ id: cabang.id_cabang })
      .from(cabang)
      .where(eq(cabang.nama_cabang, body.nama_cabang.trim()))
      .limit(1);
    if (existingNama) {
      return c.json({ error: "Nama cabang sudah terdaftar pada cabang lain." }, 409);
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

    // 3. Validasi keunikan nama_cabang (kecuali cabang ini sendiri)
    const [existingNama] = await db
      .select({ id: cabang.id_cabang })
      .from(cabang)
      .where(and(eq(cabang.nama_cabang, body.nama_cabang.trim()), ne(cabang.id_cabang, id)))
      .limit(1);
    if (existingNama) {
      return c.json({ error: "Nama cabang sudah terdaftar pada cabang lain." }, 409);
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
      })
      .where(eq(cabang.id_cabang, id));
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: "Gagal memperbarui cabang: " + err.message }, 500);
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
// 6. STOK BARANG
// ==========================================
masterRoutes.get("/stok", async (c) => {
  const user = c.get("user");
  const paramCabang = c.req.query("id_cabang");
  const paramBarang = c.req.query("id_barang");

  // Security check: Only Super User (1) or IT (2) can query other branches' stock
  let idCabang = user.id_cabang;
  if (paramCabang && (user.id_jabatan === 1 || user.id_jabatan === 2)) {
    idCabang = parseInt(paramCabang);
  }

  if (!idCabang) {
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
          eq(stok_barang.id_cabang, idCabang),
          eq(stok_barang.id_barang, idBarang)
        )
      )
      .limit(1);

    return c.json(item || { stok_akhir: 0 });
  }

  const data = await db
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
    .innerJoin(cabang, eq(stok_barang.id_cabang, cabang.id_cabang))
    .where(eq(stok_barang.id_cabang, idCabang))
    .orderBy(barang.nama_barang);

  return c.json(data);
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

  const updates: any = {};
  if (body.posisi_rak !== undefined) updates.posisi_rak = body.posisi_rak;
  if (body.stok_akhir !== undefined) updates.stok_akhir = parseInt(body.stok_akhir);
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
