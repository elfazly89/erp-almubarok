import { Hono } from "hono";
import { db } from "../lib/db";
import { tipe_akun, daftar_akun, jurnal_umum, cabang, users, penjualan, penjualan_detail } from "../lib/db/schema";
import { eq, and, gte, lte, lt, sql, asc, desc } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";

export const akuntansiRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// ==========================================
// 1. TIPE AKUN
// ==========================================
akuntansiRoutes.get("/tipe-akun", async (c) => {
  const data = await db.select().from(tipe_akun).orderBy(tipe_akun.nama);
  return c.json(data);
});

akuntansiRoutes.post("/tipe-akun", async (c) => {
  const body = await c.req.json();
  const [newType] = await db
    .insert(tipe_akun)
    .values({
      nama: body.nama,
      posisi_saldo_normal: body.posisi_saldo_normal,
    })
    .returning();
  return c.json(newType, 201);
});

akuntansiRoutes.put("/tipe-akun/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const [updatedType] = await db
    .update(tipe_akun)
    .set({
      nama: body.nama,
      posisi_saldo_normal: body.posisi_saldo_normal,
    })
    .where(eq(tipe_akun.id, parseInt(id)))
    .returning();
  return c.json(updatedType);
});

akuntansiRoutes.delete("/tipe-akun/:id", async (c) => {
  const id = c.req.param("id");
  // Cek apakah tipe akun ini digunakan di daftar_akun
  const ref = await db
    .select({ id: daftar_akun.id })
    .from(daftar_akun)
    .where(eq(daftar_akun.tipe_akun_id, parseInt(id)))
    .limit(1);

  if (ref.length > 0) {
    return c.json({ message: "Tipe akun tidak bisa dihapus karena masih digunakan oleh akun COA" }, 409);
  }

  await db.delete(tipe_akun).where(eq(tipe_akun.id, parseInt(id)));
  return c.json({ success: true });
});

// ==========================================
// 2. DAFTAR AKUN (COA)
// ==========================================
akuntansiRoutes.get("/daftar-akun", async (c) => {
  const data = await db
    .select({
      id: daftar_akun.id,
      kode_akun: daftar_akun.kode_akun,
      nama_akun: daftar_akun.nama_akun,
      deskripsi: daftar_akun.deskripsi,
      tipe_akun_id: daftar_akun.tipe_akun_id,
      status: daftar_akun.status,
      nama_tipe_akun: tipe_akun.nama,
      posisi_saldo_normal: tipe_akun.posisi_saldo_normal,
    })
    .from(daftar_akun)
    .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
    .orderBy(asc(daftar_akun.kode_akun));
  return c.json(data);
});

akuntansiRoutes.post("/daftar-akun", async (c) => {
  const body = await c.req.json();

  // Validasi keunikan kode_akun
  const existing = await db
    .select({ id: daftar_akun.id })
    .from(daftar_akun)
    .where(eq(daftar_akun.kode_akun, body.kode_akun))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ message: `Kode akun "${body.kode_akun}" sudah digunakan` }, 409);
  }

  const [newAkun] = await db
    .insert(daftar_akun)
    .values({
      kode_akun: body.kode_akun,
      nama_akun: body.nama_akun,
      deskripsi: body.deskripsi || null,
      tipe_akun_id: parseInt(body.tipe_akun_id),
      status: body.status || "Aktif",
    })
    .returning();
  return c.json(newAkun, 201);
});

akuntansiRoutes.put("/daftar-akun/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  // Validasi keunikan kode_akun dengan mengecualikan ID saat ini
  const existing = await db
    .select({ id: daftar_akun.id })
    .from(daftar_akun)
    .where(and(eq(daftar_akun.kode_akun, body.kode_akun), sql`${daftar_akun.id} != ${parseInt(id)}`))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ message: `Kode akun "${body.kode_akun}" sudah digunakan oleh akun lain` }, 409);
  }

  await db
    .update(daftar_akun)
    .set({
      kode_akun: body.kode_akun,
      nama_akun: body.nama_akun,
      deskripsi: body.deskripsi || null,
      tipe_akun_id: parseInt(body.tipe_akun_id),
      status: body.status || "Aktif",
    })
    .where(eq(daftar_akun.id, parseInt(id)));
  return c.json({ success: true });
});

akuntansiRoutes.delete("/daftar-akun/:id", async (c) => {
  const id = c.req.param("id");

  // Cek apakah akun ini digunakan di jurnal_umum
  const ref = await db
    .select({ id: jurnal_umum.id })
    .from(jurnal_umum)
    .where(eq(jurnal_umum.akun_id, parseInt(id)))
    .limit(1);

  if (ref.length > 0) {
    return c.json({ message: "Akun tidak bisa dihapus karena sudah memiliki riwayat transaksi di jurnal umum" }, 409);
  }

  await db.delete(daftar_akun).where(eq(daftar_akun.id, parseInt(id)));
  return c.json({ success: true });
});

