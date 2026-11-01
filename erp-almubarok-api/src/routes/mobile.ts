import { Hono } from "hono";
import { db } from "../lib/db";
import {
  absensi,
  cabang,
  users,
  jabatan,
  jam_kerja,
  izin_cuti,
  bisyaroh,
  daftar_gaji_jabatan,
  hutang_karyawan,
  jadwal_karyawan,
  jabatan_shift_config,
} from "../lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";
import * as fs from "fs";
import * as path from "path";

export const mobileRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// ============================================================
// UTILITY: Formula Haversine — Hitung jarak antar dua titik GPS (meter)
// ============================================================
function hitungJarakMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const RADIUS_ABSENSI_METER = 500; // Jarak maksimal dari kantor cabang

// ============================================================
// UTILITY: Simpan foto selfie base64 ke filesystem
// ============================================================
function simpanFotoSelfie(base64Data: string, userId: number): string | null {
  try {
    // Hapus prefix "data:image/jpeg;base64," jika ada
    const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");

    const uploadDir = path.join(process.cwd(), "uploads", "selfie-absensi");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const today = new Date().toISOString().split("T")[0];
    const timestamp = Date.now();
    const filename = `selfie_${userId}_${today}_${timestamp}.jpg`;
    const filepath = path.join(uploadDir, filename);

    fs.writeFileSync(filepath, buffer);
    return `/uploads/selfie-absensi/${filename}`;
  } catch (err) {
    console.error("Error simpan foto selfie:", err);
    return null;
  }
}

// ============================================================
// 1. STATUS ABSENSI HARI INI
// GET /api/mobile/absensi/status
// ============================================================
mobileRoutes.get("/absensi/status", async (c) => {
  const user = c.get("user");
  const today = new Date().toISOString().split("T")[0];

  const records = await db
    .select()
    .from(absensi)
    .where(and(eq(absensi.user_id, user.id), eq(absensi.tanggal, today)))
    .orderBy(absensi.jam);

  const masuk = records.find((r) => r.jenis === "Masuk");
  const pulang = records.find((r) => r.jenis === "Pulang");

  // Cari jadwal hari ini dari jadwal_karyawan
  const [activeJadwal] = await db
    .select({
      id_jadwal: jadwal_karyawan.id,
      id_shift: jadwal_karyawan.id_shift,
      nama_shift: jam_kerja.nama_shift,
      jam_masuk: jam_kerja.jam_masuk,
      jam_pulang: jam_kerja.jam_pulang,
      status_hari: jadwal_karyawan.status_hari,
      catatan: jadwal_karyawan.catatan,
    })
    .from(jadwal_karyawan)
    .leftJoin(jam_kerja, eq(jadwal_karyawan.id_shift, jam_kerja.id))
    .where(
      and(
        eq(jadwal_karyawan.user_id, user.id),
        eq(jadwal_karyawan.tanggal, today),
        eq(jadwal_karyawan.aktif, true)
      )
    )
    .limit(1);

  let jadwalHariIni = activeJadwal || null;

  // Jika belum ada jadwal roster, cek konfigurasi default non-shift per jabatan
  if (!jadwalHariIni && user.id_jabatan) {
    const [cfg] = await db
      .select({
        id_shift: jabatan_shift_config.default_id_shift,
        nama_shift: jam_kerja.nama_shift,
        jam_masuk: jam_kerja.jam_masuk,
        jam_pulang: jam_kerja.jam_pulang,
        tipe_kerja: jabatan_shift_config.tipe_kerja,
      })
      .from(jabatan_shift_config)
      .leftJoin(jam_kerja, eq(jabatan_shift_config.default_id_shift, jam_kerja.id))
      .where(eq(jabatan_shift_config.id_jabatan, user.id_jabatan))
      .limit(1);

    if (cfg && cfg.tipe_kerja === "NON_SHIFT" && cfg.id_shift) {
      jadwalHariIni = {
        id_jadwal: 0,
        id_shift: cfg.id_shift,
        nama_shift: cfg.nama_shift,
        jam_masuk: cfg.jam_masuk,
        jam_pulang: cfg.jam_pulang,
        status_hari: "KERJA",
        catatan: "Jadwal Reguler Jabatan",
      };
    }
  }

  return c.json({
    tanggal: today,
    sudah_masuk: !!masuk,
    jam_masuk: masuk?.jam ?? null,
    lokasi_masuk: masuk?.status_lokasi ?? null,
    sudah_pulang: !!pulang,
    jam_pulang: pulang?.jam ?? null,
    lokasi_pulang: pulang?.status_lokasi ?? null,
    shift: masuk?.shift ?? jadwalHariIni?.nama_shift ?? null,
    jadwal_hari_ini: jadwalHariIni,
  });
});

