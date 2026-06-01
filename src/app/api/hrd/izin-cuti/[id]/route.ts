import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { izin_cuti } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { action, approver_id, catatan_approval } = body;

  if (action === "approve" || action === "reject") {
    await db
      .update(izin_cuti)
      .set({
        status: action === "approve" ? "approved" : "rejected",
        approver_id,
        catatan_approval,
        tanggal_approval: new Date().toISOString(),
      })
      .where(eq(izin_cuti.id, parseInt(id)));
    return NextResponse.json({ success: true });
  }

  await db.update(izin_cuti).set(body).where(eq(izin_cuti.id, parseInt(id)));
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await db.delete(izin_cuti).where(eq(izin_cuti.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
