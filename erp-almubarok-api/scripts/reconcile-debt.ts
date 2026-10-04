import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("🔄 Memulai rekonsiliasi saldo hutang supplier...");

  const updateQuery = sql`
    UPDATE supplier s
    SET hutang = COALESCE((
      SELECT SUM(f.total_faktur)
      FROM faktur_beli f
      WHERE f.id_supplier = s.id_supplier
        AND f.status_pembayaran IN ('Belum Lunas', 'Belum Dibayar')
    ), 0);
  `;

  await db.execute(updateQuery);

  const results = await db.execute(sql`
    SELECT id_supplier, nama_supplier, hutang
    FROM supplier
    WHERE hutang > 0
    ORDER BY hutang DESC;
  `);

  console.log("✅ Berhasil merekonsiliasi saldo hutang supplier:");
  console.table(results.rows);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error rekonsiliasi:", err);
  process.exit(1);
});
