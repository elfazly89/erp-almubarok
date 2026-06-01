import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hari_libur } from "@/lib/db/schema";

export async function GET() {
  const data = await db.select().from(hari_libur).orderBy(hari_libur.tanggal);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [newHari] = await db.insert(hari_libur).values(body).returning();
  return NextResponse.json(newHari, { status: 201 });
}
