import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stok_barang } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  
  const updates: Partial<typeof stok_barang.$inferInsert> = {};
  if (body.posisi_rak !== undefined) updates.posisi_rak = body.posisi_rak;
  if (body.stok_akhir !== undefined) updates.stok_akhir = parseInt(body.stok_akhir);
  if (body.minimal_stok !== undefined) updates.minimal_stok = parseInt(body.minimal_stok);
  if (body.maksimal_stok !== undefined) updates.maksimal_stok = parseInt(body.maksimal_stok);
  
  await db
    .update(stok_barang)
    .set(updates)
    .where(eq(stok_barang.id, parseInt(id)));
    
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await db.delete(stok_barang).where(eq(stok_barang.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
