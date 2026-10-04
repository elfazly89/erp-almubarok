import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("=== AUDIT DATA MODUL PEMBELIAN ===");

  // 1. Menu Sub
  const menus = await db.execute(sql`SELECT id, id_menu_main, nama, link, aktif FROM menu_sub WHERE link LIKE '%pembelian%'`);
  console.log("\n--- MENU SUB PEMBELIAN ---");
  console.table(menus.rows);

  // 2. Pesan Beli Counts by Status
  const poStatuses = await db.execute(sql`SELECT status, count(*) as count, sum(total_harga_pesan_beli) as total_nominal FROM pesan_beli GROUP BY status`);
  console.log("\n--- PESAN BELI BY STATUS ---");
  console.table(poStatuses.rows);

  // 3. Faktur Beli Counts by Payment Status
  const invStatuses = await db.execute(sql`SELECT status_pembayaran, count(*) as count, sum(total_faktur) as total_nominal FROM faktur_beli GROUP BY status_pembayaran`);
  console.log("\n--- FAKTUR BELI BY STATUS PEMBAYARAN ---");
  console.table(invStatuses.rows);

  // 4. Invoices linked to PO vs independent
  const invPoLink = await db.execute(sql`SELECT (id_po IS NOT NULL) as linked_to_po, count(*) as count, sum(total_faktur) as total_nominal FROM faktur_beli GROUP BY (id_po IS NOT NULL)`);
  console.log("\n--- FAKTUR BELI LINKED TO PO ---");
  console.table(invPoLink.rows);

  // 5. Suppliers with debt vs actual unpaid invoices
  const debtComparison = await db.execute(sql`
    SELECT 
      s.id_supplier, 
      s.nama_supplier, 
      s.hutang as recorded_supplier_debt,
      COALESCE(SUM(CASE WHEN f.status_pembayaran IN ('Belum Lunas', 'Belum Dibayar') THEN f.total_faktur ELSE 0 END), 0) as calculated_unpaid_invoices
    FROM supplier s
    LEFT JOIN faktur_beli f ON s.id_supplier = f.id_supplier
    GROUP BY s.id_supplier, s.nama_supplier, s.hutang
    HAVING s.hutang > 0 OR COALESCE(SUM(CASE WHEN f.status_pembayaran IN ('Belum Lunas', 'Belum Dibayar') THEN f.total_faktur ELSE 0 END), 0) > 0
    ORDER BY calculated_unpaid_invoices DESC
  `);
  console.log("\n--- SUPPLIER DEBT DISCREPANCY COMPARISON ---");
  console.table(debtComparison.rows);

  // 6. Check Bayar Hutang records
  const payments = await db.execute(sql`SELECT count(*) as count, COALESCE(sum(jumlah_bayar), 0) as total_paid FROM bayar_hutang`);
  console.log("\n--- RIWAYAT BAYAR HUTANG ---");
  console.table(payments.rows);

  // 7. Check Barang HPP stats
  const hppStats = await db.execute(sql`
    SELECT 
      count(*) as total_barang,
      count(case when harga_rata is null or harga_rata = 0 then 1 end) as barang_tanpa_harga_rata,
      count(case when harga_beli is null or harga_beli = 0 then 1 end) as barang_tanpa_harga_beli
    FROM barang
  `);
  console.log("\n--- BARANG HPP / HARGA BELI STATS ---");
  console.table(hppStats.rows);

  // 8. Role Permissions for Pembelian Submenus
  const rolePerms = await db.execute(sql`
    SELECT 
      j.id_jabatan,
      j.jabatan,
      ms.nama as submenu,
      rms.aktif,
      rms.can_create,
      rms.can_read,
      rms.can_update,
      rms.can_delete
    FROM role_menu_sub rms
    JOIN jabatan j ON rms.id_jabatan = j.id_jabatan
    JOIN menu_sub ms ON rms.id_menu_sub = ms.id
    WHERE ms.id IN (143, 144, 145, 146)
    ORDER BY j.id_jabatan, ms.id
  `);
  console.log("\n--- ROLE PERMISSIONS PEMBELIAN ---");
  console.table(rolePerms.rows);

  process.exit(0);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
