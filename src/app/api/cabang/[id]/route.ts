import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cabang } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const idCabang = parseInt(id);

    const body = await request.json();
    const { kode_cabang, nama_cabang, alamat, telepon, email, admin } = body;

    if (!kode_cabang || !nama_cabang || !alamat) {
      return NextResponse.json(
        { message: "Kode cabang, nama cabang, dan alamat wajib diisi" },
        { status: 400 }
      );
    }

    // Periksa keunikan kode cabang jika diubah
    const existing = await db
      .select({ id_cabang: cabang.id_cabang })
      .from(cabang)
      .where(
        and(
          eq(cabang.kode_cabang, kode_cabang),
          ne(cabang.id_cabang, idCabang)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { message: `Kode cabang "${kode_cabang}" sudah digunakan oleh cabang lain` },
        { status: 400 }
      );
    }

    const [updatedCabang] = await db
      .update(cabang)
      .set({
        kode_cabang,
        nama_cabang,
        alamat,
        telepon: telepon || null,
        email: email || null,
        admin: admin ? parseInt(admin) : null,
        updated_at: new Date().toISOString(),
      })
      .where(eq(cabang.id_cabang, idCabang))
      .returning();

    if (!updatedCabang) {
      return NextResponse.json(
        { message: "Cabang tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCabang);
  } catch (error: unknown) {
    console.error("Gagal memperbarui cabang:", error);
    return NextResponse.json(
      { message: "Gagal memperbarui cabang", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const idCabang = parseInt(id);

    const [deletedCabang] = await db
      .delete(cabang)
      .where(eq(cabang.id_cabang, idCabang))
      .returning();

    if (!deletedCabang) {
      return NextResponse.json(
        { message: "Cabang tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Cabang berhasil dihapus!" });
  } catch (error: unknown) {
    console.error("Gagal menghapus cabang:", error);
    return NextResponse.json(
      { message: "Gagal menghapus cabang", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
