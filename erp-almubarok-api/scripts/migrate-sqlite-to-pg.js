import Database from "better-sqlite3";
import pkg from "pg";
import path from "path";
const { Client } = pkg;
const SQLITE_DB_PATH = path.join(process.cwd(), "..", "erp-almubarok-nextjs", "erp-almubarok.db");
const PG_CONNECTION_STRING = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/erp_almubarok";
const tables = [
    { name: "jabatan", pk: "id_jabatan" },
    { name: "cabang", pk: "id_cabang" },
    { name: "users", pk: "id" },
    { name: "jam_kerja", pk: "id" },
    { name: "hari_libur", pk: "id" },
    { name: "absensi", pk: "id" },
    { name: "izin_cuti", pk: "id" },
    { name: "hutang_karyawan", pk: "id" },
    { name: "daftar_gaji_jabatan", pk: "id" },
    { name: "bisyaroh", pk: "id" },
    { name: "menu_main", pk: "id", booleans: ["aktif"] },
    { name: "menu_sub", pk: "id", booleans: ["aktif"] },
    { name: "role_menu", pk: "id", booleans: ["aktif", "can_create", "can_read", "can_update", "can_delete"] },
    { name: "role_menu_sub", pk: "id", booleans: ["aktif", "can_create", "can_read", "can_update", "can_delete"] },
    { name: "login_attempts", pk: "identifier" }, // text pk
    { name: "log_login", pk: "id" },
    { name: "kategori_barang", pk: "id_kategori" },
    { name: "supplier", pk: "id_supplier" },
    { name: "barang", pk: "id_barang" },
    { name: "stok_barang", pk: "id" },
    { name: "pelanggan", pk: "id_pelanggan" },
    { name: "penjualan", pk: "id_penjualan" },
    { name: "penjualan_detail", pk: "id" },
    { name: "riwayat_poin", pk: "id" },
    { name: "infaq", pk: "id" },
    { name: "vouchers", pk: "id" },
    { name: "pesan_beli", pk: "id_pesan_beli" },
    { name: "pesan_beli_detail", pk: "id" },
    { name: "faktur_beli", pk: "id_faktur" },
    { name: "faktur_beli_detail", pk: "id" },
    { name: "bayar_hutang", pk: "id" },
    { name: "pesan_cabang", pk: "id_request" },
    { name: "pesan_cabang_detail", pk: "id" },
    { name: "pengiriman", pk: "id_pengiriman" },
    { name: "pengiriman_detail", pk: "id_detail_kirim" },
    { name: "stok_setting_cabang", pk: "id" },
    { name: "sales_velocity", pk: "id" },
    { name: "forecast_stok", pk: "id" },
    { name: "rekomendasi_pengiriman", pk: "id" },
    { name: "rekomendasi_pengiriman_detail", pk: "id" },
    { name: "pengiriman_selisih", pk: "id" },
    { name: "tipe_akun", pk: "id" },
    { name: "daftar_akun", pk: "id" },
    { name: "jurnal_umum", pk: "id" },
    { name: "promo", pk: "id_promo" },
    { name: "promo_cabang", pk: "id" },
    { name: "promo_syarat_pembelanjaan", pk: "id" },
    { name: "promo_syarat_kategori", pk: "id" },
    { name: "promo_syarat_supplier", pk: "id" },
    { name: "promo_hadiah_poin", pk: "id" },
    { name: "promo_hadiah_diskon", pk: "id" },
    { name: "promo_syarat_barang_tertentu", pk: "id" },
    { name: "promo_syarat_beli", pk: "id" },
    { name: "promo_hadiah_gratis", pk: "id" },
    { name: "promo_diskon_barang", pk: "id" },
    { name: "promo_poin_barang", pk: "id" },
    { name: "promo_hadiah_barang", pk: "id" },
    { name: "promo_barang_tebus_murah", pk: "id" }
];
async function run() {
    console.log("📂 Opening SQLite database from:", SQLITE_DB_PATH);
    const sqlite = new Database(SQLITE_DB_PATH);
    console.log("🔌 Connecting to PostgreSQL database...");
    const pg = new Client({ connectionString: PG_CONNECTION_STRING });
    await pg.connect();
    console.log("✓ Connected to PostgreSQL!");
    try {
        // Disable triggers/foreign keys temporarily to allow truncating and insertion in arbitrary order
        await pg.query("SET session_replication_role = 'replica';");
        // Truncate tables first in reverse order to ensure we clear out any old data
        console.log("🧹 Clearing old data in PostgreSQL...");
        for (let i = tables.length - 1; i >= 0; i--) {
            const tableName = tables[i].name;
            await pg.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
        }
        console.log("✓ Cleared all tables.");
        // Migrate table data
        for (const table of tables) {
            console.log(`➡️ Migrating table "${table.name}"...`);
            // 1. Fetch rows from SQLite
            let rows = [];
            try {
                rows = sqlite.prepare(`SELECT * FROM "${table.name}"`).all();
            }
            catch (err) {
                console.warn(`  ⚠️ Table "${table.name}" could not be read from SQLite (might be empty or missing):`, err.message);
                continue;
            }
            if (rows.length === 0) {
                console.log(`  ℹ️ No rows to migrate for "${table.name}".`);
                continue;
            }
            // 2. Identify column names
            const cols = Object.keys(rows[0]);
            const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
            const queryText = `INSERT INTO "${table.name}" (${cols.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders});`;
            // 3. Insert rows into PostgreSQL
            for (const row of rows) {
                const values = cols.map(col => {
                    let val = row[col];
                    // Map boolean fields (integer 0/1 in SQLite to boolean true/false in PG)
                    if (table.booleans && table.booleans.includes(col)) {
                        if (val === 1 || val === true)
                            val = true;
                        else if (val === 0 || val === false)
                            val = false;
                        else
                            val = null;
                    }
                    return val;
                });
                await pg.query(queryText, values);
            }
            console.log(`  ✓ Inserted ${rows.length} rows into "${table.name}".`);
            // 4. Update the primary key serial sequence if it's a numeric id
            if (table.pk !== "identifier") {
                try {
                    const seqResult = await pg.query(`
            SELECT setval(pg_get_serial_sequence('${table.name}', '${table.pk}'), coalesce(max(${table.pk}), 1)) 
            FROM "${table.name}";
          `);
                    console.log(`  ✓ Reset sequence for "${table.name}".`);
                }
                catch (seqErr) {
                    // If the column doesn't have a sequence, skip silently
                    // console.warn(`  ⚠️ Failed to reset sequence for "${table.name}":`, seqErr.message);
                }
            }
        }
        console.log("🎉 Data migration completed successfully!");
    }
    catch (error) {
        console.error("❌ Migration failed with error:", error);
    }
    finally {
        // Re-enable triggers/foreign keys
        await pg.query("SET session_replication_role = 'origin';");
        await pg.end();
        sqlite.close();
    }
}
run().catch(console.error);
