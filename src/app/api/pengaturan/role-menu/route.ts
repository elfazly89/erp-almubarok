import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menu_main, menu_sub, role_menu, role_menu_sub, jabatan } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

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
    ],
  },
  {
    nama: "Pembelian",
    link: "#",
    icon: "ShoppingBag",
    urutan: 5,
    subs: [
      { nama: "Purchase Order (PO)", link: "/pembelian/po", urutan: 1 },
      { nama: "Faktur Beli", link: "/pembelian/invoice", urutan: 2 },
      { nama: "Riwayat Faktur", link: "/pembelian/history", urutan: 3 },
      { nama: "Hutang Supplier", link: "/pembelian/hutang", urutan: 4 },
    ],
  },
  {
    nama: "Mutasi Stok",
    link: "#",
    icon: "ArrowLeftRight",
    urutan: 6,
    subs: [
      { nama: "Permintaan Barang", link: "/mutasi/request", urutan: 1 },
      { nama: "Kirim Barang", link: "/mutasi/kirim", urutan: 2 },
      { nama: "Terima Barang", link: "/mutasi/terima", urutan: 3 },
      { nama: "Selisih Kiriman", link: "/mutasi/selisih", urutan: 4 },
    ],
  },
  {
    nama: "Akuntansi",
    link: "#",
    icon: "BookOpen",
    urutan: 7,
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
    urutan: 8,
    subs: [],
  },
  {
    nama: "Pengaturan",
    link: "#",
    icon: "Settings",
    urutan: 9,
    subs: [
      { nama: "Role Menu", link: "/pengaturan/role-menu", urutan: 1 },
    ],
  },
];

export async function GET() {
  try {
    // 1. Periksa dan Auto-seed jika menu_main kosong
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

    // Satukan submenu ke main menu masing-masing
    const menuTree = mains.map((m) => ({
      ...m,
      sub_menus: subs.filter((s) => s.id_menu_main === m.id),
    }));

    return NextResponse.json({
      success: true,
      jabatan: jabatanList,
      menus: menuTree,
    });
  } catch (error: unknown) {
    console.error("Gagal memproses data role menu:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses master data role menu", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id_jabatan, main_menu, sub_menu } = body;

    if (!id_jabatan) {
      return NextResponse.json(
        { success: false, message: "ID Jabatan wajib disertakan" },
        { status: 400 }
      );
    }

    const jabId = parseInt(id_jabatan);

    // Database transactional update
    await db.transaction(async (tx) => {
      // A. Hapus data role lama untuk jabatan ini
      await tx.delete(role_menu).where(eq(role_menu.id_jabatan, jabId));
      await tx.delete(role_menu_sub).where(eq(role_menu_sub.id_jabatan, jabId));

      // B. Simpan data role menu utama baru
      if (Array.isArray(main_menu) && main_menu.length > 0) {
        for (const menuId of main_menu) {
          await tx.insert(role_menu).values({
            id_jabatan: jabId,
            id_menu_main: parseInt(menuId),
            aktif: true,
          });
        }
      }

      // C. Simpan data role sub-menu baru
      if (Array.isArray(sub_menu) && sub_menu.length > 0) {
        for (const subId of sub_menu) {
          await tx.insert(role_menu_sub).values({
            id_jabatan: jabId,
            id_menu_sub: parseInt(subId),
            aktif: true,
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Hak akses berhasil diperbarui secara permanen!",
    });
  } catch (error: unknown) {
    console.error("Gagal menyimpan data role menu:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan perubahan ke database", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
