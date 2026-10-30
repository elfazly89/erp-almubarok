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
  barang
} from "../lib/db/schema";
import { eq, and, like, desc, asc, gt, sql } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";

export const penjualanRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// ==========================================
// 1. GET TRANSACTION HISTORY
// ==========================================
penjualanRoutes.get("/", async (c) => {
  const user = c.get("user");
  const idInvoice = c.req.query("id");
  const idCabang = user.id_cabang;

  if (!idCabang) {
    return c.json({ error: "Cabang tidak teridentifikasi" }, 400);
  }

  // If a specific ID is requested, return invoice details too
  if (idInvoice) {
    const [invoice] = await db
      .select()
      .from(penjualan)
      .where(and(eq(penjualan.id_penjualan, parseInt(idInvoice)), eq(penjualan.id_cabang, idCabang)));

    if (!invoice) {
      return c.json({ error: "Invoice tidak ditemukan" }, 404);
    }

    const details = await db
      .select()
      .from(penjualan_detail)
      .where(eq(penjualan_detail.id_penjualan, invoice.id_penjualan));

    return c.json({ invoice, details });
  }

  // Otherwise list recent transactions
  const list = await db
    .select()
    .from(penjualan)
    .where(eq(penjualan.id_cabang, idCabang))
    .orderBy(desc(penjualan.id_penjualan))
    .limit(50);

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

        // C. Jurnal Akuntansi otomatis (Debit: Kas Toko/Laci, Kredit: Pendapatan Penjualan Toko dari Pengaturan)
        if (rekening?.id_akun_coa) {
          // Ambil COA dinamis dari pengaturan_aplikasi
          const [coaSetting] = await tx
            .select()
            .from(pengaturan_aplikasi)
            .where(eq(pengaturan_aplikasi.key, "coa_kategori_penjualan"))
            .limit(1);
          const coaPenjualan = coaSetting ? parseInt(coaSetting.value) || 7 : 7;

          // Line 1: Debit Akun Kas
          await tx.insert(jurnal_umum).values({
            tanggal_transaksi: formattedDate,
            no_referensi_bukti: noTxKas,
            deskripsi: `Penjualan POS: ${noInvoice}`,
            akun_id: rekening.id_akun_coa,
            cabang_id: idCabang,
            debit: parsedTotalAkhir,
            kredit: 0,
            dibuat_oleh: idUser,
          });

          // Line 2: Kredit Akun Pendapatan
          await tx.insert(jurnal_umum).values({
            tanggal_transaksi: formattedDate,
            no_referensi_bukti: noTxKas,
            deskripsi: `Penjualan POS: ${noInvoice}`,
            akun_id: coaPenjualan,
            cabang_id: idCabang,
            debit: 0,
            kredit: parsedTotalAkhir,
            dibuat_oleh: idUser,
          });
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
