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
  kasir_jadwal
} from "../lib/db/schema";
import { eq, and, or, like, sql, asc, desc, gte, lte, inArray } from "drizzle-orm";
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
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
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
  if (search) {
    conditions.push(
      or(
        like(users.nama_user, `%${search}%`),
        like(users.kode_user, `%${search}%`),
        like(users.no_hp, `%${search}%`)
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

  const [data, total] = await Promise.all([
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
      .where(where),
  ]);

  return c.json({
    data,
    total: total[0].count,
    page,
    limit,
    totalPages: Math.ceil(total[0].count / limit),
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

