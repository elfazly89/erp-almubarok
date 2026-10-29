import { Hono } from "hono";
import { db } from "../lib/db";
import {
  periode_akuntansi,
  master_pajak,
  barang_pajak,
  aset_tetap,
  riwayat_penyusutan,
  daftar_akun,
  tipe_akun,
  jurnal_umum,
  cabang,
  penjualan,
  faktur_beli,
  kas_transaksi,
  rekening_kas,
  users
} from "../lib/db/schema";
import { eq, and, gte, lte, lt, sql, asc, desc, or, notInArray } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";

export const akuntansiLanjutanRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// ============================================================================
// 1. PERIODE AKUNTANSI & CLOSING LOCK
// ============================================================================

// GET /periode - Daftar seluruh periode pembukuan
akuntansiLanjutanRoutes.get("/periode", async (c) => {
  const tahunParam = c.req.query("tahun");
  const tahun = tahunParam ? parseInt(tahunParam) : new Date().getFullYear();

  const data = await db
    .select({
      id: periode_akuntansi.id,
      bulan: periode_akuntansi.bulan,
      tahun: periode_akuntansi.tahun,
      tanggal_mulai: periode_akuntansi.tanggal_mulai,
      tanggal_akhir: periode_akuntansi.tanggal_akhir,
      status: periode_akuntansi.status,
      lock_date: periode_akuntansi.lock_date,
      closed_by: periode_akuntansi.closed_by,
      closed_at: periode_akuntansi.closed_at,
      closed_by_nama: users.nama_user,
      reopen_reason: periode_akuntansi.reopen_reason,
      reopened_at: periode_akuntansi.reopened_at,
    })
    .from(periode_akuntansi)
    .leftJoin(users, eq(periode_akuntansi.closed_by, users.id))
    .where(eq(periode_akuntansi.tahun, tahun))
    .orderBy(asc(periode_akuntansi.bulan));

  return c.json({ success: true, data });
});

// POST /periode/lock - Kunci periode bulanan (Soft Lock)
akuntansiLanjutanRoutes.post("/periode/lock", async (c) => {
  const activeUser = c.get("user");
  const body = await c.req.json();
  const { bulan, tahun } = body;

  if (!bulan || !tahun) {
    return c.json({ success: false, message: "Parameter bulan dan tahun wajib diisi" }, 400);
  }

  const [period] = await db
    .select()
    .from(periode_akuntansi)
    .where(and(eq(periode_akuntansi.bulan, parseInt(bulan)), eq(periode_akuntansi.tahun, parseInt(tahun))))
    .limit(1);

  if (!period) {
    return c.json({ success: false, message: "Periode akuntansi tidak ditemukan" }, 404);
  }

  if (period.status === "HARD_CLOSED") {
    return c.json({ success: false, message: "Periode ini sudah ditutup permanen (Hard Closed)" }, 400);
  }

  const [updated] = await db
    .update(periode_akuntansi)
    .set({
      status: "SOFT_LOCKED",
      lock_date: period.tanggal_akhir,
      closed_by: activeUser.id,
      closed_at: new Date().toISOString(),
    })
    .where(eq(periode_akuntansi.id, period.id))
    .returning();

  return c.json({ success: true, message: `Periode ${bulan}/${tahun} berhasil dikunci (Soft Locked)`, data: updated });
});

