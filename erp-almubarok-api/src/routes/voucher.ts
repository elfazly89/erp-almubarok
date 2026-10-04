import { Hono } from "hono";
import { db } from "../lib/db";
import { vouchers } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";

export const voucherRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

voucherRoutes.get("/", async (c) => {
  const code = c.req.query("code");

  if (!code) {
    return c.json({ valid: false, message: "Kode voucher harus diisi" }, 400);
  }

  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.kode_voucher, code.toUpperCase()), eq(vouchers.status, "AKTIF")));

  if (!voucher) {
    return c.json({ valid: false, message: "Voucher tidak ditemukan atau sudah tidak aktif" });
  }

  return c.json({
    valid: true,
    voucher: {
      id: voucher.id,
      kode_voucher: voucher.kode_voucher,
      nilai: voucher.nilai,
    },
  });
});
