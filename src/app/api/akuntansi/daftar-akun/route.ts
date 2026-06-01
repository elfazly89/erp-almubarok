import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { daftar_akun, tipe_akun } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function GET() {
  try {
    const data = await db
      .select({
        id: daftar_akun.id,
        kode_akun: daftar_akun.kode_akun,
        nama_akun: daftar_akun.nama_akun,
        deskripsi: daftar_akun.deskripsi,
        tipe_akun_id: daftar_akun.tipe_akun_id,
        status: daftar_akun.status,
        nama_tipe_akun: tipe_akun.nama,
        posisi_saldo_normal: tipe_akun.posisi_saldo_normal,
      })
      .from(daftar_akun)
      .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
      .orderBy(asc(daftar_akun.kode_akun));

    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal mengambil data bagan akun (CoA)", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.kode_akun || !body.nama_akun || !body.tipe_akun_id) {
      return NextResponse.json(
        { message: "Kode akun, nama akun, dan tipe akun wajib diisi" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await db
      .select({ id: daftar_akun.id })
      .from(daftar_akun)
      .where(eq(daftar_akun.kode_akun, body.kode_akun))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { message: `Kode akun "${body.kode_akun}" sudah terdaftar` },
        { status: 400 }
      );
    }

    const [newAccount] = await db
      .insert(daftar_akun)
      .values({
        kode_akun: body.kode_akun,
        nama_akun: body.nama_akun,
        deskripsi: body.deskripsi || null,
        tipe_akun_id: parseInt(body.tipe_akun_id),
        status: body.status || "Aktif",
      })
      .returning();

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal menambahkan akun baru", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
