import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/erp_almubarok",
});

async function runCleanup() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("🧹 Memulai pembersihan mock data modul kas & entitas terkait...");

    // 1. Hapus transaksi modal investor uji coba yang mereferensikan kas_transaksi
    const delInvModal = await client.query(`
      DELETE FROM investor_transaksi_modal 
      WHERE nomor_referensi ILIKE '%TEST%' 
         OR keterangan ILIKE '%Uji%' 
         OR id_kas_transaksi IS NOT NULL
    `);
    console.log(`✅ Hapus investor_transaksi_modal uji coba: ${delInvModal.rowCount} baris dihapus`);

    // Reset saldo modal investor ke 0
    await client.query("UPDATE investor_profil SET saldo_modal_saat_ini = 0, updated_at = NOW()::text");
    console.log("✅ Reset saldo_modal_saat_ini investor_profil disetel ke Rp 0");

    // 2. Hapus kas_transaksi
    const delKasTx = await client.query("DELETE FROM kas_transaksi");
    console.log(`✅ Hapus kas_transaksi: ${delKasTx.rowCount} baris dihapus`);

    // Reset sequence kas_transaksi_id_seq
    await client.query("ALTER SEQUENCE IF EXISTS kas_transaksi_id_seq RESTART WITH 1");
    console.log("✅ Sequence kas_transaksi_id_seq direset ke 1");

    // 3. Hapus kasir_shift uji coba
    const delShift = await client.query("DELETE FROM kasir_shift");
    console.log(`✅ Hapus kasir_shift: ${delShift.rowCount} baris dihapus`);

    // Reset sequence kasir_shift_id_seq
    await client.query("ALTER SEQUENCE IF EXISTS kasir_shift_id_seq RESTART WITH 1");
    console.log("✅ Sequence kasir_shift_id_seq direset ke 1");

    // 4. Reset rekonsiliasi_kas
    const delRecon = await client.query("DELETE FROM rekonsiliasi_kas");
    console.log(`✅ Hapus rekonsiliasi_kas: ${delRecon.rowCount} baris dihapus`);
    await client.query("ALTER SEQUENCE IF EXISTS rekonsiliasi_kas_id_seq RESTART WITH 1");

    // 5. Reset saldo rekening_kas ke 0
    const resetRek = await client.query("UPDATE rekening_kas SET saldo = 0, saldo_awal = 0, updated_at = NOW()::text");
    console.log(`✅ Reset saldo rekening_kas: ${resetRek.rowCount} rekening disetel ke Rp 0`);

    // 6. Hapus jurnal akuntansi terkait mutasi kas & modal uji coba
    const delJurnal = await client.query(`
      DELETE FROM jurnal_umum 
      WHERE no_referensi_bukti IN ('KM/20261031/3/TEST-5109', 'TEST-CAP-1793545441423')
         OR deskripsi ILIKE '%Uji Setoran Modal%'
         OR deskripsi ILIKE '%TEST-5109%'
    `);
    console.log(`✅ Hapus jurnal_umum uji coba: ${delJurnal.rowCount} baris dihapus`);

    // 7. Hapus faktur penjualan POS uji coba & detailnya
    const delPenjDetail = await client.query(`
      DELETE FROM penjualan_detail 
      WHERE id_penjualan IN (
        SELECT id_penjualan FROM penjualan 
        WHERE no_invoice = 'INV/20261031/3/TEST-5109' OR nama_pelanggan = 'Pelanggan Uji'
      )
    `);
    console.log(`✅ Hapus penjualan_detail uji coba: ${delPenjDetail.rowCount} baris dihapus`);

    const delPenj = await client.query(`
      DELETE FROM penjualan 
      WHERE no_invoice = 'INV/20261031/3/TEST-5109' OR nama_pelanggan = 'Pelanggan Uji'
    `);
    console.log(`✅ Hapus penjualan uji coba: ${delPenj.rowCount} faktur dihapus`);

    await client.query("COMMIT");
    console.log("\n🎉 SELURUH MOCK DATA MODUL KAS TELAH BERHASIL DIBERSIHKAN!");
    console.log("🚀 MODUL KAS, SHIFT KASIR, DAN BUKU BESAR RESMI SIAP PRODUCTION.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Terjadi kesalahan saat pembersihan. Perubahan dibatalkan (ROLLBACK):", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runCleanup();
