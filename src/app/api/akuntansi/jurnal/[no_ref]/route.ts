import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jurnal_umum, daftar_akun, cabang, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

interface Params {
  params: Promise<{ no_ref: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { no_ref } = await params;
    
    // Decode reference in case it has url-encoded characters
    const decodedRef = decodeURIComponent(no_ref);

    const data = await db
      .select({
        id: jurnal_umum.id,
        tanggal_transaksi: jurnal_umum.tanggal_transaksi,
        no_referensi_bukti: jurnal_umum.no_referensi_bukti,
        deskripsi: jurnal_umum.deskripsi,
        debit: jurnal_umum.debit,
        kredit: jurnal_umum.kredit,
        created_at: jurnal_umum.created_at,
        akun_id: jurnal_umum.akun_id,
        kode_akun: daftar_akun.kode_akun,
        nama_akun: daftar_akun.nama_akun,
        cabang_id: jurnal_umum.cabang_id,
        nama_cabang: cabang.nama_cabang,
        kode_cabang: cabang.kode_cabang,
        dibuat_oleh_nama: users.nama_user,
      })
      .from(jurnal_umum)
      .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
      .leftJoin(cabang, eq(jurnal_umum.cabang_id, cabang.id_cabang))
      .leftJoin(users, eq(jurnal_umum.dibuat_oleh, users.id))
      .where(eq(jurnal_umum.no_referensi_bukti, decodedRef))
      .orderBy(asc(jurnal_umum.id));

    if (data.length === 0) {
      return NextResponse.json(
        { message: "Transaksi jurnal tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal mengambil rincian jurnal", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
