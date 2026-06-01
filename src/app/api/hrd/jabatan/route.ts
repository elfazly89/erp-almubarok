import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jabatan } from "@/lib/db/schema";

export async function GET() {
  const data = await db.select().from(jabatan).orderBy(jabatan.jabatan);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [newJabatan] = await db.insert(jabatan).values({ jabatan: body.jabatan }).returning();
  return NextResponse.json(newJabatan, { status: 201 });
}