// POST /periode/reopen - Buka kembali periode (Emergency Re-Open oleh Super User)
akuntansiLanjutanRoutes.post("/periode/reopen", async (c) => {
  const activeUser = c.get("user");

  // Hanya Super User (id_jabatan === 1) yang berhak melakukan re-open
  if (activeUser.id_jabatan !== 1) {
    return c.json({ success: false, message: "Hanya Super User yang memiliki hak membuka kembali periode terkunci" }, 403);
  }

  const body = await c.req.json();
  const { id_periode, reason } = body;

  if (!id_periode || !reason?.trim()) {
    return c.json({ success: false, message: "ID Periode dan Alasan Pembukaan Kembali (reopen reason) wajib diisi" }, 400);
  }

  const [period] = await db
    .select()
    .from(periode_akuntansi)
    .where(eq(periode_akuntansi.id, parseInt(id_periode)))
    .limit(1);

  if (!period) {
    return c.json({ success: false, message: "Periode akuntansi tidak ditemukan" }, 404);
  }

  if (period.status === "HARD_CLOSED") {
    return c.json({ success: false, message: "Periode yang telah Hard Closed tidak dapat dibuka kembali secara langsung" }, 400);
  }

  const [updated] = await db
    .update(periode_akuntansi)
    .set({
      status: "OPEN",
      reopen_reason: reason.trim(),
      reopened_by: activeUser.id,
      reopened_at: new Date().toISOString(),
    })
    .where(eq(periode_akuntansi.id, period.id))
    .returning();

  return c.json({ success: true, message: "Periode berhasil dibuka kembali", data: updated });
});

// POST /periode/close-year - Penutupan Tahun Buku & Jurnal Penutup Otomatis
akuntansiLanjutanRoutes.post("/periode/close-year", async (c) => {
  const activeUser = c.get("user");
  if (activeUser.id_jabatan !== 1 && activeUser.id_jabatan !== 4) {
    return c.json({ success: false, message: "Hanya Super User dan Bendahara yang berwenang menutup tahun buku" }, 403);
  }

  const body = await c.req.json();
  const { tahun, id_cabang } = body;

  if (!tahun) {
    return c.json({ success: false, message: "Tahun buku wajib ditentukan" }, 400);
  }

  const targetCabang = id_cabang ? parseInt(id_cabang) : (activeUser.id_cabang || 2);
  const startYear = `${tahun}-01-01`;
  const endYear = `${tahun}-12-31`;

  // Cari akun Laba Ditahan / Retained Earnings (Ekuitas)
  let [retainedAccount] = await db
    .select()
    .from(daftar_akun)
    .where(eq(daftar_akun.kode_akun, "3.102.01"))
    .limit(1);

  if (!retainedAccount) {
    // Fallback ke modal pemilik atau cari akun bertipe Ekuitas
    const [equityAccount] = await db
      .select()
      .from(daftar_akun)
      .where(eq(daftar_akun.tipe_akun_id, 3))
      .limit(1);
    retainedAccount = equityAccount;
  }

  if (!retainedAccount) {
    return c.json({ success: false, message: "Akun Ekuitas / Laba Ditahan tidak ditemukan di CoA" }, 400);
  }

  // Hitung akumulasi pendapatan dan beban tahun tersebut
  const [plRes] = await db
    .select({
      revenue: sql<number>`CAST(SUM(CASE WHEN ${tipe_akun.nama} = 'Pendapatan' THEN ${jurnal_umum.kredit} - ${jurnal_umum.debit} ELSE 0 END) AS INTEGER)`,
      expense: sql<number>`CAST(SUM(CASE WHEN ${tipe_akun.nama} = 'Beban' THEN ${jurnal_umum.debit} - ${jurnal_umum.kredit} ELSE 0 END) AS INTEGER)`,
    })
    .from(jurnal_umum)
    .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
    .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
    .where(
      and(
        gte(jurnal_umum.tanggal_transaksi, startYear),
        lte(jurnal_umum.tanggal_transaksi, endYear),
        eq(jurnal_umum.cabang_id, targetCabang)
      )
    );

  const totalRev = plRes?.revenue || 0;
  const totalExp = plRes?.expense || 0;
  const netIncome = totalRev - totalExp;

  const noBuktiClose = `CLOSE/${tahun}/${targetCabang}`;

  const result = await db.transaction(async (tx) => {
    // 1. Tandai seluruh periode di tahun tersebut sebagai HARD_CLOSED
    await tx
      .update(periode_akuntansi)
      .set({
        status: "HARD_CLOSED",
        lock_date: endYear,
        closed_by: activeUser.id,
        closed_at: new Date().toISOString(),
      })
      .where(eq(periode_akuntansi.tahun, parseInt(tahun)));

    // 2. Buat Jurnal Penutup jika ada net income
    if (netIncome !== 0) {
      // Hapus jika sudah pernah ada penutupan sebelumnya
      await tx.delete(jurnal_umum).where(eq(jurnal_umum.no_referensi_bukti, noBuktiClose));

      const isProfit = netIncome > 0;
      const absIncome = Math.abs(netIncome);

      // Ikhtisar Laba Rugi / Closing Entry
      // Jika laba: Kredit Laba Ditahan, Debit Akun Ikhtisar
      await tx.insert(jurnal_umum).values([
        {
          tanggal_transaksi: endYear,
          no_referensi_bukti: noBuktiClose,
          deskripsi: `Jurnal Penutup Tahun Buku ${tahun}: Pemindahan Laba Bersih ke Laba Ditahan`,
          akun_id: retainedAccount.id,
          cabang_id: targetCabang,
          debit: isProfit ? 0 : absIncome,
          kredit: isProfit ? absIncome : 0,
          dibuat_oleh: activeUser.id,
        },
        {
          tanggal_transaksi: endYear,
          no_referensi_bukti: noBuktiClose,
          deskripsi: `Jurnal Penutup Tahun Buku ${tahun}: Penyeimbang Ikhtisar Laba Rugi`,
          akun_id: retainedAccount.id, // Offset balancing entry
          cabang_id: targetCabang,
          debit: isProfit ? absIncome : 0,
          kredit: isProfit ? 0 : absIncome,
          dibuat_oleh: activeUser.id,
        }
      ]);
    }

    return { total_pendapatan: totalRev, total_beban: totalExp, laba_bersih: netIncome };
  });

  return c.json({
    success: true,
    message: `Tahun buku ${tahun} berhasil ditutup permanen (Hard Closed)`,
    data: result
  });
});

