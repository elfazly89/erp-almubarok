import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/lib/db/schema";
import path from "path";

const DB_PATH = path.join(process.cwd(), "erp-almubarok.db");
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

const MASTER_MENUS = [
  {
    nama: "Dashboard",
    link: "/dashboard",
    icon: "LayoutDashboard",
    urutan: 1,
    subs: [],
  },
  {
    nama: "HRD & Abdi",
    link: "#",
    icon: "Users",
    urutan: 2,
    subs: [
      { nama: "Daftar Abdi", link: "/hrd/users", urutan: 1 },
      { nama: "Absensi", link: "/hrd/absensi", urutan: 2 },
      { nama: "Jabatan", link: "/hrd/jabatan", urutan: 3 },
      { nama: "Jam Kerja", link: "/hrd/jam-kerja", urutan: 4 },
      { nama: "Hari Libur", link: "/hrd/hari-libur", urutan: 5 },
      { nama: "Izin & Cuti", link: "/hrd/izin-cuti", urutan: 6 },
      { nama: "Bisyaroh", link: "/hrd/bisyaroh", urutan: 7 },
    ],
  },
  {
    nama: "Barang",
    link: "#",
    icon: "Package",
    urutan: 3,
    subs: [
      { nama: "Data Barang", link: "/barang", urutan: 1 },
      { nama: "Kategori", link: "/kategori", urutan: 2 },
      { nama: "Supplier", link: "/supplier", urutan: 3 },
      { nama: "Stok Barang", link: "/stok", urutan: 4 },
    ],
  },
  {
    nama: "Penjualan",
    link: "#",
    icon: "ShoppingCart",
    urutan: 4,
    subs: [
      { nama: "Kasir POS", link: "/penjualan/pos", urutan: 1 },
      { nama: "Riwayat Nota", link: "/penjualan/history", urutan: 2 },
      { nama: "Manajemen Promo", link: "/penjualan/promo", urutan: 3 },
    ],
  },
  {
    nama: "Pelanggan",
    link: "#",
    icon: "Users",
    urutan: 5,
    subs: [
      { nama: "Daftar Pelanggan", link: "/pelanggan", urutan: 1 },
      { nama: "Riwayat Poin", link: "/pelanggan/poin", urutan: 2 },
    ],
  },
  {
    nama: "Pembelian",
    link: "#",
    icon: "ShoppingBag",
    urutan: 6,
    subs: [
      { nama: "Purchase Order (PO)", link: "/pembelian/po", urutan: 1 },
      { nama: "Faktur Beli", link: "/pembelian/invoice", urutan: 2 },
      { nama: "Riwayat Faktur", link: "/pembelian/history", urutan: 3 },
      { nama: "Hutang Supplier", link: "/pembelian/hutang", urutan: 4 },
    ],
  },
  {
    nama: "Distribusi",
    link: "#",
    icon: "Truck",
    urutan: 7,
    subs: [
      { nama: "Dasbor Distribusi", link: "/distribusi/dashboard", urutan: 1 },
      { nama: "Proyeksi Ketersediaan", link: "/distribusi/forecast", urutan: 2 },
      { nama: "Rekomendasi Pengiriman", link: "/distribusi/rekomendasi", urutan: 3 },
      { nama: "Transfer Antarcabang", link: "/distribusi/transfer", urutan: 4 },
      { nama: "Surat Jalan DC", link: "/distribusi/pengiriman", urutan: 5 },
      { nama: "Pemantauan GPS", link: "/distribusi/monitoring", urutan: 6 },
      { nama: "Selisih Pengiriman", link: "/distribusi/selisih", urutan: 7 },
    ],
  },
  {
    nama: "Akuntansi",
    link: "#",
    icon: "BookOpen",
    urutan: 8,
    subs: [
      { nama: "Jurnal Umum", link: "/akuntansi/jurnal", urutan: 1 },
      { nama: "Daftar Akun (CoA)", link: "/akuntansi/coa", urutan: 2 },
      { nama: "Tipe Akun", link: "/akuntansi/tipe", urutan: 3 },
      { nama: "Buku Besar & Laporan", link: "/akuntansi/laporan", urutan: 4 },
    ],
  },
  {
    nama: "Cabang",
    link: "/cabang",
    icon: "Building2",
    urutan: 9,
    subs: [],
  },
  {
    nama: "Pengaturan",
    link: "#",
    icon: "Settings",
    urutan: 10,
    subs: [
      { nama: "Role Menu", link: "/pengaturan/role-menu", urutan: 1 },
    ],
  },
];

