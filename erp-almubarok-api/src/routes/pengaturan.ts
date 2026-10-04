import { Hono } from "hono";
import { db } from "../lib/db";
import {
  menu_main,
  menu_sub,
  role_menu,
  role_menu_sub,
  jabatan,
  users,
  pengaturan_aplikasi
} from "../lib/db/schema";
import { eq, and } from "drizzle-orm";
import { comparePassword, hashPassword } from "../lib/auth/password";
import type { JWTPayload } from "../lib/auth/jwt";

export const pengaturanRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// Struktur master menu untuk auto-seeding jika database kosong
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
      { nama: "Shift Kasir", link: "/hrd/shift-kasir", urutan: 3 },
      { nama: "Laporan Shift", link: "/hrd/shift-kasir/laporan", urutan: 4 },
      { nama: "Jadwal Kasir", link: "/hrd/jadwal-kasir", urutan: 5 },
      { nama: "Jabatan", link: "/hrd/jabatan", urutan: 6 },
      { nama: "Jam Kerja", link: "/hrd/jam-kerja", urutan: 7 },
      { nama: "Hari Libur", link: "/hrd/hari-libur", urutan: 8 },
      { nama: "Izin & Cuti", link: "/hrd/izin-cuti", urutan: 9 },
      { nama: "Hutang Abdi", link: "/hrd/hutang", urutan: 10 },
      { nama: "Bisyaroh", link: "/hrd/bisyaroh", urutan: 11 },
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
      { nama: "Saran Order (Smart)", link: "/pembelian/saran-order", urutan: 2 },
      { nama: "Sisa Pesanan (Backorder)", link: "/pembelian/backorder", urutan: 3 },
      { nama: "Faktur Beli", link: "/pembelian/invoice", urutan: 4 },
      { nama: "Riwayat Faktur", link: "/pembelian/history", urutan: 5 },
      { nama: "Hutang Supplier", link: "/pembelian/hutang", urutan: 6 },
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
      { nama: "Profit Per Cabang", link: "/akuntansi/profit-cabang", urutan: 5 },
    ],
  },
  {
    nama: "Manajemen Kas",
    link: "#",
    icon: "Banknote",
    urutan: 9,
    subs: [
      { nama: "Dashboard Kas", link: "/kas/dashboard", urutan: 1 },
      { nama: "Rekening Kas", link: "/kas/rekening", urutan: 2 },
      { nama: "Mutasi Kas", link: "/kas/transaksi", urutan: 3 },
      { nama: "Transfer Kas", link: "/kas/transfer", urutan: 4 },
      { nama: "Rekonsiliasi", link: "/kas/rekonsiliasi", urutan: 5 },
      { nama: "Laporan Kas", link: "/kas/laporan", urutan: 6 },
    ],
  },
  {
    nama: "Cabang",
    link: "/cabang",
    icon: "Building2",
    urutan: 10,
    subs: [],
  },
  {
    nama: "Pengaturan",
    link: "#",
    icon: "Settings",
    urutan: 11,
    subs: [
      { nama: "Role Menu", link: "/pengaturan/role-menu", urutan: 1 },
    ],
  },
];