// ============================================================================
// 2. MASTER MULTI-PAJAK & REKAPITULASI
// ============================================================================

// GET /pajak - Daftar seluruh jenis pajak
akuntansiLanjutanRoutes.get("/pajak", async (c) => {
  const data = await db
    .select({
      id: master_pajak.id,
      kode_pajak: master_pajak.kode_pajak,
      nama_pajak: master_pajak.nama_pajak,
      tipe_pajak: master_pajak.tipe_pajak,
      tarif_persen: master_pajak.tarif_persen,
      akun_pajak_keluaran: master_pajak.akun_pajak_keluaran,
      akun_pajak_masukan: master_pajak.akun_pajak_masukan,
      nama_akun_keluaran: sql<string>`keluaran.nama_akun`,
      kode_akun_keluaran: sql<string>`keluaran.kode_akun`,
      nama_akun_masukan: sql<string>`masukan.nama_akun`,
      kode_akun_masukan: sql<string>`masukan.kode_akun`,
      is_aktif: master_pajak.is_aktif,
    })
    .from(master_pajak)
    .leftJoin(sql`daftar_akun AS keluaran`, sql`${master_pajak.akun_pajak_keluaran} = keluaran.id`)
    .leftJoin(sql`daftar_akun AS masukan`, sql`${master_pajak.akun_pajak_masukan} = masukan.id`)
    .orderBy(master_pajak.kode_pajak);

  return c.json({ success: true, data });
});

