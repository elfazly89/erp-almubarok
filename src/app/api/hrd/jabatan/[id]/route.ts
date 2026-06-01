import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jabatan } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  await db.update(jabatan).set({ jabatan: body.jabatan }).where(eq(jabatan.id_jabatan, parseInt(id)));
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await db.delete(jabatan).where(eq(jabatan.id_jabatan, parseInt(id)));
  return NextResponse.json({ success: true });
}
