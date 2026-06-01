import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jurnal_umum, daftar_akun, tipe_akun, cabang } from "@/lib/db/schema";
import { eq, and, gte, lte, lt, sql, asc } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const akunId = searchParams.get("akunId");

    if (!type) {
      return NextResponse.json(
        { message: "Parameter 'type' wajib disertakan" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. BUKU BESAR (GENERAL LEDGER)
    // ─────────────────────────────────────────────────────────────────────────
    if (type === "ledger") {
      if (!akunId) {
        return NextResponse.json(
          { message: "Parameter 'akunId' wajib disertakan untuk Buku Besar" },
          { status: 400 }
        );
      }

      const idAkun = parseInt(akunId);

      // Ambil tipe akun & posisi saldo normal
      const accountInfo = await db
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

      if (accountInfo.length === 0) {
        return NextResponse.json(
          { message: "Akun tidak ditemukan" },
          { status: 404 }
        );
      }

      const normalBalance = accountInfo[0].posisi_saldo_normal; // DEBIT / KREDIT

      // A. Hitung Saldo Awal sebelum startDate
      let saldoAwal = 0;
      if (startDate) {
        const queryPre = db
          .select({
            total_debit: sql<number>`CAST(SUM(${jurnal_umum.debit}) AS INTEGER)`,
            total_kredit: sql<number>`CAST(SUM(${jurnal_umum.kredit}) AS INTEGER)`,
          })
          .from(jurnal_umum)
          .where(
            and(
              eq(jurnal_umum.akun_id, idAkun),
              lt(jurnal_umum.tanggal_transaksi, startDate)
            )
          );

        const resPre = await queryPre;
        const debSum = resPre[0]?.total_debit || 0;
        const kreSum = resPre[0]?.total_kredit || 0;

        if (normalBalance === "DEBIT") {
          saldoAwal = debSum - kreSum;
        } else {
          saldoAwal = kreSum - debSum;
        }
      }

      // B. Ambil Transaksi pada rentang tanggal
      const conditions = [eq(jurnal_umum.akun_id, idAkun)];
      if (startDate) conditions.push(gte(jurnal_umum.tanggal_transaksi, startDate));
      if (endDate) conditions.push(lte(jurnal_umum.tanggal_transaksi, endDate));

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

      return NextResponse.json({
        account: accountInfo[0],
        saldo_awal: saldoAwal,
        transactions: txs,
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. NERACA SALDO (TRIAL BALANCE)
    // ─────────────────────────────────────────────────────────────────────────
    if (type === "trial-balance") {
      const conditions = [];
      if (startDate) conditions.push(gte(jurnal_umum.tanggal_transaksi, startDate));
      if (endDate) conditions.push(lte(jurnal_umum.tanggal_transaksi, endDate));

      const accounts = await db
        .select({
          id: daftar_akun.id,
          kode_akun: daftar_akun.kode_akun,
          nama_akun: daftar_akun.nama_akun,
          nama_tipe_akun: tipe_akun.nama,
          posisi_saldo_normal: tipe_akun.posisi_saldo_normal,
        })
        .from(daftar_akun)
        .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
        .orderBy(asc(daftar_akun.kode_akun));

      const results = [];
      for (const acc of accounts) {
        const filterConds = [eq(jurnal_umum.akun_id, acc.id), ...conditions];
        const res = await db
          .select({
            total_debit: sql<number>`CAST(SUM(${jurnal_umum.debit}) AS INTEGER)`,
            total_kredit: sql<number>`CAST(SUM(${jurnal_umum.kredit}) AS INTEGER)`,
          })
          .from(jurnal_umum)
          .where(and(...filterConds));

        const deb = res[0]?.total_debit || 0;
        const kre = res[0]?.total_kredit || 0;

        // Hanya tampilkan akun yang memiliki aktivitas atau saldo
        if (deb > 0 || kre > 0) {
          results.push({
            id: acc.id,
            kode_akun: acc.kode_akun,
            nama_akun: acc.nama_akun,
            tipe: acc.nama_tipe_akun,
            posisi_saldo_normal: acc.posisi_saldo_normal,
            debit: deb,
            kredit: kre,
          });
        }
      }

      return NextResponse.json(results);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. LABA RUGI (PROFIT & LOSS)
    // ─────────────────────────────────────────────────────────────────────────
    if (type === "profit-loss") {
      const timeConditions = [];
      if (startDate) timeConditions.push(gte(jurnal_umum.tanggal_transaksi, startDate));
      if (endDate) timeConditions.push(lte(jurnal_umum.tanggal_transaksi, endDate));

      // Fetch all Pendapatan accounts & their sum
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

      // Fetch all Beban accounts & their sum
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

      // Hitung trend bulanan untuk chart (menggunakan strftime '%Y-%m')
      const trend = await db
        .select({
          month: sql<string>`strftime('%Y-%m', ${jurnal_umum.tanggal_transaksi})`,
          pendapatan: sql<number>`CAST(SUM(CASE WHEN ${tipe_akun.nama} = 'Pendapatan' THEN ${jurnal_umum.kredit} - ${jurnal_umum.debit} ELSE 0 END) AS INTEGER)`,
          beban: sql<number>`CAST(SUM(CASE WHEN ${tipe_akun.nama} = 'Beban' THEN ${jurnal_umum.debit} - ${jurnal_umum.kredit} ELSE 0 END) AS INTEGER)`,
        })
        .from(jurnal_umum)
        .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
        .leftJoin(tipe_akun, eq(daftar_akun.tipe_akun_id, tipe_akun.id))
        .where(
          and(
            sql`${jurnal_umum.tanggal_transaksi} IS NOT NULL`,
            ...timeConditions
          )
        )
        .groupBy(sql`strftime('%Y-%m', ${jurnal_umum.tanggal_transaksi})`)
        .orderBy(sql`strftime('%Y-%m', ${jurnal_umum.tanggal_transaksi})`);

      return NextResponse.json({
        revenues: revenues.map(r => ({ ...r, total: r.total || 0 })),
        expenses: expenses.map(e => ({ ...e, total: e.total || 0 })),
        trend: trend.filter(t => t.month !== null)
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. NERACA (BALANCE SHEET)
    // ─────────────────────────────────────────────────────────────────────────
    if (type === "balance-sheet") {
      const limitDateCond = [];
      if (endDate) limitDateCond.push(lte(jurnal_umum.tanggal_transaksi, endDate));

      // Fetch all Aset accounts
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

      // Fetch all Kewajiban accounts
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

      // Fetch all Ekuitas accounts (excluding Retained Earnings dynamic calculation)
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

      // Hitung Laba/Rugi Bersih berjalan up to endDate untuk dijadikan "Laba Periode Berjalan"
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

      return NextResponse.json({
        assets: assets.map(a => ({ ...a, total: a.total || 0 })).filter(a => a.total !== 0),
        liabilities: liabilities.map(l => ({ ...l, total: l.total || 0 })).filter(l => l.total !== 0),
        equities: equities.map(e => ({ ...e, total: e.total || 0 })),
        retained_earnings: netIncome
      });
    }

    return NextResponse.json({ message: "Tipe laporan tidak dikenali" }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Gagal memproses data laporan", error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