// Helper to automatically seed missing menus & permissions
async function ensureMenusSeeded() {
  // 1. Seed master menus if empty
  const countMain = await db.select({ id: menu_main.id }).from(menu_main).limit(1);
  if (countMain.length === 0) {
    console.log("🌱 Database menu_main kosong! Melakukan auto-seeding master menus...");
    await db.transaction(async (tx) => {
      for (const main of MASTER_MENUS) {
        const [insertedMain] = await tx
          .insert(menu_main)
          .values({
            nama: main.nama,
            link: main.link,
            icon: main.icon,
            urutan: main.urutan,
            aktif: true,
          })
          .returning();

        if (main.subs.length > 0) {
          for (const sub of main.subs) {
            await tx.insert(menu_sub).values({
              id_menu_main: insertedMain.id,
              nama: sub.nama,
              link: sub.link,
              urutan: sub.urutan,
              aktif: true,
            });
          }
        }
      }
    });
  }

  // 2. Check and seed "Pengaturan Aplikasi" sub-menu if it's missing
  const [pengaturanMain] = await db
    .select()
    .from(menu_main)
    .where(eq(menu_main.nama, "Pengaturan"))
    .limit(1);
  if (pengaturanMain) {
    const [existingSub] = await db
      .select()
      .from(menu_sub)
      .where(eq(menu_sub.link, "/pengaturan/aplikasi"))
      .limit(1);
    if (!existingSub) {
      const [insertedSub] = await db.insert(menu_sub).values({
        id_menu_main: pengaturanMain.id,
        nama: "Pengaturan Aplikasi",
        link: "/pengaturan/aplikasi",
        urutan: 2,
        aktif: true,
      }).returning();

      // Auto grant full permissions to Jabatan ID 1 (Admin) and ID 2 (Owner)
      const targetJabatanIds = [1, 2];
      for (const jabId of targetJabatanIds) {
        const [exists] = await db.select().from(jabatan).where(eq(jabatan.id_jabatan, jabId)).limit(1);
        if (exists) {
          await db.insert(role_menu_sub).values({
            id_jabatan: jabId,
            id_menu_sub: insertedSub.id,
            aktif: true,
            can_read: true,
            can_create: true,
            can_update: true,
            can_delete: true,
          });
        }
      }
    }
  }

  // 3. Check and seed "Manajemen Kas" main menu and sub-menus if missing
  let [kasMain] = await db
    .select()
    .from(menu_main)
    .where(eq(menu_main.nama, "Manajemen Kas"))
    .limit(1);

  if (!kasMain) {
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
  }

  if (kasMain) {
    const KAS_SUBS = [
      { nama: "Dashboard Kas", link: "/kas/dashboard", urutan: 1 },
      { nama: "Rekening Kas", link: "/kas/rekening", urutan: 2 },
      { nama: "Mutasi Kas", link: "/kas/transaksi", urutan: 3 },
      { nama: "Shift Kasir", link: "/kas/shift", urutan: 4 },
      { nama: "Transfer Kas", link: "/kas/transfer", urutan: 5 },
      { nama: "Rekonsiliasi", link: "/kas/rekonsiliasi", urutan: 6 },
      { nama: "Laporan Kas", link: "/kas/laporan", urutan: 7 },
    ];

    for (const sub of KAS_SUBS) {
      const [existingSub] = await db
        .select()
        .from(menu_sub)
        .where(eq(menu_sub.link, sub.link))
        .limit(1);

      if (!existingSub) {
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

        // Auto grant full permissions to Jabatan ID 1 (Admin) and ID 2 (Owner)
        const targetJabatanIds = [1, 2];
        if (sub.link === "/kas/shift") {
          targetJabatanIds.push(7); // Juga berikan akses ke Kasir
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
                  eq(role_menu_sub.id_menu_sub, insertedSub.id)
                )
              )
              .limit(1);
            
            if (!permExists) {
              await db.insert(role_menu_sub).values({
                id_jabatan: jabId,
                id_menu_sub: insertedSub.id,
                aktif: true,
                can_read: true,
                can_create: true,
                can_update: true,
                can_delete: true,
              });
            }
          }
        }
      }
    }
  }

  // 4. Check and seed new "Shift Kasir" and "Laporan Shift" under "HRD & Abdi"
  const [hrdMain] = await db
    .select()
    .from(menu_main)
    .where(eq(menu_main.nama, "HRD & Abdi"))
    .limit(1);

  if (hrdMain) {
    const NEW_HRD_SUBS = [
      { nama: "Shift Kasir", link: "/hrd/shift-kasir", urutan: 9, targetJabatanIds: [1, 2, 7] }, // Admin, Owner, Kasir
      { nama: "Laporan Shift", link: "/hrd/shift-kasir/laporan", urutan: 10, targetJabatanIds: [1, 2] }, // Admin, Owner
      { nama: "Jadwal Kasir", link: "/hrd/jadwal-kasir", urutan: 11, targetJabatanIds: [1, 2] }, // Admin, Owner (HRD)
    ];

    for (const sub of NEW_HRD_SUBS) {
      const [existingSub] = await db
        .select()
        .from(menu_sub)
        .where(eq(menu_sub.link, sub.link))
        .limit(1);

      let subId = existingSub?.id;

      if (!existingSub) {
        const [insertedSub] = await db
          .insert(menu_sub)
          .values({
            id_menu_main: hrdMain.id,
            nama: sub.nama,
            link: sub.link,
            urutan: sub.urutan,
            aktif: true,
          })
          .returning();
        subId = insertedSub.id;
      } else {
        // Ensure correct details in database
        await db
          .update(menu_sub)
          .set({ nama: sub.nama, id_menu_main: hrdMain.id, urutan: sub.urutan, aktif: true })
          .where(eq(menu_sub.id, subId));
      }

      // Ensure permission mappings exist
      for (const jabId of sub.targetJabatanIds) {
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
          }
        }
      }
    }
  }

  // 5. Check and seed "Profit Per Cabang" under "Akuntansi"
  const [akuntansiMain] = await db
    .select()
    .from(menu_main)
    .where(eq(menu_main.nama, "Akuntansi"))
    .limit(1);

  if (akuntansiMain) {
    const subLink = "/akuntansi/profit-cabang";
    const [existingSub] = await db
      .select()
      .from(menu_sub)
      .where(eq(menu_sub.link, subLink))
      .limit(1);

    let subId = existingSub?.id;

    if (!existingSub) {
      const [insertedSub] = await db
        .insert(menu_sub)
        .values({
          id_menu_main: akuntansiMain.id,
          nama: "Profit Per Cabang",
          link: subLink,
          urutan: 5,
          aktif: true,
        })
        .returning();
      subId = insertedSub.id;
    } else {
      await db
        .update(menu_sub)
        .set({ nama: "Profit Per Cabang", id_menu_main: akuntansiMain.id, urutan: 5, aktif: true })
        .where(eq(menu_sub.id, subId));
    }

    // Auto grant full permissions to Super User (1) and IT (2)
    const targetJabatanIds = [1, 2];
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
        }
      }
    }
  }

  // Deactivate old "/kas/shift" submenu in database
  await db
    .update(menu_sub)
    .set({ aktif: false })
    .where(eq(menu_sub.link, "/kas/shift"));
}

