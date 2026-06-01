import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hari_libur } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  await db.update(hari_libur).set(body).where(eq(hari_libur.id, parseInt(id)));
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await db.delete(hari_libur).where(eq(hari_libur.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
