import { Hono } from "hono";
import { db } from "../lib/db";
import {
  investor_profil,
  investor_transaksi_modal,
  investor_bagi_hasil,
  investor_bagi_hasil_cabang,
  investor_bagi_hasil_member,
  cabang,
  cabang_investor,
  penjualan,
  penjualan_detail,
  jurnal_umum,
  daftar_akun,
  rekening_kas,
  kas_transaksi,
  users,
} from "../lib/db/schema";
import { eq, and, desc, asc, sql, gte, lte, inArray } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";

export const investorRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// Helper untuk format nomor referensi unik
function generateRef(prefix: string) {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${yyyymmdd}-${rand}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DASHBOARD & STATISTIK
// ─────────────────────────────────────────────────────────────────────────────
investorRoutes.get("/dashboard", async (c) => {
  try {
    // 1. Ambil data profil investor
    const [profil] = await db.select().from(investor_profil).limit(1);
    if (!profil) {
      return c.json({ success: false, error: "Profil investor belum diinisialisasi" }, 404);
    }

    // 2. Hitung total setoran modal yang sudah APPROVED
    const [setoran] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${investor_transaksi_modal.nominal} AS NUMERIC)), 0)`,
      })
      .from(investor_transaksi_modal)
      .where(
        and(
          eq(investor_transaksi_modal.id_investor, profil.id),
          eq(investor_transaksi_modal.status, "APPROVED"),
          inArray(investor_transaksi_modal.jenis_transaksi, ["SETORAN_AWAL", "TAMBAHAN_MODAL", "REINVESTASI_BAGI_HASIL"])
        )
      );

    // 3. Hitung total penarikan modal yang sudah APPROVED
    const [penarikan] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${investor_transaksi_modal.nominal} AS NUMERIC)), 0)`,
      })
      .from(investor_transaksi_modal)
      .where(
        and(
          eq(investor_transaksi_modal.id_investor, profil.id),
          eq(investor_transaksi_modal.status, "APPROVED"),
          eq(investor_transaksi_modal.jenis_transaksi, "PENARIKAN_MODAL")
        )
      );

    // 4. Hitung total bagi hasil yang sudah dibayarkan (Transfer Bank)
    const [dividenTransfer] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${investor_bagi_hasil.nominal_transfer} AS NUMERIC)), 0)`,
      })
      .from(investor_bagi_hasil)
      .where(
        and(
          eq(investor_bagi_hasil.id_investor, profil.id),
          inArray(investor_bagi_hasil.status, ["APPROVED", "DIBAYARKAN"])
        )
      );

    // 5. Hitung total bagi hasil yang direinvestasikan ke modal
    const [dividenReinvest] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${investor_bagi_hasil.nominal_reinvestasi} AS NUMERIC)), 0)`,
      })
      .from(investor_bagi_hasil)
      .where(
        and(
          eq(investor_bagi_hasil.id_investor, profil.id),
          inArray(investor_bagi_hasil.status, ["APPROVED", "DIBAYARKAN"])
        )
      );

    // 6. Hitung bagi hasil yang masih PENDING approval
    const [dividenPending] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${investor_bagi_hasil.nominal_hak_investor} AS NUMERIC)), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(investor_bagi_hasil)
      .where(
        and(
          eq(investor_bagi_hasil.id_investor, profil.id),
          eq(investor_bagi_hasil.status, "PENDING")
        )
      );

    // 7. Hitung transaksi modal yang masih PENDING approval
    const [modalPending] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(investor_transaksi_modal)
      .where(
        and(
          eq(investor_transaksi_modal.id_investor, profil.id),
          eq(investor_transaksi_modal.status, "PENDING")
        )
      );

    // 8. Ambil daftar cabang bertipe INVESTOR
    const cabangList = await db
      .select({
        id_cabang: cabang.id_cabang,
        kode_cabang: cabang.kode_cabang,
        nama_cabang: cabang.nama_cabang,
        alamat: cabang.alamat,
      })
      .from(cabang)
      .where(eq(cabang.jenis_cabang, "INVESTOR"))
      .orderBy(cabang.nama_cabang);

    // 9. Riwayat rekapitulasi bagi hasil terakhir (6 periode terakhir)
    const riwayatBagiHasil = await db
      .select()
      .from(investor_bagi_hasil)
      .where(eq(investor_bagi_hasil.id_investor, profil.id))
      .orderBy(desc(investor_bagi_hasil.periode_tahun), desc(investor_bagi_hasil.periode_bulan))
      .limit(6);

    return c.json({
      success: true,
      data: {
        profil,
        ringkasan: {
          saldo_modal_saat_ini: Number(profil.saldo_modal_saat_ini || 0),
          total_setoran_modal: Number(setoran?.total || 0),
          total_penarikan_modal: Number(penarikan?.total || 0),
          total_bagi_hasil_transfer: Number(dividenTransfer?.total || 0),
          total_bagi_hasil_reinvestasi: Number(dividenReinvest?.total || 0),
          total_bagi_hasil_pending: Number(dividenPending?.total || 0),
          jumlah_bagi_hasil_pending: Number(dividenPending?.count || 0),
          jumlah_modal_pending: Number(modalPending?.count || 0),
          akumulasi_defisit: Number(profil.akumulasi_defisit || 0),
          total_cabang_investor: cabangList.length,
        },
        cabang_list: cabangList,
        riwayat_bagi_hasil: riwayatBagiHasil,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal memuat dashboard investor: " + error.message }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. PROFIL & PENGATURAN INVESTOR
// ─────────────────────────────────────────────────────────────────────────────
investorRoutes.get("/profil", async (c) => {
  try {
    let [profil] = await db.select().from(investor_profil).limit(1);
    if (!profil) {
      // Inisialisasi default jika belum ada
      const [inserted] = await db
        .insert(investor_profil)
        .values({
          nama_investor: "Investor Utama Konsorsium Al-Mubarok",
          nomor_identitas: "3509012345670001",
          telepon: "081234567890",
          email: "investor@almubarok.co.id",
          alamat: "Jember, Jawa Timur",
          nama_bank: "Bank Mandiri",
          nomor_rekening: "1430099887766",
          atas_nama_rekening: "Konsorsium Pemodal Al-Mubarok",
          nisbah_pengelola: "40",
          nisbah_investor: "60",
          saldo_modal_saat_ini: "0",
          status: "AKTIF",
        })
        .returning();
      profil = inserted;
    }
    return c.json({ success: true, data: profil });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

investorRoutes.put("/profil", async (c) => {
  try {
    const body = await c.req.json();
    const [profil] = await db.select().from(investor_profil).limit(1);
    if (!profil) {
      return c.json({ success: false, error: "Profil tidak ditemukan" }, 404);
    }

    const nisbahPengelola = parseFloat(body.nisbah_pengelola || "40");
    const nisbahInvestor = parseFloat(body.nisbah_investor || "60");

    if (Math.round(nisbahPengelola + nisbahInvestor) !== 100) {
      return c.json({ success: false, error: "Total nisbah pengelola dan investor harus berjumlah 100%" }, 400);
    }

    const [updated] = await db
      .update(investor_profil)
      .set({
        nama_investor: body.nama_investor || profil.nama_investor,
        nomor_identitas: body.nomor_identitas ?? profil.nomor_identitas,
        telepon: body.telepon ?? profil.telepon,
        email: body.email ?? profil.email,
        alamat: body.alamat ?? profil.alamat,
        nama_bank: body.nama_bank || profil.nama_bank,
        nomor_rekening: body.nomor_rekening || profil.nomor_rekening,
        atas_nama_rekening: body.atas_nama_rekening || profil.atas_nama_rekening,
        nisbah_pengelola: String(nisbahPengelola),
        nisbah_investor: String(nisbahInvestor),
        updated_at: new Date().toISOString(),
      })
      .where(eq(investor_profil.id, profil.id))
      .returning();

    return c.json({ success: true, data: updated });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. DAFTAR CABANG BERTIPE INVESTOR & REKENING KAS PERUSAHAAN
// ─────────────────────────────────────────────────────────────────────────────
investorRoutes.get("/cabang-terkait", async (c) => {
  try {
    const list = await db
      .select({
        id_cabang: cabang.id_cabang,
        kode_cabang: cabang.kode_cabang,
        nama_cabang: cabang.nama_cabang,
        alamat: cabang.alamat,
        telepon: cabang.telepon,
        total_modal_investor: cabang.total_modal_investor,
      })
      .from(cabang)
      .where(eq(cabang.jenis_cabang, "INVESTOR"))
      .orderBy(cabang.nama_cabang);

    return c.json({ success: true, data: list });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

investorRoutes.get("/rekening-kas", async (c) => {
  try {
    const list = await db
      .select({
        id: rekening_kas.id,
        kode: rekening_kas.kode,
        nama: rekening_kas.nama,
        jenis: rekening_kas.jenis,
        saldo: rekening_kas.saldo,
        id_cabang: rekening_kas.id_cabang,
        nama_cabang: cabang.nama_cabang,
      })
      .from(rekening_kas)
      .leftJoin(cabang, eq(rekening_kas.id_cabang, cabang.id_cabang))
      .where(eq(rekening_kas.is_active, true))
      .orderBy(rekening_kas.jenis, rekening_kas.nama);

    return c.json({ success: true, data: list });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. TRANSAKSI MODAL (SETORAN & PENARIKAN) — MAKER & CHECKER
// ─────────────────────────────────────────────────────────────────────────────
investorRoutes.get("/transaksi-modal", async (c) => {
  try {
    const statusFilter = c.req.query("status"); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
    const limit = parseInt(c.req.query("limit") || "50");

    let query = db
      .select({
        id: investor_transaksi_modal.id,
        nomor_referensi: investor_transaksi_modal.nomor_referensi,
        jenis_transaksi: investor_transaksi_modal.jenis_transaksi,
        tanggal_transaksi: investor_transaksi_modal.tanggal_transaksi,
        nominal: investor_transaksi_modal.nominal,
        keterangan: investor_transaksi_modal.keterangan,
        bukti_lampiran: investor_transaksi_modal.bukti_lampiran,
        status: investor_transaksi_modal.status,
        tanggal_persetujuan: investor_transaksi_modal.tanggal_persetujuan,
        catatan_persetujuan: investor_transaksi_modal.catatan_persetujuan,
        created_at: investor_transaksi_modal.created_at,
        id_rekening_kas: investor_transaksi_modal.id_rekening_kas,
        nama_rekening_kas: rekening_kas.nama,
        kode_rekening_kas: rekening_kas.kode,
        nama_pengaju: users.nama_user,
      })
      .from(investor_transaksi_modal)
      .leftJoin(rekening_kas, eq(investor_transaksi_modal.id_rekening_kas, rekening_kas.id))
      .leftJoin(users, eq(investor_transaksi_modal.diajukan_oleh, users.id))
      .orderBy(desc(investor_transaksi_modal.id))
      .limit(limit);

    if (statusFilter && statusFilter !== "ALL") {
      // @ts-ignore
      query = query.where(eq(investor_transaksi_modal.status, statusFilter));
    }

    const data = await query;
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Maker: Input permohonan setoran/tarik modal
investorRoutes.post("/transaksi-modal", async (c) => {
  try {
    const activeUser = c.get("user");
    const body = await c.req.json();

    const [profil] = await db.select().from(investor_profil).limit(1);
    if (!profil) {
      return c.json({ success: false, error: "Profil investor tidak ditemukan" }, 404);
    }

    const jenis = body.jenis_transaksi; // 'SETORAN_AWAL' | 'TAMBAHAN_MODAL' | 'PENARIKAN_MODAL'
    if (!["SETORAN_AWAL", "TAMBAHAN_MODAL", "PENARIKAN_MODAL"].includes(jenis)) {
      return c.json({ success: false, error: "Jenis transaksi tidak valid" }, 400);
    }

    const nominal = Math.round(parseFloat(body.nominal || "0"));
    if (nominal <= 0) {
      return c.json({ success: false, error: "Nominal harus lebih besar dari 0" }, 400);
    }

    // Jika penarikan modal, validasi batas saldo modal saat ini
    if (jenis === "PENARIKAN_MODAL") {
      const saldoSaatIni = parseFloat(profil.saldo_modal_saat_ini || "0");
      if (nominal > saldoSaatIni) {
        return c.json(
          {
            success: false,
            error: `Nominal penarikan (Rp ${nominal.toLocaleString("id-ID")}) melebihi saldo modal saat ini (Rp ${saldoSaatIni.toLocaleString("id-ID")})`,
          },
          400
        );
      }
    }

    const idRekening = body.id_rekening_kas ? parseInt(body.id_rekening_kas) : null;
    if (!idRekening) {
      return c.json({ success: false, error: "Rekening kas/bank wajib dipilih" }, 400);
    }

    const nomorRef = generateRef("INV-CAP");

    const [inserted] = await db
      .insert(investor_transaksi_modal)
      .values({
        nomor_referensi: nomorRef,
        id_investor: profil.id,
        jenis_transaksi: jenis,
        tanggal_transaksi: body.tanggal_transaksi || new Date().toISOString().slice(0, 10),
        nominal: String(nominal),
        id_rekening_kas: idRekening,
        keterangan: body.keterangan || (jenis === "PENARIKAN_MODAL" ? "Penarikan Modal Investor" : "Setoran Modal Investor"),
        bukti_lampiran: body.bukti_lampiran || null,
        status: "PENDING",
        diajukan_oleh: activeUser.id,
      })
      .returning();

    return c.json({
      success: true,
      message: "Permohonan transaksi modal berhasil diajukan dan menunggu persetujuan (Checker).",
      data: inserted,
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Checker: Persetujuan transaksi modal (Approve)
investorRoutes.post("/transaksi-modal/:id/approve", async (c) => {
  try {
    const activeUser = c.get("user");
    const id = parseInt(c.req.param("id"));

    const [trx] = await db
      .select()
      .from(investor_transaksi_modal)
      .where(eq(investor_transaksi_modal.id, id))
      .limit(1);

    if (!trx) {
      return c.json({ success: false, error: "Transaksi tidak ditemukan" }, 404);
    }

    if (trx.status !== "PENDING") {
      return c.json({ success: false, error: `Transaksi sudah berstatus ${trx.status}` }, 400);
    }

    const [profil] = await db
      .select()
      .from(investor_profil)
      .where(eq(investor_profil.id, trx.id_investor))
      .limit(1);

    if (!profil) {
      return c.json({ success: false, error: "Profil investor tidak ditemukan" }, 404);
    }

    // Ambil data rekening kas
    const [rek] = await db
      .select()
      .from(rekening_kas)
      .where(eq(rekening_kas.id, trx.id_rekening_kas!))
      .limit(1);

    if (!rek) {
      return c.json({ success: false, error: "Rekening kas tidak ditemukan" }, 404);
    }

    // Cari akun COA Modal Disetor (3.101.01)
    let [akunModal] = await db
      .select()
      .from(daftar_akun)
      .where(eq(daftar_akun.kode_akun, "3.101.01"))
      .limit(1);

    if (!akunModal) {
      // Fallback cari tipe akun ekuitas
      [akunModal] = await db
        .select()
        .from(daftar_akun)
        .where(eq(daftar_akun.tipe_akun_id, 3))
        .limit(1);
    }

    const nominal = Math.round(parseFloat(trx.nominal));
    const isPenarikan = trx.jenis_transaksi === "PENARIKAN_MODAL";
    const tgl = trx.tanggal_transaksi;

    // 1. Catat mutasi kas di kas_transaksi
    const nomorKasTrx = generateRef("KAS-INV");
    const [kasTrx] = await db
      .insert(kas_transaksi)
      .values({
        nomor_transaksi: nomorKasTrx,
        id_rekening: rek.id,
        id_cabang: rek.id_cabang,
        tipe: isPenarikan ? "KELUAR" : "MASUK",
        kategori: "LAIN",
        nominal: nominal,
        tanggal: tgl,
        keterangan: `${trx.keterangan || "Transaksi Modal Investor"} [${trx.nomor_referensi}]`,
        referensi_type: "MANUAL",
        referensi_id: trx.id,
        status: "APPROVED",
        created_by: activeUser.id,
        approved_by: activeUser.id,
      })
      .returning();

    // 2. Update saldo rekening kas
    const saldoKasBaru = isPenarikan ? rek.saldo - nominal : rek.saldo + nominal;
    await db
      .update(rekening_kas)
      .set({ saldo: saldoKasBaru })
      .where(eq(rekening_kas.id, rek.id));

    // 3. Catat Jurnal Umum seimbang (Debit vs Kredit)
    let idJurnalBaru: number | null = null;
    if (akunModal && rek.id_akun_coa) {
      const deskripsiJurnal = `${isPenarikan ? "Penarikan" : "Setoran"} Modal Investor: ${profil.nama_investor} [${trx.nomor_referensi}]`;

      if (isPenarikan) {
        // Debit: Modal Disetor (3.101.01)
        const [j1] = await db
          .insert(jurnal_umum)
          .values({
            tanggal_transaksi: tgl,
            no_referensi_bukti: trx.nomor_referensi,
            deskripsi: deskripsiJurnal,
            akun_id: akunModal.id,
            cabang_id: rek.id_cabang,
            debit: nominal,
            kredit: 0,
            dibuat_oleh: activeUser.id,
          })
          .returning();
        idJurnalBaru = j1.id;

        // Kredit: Kas / Bank
        await db.insert(jurnal_umum).values({
          tanggal_transaksi: tgl,
          no_referensi_bukti: trx.nomor_referensi,
          deskripsi: deskripsiJurnal,
          akun_id: rek.id_akun_coa,
          cabang_id: rek.id_cabang,
          debit: 0,
          kredit: nominal,
          dibuat_oleh: activeUser.id,
        });
      } else {
        // Debit: Kas / Bank
        const [j1] = await db
          .insert(jurnal_umum)
          .values({
            tanggal_transaksi: tgl,
            no_referensi_bukti: trx.nomor_referensi,
            deskripsi: deskripsiJurnal,
            akun_id: rek.id_akun_coa,
            cabang_id: rek.id_cabang,
            debit: nominal,
            kredit: 0,
            dibuat_oleh: activeUser.id,
          })
          .returning();
        idJurnalBaru = j1.id;

        // Kredit: Modal Disetor (3.101.01)
        await db.insert(jurnal_umum).values({
          tanggal_transaksi: tgl,
          no_referensi_bukti: trx.nomor_referensi,
          deskripsi: deskripsiJurnal,
          akun_id: akunModal.id,
          cabang_id: rek.id_cabang,
          debit: 0,
          kredit: nominal,
          dibuat_oleh: activeUser.id,
        });
      }
    }

    // 4. Update saldo modal saat ini pada profil investor
    const saldoModalLama = parseFloat(profil.saldo_modal_saat_ini || "0");
    const saldoModalBaru = isPenarikan ? saldoModalLama - nominal : saldoModalLama + nominal;

    await db
      .update(investor_profil)
      .set({
        saldo_modal_saat_ini: String(Math.max(0, saldoModalBaru)),
        updated_at: new Date().toISOString(),
      })
      .where(eq(investor_profil.id, profil.id));

    // 5. Update status transaksi modal menjadi APPROVED
    const [updatedTrx] = await db
      .update(investor_transaksi_modal)
      .set({
        status: "APPROVED",
        id_kas_transaksi: kasTrx.id,
        id_jurnal: idJurnalBaru,
        disetujui_oleh: activeUser.id,
        tanggal_persetujuan: new Date().toISOString(),
        catatan_persetujuan: "Disetujui oleh Checker",
      })
      .where(eq(investor_transaksi_modal.id, id))
      .returning();

    return c.json({
      success: true,
      message: `Transaksi modal ${trx.nomor_referensi} berhasil disetujui, kas & jurnal akuntansi telah diperbarui.`,
      data: updatedTrx,
    });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal menyetujui transaksi modal: " + error.message }, 500);
  }
});

// Checker: Tolak transaksi modal (Reject)
investorRoutes.post("/transaksi-modal/:id/reject", async (c) => {
  try {
    const activeUser = c.get("user");
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const [trx] = await db
      .select()
      .from(investor_transaksi_modal)
      .where(eq(investor_transaksi_modal.id, id))
      .limit(1);

    if (!trx) return c.json({ success: false, error: "Transaksi tidak ditemukan" }, 404);
    if (trx.status !== "PENDING") {
      return c.json({ success: false, error: `Transaksi sudah berstatus ${trx.status}` }, 400);
    }

    const [updated] = await db
      .update(investor_transaksi_modal)
      .set({
        status: "REJECTED",
        disetujui_oleh: activeUser.id,
        tanggal_persetujuan: new Date().toISOString(),
        catatan_persetujuan: body.catatan || "Ditolak oleh manajemen",
      })
      .where(eq(investor_transaksi_modal.id, id))
      .returning();

    return c.json({ success: true, message: "Transaksi modal telah ditolak.", data: updated });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. KALKULASI & PEMBAGIAN BAGI HASIL KONSOLIDASI
// ─────────────────────────────────────────────────────────────────────────────

// Preview / Live Calculate bagi hasil konsolidasi periode tertentu
investorRoutes.get("/bagi-hasil/kalkulasi", async (c) => {
  try {
    const jenisPeriode = c.req.query("jenis_periode") || "TAHUNAN"; // 'TAHUNAN' | 'BULANAN'
    const isTahunan = jenisPeriode === "TAHUNAN";
    const bulan = isTahunan ? 12 : parseInt(c.req.query("bulan") || String(new Date().getMonth() + 1));
    const tahun = parseInt(c.req.query("tahun") || String(new Date().getFullYear()));

    let startDate: string;
    let endDate: string;

    if (isTahunan) {
      startDate = `${tahun}-01-01`;
      endDate = `${tahun}-12-31`;
    } else {
      const strBulan = String(bulan).padStart(2, "0");
      const lastDay = new Date(tahun, bulan, 0).getDate();
      startDate = `${tahun}-${strBulan}-01`;
      endDate = `${tahun}-${strBulan}-${String(lastDay).padStart(2, "0")}`;
    }

    const [profil] = await db.select().from(investor_profil).limit(1);
    if (!profil) {
      return c.json({ success: false, error: "Profil investor tidak ditemukan" }, 404);
    }

    // Ambil daftar seluruh cabang berjenis INVESTOR
    const cabangList = await db
      .select({
        id_cabang: cabang.id_cabang,
        kode_cabang: cabang.kode_cabang,
        nama_cabang: cabang.nama_cabang,
      })
      .from(cabang)
      .where(eq(cabang.jenis_cabang, "INVESTOR"))
      .orderBy(cabang.nama_cabang);

    let grandPenjualanBruto = 0;
    let grandDiskonRetur = 0;
    let grandPenjualanBersih = 0;
    let grandHpp = 0;
    let grandLabaKotor = 0;
    let grandBeban = 0;
    let grandLabaKonsolidasi = 0;

    const breakdownCabang = [];

    for (const cab of cabangList) {
      const cabId = cab.id_cabang;

      // 1. Penjualan POS
      const [salesPOS] = await db
        .select({
          bruto: sql<number>`CAST(SUM(${penjualan.subtotal}) AS INTEGER)`,
          diskon: sql<number>`CAST(SUM(${penjualan.diskon} + ${penjualan.nominal_voucher} + ${penjualan.potongan_poin}) AS INTEGER)`,
        })
        .from(penjualan)
        .where(
          and(
            eq(penjualan.id_cabang, cabId),
            gte(penjualan.tanggal_invoice, startDate),
            lte(penjualan.tanggal_invoice, endDate)
          )
        );

      const valBruto = salesPOS?.bruto || 0;
      const valDiskon = salesPOS?.diskon || 0;
      const valSalesBersih = valBruto - valDiskon;

      // 2. HPP POS
      const [hppPOS] = await db
        .select({
          total_hpp: sql<number>`CAST(SUM(${penjualan_detail.harga_rata_saat_transaksi} * ${penjualan_detail.jumlah} * ${penjualan_detail.isi_satuan}) AS INTEGER)`,
        })
        .from(penjualan_detail)
        .innerJoin(penjualan, eq(penjualan_detail.id_penjualan, penjualan.id_penjualan))
        .where(
          and(
            eq(penjualan.id_cabang, cabId),
            gte(penjualan.tanggal_invoice, startDate),
            lte(penjualan.tanggal_invoice, endDate)
          )
        );

      const valHpp = hppPOS?.total_hpp || 0;
      const valLabaKotor = valSalesBersih - valHpp;

      // 3. Beban Operasional dari Jurnal Umum (Tipe Akun 6)
      const [bebanOperasional] = await db
        .select({
          total: sql<number>`CAST(SUM(${jurnal_umum.debit}) - SUM(${jurnal_umum.kredit}) AS INTEGER)`,
        })
        .from(jurnal_umum)
        .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
        .where(
          and(
            eq(daftar_akun.tipe_akun_id, 6),
            eq(jurnal_umum.cabang_id, cabId),
            gte(jurnal_umum.tanggal_transaksi, startDate),
            lte(jurnal_umum.tanggal_transaksi, endDate)
          )
        );

      const valBeban = bebanOperasional?.total || 0;
      const valLabaOperasional = valLabaKotor - valBeban;

      grandPenjualanBruto += valBruto;
      grandDiskonRetur += valDiskon;
      grandPenjualanBersih += valSalesBersih;
      grandHpp += valHpp;
      grandLabaKotor += valLabaKotor;
      grandBeban += valBeban;
      grandLabaKonsolidasi += valLabaOperasional;

      breakdownCabang.push({
        id_cabang: cab.id_cabang,
        kode_cabang: cab.kode_cabang,
        nama_cabang: cab.nama_cabang,
        penjualan_bruto: valBruto,
        diskon_retur: valDiskon,
        penjualan_bersih: valSalesBersih,
        hpp: valHpp,
        laba_kotor: valLabaKotor,
        beban_operasional: valBeban,
        laba_operasional: valLabaOperasional,
      });
    }

    // Akumulasi Defisit Periode Sebelumnya (Deficit Carryforward)
    const defisitBulanLalu = parseFloat(profil.akumulasi_defisit || "0");

    let labaKenaBagiHasil = 0;
    let defisitTerbawaBerikutnya = 0;

    if (grandLabaKonsolidasi > 0) {
      if (grandLabaKonsolidasi >= defisitBulanLalu) {
        labaKenaBagiHasil = grandLabaKonsolidasi - defisitBulanLalu;
        defisitTerbawaBerikutnya = 0; // Defisit lunas terbayar
      } else {
        labaKenaBagiHasil = 0; // Masih dipakai menutup sebagian defisit
        defisitTerbawaBerikutnya = defisitBulanLalu - grandLabaKonsolidasi;
      }
    } else {
      // Rugi di periode berjalan
      labaKenaBagiHasil = 0;
      defisitTerbawaBerikutnya = defisitBulanLalu + Math.abs(grandLabaKonsolidasi);
    }

    const nisbahPengelola = parseFloat(profil.nisbah_pengelola || "40");
    const nisbahInvestor = parseFloat(profil.nisbah_investor || "60");

    const hakPengelola = Math.round(labaKenaBagiHasil * (nisbahPengelola / 100));
    const hakInvestor = Math.round(labaKenaBagiHasil * (nisbahInvestor / 100));

    // ─────────────────────────────────────────────────────────────
    // Kalkulasi Time-Weighted Capital (Prorata Bulan Aktif Pemodal)
    // ─────────────────────────────────────────────────────────────
    const allMembers = await db
      .select({
        id_cabang_investor: cabang_investor.id_cabang_investor,
        nama_investor: cabang_investor.nama_investor,
        nilai_investasi: sql<number>`CAST(${cabang_investor.nilai_investasi} AS NUMERIC)`,
        tanggal_bergabung: cabang_investor.tanggal_bergabung,
        nama_bank: cabang_investor.nama_bank,
        no_rekening: cabang_investor.no_rekening,
        atas_nama_rekening: cabang_investor.atas_nama_rekening,
        status: cabang_investor.status,
      })
      .from(cabang_investor)
      .where(eq(cabang_investor.status, "AKTIF"))
      .orderBy(desc(cabang_investor.nilai_investasi), asc(cabang_investor.nama_investor));

    let totalBobotKonsorsium = 0;
    const computedMembers = allMembers.map((m) => {
      const modal = Number(m.nilai_investasi || 0);
      let bulanAktif = 12;

      if (isTahunan) {
        if (m.tanggal_bergabung) {
          const tgl = new Date(m.tanggal_bergabung);
          const thnGabung = tgl.getFullYear();
          const blnGabung = tgl.getMonth() + 1; // 1 - 12
          const tglHari = tgl.getDate();

          if (thnGabung < tahun) {
            bulanAktif = 12; // Sudah bergabung dari tahun buku sebelumnya
          } else if (thnGabung === tahun) {
            // Cut-off rule: Jika tgl 1 langsung aktif bulan tsb; jika > 1, efektif mulai bulan berikutnya
            const bulanMulai = tglHari === 1 ? blnGabung : Math.min(13, blnGabung + 1);
            bulanAktif = Math.max(0, 12 - bulanMulai + 1);
          } else {
            bulanAktif = 0; // Bergabung di tahun mendatang
          }
        }
      } else {
        bulanAktif = 1;
      }

      const bobot = modal * bulanAktif;
      totalBobotKonsorsium += bobot;

      return {
        ...m,
        modal_disetor: modal,
        bulan_aktif: bulanAktif,
        bobot_waktu_modal: bobot,
      };
    });

    const memberBreakdown = computedMembers.map((m) => {
      const porsi = totalBobotKonsorsium > 0 ? (m.bobot_waktu_modal / totalBobotKonsorsium) * 100 : 0;
      const nominalDividen = Math.round(hakInvestor * (porsi / 100));

      return {
        id_cabang_investor: m.id_cabang_investor,
        nama_investor: m.nama_investor,
        modal_disetor: m.modal_disetor,
        tanggal_bergabung: m.tanggal_bergabung,
        bulan_aktif: m.bulan_aktif,
        bobot_waktu_modal: m.bobot_waktu_modal,
        porsi_persen: Number(porsi.toFixed(2)),
        nominal_hak_dividen: nominalDividen,
        nominal_transfer: nominalDividen,
        nominal_reinvestasi: 0,
        metode_pencairan: "TRANSFER",
        nama_bank: m.nama_bank,
        no_rekening: m.no_rekening,
        atas_nama_rekening: m.atas_nama_rekening,
      };
    });

    return c.json({
      success: true,
      data: {
        periode: {
          jenis_periode: jenisPeriode,
          bulan: isTahunan ? 12 : bulan,
          tahun,
          tanggal_mulai: startDate,
          tanggal_selesai: endDate,
          jadwal_pencairan_bulan: 2, // Februari
          jadwal_pencairan_tahun: isTahunan ? tahun + 1 : tahun,
        },
        profil: {
          nama_investor: profil.nama_investor,
          nama_bank: profil.nama_bank,
          nomor_rekening: profil.nomor_rekening,
          atas_nama_rekening: profil.atas_nama_rekening,
          nisbah_pengelola: nisbahPengelola,
          nisbah_investor: nisbahInvestor,
        },
        konsolidasi: {
          total_penjualan_bruto: grandPenjualanBruto,
          total_diskon_retur: grandDiskonRetur,
          total_penjualan_bersih: grandPenjualanBersih,
          total_hpp: grandHpp,
          total_laba_kotor: grandLabaKotor,
          total_beban_operasional: grandBeban,
          laba_konsolidasi_kotor: grandLabaKonsolidasi,
          defisit_bulan_lalu: defisitBulanLalu,
          laba_kena_bagi_hasil: labaKenaBagiHasil,
          defisit_terbawa_berikutnya: defisitTerbawaBerikutnya,
          nominal_hak_pengelola: hakPengelola,
          nominal_hak_investor: hakInvestor,
          total_bobot_konsorsium: totalBobotKonsorsium,
        },
        breakdown_cabang: breakdownCabang,
        member_breakdown: memberBreakdown,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal menghitung bagi hasil: " + error.message }, 500);
  }
});

// Daftar rekapitulasi bagi hasil yang tersimpan
investorRoutes.get("/bagi-hasil", async (c) => {
  try {
    const list = await db
      .select({
        id: investor_bagi_hasil.id,
        nomor_rekap: investor_bagi_hasil.nomor_rekap,
        periode_bulan: investor_bagi_hasil.periode_bulan,
        periode_tahun: investor_bagi_hasil.periode_tahun,
        jenis_periode: investor_bagi_hasil.jenis_periode,
        jadwal_pencairan_bulan: investor_bagi_hasil.jadwal_pencairan_bulan,
        jadwal_pencairan_tahun: investor_bagi_hasil.jadwal_pencairan_tahun,
        tanggal_mulai: investor_bagi_hasil.tanggal_mulai,
        tanggal_selesai: investor_bagi_hasil.tanggal_selesai,
        total_penjualan_bersih: investor_bagi_hasil.total_penjualan_bersih,
        laba_konsolidasi_kotor: investor_bagi_hasil.laba_konsolidasi_kotor,
        defisit_bulan_lalu: investor_bagi_hasil.defisit_bulan_lalu,
        laba_kena_bagi_hasil: investor_bagi_hasil.laba_kena_bagi_hasil,
        nominal_hak_investor: investor_bagi_hasil.nominal_hak_investor,
        nominal_hak_pengelola: investor_bagi_hasil.nominal_hak_pengelola,
        metode_penyelesaian: investor_bagi_hasil.metode_penyelesaian,
        nominal_transfer: investor_bagi_hasil.nominal_transfer,
        nominal_reinvestasi: investor_bagi_hasil.nominal_reinvestasi,
        status: investor_bagi_hasil.status,
        tanggal_persetujuan: investor_bagi_hasil.tanggal_persetujuan,
        created_at: investor_bagi_hasil.created_at,
        nama_pengaju: users.nama_user,
        nama_rekening_kas: rekening_kas.nama,
      })
      .from(investor_bagi_hasil)
      .leftJoin(users, eq(investor_bagi_hasil.diajukan_oleh, users.id))
      .leftJoin(rekening_kas, eq(investor_bagi_hasil.id_rekening_kas, rekening_kas.id))
      .orderBy(desc(investor_bagi_hasil.id));

    return c.json({ success: true, data: list });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Maker: Mengajukan penetapan bagi hasil konsolidasi periode
investorRoutes.post("/bagi-hasil", async (c) => {
  try {
    const activeUser = c.get("user");
    const body = await c.req.json();

    const [profil] = await db.select().from(investor_profil).limit(1);
    if (!profil) {
      return c.json({ success: false, error: "Profil investor tidak ditemukan" }, 404);
    }

    const bulan = parseInt(body.periode_bulan);
    const tahun = parseInt(body.periode_tahun);
    const jenisPeriode = body.jenis_periode || "TAHUNAN";
    const jadwalPencairanBulan = body.jadwal_pencairan_bulan !== undefined ? parseInt(body.jadwal_pencairan_bulan) : 2;
    const jadwalPencairanTahun = body.jadwal_pencairan_tahun !== undefined ? parseInt(body.jadwal_pencairan_tahun) : (jenisPeriode === "TAHUNAN" ? tahun + 1 : tahun);

    // Cek apakah periode ini sudah pernah dibuat sebelumnya
    const [existing] = await db
      .select({ id: investor_bagi_hasil.id, status: investor_bagi_hasil.status })
      .from(investor_bagi_hasil)
      .where(
        and(
          eq(investor_bagi_hasil.periode_bulan, bulan),
          eq(investor_bagi_hasil.periode_tahun, tahun),
          eq(investor_bagi_hasil.jenis_periode, jenisPeriode),
          inArray(investor_bagi_hasil.status, ["PENDING", "APPROVED", "DIBAYARKAN"])
        )
      )
      .limit(1);

    if (existing) {
      return c.json(
        {
          success: false,
          error: `Bagi hasil ${jenisPeriode} untuk periode ${bulan}/${tahun} sudah terdaftar dengan status ${existing.status}.`,
        },
        400
      );
    }

    const nomorRekap = generateRef(`DIV-${jenisPeriode === "TAHUNAN" ? "Y" : "M"}${tahun}${String(bulan).padStart(2, "0")}`);
    const metode = body.metode_penyelesaian || "TRANSFER_BANK"; // 'TRANSFER_BANK' | 'REINVESTASI_MODAL' | 'MEMBER_CHOICE'

    const hakInvestor = Math.round(parseFloat(body.nominal_hak_investor || "0"));
    let nominalTransfer = 0;
    let nominalReinvestasi = 0;

    if (Array.isArray(body.member_breakdown) && body.member_breakdown.length > 0) {
      for (const m of body.member_breakdown) {
        nominalTransfer += Math.round(parseFloat(m.nominal_transfer || 0));
        nominalReinvestasi += Math.round(parseFloat(m.nominal_reinvestasi || 0));
      }
    } else {
      if (metode === "REINVESTASI_MODAL") {
        nominalReinvestasi = hakInvestor;
      } else {
        nominalTransfer = hakInvestor;
      }
    }

    const [inserted] = await db
      .insert(investor_bagi_hasil)
      .values({
        nomor_rekap: nomorRekap,
        id_investor: profil.id,
        periode_bulan: bulan,
        periode_tahun: tahun,
        jenis_periode: jenisPeriode,
        jadwal_pencairan_bulan: jadwalPencairanBulan,
        jadwal_pencairan_tahun: jadwalPencairanTahun,
        tanggal_mulai: body.tanggal_mulai,
        tanggal_selesai: body.tanggal_selesai,
        total_penjualan_bruto: String(body.total_penjualan_bruto || 0),
        total_diskon_retur: String(body.total_diskon_retur || 0),
        total_penjualan_bersih: String(body.total_penjualan_bersih || 0),
        total_hpp: String(body.total_hpp || 0),
        total_laba_kotor: String(body.total_laba_kotor || 0),
        total_beban_operasional: String(body.total_beban_operasional || 0),
        laba_konsolidasi_kotor: String(body.laba_konsolidasi_kotor || 0),
        defisit_bulan_lalu: String(body.defisit_bulan_lalu || 0),
        laba_kena_bagi_hasil: String(body.laba_kena_bagi_hasil || 0),
        defisit_terbawa_berikutnya: String(body.defisit_terbawa_berikutnya || 0),
        nisbah_pengelola_persen: String(body.nisbah_pengelola_persen || 40),
        nisbah_investor_persen: String(body.nisbah_investor_persen || 60),
        nominal_hak_pengelola: String(body.nominal_hak_pengelola || 0),
        nominal_hak_investor: String(hakInvestor),
        metode_penyelesaian: metode,
        nominal_transfer: String(nominalTransfer),
        nominal_reinvestasi: String(nominalReinvestasi),
        id_rekening_kas: body.id_rekening_kas ? parseInt(body.id_rekening_kas) : null,
        status: "PENDING",
        diajukan_oleh: activeUser.id,
        catatan: body.catatan || null,
      })
      .returning();

    // Simpan rincian cabang jika disertakan
    if (Array.isArray(body.breakdown_cabang)) {
      for (const item of body.breakdown_cabang) {
        await db.insert(investor_bagi_hasil_cabang).values({
          id_bagi_hasil: inserted.id,
          id_cabang: item.id_cabang,
          penjualan_bersih: String(item.penjualan_bersih || 0),
          hpp: String(item.hpp || 0),
          laba_kotor: String(item.laba_kotor || 0),
          beban_operasional: String(item.beban_operasional || 0),
          laba_operasional: String(item.laba_operasional || 0),
        });
      }
    }

    // Simpan snapshot member time-weighted capital jika disertakan
    if (Array.isArray(body.member_breakdown)) {
      for (const m of body.member_breakdown) {
        await db.insert(investor_bagi_hasil_member).values({
          id_bagi_hasil: inserted.id,
          id_cabang_investor: m.id_cabang_investor || null,
          nama_investor: m.nama_investor,
          modal_disetor: String(m.modal_disetor || 0),
          tanggal_bergabung: m.tanggal_bergabung || null,
          bulan_aktif: m.bulan_aktif ?? 12,
          bobot_waktu_modal: String(m.bobot_waktu_modal || 0),
          porsi_persen: String(m.porsi_persen || 0),
          nominal_hak_dividen: String(m.nominal_hak_dividen || 0),
          nominal_transfer: String(m.nominal_transfer || 0),
          nominal_reinvestasi: String(m.nominal_reinvestasi || 0),
          metode_pencairan: m.metode_pencairan || "TRANSFER",
          nama_bank: m.nama_bank || null,
          no_rekening: m.no_rekening || null,
          atas_nama_rekening: m.atas_nama_rekening || null,
          status_pencairan: "PENDING",
        });
      }
    }

    return c.json({
      success: true,
      message: `Bagi hasil konsolidasi periode ${bulan}/${tahun} (${jenisPeriode}) berhasil diajukan dan menunggu persetujuan (Checker).`,
      data: inserted,
    });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal menyimpan pengajuan bagi hasil: " + error.message }, 500);
  }
});

// Checker: Persetujuan & Eksekusi Pembayaran Bagi Hasil (Approve)
investorRoutes.post("/bagi-hasil/:id/approve", async (c) => {
  try {
    const activeUser = c.get("user");
    const id = parseInt(c.req.param("id"));

    const [div] = await db
      .select()
      .from(investor_bagi_hasil)
      .where(eq(investor_bagi_hasil.id, id))
      .limit(1);

    if (!div) {
      return c.json({ success: false, error: "Data bagi hasil tidak ditemukan" }, 404);
    }

    if (div.status !== "PENDING") {
      return c.json({ success: false, error: `Bagi hasil sudah berstatus ${div.status}` }, 400);
    }

    const [profil] = await db
      .select()
      .from(investor_profil)
      .where(eq(investor_profil.id, div.id_investor))
      .limit(1);

    if (!profil) {
      return c.json({ success: false, error: "Profil investor tidak ditemukan" }, 404);
    }

    // Cari akun COA Dividen / Prive (3.201.01) dan Modal Disetor (3.101.01)
    let [akunDividen] = await db
      .select()
      .from(daftar_akun)
      .where(eq(daftar_akun.kode_akun, "3.201.01"))
      .limit(1);

    let [akunModal] = await db
      .select()
      .from(daftar_akun)
      .where(eq(daftar_akun.kode_akun, "3.101.01"))
      .limit(1);

    const nominalTransfer = Math.round(parseFloat(div.nominal_transfer || "0"));
    const nominalReinvest = Math.round(parseFloat(div.nominal_reinvestasi || "0"));
    const tgl = new Date().toISOString().slice(0, 10);

    let idKasTrx: number | null = null;
    let idJurnal: number | null = null;

    // 1. Jika metode TRANSFER_BANK (mengeluarkan uang riil dari rekening kas)
    if (nominalTransfer > 0) {
      if (!div.id_rekening_kas) {
        return c.json({ success: false, error: "Rekening kas/bank pembayaran belum ditentukan" }, 400);
      }

      const [rek] = await db
        .select()
        .from(rekening_kas)
        .where(eq(rekening_kas.id, div.id_rekening_kas))
        .limit(1);

      if (!rek) {
        return c.json({ success: false, error: "Rekening kas tidak ditemukan" }, 404);
      }

      if (rek.saldo < nominalTransfer) {
        return c.json(
          {
            success: false,
            error: `Saldo rekening ${rek.nama} (Rp ${rek.saldo.toLocaleString("id-ID")}) tidak mencukupi untuk transfer bagi hasil sebesar Rp ${nominalTransfer.toLocaleString("id-ID")}`,
          },
          400
        );
      }

      // Catat Kas KELUAR
      const nomorKasTrx = generateRef("KAS-DIV");
      const [kasTrx] = await db
        .insert(kas_transaksi)
        .values({
          nomor_transaksi: nomorKasTrx,
          id_rekening: rek.id,
          id_cabang: rek.id_cabang,
          tipe: "KELUAR",
          kategori: "LAIN",
          nominal: nominalTransfer,
          tanggal: tgl,
          keterangan: `Pembayaran Bagi Hasil Investor Periode ${div.periode_bulan}/${div.periode_tahun} [${div.nomor_rekap}]`,
          referensi_type: "MANUAL",
          referensi_id: div.id,
          status: "APPROVED",
          created_by: activeUser.id,
          approved_by: activeUser.id,
        })
        .returning();
      idKasTrx = kasTrx.id;

      // Update Saldo Kas
      await db
        .update(rekening_kas)
        .set({ saldo: rek.saldo - nominalTransfer })
        .where(eq(rekening_kas.id, rek.id));

      // Catat Jurnal Umum:
      // (Debit) Prive / Dividen (3.201.01)
      // (Kredit) Kas / Bank
      if (akunDividen && rek.id_akun_coa) {
        const deskripsiJurnal = `Bagi Hasil Investor Periode ${div.periode_bulan}/${div.periode_tahun} (${profil.nama_investor})`;
        const [j1] = await db
          .insert(jurnal_umum)
          .values({
            tanggal_transaksi: tgl,
            no_referensi_bukti: div.nomor_rekap,
            deskripsi: deskripsiJurnal,
            akun_id: akunDividen.id,
            cabang_id: rek.id_cabang,
            debit: nominalTransfer,
            kredit: 0,
            dibuat_oleh: activeUser.id,
          })
          .returning();
        idJurnal = j1.id;

        await db.insert(jurnal_umum).values({
          tanggal_transaksi: tgl,
          no_referensi_bukti: div.nomor_rekap,
          deskripsi: deskripsiJurnal,
          akun_id: rek.id_akun_coa,
          cabang_id: rek.id_cabang,
          debit: 0,
          kredit: nominalTransfer,
          dibuat_oleh: activeUser.id,
        });
      }
    }

    // 2. Jika metode REINVESTASI_MODAL (menambah modal tanpa uang tunai keluar)
    if (nominalReinvest > 0) {
      // Ambil 1 cabang investor untuk penempatan referensi cabang di jurnal umum
      const [firstCabang] = await db
        .select()
        .from(cabang)
        .where(eq(cabang.jenis_cabang, "INVESTOR"))
        .limit(1);
      const cabId = firstCabang?.id_cabang || 1;

      // Catat Jurnal Reklasifikasi:
      // (Debit) Prive / Dividen (3.201.01)
      // (Kredit) Modal Disetor (3.101.01)
      if (akunDividen && akunModal) {
        const deskripsiJurnal = `Reinvestasi Bagi Hasil ke Modal: Periode ${div.periode_bulan}/${div.periode_tahun} [${div.nomor_rekap}]`;
        const [j1] = await db
          .insert(jurnal_umum)
          .values({
            tanggal_transaksi: tgl,
            no_referensi_bukti: div.nomor_rekap,
            deskripsi: deskripsiJurnal,
            akun_id: akunDividen.id,
            cabang_id: cabId,
            debit: nominalReinvest,
            kredit: 0,
            dibuat_oleh: activeUser.id,
          })
          .returning();
        idJurnal = j1.id;

        await db.insert(jurnal_umum).values({
          tanggal_transaksi: tgl,
          no_referensi_bukti: div.nomor_rekap,
          deskripsi: deskripsiJurnal,
          akun_id: akunModal.id,
          cabang_id: cabId,
          debit: 0,
          kredit: nominalReinvest,
          dibuat_oleh: activeUser.id,
        });
      }

      // Catat riwayat di investor_transaksi_modal jenis REINVESTASI_BAGI_HASIL (otomatis APPROVED)
      const nomorModalRef = generateRef("INV-CAP-REINV");
      await db.insert(investor_transaksi_modal).values({
        nomor_referensi: nomorModalRef,
        id_investor: profil.id,
        jenis_transaksi: "REINVESTASI_BAGI_HASIL",
        tanggal_transaksi: tgl,
        nominal: String(nominalReinvest),
        keterangan: `Reinvestasi Dividen Bagi Hasil Periode ${div.periode_bulan}/${div.periode_tahun} [${div.nomor_rekap}]`,
        status: "APPROVED",
        diajukan_oleh: activeUser.id,
        disetujui_oleh: activeUser.id,
        tanggal_persetujuan: new Date().toISOString(),
        catatan_persetujuan: "Otomatis dari persetujuan bagi hasil",
      });

      // Tambahkan saldo modal pokok di profil investor
      const saldoLama = parseFloat(profil.saldo_modal_saat_ini || "0");
      await db
        .update(investor_profil)
        .set({
          saldo_modal_saat_ini: String(saldoLama + nominalReinvest),
          updated_at: new Date().toISOString(),
        })
        .where(eq(investor_profil.id, profil.id));
    }

    // 3. Update Akumulasi Defisit Baru (Deficit Carryforward) di profil investor
    const defisitBaru = parseFloat(div.defisit_terbawa_berikutnya || "0");
    await db
      .update(investor_profil)
      .set({
        akumulasi_defisit: String(defisitBaru),
        updated_at: new Date().toISOString(),
      })
      .where(eq(investor_profil.id, profil.id));

    // 4. Update status bagi hasil menjadi DIBAYARKAN
    const [updatedDiv] = await db
      .update(investor_bagi_hasil)
      .set({
        status: "DIBAYARKAN",
        id_kas_transaksi: idKasTrx,
        id_jurnal: idJurnal,
        disetujui_oleh: activeUser.id,
        tanggal_persetujuan: new Date().toISOString(),
        catatan: "Disetujui dan dibayarkan oleh Checker",
      })
      .where(eq(investor_bagi_hasil.id, id))
      .returning();

    // 5. Update status snapshot pemodal di investor_bagi_hasil_member & eksekusi reinvestasi anggota
    const snapshotMembers = await db
      .select()
      .from(investor_bagi_hasil_member)
      .where(eq(investor_bagi_hasil_member.id_bagi_hasil, id));

    let memberReinvestedCount = 0;
    for (const mem of snapshotMembers) {
      const reinvNom = Math.round(parseFloat(mem.nominal_reinvestasi || "0"));
      const isReinv = reinvNom > 0 || mem.metode_pencairan === "REINVESTASI";
      const newStatus = isReinv ? "DIREINVESTASIKAN" : "DIBAYARKAN";

      await db
        .update(investor_bagi_hasil_member)
        .set({
          status_pencairan: newStatus,
          tanggal_realisasi: tgl,
        })
        .where(eq(investor_bagi_hasil_member.id, mem.id));

      if (isReinv && mem.id_cabang_investor && reinvNom > 0) {
        memberReinvestedCount++;
        const [targetInv] = await db
          .select()
          .from(cabang_investor)
          .where(eq(cabang_investor.id_cabang_investor, mem.id_cabang_investor))
          .limit(1);

        if (targetInv) {
          const modalLama = parseFloat(targetInv.nilai_investasi || "0");
          await db
            .update(cabang_investor)
            .set({
              nilai_investasi: String(modalLama + reinvNom),
            })
            .where(eq(cabang_investor.id_cabang_investor, targetInv.id_cabang_investor));
        }
      }
    }

    if (memberReinvestedCount > 0) {
      await syncConsortiumEquity();
    }

    return c.json({
      success: true,
      message: `Bagi hasil periode ${div.periode_bulan}/${div.periode_tahun} berhasil disetujui & dieksekusi (${div.metode_penyelesaian}).`,
      data: updatedDiv,
    });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal mengeksekusi bagi hasil: " + error.message }, 500);
  }
});

// Checker: Tolak penetapan bagi hasil
investorRoutes.post("/bagi-hasil/:id/reject", async (c) => {
  try {
    const activeUser = c.get("user");
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const [div] = await db
      .select()
      .from(investor_bagi_hasil)
      .where(eq(investor_bagi_hasil.id, id))
      .limit(1);

    if (!div) return c.json({ success: false, error: "Data tidak ditemukan" }, 404);
    if (div.status !== "PENDING") {
      return c.json({ success: false, error: `Bagi hasil sudah berstatus ${div.status}` }, 400);
    }

    const [updated] = await db
      .update(investor_bagi_hasil)
      .set({
        status: "REJECTED",
        disetujui_oleh: activeUser.id,
        tanggal_persetujuan: new Date().toISOString(),
        catatan: body.catatan || "Ditolak oleh manajemen",
      })
      .where(eq(investor_bagi_hasil.id, id))
      .returning();

    return c.json({ success: true, message: "Pengajuan bagi hasil telah ditolak.", data: updated });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. BUKU PEMBANTU MODAL (STATEMENT OF CHANGES IN EQUITY)
// ─────────────────────────────────────────────────────────────────────────────
investorRoutes.get("/buku-pembantu", async (c) => {
  try {
    const [profil] = await db.select().from(investor_profil).limit(1);
    if (!profil) {
      return c.json({ success: false, error: "Profil investor tidak ditemukan" }, 404);
    }

    // Ambil seluruh transaksi modal yang APPROVED
    const listTrx = await db
      .select({
        id: investor_transaksi_modal.id,
        nomor_referensi: investor_transaksi_modal.nomor_referensi,
        tanggal: investor_transaksi_modal.tanggal_transaksi,
        jenis: investor_transaksi_modal.jenis_transaksi,
        nominal: investor_transaksi_modal.nominal,
        keterangan: investor_transaksi_modal.keterangan,
        nama_rekening_kas: rekening_kas.nama,
        created_at: investor_transaksi_modal.created_at,
      })
      .from(investor_transaksi_modal)
      .leftJoin(rekening_kas, eq(investor_transaksi_modal.id_rekening_kas, rekening_kas.id))
      .where(
        and(
          eq(investor_transaksi_modal.id_investor, profil.id),
          eq(investor_transaksi_modal.status, "APPROVED")
        )
      )
      .orderBy(asc(investor_transaksi_modal.tanggal_transaksi), asc(investor_transaksi_modal.id));

    // Hitung running balance modal
    let runningSaldo = 0;
    const ledger = listTrx.map((item) => {
      const nom = Math.round(parseFloat(item.nominal));
      const isPenarikan = item.jenis === "PENARIKAN_MODAL";

      let debit = 0;
      let kredit = 0;

      if (isPenarikan) {
        debit = nom; // Penarikan modal mengurangi ekuitas (Debit Ekuitas)
        runningSaldo -= nom;
      } else {
        kredit = nom; // Setoran atau Reinvestasi menambah ekuitas (Kredit Ekuitas)
        runningSaldo += nom;
      }

      return {
        id: item.id,
        nomor_referensi: item.nomor_referensi,
        tanggal: item.tanggal,
        jenis: item.jenis,
        keterangan: item.keterangan,
        nama_rekening_kas: item.nama_rekening_kas,
        debit,
        kredit,
        saldo_akhir: runningSaldo,
      };
    });

    return c.json({
      success: true,
      data: {
        profil: {
          nama_investor: profil.nama_investor,
          nama_bank: profil.nama_bank,
          nomor_rekening: profil.nomor_rekening,
          atas_nama_rekening: profil.atas_nama_rekening,
          saldo_modal_saat_ini: Number(profil.saldo_modal_saat_ini || 0),
        },
        transaksi: ledger,
        total_kredit: ledger.reduce((acc, x) => acc + x.kredit, 0),
        total_debit: ledger.reduce((acc, x) => acc + x.debit, 0),
        saldo_akhir: runningSaldo,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. DETAIL SLIP BAGI HASIL UNTUK CETAK RESMI & AUDIT SNAPSHOT
// ─────────────────────────────────────────────────────────────────────────────
async function getBagiHasilDetail(id: number) {
  const [bagiHasil] = await db
    .select({
      id: investor_bagi_hasil.id,
      nomor_rekap: investor_bagi_hasil.nomor_rekap,
      periode_bulan: investor_bagi_hasil.periode_bulan,
      periode_tahun: investor_bagi_hasil.periode_tahun,
      jenis_periode: investor_bagi_hasil.jenis_periode,
      jadwal_pencairan_bulan: investor_bagi_hasil.jadwal_pencairan_bulan,
      jadwal_pencairan_tahun: investor_bagi_hasil.jadwal_pencairan_tahun,
      tanggal_mulai: investor_bagi_hasil.tanggal_mulai,
      tanggal_selesai: investor_bagi_hasil.tanggal_selesai,
      total_penjualan_bruto: investor_bagi_hasil.total_penjualan_bruto,
      total_diskon_retur: investor_bagi_hasil.total_diskon_retur,
      total_penjualan_bersih: investor_bagi_hasil.total_penjualan_bersih,
      total_hpp: investor_bagi_hasil.total_hpp,
      total_laba_kotor: investor_bagi_hasil.total_laba_kotor,
      total_beban_operasional: investor_bagi_hasil.total_beban_operasional,
      laba_konsolidasi_kotor: investor_bagi_hasil.laba_konsolidasi_kotor,
      defisit_bulan_lalu: investor_bagi_hasil.defisit_bulan_lalu,
      laba_kena_bagi_hasil: investor_bagi_hasil.laba_kena_bagi_hasil,
      defisit_terbawa_berikutnya: investor_bagi_hasil.defisit_terbawa_berikutnya,
      nisbah_pengelola_persen: investor_bagi_hasil.nisbah_pengelola_persen,
      nisbah_investor_persen: investor_bagi_hasil.nisbah_investor_persen,
      nominal_hak_pengelola: investor_bagi_hasil.nominal_hak_pengelola,
      nominal_hak_investor: investor_bagi_hasil.nominal_hak_investor,
      metode_penyelesaian: investor_bagi_hasil.metode_penyelesaian,
      nominal_transfer: investor_bagi_hasil.nominal_transfer,
      nominal_reinvestasi: investor_bagi_hasil.nominal_reinvestasi,
      status: investor_bagi_hasil.status,
      tanggal_persetujuan: investor_bagi_hasil.tanggal_persetujuan,
      created_at: investor_bagi_hasil.created_at,
      catatan: investor_bagi_hasil.catatan,
      nama_bank_sumber: rekening_kas.nama,
      nomor_rekening_sumber: rekening_kas.kode,
      nama_pengaju: users.nama_user,
    })
    .from(investor_bagi_hasil)
    .leftJoin(rekening_kas, eq(investor_bagi_hasil.id_rekening_kas, rekening_kas.id))
    .leftJoin(users, eq(investor_bagi_hasil.diajukan_oleh, users.id))
    .where(eq(investor_bagi_hasil.id, id))
    .limit(1);

  if (!bagiHasil) return null;

  const [profil] = await db.select().from(investor_profil).limit(1);

  // Ambil rincian cabang
  const cabangDetails = await db
    .select({
      id_cabang: investor_bagi_hasil_cabang.id_cabang,
      kode_cabang: cabang.kode_cabang,
      nama_cabang: cabang.nama_cabang,
      penjualan_bersih: investor_bagi_hasil_cabang.penjualan_bersih,
      hpp: investor_bagi_hasil_cabang.hpp,
      laba_kotor: investor_bagi_hasil_cabang.laba_kotor,
      beban_operasional: investor_bagi_hasil_cabang.beban_operasional,
      laba_operasional: investor_bagi_hasil_cabang.laba_operasional,
    })
    .from(investor_bagi_hasil_cabang)
    .leftJoin(cabang, eq(investor_bagi_hasil_cabang.id_cabang, cabang.id_cabang))
    .where(eq(investor_bagi_hasil_cabang.id_bagi_hasil, id))
    .orderBy(cabang.nama_cabang);

  // Ambil rincian snapshot pemodal konsorsium (Time-Weighted Capital)
  const members = await db
    .select()
    .from(investor_bagi_hasil_member)
    .where(eq(investor_bagi_hasil_member.id_bagi_hasil, id))
    .orderBy(desc(investor_bagi_hasil_member.bobot_waktu_modal));

  return {
    bagi_hasil: bagiHasil,
    profil,
    cabang_details: cabangDetails,
    members,
  };
}

investorRoutes.get("/slip/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const data = await getBagiHasilDetail(id);
    if (!data) {
      return c.json({ success: false, error: "Data bagi hasil tidak ditemukan" }, 404);
    }
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

investorRoutes.get("/bagi-hasil/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const data = await getBagiHasilDetail(id);
    if (!data) {
      return c.json({ success: false, error: "Data bagi hasil tidak ditemukan" }, 404);
    }
    return c.json({ success: true, data });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. KONSORSIUM MULTI-INVESTOR (DAFTAR SEMUA PEMODAL)
// ─────────────────────────────────────────────────────────────────────────────

// Helper fungsi untuk sinkronisasi porsi kepemilikan saham & modal konsorsium
async function syncConsortiumEquity() {
  // 1. Ambil seluruh investor aktif
  const allActive = await db
    .select({
      id: cabang_investor.id_cabang_investor,
      nilai: sql<number>`CAST(${cabang_investor.nilai_investasi} AS NUMERIC)`,
    })
    .from(cabang_investor)
    .where(eq(cabang_investor.status, "AKTIF"));

  const grandTotalModal = allActive.reduce((acc, curr) => acc + Number(curr.nilai || 0), 0);

  // 2. Update porsi_kepemilikan tiap pemodal aktif
  for (const inv of allActive) {
    const porsi = grandTotalModal > 0 ? ((Number(inv.nilai || 0) / grandTotalModal) * 100).toFixed(2) : "0.00";
    await db
      .update(cabang_investor)
      .set({ porsi_kepemilikan: porsi })
      .where(eq(cabang_investor.id_cabang_investor, inv.id));
  }

  // 3. Sinkronkan saldo modal ke profil konsorsium (investor_profil)
  await db
    .update(investor_profil)
    .set({ saldo_modal_saat_ini: String(grandTotalModal) });

  // 4. Sinkronkan total_modal_investor ke seluruh cabang bertipe INVESTOR
  await db
    .update(cabang)
    .set({ total_modal_investor: String(grandTotalModal) })
    .where(eq(cabang.jenis_cabang, "INVESTOR"));

  return grandTotalModal;
}

// GET /daftar-semua: Mengambil daftar seluruh pemodal konsorsium
investorRoutes.get("/daftar-semua", async (c) => {
  try {
    const status = c.req.query("status");
    const search = c.req.query("q")?.toLowerCase();

    // Ambil daftar cabang bertipe INVESTOR yang dinaungi bersama
    const branches = await db
      .select({
        id_cabang: cabang.id_cabang,
        kode_cabang: cabang.kode_cabang,
        nama_cabang: cabang.nama_cabang,
        alamat: cabang.alamat,
      })
      .from(cabang)
      .where(eq(cabang.jenis_cabang, "INVESTOR"))
      .orderBy(cabang.nama_cabang);

    const list = await db
      .select({
        id_cabang_investor: cabang_investor.id_cabang_investor,
        nama_investor: cabang_investor.nama_investor,
        telepon: cabang_investor.telepon,
        email: cabang_investor.email,
        nilai_investasi: sql<number>`CAST(${cabang_investor.nilai_investasi} AS NUMERIC)`,
        porsi_kepemilikan: sql<number>`CAST(${cabang_investor.porsi_kepemilikan} AS NUMERIC)`,
        nama_bank: cabang_investor.nama_bank,
        no_rekening: cabang_investor.no_rekening,
        atas_nama_rekening: cabang_investor.atas_nama_rekening,
        tanggal_bergabung: cabang_investor.tanggal_bergabung,
        status: cabang_investor.status,
        catatan: cabang_investor.catatan,
        created_at: cabang_investor.created_at,
      })
      .from(cabang_investor)
      .orderBy(desc(cabang_investor.nilai_investasi), asc(cabang_investor.nama_investor));

    let filtered = list;
    if (status && status !== "ALL") {
      filtered = filtered.filter((i) => i.status === status);
    }
    if (search) {
      filtered = filtered.filter(
        (i) =>
          i.nama_investor.toLowerCase().includes(search) ||
          (i.telepon && i.telepon.toLowerCase().includes(search)) ||
          (i.no_rekening && i.no_rekening.includes(search)) ||
          (i.nama_bank && i.nama_bank.toLowerCase().includes(search))
      );
    }

    const totalModal = filtered.reduce((acc, curr) => acc + Number(curr.nilai_investasi || 0), 0);
    const avgModal = filtered.length > 0 ? Math.round(totalModal / filtered.length) : 0;

    return c.json({
      success: true,
      data: {
        list: filtered,
        investor_branches: branches,
        summary: {
          total_investor: filtered.length,
          total_modal: totalModal,
          rata_rata_modal: avgModal,
          total_cabang_investor: branches.length,
        },
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal memuat daftar investor: " + error.message }, 500);
  }
});

// POST /daftar-semua: Tambah investor baru ke konsorsium (tanpa memilih cabang)
investorRoutes.post("/daftar-semua", async (c) => {
  try {
    const activeUser = c.get("user");
    const body = await c.req.json();
    if (!body.nama_investor?.trim()) {
      return c.json({ success: false, error: "Nama investor wajib diisi" }, 400);
    }

    const nilaiModal = String(body.nilai_investasi || "0");
    const nominal = Math.round(parseFloat(nilaiModal));

    const [newInv] = await db
      .insert(cabang_investor)
      .values({
        id_cabang: null as any,
        nama_investor: body.nama_investor.trim(),
        telepon: body.telepon?.trim() || null,
        email: body.email?.trim() || null,
        nilai_investasi: nilaiModal,
        porsi_kepemilikan: "0",
        nama_bank: body.nama_bank?.trim() || null,
        no_rekening: body.no_rekening?.trim() || null,
        atas_nama_rekening: body.atas_nama_rekening?.trim() || null,
        tanggal_bergabung: body.tanggal_bergabung || new Date().toISOString().slice(0, 10),
        status: body.status || "AKTIF",
        catatan: body.catatan?.trim() || null,
      })
      .returning();

    // Sinkronisasi otomatis porsi saham dan saldo modal konsorsium
    await syncConsortiumEquity();

    // Jika user memilih rekening kas/bank penampung modal masuk, catat transaksi & mutasi kas
    const idRekening = body.id_rekening_kas ? parseInt(body.id_rekening_kas) : null;
    if (idRekening && nominal > 0) {
      const [rek] = await db
        .select()
        .from(rekening_kas)
        .where(eq(rekening_kas.id, idRekening))
        .limit(1);

      if (rek) {
        const [profil] = await db.select().from(investor_profil).limit(1);
        const tgl = body.tanggal_bergabung || new Date().toISOString().slice(0, 10);
        const nomorRef = generateRef("INV-CAP-SETOR");

        // 1. Catat transaksi modal
        const [trxModal] = await db
          .insert(investor_transaksi_modal)
          .values({
            nomor_referensi: nomorRef,
            id_investor: profil?.id || 1,
            jenis_transaksi: "SETORAN_AWAL",
            tanggal_transaksi: tgl,
            nominal: String(nominal),
            id_rekening_kas: idRekening,
            keterangan: `Setoran Modal Awal Pemodal: ${body.nama_investor.trim()} [${nomorRef}]`,
            status: "APPROVED",
            diajukan_oleh: activeUser?.id || 1,
            disetujui_oleh: activeUser?.id || 1,
            tanggal_persetujuan: new Date().toISOString(),
            catatan_persetujuan: "Otomatis dibuat saat penambahan pemodal baru",
          })
          .returning();

        // 2. Mutasi Kas Masuk
        const nomorKasTrx = generateRef("KAS-INV-SETOR");
        const [kasTrx] = await db
          .insert(kas_transaksi)
          .values({
            nomor_transaksi: nomorKasTrx,
            id_rekening: rek.id,
            id_cabang: rek.id_cabang,
            tipe: "MASUK",
            kategori: "LAIN",
            nominal: nominal,
            tanggal: tgl,
            keterangan: `Setoran Modal Pemodal Konsorsium: ${body.nama_investor.trim()} [${nomorRef}]`,
            referensi_type: "MANUAL",
            referensi_id: trxModal.id,
            status: "APPROVED",
            created_by: activeUser?.id || 1,
            approved_by: activeUser?.id || 1,
          })
          .returning();

        // 3. Update Saldo Kas
        await db
          .update(rekening_kas)
          .set({ saldo: rek.saldo + nominal })
          .where(eq(rekening_kas.id, rek.id));

        // 4. Jurnal Umum
        let [akunModal] = await db
          .select()
          .from(daftar_akun)
          .where(eq(daftar_akun.kode_akun, "3.101.01"))
          .limit(1);

        if (!akunModal) {
          [akunModal] = await db
            .select()
            .from(daftar_akun)
            .where(eq(daftar_akun.tipe_akun_id, 3))
            .limit(1);
        }

        if (akunModal && rek.id_akun_coa) {
          const deskripsiJurnal = `Setoran Modal Pemodal: ${body.nama_investor.trim()} [${nomorRef}]`;
          const [j1] = await db
            .insert(jurnal_umum)
            .values({
              tanggal_transaksi: tgl,
              no_referensi_bukti: nomorRef,
              deskripsi: deskripsiJurnal,
              akun_id: rek.id_akun_coa,
              cabang_id: rek.id_cabang,
              debit: nominal,
              kredit: 0,
              dibuat_oleh: activeUser?.id || 1,
            })
            .returning();

          await db.insert(jurnal_umum).values({
            tanggal_transaksi: tgl,
            no_referensi_bukti: nomorRef,
            deskripsi: deskripsiJurnal,
            akun_id: akunModal.id,
            cabang_id: rek.id_cabang,
            debit: 0,
            kredit: nominal,
            dibuat_oleh: activeUser?.id || 1,
          });

          await db
            .update(investor_transaksi_modal)
            .set({ id_kas_transaksi: kasTrx.id, id_jurnal: j1.id })
            .where(eq(investor_transaksi_modal.id, trxModal.id));
        }
      }
    }

    return c.json({ success: true, data: newInv }, 201);
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal menambah investor: " + error.message }, 500);
  }
});

// PUT /daftar-semua/:id: Update data investor
investorRoutes.put("/daftar-semua/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "ID Investor tidak valid" }, 400);

    const body = await c.req.json();
    if (!body.nama_investor?.trim()) {
      return c.json({ success: false, error: "Nama investor wajib diisi" }, 400);
    }

    const [existing] = await db
      .select()
      .from(cabang_investor)
      .where(eq(cabang_investor.id_cabang_investor, id));

    if (!existing) {
      return c.json({ success: false, error: "Investor tidak ditemukan" }, 404);
    }

    const [updated] = await db
      .update(cabang_investor)
      .set({
        nama_investor: body.nama_investor.trim(),
        telepon: body.telepon !== undefined ? (body.telepon?.trim() || null) : undefined,
        email: body.email !== undefined ? (body.email?.trim() || null) : undefined,
        nilai_investasi: body.nilai_investasi !== undefined ? String(body.nilai_investasi) : undefined,
        nama_bank: body.nama_bank !== undefined ? (body.nama_bank?.trim() || null) : undefined,
        no_rekening: body.no_rekening !== undefined ? (body.no_rekening?.trim() || null) : undefined,
        atas_nama_rekening: body.atas_nama_rekening !== undefined ? (body.atas_nama_rekening?.trim() || null) : undefined,
        status: body.status || undefined,
        tanggal_bergabung: body.tanggal_bergabung !== undefined ? body.tanggal_bergabung : undefined,
        catatan: body.catatan !== undefined ? (body.catatan?.trim() || null) : undefined,
        updated_at: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(cabang_investor.id_cabang_investor, id))
      .returning();

    // Sinkronisasi otomatis porsi saham dan saldo modal konsorsium
    await syncConsortiumEquity();

    return c.json({ success: true, data: updated });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal memperbarui investor: " + error.message }, 500);
  }
});

// DELETE /daftar-semua/:id: Hapus investor
investorRoutes.delete("/daftar-semua/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "ID Investor tidak valid" }, 400);

    const [existing] = await db
      .select()
      .from(cabang_investor)
      .where(eq(cabang_investor.id_cabang_investor, id));

    if (!existing) {
      return c.json({ success: false, error: "Investor tidak ditemukan" }, 404);
    }

    await db
      .delete(cabang_investor)
      .where(eq(cabang_investor.id_cabang_investor, id));

    // Sinkronisasi otomatis porsi saham dan saldo modal konsorsium
    await syncConsortiumEquity();

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: "Gagal menghapus investor: " + error.message }, 500);
  }
});
