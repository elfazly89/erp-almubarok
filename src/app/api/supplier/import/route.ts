import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supplier } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Format data tidak valid, diharapkan array." },
        { status: 400 }
      );
    }

    // Filter baris yang valid (nama_supplier wajib diisi)
    const validRows = body.filter(
      (item) => item && typeof item.nama_supplier === "string" && item.nama_supplier.trim()
    );

    if (validRows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data supplier valid untuk di-import." },
        { status: 400 }
      );
    }

    // Lakukan bulk insert menggunakan Drizzle ORM
    const inserted = await db
      .insert(supplier)
      .values(
        validRows.map((item) => ({
          nama_supplier: item.nama_supplier.trim(),
          alamat: item.alamat ? item.alamat.trim() : null,
          telepon: item.telepon ? String(item.telepon).trim() : null,
          email: item.email ? item.email.trim() : null,
          bank: item.bank ? item.bank.trim() : null,
          no_rek_bank: item.no_rek_bank ? String(item.no_rek_bank).trim() : null,
          hari_kunjungan: item.hari_kunjungan ? item.hari_kunjungan.trim() : null,
          periode_kunjungan: item.periode_kunjungan ? item.periode_kunjungan.trim() : null,
          status_pajak: item.status_pajak ? item.status_pajak.trim() : "PKP",
          npwp: item.npwp ? String(item.npwp).trim() : null,
          keterangan_1: item.keterangan_1 ? item.keterangan_1.trim() : null,
          keterangan_2: item.keterangan_2 ? item.keterangan_2.trim() : null,
          hutang: 0,
        }))
      )
      .returning();

    return NextResponse.json(
      {
        message: `Berhasil mengimpor ${inserted.length} supplier.`,
        count: inserted.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error bulk importing suppliers:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
