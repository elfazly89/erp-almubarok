import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pelanggan } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Format data tidak valid, diharapkan array." },
        { status: 400 }
      );
    }

    // Filter baris yang valid (nama_lengkap wajib diisi)
    const validRows = body.filter(
      (item) => item && typeof item.nama_lengkap === "string" && item.nama_lengkap.trim()
    );

    if (validRows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data pelanggan valid untuk di-import." },
        { status: 400 }
      );
    }

    // Ambil jumlah pelanggan saat ini untuk penomoran kode_pelanggan
    const countResult = await db.select().from(pelanggan);
    let startCount = countResult.length;

    // Lakukan bulk insert menggunakan Drizzle ORM
    const inserted = await db
      .insert(pelanggan)
      .values(
        validRows.map((item, index) => {
          const idNum = startCount + index + 1;
          const generatedKode = `PLG-${String(idNum).padStart(4, "0")}`;
          
          return {
            kode_pelanggan: item.kode_pelanggan ? String(item.kode_pelanggan).trim() : generatedKode,
            nama_lengkap: item.nama_lengkap.trim(),
            email: item.email ? item.email.trim() : null,
            telepon: item.telepon ? String(item.telepon).trim() : null,
            alamat: item.alamat ? item.alamat.trim() : "-",
            level_harga: item.level_harga ? Math.min(3, Math.max(1, parseInt(item.level_harga) || 1)) : 1,
            total_poin: item.total_poin ? Math.max(0, parseInt(item.total_poin) || 0) : 0,
          };
        })
      )
      .returning();

    return NextResponse.json(
      {
        message: `Berhasil mengimpor ${inserted.length} pelanggan.`,
        count: inserted.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error bulk importing customers:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