// ==========================================
// 3. JURNAL UMUM
// ==========================================
akuntansiRoutes.get("/jurnal", async (c) => {
  const activeUser = c.get("user");
  const noRef = c.req.query("no_ref");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  // Get details of a single journal entry
  if (noRef) {
    const decodedRef = decodeURIComponent(noRef);
    const conditions = [eq(jurnal_umum.no_referensi_bukti, decodedRef)];
    
    // Branch isolation: filter by id_cabang if present
    if (activeUser?.id_cabang) {
      conditions.push(eq(jurnal_umum.cabang_id, activeUser.id_cabang));
    }

    const data = await db
      .select({
        id: jurnal_umum.id,
        tanggal_transaksi: jurnal_umum.tanggal_transaksi,
        no_referensi_bukti: jurnal_umum.no_referensi_bukti,
        deskripsi: jurnal_umum.deskripsi,
        debit: jurnal_umum.debit,
        kredit: jurnal_umum.kredit,
        created_at: jurnal_umum.created_at,
        akun_id: jurnal_umum.akun_id,
        kode_akun: daftar_akun.kode_akun,
        nama_akun: daftar_akun.nama_akun,
        cabang_id: jurnal_umum.cabang_id,
        nama_cabang: cabang.nama_cabang,
        kode_cabang: cabang.kode_cabang,
        dibuat_oleh_nama: users.nama_user,
      })
      .from(jurnal_umum)
      .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
      .leftJoin(cabang, eq(jurnal_umum.cabang_id, cabang.id_cabang))
      .leftJoin(users, eq(jurnal_umum.dibuat_oleh, users.id))
      .where(and(...conditions))
      .orderBy(asc(jurnal_umum.id));

    if (data.length === 0) {
      return c.json({ error: "Transaksi jurnal tidak ditemukan" }, 404);
    }
    return c.json(data);
  }

  // Get history grouped
  const conditions = [];
  if (activeUser?.id_cabang) {
    conditions.push(eq(jurnal_umum.cabang_id, activeUser.id_cabang));
  }
  if (startDate) {
    conditions.push(gte(jurnal_umum.tanggal_transaksi, startDate));
  }
  if (endDate) {
    conditions.push(lte(jurnal_umum.tanggal_transaksi, endDate));
  }

  const data = await db
    .select({
      no_referensi_bukti: jurnal_umum.no_referensi_bukti,
      tanggal_transaksi: jurnal_umum.tanggal_transaksi,
      deskripsi: jurnal_umum.deskripsi,
      total_debit: sql<number>`CAST(SUM(${jurnal_umum.debit}) AS INTEGER)`,
    })
    .from(jurnal_umum)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(
      jurnal_umum.no_referensi_bukti,
      jurnal_umum.tanggal_transaksi,
      jurnal_umum.deskripsi
    )
    .orderBy(desc(jurnal_umum.tanggal_transaksi));

  return c.json(data);
});

akuntansiRoutes.post("/jurnal", async (c) => {
  const activeUser = c.get("user");
  try {
    const body = await c.req.json();
    const header = body.header;
    const entries = body.entries;

    if (!header || !entries || !header.tanggal_transaksi || !header.no_referensi_bukti || !header.deskripsi) {
      return c.json({ message: "Data header transaksi tidak lengkap" }, 400);
    }

    if (!Array.isArray(entries) || entries.length < 2) {
      return c.json({ message: "Jurnal umum harus terdiri dari minimal 2 entri baris" }, 400);
    }

    // Verify balances
    let totalDebit = 0;
    let totalKredit = 0;

    for (const entry of entries) {
      const dbVal = parseInt(entry.debit) || 0;
      const krVal = parseInt(entry.kredit) || 0;
      if (!entry.akun_id || !entry.cabang_id) {
        return c.json({ message: "Setiap entri baris wajib memiliki Akun dan Cabang" }, 400);
      }
      totalDebit += dbVal;
      totalKredit += krVal;
    }

    if (totalDebit <= 0) {
      return c.json({ message: "Nilai nominal transaksi harus lebih besar dari nol" }, 400);
    }

    if (Math.abs(totalDebit - totalKredit) > 0.001) {
      return c.json({ message: `Jurnal tidak seimbang. Debit (${totalDebit}) harus sama dengan Kredit (${totalKredit})` }, 400);
    }

    // Check existing reference
    const existingRef = await db
      .select({ id: jurnal_umum.id })
      .from(jurnal_umum)
      .where(eq(jurnal_umum.no_referensi_bukti, header.no_referensi_bukti))
      .limit(1);

    if (existingRef.length > 0) {
      return c.json({ message: `No. Referensi Bukti "${header.no_referensi_bukti}" sudah digunakan` }, 400);
    }

    await db.transaction(async (tx) => {
      for (const entry of entries) {
        await tx.insert(jurnal_umum).values({
          tanggal_transaksi: header.tanggal_transaksi,
          no_referensi_bukti: header.no_referensi_bukti,
          deskripsi: header.deskripsi,
          akun_id: parseInt(entry.akun_id),
          cabang_id: parseInt(entry.cabang_id),
          debit: parseInt(entry.debit) || 0,
          kredit: parseInt(entry.kredit) || 0,
          dibuat_oleh: activeUser.id,
        });
      }
    });

    return c.json({ message: "Jurnal berhasil disimpan!" }, 201);
  } catch (error: any) {
    return c.json({ message: "Gagal menyimpan jurnal", error: error.message }, 500);
  }
});

