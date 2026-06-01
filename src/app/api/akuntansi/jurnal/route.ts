import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jurnal_umum } from "@/lib/db/schema";
import { getServerSession } from "@/lib/auth/session";
import { sql, desc } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function GET() {
  try {
    const data = await db
      .select({
        no_referensi_bukti: jurnal_umum.no_referensi_bukti,
        tanggal_transaksi: jurnal_umum.tanggal_transaksi,
        deskripsi: jurnal_umum.deskripsi,
        total_debit: sql<number>`CAST(SUM(${jurnal_umum.debit}) AS INTEGER)`,
      })
      .from(jurnal_umum)
      .groupBy(
        jurnal_umum.no_referensi_bukti,
        jurnal_umum.tanggal_transaksi,
        jurnal_umum.deskripsi
      )
      .orderBy(desc(jurnal_umum.tanggal_transaksi));

    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal mengambil riwayat jurnal", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { message: "Sesi Anda telah berakhir, silakan login kembali" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const header = body.header;
    const entries = body.entries;

    if (!header || !entries || !header.tanggal_transaksi || !header.no_referensi_bukti || !header.deskripsi) {
      return NextResponse.json(
        { message: "Data header transaksi tidak lengkap" },
        { status: 400 }
      );
    }

    if (!Array.isArray(entries) || entries.length < 2) {
      return NextResponse.json(
        { message: "Jurnal umum harus terdiri dari minimal 2 entri baris" },
        { status: 400 }
      );
    }

    // Verify balances
    let totalDebit = 0;
    let totalKredit = 0;

    for (const entry of entries) {
      const dbVal = parseInt(entry.debit) || 0;
      const krVal = parseInt(entry.kredit) || 0;
      if (!entry.akun_id || !entry.cabang_id) {
        return NextResponse.json(
          { message: "Setiap entri baris wajib memiliki Akun dan Cabang" },
          { status: 400 }
        );
      }
      totalDebit += dbVal;
      totalKredit += krVal;
    }

    if (totalDebit <= 0) {
      return NextResponse.json(
        { message: "Nilai nominal transaksi harus lebih besar dari nol" },
        { status: 400 }
      );
    }

    if (Math.abs(totalDebit - totalKredit) > 0.001) {
      return NextResponse.json(
        { message: `Jurnal tidak seimbang. Total Debit (${totalDebit}) harus sama dengan total Kredit (${totalKredit})` },
        { status: 400 }
      );
    }

    // Check if reference code already exists in db
    const existingRef = await db
      .select({ id: jurnal_umum.id })
      .from(jurnal_umum)
      .where(sql`${jurnal_umum.no_referensi_bukti} = ${header.no_referensi_bukti}`)
      .limit(1);

    if (existingRef.length > 0) {
      return NextResponse.json(
        { message: `No. Referensi Bukti "${header.no_referensi_bukti}" sudah digunakan` },
        { status: 400 }
      );
    }

    // Save transactional
    await db.transaction(async (tx) => {
      for (const entry of entries) {
        await tx.insert(jurnal_umum).values({
          tanggal_transaksi: header.tanggal_transaksi,
          no_referensi_bukti: header.no_referensi_bukti,
          deskripsi: header.deskripsi,
          akun_id: parseInt(entry.akun_id),
          cabang_id: parseInt(entry.cabang_id),
          debit: parseInt(entry.debit) || 0,
          kredit: parseInt(entry.kredit) || 0,
          dibuat_oleh: session.id,
        });
      }
    });

    return NextResponse.json({ message: "Jurnal berhasil disimpan!" }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal menyimpan jurnal", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
