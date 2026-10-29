import { db } from "../src/lib/db";
import {
  daftar_akun,
  menu_main,
  menu_sub,
  role_menu_sub,
  jabatan,
  barang,
  cabang,
  barang_batch,
  tipe_akun,
} from "../src/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  console.log("🌱 Seeding Supply Chain & WMS Enterprise (CoA, Menus, Batches)...");

  // 1. CoA untuk Beban Selisih Stok & Pendapatan Penyesuaian
  let [bebanSelisih] = await db
    .select()
    .from(daftar_akun)
    .where(eq(daftar_akun.kode_akun, "6.107.01"))
    .limit(1);

  if (!bebanSelisih) {
    const [inserted] = await db
      .insert(daftar_akun)
      .values({
        kode_akun: "6.107.01",
        nama_akun: "Beban Selisih Stok & Kerugian Inventaris",
        deskripsi: "Pencatatan kerugian akibat selisih fisik kurang atau barang rusak saat stock opname",
        tipe_akun_id: 6, // Beban Operasional
        status: "Aktif",
      })
      .returning();
    bebanSelisih = inserted;
    console.log("  [+] Created CoA 6.107.01 Beban Selisih Stok");
  } else {
    console.log("  [=] CoA 6.107.01 already exists");
  }

  let [pendapatanSelisih] = await db
    .select()
    .from(daftar_akun)
    .where(eq(daftar_akun.kode_akun, "7.102.01"))
    .limit(1);

  if (!pendapatanSelisih) {
    const [inserted] = await db
      .insert(daftar_akun)
      .values({
        kode_akun: "7.102.01",
        nama_akun: "Pendapatan Penyesuaian Selisih Stok",
        deskripsi: "Penyesuaian nilai persediaan surplus lebih saat stock opname",
        tipe_akun_id: 8, // Pendapatan & Beban Lain-lain
        status: "Aktif",
      })
      .returning();
    pendapatanSelisih = inserted;
    console.log("  [+] Created CoA 7.102.01 Pendapatan Penyesuaian Selisih Stok");
  } else {
    console.log("  [=] CoA 7.102.01 already exists");
  }

  // 2. Menu Sub: Batch & Kadaluarsa, Stock Opname Fisik
  const [menuBarang] = await db
    .select()
    .from(menu_main)
    .where(eq(menu_main.nama, "Barang"))
    .limit(1);

  if (menuBarang) {
    const newSubs = [
      { nama: "Batch & Kadaluarsa", link: "/barang/batch", urutan: 5 },
      { nama: "Stock Opname Fisik", link: "/barang/stok-opname", urutan: 6 },
    ];

    const allJabatan = await db.select().from(jabatan);

    for (const sub of newSubs) {
      const [existing] = await db
        .select()
        .from(menu_sub)
        .where(and(eq(menu_sub.id_menu_main, menuBarang.id), eq(menu_sub.link, sub.link)))
        .limit(1);

      let subId = existing?.id;
      if (!existing) {
        const [ins] = await db
          .insert(menu_sub)
          .values({
            id_menu_main: menuBarang.id,
            nama: sub.nama,
            link: sub.link,
            urutan: sub.urutan,
            aktif: true,
          })
          .returning();
        subId = ins.id;
        console.log(`  [+] Created Submenu ${sub.nama}`);
      } else {
        console.log(`  [=] Submenu ${sub.nama} exists`);
      }

      // Berikan hak akses ke semua jabatan
      if (subId) {
        for (const jab of allJabatan) {
          const [hasRole] = await db
            .select()
            .from(role_menu_sub)
            .where(and(eq(role_menu_sub.id_jabatan, jab.id_jabatan), eq(role_menu_sub.id_menu_sub, subId)))
            .limit(1);

          if (!hasRole) {
            await db.insert(role_menu_sub).values({
              id_jabatan: jab.id_jabatan,
              id_menu_sub: subId,
              aktif: true,
              can_create: true,
              can_read: true,
              can_update: true,
              can_delete: true,
            });
          }
        }
      }
    }
  }

  // 3. Seed Sample Batches
  const sampleBarangs = await db.select().from(barang).limit(3);
  const [sampleCabang] = await db.select().from(cabang).limit(1);

  if (sampleBarangs.length > 0 && sampleCabang) {
    const existingBatches = await db.select().from(barang_batch);
    if (existingBatches.length === 0) {
      const today = new Date();
      
      // Batch 1: Expiring in 20 days (Warning alert)
      const d1 = new Date(today);
      d1.setDate(d1.getDate() + 20);
      const exp1 = d1.toISOString().split("T")[0];

      // Batch 2: Expiring in 180 days (Safe)
      const d2 = new Date(today);
      d2.setDate(d2.getDate() + 180);
      const exp2 = d2.toISOString().split("T")[0];

      // Batch 3: Expired 5 days ago (Expired)
      const d3 = new Date(today);
      d3.setDate(d3.getDate() - 5);
      const exp3 = d3.toISOString().split("T")[0];

      await db.insert(barang_batch).values([
        {
          nomor_batch: "LOT-202610-001",
          id_barang: sampleBarangs[0].id_barang,
          id_cabang: sampleCabang.id_cabang,
          tanggal_masuk: today.toISOString().split("T")[0],
          tanggal_kadaluarsa: exp1,
          stok_batch: 45,
          hpp_batch: sampleBarangs[0].harga_rata || sampleBarangs[0].harga_beli || 15000,
          status: "AKTIF",
          catatan: "Peringatan dini: Kadaluarsa dalam < 30 hari",
        },
        {
          nomor_batch: "LOT-202610-002",
          id_barang: sampleBarangs[0].id_barang,
          id_cabang: sampleCabang.id_cabang,
          tanggal_masuk: today.toISOString().split("T")[0],
          tanggal_kadaluarsa: exp2,
          stok_batch: 120,
          hpp_batch: sampleBarangs[0].harga_rata || sampleBarangs[0].harga_beli || 15000,
          status: "AKTIF",
          catatan: "Kondisi sangat baik, stok aman",
        },
        {
          nomor_batch: "LOT-202609-009",
          id_barang: sampleBarangs[1] ? sampleBarangs[1].id_barang : sampleBarangs[0].id_barang,
          id_cabang: sampleCabang.id_cabang,
          tanggal_masuk: "2026-09-01",
          tanggal_kadaluarsa: exp3,
          stok_batch: 8,
          hpp_batch: sampleBarangs[1]?.harga_rata || 25000,
          status: "KADALUARSA",
          catatan: "Sudah lewat tanggal kadaluarsa, pisahkan dari display toko",
        },
      ]);
      console.log("  [+] Seeded 3 sample barang_batch records");
    }
  }

  console.log("✅ Seeding Supply Chain & WMS completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
