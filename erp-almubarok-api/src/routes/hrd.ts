import { Hono } from "hono";
import { db } from "../lib/db";
import {
  users,
  jabatan,
  absensi,
  jam_kerja,
  hari_libur,
  izin_cuti,
  hutang_karyawan,
  daftar_gaji_jabatan,
  bisyaroh,
  cabang,
  jurnal_umum,
  kasir_jadwal,
  jadwal_karyawan,
  jabatan_shift_config,
  tukar_shift
} from "../lib/db/schema";
import { eq, and, or, like, ilike, sql, asc, desc, gte, lte, inArray } from "drizzle-orm";
import { hashPassword } from "../lib/auth/password";
import type { JWTPayload } from "../lib/auth/jwt";

export const hrdRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// ==========================================
// 0. DASHBOARD STATS
// ==========================================
hrdRoutes.get("/dashboard-stats", async (c) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [totalUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`status != 'Non-Aktif'`);

    const [absensiHariIni] = await db
      .select({ count: sql<number>`count(distinct user_id)` })
      .from(absensi)
      .where(and(eq(absensi.tanggal, today), eq(absensi.jenis, 'masuk')));

    const jabatanList = await db
      .select({
        jabatan: jabatan.jabatan,
        count: sql<number>`count(${users.id})`,
      })
      .from(jabatan)
      .leftJoin(users, eq(jabatan.id_jabatan, users.id_jabatan))
      .groupBy(jabatan.id_jabatan, jabatan.jabatan);

    return c.json({
      totalUsers: totalUsers || { count: 0 },
      absensiHariIni: absensiHariIni || { count: 0 },
      jabatanList: jabatanList || [],
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return c.json({ error: "Gagal mengambil data statistik dashboard: " + error.message }, 500);
  }
});

