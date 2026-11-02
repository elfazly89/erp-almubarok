import { Hono } from "hono";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../lib/db";
import {
  penjualan,
  penjualan_detail,
  rekening_kas,
  kas_transaksi,
  kasir_shift,
  stok_barang,
  barang,
  barang_batch,
  pengiriman,
  faktur_beli,
  cabang,
  users,
  absensi,
  user_dashboard_preferences,
  jurnal_umum,
  daftar_akun,
} from "../lib/db/schema";
import type { JWTPayload } from "../lib/auth/jwt";

export const dashboardRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// ----------------------------------------------------
// HELPER: STATISTIK PERTUMBUHAN PERUSAHAAN & SELURUH CABANG
// ----------------------------------------------------
async function fetchGrowthStats(granularity = "monthly") {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  try {
    const allCabangs = await db
      .select({
        id_cabang: cabang.id_cabang,
        nama_cabang: cabang.nama_cabang,
      })
      .from(cabang)
      .orderBy(cabang.nama_cabang);

    if (granularity === "monthly") {
      const monthSlots: { ym: string; label: string; start: string; end: string }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        monthSlots.push({
          ym,
          label,
          start: `${ym}-01`,
          end: `${ym}-${String(lastDay).padStart(2, "0")}`,
        });
      }

      const earliestDate = monthSlots[0].start;
      const salesRows = await db
        .select({
          ym: sql<string>`SUBSTRING(${penjualan.tanggal_invoice}, 1, 7)`,
          id_cabang: penjualan.id_cabang,
          omzet: sql<number>`COALESCE(SUM(${penjualan.total_akhir}), 0)::int`,
          transaksi: sql<number>`COUNT(*)::int`,
        })
        .from(penjualan)
        .where(gte(penjualan.tanggal_invoice, earliestDate))
        .groupBy(sql`SUBSTRING(${penjualan.tanggal_invoice}, 1, 7)`, penjualan.id_cabang);

      const currentYm = monthSlots[monthSlots.length - 1].ym;
      const prevYm = monthSlots[monthSlots.length - 2].ym;

      // Company monthly trend
      const companyTrend = monthSlots.map((m) => {
        const rowsInMonth = salesRows.filter((r) => r.ym === m.ym);
        const omzet = rowsInMonth.reduce((acc, curr) => acc + Number(curr.omzet), 0);
        const transaksi = rowsInMonth.reduce((acc, curr) => acc + Number(curr.transaksi), 0);
        return {
          period: m.ym,
          label: m.label,
          omzet,
          transaksi,
        };
      });

      // Branch breakdown
      const branchDetails = allCabangs.map((c) => {
        const branchRows = salesRows.filter((r) => r.id_cabang === c.id_cabang);
        const currentOmzet = Number(branchRows.find((r) => r.ym === currentYm)?.omzet || 0);
        const previousOmzet = Number(branchRows.find((r) => r.ym === prevYm)?.omzet || 0);
        const diffNominal = currentOmzet - previousOmzet;
        const growthPercent =
          previousOmzet > 0
            ? Number(((diffNominal / previousOmzet) * 100).toFixed(1))
            : currentOmzet > 0
            ? 100
            : 0;

        const trend = monthSlots.map((m) => {
          const row = branchRows.find((r) => r.ym === m.ym);
          return {
            period: m.ym,
            label: m.label,
            omzet: Number(row?.omzet || 0),
          };
        });

        return {
          id_cabang: c.id_cabang,
          nama_cabang: c.nama_cabang,
          currentOmzet,
          previousOmzet,
          diffNominal,
          growthPercent,
          trend,
        };
      });

      branchDetails.sort((a, b) => b.currentOmzet - a.currentOmzet);

      const companyCurrent = companyTrend[companyTrend.length - 1]?.omzet || 0;
      const companyPrev = companyTrend[companyTrend.length - 2]?.omzet || 0;
      const companyDiff = companyCurrent - companyPrev;
      const companyGrowthPercent =
        companyPrev > 0
          ? Number(((companyDiff / companyPrev) * 100).toFixed(1))
          : companyCurrent > 0
          ? 100
          : 0;

      return {
        granularity: "monthly",
        periodTitle: "Bulan Ini vs Bulan Lalu (MoM)",
        company: {
          currentOmzet: companyCurrent,
          previousOmzet: companyPrev,
          diffNominal: companyDiff,
          growthPercent: companyGrowthPercent,
          trend: companyTrend,
        },
        branches: branchDetails,
      };
    } else if (granularity === "weekly") {
      const weekSlots: { label: string; start: string; end: string }[] = [];
      for (let i = 3; i >= 0; i--) {
        const endD = new Date(now);
        endD.setDate(now.getDate() - i * 7);
        const startD = new Date(endD);
        startD.setDate(endD.getDate() - 6);
        weekSlots.push({
          label: `W-${i === 0 ? "Ini" : 4 - i}`,
          start: startD.toISOString().slice(0, 10),
          end: endD.toISOString().slice(0, 10),
        });
      }

      const earliestDate = weekSlots[0].start;
      const salesWeekly = await db
        .select({
          tanggal: penjualan.tanggal_invoice,
          id_cabang: penjualan.id_cabang,
          omzet: sql<number>`COALESCE(SUM(${penjualan.total_akhir}), 0)::int`,
        })
        .from(penjualan)
        .where(gte(penjualan.tanggal_invoice, earliestDate))
        .groupBy(penjualan.tanggal_invoice, penjualan.id_cabang);

      const companyTrend = weekSlots.map((w) => {
        const rows = salesWeekly.filter((r) => r.tanggal >= w.start && r.tanggal <= w.end);
        const omzet = rows.reduce((acc, curr) => acc + Number(curr.omzet), 0);
        return {
          period: w.start,
          label: w.label,
          omzet,
        };
      });

      const branchDetails = allCabangs.map((c) => {
        const branchRows = salesWeekly.filter((r) => r.id_cabang === c.id_cabang);
        const currentSlot = weekSlots[weekSlots.length - 1];
        const prevSlot = weekSlots[weekSlots.length - 2];

        const currentOmzet = branchRows
          .filter((r) => r.tanggal >= currentSlot.start && r.tanggal <= currentSlot.end)
          .reduce((acc, curr) => acc + Number(curr.omzet), 0);

        const previousOmzet = branchRows
          .filter((r) => r.tanggal >= prevSlot.start && r.tanggal <= prevSlot.end)
          .reduce((acc, curr) => acc + Number(curr.omzet), 0);

        const diffNominal = currentOmzet - previousOmzet;
        const growthPercent =
          previousOmzet > 0
            ? Number(((diffNominal / previousOmzet) * 100).toFixed(1))
            : currentOmzet > 0
            ? 100
            : 0;

        const trend = weekSlots.map((w) => {
          const omzet = branchRows
            .filter((r) => r.tanggal >= w.start && r.tanggal <= w.end)
            .reduce((acc, curr) => acc + Number(curr.omzet), 0);
          return { period: w.start, label: w.label, omzet };
        });

        return {
          id_cabang: c.id_cabang,
          nama_cabang: c.nama_cabang,
          currentOmzet,
          previousOmzet,
          diffNominal,
          growthPercent,
          trend,
        };
      });

      branchDetails.sort((a, b) => b.currentOmzet - a.currentOmzet);
      const companyCurrent = companyTrend[companyTrend.length - 1]?.omzet || 0;
      const companyPrev = companyTrend[companyTrend.length - 2]?.omzet || 0;
      const companyDiff = companyCurrent - companyPrev;
      const companyGrowthPercent =
        companyPrev > 0
          ? Number(((companyDiff / companyPrev) * 100).toFixed(1))
          : companyCurrent > 0
          ? 100
          : 0;

      return {
        granularity: "weekly",
        periodTitle: "Minggu Ini vs Minggu Lalu (WoW)",
        company: {
          currentOmzet: companyCurrent,
          previousOmzet: companyPrev,
          diffNominal: companyDiff,
          growthPercent: companyGrowthPercent,
          trend: companyTrend,
        },
        branches: branchDetails,
      };
    } else {
      // Harian (30 Hari Terakhir vs 30 Hari Sebelumnya)
      const past30D = new Date(now);
      past30D.setDate(now.getDate() - 29);
      const startCurrentStr = past30D.toISOString().slice(0, 10);

      const past60D = new Date(now);
      past60D.setDate(now.getDate() - 59);
      const startPrevStr = past60D.toISOString().slice(0, 10);

      const past31D = new Date(now);
      past31D.setDate(now.getDate() - 30);
      const endPrevStr = past31D.toISOString().slice(0, 10);

      const salesDaily = await db
        .select({
          tanggal: penjualan.tanggal_invoice,
          id_cabang: penjualan.id_cabang,
          omzet: sql<number>`COALESCE(SUM(${penjualan.total_akhir}), 0)::int`,
        })
        .from(penjualan)
        .where(gte(penjualan.tanggal_invoice, startPrevStr))
        .groupBy(penjualan.tanggal_invoice, penjualan.id_cabang);

      const daySlots: { label: string; date: string }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        daySlots.push({
          label: d.toLocaleDateString("id-ID", { day: "numeric", month: "numeric" }),
          date: dateStr,
        });
      }

      const companyTrend = daySlots.map((ds) => {
        const rows = salesDaily.filter((r) => r.tanggal === ds.date);
        const omzet = rows.reduce((acc, curr) => acc + Number(curr.omzet), 0);
        return {
          period: ds.date,
          label: ds.label,
          omzet,
        };
      });

      const branchDetails = allCabangs.map((c) => {
        const branchRows = salesDaily.filter((r) => r.id_cabang === c.id_cabang);
        const currentOmzet = branchRows
          .filter((r) => r.tanggal >= startCurrentStr && r.tanggal <= todayStr)
          .reduce((acc, curr) => acc + Number(curr.omzet), 0);
        const previousOmzet = branchRows
          .filter((r) => r.tanggal >= startPrevStr && r.tanggal <= endPrevStr)
          .reduce((acc, curr) => acc + Number(curr.omzet), 0);

        const diffNominal = currentOmzet - previousOmzet;
        const growthPercent =
          previousOmzet > 0
            ? Number(((diffNominal / previousOmzet) * 100).toFixed(1))
            : currentOmzet > 0
            ? 100
            : 0;

        const trend = daySlots.map((ds) => {
          const row = branchRows.find((r) => r.tanggal === ds.date);
          return { period: ds.date, label: ds.label, omzet: Number(row?.omzet || 0) };
        });

        return {
          id_cabang: c.id_cabang,
          nama_cabang: c.nama_cabang,
          currentOmzet,
          previousOmzet,
          diffNominal,
          growthPercent,
          trend,
        };
      });

      branchDetails.sort((a, b) => b.currentOmzet - a.currentOmzet);
      const companyCurrent = branchDetails.reduce((acc, curr) => acc + curr.currentOmzet, 0);
      const companyPrev = branchDetails.reduce((acc, curr) => acc + curr.previousOmzet, 0);
      const companyDiff = companyCurrent - companyPrev;
      const companyGrowthPercent =
        companyPrev > 0
          ? Number(((companyDiff / companyPrev) * 100).toFixed(1))
          : companyCurrent > 0
          ? 100
          : 0;

      return {
        granularity: "daily",
        periodTitle: "30 Hari Terakhir vs 30 Hari Sebelumnya",
        company: {
          currentOmzet: companyCurrent,
          previousOmzet: companyPrev,
          diffNominal: companyDiff,
          growthPercent: companyGrowthPercent,
          trend: companyTrend,
        },
        branches: branchDetails,
      };
    }
  } catch (err: any) {
    console.error("⚠️ [Dashboard] Error in fetchGrowthStats:", err.cause || err.message);
    return null;
  }
}

