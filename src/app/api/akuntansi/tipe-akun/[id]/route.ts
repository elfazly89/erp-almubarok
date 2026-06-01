import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tipe_akun, daftar_akun } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const tipeId = parseInt(id);

    if (isNaN(tipeId)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    if (!body.nama || !body.posisi_saldo_normal) {
      return NextResponse.json(
        { message: "Nama dan posisi saldo normal wajib diisi" },
        { status: 400 }
      );
    }

    const [updatedTipe] = await db
      .update(tipe_akun)
      .set({
        nama: body.nama,
        posisi_saldo_normal: body.posisi_saldo_normal,
      })
      .where(eq(tipe_akun.id, tipeId))
      .returning();

    if (!updatedTipe) {
      return NextResponse.json(
        { message: "Tipe akun tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTipe);
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal memperbarui tipe akun", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const tipeId = parseInt(id);

    if (isNaN(tipeId)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    // Check if there are any CoA accounts referencing this tipe_akun
    const referencedAccounts = await db
      .select({ id: daftar_akun.id })
      .from(daftar_akun)
      .where(eq(daftar_akun.tipe_akun_id, tipeId))
      .limit(1);

    if (referencedAccounts.length > 0) {
      return NextResponse.json(
        { message: "Tipe akun tidak bisa dihapus karena masih digunakan oleh daftar akun (CoA)." },
        { status: 400 }
      );
    }

    const [deletedTipe] = await db
      .delete(tipe_akun)
      .where(eq(tipe_akun.id, tipeId))
      .returning();

    if (!deletedTipe) {
      return NextResponse.json(
        { message: "Tipe akun tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Tipe akun berhasil dihapus" });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal menghapus tipe akun", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