// ==========================================
// 4. LAPORAN KEUANGAN
// ==========================================
// ==========================================
// 4. LAPORAN KEUANGAN
// ==========================================
akuntansiRoutes.get("/laporan", async (c) => {
  const activeUser = c.get("user");
  const type = c.req.query("type");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const akunId = c.req.query("akunId");

  if (!type) {
    return c.json({ message: "Parameter 'type' wajib disertakan" }, 400);
  }

  // A. BUKU BESAR
  if (type === "ledger") {
    if (!akunId) {
      return c.json({ message: "Parameter 'akunId' wajib disertakan untuk Buku Besar" }, 400);
    }
    const idAkun = parseInt(akunId);

    const [accountInfo] = await db
      .select({
        id: daftar_akun.id,
        kode_akun: daftar_akun.kode_akun,
        nama_akun: daftar_akun.nama_akun,
        posisi_saldo_normal: tipe_akun.posisi_saldo_normal,
      })
      .from(daftar_akun)
      .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
      .where(eq(daftar_akun.id, idAkun))
      .limit(1);

    if (!accountInfo) {
      return c.json({ message: "Akun tidak ditemukan" }, 404);
    }

    const normalBalance = accountInfo.posisi_saldo_normal;

    // Calculate beginning balance
    let saldoAwal = 0;
    if (startDate) {
      const conditionsPre = [eq(jurnal_umum.akun_id, idAkun), lt(jurnal_umum.tanggal_transaksi, startDate)];
      if (activeUser?.id_cabang) {
        conditionsPre.push(eq(jurnal_umum.cabang_id, activeUser.id_cabang));
      }
      const resPre = await db
        .select({
          total_debit: sql<number>`CAST(SUM(${jurnal_umum.debit}) AS INTEGER)`,
          total_kredit: sql<number>`CAST(SUM(${jurnal_umum.kredit}) AS INTEGER)`,
        })
        .from(jurnal_umum)
        .where(and(...conditionsPre));

      const debSum = resPre[0]?.total_debit || 0;
      const kreSum = resPre[0]?.total_kredit || 0;

      if (normalBalance === "DEBIT") {
        saldoAwal = debSum - kreSum;
      } else {
        saldoAwal = kreSum - debSum;
      }
    }

    // Get ledger transactions
    const conditions = [eq(jurnal_umum.akun_id, idAkun)];
    if (startDate) conditions.push(gte(jurnal_umum.tanggal_transaksi, startDate));
    if (endDate) conditions.push(lte(jurnal_umum.tanggal_transaksi, endDate));
    if (activeUser?.id_cabang) {
      conditions.push(eq(jurnal_umum.cabang_id, activeUser.id_cabang));
    }

    const txs = await db
      .select({
        id: jurnal_umum.id,
        tanggal_transaksi: jurnal_umum.tanggal_transaksi,
        no_referensi_bukti: jurnal_umum.no_referensi_bukti,
        deskripsi: jurnal_umum.deskripsi,
        debit: jurnal_umum.debit,
        kredit: jurnal_umum.kredit,
        nama_cabang: cabang.nama_cabang,
        kode_cabang: cabang.kode_cabang,
      })
      .from(jurnal_umum)
      .leftJoin(cabang, eq(jurnal_umum.cabang_id, cabang.id_cabang))
      .where(and(...conditions))
      .orderBy(asc(jurnal_umum.tanggal_transaksi), asc(jurnal_umum.id));

    return c.json({
      account: accountInfo,
      saldo_awal: saldoAwal,
      transactions: txs,
    });
  }

  // B. NERACA SALDO (TRIAL BALANCE)
  if (type === "trial-balance") {
    const conditions = [];
    if (startDate) conditions.push(gte(jurnal_umum.tanggal_transaksi, startDate));
    if (endDate) conditions.push(lte(jurnal_umum.tanggal_transaksi, endDate));
    if (activeUser?.id_cabang) {
      conditions.push(eq(jurnal_umum.cabang_id, activeUser.id_cabang));
    }

    // Optimized: Group by select instead of loop queries
    const rawData = await db
      .select({
        id: daftar_akun.id,
        kode_akun: daftar_akun.kode_akun,
        nama_akun: daftar_akun.nama_akun,
        tipe: tipe_akun.nama,
        posisi_saldo_normal: tipe_akun.posisi_saldo_normal,
        debit: sql<number>`CAST(SUM(${jurnal_umum.debit}) AS INTEGER)`,
        kredit: sql<number>`CAST(SUM(${jurnal_umum.kredit}) AS INTEGER)`,
      })
      .from(daftar_akun)
      .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
      .leftJoin(jurnal_umum, and(eq(jurnal_umum.akun_id, daftar_akun.id), ...conditions))
      .groupBy(
        daftar_akun.id,
        daftar_akun.kode_akun,
        daftar_akun.nama_akun,
        tipe_akun.nama,
        tipe_akun.posisi_saldo_normal
      )
      .orderBy(asc(daftar_akun.kode_akun));

    const results = rawData
      .map((item) => ({
        id: item.id,
        kode_akun: item.kode_akun,
        nama_akun: item.nama_akun,
        tipe: item.tipe || "Lainnya",
        posisi_saldo_normal: item.posisi_saldo_normal as "DEBIT" | "KREDIT",
        debit: item.debit || 0,
        kredit: item.kredit || 0,
      }))
      .filter((item) => item.debit > 0 || item.kredit > 0);

    return c.json(results);
  }

  // C. LABA RUGI
  if (type === "profit-loss") {
    const timeConditions = [];
    if (startDate) timeConditions.push(gte(jurnal_umum.tanggal_transaksi, startDate));
    if (endDate) timeConditions.push(lte(jurnal_umum.tanggal_transaksi, endDate));
    if (activeUser?.id_cabang) {
      timeConditions.push(eq(jurnal_umum.cabang_id, activeUser.id_cabang));
    }

    const revenues = await db
      .select({
        id: daftar_akun.id,
        kode_akun: daftar_akun.kode_akun,
        nama_akun: daftar_akun.nama_akun,
        total: sql<number>`CAST(SUM(${jurnal_umum.kredit}) - SUM(${jurnal_umum.debit}) AS INTEGER)`,
      })
      .from(daftar_akun)
      .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
      .leftJoin(jurnal_umum, and(eq(jurnal_umum.akun_id, daftar_akun.id), ...timeConditions))
      .where(eq(tipe_akun.nama, "Pendapatan"))
      .groupBy(daftar_akun.id, daftar_akun.kode_akun, daftar_akun.nama_akun)
      .orderBy(asc(daftar_akun.kode_akun));

    const expenses = await db
      .select({
        id: daftar_akun.id,
        kode_akun: daftar_akun.kode_akun,
        nama_akun: daftar_akun.nama_akun,
        total: sql<number>`CAST(SUM(${jurnal_umum.debit}) - SUM(${jurnal_umum.kredit}) AS INTEGER)`,
      })
      .from(daftar_akun)
      .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
      .leftJoin(jurnal_umum, and(eq(jurnal_umum.akun_id, daftar_akun.id), ...timeConditions))
      .where(eq(tipe_akun.nama, "Beban"))
      .groupBy(daftar_akun.id, daftar_akun.kode_akun, daftar_akun.nama_akun)
      .orderBy(asc(daftar_akun.kode_akun));

    // Trend analysis (using Postgres substring instead of SQLite strftime)
    const trend = await db
      .select({
        month: sql<string>`substring(${jurnal_umum.tanggal_transaksi} from 1 for 7)`,
        pendapatan: sql<number>`CAST(SUM(CASE WHEN ${tipe_akun.nama} = 'Pendapatan' THEN ${jurnal_umum.kredit} - ${jurnal_umum.debit} ELSE 0 END) AS INTEGER)`,
        beban: sql<number>`CAST(SUM(CASE WHEN ${tipe_akun.nama} = 'Beban' THEN ${jurnal_umum.debit} - ${jurnal_umum.kredit} ELSE 0 END) AS INTEGER)`,
      })
      .from(jurnal_umum)
      .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
      .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
      .where(and(sql`${jurnal_umum.tanggal_transaksi} IS NOT NULL`, ...timeConditions))
      .groupBy(sql`substring(${jurnal_umum.tanggal_transaksi} from 1 for 7)`)
      .orderBy(sql`substring(${jurnal_umum.tanggal_transaksi} from 1 for 7)`);

    return c.json({
      revenues: revenues.map((r) => ({ ...r, total: r.total || 0 })),
      expenses: expenses.map((e) => ({ ...e, total: e.total || 0 })),
      trend: trend.filter((t) => t.month !== null),
    });
  }

  // D. NERACA (BALANCE SHEET)
  if (type === "balance-sheet") {
    const limitDateCond = [];
    if (endDate) limitDateCond.push(lte(jurnal_umum.tanggal_transaksi, endDate));
    if (activeUser?.id_cabang) {
      limitDateCond.push(eq(jurnal_umum.cabang_id, activeUser.id_cabang));
    }

    const assets = await db
      .select({
        id: daftar_akun.id,
        kode_akun: daftar_akun.kode_akun,
        nama_akun: daftar_akun.nama_akun,
        total: sql<number>`CAST(SUM(${jurnal_umum.debit}) - SUM(${jurnal_umum.kredit}) AS INTEGER)`,
      })
      .from(daftar_akun)
      .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
      .leftJoin(jurnal_umum, and(eq(jurnal_umum.akun_id, daftar_akun.id), ...limitDateCond))
      .where(eq(tipe_akun.nama, "Aset"))
      .groupBy(daftar_akun.id, daftar_akun.kode_akun, daftar_akun.nama_akun)
      .orderBy(asc(daftar_akun.kode_akun));

    const liabilities = await db
      .select({
        id: daftar_akun.id,
        kode_akun: daftar_akun.kode_akun,
        nama_akun: daftar_akun.nama_akun,
        total: sql<number>`CAST(SUM(${jurnal_umum.kredit}) - SUM(${jurnal_umum.debit}) AS INTEGER)`,
      })
      .from(daftar_akun)
      .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
      .leftJoin(jurnal_umum, and(eq(jurnal_umum.akun_id, daftar_akun.id), ...limitDateCond))
      .where(eq(tipe_akun.nama, "Kewajiban"))
      .groupBy(daftar_akun.id, daftar_akun.kode_akun, daftar_akun.nama_akun)
      .orderBy(asc(daftar_akun.kode_akun));

    const equities = await db
      .select({
        id: daftar_akun.id,
        kode_akun: daftar_akun.kode_akun,
        nama_akun: daftar_akun.nama_akun,
        total: sql<number>`CAST(SUM(${jurnal_umum.kredit}) - SUM(${jurnal_umum.debit}) AS INTEGER)`,
      })
      .from(daftar_akun)
      .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
      .leftJoin(jurnal_umum, and(eq(jurnal_umum.akun_id, daftar_akun.id), ...limitDateCond))
      .where(eq(tipe_akun.nama, "Ekuitas"))
      .groupBy(daftar_akun.id, daftar_akun.kode_akun, daftar_akun.nama_akun)
      .orderBy(asc(daftar_akun.kode_akun));

    // Calculate net income
    const plRes = await db
      .select({
        revenue: sql<number>`CAST(SUM(CASE WHEN ${tipe_akun.nama} = 'Pendapatan' THEN ${jurnal_umum.kredit} - ${jurnal_umum.debit} ELSE 0 END) AS INTEGER)`,
        expense: sql<number>`CAST(SUM(CASE WHEN ${tipe_akun.nama} = 'Beban' THEN ${jurnal_umum.debit} - ${jurnal_umum.kredit} ELSE 0 END) AS INTEGER)`,
      })
      .from(jurnal_umum)
      .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
      .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
      .where(and(...limitDateCond));

    const netIncome = (plRes[0]?.revenue || 0) - (plRes[0]?.expense || 0);

    return c.json({
      assets: assets.map((a) => ({ ...a, total: a.total || 0 })).filter((a) => a.total !== 0),
      liabilities: liabilities.map((l) => ({ ...l, total: l.total || 0 })).filter((l) => l.total !== 0),
      equities: equities.map((e) => ({ ...e, total: e.total || 0 })),
      retained_earnings: netIncome,
    });
  }

  return c.json({ message: "Tipe laporan tidak dikenali" }, 400);
});

