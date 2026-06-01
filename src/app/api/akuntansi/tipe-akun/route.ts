import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tipe_akun } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function GET() {
  try {
    const data = await db.select().from(tipe_akun).orderBy(asc(tipe_akun.id));
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal mengambil data tipe akun", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.nama || !body.posisi_saldo_normal) {
      return NextResponse.json(
        { message: "Nama dan posisi saldo normal wajib diisi" },
        { status: 400 }
      );
    }

    const [newTipe] = await db
      .insert(tipe_akun)
      .values({
        nama: body.nama,
        posisi_saldo_normal: body.posisi_saldo_normal,
      })
      .returning();

    return NextResponse.json(newTipe, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal menambahkan tipe akun", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
