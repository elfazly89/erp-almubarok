import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function migrateHpp() {
  console.log("🔄 Memulai migrasi data HPP pada penjualan_detail...\n");

  try {
    // We only update rows where jumlah * isi_satuan > 1 because if totalPcs is 1, division does nothing.
    // Also, we ensure that division by zero does not happen.
    const query = `
      UPDATE penjualan_detail 
      SET harga_rata_saat_transaksi = harga_rata_saat_transaksi / (jumlah * isi_satuan) 
      WHERE (jumlah * isi_satuan) > 1 
        AND harga_rata_saat_transaksi > 0;
    `;

    const result = await db.execute(sql.raw(query));
    console.log("✅ Berhasil memigrasi data HPP penjualan_detail.");
    console.log(`ℹ️ Detail eksekusi:`, result);
  } catch (err: any) {
    console.error("❌ Gagal memproses migrasi HPP:", err.message);
    process.exit(1);
  }

  process.exit(0);
}

migrateHpp().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