// ==========================================
// 1. ROLE MENU & SEED MENU
// ==========================================
pengaturanRoutes.get("/role-menu", async (c) => {
  try {
    await ensureMenusSeeded();

    // 2. Ambil seluruh master data jabatan
    const jabatanList = await db
      .select({
        id_jabatan: jabatan.id_jabatan,
        jabatan: jabatan.jabatan,
      })
      .from(jabatan)
      .orderBy(jabatan.jabatan);

    // 3. Ambil seluruh data menu utama & sub-menu terdaftar
    const mains = await db.select().from(menu_main).where(eq(menu_main.aktif, true)).orderBy(menu_main.urutan);
    const subs = await db.select().from(menu_sub).where(eq(menu_sub.aktif, true)).orderBy(menu_sub.urutan);

    const menuTree = mains.map((m) => ({
      ...m,
      sub_menus: subs.filter((s) => s.id_menu_main === m.id),
    }));

    return c.json({
      success: true,
      jabatan: jabatanList,
      menus: menuTree,
    });
  } catch (error: any) {
    console.error("Gagal memproses data role menu:", error);
    return c.json({ success: false, message: "Gagal memproses master data role menu: " + error.message }, 500);
  }
});

pengaturanRoutes.get("/role-menu/:id", async (c) => {
  const id = c.req.param("id");
  const jabId = parseInt(id);

  if (isNaN(jabId)) {
    return c.json({ success: false, message: "ID Jabatan tidak valid" }, 400);
  }

  try {
    await ensureMenusSeeded();

    const mainRoles = await db
      .select({
        id_menu_main: role_menu.id_menu_main,
        link: menu_main.link,
        can_create: role_menu.can_create,
        can_read: role_menu.can_read,
        can_update: role_menu.can_update,
        can_delete: role_menu.can_delete,
      })
      .from(role_menu)
      .innerJoin(menu_main, eq(role_menu.id_menu_main, menu_main.id))
      .where(eq(role_menu.id_jabatan, jabId));

    const subRoles = await db
      .select({
        id_menu_sub: role_menu_sub.id_menu_sub,
        link: menu_sub.link,
        can_create: role_menu_sub.can_create,
        can_read: role_menu_sub.can_read,
        can_update: role_menu_sub.can_update,
        can_delete: role_menu_sub.can_delete,
      })
      .from(role_menu_sub)
      .innerJoin(menu_sub, eq(role_menu_sub.id_menu_sub, menu_sub.id))
      .where(eq(role_menu_sub.id_jabatan, jabId));

    return c.json({
      success: true,
      data: {
        main: mainRoles,
        sub: subRoles,
      },
    });
  } catch (error: any) {
    console.error("Gagal mengambil data role menu by id:", error);
    return c.json({ success: false, message: "Gagal mengambil data role menu: " + error.message }, 500);
  }
});

