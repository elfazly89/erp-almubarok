import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  stok_setting_cabang,
  barang,
  cabang,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

// GET /api/distribusi/setting — Ambil setting per barang-cabang
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const idBarang = searchParams.get("id_barang");
    const idCabang = searchParams.get("id_cabang");

    let query = db
      .select({
        id: stok_setting_cabang.id,
        id_barang: stok_setting_cabang.id_barang,
        id_cabang: stok_setting_cabang.id_cabang,
        minimum_stock: stok_setting_cabang.minimum_stock,
        safety_stock: stok_setting_cabang.safety_stock,
        target_days_stock: stok_setting_cabang.target_days_stock,
        lead_time_days: stok_setting_cabang.lead_time_days,
        updated_at: stok_setting_cabang.updated_at,
        nama_barang: barang.nama_barang,
        nama_cabang: cabang.nama_cabang,
      })
      .from(stok_setting_cabang)
      .leftJoin(barang, eq(stok_setting_cabang.id_barang, barang.id_barang))
      .leftJoin(cabang, eq(stok_setting_cabang.id_cabang, cabang.id_cabang));

    const results = await query;

    const filtered = results.filter((r) => {
      const matchBarang = !idBarang || r.id_barang?.toString() === idBarang;
      const matchCabang = !idCabang || r.id_cabang?.toString() === idCabang;
      return matchBarang && matchCabang;
    });

    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    console.error("Setting GET error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat setting distribusi", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// POST /api/distribusi/setting — Tambah atau update setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_barang, id_cabang, minimum_stock, safety_stock, target_days_stock, lead_time_days } = body;

    if (!id_barang || !id_cabang) {
      return NextResponse.json(
        { success: false, message: "id_barang dan id_cabang wajib diisi" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString().split("T")[0];

    // Upsert: cek apakah sudah ada
    const existing = await db
      .select({ id: stok_setting_cabang.id })
      .from(stok_setting_cabang)
      .where(
        and(
          eq(stok_setting_cabang.id_barang, id_barang),
          eq(stok_setting_cabang.id_cabang, id_cabang)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(stok_setting_cabang)
        .set({
          minimum_stock: minimum_stock ?? 0,
          safety_stock: safety_stock ?? 0,
          target_days_stock: target_days_stock ?? 14,
          lead_time_days: lead_time_days ?? 2,
          updated_at: now,
        })
        .where(eq(stok_setting_cabang.id, existing[0].id));

      return NextResponse.json({ success: true, message: "Setting berhasil diperbarui" });
    } else {
      await db.insert(stok_setting_cabang).values({
        id_barang,
        id_cabang,
        minimum_stock: minimum_stock ?? 0,
        safety_stock: safety_stock ?? 0,
        target_days_stock: target_days_stock ?? 14,
        lead_time_days: lead_time_days ?? 2,
        created_at: now,
        updated_at: now,
      });

      return NextResponse.json({ success: true, message: "Setting berhasil ditambahkan" });
    }
  } catch (error) {
    console.error("Setting POST error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan setting distribusi", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