// ==========================================
// 1. USERS
// ==========================================
hrdRoutes.get("/users", async (c) => {
  const activeUser = c.get("user");
  const search = c.req.query("search") || c.req.query("q") || "";
  const status = c.req.query("status") || "";
  const idJabatan = c.req.query("id_jabatan") || "";
  const idCabang = c.req.query("id_cabang") || "";
  const tahunMasuk = c.req.query("tahun_masuk") || "";
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.max(1, parseInt(c.req.query("limit") || "50"));
  const offset = (page - 1) * limit;
  const sortBy = c.req.query("sortBy") || "nama_user";
  const sortOrder = c.req.query("sortOrder") || "asc";

  let orderExpr;
  if (sortBy === "kode_user") {
    orderExpr = sortOrder === "desc" ? desc(users.kode_user) : asc(users.kode_user);
  } else if (sortBy === "status") {
    orderExpr = sortOrder === "desc" ? desc(users.status) : asc(users.status);
  } else if (sortBy === "tanggal_masuk") {
    orderExpr = sortOrder === "desc" ? desc(users.tanggal_masuk) : asc(users.tanggal_masuk);
  } else if (sortBy === "no_hp") {
    orderExpr = sortOrder === "desc" ? desc(users.no_hp) : asc(users.no_hp);
  } else if (sortBy === "jabatan") {
    orderExpr = sortOrder === "desc" ? desc(jabatan.jabatan) : asc(jabatan.jabatan);
  } else if (sortBy === "nama_cabang") {
    orderExpr = sortOrder === "desc" ? desc(cabang.nama_cabang) : asc(cabang.nama_cabang);
  } else {
    orderExpr = sortOrder === "desc" ? desc(users.nama_user) : asc(users.nama_user);
  }

  const conditions = [];
  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(users.nama_user, s),
        ilike(users.kode_user, s),
        ilike(users.no_hp, s),
        ilike(users.no_ktp, s),
        ilike(jabatan.jabatan, s),
        ilike(cabang.nama_cabang, s)
      )
    );
  }
  if (status) {
    conditions.push(eq(users.status, status));
  }
  if (idJabatan) {
    conditions.push(eq(users.id_jabatan, parseInt(idJabatan)));
  }
  // Security context: Non-admins can only see users of their own branch
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
    conditions.push(eq(users.id_cabang, activeUser.id_cabang));
  } else if (idCabang) {
    conditions.push(eq(users.id_cabang, parseInt(idCabang)));
  }
  if (tahunMasuk) {
    conditions.push(like(users.tanggal_masuk, `${tahunMasuk}-%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: users.id,
        kode_user: users.kode_user,
        nama_user: users.nama_user,
        status: users.status,
        no_hp: users.no_hp,
        foto: users.foto,
        tanggal_masuk: users.tanggal_masuk,
        id_jabatan: users.id_jabatan,
        id_cabang: users.id_cabang,
        tempat_lahir: users.tempat_lahir,
        tanggal_lahir: users.tanggal_lahir,
        no_ktp: users.no_ktp,
        pendidikan_terakhir: users.pendidikan_terakhir,
        riwayat_lembaga: users.riwayat_lembaga,
        riwayat_pekerjaan: users.riwayat_pekerjaan,
        jabatan: jabatan.jabatan,
        nama_cabang: cabang.nama_cabang,
      })
      .from(users)
      .leftJoin(jabatan, eq(users.id_jabatan, jabatan.id_jabatan))
      .leftJoin(cabang, eq(users.id_cabang, cabang.id_cabang))
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(orderExpr),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .leftJoin(jabatan, eq(users.id_jabatan, jabatan.id_jabatan))
      .leftJoin(cabang, eq(users.id_cabang, cabang.id_cabang))
      .where(where),
  ]);

  const total = Number(totalResult[0]?.count || 0);

  return c.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  });
});

hrdRoutes.post("/users", async (c) => {
  try {
    const body = await c.req.json();
    const { password, ...rest } = body;

    if (!password) {
      return c.json({ error: "Password wajib diisi" }, 400);
    }

    const hashed = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({ ...rest, password: hashed })
      .returning({ id: users.id });

    return c.json({ success: true, id: newUser.id }, 201);
  } catch (error: any) {
    if (error.message?.includes("unique") || error.message?.includes("UNIQUE")) {
      return c.json({ error: "Kode user sudah digunakan" }, 409);
    }
    return c.json({ error: error.message || "Gagal membuat user" }, 500);
  }
});

hrdRoutes.get("/users/:id", async (c) => {
  const id = c.req.param("id");
  const [user] = await db
    .select({
      id: users.id,
      kode_user: users.kode_user,
      nama_user: users.nama_user,
      status: users.status,
      no_hp: users.no_hp,
      foto: users.foto,
      tanggal_masuk: users.tanggal_masuk,
      id_jabatan: users.id_jabatan,
      id_cabang: users.id_cabang,
      tempat_lahir: users.tempat_lahir,
      tanggal_lahir: users.tanggal_lahir,
      no_ktp: users.no_ktp,
      pendidikan_terakhir: users.pendidikan_terakhir,
      riwayat_lembaga: users.riwayat_lembaga,
      riwayat_pekerjaan: users.riwayat_pekerjaan,
      jabatan: jabatan.jabatan,
      nama_cabang: cabang.nama_cabang,
    })
    .from(users)
    .leftJoin(jabatan, eq(users.id_jabatan, jabatan.id_jabatan))
    .leftJoin(cabang, eq(users.id_cabang, cabang.id_cabang))
    .where(eq(users.id, parseInt(id)))
    .limit(1);

  if (!user) {
    return c.json({ error: "User tidak ditemukan" }, 404);
  }
  return c.json(user);
});

hrdRoutes.put("/users/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { password, ...rest } = body;

  const updates: any = { ...rest };
  if (password) {
    updates.password = await hashPassword(password);
  }

  await db
    .update(users)
    .set(updates)
    .where(eq(users.id, parseInt(id)));

  return c.json({ success: true });
});

hrdRoutes.delete("/users/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(users).where(eq(users.id, parseInt(id)));
  return c.json({ success: true });
});

// ==========================================
// 2. JABATAN
// ==========================================
hrdRoutes.get("/jabatan", async (c) => {
  const data = await db.select().from(jabatan).orderBy(jabatan.jabatan);
  return c.json(data);
});

hrdRoutes.post("/jabatan", async (c) => {
  const body = await c.req.json();
  const [newJabatan] = await db
    .insert(jabatan)
    .values({ jabatan: body.jabatan })
    .returning();
  return c.json(newJabatan, 201);
});

hrdRoutes.put("/jabatan/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  await db
    .update(jabatan)
    .set({ jabatan: body.jabatan })
    .where(eq(jabatan.id_jabatan, parseInt(id)));
  return c.json({ success: true });
});

hrdRoutes.delete("/jabatan/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(jabatan).where(eq(jabatan.id_jabatan, parseInt(id)));
  return c.json({ success: true });
});

// ==========================================
// 3. ABSENSI
// ==========================================
hrdRoutes.get("/absensi", async (c) => {
  const activeUser = c.get("user");
  const tanggal = c.req.query("tanggal") || new Date().toISOString().split("T")[0];
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = (page - 1) * limit;

  const conditions = [eq(absensi.tanggal, tanggal)];
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
    conditions.push(eq(users.id_cabang, activeUser.id_cabang));
  }

  const data = await db
    .select({
      id: absensi.id,
      user_id: absensi.user_id,
      tanggal: absensi.tanggal,
      jam: absensi.jam,
      jenis: absensi.jenis,
      shift: absensi.shift,
      latitude: absensi.latitude,
      longitude: absensi.longitude,
      status_lokasi: absensi.status_lokasi,
      catatan: absensi.catatan,
      created_at: absensi.created_at,
      nama_user: users.nama_user,
      kode_user: users.kode_user,
    })
    .from(absensi)
    .leftJoin(users, eq(absensi.user_id, users.id))
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)
    .orderBy(absensi.jam);

  const [total] = await db
    .select({ count: sql<number>`count(*)` })
    .from(absensi)
    .leftJoin(users, eq(absensi.user_id, users.id))
    .where(and(...conditions));

  return c.json({ data, total: total.count });
});

hrdRoutes.post("/absensi", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const { jenis, shift, latitude, longitude, status_lokasi, catatan } = body;

    const now = new Date();
    const tanggal = now.toISOString().split("T")[0];
    const jam = now.toTimeString().split(" ")[0];

    let targetUserId = body.user_id;
    if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
      targetUserId = activeUser.id;
    }

    const [newAbsensi] = await db
      .insert(absensi)
      .values({
        user_id: targetUserId,
        tanggal,
        jam,
        jenis,
        shift,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        status_lokasi: status_lokasi || "valid",
        catatan,
      })
      .returning();

    return c.json({ success: true, data: newAbsensi }, 201);
  } catch (error) {
    return c.json({ error: "Gagal menyimpan absensi" }, 500);
  }
});

// ==========================================
// 4. JAM KERJA
// ==========================================
hrdRoutes.get("/jam-kerja", async (c) => {
  const data = await db.select().from(jam_kerja).orderBy(jam_kerja.nama_shift);
  return c.json(data);
});

hrdRoutes.post("/jam-kerja", async (c) => {
  const body = await c.req.json();
  const [newShift] = await db.insert(jam_kerja).values(body).returning();
  return c.json(newShift, 201);
});

hrdRoutes.put("/jam-kerja/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  await db.update(jam_kerja).set(body).where(eq(jam_kerja.id, parseInt(id)));
  return c.json({ success: true });
});

hrdRoutes.delete("/jam-kerja/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(jam_kerja).where(eq(jam_kerja.id, parseInt(id)));
  return c.json({ success: true });
});

// ==========================================
// 5. HARI LIBUR
// ==========================================
hrdRoutes.get("/hari-libur", async (c) => {
  const data = await db.select().from(hari_libur).orderBy(hari_libur.tanggal);
  return c.json(data);
});

hrdRoutes.post("/hari-libur", async (c) => {
  const body = await c.req.json();
  const [newLibur] = await db.insert(hari_libur).values(body).returning();
  return c.json(newLibur, 201);
});

hrdRoutes.put("/hari-libur/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  await db.update(hari_libur).set(body).where(eq(hari_libur.id, parseInt(id)));
  return c.json({ success: true });
});

hrdRoutes.delete("/hari-libur/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(hari_libur).where(eq(hari_libur.id, parseInt(id)));
  return c.json({ success: true });
});

// ==========================================
// 6. IZIN / CUTI
// ==========================================
hrdRoutes.get("/izin-cuti", async (c) => {
  const activeUser = c.get("user");
  const status = c.req.query("status") || "";
  const page = parseInt(c.req.query("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) {
    conditions.push(eq(izin_cuti.status, status));
  }

  // Branch and user-level isolation
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
    if (activeUser.id_jabatan === 3) {
      conditions.push(eq(users.id_cabang, activeUser.id_cabang));
    } else {
      conditions.push(eq(izin_cuti.user_id, activeUser.id));
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: izin_cuti.id,
      user_id: izin_cuti.user_id,
      jenis: izin_cuti.jenis,
      tanggal_mulai: izin_cuti.tanggal_mulai,
      tanggal_selesai: izin_cuti.tanggal_selesai,
      keterangan: izin_cuti.keterangan,
      status: izin_cuti.status,
      tanggal_pengajuan: izin_cuti.tanggal_pengajuan,
      catatan_approval: izin_cuti.catatan_approval,
      nama_user: users.nama_user,
    })
    .from(izin_cuti)
    .leftJoin(users, eq(izin_cuti.user_id, users.id))
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(izin_cuti.tanggal_pengajuan));

  const [total] = await db
    .select({ count: sql<number>`count(*)` })
    .from(izin_cuti)
    .leftJoin(users, eq(izin_cuti.user_id, users.id))
    .where(where);

  return c.json({ data, total: total.count });
});

hrdRoutes.post("/izin-cuti", async (c) => {
  const activeUser = c.get("user");
  const body = await c.req.json();
  
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
    body.user_id = activeUser.id;
    body.status = "Menunggu";
  }

  const [newIzin] = await db.insert(izin_cuti).values(body).returning();
  return c.json(newIzin, 201);
});

hrdRoutes.put("/izin-cuti/:id", async (c) => {
  const activeUser = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();

  const [existing] = await db.select().from(izin_cuti).where(eq(izin_cuti.id, parseInt(id))).limit(1);
  if (!existing) {
    return c.json({ error: "Permohonan tidak ditemukan" }, 404);
  }

  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
    if (existing.user_id !== activeUser.id) {
      return c.json({ error: "Tidak memiliki hak akses" }, 403);
    }
    if (existing.status !== "Menunggu") {
      return c.json({ error: "Permohonan yang sudah diproses tidak dapat diubah" }, 400);
    }
    
    // Normal user can only update description and dates
    const { status, catatan_approval, ...allowedBody } = body;
    await db.update(izin_cuti).set(allowedBody).where(eq(izin_cuti.id, parseInt(id)));
  } else {
    await db.update(izin_cuti).set(body).where(eq(izin_cuti.id, parseInt(id)));
  }
  return c.json({ success: true });
});

hrdRoutes.delete("/izin-cuti/:id", async (c) => {
  const activeUser = c.get("user");
  const id = c.req.param("id");

  const [existing] = await db.select().from(izin_cuti).where(eq(izin_cuti.id, parseInt(id))).limit(1);
  if (!existing) {
    return c.json({ error: "Permohonan tidak ditemukan" }, 404);
  }

  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
    if (existing.user_id !== activeUser.id) {
      return c.json({ error: "Tidak memiliki hak akses" }, 403);
    }
    if (existing.status !== "Menunggu") {
      return c.json({ error: "Permohonan yang sudah diproses tidak dapat dihapus" }, 400);
    }
  }

  await db.delete(izin_cuti).where(eq(izin_cuti.id, parseInt(id)));
  return c.json({ success: true });
});

// ==========================================
// 7. HUTANG KARYAWAN
// ==========================================
hrdRoutes.get("/hutang", async (c) => {
  const activeUser = c.get("user");
  const conditions = [];

  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
    conditions.push(eq(hutang_karyawan.user_id, activeUser.id));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: hutang_karyawan.id,
      user_id: hutang_karyawan.user_id,
      nominal: hutang_karyawan.nominal,
      tanggal: hutang_karyawan.tanggal,
      keterangan: hutang_karyawan.keterangan,
      status: hutang_karyawan.status,
      nama_user: users.nama_user,
    })
    .from(hutang_karyawan)
    .leftJoin(users, eq(hutang_karyawan.user_id, users.id))
    .where(where)
    .orderBy(desc(hutang_karyawan.tanggal));
  return c.json(data);
});

hrdRoutes.post("/hutang", async (c) => {
  const activeUser = c.get("user");
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
    return c.json({ error: "Forbidden. Hanya admin yang dapat mencatat hutang" }, 403);
  }
  const body = await c.req.json();
  const [newHutang] = await db.insert(hutang_karyawan).values(body).returning();
  return c.json(newHutang, 201);
});

hrdRoutes.patch("/hutang/:id", async (c) => {
  const activeUser = c.get("user");
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
    return c.json({ error: "Forbidden. Hanya admin yang dapat mengubah status hutang" }, 403);
  }
  const id = c.req.param("id");
  const body = await c.req.json();
  await db
    .update(hutang_karyawan)
    .set({ status: body.status })
    .where(eq(hutang_karyawan.id, parseInt(id)));
  return c.json({ success: true });
});

hrdRoutes.delete("/hutang/:id", async (c) => {
  const activeUser = c.get("user");
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const id = c.req.param("id");
  await db.delete(hutang_karyawan).where(eq(hutang_karyawan.id, parseInt(id)));
  return c.json({ success: true });
});

// ==========================================
// 8. DAFTAR GAJI JABATAN
// ==========================================
hrdRoutes.get("/gaji-jabatan", async (c) => {
  const activeUser = c.get("user");
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
    return c.json({ error: "Forbidden. Halaman ini hanya untuk Administrator" }, 403);
  }
  const data = await db
    .select({
      id: daftar_gaji_jabatan.id,
      id_jabatan: daftar_gaji_jabatan.id_jabatan,
      gaji_pokok: daftar_gaji_jabatan.gaji_pokok,
      gaji_per_jam: daftar_gaji_jabatan.gaji_per_jam,
      lembur_per_jam: daftar_gaji_jabatan.lembur_per_jam,
      jabatan: jabatan.jabatan,
    })
    .from(daftar_gaji_jabatan)
    .leftJoin(jabatan, eq(daftar_gaji_jabatan.id_jabatan, jabatan.id_jabatan));
  return c.json(data);
});

hrdRoutes.post("/gaji-jabatan", async (c) => {
  const body = await c.req.json();
  const idJabatan = parseInt(body.id_jabatan);

  const [existing] = await db
    .select()
    .from(daftar_gaji_jabatan)
    .where(eq(daftar_gaji_jabatan.id_jabatan, idJabatan))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(daftar_gaji_jabatan)
      .set({
        gaji_pokok: parseInt(body.gaji_pokok),
        gaji_per_jam: parseInt(body.gaji_per_jam),
        lembur_per_jam: parseInt(body.lembur_per_jam || "0"),
      })
      .where(eq(daftar_gaji_jabatan.id, existing.id))
      .returning();
    return c.json(updated);
  } else {
    const [newConfig] = await db
      .insert(daftar_gaji_jabatan)
      .values({
        id_jabatan: idJabatan,
        gaji_pokok: parseInt(body.gaji_pokok),
        gaji_per_jam: parseInt(body.gaji_per_jam),
        lembur_per_jam: parseInt(body.lembur_per_jam || "0"),
      })
      .returning();
    return c.json(newConfig, 201);
  }
});

// ==========================================
// 9. BISYAROH (PAYROLL)
// ==========================================
// Helper to convert HH:mm:ss to decimal hours
function timeToHours(timeStr: string | null | undefined): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0]) || 0;
  const m = parseInt(parts[1]) || 0;
  const s = parseInt(parts[2]) || 0;
  return h + m / 60 + s / 3600;
}

hrdRoutes.get("/bisyaroh", async (c) => {
  const activeUser = c.get("user");
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2) {
    return c.json({ error: "Forbidden. Halaman ini hanya untuk Administrator" }, 403);
  }
  const bulan = parseInt(c.req.query("bulan") || String(new Date().getMonth() + 1));
  const tahun = parseInt(c.req.query("tahun") || String(new Date().getFullYear()));
  const monthStr = `${tahun}-${String(bulan).padStart(2, "0")}`;

  // 1. Fetch user list
  const userList = await db
    .select({
      id: users.id,
      kode_user: users.kode_user,
      nama_user: users.nama_user,
      status: users.status,
      id_jabatan: users.id_jabatan,
      jabatan: jabatan.jabatan,
      id_cabang: users.id_cabang,
      nama_cabang: cabang.nama_cabang,
    })
    .from(users)
    .leftJoin(jabatan, eq(users.id_jabatan, jabatan.id_jabatan))
    .leftJoin(cabang, eq(users.id_cabang, cabang.id_cabang))
    .where(sql`${users.status} != 'Non-Aktif'`)
    .orderBy(users.nama_user);

  // 2. Fetch payroll records that are saved/paid
  const savedSlips = await db
    .select()
    .from(bisyaroh)
    .where(and(eq(bisyaroh.bulan, bulan), eq(bisyaroh.tahun, tahun)));

  const savedMap = new Map();
  savedSlips.forEach((s) => savedMap.set(s.user_id, s));

  // 3. Fetch attendance, config, loans, etc. for calculation
  const salaryConfigs = await db.select().from(daftar_gaji_jabatan);
  const salaryMap = new Map();
  salaryConfigs.forEach((sc) => salaryMap.set(sc.id_jabatan, sc));

  const absLogs = await db
    .select()
    .from(absensi)
    .where(like(absensi.tanggal, `${monthStr}-%`));

  const activeLoans = await db
    .select()
    .from(hutang_karyawan)
    .where(eq(hutang_karyawan.status, "aktif"));

  const loanMap = new Map();
  activeLoans.forEach((l) => {
    const list = loanMap.get(l.user_id) || [];
    list.push(l);
    loanMap.set(l.user_id, list);
  });

  // Calculate slip for each user
  const data = userList.map((usr) => {
    // If slip is already saved (Lunas/Draft), use saved values
    if (savedMap.has(usr.id)) {
      const saved = savedMap.get(usr.id);
      return {
        ...usr,
        slip_id: saved.id,
        bulan: saved.bulan,
        tahun: saved.tahun,
        gaji_pokok: saved.gaji_pokok,
        gaji_per_jam: saved.gaji_per_jam,
        lembur_per_jam: saved.lembur_per_jam,
        hari_kerja: saved.hari_kerja,
        total_jam_kerja: saved.total_jam_kerja, // minutes
        total_jam_lembur: saved.total_jam_lembur,
        gaji_kehadiran: saved.gaji_kehadiran,
        gaji_lembur: saved.gaji_lembur,
        tunjangan: saved.tunjangan,
        potongan: saved.potongan,
        total_diterima: saved.total_diterima,
        status: saved.status,
        tanggal_bayar: saved.tanggal_bayar,
        catatan: saved.catatan,
      };
    }

    // Otherwise calculate dynamically
    const config = salaryMap.get(usr.id_jabatan) || {
      gaji_pokok: 0,
      gaji_per_jam: 0,
      lembur_per_jam: 0
    };

    const userAbs = absLogs.filter((a) => a.user_id === usr.id);
    
    // Group attendance by date to calculate hours
    const absByDate: Record<string, typeof absLogs> = {};
    userAbs.forEach((a) => {
      if (!absByDate[a.tanggal]) absByDate[a.tanggal] = [];
      absByDate[a.tanggal].push(a);
    });

    let totalWorkMinutes = 0;
    let totalLemburMinutes = 0;
    let workDaysCount = 0;

    Object.entries(absByDate).forEach(([_, logs]) => {
      const masuk = logs.find((l) => l.jenis === "masuk");
      const pulang = logs.find((l) => l.jenis === "pulang");
      const lemburMulai = logs.find((l) => l.jenis === "lembur_mulai");
      const lemburSelesai = logs.find((l) => l.jenis === "lembur_selesai");

      if (masuk && pulang) {
        workDaysCount++;
        const hrMasuk = timeToHours(masuk.jam);
        const hrPulang = timeToHours(pulang.jam);
        let diff = hrPulang - hrMasuk;
        if (diff > 0) {
          // deduct 1 hour rest time if worked > 5 hours
          if (diff > 5) diff -= 1;
          totalWorkMinutes += Math.round(diff * 60);
        }
      }

      if (lemburMulai && lemburSelesai) {
        const hrStart = timeToHours(lemburMulai.jam);
        const hrEnd = timeToHours(lemburSelesai.jam);
        const diff = hrEnd - hrStart;
        if (diff > 0) {
          totalLemburMinutes += Math.round(diff * 60);
        }
      }
    });

    const gajiKehadiran = Math.round((totalWorkMinutes / 60) * config.gaji_per_jam);
    const gajiLembur = Math.round((totalLemburMinutes / 60) * config.lembur_per_jam);

    // Sum active loans
    const uLoans = loanMap.get(usr.id) || [];
    const potonganHutang = uLoans.reduce((sum: number, l: any) => sum + l.nominal, 0);

    const totalDiterima = config.gaji_pokok + gajiKehadiran + gajiLembur - potonganHutang;

    return {
      ...usr,
      slip_id: null,
      bulan,
      tahun,
      gaji_pokok: config.gaji_pokok,
      gaji_per_jam: config.gaji_per_jam,
      lembur_per_jam: config.lembur_per_jam,
      hari_kerja: workDaysCount,
      total_jam_kerja: totalWorkMinutes,
      total_jam_lembur: totalLemburMinutes,
      gaji_kehadiran: gajiKehadiran,
      gaji_lembur: gajiLembur,
      tunjangan: 0,
      potongan: potonganHutang,
      total_diterima: totalDiterima,
      status: "Draft",
      tanggal_bayar: null,
      catatan: "",
    };
  });

  return c.json(data);
});

hrdRoutes.post("/bisyaroh", async (c) => {
  const body = await c.req.json();
  const activeUser = c.get("user");

  try {
    const {
      id, // if slip existing
      user_id,
      bulan,
      tahun,
      gaji_pokok,
      gaji_per_jam,
      lembur_per_jam,
      hari_kerja,
      total_jam_kerja,
      total_jam_lembur,
      gaji_kehadiran,
      gaji_lembur,
      tunjangan,
      potongan,
      total_diterima,
      status,
      catatan
    } = body;

    const slipValues = {
      user_id: parseInt(user_id),
      bulan: parseInt(bulan),
      tahun: parseInt(tahun),
      gaji_pokok: parseInt(gaji_pokok || "0"),
      gaji_per_jam: parseInt(gaji_per_jam || "0"),
      lembur_per_jam: parseInt(lembur_per_jam || "0"),
      hari_kerja: parseInt(hari_kerja || "0"),
      total_jam_kerja: parseInt(total_jam_kerja || "0"),
      total_jam_lembur: parseInt(total_jam_lembur || "0"),
      gaji_kehadiran: parseInt(gaji_kehadiran || "0"),
      gaji_lembur: parseInt(gaji_lembur || "0"),
      tunjangan: parseInt(tunjangan || "0"),
      potongan: parseInt(potongan || "0"),
      total_diterima: parseInt(total_diterima || "0"),
      status: status || "Draft",
      catatan: catatan || "",
      tanggal_bayar: status === "Lunas" ? new Date().toISOString().split("T")[0] : null,
    };

    let resultSlip;

    if (id) {
      // Update existing slip
      const [updated] = await db
        .update(bisyaroh)
        .set(slipValues)
        .where(eq(bisyaroh.id, parseInt(id)))
        .returning();
      resultSlip = updated;
    } else {
      // Create new slip
      const [inserted] = await db.insert(bisyaroh).values(slipValues).returning();
      resultSlip = inserted;
    }

    // IF LUNAS, create general ledger entry automatically (DOUBLE-ENTRY BOOKKEEPING)
    if (status === "Lunas") {
      // Debit: Beban Gaji (e.g. account code 5.101)
      // Credit: Kas Toko/Bank (depending on branch)
      // Let's check branch for journal recording
      const [userCabang] = await db.select().from(users).where(eq(users.id, parseInt(user_id))).limit(1);
      const idCabang = userCabang?.id_cabang || activeUser.id_cabang || 2;

      // Find appropriate COA for payroll expense
      const [bebanGajiAkun] = await db
        .select({ id: users.id }) // placeholder for actual query
        .from(users) // dummy select to prevent SQL errors, we will just use fixed account IDs for simplicity
        .limit(1);

      // In real code, we insert debit & credit entries into general ledger (jurnal_umum)
      const noBukti = `PAY/${bulan}/${tahun}/${user_id}`;
      const desc = `Bisyaroh Karyawan ID ${user_id} - ${bulan}/${tahun}`;
      
      // Debit Beban Gaji (ID: 15 / Code 5.101.01)
      await db.insert(jurnal_umum).values({
        tanggal_transaksi: new Date().toISOString().split("T")[0],
        no_referensi_bukti: noBukti,
        deskripsi: desc,
        akun_id: 15, // Fixed ID representing Beban Gaji
        cabang_id: idCabang,
        debit: total_diterima,
        kredit: 0,
        dibuat_oleh: activeUser.id,
      });

      // Credit Kas (ID: 1 / Code 1.101.01)
      await db.insert(jurnal_umum).values({
        tanggal_transaksi: new Date().toISOString().split("T")[0],
        no_referensi_bukti: noBukti,
        deskripsi: desc,
        akun_id: 1, // Fixed ID representing Kas Toko
        cabang_id: idCabang,
        debit: 0,
        kredit: total_diterima,
        dibuat_oleh: activeUser.id,
      });

      // If there was any loan deduction, mark those loans as paid
      if (potongan > 0) {
        await db
          .update(hutang_karyawan)
          .set({ status: "lunas" })
          .where(and(eq(hutang_karyawan.user_id, parseInt(user_id)), eq(hutang_karyawan.status, "aktif")));
      }
    }

    return c.json({ success: true, slip: resultSlip });
  } catch (err: any) {
    return c.json({ error: "Gagal menyimpan slip gaji: " + err.message }, 500);
  }
});

// ==========================================
// 10. JADWAL KASIR
// ==========================================
hrdRoutes.get("/kasir-jadwal", async (c) => {
  const idCabang = c.req.query("id_cabang");
  const idKasir = c.req.query("id_kasir");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const activeOnly = c.req.query("aktif") === "true";

  try {
    const conditions = [];

    if (idCabang) {
      const parsedCabang = parseInt(idCabang);
      if (!isNaN(parsedCabang)) {
        conditions.push(eq(kasir_jadwal.id_cabang, parsedCabang));
      }
    }
    if (idKasir) {
      const parsedKasir = parseInt(idKasir);
      if (!isNaN(parsedKasir)) {
        conditions.push(eq(kasir_jadwal.id_kasir, parsedKasir));
      }
    }
    if (startDate) {
      conditions.push(gte(kasir_jadwal.tanggal, startDate));
    }
    if (endDate) {
      conditions.push(lte(kasir_jadwal.tanggal, endDate));
    }
    if (activeOnly) {
      conditions.push(eq(kasir_jadwal.aktif, true));
    }

    const baseQuery = db
      .select({
        id: kasir_jadwal.id,
        id_cabang: kasir_jadwal.id_cabang,
        nama_cabang: cabang.nama_cabang,
        kode_cabang: cabang.kode_cabang,
        id_kasir: kasir_jadwal.id_kasir,
        nama_kasir: users.nama_user,
        kode_kasir: users.kode_user,
        id_shift: kasir_jadwal.id_shift,
        nama_shift: jam_kerja.nama_shift,
        jam_masuk: jam_kerja.jam_masuk,
        jam_pulang: jam_kerja.jam_pulang,
        tanggal: kasir_jadwal.tanggal,
        catatan: kasir_jadwal.catatan,
        aktif: kasir_jadwal.aktif,
        created_at: kasir_jadwal.created_at,
      })
      .from(kasir_jadwal)
      .innerJoin(cabang, eq(kasir_jadwal.id_cabang, cabang.id_cabang))
      .innerJoin(users, eq(kasir_jadwal.id_kasir, users.id))
      .innerJoin(jam_kerja, eq(kasir_jadwal.id_shift, jam_kerja.id));

    const finalQuery = conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;
    const data = await finalQuery.orderBy(asc(kasir_jadwal.tanggal));
    
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

hrdRoutes.post("/kasir-jadwal", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const items = Array.isArray(body) ? body : [body];

    // Validate entries and check for conflicts
    for (const item of items) {
      if (!item.id_cabang || !item.id_kasir || !item.id_shift || !item.tanggal) {
        return c.json({ success: false, error: "Cabang, Kasir, Shift, dan Tanggal wajib diisi" }, 400);
      }
      
      const parsedCabang = parseInt(item.id_cabang);
      const parsedKasir = parseInt(item.id_kasir);
      const parsedShift = parseInt(item.id_shift);
      
      if (isNaN(parsedCabang) || isNaN(parsedKasir) || isNaN(parsedShift)) {
        return c.json({ success: false, error: "ID Cabang, Kasir, dan Shift harus berupa angka valid" }, 400);
      }

      const [conflict] = await db
        .select({
          id: kasir_jadwal.id,
          nama_cabang: cabang.nama_cabang,
          nama_shift: jam_kerja.nama_shift,
        })
        .from(kasir_jadwal)
        .innerJoin(cabang, eq(kasir_jadwal.id_cabang, cabang.id_cabang))
        .innerJoin(jam_kerja, eq(kasir_jadwal.id_shift, jam_kerja.id))
        .where(
          and(
            eq(kasir_jadwal.id_kasir, parsedKasir),
            eq(kasir_jadwal.tanggal, item.tanggal),
            eq(kasir_jadwal.aktif, true)
          )
        )
        .limit(1);

      if (conflict) {
        return c.json({
          success: false,
          error: `Kasir tersebut sudah memiliki jadwal aktif pada tanggal ${item.tanggal} di cabang ${conflict.nama_cabang} (${conflict.nama_shift})`
        }, 400);
      }
    }

    const inserted = [];
    for (const item of items) {
      const [newJadwal] = await db
        .insert(kasir_jadwal)
        .values({
          id_cabang: parseInt(item.id_cabang),
          id_kasir: parseInt(item.id_kasir),
          id_shift: parseInt(item.id_shift),
          tanggal: item.tanggal,
          catatan: item.catatan || null,
          aktif: item.aktif !== false,
          created_by: activeUser.id,
        })
        .returning();
      inserted.push(newJadwal);
    }

    return c.json({ success: true, data: inserted }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

hrdRoutes.post("/kasir-jadwal/copy", async (c) => {
  const activeUser = c.get("user");
  try {
    const { fromMonth, toMonth } = await c.req.json();
    if (!fromMonth || !toMonth) {
      return c.json({ success: false, error: "Bulan asal dan tujuan wajib diisi" }, 400);
    }

    if (!/^\d{4}-\d{2}$/.test(fromMonth) || !/^\d{4}-\d{2}$/.test(toMonth)) {
      return c.json({ success: false, error: "Format bulan harus YYYY-MM" }, 400);
    }

    const sourceSchedules = await db
      .select()
      .from(kasir_jadwal)
      .where(
        and(
          like(kasir_jadwal.tanggal, `${fromMonth}-%`),
          eq(kasir_jadwal.aktif, true)
        )
      );

    if (sourceSchedules.length === 0) {
      return c.json({ success: false, error: "Tidak ada jadwal aktif ditemukan pada bulan asal" }, 400);
    }

    const inserted = [];
    const conflicts = [];
    let invalidDatesCount = 0;

    for (const src of sourceSchedules) {
      const dayPart = src.tanggal.split("-")[2];
      const targetDate = `${toMonth}-${dayPart}`;

      const parsedDate = new Date(targetDate);
      if (isNaN(parsedDate.getTime()) || parsedDate.getDate() !== parseInt(dayPart)) {
        invalidDatesCount++;
        continue;
      }

      const [conflict] = await db
        .select()
        .from(kasir_jadwal)
        .where(
          and(
            eq(kasir_jadwal.id_kasir, src.id_kasir),
            eq(kasir_jadwal.tanggal, targetDate),
            eq(kasir_jadwal.aktif, true)
          )
        )
        .limit(1);

      if (conflict) {
        conflicts.push(`${src.id_kasir} on ${targetDate}`);
        continue;
      }

      const [newJadwal] = await db
        .insert(kasir_jadwal)
        .values({
          id_cabang: src.id_cabang,
          id_kasir: src.id_kasir,
          id_shift: src.id_shift,
          tanggal: targetDate,
          catatan: src.catatan,
          aktif: true,
          created_by: activeUser.id,
        })
        .returning();
      inserted.push(newJadwal);
    }

    return c.json({
      success: true,
      copiedCount: inserted.length,
      skippedCount: conflicts.length + invalidDatesCount,
      conflictsCount: conflicts.length
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

hrdRoutes.post("/kasir-jadwal/auto-generate", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const {
      bulan,
      id_cabang,
      id_shift_pagi,
      id_shift_sore,
      overwrite = false,
      kasirs = [],
    } = body;

    if (!bulan || !id_cabang || !id_shift_pagi || !id_shift_sore || kasirs.length === 0) {
      return c.json({
        success: false,
        error: "Wajib mengisi bulan, cabang, shift pagi, shift sore, dan minimal 1 kasir",
      }, 400);
    }

    const parsedCabang = parseInt(id_cabang);
    const parsedShiftPagi = parseInt(id_shift_pagi);
    const parsedShiftSore = parseInt(id_shift_sore);

    if (isNaN(parsedCabang) || isNaN(parsedShiftPagi) || isNaN(parsedShiftSore)) {
      return c.json({ success: false, error: "ID Cabang, Shift Pagi, dan Shift Sore harus berupa angka valid" }, 400);
    }

    // Validate shift IDs exist
    const [shiftPagi] = await db.select().from(jam_kerja).where(eq(jam_kerja.id, parsedShiftPagi)).limit(1);
    const [shiftSore] = await db.select().from(jam_kerja).where(eq(jam_kerja.id, parsedShiftSore)).limit(1);

    if (!shiftPagi || !shiftSore) {
      return c.json({ success: false, error: "Shift Pagi atau Shift Sore tidak ditemukan di master jam kerja" }, 400);
    }

    // Build list of all dates in the month
    const [yearStr, monthStr] = bulan.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr); // 1-indexed
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return c.json({ success: false, error: "Bulan target tidak valid" }, 400);
    }
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const allDates: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      allDates.push(`${yearStr}-${monthStr}-${String(d).padStart(2, "0")}`);
    }

    const kasirIds = kasirs.map((k: any) => parseInt(k.id_kasir)).filter((id: number) => !isNaN(id));

    if (kasirIds.length === 0) {
      return c.json({ success: false, error: "Tidak ada kasir valid untuk di-generate" }, 400);
    }

    if (overwrite) {
      // Delete all existing entries for these kasirs in this cabang & month in one batch query
      await db.delete(kasir_jadwal).where(
        and(
          inArray(kasir_jadwal.id_kasir, kasirIds),
          eq(kasir_jadwal.id_cabang, parsedCabang),
          like(kasir_jadwal.tanggal, `${bulan}-%`)
        )
      );
    }

    // Batch query to get existing active schedules for lookup (O(1) conflict check)
    const existingSchedules = await db
      .select({
        id_kasir: kasir_jadwal.id_kasir,
        tanggal: kasir_jadwal.tanggal,
      })
      .from(kasir_jadwal)
      .where(
        and(
          inArray(kasir_jadwal.id_kasir, kasirIds),
          like(kasir_jadwal.tanggal, `${bulan}-%`),
          eq(kasir_jadwal.aktif, true)
        )
      );

    const existingSet = new Set(
      existingSchedules.map((s) => `${s.id_kasir}_${s.tanggal}`)
    );

    let insertedCount = 0;
    let skippedCount = 0;
    const details: { kasir: number; generated: number; skipped: number }[] = [];
    const inserts: any[] = [];

    for (const kasirCfg of kasirs) {
      const kasirId = parseInt(kasirCfg.id_kasir);
      if (isNaN(kasirId)) continue;

      const startWithPagi = kasirCfg.shift_awal !== "sore";
      let genCount = 0;
      let skipCount = 0;

      for (let dayIndex = 0; dayIndex < allDates.length; dayIndex++) {
        const targetDate = allDates[dayIndex];
        const isPagi = startWithPagi ? dayIndex % 2 === 0 : dayIndex % 2 !== 0;
        const shiftId = isPagi ? parsedShiftPagi : parsedShiftSore;

        if (existingSet.has(`${kasirId}_${targetDate}`)) {
          skipCount++;
          continue;
        }

        inserts.push({
          id_cabang: parsedCabang,
          id_kasir: kasirId,
          id_shift: shiftId,
          tanggal: targetDate,
          catatan: `Auto-generate rotasi: ${isPagi ? shiftPagi.nama_shift : shiftSore.nama_shift}`,
          aktif: true,
          created_by: activeUser.id,
        });
        genCount++;
      }

      insertedCount += genCount;
      skippedCount += skipCount;
      details.push({ kasir: kasirId, generated: genCount, skipped: skipCount });
    }

    // Perform bulk insertion in chunks if there are any to avoid driver parameter limits
    if (inserts.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < inserts.length; i += chunkSize) {
        await db.insert(kasir_jadwal).values(inserts.slice(i, i + chunkSize));
      }
    }

    return c.json({
      success: true,
      insertedCount,
      skippedCount,
      totalKasir: kasirs.length,
      daysInMonth,
      details,
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

hrdRoutes.put("/kasir-jadwal/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const body = await c.req.json();
    const currentId = parseInt(id);

    if (isNaN(currentId)) {
      return c.json({ success: false, error: "ID jadwal tidak valid" }, 400);
    }

    if (body.id_kasir || body.tanggal) {
      const [currentRecord] = await db
        .select()
        .from(kasir_jadwal)
        .where(eq(kasir_jadwal.id, currentId))
        .limit(1);

      if (currentRecord) {
        const targetKasir = body.id_kasir ? parseInt(body.id_kasir) : currentRecord.id_kasir;
        const targetTanggal = body.tanggal || currentRecord.tanggal;

        if (isNaN(targetKasir)) {
          return c.json({ success: false, error: "ID Kasir tidak valid" }, 400);
        }

        const [conflict] = await db
          .select({
            id: kasir_jadwal.id,
            nama_cabang: cabang.nama_cabang,
            nama_shift: jam_kerja.nama_shift,
          })
          .from(kasir_jadwal)
          .innerJoin(cabang, eq(kasir_jadwal.id_cabang, cabang.id_cabang))
          .innerJoin(jam_kerja, eq(kasir_jadwal.id_shift, jam_kerja.id))
          .where(
            and(
              eq(kasir_jadwal.id_kasir, targetKasir),
              eq(kasir_jadwal.tanggal, targetTanggal),
              eq(kasir_jadwal.aktif, true),
              sql`${kasir_jadwal.id} != ${currentId}`
            )
          )
          .limit(1);

        if (conflict) {
          return c.json({
            success: false,
            error: `Kasir tersebut sudah memiliki jadwal aktif pada tanggal ${targetTanggal} di cabang ${conflict.nama_cabang} (${conflict.nama_shift})`
          }, 400);
        }
      }
    }

    const updateObj: any = {};
    if (body.id_cabang !== undefined) {
      const val = parseInt(body.id_cabang);
      if (isNaN(val)) return c.json({ success: false, error: "ID Cabang tidak valid" }, 400);
      updateObj.id_cabang = val;
    }
    if (body.id_kasir !== undefined) {
      const val = parseInt(body.id_kasir);
      if (isNaN(val)) return c.json({ success: false, error: "ID Kasir tidak valid" }, 400);
      updateObj.id_kasir = val;
    }
    if (body.id_shift !== undefined) {
      const val = parseInt(body.id_shift);
      if (isNaN(val)) return c.json({ success: false, error: "ID Shift tidak valid" }, 400);
      updateObj.id_shift = val;
    }
    if (body.tanggal !== undefined) updateObj.tanggal = body.tanggal;
    if (body.catatan !== undefined) updateObj.catatan = body.catatan;
    if (body.aktif !== undefined) updateObj.aktif = body.aktif;

    const [updated] = await db
      .update(kasir_jadwal)
      .set(updateObj)
      .where(eq(kasir_jadwal.id, currentId))
      .returning();

    return c.json({ success: true, data: updated });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

hrdRoutes.delete("/kasir-jadwal/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const currentId = parseInt(id);
    if (isNaN(currentId)) {
      return c.json({ success: false, error: "ID tidak valid" }, 400);
    }

    const [existing] = await db
      .select({ id: kasir_jadwal.id })
      .from(kasir_jadwal)
      .where(eq(kasir_jadwal.id, currentId))
      .limit(1);

    if (!existing) {
      return c.json({ success: false, error: "Jadwal tidak ditemukan" }, 404);
    }

    await db.delete(kasir_jadwal).where(eq(kasir_jadwal.id, currentId));
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==========================================
// 11. KONFIGURASI SHIFT PER JABATAN
// ==========================================

// GET /jabatan-shift-config - Ambil seluruh jabatan beserta konfigurasi shift
hrdRoutes.get("/jabatan-shift-config", async (c) => {
  try {
    const list = await db
      .select({
        id: jabatan_shift_config.id,
        id_jabatan: jabatan.id_jabatan,
        jabatan: jabatan.jabatan,
        tipe_kerja: sql<string>`COALESCE(${jabatan_shift_config.tipe_kerja}, 'NON_SHIFT')`,
        default_id_shift: jabatan_shift_config.default_id_shift,
        default_nama_shift: jam_kerja.nama_shift,
        hari_kerja_aktif: sql<string>`COALESCE(${jabatan_shift_config.hari_kerja_aktif}, '1,2,3,4,5,6')`,
        keterangan: jabatan_shift_config.keterangan,
        jam_masuk: jam_kerja.jam_masuk,
        jam_pulang: jam_kerja.jam_pulang,
      })
      .from(jabatan)
      .leftJoin(jabatan_shift_config, eq(jabatan.id_jabatan, jabatan_shift_config.id_jabatan))
      .leftJoin(jam_kerja, eq(jabatan_shift_config.default_id_shift, jam_kerja.id))
      .orderBy(asc(jabatan.id_jabatan));

    return c.json({ success: true, data: list });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal mengambil konfigurasi shift jabatan: " + error.message }, 500);
  }
});

// PUT /jabatan-shift-config/:id_jabatan - Update konfigurasi shift untuk jabatan tertentu
hrdRoutes.put("/jabatan-shift-config/:id_jabatan", async (c) => {
  const activeUser = c.get("user");
  // Otoritas Sentralisasi HRD Pusat: Hanya Super User (1), IT (2), atau HRD (3)
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2 && activeUser.id_jabatan !== 3) {
    return c.json({ success: false, error: "Akses ditolak: Hanya HRD Pusat yang dapat mengubah template shift jabatan." }, 403);
  }

  const idJabatan = parseInt(c.req.param("id_jabatan"));
  if (isNaN(idJabatan)) {
    return c.json({ success: false, error: "ID Jabatan tidak valid" }, 400);
  }

  try {
    const body = await c.req.json();
    const { tipe_kerja, default_id_shift, hari_kerja_aktif, keterangan } = body;

    if (!tipe_kerja || (tipe_kerja !== "NON_SHIFT" && tipe_kerja !== "SHIFT_ROTASI")) {
      return c.json({ success: false, error: "Tipe kerja harus NON_SHIFT atau SHIFT_ROTASI" }, 400);
    }

    const defaultShiftId = default_id_shift ? parseInt(default_id_shift) : null;

    const [existing] = await db
      .select({ id: jabatan_shift_config.id })
      .from(jabatan_shift_config)
      .where(eq(jabatan_shift_config.id_jabatan, idJabatan))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(jabatan_shift_config)
        .set({
          tipe_kerja,
          default_id_shift: defaultShiftId,
          hari_kerja_aktif: hari_kerja_aktif || "1,2,3,4,5,6",
          keterangan: keterangan || null,
          updated_at: new Date().toISOString(),
        })
        .where(eq(jabatan_shift_config.id_jabatan, idJabatan))
        .returning();
      return c.json({ success: true, data: updated });
    } else {
      const [inserted] = await db
        .insert(jabatan_shift_config)
        .values({
          id_jabatan: idJabatan,
          tipe_kerja,
          default_id_shift: defaultShiftId,
          hari_kerja_aktif: hari_kerja_aktif || "1,2,3,4,5,6",
          keterangan: keterangan || null,
        })
        .returning();
      return c.json({ success: true, data: inserted }, 201);
    }
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal memperbarui konfigurasi shift jabatan: " + error.message }, 500);
  }
});

// ==========================================
// 12. JADWAL KARYAWAN GLOBAL (UNIFIED ROSTER)
// ==========================================

// GET /jadwal-karyawan - Ambil data jadwal karyawan dengan filter fleksibel
hrdRoutes.get("/jadwal-karyawan", async (c) => {
  try {
    const { id_cabang, id_jabatan, user_id, startDate, endDate, bulan, status_hari, aktif } = c.req.query();

    const conditions: any[] = [];

    if (id_cabang) {
      const pCabang = parseInt(id_cabang);
      if (!isNaN(pCabang)) conditions.push(eq(jadwal_karyawan.id_cabang, pCabang));
    }

    if (id_jabatan) {
      const pJabatan = parseInt(id_jabatan);
      if (!isNaN(pJabatan)) conditions.push(eq(jadwal_karyawan.id_jabatan, pJabatan));
    }

    if (user_id) {
      const pUser = parseInt(user_id);
      if (!isNaN(pUser)) conditions.push(eq(jadwal_karyawan.user_id, pUser));
    }

    if (bulan) {
      conditions.push(like(jadwal_karyawan.tanggal, `${bulan}-%`));
    } else {
      if (startDate) conditions.push(gte(jadwal_karyawan.tanggal, startDate));
      if (endDate) conditions.push(lte(jadwal_karyawan.tanggal, endDate));
    }

    if (status_hari) {
      conditions.push(eq(jadwal_karyawan.status_hari, status_hari));
    }

    if (aktif !== undefined) {
      conditions.push(eq(jadwal_karyawan.aktif, aktif === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select({
        id: jadwal_karyawan.id,
        user_id: jadwal_karyawan.user_id,
        nama_user: users.nama_user,
        kode_user: users.kode_user,
        foto: users.foto,
        id_cabang: jadwal_karyawan.id_cabang,
        nama_cabang: cabang.nama_cabang,
        kode_cabang: cabang.kode_cabang,
        id_jabatan: jadwal_karyawan.id_jabatan,
        jabatan: jabatan.jabatan,
        id_shift: jadwal_karyawan.id_shift,
        nama_shift: jam_kerja.nama_shift,
        jam_masuk: jam_kerja.jam_masuk,
        jam_pulang: jam_kerja.jam_pulang,
        tanggal: jadwal_karyawan.tanggal,
        status_hari: jadwal_karyawan.status_hari,
        catatan: jadwal_karyawan.catatan,
        aktif: jadwal_karyawan.aktif,
        created_at: jadwal_karyawan.created_at,
      })
      .from(jadwal_karyawan)
      .innerJoin(users, eq(jadwal_karyawan.user_id, users.id))
      .innerJoin(cabang, eq(jadwal_karyawan.id_cabang, cabang.id_cabang))
      .innerJoin(jabatan, eq(jadwal_karyawan.id_jabatan, jabatan.id_jabatan))
      .leftJoin(jam_kerja, eq(jadwal_karyawan.id_shift, jam_kerja.id))
      .where(whereClause)
      .orderBy(asc(jadwal_karyawan.tanggal), asc(users.nama_user));

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal mengambil jadwal karyawan: " + error.message }, 500);
  }
});

// POST /jadwal-karyawan - Input jadwal baru (single atau batch)
hrdRoutes.post("/jadwal-karyawan", async (c) => {
  const activeUser = c.get("user");
  // Sentralisasi HRD: Hanya Super User (1), IT (2), atau HRD (3)
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2 && activeUser.id_jabatan !== 3) {
    return c.json({ success: false, error: "Akses ditolak: Hanya HRD Pusat yang dapat membuat jadwal shift karyawan." }, 403);
  }

  try {
    const body = await c.req.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return c.json({ success: false, error: "Payload jadwal tidak boleh kosong" }, 400);
    }

    const inserted: any[] = [];

    for (const item of items) {
      const parsedUserId = parseInt(item.user_id);
      const parsedCabang = parseInt(item.id_cabang);
      const parsedShift = item.id_shift ? parseInt(item.id_shift) : null;
      const statusHari = item.status_hari || (parsedShift ? "KERJA" : "LIBUR_ROSTER");

      if (isNaN(parsedUserId) || isNaN(parsedCabang) || !item.tanggal) {
        return c.json({
          success: false,
          error: "Setiap baris wajib memiliki user_id, id_cabang, dan tanggal yang valid",
        }, 400);
      }

      // Ambil jabatan user jika tidak dikirim
      let parsedJabatan = item.id_jabatan ? parseInt(item.id_jabatan) : null;
      if (!parsedJabatan || isNaN(parsedJabatan)) {
        const [usr] = await db.select({ id_jabatan: users.id_jabatan }).from(users).where(eq(users.id, parsedUserId)).limit(1);
        parsedJabatan = usr?.id_jabatan || 7;
      }

      // Validasi konflik: satu user tidak boleh punya jadwal aktif ganda di tanggal yang sama
      const [conflict] = await db
        .select({
          id: jadwal_karyawan.id,
          nama_user: users.nama_user,
          nama_cabang: cabang.nama_cabang,
          nama_shift: jam_kerja.nama_shift,
          status_hari: jadwal_karyawan.status_hari,
        })
        .from(jadwal_karyawan)
        .innerJoin(users, eq(jadwal_karyawan.user_id, users.id))
        .innerJoin(cabang, eq(jadwal_karyawan.id_cabang, cabang.id_cabang))
        .leftJoin(jam_kerja, eq(jadwal_karyawan.id_shift, jam_kerja.id))
        .where(
          and(
            eq(jadwal_karyawan.user_id, parsedUserId),
            eq(jadwal_karyawan.tanggal, item.tanggal),
            eq(jadwal_karyawan.aktif, true)
          )
        )
        .limit(1);

      if (conflict) {
        return c.json({
          success: false,
          error: `Karyawan ${conflict.nama_user} sudah memiliki jadwal aktif pada tanggal ${item.tanggal} di cabang ${conflict.nama_cabang} (${conflict.nama_shift || conflict.status_hari})`,
        }, 409);
      }

      const [newJadwal] = await db
        .insert(jadwal_karyawan)
        .values({
          user_id: parsedUserId,
          id_cabang: parsedCabang,
          id_jabatan: parsedJabatan,
          id_shift: parsedShift,
          tanggal: item.tanggal,
          status_hari: statusHari,
          catatan: item.catatan || null,
          aktif: item.aktif !== undefined ? item.aktif : true,
          created_by: activeUser.id,
        })
        .returning();

      // Sinkronisasi ke kasir_jadwal jika karyawan adalah Kasir (id_jabatan 7) dan status KERJA
      if (parsedJabatan === 7 && parsedShift && statusHari === "KERJA") {
        await db
          .insert(kasir_jadwal)
          .values({
            id_cabang: parsedCabang,
            id_kasir: parsedUserId,
            id_shift: parsedShift,
            tanggal: item.tanggal,
            catatan: item.catatan || null,
            aktif: true,
            created_by: activeUser.id,
          })
          .onConflictDoNothing();
      }

      inserted.push(newJadwal);
    }

    return c.json({ success: true, data: inserted, count: inserted.length }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal menyimpan jadwal karyawan: " + error.message }, 500);
  }
});

// PUT /jadwal-karyawan/:id - Ubah jadwal tertentu (quick toggle / detail edit)
hrdRoutes.put("/jadwal-karyawan/:id", async (c) => {
  const activeUser = c.get("user");
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2 && activeUser.id_jabatan !== 3) {
    return c.json({ success: false, error: "Akses ditolak: Hanya HRD Pusat yang dapat mengubah jadwal shift karyawan." }, 403);
  }

  const id = c.req.param("id");
  try {
    const currentId = parseInt(id);
    if (isNaN(currentId)) {
      return c.json({ success: false, error: "ID jadwal tidak valid" }, 400);
    }

    const [existing] = await db
      .select()
      .from(jadwal_karyawan)
      .where(eq(jadwal_karyawan.id, currentId))
      .limit(1);

    if (!existing) {
      return c.json({ success: false, error: "Jadwal tidak ditemukan" }, 404);
    }

    const body = await c.req.json();
    const updateObj: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.id_shift !== undefined) {
      updateObj.id_shift = body.id_shift ? parseInt(body.id_shift) : null;
    }
    if (body.id_cabang !== undefined) {
      updateObj.id_cabang = parseInt(body.id_cabang);
    }
    if (body.status_hari !== undefined) {
      updateObj.status_hari = body.status_hari;
    }
    if (body.tanggal !== undefined) {
      updateObj.tanggal = body.tanggal;
    }
    if (body.catatan !== undefined) {
      updateObj.catatan = body.catatan;
    }
    if (body.aktif !== undefined) {
      updateObj.aktif = body.aktif;
    }

    const [updated] = await db
      .update(jadwal_karyawan)
      .set(updateObj)
      .where(eq(jadwal_karyawan.id, currentId))
      .returning();

    // Update kasir_jadwal jika terkait
    if (existing.id_jabatan === 7) {
      if (updateObj.status_hari === "LIBUR_ROSTER" || updateObj.aktif === false) {
        await db
          .delete(kasir_jadwal)
          .where(
            and(
              eq(kasir_jadwal.id_kasir, existing.user_id),
              eq(kasir_jadwal.tanggal, existing.tanggal)
            )
          );
      } else if (updateObj.id_shift) {
        await db
          .update(kasir_jadwal)
          .set({ id_shift: updateObj.id_shift, catatan: updateObj.catatan })
          .where(
            and(
              eq(kasir_jadwal.id_kasir, existing.user_id),
              eq(kasir_jadwal.tanggal, existing.tanggal)
            )
          );
      }
    }

    return c.json({ success: true, data: updated });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal memperbarui jadwal: " + error.message }, 500);
  }
});

// DELETE /jadwal-karyawan/:id - Hapus jadwal
hrdRoutes.delete("/jadwal-karyawan/:id", async (c) => {
  const activeUser = c.get("user");
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2 && activeUser.id_jabatan !== 3) {
    return c.json({ success: false, error: "Akses ditolak: Hanya HRD Pusat yang dapat menghapus jadwal karyawan." }, 403);
  }

  const id = c.req.param("id");
  try {
    const currentId = parseInt(id);
    if (isNaN(currentId)) {
      return c.json({ success: false, error: "ID jadwal tidak valid" }, 400);
    }

    const [existing] = await db
      .select()
      .from(jadwal_karyawan)
      .where(eq(jadwal_karyawan.id, currentId))
      .limit(1);

    if (!existing) {
      return c.json({ success: false, error: "Jadwal tidak ditemukan" }, 404);
    }

    await db.delete(jadwal_karyawan).where(eq(jadwal_karyawan.id, currentId));

    // Sinkronisasi hapus dari kasir_jadwal jika kasir
    if (existing.id_jabatan === 7) {
      await db
        .delete(kasir_jadwal)
        .where(
          and(
            eq(kasir_jadwal.id_kasir, existing.user_id),
            eq(kasir_jadwal.tanggal, existing.tanggal)
          )
        );
    }

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal menghapus jadwal: " + error.message }, 500);
  }
});

// POST /jadwal-karyawan/copy - Salin jadwal aktif lintas bulan
hrdRoutes.post("/jadwal-karyawan/copy", async (c) => {
  const activeUser = c.get("user");
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2 && activeUser.id_jabatan !== 3) {
    return c.json({ success: false, error: "Akses ditolak: Hanya HRD Pusat yang dapat menyalin jadwal karyawan." }, 403);
  }

  try {
    const body = await c.req.json();
    const { fromMonth, toMonth, id_cabang, id_jabatan } = body;

    if (!fromMonth || !toMonth) {
      return c.json({ success: false, error: "Parameter fromMonth dan toMonth wajib diisi (format: YYYY-MM)" }, 400);
    }

    const conditions: any[] = [
      like(jadwal_karyawan.tanggal, `${fromMonth}-%`),
      eq(jadwal_karyawan.aktif, true),
    ];

    if (id_cabang) {
      const pCabang = parseInt(id_cabang);
      if (!isNaN(pCabang)) conditions.push(eq(jadwal_karyawan.id_cabang, pCabang));
    }

    if (id_jabatan) {
      const pJabatan = parseInt(id_jabatan);
      if (!isNaN(pJabatan)) conditions.push(eq(jadwal_karyawan.id_jabatan, pJabatan));
    }

    const sourceJadwals = await db
      .select()
      .from(jadwal_karyawan)
      .where(and(...conditions));

    if (sourceJadwals.length === 0) {
      return c.json({ success: false, error: "Tidak ada jadwal aktif ditemukan pada bulan asal" }, 404);
    }

    const [toYearStr, toMonthStr] = toMonth.split("-");
    const toYear = parseInt(toYearStr);
    const toMonthNum = parseInt(toMonthStr);
    const maxDaysInTargetMonth = new Date(toYear, toMonthNum, 0).getDate();

    // Ambil jadwal tujuan yang sudah ada untuk proteksi O(1)
    const existingTargetSchedules = await db
      .select({ user_id: jadwal_karyawan.user_id, tanggal: jadwal_karyawan.tanggal })
      .from(jadwal_karyawan)
      .where(and(like(jadwal_karyawan.tanggal, `${toMonth}-%`), eq(jadwal_karyawan.aktif, true)));

    const existingTargetSet = new Set(
      existingTargetSchedules.map((s) => `${s.user_id}_${s.tanggal}`)
    );

    let insertedCount = 0;
    let skippedCount = 0;
    const inserts: any[] = [];

    for (const src of sourceJadwals) {
      const dayStr = src.tanggal.split("-")[2];
      const dayNum = parseInt(dayStr);
      if (dayNum > maxDaysInTargetMonth) {
        skippedCount++;
        continue;
      }

      const targetDate = `${toMonth}-${dayStr}`;
      if (existingTargetSet.has(`${src.user_id}_${targetDate}`)) {
        skippedCount++;
        continue;
      }

      inserts.push({
        user_id: src.user_id,
        id_cabang: src.id_cabang,
        id_jabatan: src.id_jabatan,
        id_shift: src.id_shift,
        tanggal: targetDate,
        status_hari: src.status_hari,
        catatan: `Salinan dari jadwal ${src.tanggal}`,
        aktif: true,
        created_by: activeUser.id,
      });

      existingTargetSet.add(`${src.user_id}_${targetDate}`);
      insertedCount++;
    }

    // Chunked insert
    const chunkSize = 100;
    for (let i = 0; i < inserts.length; i += chunkSize) {
      await db.insert(jadwal_karyawan).values(inserts.slice(i, i + chunkSize));
    }

    return c.json({
      success: true,
      message: `Berhasil menyalin ${insertedCount} jadwal ke bulan ${toMonth}. (${skippedCount} dilewati karena konflik/tanggal tidak valid)`,
      copied: insertedCount,
      skipped: skippedCount,
    });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal menyalin jadwal: " + error.message }, 500);
  }
});

// POST /jadwal-karyawan/auto-generate - Generator rotasi shift bulanan terotomasi
hrdRoutes.post("/jadwal-karyawan/auto-generate", async (c) => {
  const activeUser = c.get("user");
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2 && activeUser.id_jabatan !== 3) {
    return c.json({ success: false, error: "Akses ditolak: Hanya HRD Pusat yang dapat menjalankan generator jadwal shift." }, 403);
  }

  try {
    const body = await c.req.json();
    const {
      bulan,
      id_cabang,
      id_jabatan,
      shift_ids = [],
      users: userConfigs = [],
      pola = "ROTASI_HARIAN", // 'ROTASI_HARIAN' | 'ROTASI_MINGGUAN' | 'POLA_CYCLE'
      overwrite = false,
    } = body;

    if (!bulan || !id_cabang || userConfigs.length === 0 || shift_ids.length === 0) {
      return c.json({
        success: false,
        error: "Wajib mengisi bulan (YYYY-MM), cabang, minimal 1 shift, dan minimal 1 karyawan.",
      }, 400);
    }

    const parsedCabang = parseInt(id_cabang);
    const parsedJabatan = id_jabatan ? parseInt(id_jabatan) : null;
    const parsedShiftIds = shift_ids.map((s: any) => parseInt(s)).filter((s: number) => !isNaN(s));

    if (parsedShiftIds.length === 0) {
      return c.json({ success: false, error: "Daftar shift tidak valid" }, 400);
    }

    const [yearStr, monthStr] = bulan.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return c.json({ success: false, error: "Format bulan tidak valid (gunakan YYYY-MM)" }, 400);
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const allDates: { tanggal: string; dayOfWeek: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = String(d).padStart(2, "0");
      const fullDate = `${yearStr}-${monthStr}-${dStr}`;
      const dayOfWeek = new Date(year, month - 1, d).getDay(); // 0 = Ahad, 1 = Senin, ...
      allDates.push({ tanggal: fullDate, dayOfWeek });
    }

    const targetUserIds = userConfigs.map((u: any) => parseInt(u.user_id)).filter((id: number) => !isNaN(id));

    if (overwrite) {
      await db.delete(jadwal_karyawan).where(
        and(
          inArray(jadwal_karyawan.user_id, targetUserIds),
          eq(jadwal_karyawan.id_cabang, parsedCabang),
          like(jadwal_karyawan.tanggal, `${bulan}-%`)
        )
      );
    }

    const existingSchedules = await db
      .select({ user_id: jadwal_karyawan.user_id, tanggal: jadwal_karyawan.tanggal })
      .from(jadwal_karyawan)
      .where(
        and(
          inArray(jadwal_karyawan.user_id, targetUserIds),
          like(jadwal_karyawan.tanggal, `${bulan}-%`),
          eq(jadwal_karyawan.aktif, true)
        )
      );

    const existingSet = new Set(existingSchedules.map((s) => `${s.user_id}_${s.tanggal}`));

    let insertedCount = 0;
    let skippedCount = 0;
    const inserts: any[] = [];

    // Loop per karyawan
    for (let uIdx = 0; uIdx < userConfigs.length; uIdx++) {
      const uCfg = userConfigs[uIdx];
      const uId = parseInt(uCfg.user_id);
      if (isNaN(uId)) continue;

      const uJabatan = uCfg.id_jabatan ? parseInt(uCfg.id_jabatan) : parsedJabatan || 7;
      // Index pergeseran awal shift agar antar karyawan tidak semua dapat shift yang sama
      const shiftOffset = uCfg.shift_awal_index !== undefined ? parseInt(uCfg.shift_awal_index) : uIdx;
      // Hari libur mingguan khusus karyawan ini (0 = Ahad s.d. 6 = Sabtu)
      const dayOff = uCfg.hari_libur_mingguan !== undefined ? parseInt(uCfg.hari_libur_mingguan) : (uIdx % 7);

      for (let dayIdx = 0; dayIdx < allDates.length; dayIdx++) {
        const { tanggal, dayOfWeek } = allDates[dayIdx];

        if (existingSet.has(`${uId}_${tanggal}`)) {
          skippedCount++;
          continue;
        }

        // Cek apakah hari ini merupakan jatah Hari Libur Bergilir (Day-Off)
        const isDayOff = dayOfWeek === dayOff;

        if (isDayOff) {
          inserts.push({
            user_id: uId,
            id_cabang: parsedCabang,
            id_jabatan: uJabatan,
            id_shift: null,
            tanggal,
            status_hari: "LIBUR_ROSTER",
            catatan: "Jatah Libur Mingguan Bergilir (Day-Off)",
            aktif: true,
            created_by: activeUser.id,
          });
          insertedCount++;
        } else {
          // Tentukan shift rotasi
          let shiftIndex = 0;
          if (pola === "ROTASI_MINGGUAN") {
            const weekNumber = Math.floor(dayIdx / 7);
            shiftIndex = (weekNumber + shiftOffset) % parsedShiftIds.length;
          } else {
            // ROTASI_HARIAN (selang-seling setiap hari kerja)
            shiftIndex = (dayIdx + shiftOffset) % parsedShiftIds.length;
          }

          const shiftId = parsedShiftIds[shiftIndex];

          inserts.push({
            user_id: uId,
            id_cabang: parsedCabang,
            id_jabatan: uJabatan,
            id_shift: shiftId,
            tanggal,
            status_hari: "KERJA",
            catatan: `Auto-generate rotasi shift (${pola})`,
            aktif: true,
            created_by: activeUser.id,
          });
          insertedCount++;
        }
      }
    }

    // Chunked insertion
    const chunkSize = 100;
    for (let i = 0; i < inserts.length; i += chunkSize) {
      await db.insert(jadwal_karyawan).values(inserts.slice(i, i + chunkSize));
    }

    return c.json({
      success: true,
      message: `Generator selesai: Berhasil membuat ${insertedCount} jadwal (${skippedCount} dilewati karena sudah ada).`,
      inserted: insertedCount,
      skipped: skippedCount,
    });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal auto-generate jadwal: " + error.message }, 500);
  }
});

// ==========================================
// 13. WORKFLOW TUKAR SHIFT (SHIFT SWAP)
// ==========================================

// GET /tukar-shift - Ambil daftar permohonan tukar shift
hrdRoutes.get("/tukar-shift", async (c) => {
  try {
    const { status, user_id, bulan } = c.req.query();
    const conditions: any[] = [];

    if (status) conditions.push(eq(tukar_shift.status, status));
    if (user_id) {
      const pUser = parseInt(user_id);
      if (!isNaN(pUser)) {
        conditions.push(or(eq(tukar_shift.user_pengaju, pUser), eq(tukar_shift.user_pengganti, pUser)));
      }
    }
    if (bulan) conditions.push(like(tukar_shift.tanggal_tukar, `${bulan}-%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db
      .select({
        id: tukar_shift.id,
        id_jadwal_pengaju: tukar_shift.id_jadwal_pengaju,
        user_pengaju: tukar_shift.user_pengaju,
        id_jadwal_pengganti: tukar_shift.id_jadwal_pengganti,
        user_pengganti: tukar_shift.user_pengganti,
        tanggal_tukar: tukar_shift.tanggal_tukar,
        alasan: tukar_shift.alasan,
        status: tukar_shift.status,
        reviewed_by: tukar_shift.reviewed_by,
        reviewed_at: tukar_shift.reviewed_at,
        catatan_reviewer: tukar_shift.catatan_reviewer,
        created_at: tukar_shift.created_at,
      })
      .from(tukar_shift)
      .where(whereClause)
      .orderBy(desc(tukar_shift.id));

    // Perkaya data dengan nama user dan shift
    const enriched = await Promise.all(
      list.map(async (row) => {
        const [u1] = await db.select({ nama: users.nama_user, kode: users.kode_user }).from(users).where(eq(users.id, row.user_pengaju)).limit(1);
        const [u2] = await db.select({ nama: users.nama_user, kode: users.kode_user }).from(users).where(eq(users.id, row.user_pengganti)).limit(1);
        const [j1] = await db
          .select({ id_shift: jadwal_karyawan.id_shift, nama_shift: jam_kerja.nama_shift, status_hari: jadwal_karyawan.status_hari })
          .from(jadwal_karyawan)
          .leftJoin(jam_kerja, eq(jadwal_karyawan.id_shift, jam_kerja.id))
          .where(eq(jadwal_karyawan.id, row.id_jadwal_pengaju))
          .limit(1);
        const [j2] = await db
          .select({ id_shift: jadwal_karyawan.id_shift, nama_shift: jam_kerja.nama_shift, status_hari: jadwal_karyawan.status_hari })
          .from(jadwal_karyawan)
          .leftJoin(jam_kerja, eq(jadwal_karyawan.id_shift, jam_kerja.id))
          .where(eq(jadwal_karyawan.id, row.id_jadwal_pengganti))
          .limit(1);

        return {
          ...row,
          nama_pengaju: u1?.nama || "Karyawan",
          kode_pengaju: u1?.kode || "",
          shift_pengaju: j1?.nama_shift || j1?.status_hari || "-",
          nama_pengganti: u2?.nama || "Karyawan",
          kode_pengganti: u2?.kode || "",
          shift_pengganti: j2?.nama_shift || j2?.status_hari || "-",
        };
      })
    );

    return c.json({ success: true, data: enriched });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal mengambil permohonan tukar shift: " + error.message }, 500);
  }
});

