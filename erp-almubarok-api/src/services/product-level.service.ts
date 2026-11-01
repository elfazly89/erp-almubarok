import { db } from "../lib/db";
import { barang, stok_barang } from "../lib/db/schema";
import { eq, sql } from "drizzle-orm";

export interface RecalculateResult {
  total: number;
  fast: number;
  medium: number;
  slow: number;
  dead: number;
  timestamp: string;
}

/**
 * Menghitung ulang level perputaran (FSN: FAST, MEDIUM, SLOW, DEAD)
 * untuk seluruh master barang dan stok barang cabang.
 * 
 * Aturan Days Since Last Sale:
 * - < 3 hari     => FAST
 * - 4 - 14 hari  => MEDIUM
 * - 15 - 60 hari => SLOW
 * - > 60 hari    => DEAD
 * 
 * Proteksi Produk Baru:
 * - Produk yang belum pernah ada transaksi penjualan tetapi umur produk < 30 hari
 *   tetap dipertahankan status awalnya (default: MEDIUM) dan tidak langsung dicap DEAD.
 */
export async function recalculateProductLevels(): Promise<RecalculateResult> {
  const now = new Date();
  const nowStr = now.toISOString().replace("T", " ").substring(0, 19);

  // 1. Ambil data penjualan terakhir per barang secara global
  const globalSalesQuery = await db.execute(sql`
    SELECT 
      pd.id_barang,
      MAX(p.tanggal_invoice || ' ' || p.jam_invoice) as last_sale_full,
      MAX(p.tanggal_invoice) as last_sale_date
    FROM penjualan_detail pd
    JOIN penjualan p ON pd.id_penjualan = p.id_penjualan
    GROUP BY pd.id_barang
  `);

  const lastSaleGlobalMap = new Map<number, { lastSaleFull: string; lastSaleDate: string }>();
  for (const row of globalSalesQuery.rows as any[]) {
    if (row.id_barang) {
      lastSaleGlobalMap.set(Number(row.id_barang), {
        lastSaleFull: row.last_sale_full,
        lastSaleDate: row.last_sale_date,
      });
    }
  }

  // 2. Ambil data penjualan terakhir per barang per cabang
  const branchSalesQuery = await db.execute(sql`
    SELECT 
      pd.id_barang,
      p.id_cabang,
      MAX(p.tanggal_invoice || ' ' || p.jam_invoice) as last_sale_full,
      MAX(p.tanggal_invoice) as last_sale_date
    FROM penjualan_detail pd
    JOIN penjualan p ON pd.id_penjualan = p.id_penjualan
    WHERE p.id_cabang IS NOT NULL
    GROUP BY pd.id_barang, p.id_cabang
  `);

  const lastSaleBranchMap = new Map<string, { lastSaleFull: string; lastSaleDate: string }>();
  for (const row of branchSalesQuery.rows as any[]) {
    if (row.id_barang && row.id_cabang) {
      const key = `${row.id_barang}_${row.id_cabang}`;
      lastSaleBranchMap.set(key, {
        lastSaleFull: row.last_sale_full,
        lastSaleDate: row.last_sale_date,
      });
    }
  }

  // 3. Ambil seluruh data master barang
  const allBarang = await db.select({
    id_barang: barang.id_barang,
    level_barang: barang.level_barang,
    level_mode: barang.level_mode,
    created_at: barang.created_at,
  }).from(barang);

  let countFast = 0;
  let countMedium = 0;
  let countSlow = 0;
  let countDead = 0;

  const barangUpdates: { id_barang: number; level_barang: string; terakhir_terjual: string | null }[] = [];

  for (const b of allBarang) {
    const saleInfo = lastSaleGlobalMap.get(b.id_barang);
    let calculatedLevel: "FAST" | "MEDIUM" | "SLOW" | "DEAD" = "MEDIUM";
    let lastSaleFull: string | null = null;

    if (saleInfo && saleInfo.lastSaleDate) {
      lastSaleFull = saleInfo.lastSaleFull;
      const saleDate = new Date(saleInfo.lastSaleDate);
      const diffTime = now.getTime() - saleDate.getTime();
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      if (diffDays < 3) {
        calculatedLevel = "FAST";
      } else if (diffDays <= 14) {
        calculatedLevel = "MEDIUM";
      } else if (diffDays <= 60) {
        calculatedLevel = "SLOW";
      } else {
        calculatedLevel = "DEAD";
      }
    } else {
      // Belum pernah ada transaksi
      // Cek apakah produk baru (< 30 hari sejak created_at)
      let isNewProduct = false;
      if (b.created_at) {
        const createdDate = new Date(b.created_at);
        if (!isNaN(createdDate.getTime())) {
          const ageDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          if (ageDays <= 30) {
            isNewProduct = true;
          }
        }
      }

      if (isNewProduct) {
        // Pertahankan status default input (atau MEDIUM)
        calculatedLevel = (b.level_barang as any) || "MEDIUM";
      } else {
        // Produk lama tapi tidak pernah terjual
        calculatedLevel = "DEAD";
      }
    }

    // Tentukan level final: jika MANUAL, pertahankan level_barang yang sudah diset user
    const finalLevel = b.level_mode === "MANUAL" && b.level_barang ? b.level_barang : calculatedLevel;

    // Counter statistik
    if (finalLevel === "FAST") countFast++;
    else if (finalLevel === "MEDIUM") countMedium++;
    else if (finalLevel === "SLOW") countSlow++;
    else if (finalLevel === "DEAD") countDead++;

    barangUpdates.push({
      id_barang: b.id_barang,
      level_barang: finalLevel,
      terakhir_terjual: lastSaleFull,
    });
  }

  // Batch update barang dalam potongan 400 baris untuk efisiensi tinggi
  const BATCH_SIZE = 400;
  for (let i = 0; i < barangUpdates.length; i += BATCH_SIZE) {
    const chunk = barangUpdates.slice(i, i + BATCH_SIZE);
    const valuesClause = chunk
      .map(
        (item) =>
          `(${item.id_barang}, '${item.level_barang}', ${
            item.terakhir_terjual ? `'${item.terakhir_terjual.replace(/'/g, "''")}'` : "NULL"
          })`
      )
      .join(", ");

    await db.execute(sql.raw(`
      UPDATE barang AS b
      SET 
        level_barang = v.level_barang,
        terakhir_terjual = v.terakhir_terjual
      FROM (VALUES ${valuesClause}) AS v(id_barang, level_barang, terakhir_terjual)
      WHERE b.id_barang = v.id_barang;
    `));
  }

  // 4. Update stok_barang per cabang
  const allStok = await db.select({
    id: stok_barang.id,
    id_barang: stok_barang.id_barang,
    id_cabang: stok_barang.id_cabang,
  }).from(stok_barang);

  const stokUpdates: { id: number; level_cabang: string; terakhir_terjual_cabang: string | null }[] = [];

  for (const s of allStok) {
    if (!s.id_barang || !s.id_cabang) continue;
    const key = `${s.id_barang}_${s.id_cabang}`;
    const branchSale = lastSaleBranchMap.get(key);

    let branchLevel: "FAST" | "MEDIUM" | "SLOW" | "DEAD" = "MEDIUM";
    let branchLastSale: string | null = null;

    if (branchSale && branchSale.lastSaleDate) {
      branchLastSale = branchSale.lastSaleFull;
      const saleDate = new Date(branchSale.lastSaleDate);
      const diffDays = Math.max(0, Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)));

      if (diffDays < 3) branchLevel = "FAST";
      else if (diffDays <= 14) branchLevel = "MEDIUM";
      else if (diffDays <= 60) branchLevel = "SLOW";
      else branchLevel = "DEAD";
    } else {
      branchLevel = "DEAD";
    }

    stokUpdates.push({
      id: s.id,
      level_cabang: branchLevel,
      terakhir_terjual_cabang: branchLastSale,
    });
  }

  // Batch update stok_barang dalam potongan 400 baris
  for (let i = 0; i < stokUpdates.length; i += BATCH_SIZE) {
    const chunk = stokUpdates.slice(i, i + BATCH_SIZE);
    const valuesClause = chunk
      .map(
        (item) =>
          `(${item.id}, '${item.level_cabang}', ${
            item.terakhir_terjual_cabang ? `'${item.terakhir_terjual_cabang.replace(/'/g, "''")}'` : "NULL"
          })`
      )
      .join(", ");

    await db.execute(sql.raw(`
      UPDATE stok_barang AS s
      SET 
        level_cabang = v.level_cabang,
        terakhir_terjual_cabang = v.terakhir_terjual_cabang
      FROM (VALUES ${valuesClause}) AS v(id, level_cabang, terakhir_terjual_cabang)
      WHERE s.id = v.id;
    `));
  }

  return {
    total: allBarang.length,
    fast: countFast,
    medium: countMedium,
    slow: countSlow,
    dead: countDead,
    timestamp: nowStr,
  };
}

/**
 * Menjalankan scheduler harian otomatis setiap tengah malam (00:01 WIB)
 * untuk sinkronisasi klasifikasi level barang tanpa membebani jam operasional sibuk.
 */
export function startDailyProductLevelScheduler() {
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0);
  const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());

  console.log(`⏱️ [FSN Scheduler] Auto-recalculate level dijadwalkan dalam ${(msUntilMidnight / 3600000).toFixed(2)} jam (tengah malam).`);

  setTimeout(() => {
    recalculateProductLevels()
      .then(res => console.log(`✅ [FSN Scheduler] Auto-recalculate midnight selesai:`, res))
      .catch(e => console.error(`❌ [FSN Scheduler] Error:`, e));

    setInterval(() => {
      recalculateProductLevels()
        .then(res => console.log(`✅ [FSN Scheduler] Auto-recalculate midnight selesai:`, res))
        .catch(e => console.error(`❌ [FSN Scheduler] Error:`, e));
    }, ONE_DAY);
  }, msUntilMidnight);
}