// ============================================================
// 2. CHECK-IN (Masuk kerja)
// POST /api/mobile/absensi/check-in
// Body: { latitude, longitude, foto_selfie (base64), shift_id? }
// ============================================================
mobileRoutes.post("/absensi/check-in", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { latitude, longitude, foto_selfie, shift_id } = body;

  if (!latitude || !longitude) {
    return c.json({ error: "Koordinat GPS (latitude & longitude) wajib diisi" }, 400);
  }

  const latUser = parseFloat(latitude);
  const lonUser = parseFloat(longitude);

  if (isNaN(latUser) || isNaN(lonUser)) {
    return c.json({ error: "Format koordinat GPS tidak valid" }, 400);
  }

  // Pastikan user memiliki cabang yang terdaftar
  if (!user.id_cabang) {
    return c.json({ error: "Anda belum terdaftar di cabang manapun." }, 403);
  }

  // Ambil koordinat cabang dari database
  const [dataCabang] = await db
    .select({
      nama_cabang: cabang.nama_cabang,
      lat_cabang: cabang.latitude,
      lon_cabang: cabang.longitude,
    })
    .from(cabang)
    .where(eq(cabang.id_cabang, user.id_cabang))
    .limit(1);

  if (!dataCabang) {
    return c.json({ error: "Data cabang tidak ditemukan." }, 404);
  }

  // Validasi GPS hanya jika cabang memiliki koordinat terdaftar
  let statusLokasi = "valid";
  let jarakMeter: number | null = null;

  if (dataCabang.lat_cabang && dataCabang.lon_cabang) {
    const latCabang = parseFloat(dataCabang.lat_cabang);
    const lonCabang = parseFloat(dataCabang.lon_cabang);

    if (!isNaN(latCabang) && !isNaN(lonCabang)) {
      jarakMeter = hitungJarakMeter(latUser, lonUser, latCabang, lonCabang);
      statusLokasi = jarakMeter <= RADIUS_ABSENSI_METER ? "valid" : "invalid";
    }
  } else {
    // Cabang belum punya koordinat → tandai sebagai perlu verifikasi manual
    statusLokasi = "perlu_verifikasi";
  }

  // Cek sudah absen masuk hari ini atau belum
  const today = new Date().toISOString().split("T")[0];
  const [existing] = await db
    .select()
    .from(absensi)
    .where(
      and(
        eq(absensi.user_id, user.id),
        eq(absensi.tanggal, today),
        eq(absensi.jenis, "Masuk")
      )
    )
    .limit(1);

  if (existing) {
    return c.json({ error: "Anda sudah melakukan absensi masuk hari ini." }, 409);
  }

  // Smart Shift Detection dari jadwal_karyawan atau jabatan_shift_config
  let finalShiftId = shift_id ? parseInt(shift_id) : null;
  let namaShift: string | null = null;
  let scheduleNote: string | null = null;

  // Cek jadwal hari ini di jadwal_karyawan
  const [activeJadwal] = await db
    .select({
      id_shift: jadwal_karyawan.id_shift,
      status_hari: jadwal_karyawan.status_hari,
      nama_shift: jam_kerja.nama_shift,
    })
    .from(jadwal_karyawan)
    .leftJoin(jam_kerja, eq(jadwal_karyawan.id_shift, jam_kerja.id))
    .where(
      and(
        eq(jadwal_karyawan.user_id, user.id),
        eq(jadwal_karyawan.tanggal, today),
        eq(jadwal_karyawan.aktif, true)
      )
    )
    .limit(1);

  if (activeJadwal) {
    if (activeJadwal.status_hari === "LIBUR_ROSTER") {
      scheduleNote = "Masuk pada Hari Libur Roster (Perlu Konfirmasi HRD)";
    } else if (activeJadwal.id_shift) {
      if (!finalShiftId) finalShiftId = activeJadwal.id_shift;
      namaShift = activeJadwal.nama_shift;
    }
  } else if (!finalShiftId && user.id_jabatan) {
    const [cfg] = await db
      .select({
        default_id_shift: jabatan_shift_config.default_id_shift,
        nama_shift: jam_kerja.nama_shift,
      })
      .from(jabatan_shift_config)
      .leftJoin(jam_kerja, eq(jabatan_shift_config.default_id_shift, jam_kerja.id))
      .where(eq(jabatan_shift_config.id_jabatan, user.id_jabatan))
      .limit(1);

    if (cfg?.default_id_shift) {
      finalShiftId = cfg.default_id_shift;
      namaShift = cfg.nama_shift;
    } else {
      scheduleNote = "Absen di luar jadwal roster (Perlu Konfirmasi HRD)";
    }
  }

  if (finalShiftId && !namaShift) {
    const [shiftData] = await db
      .select({ nama_shift: jam_kerja.nama_shift })
      .from(jam_kerja)
      .where(eq(jam_kerja.id, finalShiftId))
      .limit(1);
    namaShift = shiftData?.nama_shift ?? null;
  }

  // Simpan foto selfie jika dikirim
  let pathFoto: string | null = null;
  if (foto_selfie) {
    pathFoto = simpanFotoSelfie(foto_selfie, user.id);
  }

  // Catat absensi masuk
  const now = new Date();
  const jam = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const noteParts: string[] = [];
  if (jarakMeter !== null) noteParts.push(`Jarak: ${Math.round(jarakMeter)}m`);
  if (scheduleNote) noteParts.push(scheduleNote);
  const finalCatatan = noteParts.length > 0 ? noteParts.join(" | ") : null;

  const [newAbsensi] = await db
    .insert(absensi)
    .values({
      user_id: user.id,
      tanggal: today,
      jam,
      jenis: "Masuk",
      shift: namaShift,
      latitude: String(latUser),
      longitude: String(lonUser),
      status_lokasi: statusLokasi,
      foto_selfie: pathFoto,
      id_shift: finalShiftId,
      catatan: finalCatatan,
    })
    .returning();

  return c.json({
    success: true,
    pesan:
      statusLokasi === "valid"
        ? "Absensi masuk berhasil dicatat."
        : statusLokasi === "invalid"
        ? `Absensi dicatat, namun lokasi Anda di luar radius ${RADIUS_ABSENSI_METER}m dari kantor (${Math.round(jarakMeter!)}m). Akan dikonfirmasi oleh admin.`
        : "Absensi dicatat. Lokasi akan diverifikasi admin karena koordinat cabang belum terdaftar.",
    data: {
      id: newAbsensi.id,
      tanggal: today,
      jam,
      status_lokasi: statusLokasi,
      jarak_meter: jarakMeter !== null ? Math.round(jarakMeter) : null,
      nama_cabang: dataCabang.nama_cabang,
      foto_tersimpan: !!pathFoto,
    },
  });
});