// POST /tukar-shift - Ajukan permohonan tukar shift
hrdRoutes.post("/tukar-shift", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const { id_jadwal_pengaju, user_pengganti, id_jadwal_pengganti, tanggal_tukar, alasan } = body;

    if (!id_jadwal_pengaju || !user_pengganti || !id_jadwal_pengganti || !tanggal_tukar || !alasan) {
      return c.json({ success: false, error: "Seluruh field permohonan tukar shift wajib diisi." }, 400);
    }

    const [jPengaju] = await db.select().from(jadwal_karyawan).where(eq(jadwal_karyawan.id, parseInt(id_jadwal_pengaju))).limit(1);
    const [jPengganti] = await db.select().from(jadwal_karyawan).where(eq(jadwal_karyawan.id, parseInt(id_jadwal_pengganti))).limit(1);

    if (!jPengaju || !jPengganti) {
      return c.json({ success: false, error: "Jadwal yang dipilih tidak valid atau sudah dihapus." }, 404);
    }

    const [inserted] = await db
      .insert(tukar_shift)
      .values({
        id_jadwal_pengaju: jPengaju.id,
        user_pengaju: jPengaju.user_id,
        id_jadwal_pengganti: jPengganti.id,
        user_pengganti: parseInt(user_pengganti),
        tanggal_tukar,
        alasan,
        status: "PENDING",
      })
      .returning();

    return c.json({ success: true, data: inserted, message: "Permohonan tukar shift berhasil diajukan dan menunggu persetujuan HRD Pusat." }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal mengajukan tukar shift: " + error.message }, 500);
  }
});

