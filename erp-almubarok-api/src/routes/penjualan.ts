import { Hono } from "hono";
import { db } from "../lib/db";
import {
  penjualan,
  penjualan_detail,
  stok_barang,
  pelanggan,
  riwayat_poin,
  infaq,
  vouchers,
  promo,
  rekening_kas,
  kas_transaksi,
  kasir_shift,
  jurnal_umum,
  pengaturan_aplikasi,
  kartu_stok,
  barang_batch,
  barang,
  users,
  cabang,
  daftar_akun
} from "../lib/db/schema";
import { eq, and, like, desc, asc, gt, gte, lte, or, sql } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";

export const penjualanRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// ==========================================
// 1. GET TRANSACTION HISTORY & SUMMARY
// ==========================================
penjualanRoutes.get("/summary", async (c) => {
  const user = c.get("user");
  const userJabatan = user.id_jabatan || 0;
  const isMultiBranch = [1, 2, 4, 8, 11].includes(userJabatan);

  const queryCabang = c.req.query("id_cabang");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const idKasir = c.req.query("id_kasir");
  const jenisPembayaran = c.req.query("jenis_pembayaran");
  const search = c.req.query("search");

  const conditions = [];

  // Cabang filter
  if (isMultiBranch && queryCabang && queryCabang !== "all") {
    conditions.push(eq(penjualan.id_cabang, parseInt(queryCabang)));
  } else if (!isMultiBranch || !queryCabang || queryCabang !== "all") {
    if (user.id_cabang) {
      conditions.push(eq(penjualan.id_cabang, user.id_cabang));
    }
  }

  // Date filters
  if (startDate) conditions.push(gte(penjualan.tanggal_invoice, startDate));
  if (endDate) conditions.push(lte(penjualan.tanggal_invoice, endDate));

  // Kasir filter
  if (idKasir && idKasir !== "all") {
    conditions.push(eq(penjualan.id_user, parseInt(idKasir)));
  }

  // Payment method filter
  if (jenisPembayaran && jenisPembayaran !== "all") {
    if (jenisPembayaran === "Non-Tunai") {
      conditions.push(sql`${penjualan.jenis_pembayaran} != 'Tunai'`);
    } else {
      conditions.push(eq(penjualan.jenis_pembayaran, jenisPembayaran));
    }
  }

  // Search filter
  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${penjualan.no_invoice})`, term),
        like(sql`lower(${penjualan.nama_pelanggan})`, term)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [summary] = await db
    .select({
      total_nota: sql<number>`count(*)`,
      total_bruto: sql<number>`coalesce(sum(${penjualan.subtotal}), 0)`,
      total_diskon: sql<number>`coalesce(sum(${penjualan.diskon} + ${penjualan.nominal_voucher} + ${penjualan.potongan_poin}), 0)`,
      total_infaq: sql<number>`coalesce(sum(${penjualan.infaq}), 0)`,
      total_bersih: sql<number>`coalesce(sum(${penjualan.total_akhir}), 0)`,
      omset_tunai: sql<number>`coalesce(sum(case when ${penjualan.jenis_pembayaran} = 'Tunai' then ${penjualan.total_akhir} else 0 end), 0)`,
      omset_non_tunai: sql<number>`coalesce(sum(case when ${penjualan.jenis_pembayaran} != 'Tunai' then ${penjualan.total_akhir} else 0 end), 0)`,
    })
    .from(penjualan)
    .where(whereClause);

  return c.json({ success: true, data: summary || {} });
});

penjualanRoutes.get("/", async (c) => {
  const user = c.get("user");
  const userJabatan = user.id_jabatan || 0;
  const isMultiBranch = [1, 2, 4, 8, 11].includes(userJabatan);
  const idInvoice = c.req.query("id");

  // If a specific ID is requested, return invoice details + kas & journal details
  if (idInvoice) {
    const [invoice] = await db
      .select({
        id_penjualan: penjualan.id_penjualan,
        no_invoice: penjualan.no_invoice,
        tanggal_invoice: penjualan.tanggal_invoice,
        jam_invoice: penjualan.jam_invoice,
        id_pelanggan: penjualan.id_pelanggan,
        nama_pelanggan: penjualan.nama_pelanggan,
        id_user: penjualan.id_user,
        nama_kasir: users.nama_user,
        id_cabang: penjualan.id_cabang,
        nama_cabang: cabang.nama_cabang,
        subtotal: penjualan.subtotal,
        diskon: penjualan.diskon,
        nominal_voucher: penjualan.nominal_voucher,
        potongan_poin: penjualan.potongan_poin,
        infaq: penjualan.infaq,
        total_akhir: penjualan.total_akhir,
        jenis_pembayaran: penjualan.jenis_pembayaran,
        jumlah_bayar: penjualan.jumlah_bayar,
        poin_didapat: penjualan.poin_didapat,
        created_at: penjualan.created_at,
      })
      .from(penjualan)
      .leftJoin(users, eq(penjualan.id_user, users.id))
      .leftJoin(cabang, eq(penjualan.id_cabang, cabang.id_cabang))
      .where(eq(penjualan.id_penjualan, parseInt(idInvoice)));

    if (!invoice) {
      return c.json({ error: "Invoice tidak ditemukan" }, 404);
    }

    const details = await db
      .select()
      .from(penjualan_detail)
      .where(eq(penjualan_detail.id_penjualan, invoice.id_penjualan));

    // Get Bukti Kas Transaksi
    const [buktiKas] = await db
      .select({
        nomor_transaksi: kas_transaksi.nomor_transaksi,
        nominal: kas_transaksi.nominal,
        tanggal: kas_transaksi.tanggal,
        rekening_nama: rekening_kas.nama,
      })
      .from(kas_transaksi)
      .leftJoin(rekening_kas, eq(kas_transaksi.id_rekening, rekening_kas.id))
      .where(
        and(
          eq(kas_transaksi.referensi_type, "PENJUALAN"),
          eq(kas_transaksi.referensi_id, invoice.id_penjualan)
        )
      )
      .limit(1);

    // Get Jurnal Entries for this invoice
    const jurnalEntries = buktiKas?.nomor_transaksi
      ? await db
          .select({
            id: jurnal_umum.id,
            deskripsi: jurnal_umum.deskripsi,
            kode_akun: daftar_akun.kode_akun,
            nama_akun: daftar_akun.nama_akun,
            debit: jurnal_umum.debit,
            kredit: jurnal_umum.kredit,
          })
          .from(jurnal_umum)
          .leftJoin(daftar_akun, eq(jurnal_umum.akun_id, daftar_akun.id))
          .where(eq(jurnal_umum.no_referensi_bukti, buktiKas.nomor_transaksi))
      : [];

    return c.json({
      invoice,
      details,
      bukti_kas: buktiKas || null,
      jurnal: jurnalEntries,
    });
  }

  // List query with filters & pagination
  const queryCabang = c.req.query("id_cabang");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");
  const idKasir = c.req.query("id_kasir");
  const jenisPembayaran = c.req.query("jenis_pembayaran");
  const search = c.req.query("search");
  const pageParam = parseInt(c.req.query("page") || "1");
  const limitParam = c.req.query("limit");

  const conditions = [];

  // Cabang filter
  if (isMultiBranch && queryCabang && queryCabang !== "all") {
    conditions.push(eq(penjualan.id_cabang, parseInt(queryCabang)));
  } else if (!isMultiBranch || !queryCabang || queryCabang !== "all") {
    if (user.id_cabang) {
      conditions.push(eq(penjualan.id_cabang, user.id_cabang));
    }
  }

  // Date filters
  if (startDate) conditions.push(gte(penjualan.tanggal_invoice, startDate));
  if (endDate) conditions.push(lte(penjualan.tanggal_invoice, endDate));

  // Kasir filter
  if (idKasir && idKasir !== "all") {
    conditions.push(eq(penjualan.id_user, parseInt(idKasir)));
  }

  // Payment method filter
  if (jenisPembayaran && jenisPembayaran !== "all") {
    if (jenisPembayaran === "Non-Tunai") {
      conditions.push(sql`${penjualan.jenis_pembayaran} != 'Tunai'`);
    } else {
      conditions.push(eq(penjualan.jenis_pembayaran, jenisPembayaran));
    }
  }

  // Search filter
  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${penjualan.no_invoice})`, term),
        like(sql`lower(${penjualan.nama_pelanggan})`, term)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Pagination calculation
  const isExportAll = limitParam === "all" || limitParam === "-1";
  const limit = isExportAll ? 5000 : Math.max(1, parseInt(limitParam || "50"));
  const offset = isExportAll ? 0 : Math.max(0, (pageParam - 1) * limit);

  // Total count for pagination
  const [countRes] = await db
    .select({ total: sql<number>`count(*)` })
    .from(penjualan)
    .where(whereClause);
  const totalItems = countRes?.total || 0;

  const list = await db
    .select({
      id_penjualan: penjualan.id_penjualan,
      no_invoice: penjualan.no_invoice,
      tanggal_invoice: penjualan.tanggal_invoice,
      jam_invoice: penjualan.jam_invoice,
      id_pelanggan: penjualan.id_pelanggan,
      nama_pelanggan: penjualan.nama_pelanggan,
      id_user: penjualan.id_user,
      nama_kasir: users.nama_user,
      id_cabang: penjualan.id_cabang,
      nama_cabang: cabang.nama_cabang,
      subtotal: penjualan.subtotal,
      diskon: penjualan.diskon,
      nominal_voucher: penjualan.nominal_voucher,
      potongan_poin: penjualan.potongan_poin,
      infaq: penjualan.infaq,
      total_akhir: penjualan.total_akhir,
      jenis_pembayaran: penjualan.jenis_pembayaran,
      jumlah_bayar: penjualan.jumlah_bayar,
      poin_didapat: penjualan.poin_didapat,
      created_at: penjualan.created_at,
    })
    .from(penjualan)
    .leftJoin(users, eq(penjualan.id_user, users.id))
    .leftJoin(cabang, eq(penjualan.id_cabang, cabang.id_cabang))
    .where(whereClause)
    .orderBy(desc(penjualan.id_penjualan))
    .limit(limit)
    .offset(offset);

  if (c.req.query("page") || c.req.query("with_pagination") === "true") {
    return c.json({
      data: list,
      pagination: {
        total: totalItems,
        page: pageParam,
        limit,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  }

  return c.json(list);
});

// ==========================================
// 2. POST POS CHECKOUT (Kasir POS Checkout)
// ==========================================
penjualanRoutes.post("/", async (c) => {
  const user = c.get("user");
  const idCabang = user.id_cabang;
  const idUser = user.id;

  if (!idCabang) {
    return c.json({ error: "Sesi tidak valid atau cabang tidak teridentifikasi" }, 401);
  }

  try {
    const body = await c.req.json();
    const {
      id_pelanggan,
      nama_pelanggan,
      items,
      subtotal,
      diskon,
      nominal_voucher,
      potongan_poin,
      poin_digunakan,
      infaq: nominalInfaq,
      total_akhir,
      jenis_pembayaran,
      jumlah_bayar,
      id_voucher,
      poin_didapat,
    } = body;

    if (!items || items.length === 0) {
      return c.json({ error: "Keranjang belanja kosong" }, 400);
    }

    // Safe parsing of numbers to avoid NaNs
    const parsedSubtotal = parseInt(subtotal) || 0;
    const parsedDiskon = parseInt(diskon) || 0;
    const parsedNominalVoucher = parseInt(nominal_voucher) || 0;
    const parsedPotonganPoin = parseInt(potongan_poin) || 0;
    const parsedPoinDigunakan = parseInt(poin_digunakan) || 0;
    const parsedInfaq = parseInt(nominalInfaq) || 0;
    const parsedTotalAkhir = parseInt(total_akhir) || 0;
    const parsedJumlahBayar = parseInt(jumlah_bayar) || 0;
    const parsedPoinDidapat = parseInt(poin_didapat) || 0;

    if (parsedTotalAkhir < 0) {
      return c.json({ error: "Total akhir tidak boleh negatif" }, 400);
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const startOfDayStr = today.toISOString().slice(0, 10);

    const transactionResult = await db.transaction(async (tx) => {
      // 0. Acquire advisory lock on branch level to prevent race condition on invoice number generation
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${idCabang})`);

      // Count invoices from today for this branch inside transaction
      const [invCount] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(penjualan)
        .where(
          and(
            eq(penjualan.id_cabang, idCabang),
            like(penjualan.tanggal_invoice, `${startOfDayStr}%`)
          )
        );

      const urutNum = (invCount?.count || 0) + 1;
      const urutStr = String(urutNum).padStart(4, "0");
      const noInvoice = `INV/${dateStr}/${idCabang}/${urutStr}`;

      const formattedDate = startOfDayStr;
      const formattedTime = today.toTimeString().split(" ")[0];

      // 1. Insert header
      const [newInvoice] = await tx
        .insert(penjualan)
        .values({
          no_invoice: noInvoice,
          tanggal_invoice: formattedDate,
          jam_invoice: formattedTime,
          id_pelanggan: id_pelanggan ? parseInt(id_pelanggan) : null,
          nama_pelanggan: nama_pelanggan || "Umum",
          id_user: idUser,
          id_cabang: idCabang,
          subtotal: parsedSubtotal,
          diskon: parsedDiskon,
          nominal_voucher: parsedNominalVoucher,
          potongan_poin: parsedPotonganPoin,
          infaq: parsedInfaq,
          total_akhir: parsedTotalAkhir,
          jenis_pembayaran: jenis_pembayaran || "Tunai",
          jumlah_bayar: parsedJumlahBayar,
          id_voucher: id_voucher ? parseInt(id_voucher) : null,
          poin_didapat: parsedPoinDidapat,
          created_at: today.toISOString(),
        })
        .returning();

      const idPenjualan = newInvoice.id_penjualan;
      let totalHppPOS = 0;

      // 2. Loop through items, insert details, update stocks
      for (const item of items) {
        const idBarang = parseInt(item.id_barang);
        const qty = parseInt(item.jumlah);
        const isiSatuan = parseInt(item.isi_satuan || "1");
        const totalPcs = qty * isiSatuan;
        const hargaJual = parseInt(item.harga_jual) || 0;
        // B7 fix: harga rata saat transaksi must be a unit price (pcs), not multiplied by totalPcs
        const hargaRata = parseInt(item.harga_rata || item.harga_beli || "0") || 0;
        const diskonItem = parseInt(item.diskon) || 0;
        const subtotalItem = parseInt(item.subtotal) || 0;

        totalHppPOS += hargaRata * totalPcs;

        if (isNaN(idBarang) || qty <= 0 || totalPcs <= 0) {
          throw new Error("Item transaksi tidak valid");
        }

        // Insert sale details
        await tx.insert(penjualan_detail).values({
          id_penjualan: idPenjualan,
          id_barang: idBarang,
          nama_barang: item.nama_barang,
          jumlah: qty,
          satuan: item.satuan,
          isi_satuan: isiSatuan,
          harga_jual: hargaJual,
          harga_rata_saat_transaksi: hargaRata,
          diskon: diskonItem,
          subtotal: subtotalItem,
          jenis_item: item.jenis_item || "TRANSAKSI",
        });

        // Cut Stock in stok_barang & Universal Stock Ledger
        const [stockRecord] = await tx
          .select()
          .from(stok_barang)
          .where(and(eq(stok_barang.id_barang, idBarang), eq(stok_barang.id_cabang, idCabang)));

        const saldoAwal = stockRecord ? (stockRecord.stok_akhir || 0) : 0;
        const saldoAkhir = saldoAwal - totalPcs;

        if (stockRecord) {
          await tx
            .update(stok_barang)
            .set({
              stok_akhir: saldoAkhir,
              penjualan: (stockRecord.penjualan || 0) + totalPcs,
            })
            .where(eq(stok_barang.id, stockRecord.id));
        } else {
          // If no record, insert it (starts from negative because sales happened without stock entry)
          await tx.insert(stok_barang).values({
            id_barang: idBarang,
            id_cabang: idCabang,
            stok_akhir: saldoAkhir,
            penjualan: totalPcs,
            posisi_rak: "-",
            minimal_stok: 0,
            maksimal_stok: 100,
          });
        }

        // Catat ke Universal Stock Ledger (kartu_stok)
        const nowLedgerStr = new Date().toISOString().replace("T", " ").substring(0, 19);
        await tx.insert(kartu_stok).values({
          id_barang: idBarang,
          id_cabang: idCabang,
          tanggal_transaksi: nowLedgerStr,
          tipe_transaksi: "PENJUALAN_POS",
          nomor_referensi: newInvoice.no_invoice,
          saldo_awal: saldoAwal,
          masuk: 0,
          keluar: totalPcs,
          saldo_akhir: saldoAkhir,
          hpp_satuan: hargaRata,
          total_nilai: saldoAkhir * hargaRata,
          keterangan: `Penjualan Kasir POS (${newInvoice.no_invoice})`,
          id_user: user.id,
        });

        // Automated FEFO Batch Allocation (jika ada batch aktif)
        try {
          const activeBatches = await tx
            .select()
            .from(barang_batch)
            .where(
              and(
                eq(barang_batch.id_barang, idBarang),
                eq(barang_batch.id_cabang, idCabang),
                eq(barang_batch.status, "AKTIF"),
                gt(barang_batch.stok_batch, 0)
              )
            )
            .orderBy(asc(barang_batch.tanggal_kadaluarsa));

          let remToDeduct = totalPcs;
          for (const b of activeBatches) {
            if (remToDeduct <= 0) break;
            const deductFromBatch = Math.min(b.stok_batch, remToDeduct);
            const newBatchStock = b.stok_batch - deductFromBatch;
            await tx
              .update(barang_batch)
              .set({
                stok_batch: newBatchStock,
                status: newBatchStock <= 0 ? "HABIS" : "AKTIF",
              })
              .where(eq(barang_batch.id_batch, b.id_batch));
            remToDeduct -= deductFromBatch;
          }
        } catch (batchErr) {
          console.warn("Notice: FEFO deduction skipped or non-critical:", batchErr);
        }
      }

      // 3. Update customer points & log point history
      if (id_pelanggan) {
        const customerId = parseInt(id_pelanggan);
        const [customer] = await tx
          .select()
          .from(pelanggan)
          .where(eq(pelanggan.id_pelanggan, customerId));

        if (customer) {
          let updatedPoin = customer.total_poin || 0;

          // Points gained
          if (parsedPoinDidapat > 0) {
            updatedPoin += parsedPoinDidapat;
            await tx.insert(riwayat_poin).values({
              id_pelanggan: customerId,
              jenis_transaksi: "DAPAT",
              jumlah_poin: parsedPoinDidapat,
              keterangan: `Poin didapat dari transaksi invoice ${noInvoice}`,
              id_referensi_transaksi: noInvoice,
              waktu: today.toISOString(),
            });
          }

          // Points spent
          if (parsedPoinDigunakan > 0) {
            if ((customer.total_poin || 0) < parsedPoinDigunakan) {
              throw new Error("Poin pelanggan tidak mencukupi untuk transaksi ini");
            }
            updatedPoin = Math.max(0, updatedPoin - parsedPoinDigunakan);
            await tx.insert(riwayat_poin).values({
              id_pelanggan: customerId,
              jenis_transaksi: "GUNAKAN",
              jumlah_poin: parsedPoinDigunakan,
              keterangan: `Poin digunakan sebagai diskon transaksi invoice ${noInvoice}`,
              id_referensi_transaksi: noInvoice,
              waktu: today.toISOString(),
            });
          }

          // Update customer record
          await tx
            .update(pelanggan)
            .set({ total_poin: updatedPoin })
            .where(eq(pelanggan.id_pelanggan, customerId));
        }
      }

      // 4. Save Infaq
      if (parsedInfaq > 0) {
        await tx.insert(infaq).values({
          id_penjualan: idPenjualan,
          no_invoice: noInvoice,
          jumlah_infaq: parsedInfaq,
          id_cabang: idCabang,
          id_user: idUser,
          waktu: today.toISOString(),
        });
      }

      // 5. Burn Voucher (mark as used after validation)
      if (id_voucher) {
        const [voucherRecord] = await tx
          .select()
          .from(vouchers)
          .where(and(eq(vouchers.id, parseInt(id_voucher)), eq(vouchers.status, "AKTIF")));

        if (!voucherRecord) {
          throw new Error("Voucher tidak valid atau sudah digunakan");
        }

        if (voucherRecord.nilai !== parsedNominalVoucher) {
          throw new Error("Nilai voucher tidak sesuai");
        }

        await tx
          .update(vouchers)
          .set({ status: "TERPAKAI" })
          .where(eq(vouchers.id, voucherRecord.id));
      }

      // ==========================================
      // INTEGRASI MANAJEMEN KAS & AKUNTANSI
      // ==========================================
      // 1. Tentukan rekening laci kasir (Wajib dari shift OPEN aktif)
      const [activeShift] = await tx
        .select()
        .from(kasir_shift)
        .where(
          and(
            eq(kasir_shift.id_kasir, idUser),
            eq(kasir_shift.id_cabang, idCabang),
            eq(kasir_shift.status, "OPEN")
          )
        )
        .limit(1);

      if (!activeShift) {
        throw new Error("Anda harus membuka shift kasir terlebih dahulu sebelum melayani penjualan POS.");
      }

      const targetRekId = activeShift.id_rekening;

      if (targetRekId && parsedTotalAkhir > 0) {
        // Ambil info rekening untuk mendapatkan COA ID
        const [rekening] = await tx
          .select()
          .from(rekening_kas)
          .where(eq(rekening_kas.id, targetRekId))
          .limit(1);

        const countKm = await tx
          .select({ count: sql<number>`count(*)` })
          .from(kas_transaksi)
          .where(
            and(
              eq(kas_transaksi.id_cabang, idCabang),
              eq(kas_transaksi.tipe, "MASUK"),
              eq(kas_transaksi.tanggal, formattedDate)
            )
          );
        const sequence = (countKm[0]?.count || 0) + 1;
        const noTxKas = `KM/${dateStr}/${idCabang}/${String(sequence).padStart(4, "0")}`;

        // A. Catat mutasi kas masuk
        await tx.insert(kas_transaksi).values({
          nomor_transaksi: noTxKas,
          id_rekening: targetRekId,
          id_cabang: idCabang,
          tipe: "MASUK",
          kategori: "PENJUALAN",
          nominal: parsedTotalAkhir,
          tanggal: formattedDate,
          keterangan: `Penjualan POS Invoice: ${noInvoice}`,
          referensi_type: "PENJUALAN",
          referensi_id: idPenjualan,
          status: "APPROVED",
          created_by: idUser,
        });

        // B. Update saldo berjalan rekening kas
        await tx
          .update(rekening_kas)
          .set({
            saldo: sql`saldo + ${parsedTotalAkhir}`,
            updated_at: today.toISOString(),
          })
          .where(eq(rekening_kas.id, targetRekId));

        // C. Jurnal Akuntansi otomatis terpadu (Standar Akuntansi Profesional)
        if (rekening?.id_akun_coa) {
          // Ambil COA dinamis dari pengaturan_aplikasi
          const appSettings = await tx.select().from(pengaturan_aplikasi);
          const settingsMap: Record<string, string> = {};
          for (const s of appSettings) {
            settingsMap[s.key] = s.value;
          }

          const coaPenjualan = parseInt(settingsMap["coa_kategori_penjualan"]) || 31;
          const coaDiskon = parseInt(settingsMap["coa_kategori_diskon"]) || 33;
          const coaInfaq = parseInt(settingsMap["coa_kategori_infaq"]) || 57;
          const coaHpp = parseInt(settingsMap["coa_kategori_hpp"]) || 36;
          const coaPersediaan = parseInt(settingsMap["coa_kategori_persediaan"]) || 10;

          const totalDiskon = parsedDiskon + parsedNominalVoucher + parsedPotonganPoin;

          // Line 1: Debit Akun Kas Toko / Laci Kasir (Nominal yang dibayar pelanggan)
          await tx.insert(jurnal_umum).values({
            tanggal_transaksi: formattedDate,
            no_referensi_bukti: noTxKas,
            deskripsi: `Penjualan POS (Kas Masuk): ${noInvoice}`,
            akun_id: rekening.id_akun_coa,
            cabang_id: idCabang,
            debit: parsedTotalAkhir,
            kredit: 0,
            dibuat_oleh: idUser,
          });

          // Line 2: Debit Diskon Penjualan (jika ada diskon/voucher/poin)
          if (totalDiskon > 0) {
            await tx.insert(jurnal_umum).values({
              tanggal_transaksi: formattedDate,
              no_referensi_bukti: noTxKas,
              deskripsi: `Potongan/Diskon POS: ${noInvoice}`,
              akun_id: coaDiskon,
              cabang_id: idCabang,
              debit: totalDiskon,
              kredit: 0,
              dibuat_oleh: idUser,
            });
          }

          // Line 3: Kredit Akun Pendapatan Penjualan Toko (Bruto Subtotal)
          await tx.insert(jurnal_umum).values({
            tanggal_transaksi: formattedDate,
            no_referensi_bukti: noTxKas,
            deskripsi: `Penjualan POS (Bruto): ${noInvoice}`,
            akun_id: coaPenjualan,
            cabang_id: idCabang,
            debit: 0,
            kredit: parsedSubtotal,
            dibuat_oleh: idUser,
          });

          // Line 4: Kredit Akun Titipan Infaq (jika ada infaq sukarela)
          if (parsedInfaq > 0) {
            await tx.insert(jurnal_umum).values({
              tanggal_transaksi: formattedDate,
              no_referensi_bukti: noTxKas,
              deskripsi: `Titipan Infaq POS: ${noInvoice}`,
              akun_id: coaInfaq,
              cabang_id: idCabang,
              debit: 0,
              kredit: parsedInfaq,
              dibuat_oleh: idUser,
            });
          }

          // Line 5: Debit Beban Pokok Penjualan (HPP) (jika total HPP > 0)
          if (totalHppPOS > 0) {
            await tx.insert(jurnal_umum).values({
              tanggal_transaksi: formattedDate,
              no_referensi_bukti: noTxKas,
              deskripsi: `Beban Pokok Penjualan (HPP) POS: ${noInvoice}`,
              akun_id: coaHpp,
              cabang_id: idCabang,
              debit: totalHppPOS,
              kredit: 0,
              dibuat_oleh: idUser,
            });

            // Line 6: Kredit Persediaan Barang Dagang
            await tx.insert(jurnal_umum).values({
              tanggal_transaksi: formattedDate,
              no_referensi_bukti: noTxKas,
              deskripsi: `Pengurangan Persediaan Barang Dagang POS: ${noInvoice}`,
              akun_id: coaPersediaan,
              cabang_id: idCabang,
              debit: 0,
              kredit: totalHppPOS,
              dibuat_oleh: idUser,
            });
          }
        }
      }

      return { success: true, invoice_id: idPenjualan, no_invoice: noInvoice };
    });

    return c.json(transactionResult);
  } catch (error: any) {
    console.error("Gagal memproses transaksi:", error);
    return c.json({ error: "Gagal memproses transaksi di database: " + error.message }, 500);
  }
});

// ==========================================
// 3. PROMO
// ==========================================
penjualanRoutes.get("/promo", async (c) => {
  const data = await db.select().from(promo).orderBy(promo.tanggal_mulai);
  return c.json(data);
});

// ==========================================
// 4. IMPORT TRANSAKSI KASIR DARI EXCEL (DEV MODE)
// ==========================================
penjualanRoutes.post("/import-excel", async (c) => {
  const user = c.get("user");
  const allowedRoles = [1, 2, 4, 5, 8, 11];
  if (!allowedRoles.includes(user.id_jabatan)) {
    return c.json({ error: "Forbidden. Hanya admin/manajer yang berwenang mengimpor data transaksi." }, 403);
  }

  try {
    const body = await c.req.json();
    let idCabang = parseInt(body.id_cabang) || user.id_cabang;
    if (!idCabang) {
      const [firstCab] = await db.select({ id_cabang: cabang.id_cabang }).from(cabang).limit(1);
      idCabang = firstCab?.id_cabang || 2;
    }
    const fallbackUserId = parseInt(body.fallback_user_id) || user.id || 1;
    const transactions = body.transactions;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return c.json({ error: "Payload transaksi kosong atau tidak valid." }, 400);
    }

    // 1. Preload master barang (cache)
    const allProducts = await db.select({
      id_barang: barang.id_barang,
      kode_barang: barang.kode_barang,
      barcode: barang.barcode,
      nama_barang: barang.nama_barang,
      satuan_1: barang.satuan_1,
      harga_rata: barang.harga_rata,
      harga_beli: barang.harga_beli,
    }).from(barang);

    const kodeBarangMap = new Map<string, typeof allProducts[0]>();
    const barcodeMap = new Map<string, typeof allProducts[0]>();
    const namaBarangMap = new Map<string, typeof allProducts[0]>();

    for (const p of allProducts) {
      if (p.kode_barang) kodeBarangMap.set(p.kode_barang.toLowerCase().trim(), p);
      if (p.barcode) barcodeMap.set(p.barcode.trim(), p);
      if (p.nama_barang) namaBarangMap.set(p.nama_barang.toLowerCase().trim(), p);
    }

    // 2. Preload users (kasir)
    const allUsers = await db.select({
      id: users.id,
      nama_user: users.nama_user,
      kode_user: users.kode_user,
    }).from(users);

    const userMap = new Map<string, number>();
    for (const u of allUsers) {
      if (u.nama_user) userMap.set(u.nama_user.toLowerCase().trim(), u.id);
      if (u.kode_user) userMap.set(u.kode_user.toLowerCase().trim(), u.id);
    }

    // 3. Process transactions in batches inside transaction
    let importedInvoices = 0;
    let totalItemsImported = 0;
    let skippedItemsCount = 0;
    const skippedDetails: string[] = [];

    await db.transaction(async (tx) => {
      for (const trx of transactions) {
        const noInvoice = (trx.no_invoice || "").trim();
        if (!noInvoice) continue;

        // Resolve Kasir
        let idKasir = fallbackUserId;
        if (trx.kasir_name) {
          const matchUser = userMap.get(trx.kasir_name.toLowerCase().trim());
          if (matchUser) idKasir = matchUser;
        }

        // Tanggal dan jam invoice
        const tgl = trx.tanggal_invoice || new Date().toISOString().slice(0, 10);
        const jam = trx.jam_invoice || "12:00:00";
        const namaPelanggan = trx.nama_pelanggan || "Umum";
        const idPelanggan = trx.id_pelanggan ? parseInt(trx.id_pelanggan) : null;
        const caraBayar = trx.jenis_pembayaran || "Tunai";
        const bayarNominal = Math.round(parseFloat(trx.jumlah_bayar) || parseFloat(trx.total_akhir) || 0);

        // 3.1. Cek apakah no_invoice sudah ada (OVERWRITE POLICY)
        const [existingInv] = await tx
          .select({ id_penjualan: penjualan.id_penjualan })
          .from(penjualan)
          .where(eq(penjualan.no_invoice, noInvoice))
          .limit(1);

        let idPenjualan: number;

        if (existingInv) {
          idPenjualan = existingInv.id_penjualan;
          // Hapus detail lama sebelum mengisi detail baru
          await tx.delete(penjualan_detail).where(eq(penjualan_detail.id_penjualan, idPenjualan));

          // Update header
          await tx.update(penjualan).set({
            tanggal_invoice: tgl,
            jam_invoice: jam,
            id_pelanggan: idPelanggan,
            nama_pelanggan: namaPelanggan,
            id_user: idKasir,
            id_cabang: idCabang,
            subtotal: Math.round(parseFloat(trx.subtotal) || 0),
            diskon: Math.round(parseFloat(trx.diskon) || 0),
            total_akhir: Math.round(parseFloat(trx.total_akhir) || 0),
            jenis_pembayaran: caraBayar,
            jumlah_bayar: bayarNominal,
          }).where(eq(penjualan.id_penjualan, idPenjualan));
        } else {
          // Insert header baru
          const [newInv] = await tx
            .insert(penjualan)
            .values({
              no_invoice: noInvoice,
              tanggal_invoice: tgl,
              jam_invoice: jam,
              id_pelanggan: idPelanggan,
              nama_pelanggan: namaPelanggan,
              id_user: idKasir,
              id_cabang: idCabang,
              subtotal: Math.round(parseFloat(trx.subtotal) || 0),
              diskon: Math.round(parseFloat(trx.diskon) || 0),
              nominal_voucher: 0,
              potongan_poin: 0,
              infaq: 0,
              total_akhir: Math.round(parseFloat(trx.total_akhir) || 0),
              jenis_pembayaran: caraBayar,
              jumlah_bayar: bayarNominal,
              poin_didapat: 0,
              created_at: `${tgl} ${jam}`,
            })
            .returning();
          idPenjualan = newInv.id_penjualan;
        }

        importedInvoices++;

        // 3.2. Insert Detail Items
        if (Array.isArray(trx.items)) {
          for (const itm of trx.items) {
            const kdBrg = (itm.kode_barang || "").toLowerCase().trim();
            const barcodeVal = (itm.barcode || "").trim();
            const nmBrg = (itm.nama_barang || "").toLowerCase().trim();

            // Match product
            const matchedProduct =
              (kdBrg && kodeBarangMap.get(kdBrg)) ||
              (barcodeVal && barcodeMap.get(barcodeVal)) ||
              (nmBrg && namaBarangMap.get(nmBrg)) ||
              null;

            if (!matchedProduct) {
              skippedItemsCount++;
              if (skippedDetails.length < 50) {
                skippedDetails.push(`[${noInvoice}] Barang '${itm.kode_barang || itm.nama_barang}' tidak ditemukan di Master Barang`);
              }
              continue; // Lewati item yang tidak terdaftar
            }

            const qty = Math.max(1, parseInt(itm.jumlah) || 1);
            const isi = Math.max(1, parseInt(itm.isi_satuan) || 1);
            const hargaJual = Math.round(parseFloat(itm.harga_jual) || 0);
            const hargaRata = Math.round(parseFloat(itm.harga_rata || matchedProduct.harga_rata || matchedProduct.harga_beli || 0));
            const diskonItem = Math.round(parseFloat(itm.diskon) || 0);
            const subtotalItem = Math.round(parseFloat(itm.subtotal) || (qty * hargaJual - diskonItem));

            await tx.insert(penjualan_detail).values({
              id_penjualan: idPenjualan,
              id_barang: matchedProduct.id_barang,
              nama_barang: itm.nama_barang || matchedProduct.nama_barang,
              jumlah: qty,
              satuan: itm.satuan || matchedProduct.satuan_1 || "PCS",
              isi_satuan: isi,
              harga_jual: hargaJual,
              harga_rata_saat_transaksi: hargaRata,
              diskon: diskonItem,
              subtotal: subtotalItem,
              jenis_item: "TRANSAKSI",
            });

            totalItemsImported++;
          }
        }
      }
    });

    return c.json({
      success: true,
      total_invoices: importedInvoices,
      total_items: totalItemsImported,
      skipped_items: skippedItemsCount,
      skipped_details: skippedDetails,
    });
  } catch (error: any) {
    console.error("Gagal import transaksi kasir dari excel:", error);
    return c.json({ error: "Gagal memproses import transaksi: " + error.message }, 500);
  }
});
