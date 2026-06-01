import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jam_kerja } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  await db.update(jam_kerja).set(body).where(eq(jam_kerja.id, parseInt(id)));
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await db.delete(jam_kerja).where(eq(jam_kerja.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