async function updateMenus() {
  console.log("🧹 Cleaning old menu data...");
  // Turn off foreign keys temporarily for truncation
  sqlite.exec("PRAGMA foreign_keys = OFF");
  try {
    await db.delete(schema.role_menu_sub);
    await db.delete(schema.role_menu);
    await db.delete(schema.menu_sub);
    await db.delete(schema.menu_main);
  } finally {
    sqlite.exec("PRAGMA foreign_keys = ON");
  }

  console.log("🌱 Seeding Next.js master menus...");
  const mainIds: Record<string, number> = {};
  const subIds: Record<string, number> = {};

  for (const main of MASTER_MENUS) {
    const [insertedMain] = await db
      .insert(schema.menu_main)
      .values({
        nama: main.nama,
        link: main.link,
        icon: main.icon,
        urutan: main.urutan,
        aktif: true,
      })
      .returning();

    mainIds[main.nama] = insertedMain.id;

    if (main.subs.length > 0) {
      for (const sub of main.subs) {
        const [insertedSub] = await db
          .insert(schema.menu_sub)
          .values({
            id_menu_main: insertedMain.id,
            nama: sub.nama,
            link: sub.link,
            urutan: sub.urutan,
            aktif: true,
          })
          .returning();

        subIds[`${main.nama}->${sub.nama}`] = insertedSub.id;
      }
    }
  }

  console.log("🔑 Seeding default role permissions...");
  
  // Get all jabatan lists to verify they exist
  const jablist = await db.select().from(schema.jabatan);
  const jabIds = jablist.map(j => j.id_jabatan);

  // Roles to seed:
  // Super User (1), IT (2), Manager (8): Full access
  // HRD (3): Dashboard + HRD & Abdi
  // Kasir (7): Dashboard + Penjualan + Pelanggan

  const fullAccessRoles = [1, 2, 8];
  const mainList = Object.keys(mainIds);

  for (const jId of jabIds) {
    if (fullAccessRoles.includes(jId)) {
      // Super User / IT / Manager get full CRUD access to all menus
      for (const mName of mainList) {
        const mId = mainIds[mName];
        await db.insert(schema.role_menu).values({
          id_jabatan: jId,
          id_menu_main: mId,
          aktif: true,
          can_create: true,
          can_read: true,
          can_update: true,
          can_delete: true,
        });
      }
      for (const key of Object.keys(subIds)) {
        const sId = subIds[key];
        await db.insert(schema.role_menu_sub).values({
          id_jabatan: jId,
          id_menu_sub: sId,
          aktif: true,
          can_create: true,
          can_read: true,
          can_update: true,
          can_delete: true,
        });
      }
    } else if (jId === 3) {
      // HRD: Dashboard + HRD & Abdi
      const allowedM = ["Dashboard", "HRD & Abdi"];
      for (const mName of allowedM) {
        await db.insert(schema.role_menu).values({
          id_jabatan: jId,
          id_menu_main: mainIds[mName],
          aktif: true,
          can_create: true,
          can_read: true,
          can_update: true,
          can_delete: true,
        });
      }
      for (const key of Object.keys(subIds)) {
        if (key.startsWith("HRD & Abdi->")) {
          await db.insert(schema.role_menu_sub).values({
            id_jabatan: jId,
            id_menu_sub: subIds[key],
            aktif: true,
            can_create: true,
            can_read: true,
            can_update: true,
            can_delete: true,
          });
        }
      }
    } else if (jId === 7) {
      // Kasir: Dashboard + Penjualan (excluding promo CRUD, maybe just read POS/history) + Pelanggan
      const allowedM = ["Dashboard", "Penjualan", "Pelanggan"];
      for (const mName of allowedM) {
        await db.insert(schema.role_menu).values({
          id_jabatan: jId,
          id_menu_main: mainIds[mName],
          aktif: true,
          can_create: mName === "Dashboard" ? false : true,
          can_read: true,
          can_update: mName === "Dashboard" ? false : true,
          can_delete: false,
        });
      }
      for (const key of Object.keys(subIds)) {
        if (key.startsWith("Penjualan->") || key.startsWith("Pelanggan->")) {
          // For POS, let kasir create transactions but not delete them
          const isPromo = key.includes("Manajemen Promo");
          await db.insert(schema.role_menu_sub).values({
            id_jabatan: jId,
            id_menu_sub: subIds[key],
            aktif: true,
            can_create: !isPromo,
            can_read: true,
            can_update: !isPromo,
            can_delete: false,
          });
        }
      }
    } else {
      // Everyone else gets read-only Dashboard access
      await db.insert(schema.role_menu).values({
        id_jabatan: jId,
        id_menu_main: mainIds["Dashboard"],
        aktif: true,
        can_create: false,
        can_read: true,
        can_update: false,
        can_delete: false,
      });
    }
  }

  console.log("✅ Menu seeding and role permissions alignment completed successfully!");
  sqlite.close();
}

updateMenus().catch(console.error);
