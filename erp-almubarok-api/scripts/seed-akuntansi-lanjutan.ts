import { db } from "../src/lib/db";
import { master_pajak, periode_akuntansi, daftar_akun, tipe_akun } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding Akuntansi Lanjutan (Pajak & Periode)...");

  // 1. Pastikan CoA untuk Hutang Pajak dan Piutang Pajak ada
  let [hutangPajak] = await db
    .select()
    .from(daftar_akun)
    .where(eq(daftar_akun.kode_akun, "2.105.01"))
    .limit(1);

  if (!hutangPajak) {
    // Tipe akun 2: Kewajiban
    const [inserted] = await db
      .insert(daftar_akun)
      .values({
        kode_akun: "2.105.01",
        nama_akun: "Hutang PPN Keluaran",
        deskripsi: "Pajak Pertambahan Nilai yang dipungut dari konsumen",
        tipe_akun_id: 2,
        status: "Aktif",
      })
      .returning();
    hutangPajak = inserted;
    console.log("  Created CoA 2.105.01 Hutang PPN Keluaran");
  }

  let [piutangPajak] = await db
    .select()
    .from(daftar_akun)
    .where(eq(daftar_akun.kode_akun, "1.106.01"))
    .limit(1);

  if (!piutangPajak) {
    // Tipe akun 1: Aset
    const [inserted] = await db
      .insert(daftar_akun)
      .values({
        kode_akun: "1.106.01",
        nama_akun: "PPN Masukan (Pajak Dibayar di Muka)",
        deskripsi: "Pajak Pertambahan Nilai yang dibayar kepada supplier",
        tipe_akun_id: 1,
        status: "Aktif",
      })
      .returning();
    piutangPajak = inserted;
    console.log("  Created CoA 1.106.01 PPN Masukan");
  }

  // 2. Seed Master Pajak
  const taxData = [
    {
      kode_pajak: "PPN11",
      nama_pajak: "PPN Dalam Negeri 11%",
      tipe_pajak: "PPN",
      tarif_persen: "11.00",
      akun_pajak_keluaran: hutangPajak?.id,
      akun_pajak_masukan: piutangPajak?.id,
      is_aktif: true,
    },
    {
      kode_pajak: "PPN12",
      nama_pajak: "PPN Dalam Negeri 12%",
      tipe_pajak: "PPN",
      tarif_persen: "12.00",
      akun_pajak_keluaran: hutangPajak?.id,
      akun_pajak_masukan: piutangPajak?.id,
      is_aktif: true,
    },
    {
      kode_pajak: "PB1",
      nama_pajak: "Pajak Restoran / Daerah (PB1) 10%",
      tipe_pajak: "PAJAK_DAERAH",
      tarif_persen: "10.00",
      akun_pajak_keluaran: hutangPajak?.id,
      is_aktif: true,
    },
    {
      kode_pajak: "PPH23",
      nama_pajak: "PPh Pasal 23 Jasa 2%",
      tipe_pajak: "PPH",
      tarif_persen: "2.00",
      akun_pajak_keluaran: hutangPajak?.id,
      is_aktif: true,
    },
  ];

  for (const t of taxData) {
    const [exist] = await db.select().from(master_pajak).where(eq(master_pajak.kode_pajak, t.kode_pajak)).limit(1);
    if (!exist) {
      await db.insert(master_pajak).values(t);
      console.log(`  Inserted master_pajak ${t.kode_pajak}`);
    }
  }

  // 3. Seed Periode Akuntansi Tahun 2026 (Jan - Des)
  for (let m = 1; m <= 12; m++) {
    const bulanStr = String(m).padStart(2, "0");
    const lastDay = new Date(2026, m, 0).getDate();
    const tglMulai = `2026-${bulanStr}-01`;
    const tglAkhir = `2026-${bulanStr}-${String(lastDay).padStart(2, "0")}`;

    const [exist] = await db
      .select()
      .from(periode_akuntansi)
      .where(eq(periode_akuntansi.tanggal_mulai, tglMulai))
      .limit(1);

    if (!exist) {
      await db.insert(periode_akuntansi).values({
        bulan: m,
        tahun: 2026,
        tanggal_mulai: tglMulai,
        tanggal_akhir: tglAkhir,
        status: m < 10 ? "SOFT_LOCKED" : "OPEN", // Bulan sebelum Oktober di-softlock sebagai contoh
        lock_date: m < 10 ? tglAkhir : null,
      });
      console.log(`  Inserted periode_akuntansi ${bulanStr}/2026 (Status: ${m < 10 ? "SOFT_LOCKED" : "OPEN"})`);
    }
  }

  console.log("✅ Seeding Akuntansi Lanjutan Selesai!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