// POST /pajak - Tambah jenis pajak baru
akuntansiLanjutanRoutes.post("/pajak", async (c) => {
  const body = await c.req.json();
  const { kode_pajak, nama_pajak, tipe_pajak, tarif_persen, akun_pajak_keluaran, akun_pajak_masukan } = body;

  if (!kode_pajak || !nama_pajak || !tarif_persen) {
    return c.json({ success: false, message: "Kode pajak, nama pajak, dan tarif persen wajib diisi" }, 400);
  }

  const [existing] = await db
    .select()
    .from(master_pajak)
    .where(eq(master_pajak.kode_pajak, kode_pajak.trim().toUpperCase()))
    .limit(1);

  if (existing) {
    return c.json({ success: false, message: "Kode pajak sudah terdaftar" }, 409);
  }

  const [newTax] = await db
    .insert(master_pajak)
    .values({
      kode_pajak: kode_pajak.trim().toUpperCase(),
      nama_pajak: nama_pajak.trim(),
      tipe_pajak: tipe_pajak || "PPN",
      tarif_persen: String(tarif_persen),
      akun_pajak_keluaran: akun_pajak_keluaran ? parseInt(akun_pajak_keluaran) : null,
      akun_pajak_masukan: akun_pajak_masukan ? parseInt(akun_pajak_masukan) : null,
      is_aktif: true,
    })
    .returning();

  return c.json({ success: true, message: "Pajak berhasil ditambahkan", data: newTax }, 201);
});

// PUT /pajak/:id - Update jenis pajak
akuntansiLanjutanRoutes.put("/pajak/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json();

  const [updated] = await db
    .update(master_pajak)
    .set({
      nama_pajak: body.nama_pajak?.trim(),
      tipe_pajak: body.tipe_pajak,
      tarif_persen: body.tarif_persen ? String(body.tarif_persen) : undefined,
      akun_pajak_keluaran: body.akun_pajak_keluaran ? parseInt(body.akun_pajak_keluaran) : null,
      akun_pajak_masukan: body.akun_pajak_masukan ? parseInt(body.akun_pajak_masukan) : null,
      is_aktif: body.is_aktif !== undefined ? Boolean(body.is_aktif) : undefined,
    })
    .where(eq(master_pajak.id, id))
    .returning();

  return c.json({ success: true, message: "Pajak berhasil diperbarui", data: updated });
});

// GET /pajak/rekapitulasi - Rekapitulasi Pajak Masukan vs Pajak Keluaran
akuntansiLanjutanRoutes.get("/pajak/rekapitulasi", async (c) => {
  const activeUser = c.get("user");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const idCabang = c.req.query("id_cabang") ? parseInt(c.req.query("id_cabang")!) : activeUser.id_cabang;

  // 1. Hitung Pajak Keluaran dari Penjualan POS (Berdasarkan estimasi PPN 11%/12%)
  const posCond = [];
  if (idCabang) posCond.push(eq(penjualan.id_cabang, idCabang));
  if (startDate) posCond.push(gte(penjualan.tanggal_invoice, startDate));
  if (endDate) posCond.push(lte(penjualan.tanggal_invoice, endDate));

  const [salesSummary] = await db
    .select({
      total_omzet: sql<number>`CAST(SUM(${penjualan.total_akhir}) AS INTEGER)`,
      jumlah_nota: sql<number>`COUNT(${penjualan.id_penjualan})`,
    })
    .from(penjualan)
    .where(posCond.length > 0 ? and(...posCond) : undefined);

  const totalOmzet = salesSummary?.total_omzet || 0;
  // Perhitungan DPP Include PPN 12%: DPP = Omzet / 1.12, PPN = Omzet - DPP
  const dppKeluaran = Math.round(totalOmzet / 1.12);
  const ppnKeluaran = totalOmzet - dppKeluaran;

  // 2. Hitung Pajak Masukan dari Faktur Beli Pembelian
  const buyCond = [];
  if (idCabang) buyCond.push(eq(faktur_beli.id_cabang, idCabang));
  if (startDate) buyCond.push(gte(faktur_beli.tanggal_faktur, startDate));
  if (endDate) buyCond.push(lte(faktur_beli.tanggal_faktur, endDate));

  const [buySummary] = await db
    .select({
      total_beli: sql<number>`CAST(SUM(${faktur_beli.total_faktur}) AS INTEGER)`,
      jumlah_faktur: sql<number>`COUNT(${faktur_beli.id_faktur})`,
    })
    .from(faktur_beli)
    .where(buyCond.length > 0 ? and(...buyCond) : undefined);

  const totalBeli = buySummary?.total_beli || 0;
  // Estimasi PPN Masukan (misal 11% dari barang bersumber PKP)
  const ppnMasukan = Math.round(totalBeli * 0.11);

  const selisihPajak = ppnKeluaran - ppnMasukan;
  const statusSpt = selisihPajak > 0 ? "KURANG_BAYAR" : selisihPajak < 0 ? "LEBIH_BAYAR" : "NIHIL";

  return c.json({
    success: true,
    data: {
      pajak_keluaran: {
        total_omzet: totalOmzet,
        dpp: dppKeluaran,
        ppn: ppnKeluaran,
        jumlah_transaksi: salesSummary?.jumlah_nota || 0,
      },
      pajak_masukan: {
        total_pembelian: totalBeli,
        ppn_masukan: ppnMasukan,
        jumlah_faktur: buySummary?.jumlah_faktur || 0,
      },
      spt_masa: {
        selisih: Math.abs(selisihPajak),
        status: statusSpt,
      }
    }
  });
});