pengaturanRoutes.post("/role-menu", async (c) => {
  try {
    const body = await c.req.json();
    const { id_jabatan, main_menu, sub_menu } = body;

    if (!id_jabatan) {
      return c.json({ success: false, message: "ID Jabatan wajib disertakan" }, 400);
    }

    const jabId = parseInt(id_jabatan);

    // PostgreSQL compatible transaction (no .run())
    await db.transaction(async (tx) => {
      // A. Hapus data role lama
      await tx.delete(role_menu).where(eq(role_menu.id_jabatan, jabId));
      await tx.delete(role_menu_sub).where(eq(role_menu_sub.id_jabatan, jabId));

      // B. Simpan data role menu utama baru
      if (Array.isArray(main_menu) && main_menu.length > 0) {
        for (const item of main_menu) {
          if (item && typeof item === "object") {
            await tx.insert(role_menu).values({
              id_jabatan: jabId,
              id_menu_main: typeof item.id === "string" ? parseInt(item.id) : item.id,
              aktif: !!item.can_read,
              can_create: !!item.can_create,
              can_read: !!item.can_read,
              can_update: !!item.can_update,
              can_delete: !!item.can_delete,
            });
          } else {
            await tx.insert(role_menu).values({
              id_jabatan: jabId,
              id_menu_main: typeof item === "string" ? parseInt(item) : item,
              aktif: true,
              can_create: false,
              can_read: true,
              can_update: false,
              can_delete: false,
            });
          }
        }
      }

      // C. Simpan data role sub-menu baru
      if (Array.isArray(sub_menu) && sub_menu.length > 0) {
        for (const item of sub_menu) {
          if (item && typeof item === "object") {
            await tx.insert(role_menu_sub).values({
              id_jabatan: jabId,
              id_menu_sub: typeof item.id === "string" ? parseInt(item.id) : item.id,
              aktif: !!item.can_read,
              can_create: !!item.can_create,
              can_read: !!item.can_read,
              can_update: !!item.can_update,
              can_delete: !!item.can_delete,
            });
          } else {
            await tx.insert(role_menu_sub).values({
              id_jabatan: jabId,
              id_menu_sub: typeof item === "string" ? parseInt(item) : item,
              aktif: true,
              can_create: false,
              can_read: true,
              can_update: false,
              can_delete: false,
            });
          }
        }
      }
    });

    return c.json({
      success: true,
      message: "Hak akses berhasil diperbarui secara permanen!",
    });
  } catch (error: any) {
    console.error("Gagal menyimpan data role menu:", error);
    return c.json({ success: false, message: "Gagal menyimpan perubahan ke database: " + error.message }, 500);
  }
});

