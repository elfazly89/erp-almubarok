import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { vouchers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ valid: false, message: "Kode voucher harus diisi" }, { status: 400 });
  }

  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.kode_voucher, code.toUpperCase()), eq(vouchers.status, "AKTIF")));

  if (!voucher) {
    return NextResponse.json({ valid: false, message: "Voucher tidak ditemukan atau sudah tidak aktif" });
  }

  return NextResponse.json({
    valid: true,
    voucher: {
      id: voucher.id,
      kode_voucher: voucher.kode_voucher,
      nilai: voucher.nilai,
    },
  });
}