// ============================================================
// 3. CHECK-OUT (Pulang kerja)
// POST /api/mobile/absensi/check-out
// Body: { latitude, longitude, foto_selfie? }
// ============================================================
mobileRoutes.post("/absensi/check-out", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { latitude, longitude, foto_selfie } = body;

  if (!latitude || !longitude) {
    return c.json({ error: "Koordinat GPS (latitude & longitude) wajib diisi" }, 400);
  }

  const latUser = parseFloat(latitude);
  const lonUser = parseFloat(longitude);

  if (isNaN(latUser) || isNaN(lonUser)) {
    return c.json({ error: "Format koordinat GPS tidak valid" }, 400);
  }

  const today = new Date().toISOString().split("T")[0];

  // Pastikan sudah ada absensi masuk dulu
  const [absensiMasuk] = await db
    .select()
    .from(absensi)
    .where(
      and(
        eq(absensi.user_id, user.id),
        eq(absensi.tanggal, today),
        eq(absensi.jenis, "Masuk")
      )
    )
    .limit(1);

  if (!absensiMasuk) {
    return c.json({ error: "Anda belum melakukan absensi masuk hari ini." }, 400);
  }

  // Cek sudah absen pulang atau belum
  const [existingPulang] = await db
    .select()
    .from(absensi)
    .where(
      and(
        eq(absensi.user_id, user.id),
        eq(absensi.tanggal, today),
        eq(absensi.jenis, "Pulang")
      )
    )
    .limit(1);

  if (existingPulang) {
    return c.json({ error: "Anda sudah melakukan absensi pulang hari ini." }, 409);
  }

  // Validasi GPS jika cabang punya koordinat
  let statusLokasi = "valid";
  let jarakMeter: number | null = null;

  if (user.id_cabang) {
    const [dataCabang] = await db
      .select({ lat_cabang: cabang.latitude, lon_cabang: cabang.longitude })
      .from(cabang)
      .where(eq(cabang.id_cabang, user.id_cabang))
      .limit(1);

    if (dataCabang?.lat_cabang && dataCabang.lon_cabang) {
      const latCabang = parseFloat(dataCabang.lat_cabang);
      const lonCabang = parseFloat(dataCabang.lon_cabang);
      if (!isNaN(latCabang) && !isNaN(lonCabang)) {
        jarakMeter = hitungJarakMeter(latUser, lonUser, latCabang, lonCabang);
        statusLokasi = jarakMeter <= RADIUS_ABSENSI_METER ? "valid" : "invalid";
      }
    }
  }

  // Simpan foto selfie pulang jika dikirim
  let pathFoto: string | null = null;
  if (foto_selfie) {
    pathFoto = simpanFotoSelfie(foto_selfie, user.id);
  }

  const now = new Date();
  const jam = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const [newAbsensi] = await db
    .insert(absensi)
    .values({
      user_id: user.id,
      tanggal: today,
      jam,
      jenis: "Pulang",
      shift: absensiMasuk.shift,
      latitude: String(latUser),
      longitude: String(lonUser),
      status_lokasi: statusLokasi,
      foto_selfie: pathFoto,
      catatan: jarakMeter !== null ? `Jarak dari kantor: ${Math.round(jarakMeter)}m` : null,
    })
    .returning();

  return c.json({
    success: true,
    pesan: "Absensi pulang berhasil dicatat.",
    data: {
      id: newAbsensi.id,
      tanggal: today,
      jam_masuk: absensiMasuk.jam,
      jam_pulang: jam,
      status_lokasi: statusLokasi,
      jarak_meter: jarakMeter !== null ? Math.round(jarakMeter) : null,
    },
  });
});