// ==========================================
// 2. USER PROFILE
// ==========================================
pengaturanRoutes.get("/profile", async (c) => {
  const activeUser = c.get("user");
  return c.json(activeUser);
});

pengaturanRoutes.put("/profile", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const { no_hp, foto } = body;

    const updateData: any = {};
    if (no_hp !== undefined) updateData.no_hp = no_hp;
    if (foto !== undefined) updateData.foto = foto;

    if (Object.keys(updateData).length === 0) {
      return c.json({ message: "Tidak ada data yang diubah" }, 400);
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, activeUser.id));

    return c.json({ message: "Profil berhasil diperbarui!" });
  } catch (error: any) {
    return c.json({ message: "Gagal memperbarui profil", error: error.message }, 500);
  }
});

pengaturanRoutes.put("/change-password", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return c.json({ message: "Semua kolom wajib diisi" }, 400);
    }

    if (newPassword !== confirmPassword) {
      return c.json({ message: "Konfirmasi password baru tidak cocok" }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ message: "Password baru minimal harus 6 karakter" }, 400);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, activeUser.id))
      .limit(1);

    if (!user) {
      return c.json({ message: "Pengguna tidak ditemukan" }, 404);
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return c.json({ message: "Password saat ini salah" }, 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, activeUser.id));

    return c.json({ message: "Password berhasil diubah!" });
  } catch (error: any) {
    return c.json({ message: "Gagal mengubah password", error: error.message }, 500);
  }
});

// ==========================================
// 3. PENGATURAN APLIKASI
// ==========================================
pengaturanRoutes.get("/aplikasi", async (c) => {
  try {
    const settings = await db.select().from(pengaturan_aplikasi);
    const config: Record<string, string> = {
      app_name: "ERP Al-Mubarok",
      company_name: "Yayasan Al-Mubarok",
      cash_approval_threshold: "500000",
      coa_kategori_penjualan: "7",
      coa_kategori_operasional: "10",
      coa_kategori_gaji: "8",
      coa_kategori_pembelian: "5",
    };
    for (const item of settings) {
      config[item.key] = item.value;
    }
    return c.json({ success: true, data: config });
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal memuat pengaturan aplikasi: " + err.message }, 500);
  }
});

pengaturanRoutes.put("/aplikasi", async (c) => {
  try {
    const body = await c.req.json();
    const keys = [
      "app_name",
      "company_name",
      "cash_approval_threshold",
      "coa_kategori_penjualan",
      "coa_kategori_operasional",
      "coa_kategori_gaji",
      "coa_kategori_pembelian"
    ];

    // Update or insert each key
    for (const key of keys) {
      if (body[key] !== undefined) {
        // Check if exists
        const [exists] = await db
          .select()
          .from(pengaturan_aplikasi)
          .where(eq(pengaturan_aplikasi.key, key))
          .limit(1);

        if (exists) {
          await db
            .update(pengaturan_aplikasi)
            .set({ value: String(body[key]) })
            .where(eq(pengaturan_aplikasi.key, key));
        } else {
          await db
            .insert(pengaturan_aplikasi)
            .values({ key, value: String(body[key]) });
        }
      }
    }

    return c.json({ success: true, message: "Pengaturan aplikasi berhasil disimpan" });
  } catch (err: any) {
    return c.json({ success: false, message: "Gagal menyimpan pengaturan aplikasi: " + err.message }, 500);
  }
});
