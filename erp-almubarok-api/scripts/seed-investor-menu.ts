import { pool } from "../src/lib/db";

async function seed() {
  console.log("🌱 Menjalankan seeding menu dan permission untuk Manajemen Investor...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Cek / Buat Main Menu "Manajemen Investor"
    let idMainMenu: number;
    const resMain = await client.query("SELECT id FROM menu_main WHERE nama = 'Manajemen Investor' LIMIT 1");
    if (resMain.rows.length === 0) {
      const insMain = await client.query(`
        INSERT INTO menu_main (nama, link, icon, urutan, aktif)
        VALUES ('Manajemen Investor', '#', 'Landmark', 10, true)
        RETURNING id;
      `);
      idMainMenu = insMain.rows[0].id;
      console.log("  Main menu 'Manajemen Investor' berhasil dibuat.");
    } else {
      idMainMenu = resMain.rows[0].id;
      console.log("  Main menu 'Manajemen Investor' sudah ada.");
    }

    // 2. Sub-menus
    const subMenus = [
      { nama: "Dasbor Investor", link: "/investor", urutan: 1 },
      { nama: "Profil & Pengaturan", link: "/investor/profil", urutan: 2 },
      { nama: "Transaksi Modal", link: "/investor/transaksi", urutan: 3 },
      { nama: "Pembagian Bagi Hasil", link: "/investor/bagi-hasil", urutan: 4 },
      { nama: "Buku Pembantu Modal", link: "/investor/buku-pembantu", urutan: 5 },
    ];

    const allJabatan = await client.query("SELECT id_jabatan, jabatan FROM jabatan");

    for (const sub of subMenus) {
      let subId: number;
      const resSub = await client.query("SELECT id FROM menu_sub WHERE link = $1 LIMIT 1", [sub.link]);
      if (resSub.rows.length === 0) {
        const insSub = await client.query(`
          INSERT INTO menu_sub (id_menu_main, nama, link, urutan, aktif)
          VALUES ($1, $2, $3, $4, true)
          RETURNING id;
        `, [idMainMenu, sub.nama, sub.link, sub.urutan]);
        subId = insSub.rows[0].id;
        console.log(`  Sub-menu '${sub.nama}' berhasil dibuat.`);
      } else {
        subId = resSub.rows[0].id;
        console.log(`  Sub-menu '${sub.nama}' sudah ada.`);
      }

      // Grant permissions to all administrative / management / finance jabatan (or all existing jabatan)
      for (const jab of allJabatan.rows) {
        const jabId = jab.id_jabatan;
        const resPerm = await client.query(
          "SELECT id FROM role_menu_sub WHERE id_jabatan = $1 AND id_menu_sub = $2",
          [jabId, subId]
        );

        if (resPerm.rows.length === 0) {
          await client.query(`
            INSERT INTO role_menu_sub (id_jabatan, id_menu_sub, aktif, can_read, can_create, can_update, can_delete)
            VALUES ($1, $2, true, true, true, true, true)
          `, [jabId, subId]);
        }
      }
    }

    // Grant main menu permission as well
    for (const jab of allJabatan.rows) {
      const jabId = jab.id_jabatan;
      const resMainPerm = await client.query(
        "SELECT id FROM role_menu WHERE id_jabatan = $1 AND id_menu_main = $2",
        [jabId, idMainMenu]
      );
      if (resMainPerm.rows.length === 0) {
        await client.query(`
          INSERT INTO role_menu (id_jabatan, id_menu_main, aktif)
          VALUES ($1, $2, true)
        `, [jabId, idMainMenu]);
      }
    }

    await client.query("COMMIT");
    console.log("✅ Seeding menu dan permission Manajemen Investor SELESAI!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Gagal seeding menu:", error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
