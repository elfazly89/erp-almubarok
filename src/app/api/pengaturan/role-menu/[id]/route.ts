import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { role_menu, role_menu_sub, menu_main, menu_sub } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const jabId = parseInt(id);

    if (isNaN(jabId)) {
      return NextResponse.json(
        { success: false, message: "ID Jabatan tidak valid" },
        { status: 400 }
      );
    }

    // Ambil hak akses aktif untuk menu utama
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

    // Ambil hak akses aktif untuk sub-menu
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

    return NextResponse.json({
      success: true,
      data: {
        main: mainRoles,
        sub: subRoles,
        mainIds: mainRoles.filter((r) => r.can_read).map((r) => r.id_menu_main),
        subIds: subRoles.filter((r) => r.can_read).map((r) => r.id_menu_sub),
      },
    });
  } catch (error: unknown) {
    console.error("Gagal memuat detail hak akses:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat detail hak akses", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
