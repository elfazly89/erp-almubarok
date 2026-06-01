import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jam_kerja } from "@/lib/db/schema";

export async function GET() {
  const data = await db.select().from(jam_kerja).orderBy(jam_kerja.nama_shift);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [newShift] = await db.insert(jam_kerja).values(body).returning();
  return NextResponse.json(newShift, { status: 201 });
}
