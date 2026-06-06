// Migration script untuk tabel DMS
const Database = require("better-sqlite3");
const db = new Database("./erp-almubarok.db");

console.log("🔧 Menjalankan migrasi DMS...\n");

// ─── Alter pengiriman table ──────────────────────────────────────────────────
const pengirimanCols = [
  ["jenis_pengiriman", "TEXT DEFAULT 'CABANG'"],
  ["id_rekomendasi", "INTEGER"],
  ["armada", "TEXT"],
  ["driver", "TEXT"],
  ["created_at", "TEXT DEFAULT (CURRENT_TIMESTAMP)"],
];

for (const [col, def] of pengirimanCols) {
  try {
    db.exec(`ALTER TABLE pengiriman ADD COLUMN ${col} ${def}`);
    console.log(`✅ Added pengiriman.${col}`);
  } catch (e) {
    if (e.message.includes("duplicate column name")) {
      console.log(`⚠️  pengiriman.${col} already exists, skipping`);
    } else {
      console.error(`❌ Error adding ${col}:`, e.message);
    }
  }
}

// ─── Create DMS tables ───────────────────────────────────────────────────────
const tables = [
  {
    name: "stok_setting_cabang",
    sql: `CREATE TABLE IF NOT EXISTS stok_setting_cabang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_barang INTEGER NOT NULL REFERENCES barang(id_barang),
      id_cabang INTEGER NOT NULL REFERENCES cabang(id_cabang),
      minimum_stock INTEGER NOT NULL DEFAULT 0,
      safety_stock INTEGER NOT NULL DEFAULT 0,
      target_days_stock INTEGER NOT NULL DEFAULT 14,
      lead_time_days INTEGER NOT NULL DEFAULT 2,
      created_at TEXT DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT DEFAULT (CURRENT_TIMESTAMP)
    )`,
  },
  {
    name: "sales_velocity",
    sql: `CREATE TABLE IF NOT EXISTS sales_velocity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_barang INTEGER NOT NULL REFERENCES barang(id_barang),
      id_cabang INTEGER NOT NULL REFERENCES cabang(id_cabang),
      ads_7 INTEGER DEFAULT 0,
      ads_30 INTEGER DEFAULT 0,
      ads_90 INTEGER DEFAULT 0,
      last_calculated TEXT,
      created_at TEXT DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT DEFAULT (CURRENT_TIMESTAMP)
    )`,
  },
  {
    name: "forecast_stok",
    sql: `CREATE TABLE IF NOT EXISTS forecast_stok (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_barang INTEGER NOT NULL REFERENCES barang(id_barang),
      id_cabang INTEGER NOT NULL REFERENCES cabang(id_cabang),
      stok_sekarang INTEGER NOT NULL DEFAULT 0,
      ads INTEGER DEFAULT 0,
      estimasi_habis_hari INTEGER DEFAULT 0,
      tanggal_habis TEXT,
      status TEXT DEFAULT 'AMAN',
      created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
    )`,
  },
  {
    name: "rekomendasi_pengiriman",
    sql: `CREATE TABLE IF NOT EXISTS rekomendasi_pengiriman (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kode_rekomendasi TEXT NOT NULL,
      tanggal_rekomendasi TEXT NOT NULL,
      status TEXT DEFAULT 'DRAFT',
      dibuat_oleh INTEGER REFERENCES users(id),
      catatan TEXT,
      created_at TEXT DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT DEFAULT (CURRENT_TIMESTAMP)
    )`,
  },
  {
    name: "rekomendasi_pengiriman_detail",
    sql: `CREATE TABLE IF NOT EXISTS rekomendasi_pengiriman_detail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_rekomendasi INTEGER NOT NULL REFERENCES rekomendasi_pengiriman(id),
      id_barang INTEGER NOT NULL REFERENCES barang(id_barang),
      id_cabang_tujuan INTEGER NOT NULL REFERENCES cabang(id_cabang),
      stok_sekarang INTEGER NOT NULL DEFAULT 0,
      ads INTEGER DEFAULT 0,
      qty_rekomendasi INTEGER NOT NULL DEFAULT 0,
      target_stock INTEGER NOT NULL DEFAULT 0,
      prioritas_score INTEGER DEFAULT 0,
      qty_approved INTEGER
    )`,
  },
  {
    name: "pengiriman_selisih",
    sql: `CREATE TABLE IF NOT EXISTS pengiriman_selisih (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pengiriman INTEGER NOT NULL REFERENCES pengiriman(id_pengiriman),
      id_barang INTEGER NOT NULL REFERENCES barang(id_barang),
      jumlah_dikirim INTEGER NOT NULL,
      jumlah_diterima INTEGER NOT NULL,
      selisih INTEGER NOT NULL,
      jenis_selisih TEXT NOT NULL,
      alasan TEXT,
      foto_bukti TEXT,
      status TEXT DEFAULT 'MENUNGGU_PEMERIKSAAN',
      dibuat_oleh TEXT,
      disetujui_oleh INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT DEFAULT (CURRENT_TIMESTAMP)
    )`,
  },
];

for (const table of tables) {
  try {
    db.exec(table.sql);
    console.log(`✅ Created/verified table: ${table.name}`);
  } catch (e) {
    console.error(`❌ Error creating ${table.name}:`, e.message);
  }
}

db.close();
console.log("\n🎉 Migrasi DMS selesai!");
