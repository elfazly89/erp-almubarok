import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { riwayat_poin, pelanggan } from "@/lib/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idPelanggan = searchParams.get("id_pelanggan");
    const jenis = searchParams.get("jenis_transaksi");
    const tglAwal = searchParams.get("tanggal_awal");
    const tglAkhir = searchParams.get("tanggal_akhir");

    const query = db
      .select({
        id: riwayat_poin.id,
        id_pelanggan: riwayat_poin.id_pelanggan,
        nama_lengkap: pelanggan.nama_lengkap,
        kode_pelanggan: pelanggan.kode_pelanggan,
        jenis_transaksi: riwayat_poin.jenis_transaksi,
        jumlah_poin: riwayat_poin.jumlah_poin,
        keterangan: riwayat_poin.keterangan,
        id_referensi_transaksi: riwayat_poin.id_referensi_transaksi,
        waktu: riwayat_poin.waktu,
      })
      .from(riwayat_poin)
      .leftJoin(pelanggan, eq(riwayat_poin.id_pelanggan, pelanggan.id_pelanggan));

    const conditions = [];

    if (idPelanggan) {
      conditions.push(eq(riwayat_poin.id_pelanggan, parseInt(idPelanggan)));
    }
    if (jenis) {
      conditions.push(eq(riwayat_poin.jenis_transaksi, jenis));
    }
    if (tglAwal) {
      conditions.push(gte(riwayat_poin.waktu, `${tglAwal} 00:00:00`));
    }
    if (tglAkhir) {
      conditions.push(lte(riwayat_poin.waktu, `${tglAkhir} 23:59:59`));
    }

    let results;
    if (conditions.length > 0) {
      results = await query.where(and(...conditions)).orderBy(desc(riwayat_poin.waktu));
    } else {
      results = await query.orderBy(desc(riwayat_poin.waktu));
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id_pelanggan, jenis_transaksi, jumlah_poin, keterangan, id_referensi_transaksi } = body;

    if (!id_pelanggan || !jenis_transaksi || !jumlah_poin) {
      return NextResponse.json({ error: "id_pelanggan, jenis_transaksi, dan jumlah_poin wajib diisi" }, { status: 400 });
    }

    // 1. Insert riwayat_poin record
    const [newPoin] = await db
      .insert(riwayat_poin)
      .values({
        id_pelanggan: parseInt(id_pelanggan),
        jenis_transaksi,
        jumlah_poin: parseInt(jumlah_poin),
        keterangan: keterangan || "Penyesuaian Manual",
        id_referensi_transaksi: id_referensi_transaksi || null,
        waktu: new Date().toISOString().replace('T', ' ').slice(0, 19),
      })
      .returning();

    // 2. Get current customer points
    const [cust] = await db
      .select({ total_poin: pelanggan.total_poin })
      .from(pelanggan)
      .where(eq(pelanggan.id_pelanggan, parseInt(id_pelanggan)));

    // 3. Update total_poin in pelanggan table
    const currentPoints = cust?.total_poin || 0;
    const adjust = jenis_transaksi === "DAPAT" ? parseInt(jumlah_poin) : -parseInt(jumlah_poin);
    const newTotal = Math.max(0, currentPoints + adjust);

    await db
      .update(pelanggan)
      .set({ total_poin: newTotal })
      .where(eq(pelanggan.id_pelanggan, parseInt(id_pelanggan)));

    return NextResponse.json({ success: true, record: newPoin, newTotalPoints: newTotal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
