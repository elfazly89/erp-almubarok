import { db } from "../src/lib/db";
import { menu_main, menu_sub, role_menu_sub, jabatan } from "../src/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  console.log("🌱 Menjalankan seeding menu dan permission untuk Manajemen Kas...");

  // 1. Check and seed "Manajemen Kas" main menu
  let [kasMain] = await db
    .select()
    .from(menu_main)
    .where(eq(menu_main.nama, "Manajemen Kas"))
    .limit(1);

  if (!kasMain) {
    console.log("  Main menu 'Manajemen Kas' belum ada. Membuat baru...");
    const [insertedMain] = await db
      .insert(menu_main)
      .values({
        nama: "Manajemen Kas",
        link: "#",
        icon: "Banknote",
        urutan: 9,
        aktif: true,
      })
      .returning();
    kasMain = insertedMain;
  } else {
    console.log("  Main menu 'Manajemen Kas' sudah ada.");
  }

  if (kasMain) {
    const KAS_SUBS = [
      { nama: "Dashboard Kas", link: "/kas/dashboard", urutan: 1 },
      { nama: "Rekening Kas", link: "/kas/rekening", urutan: 2 },
      { nama: "Mutasi Kas Toko", link: "/kas/transaksi", urutan: 3 },
      { nama: "Kas Pusat & Bank", link: "/kas/transaksi-pusat", urutan: 4 },
      { nama: "Shift Kasir", link: "/kas/shift", urutan: 5 },
      { nama: "Transfer Kas", link: "/kas/transfer", urutan: 6 },
      { nama: "Rekonsiliasi", link: "/kas/rekonsiliasi", urutan: 7 },
      { nama: "Laporan Kas", link: "/kas/laporan", urutan: 8 },
    ];

    for (const sub of KAS_SUBS) {
      let subId: number;
      const [existingSub] = await db
        .select()
        .from(menu_sub)
        .where(eq(menu_sub.link, sub.link))
        .limit(1);

      if (!existingSub) {
        console.log(`  Sub menu '${sub.nama}' belum ada. Membuat baru...`);
        const [insertedSub] = await db
          .insert(menu_sub)
          .values({
            id_menu_main: kasMain.id,
            nama: sub.nama,
            link: sub.link,
            urutan: sub.urutan,
            aktif: true,
          })
          .returning();
        subId = insertedSub.id;
      } else {
        console.log(`  Sub menu '${sub.nama}' sudah ada.`);
        subId = existingSub.id;
        // Pastikan urutan dan nama up to date
        await db
          .update(menu_sub)
          .set({ nama: sub.nama, urutan: sub.urutan, aktif: true })
          .where(eq(menu_sub.id, subId));
      }

      // Auto grant permissions
      // Super User (1), IT (2) get all menus
      const targetJabatanIds = [1, 2];
      if (sub.link === "/kas/transaksi-pusat") {
        targetJabatanIds.push(4, 8); // Bendahara (4), Manager (8)
      } else if (sub.link === "/kas/shift") {
        targetJabatanIds.push(7); // Kasir (7)
      } else if (sub.link === "/kas/transaksi") {
        targetJabatanIds.push(4, 5, 8, 11); // Bendahara, Admin, Manager, SPV
      }
      for (const jabId of targetJabatanIds) {
        const [exists] = await db.select().from(jabatan).where(eq(jabatan.id_jabatan, jabId)).limit(1);
        if (exists) {
          const [permExists] = await db
            .select()
            .from(role_menu_sub)
            .where(
              and(
                eq(role_menu_sub.id_jabatan, jabId),
                eq(role_menu_sub.id_menu_sub, subId)
              )
            )
            .limit(1);

          if (!permExists) {
            await db.insert(role_menu_sub).values({
              id_jabatan: jabId,
              id_menu_sub: subId,
              aktif: true,
              can_read: true,
              can_create: true,
              can_update: true,
              can_delete: true,
            });
            console.log(`    Granted permissions to Jabatan ID ${jabId} for '${sub.nama}'`);
          }
        }
      }
    }
  }

  console.log("✅ Seeding menu selesai!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Gagal menjalankan seeding menu:", err);
  process.exit(1);
});