// ==========================================
// 1. GET /api/dashboard/stats
// Aggregated statistics for the Modular Dashboard
// High performance parallel execution with isolated fault tolerance
// ==========================================
dashboardRoutes.get("/stats", async (c) => {
  try {
    const user = c.get("user");
    const queryCabang = c.req.query("id_cabang");
    const period = c.req.query("period") || "today";

    // Branch authorization scoping
    let idCabangFilter: number | null = null;
    const userRoleLower = (user?.jabatan || "").toLowerCase();
    const canAccessAllBranches =
      !user?.id_cabang ||
      userRoleLower.includes("super user") ||
      userRoleLower.includes("super admin") ||
      userRoleLower.includes("owner") ||
      userRoleLower.includes("direktur") ||
      userRoleLower.includes("manager") ||
      userRoleLower.includes("it") ||
      userRoleLower.includes("bendahara") ||
      user?.id_jabatan === 1 ||
      user?.id_jabatan === 2 ||
      user?.id_jabatan === 4 ||
      user?.id_jabatan === 8;

    if (queryCabang && queryCabang !== "all") {
      const parsed = parseInt(queryCabang, 10);
      if (!isNaN(parsed) && parsed > 0) {
        idCabangFilter = parsed;
      }
    } else if (user?.id_cabang && !canAccessAllBranches) {
      idCabangFilter = user.id_cabang;
    }

    // Helper dates
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let startDate = todayStr;
    const endDate = todayStr;

    if (period === "7days") {
      const past7 = new Date(now);
      past7.setDate(now.getDate() - 6);
      startDate = past7.toISOString().slice(0, 10);
    } else if (period === "30days") {
      const past30 = new Date(now);
      past30.setDate(now.getDate() - 29);
      startDate = past30.toISOString().slice(0, 10);
    } else if (period === "this_month") {
      startDate = `${todayStr.slice(0, 7)}-01`;
    }

    // ----------------------------------------------------
    // A. Task: KPI OMZET & TRANSAKSI
    // ----------------------------------------------------
    const fetchSalesKpi = async () => {
      try {
        const salesConditions = [
          gte(penjualan.tanggal_invoice, startDate),
          lte(penjualan.tanggal_invoice, endDate),
        ];
        if (idCabangFilter !== null) {
          salesConditions.push(eq(penjualan.id_cabang, idCabangFilter));
        }

        const [salesKpi] = await db
          .select({
            omzet: sql<number>`COALESCE(SUM(${penjualan.total_akhir}), 0)::int`,
            totalTransaksi: sql<number>`COUNT(*)::int`,
          })
          .from(penjualan)
          .where(and(...salesConditions));

        // Omzet Kemarin
        const yesterdayConditions = [eq(penjualan.tanggal_invoice, yesterdayStr)];
        if (idCabangFilter !== null) {
          yesterdayConditions.push(eq(penjualan.id_cabang, idCabangFilter));
        }
        const [salesKemarin] = await db
          .select({
            omzetKemarin: sql<number>`COALESCE(SUM(${penjualan.total_akhir}), 0)::int`,
          })
          .from(penjualan)
          .where(and(...yesterdayConditions));

        const omzet = Number(salesKpi?.omzet || 0);
        const totalTransaksi = Number(salesKpi?.totalTransaksi || 0);
        const omzetKemarin = Number(salesKemarin?.omzetKemarin || 0);
        const growthPercent =
          omzetKemarin > 0
            ? Number((((omzet - omzetKemarin) / omzetKemarin) * 100).toFixed(1))
            : 0;
        const basketSize = totalTransaksi > 0 ? Math.round(omzet / totalTransaksi) : 0;

        let marginKotor = 0;
        try {
          const [marginResult] = await db
            .select({
              margin: sql<number>`
                COALESCE(SUM(
                  ${penjualan_detail.subtotal} - (${penjualan_detail.jumlah} * COALESCE(${barang.harga_beli}, 0))
                ), 0)::int
              `,
            })
            .from(penjualan_detail)
            .innerJoin(penjualan, eq(penjualan_detail.id_penjualan, penjualan.id_penjualan))
            .leftJoin(barang, eq(penjualan_detail.id_barang, barang.id_barang))
            .where(and(...salesConditions));
          marginKotor = Number(marginResult?.margin || Math.round(omzet * 0.2));
        } catch {
          marginKotor = Math.round(omzet * 0.2);
        }

        // Beban Operasional (Jurnal Beban Umum Akun Tipe 6 & Kas Keluar Operasional)
        let bebanOperasional = 0;
        try {
          const journalExpenseCond = [
            gte(jurnal_umum.tanggal_transaksi, startDate),
            lte(jurnal_umum.tanggal_transaksi, endDate),
          ];
          if (idCabangFilter !== null) {
            journalExpenseCond.push(eq(jurnal_umum.cabang_id, idCabangFilter));
          }

          const [bebanJurnalRes] = await db
            .select({
              total: sql<number>`COALESCE(CAST(SUM(${jurnal_umum.debit}) - SUM(${jurnal_umum.kredit}) AS INTEGER), 0)`,
            })
            .from(jurnal_umum)
            .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
            .where(and(eq(daftar_akun.tipe_akun_id, 6), ...journalExpenseCond));

          bebanOperasional = Number(bebanJurnalRes?.total || 0);

          // Fallback jika jurnal belum tersinkronisasi, hitung dari kas_transaksi keluar
          if (bebanOperasional <= 0) {
            const kasBebanCond = [
              gte(kas_transaksi.tanggal, startDate),
              lte(kas_transaksi.tanggal, endDate),
              eq(kas_transaksi.tipe, "KELUAR"),
              sql`(${kas_transaksi.kategori} IN ('OPERASIONAL', 'GAJI', 'BEBAN') OR ${kas_transaksi.kategori} IS NULL)`,
            ];
            if (idCabangFilter !== null) {
              kasBebanCond.push(eq(kas_transaksi.id_cabang, idCabangFilter));
            }
            const [kasBebanRes] = await db
              .select({
                total: sql<number>`COALESCE(SUM(${kas_transaksi.nominal}), 0)::int`,
              })
              .from(kas_transaksi)
              .where(and(...kasBebanCond));
            bebanOperasional = Number(kasBebanRes?.total || 0);
          }
        } catch (e) {
          console.warn("⚠️ Error fetching bebanOperasional:", e);
        }

        const labaBersih = marginKotor - bebanOperasional;
        const marginKotorPercent = omzet > 0 ? Number(((marginKotor / omzet) * 100).toFixed(1)) : 0;
        const marginBersihPercent = omzet > 0 ? Number(((labaBersih / omzet) * 100).toFixed(1)) : 0;

        return {
          omzet,
          omzetKemarin,
          growthPercent,
          totalTransaksi,
          basketSize,
          marginKotor,
          marginKotorPercent,
          bebanOperasional,
          labaBersih,
          marginBersihPercent,
        };
      } catch (err: any) {
        console.error("⚠️ [Dashboard] Error in fetchSalesKpi:", err.cause || err.message);
        return {
          omzet: 0,
          omzetKemarin: 0,
          growthPercent: 0,
          totalTransaksi: 0,
          basketSize: 0,
          marginKotor: 0,
          marginKotorPercent: 0,
          bebanOperasional: 0,
          labaBersih: 0,
          marginBersihPercent: 0,
        };
      }
    };

    // ----------------------------------------------------
    // B. Task: LIKUIDITAS REKENING KAS & BANK
    // ----------------------------------------------------
    const fetchKas = async () => {
      try {
        const kasConditions = [eq(rekening_kas.is_active, true)];
        if (idCabangFilter !== null) {
          kasConditions.push(eq(rekening_kas.id_cabang, idCabangFilter));
        }

        const [totalSaldoResult] = await db
          .select({
            totalSaldo: sql<number>`COALESCE(SUM(${rekening_kas.saldo}), 0)::int`,
          })
          .from(rekening_kas)
          .where(and(...kasConditions));

        const totalSaldoKasBank = Number(totalSaldoResult?.totalSaldo || 0);

        const rekeningList = await db
          .select({
            id: rekening_kas.id,
            kode: rekening_kas.kode,
            nama: rekening_kas.nama,
            jenis: rekening_kas.jenis,
            saldo: rekening_kas.saldo,
            id_cabang: rekening_kas.id_cabang,
            nama_cabang: cabang.nama_cabang,
          })
          .from(rekening_kas)
          .leftJoin(cabang, eq(rekening_kas.id_cabang, cabang.id_cabang))
          .where(and(...kasConditions))
          .orderBy(rekening_kas.nama);

        return { totalSaldoKasBank, rekeningList: rekeningList || [] };
      } catch (err: any) {
        console.error("⚠️ [Dashboard] Error in fetchKas:", err.cause || err.message);
        return { totalSaldoKasBank: 0, rekeningList: [] };
      }
    };

    // ----------------------------------------------------
    // C. Task: REMINDER HUTANG SUPPLIER (AP)
    // ----------------------------------------------------
    const fetchHutang = async () => {
      try {
        const hutangConditions = [
          sql`${faktur_beli.status_pembayaran} NOT IN ('Lunas', 'Dibatalkan')`,
        ];
        if (idCabangFilter !== null) {
          hutangConditions.push(eq(faktur_beli.id_cabang, idCabangFilter));
        }

        const [hutangResult] = await db
          .select({
            totalHutang: sql<number>`COALESCE(SUM(${faktur_beli.total_faktur}), 0)::int`,
            countHutang: sql<number>`COUNT(*)::int`,
          })
          .from(faktur_beli)
          .where(and(...hutangConditions));

        return {
          hutangJatuhTempo: Number(hutangResult?.totalHutang || 0),
          hutangCount: Number(hutangResult?.countHutang || 0),
        };
      } catch (err: any) {
        console.error("⚠️ [Dashboard] Error in fetchHutang:", err.cause || err.message);
        return { hutangJatuhTempo: 0, hutangCount: 0 };
      }
    };

    // ----------------------------------------------------
    // D. Task: SALES & CASH FLOW TREND (7 Hari Terakhir)
    // ----------------------------------------------------
    const fetchTrends = async () => {
      try {
        const trendPastDate = new Date(now);
        trendPastDate.setDate(now.getDate() - 6);
        const trendStartStr = trendPastDate.toISOString().slice(0, 10);

        const trendSalesCond = [
          gte(penjualan.tanggal_invoice, trendStartStr),
          lte(penjualan.tanggal_invoice, todayStr),
        ];
        if (idCabangFilter !== null) {
          trendSalesCond.push(eq(penjualan.id_cabang, idCabangFilter));
        }

        const dailySales = await db
          .select({
            tanggal: penjualan.tanggal_invoice,
            omzet: sql<number>`COALESCE(SUM(${penjualan.total_akhir}), 0)::int`,
            transaksi: sql<number>`COUNT(*)::int`,
          })
          .from(penjualan)
          .where(and(...trendSalesCond))
          .groupBy(penjualan.tanggal_invoice);

        const salesMap = new Map(dailySales.map((s) => [s.tanggal, s]));

        // Mutasi Kas Masuk & Keluar Harian
        const trendKasCond = [
          gte(kas_transaksi.tanggal, trendStartStr),
          lte(kas_transaksi.tanggal, todayStr),
        ];
        if (idCabangFilter !== null) {
          trendKasCond.push(eq(kas_transaksi.id_cabang, idCabangFilter));
        }

        const dailyKas = await db
          .select({
            tanggal: kas_transaksi.tanggal,
            tipe: kas_transaksi.tipe,
            total: sql<number>`COALESCE(SUM(${kas_transaksi.nominal}), 0)::int`,
          })
          .from(kas_transaksi)
          .where(and(...trendKasCond))
          .groupBy(kas_transaksi.tanggal, kas_transaksi.tipe);

        const kasMap = new Map<string, { masuk: number; keluar: number }>();
        for (const k of dailyKas) {
          const entry = kasMap.get(k.tanggal) || { masuk: 0, keluar: 0 };
          if (k.tipe === "MASUK") entry.masuk += Number(k.total);
          if (k.tipe === "KELUAR") entry.keluar += Number(k.total);
          kasMap.set(k.tanggal, entry);
        }

        const salesTrend = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          const dayName = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "numeric" });
          const sale = salesMap.get(dateStr);
          const kas = kasMap.get(dateStr) || { masuk: 0, keluar: 0 };

          salesTrend.push({
            date: dateStr,
            label: dayName,
            omzet: Number(sale?.omzet || 0),
            transaksi: Number(sale?.transaksi || 0),
            kasMasuk: kas.masuk,
            kasKeluar: kas.keluar,
          });
        }
        return salesTrend;
      } catch (err: any) {
        console.error("⚠️ [Dashboard] Error in fetchTrends:", err.cause || err.message);
        return [];
      }
    };

    // ----------------------------------------------------
    // E. Task: LEADERBOARD PERFORMA CABANG (TOP 3 & BOTTOM 3)
    // ----------------------------------------------------
    const fetchLeaderboard = async () => {
      try {
        const allCabangs = await db
          .select({
            id_cabang: cabang.id_cabang,
            nama_cabang: cabang.nama_cabang,
          })
          .from(cabang)
          .orderBy(cabang.nama_cabang);

        const leaderboardSales = await db
          .select({
            id_cabang: penjualan.id_cabang,
            omzet: sql<number>`COALESCE(SUM(${penjualan.total_akhir}), 0)::int`,
            transaksi: sql<number>`COUNT(*)::int`,
          })
          .from(penjualan)
          .where(and(gte(penjualan.tanggal_invoice, startDate), lte(penjualan.tanggal_invoice, endDate)))
          .groupBy(penjualan.id_cabang);

        const salesMap = new Map(leaderboardSales.map((s) => [s.id_cabang, s]));
        const totalAllCabangOmzet = leaderboardSales.reduce((acc, curr) => acc + Number(curr.omzet), 0);

        const mapped = allCabangs.map((c) => {
          const s = salesMap.get(c.id_cabang);
          const omzet = Number(s?.omzet || 0);
          const transaksi = Number(s?.transaksi || 0);
          const persen =
            totalAllCabangOmzet > 0
              ? Number(((omzet / totalAllCabangOmzet) * 100).toFixed(1))
              : 0;
          return {
            id_cabang: c.id_cabang,
            nama_cabang: c.nama_cabang,
            omzet,
            transaksi,
            persen,
          };
        });

        mapped.sort((a, b) => b.omzet - a.omzet);

        const top3 = mapped.slice(0, 3);
        const bottom3 = mapped.length > 3 ? [...mapped.slice(-3)].reverse() : [];

        return {
          all: mapped,
          top3,
          bottom3,
        };
      } catch (err: any) {
        console.error("⚠️ [Dashboard] Error in fetchLeaderboard:", err.cause || err.message);
        return { all: [], top3: [], bottom3: [] };
      }
    };

    // ----------------------------------------------------
    // F. Task: STOK KRITIS & STOK HABIS (ACTIONABLE HUB)
    // ----------------------------------------------------
    const fetchStokKritis = async () => {
      try {
        const stockConditions = [
          sql`(COALESCE(${stok_barang.stok_akhir}, 0) <= COALESCE(${stok_barang.minimal_stok}, 5) OR COALESCE(${stok_barang.stok_akhir}, 0) <= 0)`,
        ];
        if (idCabangFilter !== null) {
          stockConditions.push(eq(stok_barang.id_cabang, idCabangFilter));
        }

        const stokKritisRaw = await db
          .select({
            id_barang: stok_barang.id_barang,
            kode_barang: barang.kode_barang,
            nama_barang: barang.nama_barang,
            satuan: barang.satuan_1,
            id_cabang: stok_barang.id_cabang,
            nama_cabang: cabang.nama_cabang,
            stok_akhir: stok_barang.stok_akhir,
            minimal_stok: stok_barang.minimal_stok,
          })
          .from(stok_barang)
          .innerJoin(barang, eq(stok_barang.id_barang, barang.id_barang))
          .leftJoin(cabang, eq(stok_barang.id_cabang, cabang.id_cabang))
          .where(and(...stockConditions))
          .orderBy(stok_barang.stok_akhir)
          .limit(10);

        return stokKritisRaw.map((s) => ({
          ...s,
          satuan: s.satuan || "Pcs",
          nama_cabang: s.nama_cabang || "Gudang Utama",
          status: Number(s.stok_akhir || 0) <= 0 ? "HABIS" : "KRITIS",
        }));
      } catch (err: any) {
        console.error("⚠️ [Dashboard] Error in fetchStokKritis:", err.cause || err.message);
        return [];
      }
    };

    // ----------------------------------------------------
    // G. Task: PERINGATAN BATCH EXPIRED DATE (FEFO)
    // ----------------------------------------------------
    const fetchBatchExpired = async () => {
      try {
        const in60Days = new Date(now);
        in60Days.setDate(now.getDate() + 60);
        const in60DaysStr = in60Days.toISOString().slice(0, 10);

        const batchConditions = [
          sql`${barang_batch.stok_batch} > 0`,
          lte(barang_batch.tanggal_kadaluarsa, in60DaysStr),
        ];
        if (idCabangFilter !== null) {
          batchConditions.push(eq(barang_batch.id_cabang, idCabangFilter));
        }

        const batchExpiredRaw = await db
          .select({
            id_batch: barang_batch.id_batch,
            nomor_batch: barang_batch.nomor_batch,
            id_barang: barang_batch.id_barang,
            nama_barang: barang.nama_barang,
            id_cabang: barang_batch.id_cabang,
            nama_cabang: cabang.nama_cabang,
            stok_batch: barang_batch.stok_batch,
            tanggal_kadaluarsa: barang_batch.tanggal_kadaluarsa,
          })
          .from(barang_batch)
          .innerJoin(barang, eq(barang_batch.id_barang, barang.id_barang))
          .leftJoin(cabang, eq(barang_batch.id_cabang, cabang.id_cabang))
          .where(and(...batchConditions))
          .orderBy(barang_batch.tanggal_kadaluarsa)
          .limit(8);

        return batchExpiredRaw.map((b) => {
          const expDate = new Date(b.tanggal_kadaluarsa);
          const diffMs = expDate.getTime() - now.getTime();
          const sisaHari = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          return {
            ...b,
            nama_cabang: b.nama_cabang || "-",
            sisa_hari: sisaHari,
            status: sisaHari <= 0 ? "KADALUARSA" : sisaHari <= 14 ? "KRITIS" : "PERHATIAN",
          };
        });
      } catch (err: any) {
        console.error("⚠️ [Dashboard] Error in fetchBatchExpired:", err.cause || err.message);
        return [];
      }
    };

    // ----------------------------------------------------
    // H. Task: STATUS SHIFT KASIR & UANG LACI
    // ----------------------------------------------------
    const fetchKasirShift = async () => {
      try {
        const shiftConditions = [eq(kasir_shift.status, "OPEN")];
        if (idCabangFilter !== null) {
          shiftConditions.push(eq(kasir_shift.id_cabang, idCabangFilter));
        }

        const shiftListRaw = await db
          .select({
            id: kasir_shift.id,
            id_kasir: kasir_shift.id_kasir,
            nama_kasir: users.nama_user,
            id_cabang: kasir_shift.id_cabang,
            nama_cabang: cabang.nama_cabang,
            nama_rekening: rekening_kas.nama,
            waktu_buka: kasir_shift.waktu_buka,
            saldo_awal: kasir_shift.saldo_awal,
            total_tunai: kasir_shift.total_tunai,
            total_transfer: kasir_shift.total_transfer,
            total_sistem: kasir_shift.total_sistem,
          })
          .from(kasir_shift)
          .innerJoin(users, eq(kasir_shift.id_kasir, users.id))
          .leftJoin(cabang, eq(kasir_shift.id_cabang, cabang.id_cabang))
          .leftJoin(rekening_kas, eq(kasir_shift.id_rekening, rekening_kas.id))
          .where(and(...shiftConditions));

        return shiftListRaw.map((s) => ({
          ...s,
          saldo_laci_saat_ini: Number(s.saldo_awal || 0) + Number(s.total_tunai || 0),
        }));
      } catch (err: any) {
        console.error("⚠️ [Dashboard] Error in fetchKasirShift:", err.cause || err.message);
        return [];
      }
    };

    // ----------------------------------------------------
    // I. Task: TRACKING SURAT JALAN & PENGIRIMAN DC
    // ----------------------------------------------------
    const fetchSuratJalan = async () => {
      try {
        const cSrc = alias(cabang, "c_src");
        const cDest = alias(cabang, "c_dest");

        const sjConditions = [
          sql`${pengiriman.status} NOT IN ('Diterima Lengkap', 'Selesai', 'Batal')`,
        ];
        if (idCabangFilter !== null) {
          sjConditions.push(
            sql`(${pengiriman.id_cabang_sumber} = ${idCabangFilter} OR ${pengiriman.id_cabang_tujuan} = ${idCabangFilter})`
          );
        }

        return await db
          .select({
            id_pengiriman: pengiriman.id_pengiriman,
            kode_pengiriman: pengiriman.kode_pengiriman,
            id_cabang_sumber: pengiriman.id_cabang_sumber,
            nama_cabang_sumber: cSrc.nama_cabang,
            id_cabang_tujuan: pengiriman.id_cabang_tujuan,
            nama_cabang_tujuan: cDest.nama_cabang,
            driver: pengiriman.driver,
            armada: pengiriman.armada,
            status: pengiriman.status,
            tanggal_kirim: pengiriman.tanggal_kirim,
          })
          .from(pengiriman)
          .leftJoin(cSrc, eq(pengiriman.id_cabang_sumber, cSrc.id_cabang))
          .leftJoin(cDest, eq(pengiriman.id_cabang_tujuan, cDest.id_cabang))
          .where(and(...sjConditions))
          .orderBy(desc(pengiriman.id_pengiriman))
          .limit(6);
      } catch (err: any) {
        console.error("⚠️ [Dashboard] Error in fetchSuratJalan:", err.cause || err.message);
        return [];
      }
    };

    // ----------------------------------------------------
    // J. Task: PRESENSI & KEHADIRAN ABDI HARI INI
    // ----------------------------------------------------
    const fetchHrdStats = async () => {
      try {
        const userConditions = [sql`status != 'Non-Aktif'`];
        if (idCabangFilter !== null) {
          userConditions.push(eq(users.id_cabang, idCabangFilter));
        }

        const [totalUsersRes] = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(and(...userConditions));

        const totalKaryawan = Number(totalUsersRes?.count || 0);

        const absensiCond = [
          eq(absensi.tanggal, todayStr),
          eq(absensi.jenis, "masuk"),
        ];

        let hadirHariIniRes;
        if (idCabangFilter !== null) {
          [hadirHariIniRes] = await db
            .select({ count: sql<number>`count(distinct ${absensi.user_id})` })
            .from(absensi)
            .innerJoin(users, eq(absensi.user_id, users.id))
            .where(and(...absensiCond, eq(users.id_cabang, idCabangFilter)));
        } else {
          [hadirHariIniRes] = await db
            .select({ count: sql<number>`count(distinct ${absensi.user_id})` })
            .from(absensi)
            .where(and(...absensiCond));
        }

        const hadirCount = Number(hadirHariIniRes?.count || 0);
        const persentaseHadir =
          totalKaryawan > 0 ? Math.round((hadirCount / totalKaryawan) * 100) : 0;

        return {
          totalKaryawan,
          hadirCount,
          persentaseHadir,
        };
      } catch (err: any) {
        console.error("⚠️ [Dashboard] Error in fetchHrdStats:", err.cause || err.message);
        return { totalKaryawan: 0, hadirCount: 0, persentaseHadir: 0 };
      }
    };

    // Parallel aggregate execution: Runs all queries concurrently for ultra-fast response
    const [
      kpiData,
      kasData,
      hutangData,
      salesTrend,
      leaderboardData,
      stokKritis,
      batchExpired,
      kasirShiftAktif,
      suratJalanList,
      hrdStats,
      growthStats,
    ] = await Promise.all([
      fetchSalesKpi(),
      fetchKas(),
      fetchHutang(),
      fetchTrends(),
      fetchLeaderboard(),
      fetchStokKritis(),
      fetchBatchExpired(),
      fetchKasirShift(),
      fetchSuratJalan(),
      fetchHrdStats(),
      fetchGrowthStats("monthly"),
    ]);

    return c.json({
      success: true,
      data: {
        kpi: {
          ...kpiData,
          totalSaldoKasBank: kasData.totalSaldoKasBank,
          hutangJatuhTempo: hutangData.hutangJatuhTempo,
          hutangCount: hutangData.hutangCount,
        },
        salesTrend,
        cabangLeaderboard: leaderboardData.all,
        top3Cabang: leaderboardData.top3,
        bottom3Cabang: leaderboardData.bottom3,
        growthStats,
        rekeningList: kasData.rekeningList,
        stokKritis,
        batchExpired,
        kasirShiftAktif,
        suratJalanList,
        hrdStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("💥 Critical error in GET /api/dashboard/stats:", error.cause || error.message);
    return c.json(
      {
        success: false,
        error: "Gagal memuat statistik dashboard. Silakan refresh halaman.",
      },
      500
    );
  }
});

