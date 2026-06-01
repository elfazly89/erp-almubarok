import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { role_menu, role_menu_sub } from "@/lib/db/schema";
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
      })
      .from(role_menu)
      .where(and(eq(role_menu.id_jabatan, jabId), eq(role_menu.aktif, true)));

    // Ambil hak akses aktif untuk sub-menu
    const subRoles = await db
      .select({
        id_menu_sub: role_menu_sub.id_menu_sub,
      })
      .from(role_menu_sub)
      .where(and(eq(role_menu_sub.id_jabatan, jabId), eq(role_menu_sub.aktif, true)));

    return NextResponse.json({
      success: true,
      data: {
        main: mainRoles.map((r) => r.id_menu_main),
        sub: subRoles.map((r) => r.id_menu_sub),
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
