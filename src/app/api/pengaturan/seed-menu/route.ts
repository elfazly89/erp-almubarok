import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { menu_sub, menu_main, role_menu_sub, jabatan } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

/**
 * POST /api/pengaturan/seed-menu
 * Seeds any missing sub-menu entries that exist in MASTER_MENUS
 * but are not yet in the database. Also grants can_read access
 * to all existing jabatan for the new entries.
 */
export async function POST() {
  try {
    // 1. Find the "HRD & Abdi" main menu
    const hrdMain = await db
      .select()
      .from(menu_main)
      .where(eq(menu_main.link, "#"))
      .all();

    // Find the one with nama "HRD & Abdi"
    const hrdMenu = hrdMain.find((m) => m.nama === "HRD & Abdi");
    if (!hrdMenu) {
      return NextResponse.json({ error: "Menu utama HRD & Abdi tidak ditemukan" }, { status: 404 });
    }

    // 2. Check if /hrd/hutang already exists
    const existing = await db
      .select()
      .from(menu_sub)
      .where(eq(menu_sub.link, "/hrd/hutang"))
      .all();

    let subId: number;

    if (existing.length > 0) {
      subId = existing[0].id;
    } else {
      // 3. Insert the new submenu
      const [inserted] = await db
        .insert(menu_sub)
        .values({
          id_menu_main: hrdMenu.id,
          nama: "Hutang Abdi",
          link: "/hrd/hutang",
          urutan: 7,
          aktif: true,
        })
        .returning({ id: menu_sub.id });
      subId = inserted.id;

      // Also update Bisyaroh urutan to 8 to keep order consistent
      await db
        .update(menu_sub)
        .set({ urutan: 8 })
        .where(eq(menu_sub.link, "/hrd/bisyaroh"));
    }

    // 4. Grant can_read access to all existing jabatan that don't have this entry yet
    const allJabatan = await db.select().from(jabatan);

    for (const jab of allJabatan) {
      const alreadyGranted = await db
        .select()
        .from(role_menu_sub)
        .where(
          and(
            eq(role_menu_sub.id_jabatan, jab.id_jabatan),
            eq(role_menu_sub.id_menu_sub, subId)
          )
        )
        .all();

      if (alreadyGranted.length === 0) {
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

    return NextResponse.json({
      success: true,
      message: `Menu 'Hutang Abdi' berhasil didaftarkan (id: ${subId}) dan diberikan akses ke ${allJabatan.length} jabatan.`,
      sub_id: subId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal seed menu", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