// ============================================================
// 4. RIWAYAT ABSENSI PERSONAL
// GET /api/mobile/absensi/riwayat?bulan=8&tahun=2026
// ============================================================
mobileRoutes.get("/absensi/riwayat", async (c) => {
  const user = c.get("user");
  const bulan = c.req.query("bulan") ?? new Date().getMonth() + 1;
  const tahun = c.req.query("tahun") ?? new Date().getFullYear();

  const tanggalMulai = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
  const tanggalAkhir = `${tahun}-${String(bulan).padStart(2, "0")}-31`;

  const records = await db
    .select()
    .from(absensi)
    .where(
      and(
        eq(absensi.user_id, user.id),
        gte(absensi.tanggal, tanggalMulai),
        lte(absensi.tanggal, tanggalAkhir)
      )
    )
    .orderBy(desc(absensi.tanggal), absensi.jam);

  return c.json({ data: records });
});

// ============================================================
// 5. AJUKAN IZIN / CUTI DARI MOBILE
// POST /api/mobile/izin-cuti/ajukan
// Body: { jenis, tanggal_mulai, tanggal_selesai, keterangan }
// ============================================================
mobileRoutes.post("/izin-cuti/ajukan", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { jenis, tanggal_mulai, tanggal_selesai, keterangan } = body;

  if (!jenis || !tanggal_mulai || !tanggal_selesai) {
    return c.json({ error: "Jenis, tanggal mulai, dan tanggal selesai wajib diisi." }, 400);
  }

  const [newIzin] = await db
    .insert(izin_cuti)
    .values({
      user_id: user.id,
      jenis,
      tanggal_mulai,
      tanggal_selesai,
      keterangan: keterangan ?? null,
      status: "Menunggu",
    })
    .returning();

  return c.json({
    success: true,
    pesan: "Permohonan izin/cuti berhasil diajukan. Menunggu persetujuan admin.",
    data: newIzin,
  });
});

