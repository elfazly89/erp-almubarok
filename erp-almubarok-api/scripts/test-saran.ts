import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  const query = sql`
    WITH sales_summary AS (
      SELECT 
        pd.id_barang,
        COALESCE(SUM(pd.jumlah * pd.isi_satuan), 0) as total_qty_sold,
        ROUND(COALESCE(SUM(pd.jumlah * pd.isi_satuan) / 30.0, 0), 2) as ads_30
      FROM penjualan_detail pd
      JOIN penjualan p ON pd.id_penjualan = p.id_penjualan
      GROUP BY pd.id_barang
    ),
    stock_summary AS (
      SELECT 
        st.id_barang,
        COALESCE(SUM(st.stok_akhir), 0) as total_stok,
        COALESCE(SUM(st.minimal_stok), 0) as total_min_stok
      FROM stok_barang st
      GROUP BY st.id_barang
    ),
    po_on_order AS (
      SELECT 
        pbd.id_barang,
        COALESCE(SUM(pbd.jumlah_barang), 0) as total_on_order
      FROM pesan_beli_detail pbd
      JOIN pesan_beli pb ON pbd.id_pesan_beli = pb.id_pesan_beli
      WHERE pb.status IN ('PENDING', 'Diproses')
      GROUP BY pbd.id_barang
    )
    SELECT 
      b.id_barang,
      b.barcode,
      b.nama_barang,
      b.id_supplier,
      s.nama_supplier,
      b.satuan_1,
      b.satuan_2,
      b.satuan_3,
      COALESCE(b.isi_2, 1) as isi_2,
      COALESCE(b.isi_3, 1) as isi_3,
      COALESCE(b.harga_beli, 0) as harga_beli,
      COALESCE(ss.total_stok, 0) as total_stok,
      COALESCE(ss.total_min_stok, 0) as total_min_stok,
      COALESCE(sl.ads_30, 0) as ads_30,
      COALESCE(sl.total_qty_sold, 0) as total_qty_sold,
      COALESCE(poo.total_on_order, 0) as total_on_order
    FROM barang b
    LEFT JOIN supplier s ON b.id_supplier = s.id_supplier
    LEFT JOIN sales_summary sl ON b.id_barang = sl.id_barang
    LEFT JOIN stock_summary ss ON b.id_barang = ss.id_barang
    LEFT JOIN po_on_order poo ON b.id_barang = poo.id_barang
    ORDER BY sl.total_qty_sold DESC NULLS LAST
    LIMIT 10;
  `;

  const results = await db.execute(query);
  console.log("CTE Results sample:");
  console.table(results.rows);

  process.exit(0);
}

main().catch(console.error);
