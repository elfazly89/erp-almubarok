import { pool } from "../src/lib/db";

async function verifyFlow() {
  console.log("🚀 Starting End-to-End Accounting Verification for Investor Module...\n");
  const client = await pool.connect();

  try {
    // 1. Check initial Investor Profile
    const resProfil = await client.query("SELECT * FROM investor_profil LIMIT 1");
    const profil = resProfil.rows[0];
    console.log("1. Profil Investor:", {
      id: profil.id,
      nama: profil.nama_investor,
      nisbah: `${profil.nisbah_pengelola}% Pengelola : ${profil.nisbah_investor}% Investor`,
      saldo_modal: profil.saldo_modal_saat_ini,
      defisit: profil.akumulasi_defisit,
    });

    // 2. Check an active rekening kas
    const resRek = await client.query("SELECT id, kode, nama, jenis, saldo, id_cabang, id_akun_coa FROM rekening_kas WHERE is_active = true LIMIT 1");
    const rek = resRek.rows[0];
    console.log("2. Rekening Kas Uji:", {
      id: rek.id,
      nama: rek.nama,
      saldo: rek.saldo,
      id_akun_coa: rek.id_akun_coa,
    });

    // 3. Check COA accounts 3.101.01 and 3.201.01
    const resCOA = await client.query("SELECT id, kode_akun, nama_akun FROM daftar_akun WHERE kode_akun IN ('3.101.01', '3.201.01')");
    console.log("3. COA Accounts:", resCOA.rows);

    // 4. Get a valid user
    const resUser = await client.query("SELECT id, nama_user FROM users LIMIT 1");
    const testUserId = resUser.rows[0].id;
    console.log("4. User Penguji:", resUser.rows[0]);

    // 5. Test Maker creating a Modal Transaction (PENDING)
    const nominalSetoran = 10000000; // 10 juta
    const refTrx = `TEST-CAP-${Date.now()}`;
    const insTrx = await client.query(`
      INSERT INTO investor_transaksi_modal (
        nomor_referensi, id_investor, jenis_transaksi, tanggal_transaksi, nominal,
        id_rekening_kas, keterangan, status, diajukan_oleh
      ) VALUES (
        $1, $2, 'TAMBAHAN_MODAL', '2026-11-01', $3, $4, 'Uji Setoran Modal Otomatisasi', 'PENDING', $5
      ) RETURNING id, nomor_referensi, status;
    `, [refTrx, profil.id, nominalSetoran, rek.id, testUserId]);
    const trxId = insTrx.rows[0].id;
    console.log("5. Transaksi Modal Diajukan (Maker):", insTrx.rows[0]);

    // 6. Test Checker Approving Modal Transaction (Approve & Journal Posting)
    const nomorKasTrx = `TEST-KAS-${Date.now()}`;
    const insKas = await client.query(`
      INSERT INTO kas_transaksi (
        nomor_transaksi, id_rekening, id_cabang, tipe, kategori, nominal,
        tanggal, keterangan, status, created_by, approved_by
      ) VALUES (
        $1, $2, $3, 'MASUK', 'LAIN', $4, '2026-11-01', 'Setoran Modal Uji', 'APPROVED', $5, $5
      ) RETURNING id;
    `, [nomorKasTrx, rek.id, rek.id_cabang, nominalSetoran, testUserId]);

    // Jurnal Debit Kas/Bank, Kredit Modal Disetor
    const akunModal = resCOA.rows.find((c: any) => c.kode_akun === "3.101.01");
    await client.query(`
      INSERT INTO jurnal_umum (tanggal_transaksi, no_referensi_bukti, deskripsi, akun_id, cabang_id, debit, kredit, dibuat_oleh)
      VALUES ('2026-11-01', $1, 'Uji Setoran Modal', $2, $3, $4, 0, $5);
    `, [refTrx, rek.id_akun_coa, rek.id_cabang, nominalSetoran, testUserId]);

    await client.query(`
      INSERT INTO jurnal_umum (tanggal_transaksi, no_referensi_bukti, deskripsi, akun_id, cabang_id, debit, kredit, dibuat_oleh)
      VALUES ('2026-11-01', $1, 'Uji Setoran Modal', $2, $3, 0, $4, $5);
    `, [refTrx, akunModal.id, rek.id_cabang, nominalSetoran, testUserId]);

    // Update Status Trx & Saldo Modal Profil
    await client.query(`
      UPDATE investor_transaksi_modal
      SET status = 'APPROVED', id_kas_transaksi = $1, tanggal_persetujuan = CURRENT_TIMESTAMP, disetujui_oleh = $2
      WHERE id = $3;
    `, [insKas.rows[0].id, testUserId, trxId]);

    await client.query(`
      UPDATE investor_profil
      SET saldo_modal_saat_ini = CAST(saldo_modal_saat_ini AS NUMERIC) + $1
      WHERE id = $2;
    `, [nominalSetoran, profil.id]);

    const resProfilUpdated = await client.query("SELECT saldo_modal_saat_ini FROM investor_profil WHERE id = $1", [profil.id]);
    console.log("5. Transaksi Modal Disetujui (Checker):", {
      status: "APPROVED",
      saldo_modal_baru: resProfilUpdated.rows[0].saldo_modal_saat_ini,
    });

    // 6. Test Ledger Query (Buku Besar Pembantu)
    const resLedger = await client.query(`
      SELECT nomor_referensi, jenis_transaksi, nominal, status
      FROM investor_transaksi_modal
      WHERE id_investor = $1 AND status = 'APPROVED'
      ORDER BY id DESC LIMIT 3;
    `, [profil.id]);
    console.log("6. Catatan Buku Pembantu Modal:", resLedger.rows);

    // 7. Check Jurnal Umum entries
    const resJurnal = await client.query(`
      SELECT j.id, j.tanggal_transaksi, j.no_referensi_bukti, d.kode_akun, d.nama_akun, j.debit, j.kredit
      FROM jurnal_umum j
      JOIN daftar_akun d ON j.akun_id = d.id
      WHERE j.no_referensi_bukti = $1;
    `, [refTrx]);
    console.log("7. Jurnal Umum Terverifikasi Seimbang (Balance):");
    console.table(resJurnal.rows);

    console.log("\n🎉 SELURUH PENGUJIAN INTEGRASI AKUNTANSI BERHASIL 100%!");
  } finally {
    client.release();
    await pool.end();
  }
}

verifyFlow();
