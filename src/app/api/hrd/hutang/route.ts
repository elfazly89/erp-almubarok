import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hutang_karyawan, users } from "@/lib/db/schema";
import { eq, and, like, sql, desc } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

// GET — list hutang with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const status = searchParams.get("status"); // aktif | lunas | all

    const rows = await db
      .select({
        id: hutang_karyawan.id,
        user_id: hutang_karyawan.user_id,
        nama_user: users.nama_user,
        kode_user: users.kode_user,
        nominal: hutang_karyawan.nominal,
        tanggal: hutang_karyawan.tanggal,
        keterangan: hutang_karyawan.keterangan,
        status: hutang_karyawan.status,
      })
      .from(hutang_karyawan)
      .leftJoin(users, eq(hutang_karyawan.user_id, users.id))
      .where(
        and(
          userId ? eq(hutang_karyawan.user_id, parseInt(userId)) : undefined,
          status && status !== "all"
            ? eq(hutang_karyawan.status, status as "aktif" | "lunas")
            : undefined
        )
      )
      .orderBy(desc(hutang_karyawan.tanggal), desc(hutang_karyawan.id));

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data hutang", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST — create new hutang record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, nominal, tanggal, keterangan } = body;

    if (!user_id || !nominal || !tanggal) {
      return NextResponse.json(
        { error: "user_id, nominal, dan tanggal wajib diisi" },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(hutang_karyawan)
      .values({
        user_id: parseInt(user_id),
        nominal: parseInt(nominal),
        tanggal,
        keterangan: keterangan || null,
        status: "aktif",
      })
      .returning({ id: hutang_karyawan.id });

    return NextResponse.json({ success: true, id: row.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan data hutang", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// PATCH — update hutang (nominal, keterangan, status)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, nominal, keterangan, status, tanggal } = body;

    if (!id) {
      return NextResponse.json({ error: "ID hutang wajib diisi" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (nominal !== undefined) updateData.nominal = parseInt(nominal);
    if (keterangan !== undefined) updateData.keterangan = keterangan;
    if (status !== undefined) updateData.status = status;
    if (tanggal !== undefined) updateData.tanggal = tanggal;

    await db.update(hutang_karyawan).set(updateData).where(eq(hutang_karyawan.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memperbarui data hutang", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// DELETE — remove a hutang record
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID hutang wajib disertakan" }, { status: 400 });
    }

    await db.delete(hutang_karyawan).where(eq(hutang_karyawan.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menghapus data hutang", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
