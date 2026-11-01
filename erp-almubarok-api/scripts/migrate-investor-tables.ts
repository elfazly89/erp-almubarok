import { pool } from "../src/lib/db";

async function migrate() {
  console.log("🚀 Menjalankan migrasi tabel Manajemen Investor...");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. investor_profil
    await client.query(`
      CREATE TABLE IF NOT EXISTS investor_profil (
        id SERIAL PRIMARY KEY,
        nama_investor TEXT NOT NULL,
        nomor_identitas TEXT,
        telepon TEXT,
        email TEXT,
        alamat TEXT,
        nama_bank TEXT NOT NULL,
        nomor_rekening TEXT NOT NULL,
        atas_nama_rekening TEXT NOT NULL,
        nisbah_pengelola NUMERIC DEFAULT 40 NOT NULL,
        nisbah_investor NUMERIC DEFAULT 60 NOT NULL,
        saldo_modal_saat_ini NUMERIC DEFAULT 0 NOT NULL,
        akumulasi_defisit NUMERIC DEFAULT 0 NOT NULL,
        status TEXT DEFAULT 'AKTIF' NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabel investor_profil terverifikasi");

    // 2. investor_transaksi_modal
    await client.query(`
      CREATE TABLE IF NOT EXISTS investor_transaksi_modal (
        id SERIAL PRIMARY KEY,
        nomor_referensi TEXT NOT NULL UNIQUE,
        id_investor INTEGER NOT NULL REFERENCES investor_profil(id),
        jenis_transaksi TEXT NOT NULL,
        tanggal_transaksi TEXT NOT NULL,
        nominal NUMERIC NOT NULL,
        id_rekening_kas INTEGER REFERENCES rekening_kas(id),
        id_kas_transaksi INTEGER REFERENCES kas_transaksi(id),
        id_jurnal INTEGER,
        keterangan TEXT,
        bukti_lampiran TEXT,
        status TEXT DEFAULT 'PENDING' NOT NULL,
        diajukan_oleh INTEGER NOT NULL REFERENCES users(id),
        disetujui_oleh INTEGER REFERENCES users(id),
        tanggal_persetujuan TEXT,
        catatan_persetujuan TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabel investor_transaksi_modal terverifikasi");

    // 3. investor_bagi_hasil
    await client.query(`
      CREATE TABLE IF NOT EXISTS investor_bagi_hasil (
        id SERIAL PRIMARY KEY,
        nomor_rekap TEXT NOT NULL UNIQUE,
        id_investor INTEGER NOT NULL REFERENCES investor_profil(id),
        periode_bulan INTEGER NOT NULL,
        periode_tahun INTEGER NOT NULL,
        tanggal_mulai TEXT NOT NULL,
        tanggal_selesai TEXT NOT NULL,
        total_penjualan_bruto NUMERIC DEFAULT 0 NOT NULL,
        total_diskon_retur NUMERIC DEFAULT 0 NOT NULL,
        total_penjualan_bersih NUMERIC DEFAULT 0 NOT NULL,
        total_hpp NUMERIC DEFAULT 0 NOT NULL,
        total_laba_kotor NUMERIC DEFAULT 0 NOT NULL,
        total_beban_operasional NUMERIC DEFAULT 0 NOT NULL,
        laba_konsolidasi_kotor NUMERIC DEFAULT 0 NOT NULL,
        defisit_bulan_lalu NUMERIC DEFAULT 0 NOT NULL,
        laba_kena_bagi_hasil NUMERIC DEFAULT 0 NOT NULL,
        defisit_terbawa_berikutnya NUMERIC DEFAULT 0 NOT NULL,
        nisbah_pengelola_persen NUMERIC NOT NULL,
        nisbah_investor_persen NUMERIC NOT NULL,
        nominal_hak_pengelola NUMERIC DEFAULT 0 NOT NULL,
        nominal_hak_investor NUMERIC DEFAULT 0 NOT NULL,
        metode_penyelesaian TEXT DEFAULT 'TRANSFER_BANK',
        nominal_transfer NUMERIC DEFAULT 0 NOT NULL,
        nominal_reinvestasi NUMERIC DEFAULT 0 NOT NULL,
        id_rekening_kas INTEGER REFERENCES rekening_kas(id),
        id_kas_transaksi INTEGER,
        id_jurnal INTEGER,
        status TEXT DEFAULT 'PENDING' NOT NULL,
        diajukan_oleh INTEGER NOT NULL REFERENCES users(id),
        disetujui_oleh INTEGER REFERENCES users(id),
        tanggal_persetujuan TEXT,
        catatan TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Tabel investor_bagi_hasil terverifikasi");

    // 4. investor_bagi_hasil_cabang
    await client.query(`
      CREATE TABLE IF NOT EXISTS investor_bagi_hasil_cabang (
        id SERIAL PRIMARY KEY,
        id_bagi_hasil INTEGER NOT NULL REFERENCES investor_bagi_hasil(id) ON DELETE CASCADE,
        id_cabang INTEGER NOT NULL REFERENCES cabang(id_cabang),
        penjualan_bersih NUMERIC NOT NULL,
        hpp NUMERIC NOT NULL,
        laba_kotor NUMERIC NOT NULL,
        beban_operasional NUMERIC NOT NULL,
        laba_operasional NUMERIC NOT NULL
      );
    `);
    console.log("✅ Tabel investor_bagi_hasil_cabang terverifikasi");

    // 5. Inisialisasi profil investor default jika belum ada
    const res = await client.query("SELECT id FROM investor_profil LIMIT 1");
    if (res.rows.length === 0) {
      await client.query(`
        INSERT INTO investor_profil (
          nama_investor, nomor_identitas, telepon, email, alamat,
          nama_bank, nomor_rekening, atas_nama_rekening,
          nisbah_pengelola, nisbah_investor, saldo_modal_saat_ini, status
        ) VALUES (
          'Investor Utama Konsorsium Al-Mubarok',
          '3509012345670001',
          '081234567890',
          'investor@almubarok.co.id',
          'Jember, Jawa Timur',
          'Bank Mandiri',
          '1430099887766',
          'Konsorsium Pemodal Al-Mubarok',
          40, 60, 0, 'AKTIF'
        );
      `);
      console.log("🌱 Default profil investor berhasil diinisialisasi");
    }

    await client.query("COMMIT");
    console.log("🎉 Migrasi tabel investor SELESAI dan SUKSES!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Gagal migrasi tabel investor:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