// ============================================================================
// 3. ASET TETAP & DEPRESIASI GARIS LURUS OTOMATIS
// ============================================================================

// GET /aset-tetap - Daftar seluruh aset tetap
akuntansiLanjutanRoutes.get("/aset-tetap", async (c) => {
  const activeUser = c.get("user");
  const idCabang = c.req.query("id_cabang") ? parseInt(c.req.query("id_cabang")!) : activeUser.id_cabang;

  const conditions = [];
  if (idCabang) conditions.push(eq(aset_tetap.id_cabang, idCabang));

  const list = await db
    .select({
      id: aset_tetap.id,
      kode_aset: aset_tetap.kode_aset,
      nama_aset: aset_tetap.nama_aset,
      id_cabang: aset_tetap.id_cabang,
      nama_cabang: cabang.nama_cabang,
      kategori_aset: aset_tetap.kategori_aset,
      tanggal_perolehan: aset_tetap.tanggal_perolehan,
      harga_perolehan: aset_tetap.harga_perolehan,
      nilai_residu: aset_tetap.nilai_residu,
      masa_manfaat_bulan: aset_tetap.masa_manfaat_bulan,
      metode_penyusutan: aset_tetap.metode_penyusutan,
      beban_penyusutan_per_bulan: aset_tetap.beban_penyusutan_per_bulan,
      akumulasi_penyusutan: aset_tetap.akumulasi_penyusutan,
      nilai_buku: aset_tetap.nilai_buku,
      status: aset_tetap.status,
      akun_aset_id: aset_tetap.akun_aset_id,
      akun_akumulasi_id: aset_tetap.akun_akumulasi_id,
      akun_beban_id: aset_tetap.akun_beban_id,
    })
    .from(aset_tetap)
    .leftJoin(cabang, eq(aset_tetap.id_cabang, cabang.id_cabang))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(aset_tetap.kode_aset));

  return c.json({ success: true, data: list });
});

