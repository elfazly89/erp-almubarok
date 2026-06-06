import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  pengiriman,
  pengiriman_detail,
  cabang,
  barang,
  users,
} from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

// GET /api/distribusi/pengiriman?jenis=DC — Daftar surat jalan DC
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const jenisFilter = searchParams.get("jenis") || "DC";
    const search = searchParams.get("search") || "";

    const shipments = await db
      .select({
        id_pengiriman: pengiriman.id_pengiriman,
        kode_pengiriman: pengiriman.kode_pengiriman,
        id_cabang_sumber: pengiriman.id_cabang_sumber,
        id_cabang_tujuan: pengiriman.id_cabang_tujuan,
        jenis_pengiriman: pengiriman.jenis_pengiriman,
        id_rekomendasi: pengiriman.id_rekomendasi,
        armada: pengiriman.armada,
        driver: pengiriman.driver,
        status: pengiriman.status,
        tanggal_kirim: pengiriman.tanggal_kirim,
        tanggal_terima: pengiriman.tanggal_terima,
        nama_cabang_sumber: sql<string>`s.nama_cabang`,
        nama_cabang_tujuan: sql<string>`t.nama_cabang`,
      })
      .from(pengiriman)
      .leftJoin(sql`cabang s`, sql`${pengiriman.id_cabang_sumber} = s.id_cabang`)
      .leftJoin(sql`cabang t`, sql`${pengiriman.id_cabang_tujuan} = t.id_cabang`)
      .where(eq(pengiriman.jenis_pengiriman, jenisFilter))
      .orderBy(desc(pengiriman.tanggal_kirim));

    // Filter by search
    const filtered = shipments.filter((s) => {
      const matchSearch =
        !search ||
        s.kode_pengiriman.toLowerCase().includes(search.toLowerCase()) ||
        (s.nama_cabang_tujuan || "").toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });

    // Ambil items per shipment
    const results = await Promise.all(
      filtered.map(async (s) => {
        const items = await db
          .select({
            id: pengiriman_detail.id_detail_kirim,
            id_barang: pengiriman_detail.id_barang,
            jumlah_dikirim: pengiriman_detail.jumlah_dikirim,
            jumlah_diterima: pengiriman_detail.jumlah_diterima,
            nama_barang: barang.nama_barang,
            satuan: barang.satuan_1,
          })
          .from(pengiriman_detail)
          .leftJoin(barang, eq(pengiriman_detail.id_barang, barang.id_barang))
          .where(eq(pengiriman_detail.id_pengiriman, s.id_pengiriman));

        return { ...s, items };
      })
    );

    return NextResponse.json({ success: true, data: results, total: results.length });
  } catch (error) {
    console.error("Pengiriman GET error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data pengiriman", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST /api/distribusi/pengiriman — Buat surat jalan DC baru (manual)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idCabangTujuan, idUserId, armada, driver, tanggalKirim, items } = body;

    if (!idCabangTujuan || !items?.length) {
      return NextResponse.json(
        { success: false, message: "Cabang tujuan dan items wajib diisi" },
        { status: 400 }
      );
    }

    // Ambil cabang DC/Pusat sebagai sumber
    const dcCabang = await db.select().from(cabang).where(eq(cabang.nama_cabang, "PUSAT")).limit(1);
    const idDC = dcCabang[0]?.id_cabang || 1;

    const today = new Date();
    const todayStr = tanggalKirim || today.toISOString().split("T")[0];

    // Generate kode surat jalan
    const countSj = await db.select({ count: sql<number>`count(*)` }).from(pengiriman);
    const urutanSj = (Number(countSj[0]?.count ?? 0) + 1).toString().padStart(4, "0");
    const kodeSj = `SJ-DC-${todayStr.replace(/-/g, "")}${urutanSj}`;

    const [newSj] = await db
      .insert(pengiriman)
      .values({
        kode_pengiriman: kodeSj,
        id_cabang_sumber: idDC,
        id_cabang_tujuan: idCabangTujuan,
        id_user_pengirim: idUserId || 1,
        jenis_pengiriman: "DC",
        armada: armada || null,
        driver: driver || null,
        status: "Draft",
        tanggal_kirim: todayStr,
      })
      .returning();

    // Insert detail items
    const detailRows = items.map((item: { id_barang: number; jumlah: number }) => ({
      id_pengiriman: newSj.id_pengiriman,
      id_barang: item.id_barang,
      jumlah_dikirim: item.jumlah,
    }));

    await db.insert(pengiriman_detail).values(detailRows);

    return NextResponse.json({
      success: true,
      message: `Surat jalan ${kodeSj} berhasil dibuat.`,
      id: newSj.id_pengiriman,
      kode: kodeSj,
    });
  } catch (error) {
    console.error("Pengiriman POST error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat surat jalan", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// PUT /api/distribusi/pengiriman — Update status surat jalan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, tanggalTerima, armada, driver } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "ID dan status wajib diisi" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };
    if (tanggalTerima) updateData.tanggal_terima = tanggalTerima;
    if (armada) updateData.armada = armada;
    if (driver) updateData.driver = driver;

    await db
      .update(pengiriman)
      .set(updateData)
      .where(eq(pengiriman.id_pengiriman, id));

    return NextResponse.json({ success: true, message: `Status pengiriman diubah ke ${status}` });
  } catch (error) {
    console.error("Pengiriman PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui status pengiriman", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
