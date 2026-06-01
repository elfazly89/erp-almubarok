import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { daftar_akun, jurnal_umum } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const accountId = parseInt(id);

    if (isNaN(accountId)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    if (!body.kode_akun || !body.nama_akun || !body.tipe_akun_id) {
      return NextResponse.json(
        { message: "Kode akun, nama akun, dan tipe akun wajib diisi" },
        { status: 400 }
      );
    }

    // Verify if updated code is not taken by another account
    const existing = await db
      .select({ id: daftar_akun.id })
      .from(daftar_akun)
      .where(eq(daftar_akun.kode_akun, body.kode_akun))
      .limit(2);

    const duplicate = existing.find((a) => a.id !== accountId);
    if (duplicate) {
      return NextResponse.json(
        { message: `Kode akun "${body.kode_akun}" sudah terdaftar pada akun lain` },
        { status: 400 }
      );
    }

    const [updatedAccount] = await db
      .update(daftar_akun)
      .set({
        kode_akun: body.kode_akun,
        nama_akun: body.nama_akun,
        deskripsi: body.deskripsi || null,
        tipe_akun_id: parseInt(body.tipe_akun_id),
        status: body.status || "Aktif",
      })
      .where(eq(daftar_akun.id, accountId))
      .returning();

    if (!updatedAccount) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedAccount);
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal memperbarui akun", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const accountId = parseInt(id);

    if (isNaN(accountId)) {
      return NextResponse.json({ message: "ID tidak valid" }, { status: 400 });
    }

    // Check if the account is used in any general ledger journal entries
    const referencedEntries = await db
      .select({ id: jurnal_umum.id })
      .from(jurnal_umum)
      .where(eq(jurnal_umum.akun_id, accountId))
      .limit(1);

    if (referencedEntries.length > 0) {
      return NextResponse.json(
        { message: "Akun tidak bisa dihapus karena telah digunakan dalam transaksi jurnal." },
        { status: 400 }
      );
    }

    const [deletedAccount] = await db
      .delete(daftar_akun)
      .where(eq(daftar_akun.id, accountId))
      .returning();

    if (!deletedAccount) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Akun berhasil dihapus" });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal menghapus akun", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