// POST /aset-tetap - Registrasi aset baru
akuntansiLanjutanRoutes.post("/aset-tetap", async (c) => {
  const activeUser = c.get("user");
  const body = await c.req.json();
  const {
    kode_aset,
    nama_aset,
    id_cabang,
    kategori_aset,
    tanggal_perolehan,
    harga_perolehan,
    nilai_residu,
    masa_manfaat_bulan,
    akun_aset_id,
    akun_akumulasi_id,
    akun_beban_id
  } = body;

  const hrg = parseInt(harga_perolehan) || 0;
  const res = parseInt(nilai_residu) || 0;
  const bln = parseInt(masa_manfaat_bulan) || 12;

  if (!kode_aset || !nama_aset || hrg <= 0 || bln <= 0) {
    return c.json({ success: false, message: "Parameter registrasi aset tidak valid" }, 400);
  }

  // Formula Garis Lurus: Beban Bulanan = (Harga - Residu) / Bulan
  const bebanBulanan = Math.round((hrg - res) / bln);
  const targetCabang = id_cabang ? parseInt(id_cabang) : (activeUser.id_cabang || 2);

  // Pastikan akun CoA valid (default fallback ke ID umum jika kosong)
  const idAkunAset = akun_aset_id ? parseInt(akun_aset_id) : 1;
  const idAkunAkumulasi = akun_akumulasi_id ? parseInt(akun_akumulasi_id) : 1;
  const idAkunBeban = akun_beban_id ? parseInt(akun_beban_id) : 8;

  const [newAsset] = await db
    .insert(aset_tetap)
    .values({
      kode_aset: kode_aset.trim().toUpperCase(),
      nama_aset: nama_aset.trim(),
      id_cabang: targetCabang,
      kategori_aset: kategori_aset || "Peralatan",
      tanggal_perolehan,
      harga_perolehan: hrg,
      nilai_residu: res,
      masa_manfaat_bulan: bln,
      metode_penyusutan: "GARIS_LURUS",
      beban_penyusutan_per_bulan: bebanBulanan,
      akumulasi_penyusutan: 0,
      nilai_buku: hrg,
      akun_aset_id: idAkunAset,
      akun_akumulasi_id: idAkunAkumulasi,
      akun_beban_id: idAkunBeban,
      status: "AKTIF",
    })
    .returning();

  return c.json({ success: true, message: "Aset tetap berhasil didaftarkan", data: newAsset }, 201);
});

// POST /aset-tetap/depresiasi-bulanan - Eksekusi 1-Klik Penyusutan Bulanan
akuntansiLanjutanRoutes.post("/aset-tetap/depresiasi-bulanan", async (c) => {
  const activeUser = c.get("user");
  const body = await c.req.json();
  const { bulan, tahun, id_cabang } = body;

  const bln = bulan ? parseInt(bulan) : new Date().getMonth() + 1;
  const thn = tahun ? parseInt(tahun) : new Date().getFullYear();
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Ambil seluruh aset aktif yang nilai bukunya masih di atas nilai residu
  const assetCond = [eq(aset_tetap.status, "AKTIF"), sql`${aset_tetap.nilai_buku} > ${aset_tetap.nilai_residu}`];
  if (id_cabang) assetCond.push(eq(aset_tetap.id_cabang, parseInt(id_cabang)));

  const activeAssets = await db.select().from(aset_tetap).where(and(...assetCond));

  if (activeAssets.length === 0) {
    return c.json({ success: false, message: "Tidak ada aset aktif yang memenuhi syarat untuk disusutkan." }, 200);
  }

  let totalBebanDisusutkan = 0;
  let jumlahAset = 0;

  await db.transaction(async (tx) => {
    for (const asset of activeAssets) {
      // Cek apakah aset ini sudah disusutkan untuk periode bulan & tahun tersebut
      const [alreadyDepreciated] = await tx
        .select()
        .from(riwayat_penyusutan)
        .where(
          and(
            eq(riwayat_penyusutan.id_aset, asset.id),
            eq(riwayat_penyusutan.periode_bulan, bln),
            eq(riwayat_penyusutan.periode_tahun, thn)
          )
        )
        .limit(1);

      if (alreadyDepreciated) continue; // Skip jika sudah pernah disusutkan

      // Hitung nominal penyusutan (tidak boleh melebihi sisa yang bisa disusutkan)
      const sisaBisaSusut = asset.nilai_buku - asset.nilai_residu;
      const nominalSusut = Math.min(asset.beban_penyusutan_per_bulan, sisaBisaSusut);

      if (nominalSusut <= 0) continue;

      const newAkumulasi = asset.akumulasi_penyusutan + nominalSusut;
      const newNilaiBuku = asset.harga_perolehan - newAkumulasi;

      // 1. Posting Jurnal Umum Otomatis
      const noBukti = `DEP/${thn}${String(bln).padStart(2, "0")}/${asset.kode_aset}`;

      // Line 1: Debit Beban Penyusutan
      const [jrnDebit] = await tx
        .insert(jurnal_umum)
        .values({
          tanggal_transaksi: todayStr,
          no_referensi_bukti: noBukti,
          deskripsi: `Penyusutan Aset Tetap: ${asset.nama_aset} (${bln}/${thn})`,
          akun_id: asset.akun_beban_id,
          cabang_id: asset.id_cabang,
          debit: nominalSusut,
          kredit: 0,
          dibuat_oleh: activeUser.id,
        })
        .returning();

      // Line 2: Kredit Akumulasi Penyusutan
      await tx.insert(jurnal_umum).values({
        tanggal_transaksi: todayStr,
        no_referensi_bukti: noBukti,
        deskripsi: `Penyusutan Aset Tetap: ${asset.nama_aset} (${bln}/${thn})`,
        akun_id: asset.akun_akumulasi_id,
        cabang_id: asset.id_cabang,
        debit: 0,
        kredit: nominalSusut,
        dibuat_oleh: activeUser.id,
      });

      // 2. Simpan Riwayat Penyusutan
      await tx.insert(riwayat_penyusutan).values({
        id_aset: asset.id,
        periode_bulan: bln,
        periode_tahun: thn,
        nominal_penyusutan: nominalSusut,
        id_jurnal: jrnDebit.id,
        tanggal_eksekusi: todayStr,
        dieksekusi_oleh: activeUser.id,
      });

      // 3. Perbarui Nilai Buku di Tabel Aset
      await tx
        .update(aset_tetap)
        .set({
          akumulasi_penyusutan: newAkumulasi,
          nilai_buku: newNilaiBuku,
        })
        .where(eq(aset_tetap.id, asset.id));

      totalBebanDisusutkan += nominalSusut;
      jumlahAset++;
    }
  });

  return c.json({
    success: true,
    message: `Penyusutan periode ${bln}/${thn} berhasil dieksekusi.`,
    data: {
      jumlah_aset_disusutkan: jumlahAset,
      total_nominal_depresiasi: totalBebanDisusutkan,
    }
  });
});

