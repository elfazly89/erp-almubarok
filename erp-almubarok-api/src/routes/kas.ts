import { Hono } from "hono";
import { db } from "../lib/db";
import {
  rekening_kas,
  kas_transaksi,
  kasir_shift,
  rekonsiliasi_kas,
  jurnal_umum,
  daftar_akun,
  cabang,
  users,
  penjualan,
  pengaturan_aplikasi,
  kasir_jadwal
} from "../lib/db/schema";
import { eq, and, desc, gte, lte, sql, or, between, lt, asc } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";

export const kasRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// ==========================================
// 1. REKENING KAS
// ==========================================

// GET /rekening - List rekening kas per cabang
kasRoutes.get("/rekening", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 400);
  }

  try {
    const data = await db
      .select({
        id: rekening_kas.id,
        kode: rekening_kas.kode,
        nama: rekening_kas.nama,
        jenis: rekening_kas.jenis,
        id_cabang: rekening_kas.id_cabang,
        saldo_awal: rekening_kas.saldo_awal,
        saldo: rekening_kas.saldo,
        id_akun_coa: rekening_kas.id_akun_coa,
        is_active: rekening_kas.is_active,
        nama_akun_coa: daftar_akun.nama_akun,
        kode_akun_coa: daftar_akun.kode_akun,
      })
      .from(rekening_kas)
      .leftJoin(daftar_akun, eq(rekening_kas.id_akun_coa, daftar_akun.id))
      .where(eq(rekening_kas.id_cabang, idCabang))
      .orderBy(rekening_kas.kode);

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /rekening - Tambah rekening kas baru
kasRoutes.post("/rekening", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 400);
  }

  try {
    const body = await c.req.json();
    const { kode, nama, jenis, saldo_awal, id_akun_coa } = body;

    if (!kode || !nama || !jenis) {
      return c.json({ success: false, error: "Data input tidak lengkap" }, 400);
    }

    const sAwal = parseInt(saldo_awal) || 0;

    const [newRekening] = await db
      .insert(rekening_kas)
      .values({
        kode,
        nama,
        jenis,
        id_cabang: idCabang,
        saldo_awal: sAwal,
        saldo: sAwal,
        id_akun_coa: id_akun_coa ? parseInt(id_akun_coa) : null,
        is_active: true,
      })
      .returning();

    return c.json({ success: true, data: newRekening }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /rekening/:id - Update rekening kas
kasRoutes.put("/rekening/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) {
    return c.json({ success: false, error: "ID tidak valid" }, 400);
  }

  try {
    const body = await c.req.json();
    const { nama, jenis, id_akun_coa, is_active } = body;

    const updateData: any = {};
    if (nama) updateData.nama = nama;
    if (jenis) updateData.jenis = jenis;
    if (id_akun_coa !== undefined) updateData.id_akun_coa = id_akun_coa ? parseInt(id_akun_coa) : null;
    if (is_active !== undefined) updateData.is_active = !!is_active;
    updateData.updated_at = new Date().toISOString();

    const [updated] = await db
      .update(rekening_kas)
      .set(updateData)
      .where(eq(rekening_kas.id, id))
      .returning();

    return c.json({ success: true, data: updated });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /saldo - Total saldo kas realtime
kasRoutes.get("/saldo", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 400);
  }

  try {
    const [res] = await db
      .select({ total: sql<number>`sum(saldo)` })
      .from(rekening_kas)
      .where(and(eq(rekening_kas.id_cabang, idCabang), eq(rekening_kas.is_active, true)));

    return c.json({ success: true, total: res?.total || 0 });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==========================================
// 2. KAS TRANSAKSI
// ==========================================

// GET /transaksi - List transaksi mutasi
kasRoutes.get("/transaksi", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const tipe = c.req.query("tipe");
  const idRekening = c.req.query("id_rekening");

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 400);
  }

  try {
    const conditions = [eq(kas_transaksi.id_cabang, idCabang)];

    if (startDate) {
      conditions.push(gte(kas_transaksi.tanggal, startDate));
    }
    if (endDate) {
      conditions.push(lte(kas_transaksi.tanggal, endDate));
    }
    if (tipe) {
      conditions.push(eq(kas_transaksi.tipe, tipe));
    }
    if (idRekening) {
      conditions.push(eq(kas_transaksi.id_rekening, parseInt(idRekening)));
    }

    const data = await db
      .select({
        id: kas_transaksi.id,
        nomor_transaksi: kas_transaksi.nomor_transaksi,
        id_rekening: kas_transaksi.id_rekening,
        nama_rekening: rekening_kas.nama,
        kode_rekening: rekening_kas.kode,
        tipe: kas_transaksi.tipe,
        kategori: kas_transaksi.kategori,
        nominal: kas_transaksi.nominal,
        tanggal: kas_transaksi.tanggal,
        keterangan: kas_transaksi.keterangan,
        status: kas_transaksi.status,
        bukti: kas_transaksi.bukti,
        created_by_nama: users.nama_user,
      })
      .from(kas_transaksi)
      .innerJoin(rekening_kas, eq(kas_transaksi.id_rekening, rekening_kas.id))
      .leftJoin(users, eq(kas_transaksi.created_by, users.id))
      .where(and(...conditions))
      .orderBy(desc(kas_transaksi.id));

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Helper: dapatkan COA ID dinamis berdasarkan kategori transaksi
async function getCoaCounterAccount(tx: any, kategori: string): Promise<number> {
  const key = `coa_kategori_${kategori.toLowerCase()}`;
  try {
    const [setting] = await tx
      .select()
      .from(pengaturan_aplikasi)
      .where(eq(pengaturan_aplikasi.key, key))
      .limit(1);

    if (setting) {
      const val = parseInt(setting.value);
      if (!isNaN(val)) return val;
    }
  } catch (err) {
    console.error("Gagal membaca setting COA:", err);
  }

  switch (kategori) {
    case "PENJUALAN": return 7; // Pendapatan Penjualan Toko (COA ID 7)
    case "OPERASIONAL": return 10; // Beban Operasional Toko (COA ID 10)
    case "GAJI": return 8; // Beban Gaji Karyawan (COA ID 8)
    case "PEMBELIAN": return 5; // Hutang Usaha (COA ID 5)
    default: return 10; // Beban Operasional Toko (COA ID 10)
  }
}

// POST /transaksi/masuk - Mutasi kas masuk
kasRoutes.post("/transaksi/masuk", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;
  const idUser = activeUser.id;

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 401);
  }

  try {
    const body = await c.req.json();
    const { id_rekening, nominal, tanggal, keterangan, kategori, bukti } = body;

    const parsedNominal = parseInt(nominal) || 0;
    const rekId = parseInt(id_rekening);

    if (isNaN(rekId) || parsedNominal <= 0 || !tanggal) {
      return c.json({ success: false, error: "Parameter transaksi tidak valid" }, 400);
    }

    // Ambil rekening kas
    const [rekening] = await db
      .select()
      .from(rekening_kas)
      .where(eq(rekening_kas.id, rekId))
      .limit(1);

    if (!rekening) {
      return c.json({ success: false, error: "Rekening kas tidak ditemukan" }, 404);
    }

    if (rekening.id_cabang !== idCabang) {
      return c.json({ success: false, error: "Rekening kas bukan milik cabang ini" }, 403);
    }

    const todayStr = tanggal.replace(/-/g, ""); // YYYYMMDD

    const result = await db.transaction(async (tx) => {
      // 0. Acquire advisory lock on branch level to prevent race condition on transaction number generation
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${idCabang})`);

      // 1. Generate nomor transaksi otomatis
      const [countResult] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(kas_transaksi)
        .where(
          and(
            eq(kas_transaksi.id_cabang, idCabang),
            eq(kas_transaksi.tipe, "MASUK"),
            eq(kas_transaksi.tanggal, tanggal)
          )
        );

      const sequence = (countResult?.count || 0) + 1;
      const noTransaksi = `KM/${todayStr}/${idCabang}/${String(sequence).padStart(4, "0")}`;

      // 2. Insert kas_transaksi
      const [newTx] = await tx
        .insert(kas_transaksi)
        .values({
          nomor_transaksi: noTransaksi,
          id_rekening: rekId,
          id_cabang: idCabang,
          tipe: "MASUK",
          kategori: kategori || "LAIN",
          nominal: parsedNominal,
          tanggal,
          keterangan,
          bukti,
          status: "APPROVED",
          created_by: idUser,
        })
        .returning();

      // 3. Update saldo rekening kas
      await tx
        .update(rekening_kas)
        .set({
          saldo: sql`saldo + ${parsedNominal}`,
          updated_at: new Date().toISOString(),
        })
        .where(eq(rekening_kas.id, rekId));

      // 4. Integrasi Jurnal Akuntansi (Double Entry)
      const coaDebit = rekening.id_akun_coa; // Akun kas
      const coaKredit = await getCoaCounterAccount(tx, kategori || "LAIN"); // Akun lawan

      if (coaDebit) {
        // Line 1: Debit Akun Kas
        await tx.insert(jurnal_umum).values({
          tanggal_transaksi: tanggal,
          no_referensi_bukti: noTransaksi,
          deskripsi: keterangan || `Kas Masuk: ${noTransaksi}`,
          akun_id: coaDebit,
          cabang_id: idCabang,
          debit: parsedNominal,
          kredit: 0,
          dibuat_oleh: idUser,
        });

        // Line 2: Kredit Akun Lawan
        await tx.insert(jurnal_umum).values({
          tanggal_transaksi: tanggal,
          no_referensi_bukti: noTransaksi,
          deskripsi: keterangan || `Kas Masuk: ${noTransaksi}`,
          akun_id: coaKredit,
          cabang_id: idCabang,
          debit: 0,
          kredit: parsedNominal,
          dibuat_oleh: idUser,
        });
      }

      return newTx;
    });

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /transaksi/keluar - Mutasi kas keluar
kasRoutes.post("/transaksi/keluar", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;
  const idUser = activeUser.id;

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 401);
  }

  try {
    const body = await c.req.json();
    const { id_rekening, nominal, tanggal, keterangan, kategori, bukti } = body;

    const parsedNominal = parseInt(nominal) || 0;
    const rekId = parseInt(id_rekening);

    if (isNaN(rekId) || parsedNominal <= 0 || !tanggal) {
      return c.json({ success: false, error: "Parameter transaksi tidak valid" }, 400);
    }

    // Ambil rekening kas
    const [rekening] = await db
      .select()
      .from(rekening_kas)
      .where(eq(rekening_kas.id, rekId))
      .limit(1);

    if (!rekening) {
      return c.json({ success: false, error: "Rekening kas tidak ditemukan" }, 404);
    }

    if (rekening.id_cabang !== idCabang) {
      return c.json({ success: false, error: "Rekening kas bukan milik cabang ini" }, 403);
    }

    // Validasi saldo (overdraft check)
    if (rekening.saldo < parsedNominal) {
      return c.json({ success: false, error: `Saldo tidak mencukupi. Saldo saat ini: ${rekening.saldo}` }, 400);
    }

    // Ambil threshold dari pengaturan untuk memverifikasi limit
    const [thresholdSetting] = await db
      .select()
      .from(pengaturan_aplikasi)
      .where(eq(pengaturan_aplikasi.key, "cash_approval_threshold"))
      .limit(1);

    const threshold = thresholdSetting ? parseInt(thresholdSetting.value) || 500000 : 500000;
    const needsApproval = parsedNominal > threshold;
    const statusTx = needsApproval ? "PENDING" : "APPROVED";

    const todayStr = tanggal.replace(/-/g, ""); // YYYYMMDD

    const result = await db.transaction(async (tx) => {
      // 0. Acquire advisory lock on branch level to prevent race condition on transaction number generation
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${idCabang})`);

      // 1. Generate nomor transaksi
      const [countResult] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(kas_transaksi)
        .where(
          and(
            eq(kas_transaksi.id_cabang, idCabang),
            eq(kas_transaksi.tipe, "KELUAR"),
            eq(kas_transaksi.tanggal, tanggal)
          )
        );

      const sequence = (countResult?.count || 0) + 1;
      const noTransaksi = `KK/${todayStr}/${idCabang}/${String(sequence).padStart(4, "0")}`;

      // 2. Insert kas_transaksi
      const [newTx] = await tx
        .insert(kas_transaksi)
        .values({
          nomor_transaksi: noTransaksi,
          id_rekening: rekId,
          id_cabang: idCabang,
          tipe: "KELUAR",
          kategori: kategori || "LAIN",
          nominal: parsedNominal,
          tanggal,
          keterangan: needsApproval ? `[MENUNGGU PERSETUJUAN] ${keterangan || ""}` : keterangan,
          bukti,
          status: statusTx,
          created_by: idUser,
        })
        .returning();

      // Jika tidak butuh approval, langsung potong saldo & buat jurnal
      if (!needsApproval) {
        // 3. Update saldo rekening kas
        await tx
          .update(rekening_kas)
          .set({
            saldo: sql`saldo - ${parsedNominal}`,
            updated_at: new Date().toISOString(),
          })
          .where(eq(rekening_kas.id, rekId));

        // 4. Integrasi Jurnal Akuntansi (Double Entry)
        const coaKredit = rekening.id_akun_coa; // Akun kas berkurang
        const coaDebit = await getCoaCounterAccount(tx, kategori || "LAIN"); // Akun beban/biaya bertambah

        if (coaKredit) {
          // Line 1: Debit Akun Lawan (Beban)
          await tx.insert(jurnal_umum).values({
            tanggal_transaksi: tanggal,
            no_referensi_bukti: noTransaksi,
            deskripsi: keterangan || `Kas Keluar: ${noTransaksi}`,
            akun_id: coaDebit,
            cabang_id: idCabang,
            debit: parsedNominal,
            kredit: 0,
            dibuat_oleh: idUser,
          });

          // Line 2: Kredit Akun Kas
          await tx.insert(jurnal_umum).values({
            tanggal_transaksi: tanggal,
            no_referensi_bukti: noTransaksi,
            deskripsi: keterangan || `Kas Keluar: ${noTransaksi}`,
            akun_id: coaKredit,
            cabang_id: idCabang,
            debit: 0,
            kredit: parsedNominal,
            dibuat_oleh: idUser,
          });
        }
      }

      return newTx;
    });

    return c.json({ success: true, data: result, needsApproval });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==========================================
// 3. SHIFT KASIR
// ==========================================

// GET /shift - List shift kasir
kasRoutes.get("/shift", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 400);
  }

  try {
    const data = await db
      .select({
        id: kasir_shift.id,
        id_cabang: kasir_shift.id_cabang,
        id_kasir: kasir_shift.id_kasir,
        nama_kasir: users.nama_user,
        kode_kasir: users.kode_user,
        id_rekening: kasir_shift.id_rekening,
        nama_rekening: rekening_kas.nama,
        waktu_buka: kasir_shift.waktu_buka,
        waktu_tutup: kasir_shift.waktu_tutup,
        saldo_awal: kasir_shift.saldo_awal,
        total_sistem: kasir_shift.total_sistem,
        total_tunai: kasir_shift.total_tunai,
        total_transfer: kasir_shift.total_transfer,
        uang_fisik: kasir_shift.uang_fisik,
        selisih: kasir_shift.selisih,
        setoran: kasir_shift.setoran,
        catatan: kasir_shift.catatan,
        status: kasir_shift.status,
      })
      .from(kasir_shift)
      .innerJoin(users, eq(kasir_shift.id_kasir, users.id))
      .innerJoin(rekening_kas, eq(kasir_shift.id_rekening, rekening_kas.id))
      .where(eq(kasir_shift.id_cabang, idCabang))
      .orderBy(desc(kasir_shift.id))
      .limit(50);

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /shift/buka - Buka shift kasir baru
kasRoutes.post("/shift/buka", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;
  const idUser = activeUser.id;

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 401);
  }

  try {
    const body = await c.req.json();
    const { saldo_awal, id_rekening } = body;

    const sAwal = parseInt(saldo_awal) || 0;
    const rekId = parseInt(id_rekening);

    if (isNaN(rekId)) {
      return c.json({ success: false, error: "Rekening kas tidak valid" }, 400);
    }

    // Validate cashier schedule for today
    const today = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const scheduled = await db
      .select()
      .from(kasir_jadwal)
      .where(
        and(
          eq(kasir_jadwal.id_kasir, idUser),
          eq(kasir_jadwal.id_cabang, idCabang),
          eq(kasir_jadwal.tanggal, today),
          eq(kasir_jadwal.aktif, true)
        )
      )
      .limit(1);

    if (scheduled.length === 0) {
      return c.json({
        success: false,
        error: `Anda tidak memiliki jadwal kasir aktif di cabang ini untuk tanggal ${today}.`,
      }, 400);
    }

    // Cek apakah ada shift yang masih OPEN untuk user ini
    const existingOpenShift = await db
      .select()
      .from(kasir_shift)
      .where(
        and(
          eq(kasir_shift.id_kasir, idUser),
          eq(kasir_shift.id_cabang, idCabang),
          eq(kasir_shift.status, "OPEN")
        )
      )
      .limit(1);

    if (existingOpenShift.length > 0) {
      return c.json({
        success: false,
        error: "Anda masih memiliki shift yang belum ditutup (status OPEN)",
      }, 400);
    }

    const [newShift] = await db
      .insert(kasir_shift)
      .values({
        id_cabang: idCabang,
        id_kasir: idUser,
        id_rekening: rekId,
        waktu_buka: new Date().toISOString(),
        saldo_awal: sAwal,
        status: "OPEN",
      })
      .returning();

    return c.json({ success: true, data: newShift });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /shift/:id/closing - Tutup shift kasir
kasRoutes.post("/shift/:id/closing", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) {
    return c.json({ success: false, error: "ID Shift tidak valid" }, 400);
  }

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 401);
  }

  try {
    const body = await c.req.json();
    const { uang_fisik, setoran, catatan } = body;

    const uFisik = parseInt(uang_fisik) || 0;
    const nSetoran = parseInt(setoran) || 0;

    const [shift] = await db
      .select()
      .from(kasir_shift)
      .where(eq(kasir_shift.id, id))
      .limit(1);

    if (!shift) {
      return c.json({ success: false, error: "Shift tidak ditemukan" }, 404);
    }

    if (shift.status !== "OPEN") {
      return c.json({ success: false, error: "Shift ini sudah ditutup" }, 400);
    }

    const nowStr = new Date().toISOString();

    const result = await db.transaction(async (tx) => {
      // 1. Ambil data penjualan POS dari kasir ini sejak waktu_buka
      const sales = await tx
        .select({
          total_akhir: penjualan.total_akhir,
          jenis_pembayaran: penjualan.jenis_pembayaran,
        })
        .from(penjualan)
        .where(
          and(
            eq(penjualan.id_user, shift.id_kasir),
            eq(penjualan.id_cabang, idCabang),
            gte(penjualan.created_at, shift.waktu_buka)
          )
        );

      let totalSistem = 0;
      let totalTunai = 0;
      let totalTransfer = 0;

      for (const s of sales) {
        totalSistem += s.total_akhir;
        if (s.jenis_pembayaran === "Tunai") {
          totalTunai += s.total_akhir;
        } else {
          totalTransfer += s.total_akhir;
        }
      }

      // Selisih uang fisik vs tunai sistem + saldo awal
      const selisih = uFisik - (shift.saldo_awal + totalTunai);

      // 2. Jika ada setoran, buat mutasi KAS KELUAR untuk setoran dari laci kasir
      if (nSetoran > 0) {
        // Ambil info rekening untuk validasi saldo setoran
        const [rekening] = await tx
          .select()
          .from(rekening_kas)
          .where(eq(rekening_kas.id, shift.id_rekening))
          .limit(1);

        if (!rekening) {
          throw new Error("Rekening laci kasir tidak ditemukan");
        }

        if (rekening.saldo < nSetoran) {
          throw new Error(`Saldo tidak mencukupi untuk setoran. Saldo saat ini: ${rekening.saldo}`);
        }

        const todayStr = nowStr.slice(0, 10).replace(/-/g, "");
        const noTx = `SETORAN/${todayStr}/${idCabang}/${shift.id}`;

        await tx.insert(kas_transaksi).values({
          nomor_transaksi: noTx,
          id_rekening: shift.id_rekening,
          id_cabang: idCabang,
          tipe: "KELUAR",
          kategori: "SETORAN",
          nominal: nSetoran,
          tanggal: nowStr.slice(0, 10),
          keterangan: `Setoran kasir closing shift #${shift.id}`,
          status: "APPROVED",
          referensi_type: "SHIFT",
          referensi_id: shift.id,
          created_by: shift.id_kasir,
        });

        // Potong saldo laci kasir
        await tx
          .update(rekening_kas)
          .set({
            saldo: sql`saldo - ${nSetoran}`,
            updated_at: nowStr,
          })
          .where(eq(rekening_kas.id, shift.id_rekening));
      }

      // 3. Update status shift menjadi CLOSING
      const [updatedShift] = await tx
        .update(kasir_shift)
        .set({
          waktu_tutup: nowStr,
          total_sistem: totalSistem,
          total_tunai: totalTunai,
          total_transfer: totalTransfer,
          uang_fisik: uFisik,
          selisih,
          setoran: nSetoran,
          catatan,
          status: "CLOSING",
        })
        .where(eq(kasir_shift.id, id))
        .returning();

      return updatedShift;
    });

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /shift/:id/verifikasi - Verifikasi closing shift
kasRoutes.put("/shift/:id/verifikasi", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;
  const idUser = activeUser.id;
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) {
    return c.json({ success: false, error: "ID Shift tidak valid" }, 400);
  }

  try {
    const [shift] = await db
      .select()
      .from(kasir_shift)
      .where(eq(kasir_shift.id, id))
      .limit(1);

    if (!shift) {
      return c.json({ success: false, error: "Shift tidak ditemukan" }, 404);
    }

    if (shift.status !== "CLOSING") {
      return c.json({ success: false, error: "Shift belum ditutup oleh kasir" }, 400);
    }

    const [updated] = await db
      .update(kasir_shift)
      .set({
        status: "VERIFIED",
        verified_by: idUser,
        verified_at: new Date().toISOString(),
      })
      .where(eq(kasir_shift.id, id))
      .returning();

    return c.json({ success: true, data: updated });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==========================================
// 4. KAS DASHBOARD
// ==========================================

// GET /dashboard - Statistik utama kasir & rekening
kasRoutes.get("/dashboard", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 400);
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    // 1. Total saldo kas cabang
    const [saldoRes] = await db
      .select({ total: sql<number>`sum(saldo)` })
      .from(rekening_kas)
      .where(and(eq(rekening_kas.id_cabang, idCabang), eq(rekening_kas.is_active, true)));

    // 2. Kas masuk hari ini
    const [masukRes] = await db
      .select({ total: sql<number>`sum(nominal)` })
      .from(kas_transaksi)
      .where(
        and(
          eq(kas_transaksi.id_cabang, idCabang),
          eq(kas_transaksi.tipe, "MASUK"),
          eq(kas_transaksi.tanggal, today),
          eq(kas_transaksi.status, "APPROVED")
        )
      );

    // 3. Kas keluar hari ini
    const [keluarRes] = await db
      .select({ total: sql<number>`sum(nominal)` })
      .from(kas_transaksi)
      .where(
        and(
          eq(kas_transaksi.id_cabang, idCabang),
          eq(kas_transaksi.tipe, "KELUAR"),
          eq(kas_transaksi.tanggal, today),
          eq(kas_transaksi.status, "APPROVED")
        )
      );

    // 4. Shift OPEN kasir
    const openShifts = await db
      .select({ count: sql<number>`count(*)` })
      .from(kasir_shift)
      .where(and(eq(kasir_shift.id_cabang, idCabang), eq(kasir_shift.status, "OPEN")));

    // 5. Rekonsiliasi pending
    const pendingRekon = await db
      .select({ count: sql<number>`count(*)` })
      .from(rekonsiliasi_kas)
      .innerJoin(rekening_kas, eq(rekonsiliasi_kas.id_rekening, rekening_kas.id))
      .where(and(eq(rekening_kas.id_cabang, idCabang), eq(rekonsiliasi_kas.status, "PENDING")));

    // 6. Mutasi terbaru (10 transaksi)
    const recentTx = await db
      .select({
        id: kas_transaksi.id,
        nomor_transaksi: kas_transaksi.nomor_transaksi,
        nama_rekening: rekening_kas.nama,
        tipe: kas_transaksi.tipe,
        kategori: kas_transaksi.kategori,
        nominal: kas_transaksi.nominal,
        tanggal: kas_transaksi.tanggal,
        keterangan: kas_transaksi.keterangan,
      })
      .from(kas_transaksi)
      .innerJoin(rekening_kas, eq(kas_transaksi.id_rekening, rekening_kas.id))
      .where(eq(kas_transaksi.id_cabang, idCabang))
      .orderBy(desc(kas_transaksi.id))
      .limit(10);

    return c.json({
      success: true,
      data: {
        totalSaldo: saldoRes?.total || 0,
        kasMasukHariIni: masukRes?.total || 0,
        kasKeluarHariIni: keluarRes?.total || 0,
        jumlahShiftBuka: openShifts[0]?.count || 0,
        rekonsiliasiPending: pendingRekon[0]?.count || 0,
        mutasiTerbaru: recentTx,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==========================================
// 5. TRANSFER KAS
// ==========================================

// GET /transfer - List transfer kas
kasRoutes.get("/transfer", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 400);
  }

  try {
    const data = await db
      .select({
        id: kas_transaksi.id,
        nomor_transaksi: kas_transaksi.nomor_transaksi,
        id_rekening: kas_transaksi.id_rekening,
        nama_rekening_asal: rekening_kas.nama,
        kode_rekening_asal: rekening_kas.kode,
        id_rekening_tujuan: kas_transaksi.id_rekening_tujuan,
        nominal: kas_transaksi.nominal,
        tanggal: kas_transaksi.tanggal,
        keterangan: kas_transaksi.keterangan,
        status: kas_transaksi.status,
        created_by_nama: users.nama_user,
      })
      .from(kas_transaksi)
      .innerJoin(rekening_kas, eq(kas_transaksi.id_rekening, rekening_kas.id))
      .leftJoin(users, eq(kas_transaksi.created_by, users.id))
      .where(
        and(
          eq(kas_transaksi.tipe, "TRANSFER"),
          eq(kas_transaksi.id_cabang, idCabang)
        )
      )
      .orderBy(desc(kas_transaksi.id));

    // Dapatkan nama rekening tujuan secara manual karena Hono-Drizzle join ganda ke tabel sama
    const result = [];
    for (const item of data) {
      let namaTujuan = "—";
      let kodeTujuan = "—";
      if (item.id_rekening_tujuan) {
        const [rekTujuan] = await db
          .select()
          .from(rekening_kas)
          .where(eq(rekening_kas.id, item.id_rekening_tujuan))
          .limit(1);
        if (rekTujuan) {
          namaTujuan = rekTujuan.nama;
          kodeTujuan = rekTujuan.kode;
        }
      }
      result.push({
        ...item,
        nama_rekening_tujuan: namaTujuan,
        kode_rekening_tujuan: kodeTujuan,
      });
    }

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /transfer - Buat transfer kas baru
kasRoutes.post("/transfer", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;
  const idUser = activeUser.id;

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 401);
  }

  try {
    const body = await c.req.json();
    const { id_rekening_asal, id_rekening_tujuan, nominal, tanggal, keterangan } = body;

    const parsedNominal = parseInt(nominal) || 0;
    const rekAsalId = parseInt(id_rekening_asal);
    const rekTujuanId = parseInt(id_rekening_tujuan);

    if (isNaN(rekAsalId) || isNaN(rekTujuanId) || parsedNominal <= 0 || !tanggal) {
      return c.json({ success: false, error: "Parameter transfer tidak valid" }, 400);
    }

    if (rekAsalId === rekTujuanId) {
      return c.json({ success: false, error: "Rekening asal dan tujuan tidak boleh sama" }, 400);
    }

    // Ambil rekening asal
    const [rekeningAsal] = await db
      .select()
      .from(rekening_kas)
      .where(eq(rekening_kas.id, rekAsalId))
      .limit(1);

    if (!rekeningAsal) {
      return c.json({ success: false, error: "Rekening asal tidak ditemukan" }, 404);
    }

    if (rekeningAsal.id_cabang !== idCabang) {
      return c.json({ success: false, error: "Rekening asal bukan milik cabang ini" }, 403);
    }

    // Cek kecukupan saldo
    if (rekeningAsal.saldo < parsedNominal) {
      return c.json({
        success: false,
        error: `Saldo rekening asal tidak mencukupi. Saldo saat ini: ${rekeningAsal.saldo}`,
      }, 400);
    }

    // Cek rekening tujuan
    const [rekeningTujuan] = await db
      .select()
      .from(rekening_kas)
      .where(eq(rekening_kas.id, rekTujuanId))
      .limit(1);

    if (!rekeningTujuan) {
      return c.json({ success: false, error: "Rekening tujuan tidak ditemukan" }, 404);
    }

    const todayStr = tanggal.replace(/-/g, "");

    const result = await db.transaction(async (tx) => {
      // 0. Acquire advisory lock on branch level to prevent race condition on transaction number generation
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${idCabang})`);

      // 1. Generate nomor transaksi
      const [countResult] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(kas_transaksi)
        .where(
          and(
            eq(kas_transaksi.id_cabang, idCabang),
            eq(kas_transaksi.tipe, "TRANSFER"),
            eq(kas_transaksi.tanggal, tanggal)
          )
        );

      const sequence = (countResult?.count || 0) + 1;
      const noTransaksi = `TRF/${todayStr}/${idCabang}/${String(sequence).padStart(4, "0")}`;

      // 2. Insert kas_transaksi (tipe TRANSFER, status PENDING/DRAFT)
      const [newTx] = await tx
        .insert(kas_transaksi)
        .values({
          nomor_transaksi: noTransaksi,
          id_rekening: rekAsalId,
          id_cabang: idCabang,
          tipe: "TRANSFER",
          kategori: "LAIN",
          nominal: parsedNominal,
          tanggal,
          keterangan: keterangan || `Transfer kas ke ${rekeningTujuan.nama}`,
          id_rekening_tujuan: rekTujuanId,
          status: "PENDING", // Menunggu konfirmasi penerimaan
          created_by: idUser,
        })
        .returning();

      // 3. Potong saldo rekening asal langsung saat transfer diajukan
      await tx
        .update(rekening_kas)
        .set({
          saldo: sql`saldo - ${parsedNominal}`,
          updated_at: new Date().toISOString(),
        })
        .where(eq(rekening_kas.id, rekAsalId));

      return newTx;
    });

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /transfer/:id/konfirmasi - Konfirmasi penerimaan transfer
kasRoutes.put("/transfer/:id/konfirmasi", async (c) => {
  const activeUser = c.get("user");
  const idUser = activeUser.id;
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) {
    return c.json({ success: false, error: "ID Transfer tidak valid" }, 400);
  }

  try {
    const [transaksi] = await db
      .select()
      .from(kas_transaksi)
      .where(eq(kas_transaksi.id, id))
      .limit(1);

    if (!transaksi || transaksi.tipe !== "TRANSFER") {
      return c.json({ success: false, error: "Transaksi transfer tidak ditemukan" }, 404);
    }

    if (transaksi.status !== "PENDING") {
      return c.json({ success: false, error: "Transfer ini sudah dikonfirmasi atau dibatalkan" }, 400);
    }

    if (!transaksi.id_rekening_tujuan) {
      return c.json({ success: false, error: "Rekening tujuan tidak terdefinisi" }, 400);
    }

    // Ambil info rekening tujuan untuk validasi cabang
    const [rekeningTujuan] = await db
      .select()
      .from(rekening_kas)
      .where(eq(rekening_kas.id, transaksi.id_rekening_tujuan))
      .limit(1);

    if (!rekeningTujuan) {
      return c.json({ success: false, error: "Rekening tujuan tidak ditemukan" }, 404);
    }

    // Validasi cabang: User pengkonfirmasi harus berasal dari cabang penerima (atau admin pusat)
    if (activeUser.id_cabang && rekeningTujuan.id_cabang !== activeUser.id_cabang) {
      return c.json({ success: false, error: "Anda tidak memiliki akses untuk mengkonfirmasi transfer ke cabang lain" }, 403);
    }

    const result = await db.transaction(async (tx) => {
      // 1. Update status transaksi menjadi APPROVED
      const [updatedTx] = await tx
        .update(kas_transaksi)
        .set({
          status: "APPROVED",
          approved_by: idUser,
        })
        .where(eq(kas_transaksi.id, id))
        .returning();

      // 2. Tambah saldo rekening tujuan
      await tx
        .update(rekening_kas)
        .set({
          saldo: sql`saldo + ${transaksi.nominal}`,
          updated_at: new Date().toISOString(),
        })
        .where(eq(rekening_kas.id, transaksi.id_rekening_tujuan));

      // 3. Integrasi Jurnal Akuntansi double-entry (Debit Kas Tujuan, Kredit Kas Asal)
      const [rekAsal] = await tx
        .select()
        .from(rekening_kas)
        .where(eq(rekening_kas.id, transaksi.id_rekening))
        .limit(1);

      const [rekTujuan] = await tx
        .select()
        .from(rekening_kas)
        .where(eq(rekening_kas.id, transaksi.id_rekening_tujuan))
        .limit(1);

      if (rekAsal?.id_akun_coa && rekTujuan?.id_akun_coa) {
        // Line 1: Debit Rekening Tujuan
        await tx.insert(jurnal_umum).values({
          tanggal_transaksi: transaksi.tanggal,
          no_referensi_bukti: transaksi.nomor_transaksi,
          deskripsi: transaksi.keterangan || `Transfer masuk dari ${rekAsal.nama}`,
          akun_id: rekTujuan.id_akun_coa,
          cabang_id: transaksi.id_cabang,
          debit: transaksi.nominal,
          kredit: 0,
          dibuat_oleh: idUser,
        });

        // Line 2: Kredit Rekening Asal
        await tx.insert(jurnal_umum).values({
          tanggal_transaksi: transaksi.tanggal,
          no_referensi_bukti: transaksi.nomor_transaksi,
          deskripsi: transaksi.keterangan || `Transfer keluar ke ${rekTujuan.nama}`,
          akun_id: rekAsal.id_akun_coa,
          cabang_id: transaksi.id_cabang,
          debit: 0,
          kredit: transaksi.nominal,
          dibuat_oleh: idUser,
        });
      }

      return updatedTx;
    });

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==========================================
// 6. REKONSILIASI KAS
// ==========================================

// GET /rekonsiliasi - List rekonsiliasi kas
kasRoutes.get("/rekonsiliasi", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 400);
  }

  try {
    const data = await db
      .select({
        id: rekonsiliasi_kas.id,
        id_rekening: rekonsiliasi_kas.id_rekening,
        nama_rekening: rekening_kas.nama,
        kode_rekening: rekening_kas.kode,
        tanggal: rekonsiliasi_kas.tanggal,
        saldo_sistem: rekonsiliasi_kas.saldo_sistem,
        saldo_fisik: rekonsiliasi_kas.saldo_fisik,
        selisih: rekonsiliasi_kas.selisih,
        alasan: rekonsiliasi_kas.alasan,
        bukti: rekonsiliasi_kas.bukti,
        status: rekonsiliasi_kas.status,
        created_by_nama: users.nama_user,
      })
      .from(rekonsiliasi_kas)
      .innerJoin(rekening_kas, eq(rekonsiliasi_kas.id_rekening, rekening_kas.id))
      .leftJoin(users, eq(rekonsiliasi_kas.created_by, users.id))
      .where(eq(rekening_kas.id_cabang, idCabang))
      .orderBy(desc(rekonsiliasi_kas.id));

    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /rekonsiliasi - Submit rekonsiliasi baru
kasRoutes.post("/rekonsiliasi", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;
  const idUser = activeUser.id;

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 401);
  }

  try {
    const body = await c.req.json();
    const { id_rekening, tanggal, saldo_fisik, alasan, bukti } = body;

    const rekId = parseInt(id_rekening);
    const sFisik = parseInt(saldo_fisik);

    if (isNaN(rekId) || isNaN(sFisik) || !tanggal) {
      return c.json({ success: false, error: "Parameter rekonsiliasi tidak valid" }, 400);
    }

    // Ambil detail rekening saat ini
    const [rekening] = await db
      .select()
      .from(rekening_kas)
      .where(eq(rekening_kas.id, rekId))
      .limit(1);

    if (!rekening) {
      return c.json({ success: false, error: "Rekening kas tidak ditemukan" }, 404);
    }

    if (rekening.id_cabang !== idCabang) {
      return c.json({ success: false, error: "Rekening kas bukan milik cabang ini" }, 403);
    }

    const selisih = sFisik - rekening.saldo;

    const [newRekon] = await db
      .insert(rekonsiliasi_kas)
      .values({
        id_rekening: rekId,
        tanggal,
        saldo_sistem: rekening.saldo,
        saldo_fisik: sFisik,
        selisih,
        alasan,
        bukti,
        status: "PENDING",
        created_by: idUser,
      })
      .returning();

    return c.json({ success: true, data: newRekon });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /rekonsiliasi/:id/approve - Approve atau Reject rekonsiliasi
kasRoutes.put("/rekonsiliasi/:id/approve", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;
  const idUser = activeUser.id;
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) {
    return c.json({ success: false, error: "ID Rekonsiliasi tidak valid" }, 400);
  }

  try {
    const body = await c.req.json();
    const { status } = body; // 'APPROVED' | 'REJECTED'

    if (status !== "APPROVED" && status !== "REJECTED") {
      return c.json({ success: false, error: "Status approval tidak valid" }, 400);
    }

    const [rekon] = await db
      .select()
      .from(rekonsiliasi_kas)
      .where(eq(rekonsiliasi_kas.id, id))
      .limit(1);

    if (!rekon) {
      return c.json({ success: false, error: "Pengajuan rekonsiliasi tidak ditemukan" }, 404);
    }

    if (rekon.status !== "PENDING") {
      return c.json({ success: false, error: "Rekonsiliasi ini sudah diproses" }, 400);
    }

    const result = await db.transaction(async (tx) => {
      const [rekening] = await tx
        .select()
        .from(rekening_kas)
        .where(eq(rekening_kas.id, rekon.id_rekening))
        .limit(1);

      if (!rekening) {
        throw new Error("Rekening kas tidak ditemukan");
      }

      // Hitung ulang saldo sistem realtime pada tanggal rekonsiliasi untuk menghindari ketidaksinkronan
      const [masukSebelum] = await tx
        .select({ sum: sql<number>`sum(nominal)` })
        .from(kas_transaksi)
        .where(
          and(
            eq(kas_transaksi.id_rekening, rekon.id_rekening),
            eq(kas_transaksi.tipe, "MASUK"),
            eq(kas_transaksi.status, "APPROVED"),
            lte(kas_transaksi.tanggal, rekon.tanggal)
          )
        );

      const [keluarSebelum] = await tx
        .select({ sum: sql<number>`sum(nominal)` })
        .from(kas_transaksi)
        .where(
          and(
            eq(kas_transaksi.id_rekening, rekon.id_rekening),
            eq(kas_transaksi.tipe, "KELUAR"),
            eq(kas_transaksi.status, "APPROVED"),
            lte(kas_transaksi.tanggal, rekon.tanggal)
          )
        );

      const [trfKeluarSebelum] = await tx
        .select({ sum: sql<number>`sum(nominal)` })
        .from(kas_transaksi)
        .where(
          and(
            eq(kas_transaksi.id_rekening, rekon.id_rekening),
            eq(kas_transaksi.tipe, "TRANSFER"),
            eq(kas_transaksi.status, "APPROVED"),
            lte(kas_transaksi.tanggal, rekon.tanggal)
          )
        );

      const [trfMasukSebelum] = await tx
        .select({ sum: sql<number>`sum(nominal)` })
        .from(kas_transaksi)
        .where(
          and(
            eq(kas_transaksi.id_rekening_tujuan, rekon.id_rekening),
            eq(kas_transaksi.tipe, "TRANSFER"),
            eq(kas_transaksi.status, "APPROVED"),
            lte(kas_transaksi.tanggal, rekon.tanggal)
          )
        );

      const saldoSistemRealtime =
        rekening.saldo_awal +
        (masukSebelum?.sum || 0) +
        (trfMasukSebelum?.sum || 0) -
        (keluarSebelum?.sum || 0) -
        (trfKeluarSebelum?.sum || 0);

      const realtimeSelisih = rekon.saldo_fisik - saldoSistemRealtime;

      // 1. Update status rekonsiliasi
      const [updatedRekon] = await tx
        .update(rekonsiliasi_kas)
        .set({
          status,
          saldo_sistem: saldoSistemRealtime,
          selisih: realtimeSelisih,
          approved_by: idUser,
          approved_at: new Date().toISOString(),
        })
        .where(eq(rekonsiliasi_kas.id, id))
        .returning();

      // 2. Jika APPROVED dan ada selisih, lakukan koreksi saldo & catat mutasi transaksi
      if (status === "APPROVED" && realtimeSelisih !== 0) {
        const absoluteSelisih = Math.abs(realtimeSelisih);
        const isKelebihan = realtimeSelisih > 0;
        const tipeTx = isKelebihan ? "MASUK" : "KELUAR";

        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const prefix = isKelebihan ? "KM" : "KK";
        const noTx = `${prefix}/ADJ/${todayStr}/${idCabang}/${rekon.id}`;

        // A. Insert kas_transaksi penyesuaian
        await tx.insert(kas_transaksi).values({
          nomor_transaksi: noTx,
          id_rekening: rekon.id_rekening,
          id_cabang: idCabang,
          tipe: tipeTx,
          kategori: "LAIN",
          nominal: absoluteSelisih,
          tanggal: rekon.tanggal,
          keterangan: `Penyesuaian saldo rekonsiliasi: ${rekon.alasan || "Tanpa alasan"}`,
          status: "APPROVED",
          referensi_type: "MANUAL",
          referensi_id: rekon.id,
          created_by: rekon.created_by,
        });

        // B. Update saldo rekening kas
        await tx
          .update(rekening_kas)
          .set({
            saldo: sql`saldo + ${realtimeSelisih}`,
            updated_at: new Date().toISOString(),
          })
          .where(eq(rekening_kas.id, rekon.id_rekening));

        // C. Jurnal Akuntansi Koreksi
        // Akun Kas
        const coaKas = rekening.id_akun_coa;
        // Akun Beban/Pendapatan Koreksi (Gunakan settings dinamis)
        const coaPenjualanSetting = await tx
          .select()
          .from(pengaturan_aplikasi)
          .where(eq(pengaturan_aplikasi.key, "coa_kategori_penjualan"))
          .limit(1);
        const coaOperasionalSetting = await tx
          .select()
          .from(pengaturan_aplikasi)
          .where(eq(pengaturan_aplikasi.key, "coa_kategori_operasional"))
          .limit(1);

        const coaPenjualan = coaPenjualanSetting[0] ? parseInt(coaPenjualanSetting[0].value) || 7 : 7;
        const coaOperasional = coaOperasionalSetting[0] ? parseInt(coaOperasionalSetting[0].value) || 10 : 10;

        const coaLawan = isKelebihan ? coaPenjualan : coaOperasional;

        if (coaKas) {
          await tx.insert(jurnal_umum).values({
            tanggal_transaksi: rekon.tanggal,
            no_referensi_bukti: noTx,
            deskripsi: `Koreksi Rekonsiliasi Kas: ${rekon.alasan || "Tanpa alasan"}`,
            akun_id: isKelebihan ? coaKas : coaLawan,
            cabang_id: idCabang,
            debit: absoluteSelisih,
            kredit: 0,
            dibuat_oleh: idUser,
          });

          await tx.insert(jurnal_umum).values({
            tanggal_transaksi: rekon.tanggal,
            no_referensi_bukti: noTx,
            deskripsi: `Koreksi Rekonsiliasi Kas: ${rekon.alasan || "Tanpa alasan"}`,
            akun_id: isKelebihan ? coaLawan : coaKas,
            cabang_id: idCabang,
            debit: 0,
            kredit: absoluteSelisih,
            dibuat_oleh: idUser,
          });
        }
      }

      return updatedRekon;
    });

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ==========================================
// 7. LAPORAN MUTASI KAS (BUKU KAS)
// ==========================================
kasRoutes.get("/laporan", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const idRekening = c.req.query("id_rekening");

  if (!idCabang) {
    return c.json({ success: false, error: "Cabang tidak teridentifikasi" }, 400);
  }

  if (!startDate || !endDate) {
    return c.json({ success: false, error: "Periode tanggal wajib diisi" }, 400);
  }

  try {
    const rekId = idRekening ? parseInt(idRekening) : null;

    // 1. Dapatkan rekening yang sesuai
    const rekList = await db
      .select()
      .from(rekening_kas)
      .where(
        and(
          eq(rekening_kas.id_cabang, idCabang),
          rekId ? eq(rekening_kas.id, rekId) : undefined
        )
      );

    const reports = [];

    for (const rek of rekList) {
      // Hitung saldo awal sebelum startDate
      // Transaksi masuk (+)
      const [masukSebelum] = await db
        .select({ sum: sql<number>`sum(nominal)` })
        .from(kas_transaksi)
        .where(
          and(
            eq(kas_transaksi.id_rekening, rek.id),
            eq(kas_transaksi.tipe, "MASUK"),
            eq(kas_transaksi.status, "APPROVED"),
            lt(kas_transaksi.tanggal, startDate)
          )
        );

      // Transaksi keluar (-)
      const [keluarSebelum] = await db
        .select({ sum: sql<number>`sum(nominal)` })
        .from(kas_transaksi)
        .where(
          and(
            eq(kas_transaksi.id_rekening, rek.id),
            eq(kas_transaksi.tipe, "KELUAR"),
            eq(kas_transaksi.status, "APPROVED"),
            lt(kas_transaksi.tanggal, startDate)
          )
        );

      // Transfer keluar (-)
      const [trfKeluarSebelum] = await db
        .select({ sum: sql<number>`sum(nominal)` })
        .from(kas_transaksi)
        .where(
          and(
            eq(kas_transaksi.id_rekening, rek.id),
            eq(kas_transaksi.tipe, "TRANSFER"),
            eq(kas_transaksi.status, "APPROVED"),
            lt(kas_transaksi.tanggal, startDate)
          )
        );

      // Transfer masuk (+)
      const [trfMasukSebelum] = await db
        .select({ sum: sql<number>`sum(nominal)` })
        .from(kas_transaksi)
        .where(
          and(
            eq(kas_transaksi.id_rekening_tujuan, rek.id),
            eq(kas_transaksi.tipe, "TRANSFER"),
            eq(kas_transaksi.status, "APPROVED"),
            lt(kas_transaksi.tanggal, startDate)
          )
        );

      const saldoAwal =
        rek.saldo_awal +
        (masukSebelum?.sum || 0) +
        (trfMasukSebelum?.sum || 0) -
        (keluarSebelum?.sum || 0) -
        (trfKeluarSebelum?.sum || 0);

      // Dapatkan mutasi selama periode
      const mutations = await db
        .select({
          id: kas_transaksi.id,
          nomor_transaksi: kas_transaksi.nomor_transaksi,
          tipe: kas_transaksi.tipe,
          kategori: kas_transaksi.kategori,
          nominal: kas_transaksi.nominal,
          tanggal: kas_transaksi.tanggal,
          keterangan: kas_transaksi.keterangan,
          id_rekening_tujuan: kas_transaksi.id_rekening_tujuan,
        })
        .from(kas_transaksi)
        .where(
          and(
            eq(kas_transaksi.status, "APPROVED"),
            or(
              eq(kas_transaksi.id_rekening, rek.id),
              and(
                eq(kas_transaksi.id_rekening_tujuan, rek.id),
                eq(kas_transaksi.tipe, "TRANSFER")
              )
            ),
            between(kas_transaksi.tanggal, startDate, endDate)
          )
        )
        .orderBy(asc(kas_transaksi.tanggal), asc(kas_transaksi.id));

      let totalMasuk = 0;
      let totalKeluar = 0;
      const formattedMutations = [];

      for (const m of mutations) {
        let isDebit = false;
        let isCredit = false;

        if (m.tipe === "MASUK") {
          isDebit = true;
          totalMasuk += m.nominal;
        } else if (m.tipe === "KELUAR") {
          isCredit = true;
          totalKeluar += m.nominal;
        } else if (m.tipe === "TRANSFER") {
          if (m.id_rekening_tujuan === rek.id) {
            isDebit = true;
            totalMasuk += m.nominal;
          } else {
            isCredit = true;
            totalKeluar += m.nominal;
          }
        }

        formattedMutations.push({
          id: m.id,
          nomor_transaksi: m.nomor_transaksi,
          tanggal: m.tanggal,
          keterangan: m.keterangan,
          debit: isDebit ? m.nominal : 0,
          kredit: isCredit ? m.nominal : 0,
        });
      }

      const saldoAkhir = saldoAwal + totalMasuk - totalKeluar;

      reports.push({
        rekening: {
          id: rek.id,
          kode: rek.kode,
          nama: rek.nama,
        },
        saldoAwal,
        totalMasuk,
        totalKeluar,
        saldoAkhir,
        mutations: formattedMutations,
      });
    }

    return c.json({ success: true, reports });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// PUT /transaksi/:id/approve - Approve pending cash out transaction
kasRoutes.put("/transaksi/:id/approve", async (c) => {
  const activeUser = c.get("user");
  const idCabang = activeUser.id_cabang;
  const idUser = activeUser.id;
  const id = parseInt(c.req.param("id"));

  if (isNaN(id)) {
    return c.json({ success: false, error: "ID Transaksi tidak valid" }, 400);
  }

  try {
    const [txRecord] = await db
      .select()
      .from(kas_transaksi)
      .where(eq(kas_transaksi.id, id))
      .limit(1);

    if (!txRecord) {
      return c.json({ success: false, error: "Transaksi tidak ditemukan" }, 404);
    }

    if (txRecord.status !== "PENDING" || txRecord.tipe !== "KELUAR") {
      return c.json({ success: false, error: "Transaksi tidak dalam status PENDING atau bukan tipe KELUAR" }, 400);
    }

    // Ambil rekening kas
    const [rekening] = await db
      .select()
      .from(rekening_kas)
      .where(eq(rekening_kas.id, txRecord.id_rekening))
      .limit(1);

    if (!rekening) {
      return c.json({ success: false, error: "Rekening kas tidak ditemukan" }, 404);
    }

    // Validasi saldo
    if (rekening.saldo < txRecord.nominal) {
      return c.json({ success: false, error: `Saldo tidak mencukupi untuk melakukan approval. Saldo saat ini: ${rekening.saldo}` }, 400);
    }

    const result = await db.transaction(async (tx) => {
      // 1. Update status transaksi menjadi APPROVED
      const [updatedTx] = await tx
        .update(kas_transaksi)
        .set({
          status: "APPROVED",
          approved_by: idUser,
        })
        .where(eq(kas_transaksi.id, id))
        .returning();

      // 2. Potong saldo rekening kas
      await tx
        .update(rekening_kas)
        .set({
          saldo: sql`saldo - ${txRecord.nominal}`,
          updated_at: new Date().toISOString(),
        })
        .where(eq(rekening_kas.id, txRecord.id_rekening));

      // 3. Jurnal Akuntansi double entry
      const coaKredit = rekening.id_akun_coa;
      const coaDebit = await getCoaCounterAccount(tx, txRecord.kategori || "LAIN");

      if (coaKredit) {
        // Line 1: Debit Akun Lawan
        await tx.insert(jurnal_umum).values({
          tanggal_transaksi: txRecord.tanggal,
          no_referensi_bukti: txRecord.nomor_transaksi,
          deskripsi: txRecord.keterangan || `Kas Keluar (Approved): ${txRecord.nomor_transaksi}`,
          akun_id: coaDebit,
          cabang_id: idCabang || txRecord.id_cabang,
          debit: txRecord.nominal,
          kredit: 0,
          dibuat_oleh: txRecord.created_by || idUser,
        });

        // Line 2: Kredit Akun Kas
        await tx.insert(jurnal_umum).values({
          tanggal_transaksi: txRecord.tanggal,
          no_referensi_bukti: txRecord.nomor_transaksi,
          deskripsi: txRecord.keterangan || `Kas Keluar (Approved): ${txRecord.nomor_transaksi}`,
          akun_id: coaKredit,
          cabang_id: idCabang || txRecord.id_cabang,
          debit: 0,
          kredit: txRecord.nominal,
          dibuat_oleh: txRecord.created_by || idUser,
        });
      }

      return updatedTx;
    });

    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});