// ==========================================
// 5. DASHBOARD PROFIT PER CABANG
// ==========================================
const MULTI_BRANCH_JABATANS = [1, 2, 4, 8, 11]; // Super User, IT, Bendahara, Manager, SPV

akuntansiRoutes.get("/dashboard-profit", async (c) => {
  const activeUser = c.get("user");
  const userJabatan = activeUser?.id_jabatan || 0;
  const canAccessMultiBranch = MULTI_BRANCH_JABATANS.includes(userJabatan);

  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const idCabangParam = c.req.query("id_cabang");

  let filterCabangId: number | null = null;
  if (!canAccessMultiBranch) {
    filterCabangId = activeUser?.id_cabang || 0;
  } else if (idCabangParam) {
    filterCabangId = parseInt(idCabangParam) || null;
  }

  // POS Sales
  const salesCond = [];
  if (filterCabangId !== null) {
    salesCond.push(eq(penjualan.id_cabang, filterCabangId));
  }
  if (startDate) {
    salesCond.push(gte(penjualan.tanggal_invoice, startDate));
  }
  if (endDate) {
    salesCond.push(lte(penjualan.tanggal_invoice, endDate));
  }

  const [salesPOS] = await db
    .select({
      bruto: sql<number>`CAST(SUM(${penjualan.subtotal}) AS INTEGER)`,
      diskon: sql<number>`CAST(SUM(${penjualan.diskon} + ${penjualan.nominal_voucher} + ${penjualan.potongan_poin}) AS INTEGER)`,
      jumlah_transaksi: sql<number>`COUNT(${penjualan.id_penjualan})`,
    })
    .from(penjualan)
    .where(salesCond.length > 0 ? and(...salesCond) : undefined);

  // POS HPP
  const hppCond = [];
  if (filterCabangId !== null) {
    hppCond.push(eq(penjualan.id_cabang, filterCabangId));
  }
  if (startDate) {
    hppCond.push(gte(penjualan.tanggal_invoice, startDate));
  }
  if (endDate) {
    hppCond.push(lte(penjualan.tanggal_invoice, endDate));
  }

  const [hppPOS] = await db
    .select({
      total_hpp: sql<number>`CAST(SUM(${penjualan_detail.harga_rata_saat_transaksi} * ${penjualan_detail.jumlah} * ${penjualan_detail.isi_satuan}) AS INTEGER)`,
    })
    .from(penjualan_detail)
    .innerJoin(penjualan, eq(penjualan_detail.id_penjualan, penjualan.id_penjualan))
    .where(hppCond.length > 0 ? and(...hppCond) : undefined);

  // Journal values
  const journalCond = [];
  if (filterCabangId !== null) {
    journalCond.push(eq(jurnal_umum.cabang_id, filterCabangId));
  }
  if (startDate) {
    journalCond.push(gte(jurnal_umum.tanggal_transaksi, startDate));
  }
  if (endDate) {
    journalCond.push(lte(jurnal_umum.tanggal_transaksi, endDate));
  }

  // HPP Jurnal (Type 5: Harga Pokok Penjualan)
  const [hppJurnal] = await db
    .select({
      total: sql<number>`CAST(SUM(${jurnal_umum.debit}) - SUM(${jurnal_umum.kredit}) AS INTEGER)`,
    })
    .from(jurnal_umum)
    .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
    .where(and(eq(daftar_akun.tipe_akun_id, 5), ...journalCond));

  // Beban Jurnal (Type 6: Beban Operasional)
  const [bebanJurnal] = await db
    .select({
      total: sql<number>`CAST(SUM(${jurnal_umum.debit}) - SUM(${jurnal_umum.kredit}) AS INTEGER)`,
    })
    .from(jurnal_umum)
    .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
    .where(and(eq(daftar_akun.tipe_akun_id, 6), ...journalCond));

  // Jurnal Sales Bruto (Type 4: Pendapatan, specifically code starting with 4.1)
  const [salesBrutoJurnal] = await db
    .select({
      total: sql<number>`CAST(SUM(${jurnal_umum.kredit}) - SUM(${jurnal_umum.debit}) AS INTEGER)`,
    })
    .from(jurnal_umum)
    .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
    .where(and(eq(daftar_akun.tipe_akun_id, 4), sql`${daftar_akun.kode_akun} LIKE '4.1%'`, ...journalCond));

  // Jurnal Sales Retur & Diskon (Type 4: Pendapatan, specifically code starting with 4.2)
  const [salesReductionsJurnal] = await db
    .select({
      total: sql<number>`CAST(SUM(${jurnal_umum.debit}) - SUM(${jurnal_umum.kredit}) AS INTEGER)`,
    })
    .from(jurnal_umum)
    .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
    .where(and(eq(daftar_akun.tipe_akun_id, 4), sql`${daftar_akun.kode_akun} LIKE '4.2%'`, ...journalCond));

  // Jurnal Pendapatan Lain-lain (Type 8: Pendapatan & Beban Lain-lain, Credit normal)
  const [lainJurnal] = await db
    .select({
      debit: sql<number>`CAST(SUM(${jurnal_umum.debit}) AS INTEGER)`,
      kredit: sql<number>`CAST(SUM(${jurnal_umum.kredit}) AS INTEGER)`,
    })
    .from(jurnal_umum)
    .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
    .where(and(eq(daftar_akun.tipe_akun_id, 8), ...journalCond));

  const valSalesPOSBruto = salesPOS?.bruto || 0;
  const valSalesPOSDiskon = salesPOS?.diskon || 0;
  const valSalesPOSNet = valSalesPOSBruto - valSalesPOSDiskon;
  const valHppPOS = hppPOS?.total_hpp || 0;
  const valLabaKotorPOS = valSalesPOSNet - valHppPOS;
  const valBebanJurnal = bebanJurnal?.total || 0;
  const valLabaOperasionalPOS = valLabaKotorPOS - valBebanJurnal;

  const valSalesJurnalBruto = salesBrutoJurnal?.total || 0;
  const valSalesJurnalReductions = salesReductionsJurnal?.total || 0;
  const valSalesJurnalNet = valSalesJurnalBruto - valSalesJurnalReductions;
  const valHppJurnal = hppJurnal?.total || 0;
  const valLabaKotorJurnal = valSalesJurnalNet - valHppJurnal;
  const valLabaOperasionalJurnal = valLabaKotorJurnal - valBebanJurnal;

  const debitLain = lainJurnal?.debit || 0;
  const kreditLain = lainJurnal?.kredit || 0;
  const netLain = kreditLain - debitLain;
  const valOtherIncome = netLain > 0 ? netLain : 0;
  const valOtherExpense = netLain < 0 ? Math.abs(netLain) : 0;
  const valLabaSebelumPajakJurnal = valLabaOperasionalJurnal + valOtherIncome - valOtherExpense;

  return c.json({
    success: true,
    data: {
      pos: {
        penjualan_bruto: valSalesPOSBruto,
        diskon: valSalesPOSDiskon,
        penjualan_bersih: valSalesPOSNet,
        hpp: valHppPOS,
        laba_kotor: valLabaKotorPOS,
        beban_operasional: valBebanJurnal,
        laba_operasional: valLabaOperasionalPOS,
        margin_kotor: valSalesPOSNet > 0 ? (valLabaKotorPOS / valSalesPOSNet) * 100 : 0,
        margin_operasional: valSalesPOSNet > 0 ? (valLabaOperasionalPOS / valSalesPOSNet) * 100 : 0,
        jumlah_transaksi: salesPOS?.jumlah_transaksi || 0,
        avg_transaksi: (salesPOS?.jumlah_transaksi || 0) > 0 ? Math.round(valSalesPOSNet / salesPOS.jumlah_transaksi) : 0,
      },
      jurnal: {
        penjualan_bruto: valSalesJurnalBruto,
        diskon_retur: valSalesJurnalReductions,
        penjualan_bersih: valSalesJurnalNet,
        hpp: valHppJurnal,
        laba_kotor: valLabaKotorJurnal,
        beban_operasional: valBebanJurnal,
        laba_operasional: valLabaOperasionalJurnal,
        pendapatan_non_operasional: valOtherIncome,
        beban_non_operasional: valOtherExpense,
        laba_sebelum_pajak: valLabaSebelumPajakJurnal,
        margin_kotor: valSalesJurnalNet > 0 ? (valLabaKotorJurnal / valSalesJurnalNet) * 100 : 0,
        margin_operasional: valSalesJurnalNet > 0 ? (valLabaOperasionalJurnal / valSalesJurnalNet) * 100 : 0,
        margin_bersih: valSalesJurnalNet > 0 ? (valLabaSebelumPajakJurnal / valSalesJurnalNet) * 100 : 0,
      }
    }
  });
});

