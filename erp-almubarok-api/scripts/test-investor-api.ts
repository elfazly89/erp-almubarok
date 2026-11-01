import { pool } from "../src/lib/db";

async function testApi() {
  console.log("🧪 Testing investor database records...");
  const client = await pool.connect();
  try {
    const resProfil = await client.query("SELECT * FROM investor_profil LIMIT 1");
    console.log("Profil Investor:", resProfil.rows[0]);

    const resCabang = await client.query("SELECT id_cabang, kode_cabang, nama_cabang, jenis_cabang FROM cabang WHERE jenis_cabang = 'INVESTOR'");
    console.log("Cabang Investor Count:", resCabang.rows.length);
    console.log("Cabang Investor List:", resCabang.rows);

    const resCOA = await client.query("SELECT id, kode_akun, nama_akun FROM daftar_akun WHERE kode_akun IN ('3.101.01', '3.201.01')");
    console.log("COA Ekuitas & Dividen:", resCOA.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

testApi();
