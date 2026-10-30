import { db } from "../src/lib/db";
import {
  cabang,
  barang,
  stok_barang,
  gudang_lokasi,
  stok_lokasi,
  kartu_stok,
  users,
} from "../src/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  console.log("🚀 Menjalankan Inisialisasi Modul Master Barang Enterprise...");

  // 1. Inisialisasi default Gudang Lokasi (Multi-Bin) untuk setiap Cabang
  const allCabangs = await db.select().from(cabang);
  console.log(`📌 Memeriksa sub-lokasi gudang untuk ${allCabangs.length} cabang...`);

  for (const c of allCabangs) {
    const defaultBins = [
      { kode: `DISP-${c.id_cabang}`, nama: `Display Toko Depan (${c.nama_cabang})`, tipe: "DISPLAY" },
      { kode: `GUD-${c.id_cabang}`, nama: `Gudang Utama Belakang (${c.nama_cabang})`, tipe: "GUDANG_UTAMA" },
      { kode: `KRT-${c.id_cabang}`, nama: `Area Karantina / Rusak (${c.nama_cabang})`, tipe: "KARANTINA" },
    ];

    for (const b of defaultBins) {
      const [existing] = await db
        .select()
        .from(gudang_lokasi)
        .where(
          and(
            eq(gudang_lokasi.id_cabang, c.id_cabang),
            eq(gudang_lokasi.tipe_lokasi, b.tipe)
          )
        )
        .limit(1);

      if (!existing) {
        await db.insert(gudang_lokasi).values({
          id_cabang: c.id_cabang,
          kode_lokasi: b.kode,
          nama_lokasi: b.nama,
          tipe_lokasi: b.tipe as "DISPLAY" | "GUDANG_UTAMA" | "KARANTINA",
          keterangan: "Sub-lokasi standar inisialisasi sistem",
          is_aktif: true,
        });
        console.log(`  [+] Cabang ${c.nama_cabang}: Created Bin ${b.nama}`);
      }
    }
  }

  // 2. Inisialisasi Saldo Awal pada Kartu Stok untuk barang berstok aktif
  const [adminUser] = await db.select().from(users).limit(1);
  const adminId = adminUser ? adminUser.id : 1;

  const currentStocks = await db.select().from(stok_barang);
  console.log(`📦 Memeriksa saldo awal Kartu Stok untuk ${currentStocks.length} data stok barang...`);

  let seededKartu = 0;
  const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);

  for (const sb of currentStocks) {
    if (sb.stok_akhir !== null && sb.stok_akhir !== undefined) {
      const [existingLedger] = await db
        .select()
        .from(kartu_stok)
        .where(
          and(
            eq(kartu_stok.id_barang, sb.id_barang),
            eq(kartu_stok.id_cabang, sb.id_cabang)
          )
        )
        .limit(1);

      if (!existingLedger) {
        const [itemData] = await db
          .select()
          .from(barang)
          .where(eq(barang.id_barang, sb.id_barang))
          .limit(1);

        const hpp = itemData?.harga_rata || itemData?.harga_beli || 0;
        const totalNilai = (sb.stok_akhir || 0) * hpp;

        await db.insert(kartu_stok).values({
          id_barang: sb.id_barang,
          id_cabang: sb.id_cabang,
          tanggal_transaksi: nowStr,
          tipe_transaksi: "SALDO_AWAL",
          nomor_referensi: "INIT-SALDO-AWAL",
          saldo_awal: 0,
          masuk: sb.stok_akhir || 0,
          keluar: 0,
          saldo_akhir: sb.stok_akhir || 0,
          hpp_satuan: hpp,
          total_nilai: totalNilai,
          keterangan: "Inisialisasi saldo awal migrasi Modul Barang Enterprise",
          id_user: adminId,
        });
        seededKartu++;
      }
    }
  }

  console.log(`✅ Inisialisasi selesai: ${seededKartu} entri Saldo Awal dibuat di Kartu Stok.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Terjadi error saat inisialisasi:", err);
  process.exit(1);
});