// ============================================================================
// 4. LAPORAN ARUS KAS FORMAL (DIRECT METHOD)
// ============================================================================

// GET /laporan/arus-kas - Laporan Arus Kas Metode Langsung
akuntansiLanjutanRoutes.get("/laporan/arus-kas", async (c) => {
  const activeUser = c.get("user");
  const startDate = c.req.query("startDate") || `${new Date().getFullYear()}-01-01`;
  const endDate = c.req.query("endDate") || new Date().toISOString().split("T")[0];
  const idCabang = c.req.query("id_cabang") ? parseInt(c.req.query("id_cabang")!) : activeUser.id_cabang;

  // I. ARUS KAS DARI AKTIVITAS OPERASI
  // A. Penerimaan dari Pelanggan (Kas Masuk Penjualan POS)
  const salesCond = [gte(penjualan.tanggal_invoice, startDate), lte(penjualan.tanggal_invoice, endDate)];
  if (idCabang) salesCond.push(eq(penjualan.id_cabang, idCabang));

  const [salesCash] = await db
    .select({
      total: sql<number>`CAST(SUM(${penjualan.total_akhir}) AS INTEGER)`,
    })
    .from(penjualan)
    .where(and(...salesCond));

  const penerimaanPelanggan = salesCash?.total || 0;

  // B. Pembayaran kepada Pemasok (Faktur Beli)
  const buyCond = [gte(faktur_beli.tanggal_faktur, startDate), lte(faktur_beli.tanggal_faktur, endDate)];
  if (idCabang) buyCond.push(eq(faktur_beli.id_cabang, idCabang));

  const [buyCash] = await db
    .select({
      total: sql<number>`CAST(SUM(${faktur_beli.total_faktur}) AS INTEGER)`,
    })
    .from(faktur_beli)
    .where(and(...buyCond));

  const pembayaranPemasok = buyCash?.total || 0;

  // C. Beban Operasional & Bisyaroh Karyawan (Dari Jurnal Beban)
  const journalCond = [gte(jurnal_umum.tanggal_transaksi, startDate), lte(jurnal_umum.tanggal_transaksi, endDate)];
  if (idCabang) journalCond.push(eq(jurnal_umum.cabang_id, idCabang));

  const [gajiRes] = await db
    .select({
      total: sql<number>`CAST(SUM(${jurnal_umum.debit}) AS INTEGER)`,
    })
    .from(jurnal_umum)
    .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
    .where(and(eq(daftar_akun.tipe_akun_id, 6), sql`${daftar_akun.kode_akun} LIKE '6.101%'`, ...journalCond));

  const pembayaranGaji = gajiRes?.total || 0;

  const [opsRes] = await db
    .select({
      total: sql<number>`CAST(SUM(${jurnal_umum.debit}) AS INTEGER)`,
    })
    .from(jurnal_umum)
    .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
    .where(and(eq(daftar_akun.tipe_akun_id, 6), sql`${daftar_akun.kode_akun} NOT LIKE '6.101%'`, ...journalCond));

  const pembayaranOperasional = opsRes?.total || 0;

  const netOperasi = penerimaanPelanggan - pembayaranPemasok - pembayaranGaji - pembayaranOperasional;

  // II. ARUS KAS DARI AKTIVITAS INVESTASI (Pembelian Aset Tetap)
  const assetCond = [gte(aset_tetap.tanggal_perolehan, startDate), lte(aset_tetap.tanggal_perolehan, endDate)];
  if (idCabang) assetCond.push(eq(aset_tetap.id_cabang, idCabang));

  const [assetBuy] = await db
    .select({
      total: sql<number>`CAST(SUM(${aset_tetap.harga_perolehan}) AS INTEGER)`,
    })
    .from(aset_tetap)
    .where(and(...assetCond));

  const pembelianAset = assetBuy?.total || 0;
  const netInvestasi = 0 - pembelianAset;

  // III. ARUS KAS DARI AKTIVITAS PENDANAAN (Modal Pemilik)
  const [modalRes] = await db
    .select({
      total: sql<number>`CAST(SUM(${jurnal_umum.kredit}) - SUM(${jurnal_umum.debit}) AS INTEGER)`,
    })
    .from(jurnal_umum)
    .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
    .where(and(eq(daftar_akun.tipe_akun_id, 3), ...journalCond));

  const netPendanaan = modalRes?.total || 0;

  const kenaikanBersihKas = netOperasi + netInvestasi + netPendanaan;

  // Saldo Awal Kas
  const [saldoKasAwalRes] = await db
    .select({
      total: sql<number>`CAST(SUM(${rekening_kas.saldo_awal}) AS INTEGER)`,
    })
    .from(rekening_kas)
    .where(idCabang ? eq(rekening_kas.id_cabang, idCabang) : undefined);

  const saldoAwalKas = saldoKasAwalRes?.total || 0;
  const saldoAkhirKas = saldoAwalKas + kenaikanBersihKas;

  return c.json({
    success: true,
    data: {
      periode: { startDate, endDate },
      aktivitas_operasi: {
        penerimaan_dari_pelanggan: penerimaanPelanggan,
        pembayaran_ke_pemasok: pembayaranPemasok,
        pembayaran_gaji_bisyaroh: pembayaranGaji,
        pembayaran_beban_operasional: pembayaranOperasional,
        arus_kas_bersih_operasi: netOperasi,
      },
      aktivitas_investasi: {
        pembelian_aset_tetap: pembelianAset,
        arus_kas_bersih_investasi: netInvestasi,
      },
      aktivitas_pendanaan: {
        setoran_modal_prive: netPendanaan,
        arus_kas_bersih_pendanaan: netPendanaan,
      },
      ringkasan: {
        kenaikan_bersih_kas: kenaikanBersihKas,
        saldo_awal_kas: saldoAwalKas,
        saldo_akhir_kas: saldoAkhirKas,
      }
    }
  });
});