akuntansiRoutes.get("/dashboard-profit/cabang", async (c) => {
  const activeUser = c.get("user");
  const userJabatan = activeUser?.id_jabatan || 0;
  const canAccessMultiBranch = MULTI_BRANCH_JABATANS.includes(userJabatan);

  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  let cabangList = [];
  if (!canAccessMultiBranch) {
    cabangList = await db
      .select({
        id_cabang: cabang.id_cabang,
        kode_cabang: cabang.kode_cabang,
        nama_cabang: cabang.nama_cabang,
      })
      .from(cabang)
      .where(eq(cabang.id_cabang, activeUser?.id_cabang || 0));
  } else {
    cabangList = await db
      .select({
        id_cabang: cabang.id_cabang,
        kode_cabang: cabang.kode_cabang,
        nama_cabang: cabang.nama_cabang,
      })
      .from(cabang)
      .orderBy(cabang.nama_cabang);
  }

  const results = [];

  for (const cab of cabangList) {
    const cabId = cab.id_cabang;

    const salesCond = [eq(penjualan.id_cabang, cabId)];
    if (startDate) salesCond.push(gte(penjualan.tanggal_invoice, startDate));
    if (endDate) salesCond.push(lte(penjualan.tanggal_invoice, endDate));

    const [salesPOS] = await db
      .select({
        bruto: sql<number>`CAST(SUM(${penjualan.subtotal}) AS INTEGER)`,
        diskon: sql<number>`CAST(SUM(${penjualan.diskon} + ${penjualan.nominal_voucher} + ${penjualan.potongan_poin}) AS INTEGER)`,
      })
      .from(penjualan)
      .where(and(...salesCond));

    const hppCond = [eq(penjualan.id_cabang, cabId)];
    if (startDate) hppCond.push(gte(penjualan.tanggal_invoice, startDate));
    if (endDate) hppCond.push(lte(penjualan.tanggal_invoice, endDate));

    const [hppPOS] = await db
      .select({
        total_hpp: sql<number>`CAST(SUM(${penjualan_detail.harga_rata_saat_transaksi} * ${penjualan_detail.jumlah} * ${penjualan_detail.isi_satuan}) AS INTEGER)`,
      })
      .from(penjualan_detail)
      .innerJoin(penjualan, eq(penjualan_detail.id_penjualan, penjualan.id_penjualan))
      .where(and(...hppCond));

    const journalCond = [eq(jurnal_umum.cabang_id, cabId)];
    if (startDate) journalCond.push(gte(jurnal_umum.tanggal_transaksi, startDate));
    if (endDate) journalCond.push(lte(jurnal_umum.tanggal_transaksi, endDate));

    const [bebanJurnal] = await db
      .select({
        total: sql<number>`CAST(SUM(${jurnal_umum.debit}) - SUM(${jurnal_umum.kredit}) AS INTEGER)`,
      })
      .from(jurnal_umum)
      .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
      .where(and(eq(daftar_akun.tipe_akun_id, 6), ...journalCond));

    const valBruto = salesPOS?.bruto || 0;
    const valDiskon = salesPOS?.diskon || 0;
    const valNet = valBruto - valDiskon;
    const valHpp = hppPOS?.total_hpp || 0;
    const valKotor = valNet - valHpp;
    const valBeban = bebanJurnal?.total || 0;
    const valOperasional = valKotor - valBeban;

    results.push({
      id_cabang: cab.id_cabang,
      kode_cabang: cab.kode_cabang,
      nama_cabang: cab.nama_cabang,
      penjualan_bersih: valNet,
      hpp: valHpp,
      laba_kotor: valKotor,
      beban_operasional: valBeban,
      laba_operasional: valOperasional,
      margin_kotor: valNet > 0 ? (valKotor / valNet) * 100 : 0,
      margin_operasional: valNet > 0 ? (valOperasional / valNet) * 100 : 0,
    });
  }

  return c.json({
    success: true,
    data: results,
  });
});