// ==========================================
// 1b. GET /api/dashboard/growth
// Dynamic growth statistics with custom granularity
// ==========================================
dashboardRoutes.get("/growth", async (c) => {
  try {
    const granularity = c.req.query("granularity") || "monthly";
    const data = await fetchGrowthStats(granularity);
    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/growth:", error);
    return c.json({ success: false, error: "Gagal memuat analitik pertumbuhan" }, 500);
  }
});

// ==========================================
// 2. GET /api/dashboard/preferences
// Load saved user widget customization
// ==========================================
dashboardRoutes.get("/preferences", async (c) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [pref] = await db
      .select()
      .from(user_dashboard_preferences)
      .where(eq(user_dashboard_preferences.id_user, user.id))
      .limit(1);

    if (!pref) {
      return c.json({ success: true, data: null });
    }

    let parsedConfig = [];
    try {
      parsedConfig = JSON.parse(pref.layout_config);
    } catch {
      parsedConfig = [];
    }

    return c.json({
      success: true,
      data: {
        layout_config: parsedConfig,
        last_preset: pref.last_preset,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/dashboard/preferences:", error.cause || error.message);
    return c.json({ success: false, error: "Gagal memuat preferensi dashboard" }, 500);
  }
});

// ==========================================
// 3. POST /api/dashboard/preferences
// Save user widget customization
// ==========================================
dashboardRoutes.post("/preferences", async (c) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { layout_config, last_preset } = body;

    if (!Array.isArray(layout_config)) {
      return c.json({ error: "layout_config harus berupa array" }, 400);
    }

    const configStr = JSON.stringify(layout_config);

    const [existing] = await db
      .select()
      .from(user_dashboard_preferences)
      .where(eq(user_dashboard_preferences.id_user, user.id))
      .limit(1);

    if (existing) {
      await db
        .update(user_dashboard_preferences)
        .set({
          layout_config: configStr,
          last_preset: last_preset || "CUSTOM",
          updated_at: sql`CURRENT_TIMESTAMP::text`,
        })
        .where(eq(user_dashboard_preferences.id_user, user.id));
    } else {
      await db.insert(user_dashboard_preferences).values({
        id_user: user.id,
        layout_config: configStr,
        last_preset: last_preset || "CUSTOM",
      });
    }

    return c.json({
      success: true,
      message: "Preferensi dashboard berhasil disimpan",
    });
  } catch (error: any) {
    console.error("Error in POST /api/dashboard/preferences:", error.cause || error.message);
    return c.json({ success: false, error: "Gagal menyimpan preferensi dashboard" }, 500);
  }
});

// ==========================================
// 4. POST /api/dashboard/preferences/reset
// Reset to role preset default
// ==========================================
dashboardRoutes.post("/preferences/reset", async (c) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await db
      .delete(user_dashboard_preferences)
      .where(eq(user_dashboard_preferences.id_user, user.id));

    return c.json({
      success: true,
      message: "Preferensi dashboard berhasil direset ke bawaan peran",
    });
  } catch (error: any) {
    console.error("Error in POST /api/dashboard/preferences/reset:", error.cause || error.message);
    return c.json({ success: false, error: "Gagal mereset preferensi dashboard" }, 500);
  }
});
