import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, jabatan, cabang } from "@/lib/db/schema";
import { eq, like, or, sql, asc, desc } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { getErrorMessage } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;
  const sortBy = searchParams.get("sortBy") || "nama_user";
  const sortOrder = searchParams.get("sortOrder") || "asc";

  let orderExpr;
  if (sortBy === "kode_user") {
    orderExpr = sortOrder === "desc" ? desc(users.kode_user) : asc(users.kode_user);
  } else if (sortBy === "status") {
    orderExpr = sortOrder === "desc" ? desc(users.status) : asc(users.status);
  } else if (sortBy === "tanggal_masuk") {
    orderExpr = sortOrder === "desc" ? desc(users.tanggal_masuk) : asc(users.tanggal_masuk);
  } else if (sortBy === "no_hp") {
    orderExpr = sortOrder === "desc" ? desc(users.no_hp) : asc(users.no_hp);
  } else if (sortBy === "jabatan") {
    orderExpr = sortOrder === "desc" ? desc(jabatan.jabatan) : asc(jabatan.jabatan);
  } else if (sortBy === "nama_cabang") {
    orderExpr = sortOrder === "desc" ? desc(cabang.nama_cabang) : asc(cabang.nama_cabang);
  } else {
    orderExpr = sortOrder === "desc" ? desc(users.nama_user) : asc(users.nama_user);
  }

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        like(users.nama_user, `%${search}%`),
        like(users.kode_user, `%${search}%`),
        like(users.no_hp, `%${search}%`)
      )
    );
  }
  if (status) {
    conditions.push(eq(users.status, status as "Abdi Tetap" | "Kontrak" | "Training" | "Non-Aktif"));
  }

  const where = conditions.length > 0 ? conditions[0] : undefined;

  const [data, total] = await Promise.all([
    db
      .select({
        id: users.id,
        kode_user: users.kode_user,
        nama_user: users.nama_user,
        status: users.status,
        no_hp: users.no_hp,
        foto: users.foto,
        tanggal_masuk: users.tanggal_masuk,
        id_jabatan: users.id_jabatan,
        id_cabang: users.id_cabang,
        jabatan: jabatan.jabatan,
        nama_cabang: cabang.nama_cabang,
      })
      .from(users)
      .leftJoin(jabatan, eq(users.id_jabatan, jabatan.id_jabatan))
      .leftJoin(cabang, eq(users.id_cabang, cabang.id_cabang))
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(orderExpr),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(where),
  ]);

  return NextResponse.json({
    data,
    total: total[0].count,
    page,
    limit,
    totalPages: Math.ceil(total[0].count / limit),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, ...rest } = body;

    if (!password) {
      return NextResponse.json({ error: "Password wajib diisi" }, { status: 400 });
    }

    const hashed = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({ ...rest, password: hashed })
      .returning({ id: users.id });

    return NextResponse.json({ success: true, id: newUser.id }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes("UNIQUE")) {
      return NextResponse.json({ error: "Kode user sudah digunakan" }, { status: 409 });
    }
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