// ============================================================
// 6. RIWAYAT IZIN / CUTI PERSONAL
// GET /api/mobile/izin-cuti
// ============================================================
mobileRoutes.get("/izin-cuti", async (c) => {
  const user = c.get("user");

  const data = await db
    .select()
    .from(izin_cuti)
    .where(eq(izin_cuti.user_id, user.id))
    .orderBy(desc(izin_cuti.tanggal_pengajuan));

  return c.json({ data });
});

// ============================================================
// 7. SLIP GAJI PERSONAL
// GET /api/mobile/slip-gaji?bulan=8&tahun=2026
// ============================================================
mobileRoutes.get("/slip-gaji", async (c) => {
  const user = c.get("user");
  const bulan = parseInt(c.req.query("bulan") ?? String(new Date().getMonth() + 1));
  const tahun = parseInt(c.req.query("tahun") ?? String(new Date().getFullYear()));

  const [slip] = await db
    .select()
    .from(bisyaroh)
    .where(
      and(
        eq(bisyaroh.user_id, user.id),
        eq(bisyaroh.bulan, bulan),
        eq(bisyaroh.tahun, tahun)
      )
    )
    .limit(1);

  if (!slip) {
    return c.json({
      pesan: `Slip gaji bulan ${bulan}/${tahun} belum tersedia.`,
      data: null,
    });
  }

  // Ambil hutang aktif
  const hutangAktif = await db
    .select({ nominal: hutang_karyawan.nominal, keterangan: hutang_karyawan.keterangan })
    .from(hutang_karyawan)
    .where(and(eq(hutang_karyawan.user_id, user.id), eq(hutang_karyawan.status, "aktif")));

  const totalHutang = hutangAktif.reduce((acc, h) => acc + (h.nominal ?? 0), 0);

  return c.json({
    data: {
      ...slip,
      hutang_aktif: totalHutang,
      hutang_detail: hutangAktif,
    },
  });
});

// ============================================================
// 8. JADWAL SHIFT YANG BERLAKU
// GET /api/mobile/jadwal-shift
// ============================================================
mobileRoutes.get("/jadwal-shift", async (c) => {
  const shifts = await db.select().from(jam_kerja).orderBy(jam_kerja.nama_shift);

  return c.json({ data: shifts });
});

// ============================================================
// 9. PROFIL PERSONAL UNTUK MOBILE
// GET /api/mobile/profil
// ============================================================
mobileRoutes.get("/profil", async (c) => {
  const user = c.get("user");

  const [profil] = await db
    .select({
      id: users.id,
      kode_user: users.kode_user,
      nama_user: users.nama_user,
      foto: users.foto,
      no_hp: users.no_hp,
      jabatan: jabatan.jabatan,
      nama_cabang: cabang.nama_cabang,
      tanggal_masuk: users.tanggal_masuk,
      status: users.status,
    })
    .from(users)
    .leftJoin(jabatan, eq(users.id_jabatan, jabatan.id_jabatan))
    .leftJoin(cabang, eq(users.id_cabang, cabang.id_cabang))
    .where(eq(users.id, user.id))
    .limit(1);

  if (!profil) {
    return c.json({ error: "Profil tidak ditemukan" }, 404);
  }

  return c.json({ data: profil });
});
