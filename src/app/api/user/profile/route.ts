import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { message: "Sesi Anda telah berakhir, silakan login kembali" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { no_hp, foto } = body;

    const updateData: any = {};
    if (no_hp !== undefined) updateData.no_hp = no_hp;
    if (foto !== undefined) updateData.foto = foto;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "Tidak ada data yang diubah" },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.id));

    return NextResponse.json({ message: "Profil berhasil diperbarui!" });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal memperbarui profil", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
