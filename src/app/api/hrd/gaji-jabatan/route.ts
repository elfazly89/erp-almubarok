import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jabatan, daftar_gaji_jabatan } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function GET() {
  try {
    const data = await db
      .select({
        id_jabatan: jabatan.id_jabatan,
        jabatan: jabatan.jabatan,
        gaji_pokok: daftar_gaji_jabatan.gaji_pokok,
        gaji_per_jam: daftar_gaji_jabatan.gaji_per_jam,
        lembur_per_jam: daftar_gaji_jabatan.lembur_per_jam,
        id_gaji: daftar_gaji_jabatan.id,
      })
      .from(jabatan)
      .leftJoin(daftar_gaji_jabatan, eq(jabatan.id_jabatan, daftar_gaji_jabatan.id_jabatan))
      .orderBy(jabatan.jabatan);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data gaji jabatan", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id_jabatan, gaji_pokok, gaji_per_jam, lembur_per_jam } = body;

    if (!id_jabatan) {
      return NextResponse.json({ error: "ID Jabatan wajib diisi" }, { status: 400 });
    }

    // Check if configuration already exists
    const existing = await db
      .select()
      .from(daftar_gaji_jabatan)
      .where(eq(daftar_gaji_jabatan.id_jabatan, id_jabatan))
      .limit(1);

    const values = {
      id_jabatan: parseInt(id_jabatan),
      gaji_pokok: parseInt(gaji_pokok) || 0,
      gaji_per_jam: parseInt(gaji_per_jam) || 0,
      lembur_per_jam: parseInt(lembur_per_jam) || 0,
      updated_at: new Date().toISOString(),
    };

    if (existing.length > 0) {
      await db
        .update(daftar_gaji_jabatan)
        .set(values)
        .where(eq(daftar_gaji_jabatan.id_jabatan, id_jabatan));
    } else {
      await db.insert(daftar_gaji_jabatan).values(values);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan gaji", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