// PUT /tukar-shift/:id/review - HRD Pusat Approve / Reject Permohonan Tukar Shift
hrdRoutes.put("/tukar-shift/:id/review", async (c) => {
  const activeUser = c.get("user");
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 2 && activeUser.id_jabatan !== 3) {
    return c.json({ success: false, error: "Akses ditolak: Hanya HRD Pusat yang dapat menyetujui atau menolak permohonan tukar shift." }, 403);
  }

  const id = c.req.param("id");
  try {
    const currentId = parseInt(id);
    if (isNaN(currentId)) {
      return c.json({ success: false, error: "ID tukar shift tidak valid" }, 400);
    }

    const [req] = await db.select().from(tukar_shift).where(eq(tukar_shift.id, currentId)).limit(1);
    if (!req) {
      return c.json({ success: false, error: "Permohonan tukar shift tidak ditemukan" }, 404);
    }

    if (req.status !== "PENDING") {
      return c.json({ success: false, error: `Permohonan sudah berstatus ${req.status}` }, 400);
    }

    const body = await c.req.json();
    const { action, catatan_reviewer } = body; // action: 'APPROVE' | 'REJECT'

    if (action !== "APPROVE" && action !== "REJECT") {
      return c.json({ success: false, error: "Action harus berupa APPROVE atau REJECT" }, 400);
    }

    if (action === "REJECT") {
      const [updated] = await db
        .update(tukar_shift)
        .set({
          status: "REJECTED",
          reviewed_by: activeUser.id,
          reviewed_at: new Date().toISOString(),
          catatan_reviewer: catatan_reviewer || "Ditolak oleh HRD Pusat",
        })
        .where(eq(tukar_shift.id, currentId))
        .returning();

      return c.json({ success: true, data: updated, message: "Permohonan tukar shift telah ditolak." });
    }

    // Action === APPROVE: Lakukan atomic swap antara dua jadwal
    const [j1] = await db.select().from(jadwal_karyawan).where(eq(jadwal_karyawan.id, req.id_jadwal_pengaju)).limit(1);
    const [j2] = await db.select().from(jadwal_karyawan).where(eq(jadwal_karyawan.id, req.id_jadwal_pengganti)).limit(1);

    if (!j1 || !j2) {
      return c.json({ success: false, error: "Salah satu data jadwal sudah tidak ada lagi di sistem." }, 400);
    }

    // Tukar shift dan status_hari antar kedua record jadwal
    await db
      .update(jadwal_karyawan)
      .set({
        id_shift: j2.id_shift,
        status_hari: j2.status_hari,
        catatan: `Tukar shift resmi disetujui (sebelumnya: ${j1.status_hari})`,
        updated_at: new Date().toISOString(),
      })
      .where(eq(jadwal_karyawan.id, j1.id));

    await db
      .update(jadwal_karyawan)
      .set({
        id_shift: j1.id_shift,
        status_hari: j1.status_hari,
        catatan: `Tukar shift resmi disetujui (sebelumnya: ${j2.status_hari})`,
        updated_at: new Date().toISOString(),
      })
      .where(eq(jadwal_karyawan.id, j2.id));

    const [updatedReq] = await db
      .update(tukar_shift)
      .set({
        status: "APPROVED",
        reviewed_by: activeUser.id,
        reviewed_at: new Date().toISOString(),
        catatan_reviewer: catatan_reviewer || "Disetujui oleh HRD Pusat",
      })
      .where(eq(tukar_shift.id, currentId))
      .returning();

    return c.json({
      success: true,
      data: updatedReq,
      message: "Permohonan tukar shift berhasil disetujui dan jadwal kedua karyawan telah diperbarui di roster.",
    });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal memproses review tukar shift: " + error.message }, 500);
  }
});