akuntansiRoutes.get("/dashboard-profit/rekonsiliasi", async (c) => {
  const activeUser = c.get("user");
  const userJabatan = activeUser?.id_jabatan || 0;
  const canAccessMultiBranch = MULTI_BRANCH_JABATANS.includes(userJabatan);

  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  let cabangList = [];
  if (!canAccessMultiBranch) {
    cabangList = await db
      .select({
        id_cabang: cabang.id_cabang,
        kode_cabang: cabang.kode_cabang,
        nama_cabang: cabang.nama_cabang,
      })
      .from(cabang)
      .where(eq(cabang.id_cabang, activeUser?.id_cabang || 0));
  } else {
    cabangList = await db
      .select({
        id_cabang: cabang.id_cabang,
        kode_cabang: cabang.kode_cabang,
        nama_cabang: cabang.nama_cabang,
      })
      .from(cabang)
      .orderBy(cabang.nama_cabang);
  }

  const results = [];

  for (const cab of cabangList) {
    const cabId = cab.id_cabang;

    const salesCond = [eq(penjualan.id_cabang, cabId)];
    if (startDate) salesCond.push(gte(penjualan.tanggal_invoice, startDate));
    if (endDate) salesCond.push(lte(penjualan.tanggal_invoice, endDate));

    const [salesPOS] = await db
      .select({
        bruto: sql<number>`CAST(SUM(${penjualan.subtotal}) AS INTEGER)`,
        diskon: sql<number>`CAST(SUM(${penjualan.diskon} + ${penjualan.nominal_voucher} + ${penjualan.potongan_poin}) AS INTEGER)`,
      })
      .from(penjualan)
      .where(and(...salesCond));

    const valSalesPOS = (salesPOS?.bruto || 0) - (salesPOS?.diskon || 0);

    const hppCond = [eq(penjualan.id_cabang, cabId)];
    if (startDate) hppCond.push(gte(penjualan.tanggal_invoice, startDate));
    if (endDate) hppCond.push(lte(penjualan.tanggal_invoice, endDate));

    const [hppPOS] = await db
      .select({
        total_hpp: sql<number>`CAST(SUM(${penjualan_detail.harga_rata_saat_transaksi} * ${penjualan_detail.jumlah} * ${penjualan_detail.isi_satuan}) AS INTEGER)`,
      })
      .from(penjualan_detail)
      .innerJoin(penjualan, eq(penjualan_detail.id_penjualan, penjualan.id_penjualan))
      .where(and(...hppCond));

    const valHppPOS = hppPOS?.total_hpp || 0;

    const journalCond = [eq(jurnal_umum.cabang_id, cabId)];
    if (startDate) journalCond.push(gte(jurnal_umum.tanggal_transaksi, startDate));
    if (endDate) journalCond.push(lte(jurnal_umum.tanggal_transaksi, endDate));

    const [salesBrutoJurnal] = await db
      .select({
        total: sql<number>`CAST(SUM(${jurnal_umum.kredit}) - SUM(${jurnal_umum.debit}) AS INTEGER)`,
      })
      .from(jurnal_umum)
      .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
      .where(and(eq(daftar_akun.tipe_akun_id, 4), sql`${daftar_akun.kode_akun} LIKE '4.1%'`, ...journalCond));

    const [salesReductionsJurnal] = await db
      .select({
        total: sql<number>`CAST(SUM(${jurnal_umum.debit}) - SUM(${jurnal_umum.kredit}) AS INTEGER)`,
      })
      .from(jurnal_umum)
      .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
      .where(and(eq(daftar_akun.tipe_akun_id, 4), sql`${daftar_akun.kode_akun} LIKE '4.2%'`, ...journalCond));

    const valSalesJurnal = (salesBrutoJurnal?.total || 0) - (salesReductionsJurnal?.total || 0);

    const [hppJurnal] = await db
      .select({
        total: sql<number>`CAST(SUM(${jurnal_umum.debit}) - SUM(${jurnal_umum.kredit}) AS INTEGER)`,
      })
      .from(jurnal_umum)
      .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
      .where(and(eq(daftar_akun.tipe_akun_id, 5), ...journalCond));

    const valHppJurnal = hppJurnal?.total || 0;

    const selisihSales = valSalesPOS - valSalesJurnal;
    const selisihHpp = valHppPOS - valHppJurnal;

    results.push({
      id_cabang: cab.id_cabang,
      kode_cabang: cab.kode_cabang,
      nama_cabang: cab.nama_cabang,
      sales_pos: valSalesPOS,
      sales_jurnal: valSalesJurnal,
      selisih_sales: selisihSales,
      hpp_pos: valHppPOS,
      hpp_jurnal: valHppJurnal,
      selisih_hpp: selisihHpp,
      status: (Math.abs(selisihSales) > 0 || Math.abs(selisihHpp) > 0) ? "PERLU REKONSILIASI" : "COCOK",
    });
  }

  return c.json({
    success: true,
    data: results,
  });
});
