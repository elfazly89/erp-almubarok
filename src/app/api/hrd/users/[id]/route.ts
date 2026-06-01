import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)));
  if (!user) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  const { password: _pw, ...safeUser } = user;
  void _pw; // intentionally unused — excluded from response for security
  return NextResponse.json(safeUser);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { password, ...rest } = body;

  const updateData: Partial<typeof users.$inferInsert> & { updated_at?: string } = {
    ...rest,
    updated_at: new Date().toISOString(),
  };

  if (password) {
    updateData.password = await hashPassword(password);
  }

  await db.update(users).set(updateData).where(eq(users.id, parseInt(id)));
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  await db.delete(users).where(eq(users.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
