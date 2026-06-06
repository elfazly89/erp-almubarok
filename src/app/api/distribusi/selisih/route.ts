import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  pengiriman,
  pengiriman_detail,
  pengiriman_selisih,
  barang,
  cabang,
} from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

// GET /api/distribusi/selisih — Daftar laporan selisih + daftar pengiriman yang perlu dicek
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const mode = searchParams.get("mode") || "laporan"; // "laporan" | "antrian"

    if (mode === "antrian") {
      // Pengiriman DC yang statusnya "Diterima Sementara" dan belum dicek
      const antrian = await db
        .select({
          id_pengiriman: pengiriman.id_pengiriman,
          kode_pengiriman: pengiriman.kode_pengiriman,
          tanggal_kirim: pengiriman.tanggal_kirim,
          driver: pengiriman.driver,
          nama_cabang_tujuan: sql<string>`t.nama_cabang`,
        })
        .from(pengiriman)
        .leftJoin(sql`cabang t`, sql`${pengiriman.id_cabang_tujuan} = t.id_cabang`)
        .where(
          and(
            eq(pengiriman.jenis_pengiriman, "DC"),
            eq(pengiriman.status, "Diterima Sementara")
          )
        )
        .orderBy(desc(pengiriman.tanggal_kirim));

      const results = await Promise.all(
        antrian.map(async (s) => {
          const items = await db
            .select({
              id: pengiriman_detail.id_detail_kirim,
              id_barang: pengiriman_detail.id_barang,
              jumlah_dikirim: pengiriman_detail.jumlah_dikirim,
              nama_barang: barang.nama_barang,
              barcode: barang.barcode,
            })
            .from(pengiriman_detail)
            .leftJoin(barang, eq(pengiriman_detail.id_barang, barang.id_barang))
            .where(eq(pengiriman_detail.id_pengiriman, s.id_pengiriman));

          return { ...s, items };
        })
      );

      return NextResponse.json({ success: true, data: results });
    }

    // Default: daftar laporan selisih
    const laporan = await db
      .select({
        id: pengiriman_selisih.id,
        id_pengiriman: pengiriman_selisih.id_pengiriman,
        id_barang: pengiriman_selisih.id_barang,
        jumlah_dikirim: pengiriman_selisih.jumlah_dikirim,
        jumlah_diterima: pengiriman_selisih.jumlah_diterima,
        selisih: pengiriman_selisih.selisih,
        jenis_selisih: pengiriman_selisih.jenis_selisih,
        alasan: pengiriman_selisih.alasan,
        foto_bukti: pengiriman_selisih.foto_bukti,
        status: pengiriman_selisih.status,
        dibuat_oleh: pengiriman_selisih.dibuat_oleh,
        created_at: pengiriman_selisih.created_at,
        kode_pengiriman: pengiriman.kode_pengiriman,
        nama_barang: barang.nama_barang,
        nama_cabang: sql<string>`t.nama_cabang`,
      })
      .from(pengiriman_selisih)
      .leftJoin(pengiriman, eq(pengiriman_selisih.id_pengiriman, pengiriman.id_pengiriman))
      .leftJoin(barang, eq(pengiriman_selisih.id_barang, barang.id_barang))
      .leftJoin(sql`cabang t`, sql`${pengiriman.id_cabang_tujuan} = t.id_cabang`)
      .orderBy(desc(pengiriman_selisih.created_at));

    return NextResponse.json({ success: true, data: laporan });
  } catch (error) {
    console.error("Selisih GET error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data selisih", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST /api/distribusi/selisih — Submit pengecekan barang oleh cabang
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idPengiriman, pemeriksaName, items } = body;

    if (!idPengiriman || !pemeriksaName || !items?.length) {
      return NextResponse.json(
        { success: false, message: "Data pengecekan tidak lengkap" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString().replace("T", " ").slice(0, 16);

    const selisihRows = [];
    let adaSelisih = false;

    for (const item of items as {
      idBarang: number;
      jumlahDikirim: number;
      jumlahDiterima: number;
      jenisSelisih?: string;
      alasan?: string;
      fotoBukti?: string;
    }[]) {
      const diff = item.jumlahDikirim - item.jumlahDiterima;
      if (diff !== 0) {
        adaSelisih = true;
        selisihRows.push({
          id_pengiriman: idPengiriman,
          id_barang: item.idBarang,
          jumlah_dikirim: item.jumlahDikirim,
          jumlah_diterima: item.jumlahDiterima,
          selisih: Math.abs(diff),
          jenis_selisih: item.jenisSelisih || (diff > 0 ? "KURANG" : "LEBIH"),
          alasan: item.alasan || "Pengecekan fisik manual",
          foto_bukti: item.fotoBukti || null,
          status: "MENUNGGU_PEMERIKSAAN",
          dibuat_oleh: pemeriksaName,
          created_at: now,
        });
      }

      // Update jumlah_diterima di pengiriman_detail
      await db
        .update(pengiriman_detail)
        .set({ jumlah_diterima: item.jumlahDiterima })
        .where(
          and(
            eq(pengiriman_detail.id_pengiriman, idPengiriman),
            eq(pengiriman_detail.id_barang, item.idBarang)
          )
        );
    }

    if (selisihRows.length > 0) {
      await db.insert(pengiriman_selisih).values(selisihRows);
    }

    // Update status pengiriman
    const newStatus = adaSelisih ? "Ada Selisih" : "Diterima Lengkap";
    await db
      .update(pengiriman)
      .set({ status: newStatus, tanggal_terima: new Date().toISOString().split("T")[0] })
      .where(eq(pengiriman.id_pengiriman, idPengiriman));

    return NextResponse.json({
      success: true,
      message: adaSelisih
        ? `Pengecekan selesai. Ditemukan ${selisihRows.length} item berselisih. Data dikirim ke Supervisor DC.`
        : "Pengecekan selesai. Pengiriman sesuai dokumen! Stok ter-update.",
      adaSelisih,
      totalSelisih: selisihRows.length,
    });
  } catch (error) {
    console.error("Selisih POST error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan pengecekan selisih", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// PUT /api/distribusi/selisih — Approval supervisor DC
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, approved, userId } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID selisih wajib diisi" }, { status: 400 });
    }

    const newStatus = approved ? "DISETUJUI" : "DITOLAK";
    await db
      .update(pengiriman_selisih)
      .set({
        status: newStatus,
        disetujui_oleh: userId || null,
        updated_at: new Date().toISOString().replace("T", " ").slice(0, 16),
      })
      .where(eq(pengiriman_selisih.id, id));

    let msg = `Kasus selisih ${newStatus.toLowerCase()}.`;
    if (approved) {
      const caseData = await db
        .select()
        .from(pengiriman_selisih)
        .where(eq(pengiriman_selisih.id, id))
        .limit(1);

      if (caseData[0]?.jenis_selisih === "KURANG") {
        msg += ` Pengiriman susulan akan dibuat sebanyak ${caseData[0].selisih} pcs.`;
      }
    }

    return NextResponse.json({ success: true, message: msg, status: newStatus });
  } catch (error) {
    console.error("Selisih PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses approval selisih", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
