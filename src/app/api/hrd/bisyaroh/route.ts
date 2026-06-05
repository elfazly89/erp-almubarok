import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, jabatan, cabang, absensi, hutang_karyawan, bisyaroh, jurnal_umum, daftar_gaji_jabatan } from "@/lib/db/schema";
import { eq, and, like, sql } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/session";
import { getErrorMessage } from "@/lib/utils";

// Helper to convert HH:mm:ss to decimal hours
function timeToHours(timeStr: string | null | undefined): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0]) || 0;
  const m = parseInt(parts[1]) || 0;
  const s = parseInt(parts[2]) || 0;
  return h + m / 60 + s / 3600;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bulan = parseInt(searchParams.get("bulan") || String(new Date().getMonth() + 1));
    const tahun = parseInt(searchParams.get("tahun") || String(new Date().getFullYear()));

    const monthStr = `${tahun}-${String(bulan).padStart(2, "0")}`;

    // 1. Fetch all users left-joined with job titles, branches, and salary configuration
    const userList = await db
      .select({
        id: users.id,
        kode_user: users.kode_user,
        nama_user: users.nama_user,
        status: users.status,
        id_jabatan: users.id_jabatan,
        jabatan: jabatan.jabatan,
        id_cabang: users.id_cabang,
        nama_cabang: cabang.nama_cabang,
      })
      .from(users)
      .leftJoin(jabatan, eq(users.id_jabatan, jabatan.id_jabatan))
      .leftJoin(cabang, eq(users.id_cabang, cabang.id_cabang))
      .where(sql`${users.status} != 'Non-Aktif'`)
      .orderBy(users.nama_user);

    // Fetch the salary configuration mappings directly
    const salaryConfigs = await db.select().from(daftar_gaji_jabatan);
    const salaryMap = new Map();
    salaryConfigs.forEach((c: any) => {
      salaryMap.set(c.id_jabatan, c);
    });

    // 2. Fetch all attendance logs for the target month
    const absLogs = await db
      .select()
      .from(absensi)
      .where(like(absensi.tanggal, `${monthStr}-%`));

    // 3. Fetch active loans (hutang_karyawan)
    const activeLoans = await db
      .select()
      .from(hutang_karyawan)
      .where(eq(hutang_karyawan.status, "aktif"));

    const loanMap = new Map<number, number>();
    activeLoans.forEach((loan) => {
      const current = loanMap.get(loan.user_id) || 0;
      loanMap.set(loan.user_id, current + loan.nominal);
    });

    // 4. Fetch already processed salaries for the target month
    const processed = await db
      .select()
      .from(bisyaroh)
      .where(and(eq(bisyaroh.bulan, bulan), eq(bisyaroh.tahun, tahun)));

    const processedMap = new Map<number, any>();
    processed.forEach((item) => {
      processedMap.set(item.user_id, item);
    });

    // 5. Compute in-memory calculations for each user
    const finalData = userList.map((user) => {
      const config = salaryMap.get(user.id_jabatan) || {
        gaji_pokok: 0,
        gaji_per_jam: 0,
        lembur_per_jam: 0,
      };

      // Filter absensi for this user
      const userLogs = absLogs.filter((log) => log.user_id === user.id);

      // Group logs by date
      const logsByDate = new Map<string, typeof userLogs>();
      userLogs.forEach((log) => {
        const list = logsByDate.get(log.tanggal) || [];
        list.push(log);
        logsByDate.set(log.tanggal, list);
      });

      let totalJamKerja = 0;
      let totalJamLembur = 0;
      let hariKerja = 0;

      logsByDate.forEach((dayLogs, date) => {
        const masuk = dayLogs.find((l) => l.jenis === "masuk");
        const pulang = dayLogs.find((l) => l.jenis === "pulang");
        const istirahatKeluar = dayLogs.find((l) => l.jenis === "istirahat_keluar");
        const istirahatMasuk = dayLogs.find((l) => l.jenis === "istirahat_masuk");
        const lemburMulai = dayLogs.find((l) => l.jenis === "lembur_mulai");
        const lemburSelesai = dayLogs.find((l) => l.jenis === "lembur_selesai");

        if (masuk) {
          hariKerja++;
          let hours = 0;
          if (pulang) {
            hours = timeToHours(pulang.jam) - timeToHours(masuk.jam);
            if (istirahatKeluar && istirahatMasuk) {
              const breakHours = timeToHours(istirahatMasuk.jam) - timeToHours(istirahatKeluar.jam);
              hours = Math.max(0, hours - breakHours);
            }
          } else {
            // Fallback to standard 8 hours if they clocked in but forgot to checkout
            hours = 8;
          }
          totalJamKerja += Math.max(0, hours);
        }

        if (lemburMulai && lemburSelesai) {
          const lemburHours = timeToHours(lemburSelesai.jam) - timeToHours(lemburMulai.jam);
          totalJamLembur += Math.max(0, lemburHours);
        }
      });

      // Round hours
      totalJamKerja = Math.round(totalJamKerja * 100) / 100;
      totalJamLembur = Math.round(totalJamLembur * 100) / 100;

      // Check if already processed
      const savedPayroll = processedMap.get(user.id);

      const outstandingLoan = loanMap.get(user.id) || 0;

      if (savedPayroll) {
        // Still compute live values from absensi for comparison/recalculation
        const liveGajiPokok = config.gaji_pokok || 0;
        const liveGajiPerJam = config.gaji_per_jam || 0;
        const liveLemburPerJam = config.lembur_per_jam || 0;
        const liveGajiKehadiran = Math.round(totalJamKerja * liveGajiPerJam);
        const liveGajiLembur = Math.round(totalJamLembur * liveLemburPerJam);
        const liveTotalDiterima = liveGajiPokok + liveGajiKehadiran + liveGajiLembur;

        return {
          id: user.id,
          kode_user: user.kode_user,
          nama_user: user.nama_user,
          jabatan: user.jabatan,
          id_cabang: user.id_cabang,
          nama_cabang: user.nama_cabang,
          outstanding_loan: outstandingLoan,
          payroll_status: "Lunas",
          gaji_pokok: savedPayroll.gaji_pokok,
          gaji_per_jam: savedPayroll.gaji_per_jam,
          lembur_per_jam: savedPayroll.lembur_per_jam,
          hari_kerja: savedPayroll.hari_kerja,
          total_jam_kerja: savedPayroll.total_jam_kerja,
          total_jam_lembur: savedPayroll.total_jam_lembur,
          gaji_kehadiran: savedPayroll.gaji_kehadiran,
          gaji_lembur: savedPayroll.gaji_lembur,
          tunjangan: savedPayroll.tunjangan,
          potongan: savedPayroll.potongan,
          total_diterima: savedPayroll.total_diterima,
          tanggal_bayar: savedPayroll.tanggal_bayar,
          catatan: savedPayroll.catatan,
          bisyaroh_id: savedPayroll.id,
          // Live data from current absensi (for recalculation comparison)
          live_hari_kerja: hariKerja,
          live_jam_kerja: totalJamKerja,
          live_jam_lembur: totalJamLembur,
          live_gaji_pokok: liveGajiPokok,
          live_gaji_per_jam: liveGajiPerJam,
          live_lembur_per_jam: liveLemburPerJam,
          live_gaji_kehadiran: liveGajiKehadiran,
          live_gaji_lembur: liveGajiLembur,
          live_total_diterima: liveTotalDiterima,
          has_changes: (
            hariKerja !== savedPayroll.hari_kerja ||
            totalJamKerja !== savedPayroll.total_jam_kerja ||
            totalJamLembur !== savedPayroll.total_jam_lembur ||
            liveGajiPokok !== savedPayroll.gaji_pokok ||
            liveGajiPerJam !== savedPayroll.gaji_per_jam ||
            liveLemburPerJam !== savedPayroll.lembur_per_jam
          ),
        };
      }

      // Prefill calculation
      const gajiPokok = config.gaji_pokok || 0;
      const gajiPerJam = config.gaji_per_jam || 0;
      const lemburPerJam = config.lembur_per_jam || 0;
      
      const gajiKehadiran = Math.round(totalJamKerja * gajiPerJam);
      const gajiLembur = Math.round(totalJamLembur * lemburPerJam);
      const totalDiterima = gajiPokok + gajiKehadiran + gajiLembur;

      return {
        id: user.id,
        kode_user: user.kode_user,
        nama_user: user.nama_user,
        jabatan: user.jabatan,
        id_cabang: user.id_cabang,
        nama_cabang: user.nama_cabang,
        outstanding_loan: outstandingLoan,
        payroll_status: "Draft",
        gaji_pokok: gajiPokok,
        gaji_per_jam: gajiPerJam,
        lembur_per_jam: lemburPerJam,
        hari_kerja: hariKerja,
        total_jam_kerja: totalJamKerja,
        total_jam_lembur: totalJamLembur,
        gaji_kehadiran: gajiKehadiran,
        gaji_lembur: gajiLembur,
        tunjangan: 0,
        potongan: 0,
        total_diterima: totalDiterima,
        tanggal_bayar: null,
        catatan: `Bisyaroh Abdi ${monthStr}`,
        bisyaroh_id: null,
      };
    });

    return NextResponse.json(finalData);
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memproses kalkulasi bisyaroh", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Sesi Anda telah berakhir, silakan login kembali" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      user_id,
      nama_user,
      id_cabang,
      bulan,
      tahun,
      gaji_pokok,
      gaji_per_jam,
      lembur_per_jam,
      hari_kerja,
      total_jam_kerja,
      total_jam_lembur,
      gaji_kehadiran,
      gaji_lembur,
      tunjangan,
      potongan,
      total_diterima,
      catatan,
      rekening_id, // COA ID to Credit (e.g. Kas Toko = 1, BCA = 4)
      potong_hutang_nominal, // amount from potongan that is used to repay debt
    } = body;

    if (!user_id || !bulan || !tahun || !rekening_id) {
      return NextResponse.json(
        { error: "Parameter transaksi tidak lengkap" },
        { status: 400 }
      );
    }

    const cabangId = parseInt(id_cabang) || 8; // Default to Sukosari (ID 8) if missing

    db.transaction((tx) => {
      // 1. Check if payroll record already exists
      const existing = tx
        .select()
        .from(bisyaroh)
        .where(and(eq(bisyaroh.user_id, user_id), eq(bisyaroh.bulan, bulan), eq(bisyaroh.tahun, tahun)))
        .limit(1)
        .all();

      const payrollValues = {
        user_id,
        bulan,
        tahun,
        gaji_pokok: parseInt(gaji_pokok) || 0,
        gaji_per_jam: parseInt(gaji_per_jam) || 0,
        lembur_per_jam: parseInt(lembur_per_jam) || 0,
        hari_kerja: parseInt(hari_kerja) || 0,
        total_jam_kerja: parseFloat(total_jam_kerja) || 0,
        total_jam_lembur: parseFloat(total_jam_lembur) || 0,
        gaji_kehadiran: parseInt(gaji_kehadiran) || 0,
        gaji_lembur: parseInt(gaji_lembur) || 0,
        tunjangan: parseInt(tunjangan) || 0,
        potongan: parseInt(potongan) || 0,
        total_diterima: parseInt(total_diterima) || 0,
        status: "Lunas" as const,
        tanggal_bayar: new Date().toISOString().split("T")[0],
        catatan,
        updated_at: new Date().toISOString(),
      };

      if (existing.length > 0) {
        tx
          .update(bisyaroh)
          .set(payrollValues)
          .where(eq(bisyaroh.id, existing[0].id))
          .run();
      } else {
        tx.insert(bisyaroh).values(payrollValues).run();
      }

      // 2. Handle Loan Repayment if any
      const debtAmount = parseInt(potong_hutang_nominal) || 0;
      if (debtAmount > 0) {
        let remainingToDeduct = debtAmount;
        const activeLoans = tx
          .select()
          .from(hutang_karyawan)
          .where(and(eq(hutang_karyawan.user_id, user_id), eq(hutang_karyawan.status, "aktif")))
          .orderBy(hutang_karyawan.tanggal)
          .all();

        for (const loan of activeLoans) {
          if (remainingToDeduct <= 0) break;
          if (loan.nominal <= remainingToDeduct) {
            remainingToDeduct -= loan.nominal;
            tx
              .update(hutang_karyawan)
              .set({ status: "lunas", nominal: 0 })
              .where(eq(hutang_karyawan.id, loan.id))
              .run();
          } else {
            const newNominal = loan.nominal - remainingToDeduct;
            remainingToDeduct = 0;
            tx
              .update(hutang_karyawan)
              .set({ nominal: newNominal })
              .where(eq(hutang_karyawan.id, loan.id))
              .run();
          }
        }
      }

      // 3. Write accounting General Journal Entry (balanced debit/credit)
      const refCode = `BYS-${user_id}-${tahun}-${String(bulan).padStart(2, "0")}`;
      
      // Delete old journal for this period/user if re-processing
      tx
        .delete(jurnal_umum)
        .where(eq(jurnal_umum.no_referensi_bukti, refCode))
        .run();

      const todayStr = new Date().toISOString().split("T")[0];

      // Debit Entry: Beban Gaji Karyawan (COA ID 37)
      tx.insert(jurnal_umum).values({
        tanggal_transaksi: todayStr,
        no_referensi_bukti: refCode,
        deskripsi: `Beban Gaji Abdi: ${nama_user} (Periode ${bulan}/${tahun})`,
        akun_id: 37, // Beban Gaji Karyawan
        cabang_id: cabangId,
        debit: parseInt(total_diterima) || 0,
        kredit: 0,
        dibuat_oleh: session.id,
      }).run();

      // Credit Entry: Selected Cash/Bank Account
      tx.insert(jurnal_umum).values({
        tanggal_transaksi: todayStr,
        no_referensi_bukti: refCode,
        deskripsi: `Pembayaran Gaji Abdi: ${nama_user} (Periode ${bulan}/${tahun})`,
        akun_id: parseInt(rekening_id), // Selected Bank/Cash COA
        cabang_id: cabangId,
        debit: 0,
        kredit: parseInt(total_diterima) || 0,
        dibuat_oleh: session.id,
      }).run();
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memproses transaksi bisyaroh", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
