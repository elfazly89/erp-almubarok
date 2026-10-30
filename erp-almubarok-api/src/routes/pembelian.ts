import { Hono } from "hono";
import { db } from "../lib/db";
import {
  pesan_beli,
  pesan_beli_detail,
  faktur_beli,
  faktur_beli_detail,
  stok_barang,
  barang,
  barang_batch,
  supplier,
  bayar_hutang,
  cabang,
  rekening_kas,
  kas_transaksi,
  kartu_stok
} from "../lib/db/schema";
import { eq, and, or, desc, asc, sql, inArray } from "drizzle-orm";
import type { JWTPayload } from "../lib/auth/jwt";

export const pembelianRoutes = new Hono<{
  Variables: {
    user: JWTPayload;
  };
}>();

// ==========================================
// 1. PURCHASE ORDER (PO)
// ==========================================
pembelianRoutes.get("/po", async (c) => {
  const user = c.get("user");
  const idPo = c.req.query("id");
  const statusFilter = c.req.query("status");
  const idCabang = user.id_cabang;

  if (!idCabang) {
    return c.json({ error: "Cabang tidak teridentifikasi" }, 400);
  }

  const isSuper = user.id_jabatan === 1 || user.id_jabatan === 2 || user.id_cabang === 3;

  if (idPo) {
    const poQuery = db
      .select({
        id_pesan_beli: pesan_beli.id_pesan_beli,
        id_cabang: pesan_beli.id_cabang,
        id_supplier: pesan_beli.id_supplier,
        nama_supplier: supplier.nama_supplier,
        tanggal_pesan_beli: pesan_beli.tanggal_pesan_beli,
        nomor_pesan_beli: pesan_beli.nomor_pesan_beli,
        keterangan: pesan_beli.keterangan,
        total_harga_pesan_beli: pesan_beli.total_harga_pesan_beli,
        status: pesan_beli.status,
      })
      .from(pesan_beli)
      .innerJoin(supplier, eq(pesan_beli.id_supplier, supplier.id_supplier));

    const [po] = isSuper
      ? await poQuery.where(eq(pesan_beli.id_pesan_beli, parseInt(idPo)))
      : await poQuery.where(and(eq(pesan_beli.id_pesan_beli, parseInt(idPo)), eq(pesan_beli.id_cabang, idCabang)));

    if (!po) {
      return c.json({ error: "PO tidak ditemukan" }, 404);
    }

    const details = await db
      .select()
      .from(pesan_beli_detail)
      .where(eq(pesan_beli_detail.id_pesan_beli, po.id_pesan_beli));

    const enrichedDetails = details.map((d) => {
      const jmlPesan = d.jumlah_barang || 0;
      const jmlTerima = d.jumlah_diterima || 0;
      const sisaQty = Math.max(0, jmlPesan - jmlTerima);
      const progressPercent = jmlPesan > 0 ? Math.min(100, Math.round((jmlTerima / jmlPesan) * 100)) : 100;
      return {
        ...d,
        sisa_qty: sisaQty,
        progress_percent: progressPercent,
      };
    });

    return c.json({ po, details: enrichedDetails });
  }

  const conditions = isSuper ? [] : [eq(pesan_beli.id_cabang, idCabang)];
  if (statusFilter) {
    if (statusFilter.toUpperCase() === "PENDING" || statusFilter === "Diproses" || statusFilter.toLowerCase() === "active") {
      conditions.push(or(eq(pesan_beli.status, "PENDING"), eq(pesan_beli.status, "Diproses"), eq(pesan_beli.status, "Sebagian"))!);
    } else {
      conditions.push(eq(pesan_beli.status, statusFilter));
    }
  }

  const query = db
    .select({
      id_pesan_beli: pesan_beli.id_pesan_beli,
      id_cabang: pesan_beli.id_cabang,
      nomor_pesan_beli: pesan_beli.nomor_pesan_beli,
      tanggal_pesan_beli: pesan_beli.tanggal_pesan_beli,
      nama_supplier: supplier.nama_supplier,
      total_harga_pesan_beli: pesan_beli.total_harga_pesan_beli,
      status: pesan_beli.status,
    })
    .from(pesan_beli)
    .innerJoin(supplier, eq(pesan_beli.id_supplier, supplier.id_supplier));

  const data = conditions.length > 0 
    ? await query.where(and(...conditions)).orderBy(desc(pesan_beli.id_pesan_beli))
    : await query.orderBy(desc(pesan_beli.id_pesan_beli));

  return c.json(data);
});

pembelianRoutes.post("/po", async (c) => {
  const user = c.get("user");
  const idCabang = user.id_cabang;

  if (!idCabang) {
    return c.json({ error: "Sesi tidak valid" }, 401);
  }

  try {
    const body = await c.req.json();
    const { id_supplier, tanggal_pesan_beli, keterangan, total_harga_pesan_beli, items } = body;

    const supplierId = parseInt(id_supplier);
    if (isNaN(supplierId) || !tanggal_pesan_beli || !items || items.length === 0) {
      return c.json({ error: "Data input PO tidak lengkap atau tidak valid" }, 400);
    }

    const result = await db.transaction(async (tx) => {
      // 1. Get branch info to auto generate nomor PO
      const [cb] = await tx
        .select()
        .from(cabang)
        .where(eq(cabang.id_cabang, idCabang));
      const kodeCabang = cb ? cb.kode_cabang : "CBG";

      const datePart = tanggal_pesan_beli.replace(/-/g, ""); // e.g. "20261004"
      
      // Get sequence number for this branch and date
      const pattern = `PO-${kodeCabang}-${datePart}-%`;
      const [lastPo] = await tx
        .select({ nomor_pesan_beli: pesan_beli.nomor_pesan_beli })
        .from(pesan_beli)
        .where(and(
          eq(pesan_beli.id_cabang, idCabang),
          sql`${pesan_beli.nomor_pesan_beli} LIKE ${pattern}`
        ))
        .orderBy(desc(pesan_beli.id_pesan_beli))
        .limit(1);

      let seq = 1;
      if (lastPo && lastPo.nomor_pesan_beli) {
        const parts = lastPo.nomor_pesan_beli.split("-");
        const lastSeq = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSeq)) {
          seq = lastSeq + 1;
        }
      }
      const newPoNo = `PO-${kodeCabang}-${datePart}-${String(seq).padStart(3, "0")}`;

      const [newPo] = await tx
        .insert(pesan_beli)
        .values({
          id_cabang: idCabang,
          id_supplier: supplierId,
          tanggal_pesan_beli: tanggal_pesan_beli,
          nomor_pesan_beli: newPoNo,
          keterangan: keterangan || null,
          total_harga_pesan_beli: parseInt(total_harga_pesan_beli),
          status: "Diproses",
        })
        .returning();

      for (const item of items) {
        await tx.insert(pesan_beli_detail).values({
          id_pesan_beli: newPo.id_pesan_beli,
          id_barang: parseInt(item.id_barang),
          nama_barang: item.nama_barang,
          jumlah_barang: parseInt(item.jumlah_barang),
          harga_satuan: parseInt(item.harga_satuan),
          subtotal: parseInt(item.subtotal),
        });
      }

      return newPo;
    });

    return c.json({ success: true, ...result }, 201);
  } catch (err: any) {
    return c.json({ error: "Gagal menyimpan PO: " + err.message }, 500);
  }
});

// ==========================================
// 2. FAKTUR PEMBELIAN (RECEIVING)
// ==========================================
pembelianRoutes.get("/invoice", async (c) => {
  const user = c.get("user");
  const idFaktur = c.req.query("id");
  const idCabang = user.id_cabang;

  if (!idCabang) {
    return c.json({ error: "Cabang tidak teridentifikasi" }, 400);
  }

  const isSuper = user.id_jabatan === 1 || user.id_jabatan === 2 || user.id_cabang === 3;

  if (idFaktur) {
    const invQuery = db
      .select({
        id_faktur: faktur_beli.id_faktur,
        id_po: faktur_beli.id_po,
        id_cabang: faktur_beli.id_cabang,
        id_supplier: faktur_beli.id_supplier,
        nama_supplier: supplier.nama_supplier,
        tanggal_faktur: faktur_beli.tanggal_faktur,
        nomor_faktur: faktur_beli.nomor_faktur,
        total_faktur: faktur_beli.total_faktur,
        diskon_total: faktur_beli.diskon_total,
        ppn_rate: faktur_beli.ppn_rate,
        status_pembayaran: faktur_beli.status_pembayaran,
      })
      .from(faktur_beli)
      .innerJoin(supplier, eq(faktur_beli.id_supplier, supplier.id_supplier));

    const [invoice] = isSuper
      ? await invQuery.where(eq(faktur_beli.id_faktur, parseInt(idFaktur)))
      : await invQuery.where(and(eq(faktur_beli.id_faktur, parseInt(idFaktur)), eq(faktur_beli.id_cabang, idCabang)));

    if (!invoice) {
      return c.json({ error: "Faktur tidak ditemukan" }, 404);
    }

    const details = await db
      .select()
      .from(faktur_beli_detail)
      .where(eq(faktur_beli_detail.id_faktur, invoice.id_faktur));

    return c.json({ invoice, details });
  }

  const invQuery = db
    .select({
      id_faktur: faktur_beli.id_faktur,
      id_cabang: faktur_beli.id_cabang,
      nomor_faktur: faktur_beli.nomor_faktur,
      tanggal_faktur: faktur_beli.tanggal_faktur,
      nama_supplier: supplier.nama_supplier,
      total_faktur: faktur_beli.total_faktur,
      status_pembayaran: faktur_beli.status_pembayaran,
    })
    .from(faktur_beli)
    .innerJoin(supplier, eq(faktur_beli.id_supplier, supplier.id_supplier));

  const list = isSuper
    ? await invQuery.orderBy(desc(faktur_beli.id_faktur))
    : await invQuery.where(eq(faktur_beli.id_cabang, idCabang)).orderBy(desc(faktur_beli.id_faktur));

  return c.json(list);
});

pembelianRoutes.post("/invoice", async (c) => {
  const user = c.get("user");
  const idCabang = user.id_cabang;

  if (!idCabang) {
    return c.json({ error: "Sesi tidak valid" }, 401);
  }

  try {
    const body = await c.req.json();
    const {
      id_po,
      id_supplier,
      tanggal_faktur,
      nomor_faktur,
      total_faktur,
      diskon_total,
      ppn_rate,
      biaya_ongkir,
      biaya_bongkar,
      biaya_asuransi,
      metode_alokasi_landed_cost,
      status_pembayaran,
      id_rekening,
      items,
    } = body;

    const supplierId = parseInt(id_supplier);
    if (isNaN(supplierId) || !tanggal_faktur || !nomor_faktur.trim() || !items || items.length === 0) {
      return c.json({ error: "Data input faktur tidak lengkap atau tidak valid" }, 400);
    }

    // Landed cost calculation
    const ongkirVal = parseInt(biaya_ongkir || "0");
    const bongkarVal = parseInt(biaya_bongkar || "0");
    const asuransiVal = parseInt(biaya_asuransi || "0");
    const totalBiayaTambahan = ongkirVal + bongkarVal + asuransiVal;
    const metodeLandedCost = (metode_alokasi_landed_cost === "KUANTITAS") ? "KUANTITAS" : "NILAI";
    const invoiceTotal = parseInt(total_faktur);
    const grandTotal = invoiceTotal + totalBiayaTambahan;

    // Harmonize payment status
    const isUnpaid = status_pembayaran === "Belum Dibayar" || status_pembayaran === "Belum Lunas";
    const cleanPaymentStatus = isUnpaid ? "Belum Lunas" : "Lunas";

    // Check duplicate invoice number for the selected supplier
    const [existingInvoice] = await db
      .select()
      .from(faktur_beli)
      .where(and(
        eq(faktur_beli.nomor_faktur, nomor_faktur.trim()),
        eq(faktur_beli.id_supplier, supplierId)
      ));

    if (existingInvoice) {
      return c.json({ error: "Faktur dengan nomor ini sudah pernah didaftarkan untuk supplier terpilih" }, 409);
    }

    const result = await db.transaction(async (tx) => {
      // 1. Insert faktur_beli with Landed Cost fields
      const [newInvoice] = await tx
        .insert(faktur_beli)
        .values({
          id_po: id_po ? parseInt(id_po) : null,
          id_cabang: idCabang,
          id_supplier: supplierId,
          tanggal_faktur: tanggal_faktur,
          nomor_faktur: nomor_faktur.trim(),
          total_faktur: invoiceTotal,
          diskon_total: parseInt(diskon_total || "0"),
          ppn_rate: parseInt(ppn_rate || "0"),
          biaya_ongkir: ongkirVal,
          biaya_bongkar: bongkarVal,
          biaya_asuransi: asuransiVal,
          metode_alokasi_landed_cost: metodeLandedCost,
          total_biaya_tambahan: totalBiayaTambahan,
          grand_total: grandTotal,
          status_pembayaran: cleanPaymentStatus,
        })
        .returning();

      const idFaktur = newInvoice.id_faktur;
      const totalSubtotalItems = items.reduce((sum: number, item: any) => sum + parseInt(item.subtotal), 0);
      const totalQtyItems = items.reduce((sum: number, item: any) => sum + parseInt(item.jumlah_beli), 0);
      const discountRatio = totalSubtotalItems > 0 ? (totalSubtotalItems - parseInt(diskon_total || "0")) / totalSubtotalItems : 1;

      // 2. Loop details, allocate landed cost, update stocks & batches, update HPP
      for (const item of items) {
        const idBarang = parseInt(item.id_barang);
        const qtyBeliPcs = parseInt(item.jumlah_beli); // in pcs
        const subtotal = parseInt(item.subtotal);
        const hargaSatuanPcs = Math.round(subtotal / qtyBeliPcs);
        const adjustedHargaSatuanPcs = Math.round(hargaSatuanPcs * discountRatio);

        // Landed Cost Allocation per item
        let alokasiBiayaItem = 0;
        if (totalBiayaTambahan > 0) {
          if (metodeLandedCost === "KUANTITAS" && totalQtyItems > 0) {
            alokasiBiayaItem = Math.round((qtyBeliPcs / totalQtyItems) * totalBiayaTambahan);
          } else if (totalSubtotalItems > 0) {
            alokasiBiayaItem = Math.round((subtotal / totalSubtotalItems) * totalBiayaTambahan);
          }
        }

        const hppEfektifSatuan = adjustedHargaSatuanPcs + (qtyBeliPcs > 0 ? Math.round(alokasiBiayaItem / qtyBeliPcs) : 0);

        // Insert Detail with batch and landed cost snapshot
        await tx.insert(faktur_beli_detail).values({
          id_faktur: idFaktur,
          id_barang: idBarang,
          nama_barang: item.nama_barang || "Barang",
          jumlah_beli: qtyBeliPcs,
          harga_satuan: hargaSatuanPcs,
          subtotal: subtotal,
          nomor_batch: item.nomor_batch ? String(item.nomor_batch).trim() : null,
          tanggal_kadaluarsa: item.tanggal_kadaluarsa || null,
          alokasi_biaya_tambahan: alokasiBiayaItem,
          hpp_efektif_satuan: hppEfektifSatuan,
        });

        // Insert or update barang_batch if batch info provided
        if (item.nomor_batch && String(item.nomor_batch).trim()) {
          const batchNum = String(item.nomor_batch).trim();
          const expDate = item.tanggal_kadaluarsa || "2099-12-31";
          const todayStr = new Date().toISOString().split("T")[0];

          await tx.insert(barang_batch).values({
            nomor_batch: batchNum,
            id_barang: idBarang,
            id_cabang: idCabang,
            tanggal_masuk: tanggal_faktur || todayStr,
            tanggal_kadaluarsa: expDate,
            stok_batch: qtyBeliPcs,
            hpp_batch: hppEfektifSatuan,
            status: expDate < todayStr ? "KADALUARSA" : "AKTIF",
            catatan: `Penerimaan Faktur ${nomor_faktur.trim()}`,
          });
        }

        // Get current stock
        const [stockRecord] = await tx
          .select()
          .from(stok_barang)
          .where(and(eq(stok_barang.id_barang, idBarang), eq(stok_barang.id_cabang, idCabang)));

        const stockBefore = stockRecord ? (stockRecord.stok_akhir || 0) : 0;

        // Stock in
        const stockAfter = stockBefore + qtyBeliPcs;
        if (stockRecord) {
          await tx
            .update(stok_barang)
            .set({
              stok_akhir: stockAfter,
            })
            .where(eq(stok_barang.id, stockRecord.id));
        } else {
          await tx.insert(stok_barang).values({
            id_barang: idBarang,
            id_cabang: idCabang,
            stok_akhir: stockAfter,
            penjualan: 0,
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
          tipe_transaksi: "PENERIMAAN_PEMBELIAN",
          nomor_referensi: nomor_faktur.trim(),
          saldo_awal: stockBefore,
          masuk: qtyBeliPcs,
          keluar: 0,
          saldo_akhir: stockAfter,
          hpp_satuan: hppEfektifSatuan,
          total_nilai: stockAfter * hppEfektifSatuan,
          keterangan: `Penerimaan Pembelian (${nomor_faktur.trim()})`,
          id_user: user.id,
        });

        // HPP Moving Average calculation using hppEfektifSatuan (incorporating freight/landed costs!)
        const [product] = await tx
          .select()
          .from(barang)
          .where(eq(barang.id_barang, idBarang));

        if (product) {
          const oldHPP = product.harga_rata || product.harga_beli || 0;
          const oldQty = Math.max(0, stockBefore); // clamp negative stock to 0 for HPP math

          // Moving average formula: ((Old Qty * Old HPP) + (New Qty * Effective Landed Price)) / (Old Qty + New Qty)
          const oldTotalValue = oldQty * oldHPP;
          const newTotalValue = qtyBeliPcs * hppEfektifSatuan;
          const newHPP = Math.round((oldTotalValue + newTotalValue) / (oldQty + qtyBeliPcs));

          await tx
            .update(barang)
            .set({
              harga_rata: newHPP,
              harga_beli: hppEfektifSatuan,
            })
            .where(eq(barang.id_barang, idBarang));
        }
      }

      // 3. Update Supplier accounts payable (hutang) if unpaid
      if (isUnpaid) {
        const [sup] = await tx
          .select()
          .from(supplier)
          .where(eq(supplier.id_supplier, supplierId));

        if (sup) {
          const currentHutang = sup.hutang || 0;
          await tx
            .update(supplier)
            .set({
              hutang: currentHutang + parseInt(total_faktur),
            })
            .where(eq(supplier.id_supplier, supplierId));
        }
      } else {
        // If Cash / Lunas and id_rekening provided, record Kas Out
        const rekId = id_rekening ? parseInt(id_rekening) : null;
        if (rekId) {
          const [rek] = await tx
            .select()
            .from(rekening_kas)
            .where(eq(rekening_kas.id, rekId));

          if (rek) {
            const dateCode = tanggal_faktur.replace(/-/g, "");
            const txNo = `KAS-OUT-${dateCode}-${Date.now().toString().slice(-4)}`;

            await tx.insert(kas_transaksi).values({
              nomor_transaksi: txNo,
              id_rekening: rekId,
              id_cabang: idCabang,
              tipe: "KELUAR",
              kategori: "PEMBELIAN",
              nominal: parseInt(total_faktur),
              tanggal: tanggal_faktur,
              keterangan: `Pembelian tunai faktur ${nomor_faktur.trim()}`,
              referensi_type: "FAKTUR_BELI",
              referensi_id: idFaktur,
              status: "APPROVED",
              created_by: user.id,
            });

            await tx
              .update(rekening_kas)
              .set({
                saldo: sql`${rekening_kas.saldo} - ${parseInt(total_faktur)}`,
                updated_at: sql`(CURRENT_TIMESTAMP)`,
              })
              .where(eq(rekening_kas.id, rekId));
          }
        }
      }

      // 4. Update PO status & track received quantities in pesan_beli_detail if PO is associated
      if (id_po) {
        const poId = parseInt(id_po);

        // Update jumlah_diterima for each item in pesan_beli_detail
        for (const item of items) {
          const idBarang = parseInt(item.id_barang);
          const qtyBeliPcs = parseInt(item.jumlah_beli);

          await tx
            .update(pesan_beli_detail)
            .set({
              jumlah_diterima: sql`${pesan_beli_detail.jumlah_diterima} + ${qtyBeliPcs}`,
            })
            .where(
              and(
                eq(pesan_beli_detail.id_pesan_beli, poId),
                eq(pesan_beli_detail.id_barang, idBarang)
              )
            );
        }

        // Check if all items in the PO have been fully received
        const poDetails = await tx
          .select({
            jumlah_barang: pesan_beli_detail.jumlah_barang,
            jumlah_diterima: pesan_beli_detail.jumlah_diterima,
          })
          .from(pesan_beli_detail)
          .where(eq(pesan_beli_detail.id_pesan_beli, poId));

        const isFullyReceived = poDetails.length > 0 && poDetails.every(
          (d) => (d.jumlah_diterima || 0) >= d.jumlah_barang
        );

        await tx
          .update(pesan_beli)
          .set({ status: isFullyReceived ? "Selesai" : "Sebagian" })
          .where(eq(pesan_beli.id_pesan_beli, poId));
      }

      return { success: true, id_faktur: idFaktur };
    });

    return c.json(result);
  } catch (err: any) {
    return c.json({ error: "Gagal menyimpan faktur beli: " + err.message }, 500);
  }
});

// ==========================================
// 3. HUTANG SUPPLIER & PEMBAYARAN (BAYAR HUTANG)
// ==========================================
pembelianRoutes.get("/hutang", async (c) => {
  const user = c.get("user");
  const idCabang = user.id_cabang;
  const mode = c.req.query("mode");

  if (!idCabang) {
    return c.json({ error: "Cabang tidak teridentifikasi" }, 400);
  }

  if (mode === "history") {
    const list = await db
      .select({
        id: bayar_hutang.id,
        nama_supplier: supplier.nama_supplier,
        tanggal_bayar: bayar_hutang.tanggal_bayar,
        jumlah_bayar: bayar_hutang.jumlah_bayar,
        metode_pembayaran: bayar_hutang.metode_pembayaran,
        keterangan: bayar_hutang.keterangan,
        created_at: bayar_hutang.created_at,
      })
      .from(bayar_hutang)
      .innerJoin(supplier, eq(bayar_hutang.id_supplier, supplier.id_supplier))
      .orderBy(desc(bayar_hutang.id));
    return c.json(list);
  }

  // Default: suppliers with outstanding debt (> 0)
  const list = await db
    .select({
      id_supplier: supplier.id_supplier,
      nama_supplier: supplier.nama_supplier,
      alamat: supplier.alamat,
      telepon: supplier.telepon,
      hutang: supplier.hutang,
    })
    .from(supplier)
    .where(sql`${supplier.hutang} > 0`)
    .orderBy(desc(supplier.hutang));

  return c.json(list);
});

pembelianRoutes.post("/hutang", async (c) => {
  const user = c.get("user");
  const idCabang = user.id_cabang;

  if (!idCabang) {
    return c.json({ error: "Sesi tidak valid" }, 401);
  }

  try {
    const body = await c.req.json();
    const { id_supplier, tanggal_bayar, jumlah_bayar, metode_pembayaran, keterangan, id_rekening } = body;
    const supplierId = parseInt(id_supplier);
    const bayarNominal = parseInt(jumlah_bayar);

    if (isNaN(supplierId) || isNaN(bayarNominal) || bayarNominal <= 0) {
      return c.json({ error: "Data input pembayaran tidak valid" }, 400);
    }

    const result = await db.transaction(async (tx) => {
      // 1. Cek supplier & hutang
      const [sup] = await tx
        .select()
        .from(supplier)
        .where(eq(supplier.id_supplier, supplierId));

      if (!sup) {
        throw new Error("Supplier tidak ditemukan");
      }

      if (bayarNominal > (sup.hutang || 0)) {
        throw new Error(`Jumlah bayar (${bayarNominal}) melebihi saldo hutang (${sup.hutang || 0})`);
      }

      // 2. Insert payment record
      const [newPayment] = await tx
        .insert(bayar_hutang)
        .values({
          id_supplier: supplierId,
          tanggal_bayar,
          jumlah_bayar: bayarNominal,
          metode_pembayaran,
          keterangan: keterangan || null,
        })
        .returning();

      // 3. Reduce supplier debt
      const newHutang = Math.max(0, (sup.hutang || 0) - bayarNominal);
      await tx
        .update(supplier)
        .set({ hutang: newHutang })
        .where(eq(supplier.id_supplier, supplierId));

      // 4. FIFO Invoice Status Payoff
      // Cari faktur-faktur yang belum lunas milik supplier ini, urutkan dari yang tertua
      const unpaidInvoices = await tx
        .select()
        .from(faktur_beli)
        .where(and(
          eq(faktur_beli.id_supplier, supplierId),
          or(
            eq(faktur_beli.status_pembayaran, "Belum Lunas"),
            eq(faktur_beli.status_pembayaran, "Belum Dibayar")
          )
        ))
        .orderBy(asc(faktur_beli.tanggal_faktur), asc(faktur_beli.id_faktur));

      let remainingPayment = bayarNominal;
      for (const inv of unpaidInvoices) {
        if (remainingPayment <= 0) break;
        if (remainingPayment >= inv.total_faktur) {
          await tx
            .update(faktur_beli)
            .set({ status_pembayaran: "Lunas" })
            .where(eq(faktur_beli.id_faktur, inv.id_faktur));
          remainingPayment -= inv.total_faktur;
        } else {
          // Pembayaran parsial menghabiskan sisa pembayaran
          remainingPayment = 0;
        }
      }

      // 5. Kas & Rekening Out Integration (jika ada id_rekening)
      const rekId = id_rekening ? parseInt(id_rekening) : null;
      if (rekId) {
        const [rek] = await tx
          .select()
          .from(rekening_kas)
          .where(eq(rekening_kas.id, rekId));

        if (rek) {
          const dateCode = tanggal_bayar.replace(/-/g, "");
          const txNo = `KAS-OUT-${dateCode}-${Date.now().toString().slice(-4)}`;

          await tx.insert(kas_transaksi).values({
            nomor_transaksi: txNo,
            id_rekening: rekId,
            id_cabang: idCabang,
            tipe: "KELUAR",
            kategori: "PEMBELIAN",
            nominal: bayarNominal,
            tanggal: tanggal_bayar,
            keterangan: keterangan || `Pembayaran hutang kepada supplier: ${sup.nama_supplier}`,
            referensi_type: "FAKTUR_BELI",
            referensi_id: newPayment.id,
            status: "APPROVED",
            created_by: user.id,
          });

          await tx
            .update(rekening_kas)
            .set({
              saldo: sql`${rekening_kas.saldo} - ${bayarNominal}`,
              updated_at: sql`(CURRENT_TIMESTAMP)`,
            })
            .where(eq(rekening_kas.id, rekId));
        }
      }

      return newPayment;
    });

    return c.json({ success: true, ...result }, 201);
  } catch (err: any) {
    return c.json({ error: "Gagal menyimpan pembayaran hutang: " + err.message }, 500);
  }
});

// ==========================================
// 4. SARAN ORDER PEMBELIAN CERDAS (SMART REORDER)
// ==========================================
pembelianRoutes.get("/saran-order", async (c) => {
  const targetDaysParam = c.req.query("target_days");
  const idSupplierParam = c.req.query("id_supplier");
  const urgencyFilter = c.req.query("urgency"); // 'kritis' | 'perhatian' | 'aman' | 'all'
  const search = c.req.query("search") || "";

  const targetDays = Math.max(1, parseInt(targetDaysParam || "14") || 14);
  const supplierId = idSupplierParam ? parseInt(idSupplierParam) : null;

  try {
    const rawData = await db.execute(sql`
      WITH sales_summary AS (
        SELECT 
          pd.id_barang,
          COALESCE(SUM(pd.jumlah * pd.isi_satuan), 0) as total_qty_sold,
          ROUND(COALESCE(SUM(pd.jumlah * pd.isi_satuan) / 30.0, 0), 2) as ads_30
        FROM penjualan_detail pd
        JOIN penjualan p ON pd.id_penjualan = p.id_penjualan
        GROUP BY pd.id_barang
      ),
      stock_summary AS (
        SELECT 
          st.id_barang,
          COALESCE(SUM(st.stok_akhir), 0) as total_stok,
          COALESCE(SUM(st.minimal_stok), 0) as total_min_stok
        FROM stok_barang st
        GROUP BY st.id_barang
      ),
      po_on_order AS (
        SELECT 
          pbd.id_barang,
          COALESCE(SUM(GREATEST(0, pbd.jumlah_barang - COALESCE(pbd.jumlah_diterima, 0))), 0) as total_on_order
        FROM pesan_beli_detail pbd
        JOIN pesan_beli pb ON pbd.id_pesan_beli = pb.id_pesan_beli
        WHERE pb.status IN ('PENDING', 'Diproses', 'Sebagian')
        GROUP BY pbd.id_barang
      )
      SELECT 
        b.id_barang,
        b.barcode,
        b.nama_barang,
        b.id_supplier,
        s.nama_supplier,
        b.satuan_1,
        b.satuan_2,
        b.satuan_3,
        COALESCE(b.isi_2, 1) as isi_2,
        COALESCE(b.isi_3, 1) as isi_3,
        COALESCE(b.harga_beli, 0) as harga_beli,
        COALESCE(ss.total_stok, 0) as total_stok,
        COALESCE(ss.total_min_stok, 0) as total_min_stok,
        COALESCE(sl.ads_30, 0) as ads_30,
        COALESCE(sl.total_qty_sold, 0) as total_qty_sold,
        COALESCE(poo.total_on_order, 0) as total_on_order
      FROM barang b
      LEFT JOIN supplier s ON b.id_supplier = s.id_supplier
      LEFT JOIN sales_summary sl ON b.id_barang = sl.id_barang
      LEFT JOIN stock_summary ss ON b.id_barang = ss.id_barang
      LEFT JOIN po_on_order poo ON b.id_barang = poo.id_barang
      ORDER BY sl.total_qty_sold DESC NULLS LAST, b.nama_barang ASC
    `);

    let items = (rawData.rows as any[]).map((row) => {
      const ads = parseFloat(row.ads_30) || 0;
      const totalStok = parseInt(row.total_stok) || 0;
      const totalMinStok = parseInt(row.total_min_stok) || 0;
      const totalOnOrder = parseInt(row.total_on_order) || 0;
      const hargaBeliPcs = parseInt(row.harga_beli) || 0;

      // Ketahanan stok dalam hari
      const runoutDays = ads > 0 ? Math.round((totalStok / ads) * 10) / 10 : (totalStok > 0 ? 999 : 0);

      // Urgensi:
      // KRITIS: runout <= 3 hari atau stok <= min_stok (dan ada penjualan atau stok kosong)
      // PERHATIAN: runout <= 7 hari
      // AMAN: runout > 7 hari
      let statusUrgensi: "KRITIS" | "PERHATIAN" | "AMAN" = "AMAN";
      if (runoutDays <= 3 || (totalMinStok > 0 && totalStok <= totalMinStok) || (totalStok <= 0 && ads > 0)) {
        statusUrgensi = "KRITIS";
      } else if (runoutDays <= 7) {
        statusUrgensi = "PERHATIAN";
      }

      // Formula: (Target Buffer Hari * ADS) + Stok Minimum - Stok Sekarang - On Order
      const targetDemand = targetDays * ads;
      const rawNeededPcs = Math.max(0, Math.ceil(targetDemand + totalMinStok - totalStok - totalOnOrder));

      // Kemasan vendor terbaik: pilih satuan_3 jika ada dan isi_3 > 1, else satuan_2 jika isi_2 > 1, else satuan_1
      let namaKemasan = row.satuan_1 || "PCS";
      let isiKemasan = 1;

      if (row.satuan_3 && row.isi_3 > 1) {
        namaKemasan = row.satuan_3;
        isiKemasan = row.isi_3;
      } else if (row.satuan_2 && row.isi_2 > 1) {
        namaKemasan = row.satuan_2;
        isiKemasan = row.isi_2;
      }

      // Ceiling packaging calculation
      const saranQtyKemasan = rawNeededPcs > 0 ? Math.ceil(rawNeededPcs / isiKemasan) : 0;
      const finalQtyPcs = saranQtyKemasan * isiKemasan;
      const hargaBeliKemasan = hargaBeliPcs * isiKemasan;
      const estimasiSubtotal = saranQtyKemasan * hargaBeliKemasan;

      return {
        id_barang: row.id_barang,
        barcode: row.barcode,
        nama_barang: row.nama_barang,
        id_supplier: row.id_supplier,
        nama_supplier: row.nama_supplier || "Tanpa Supplier",
        satuan_1: row.satuan_1,
        total_stok: totalStok,
        total_min_stok: totalMinStok,
        total_on_order: totalOnOrder,
        total_qty_sold_30: parseInt(row.total_qty_sold) || 0,
        ads: ads,
        runout_days: runoutDays,
        status_urgensi: statusUrgensi,
        nama_kemasan: namaKemasan,
        isi_kemasan: isiKemasan,
        saran_qty_pcs_raw: rawNeededPcs,
        saran_qty_kemasan: saranQtyKemasan,
        final_qty_pcs: finalQtyPcs,
        harga_beli_pcs: hargaBeliPcs,
        harga_beli_kemasan: hargaBeliKemasan,
        estimasi_subtotal: estimasiSubtotal,
      };
    });

    // Filtering
    if (supplierId) {
      items = items.filter((it) => it.id_supplier === supplierId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((it) => it.nama_barang.toLowerCase().includes(q) || it.barcode.toLowerCase().includes(q));
    }
    if (urgencyFilter && urgencyFilter !== "all") {
      if (urgencyFilter.toLowerCase() === "kritis") {
        items = items.filter((it) => it.status_urgensi === "KRITIS");
      } else if (urgencyFilter.toLowerCase() === "perhatian") {
        items = items.filter((it) => it.status_urgensi === "KRITIS" || it.status_urgensi === "PERHATIAN");
      }
    }

    // Summary calculation
    const summary = {
      target_days: targetDays,
      total_sku: items.length,
      kritis_count: items.filter((i) => i.status_urgensi === "KRITIS").length,
      perhatian_count: items.filter((i) => i.status_urgensi === "PERHATIAN").length,
      aman_count: items.filter((i) => i.status_urgensi === "AMAN").length,
      estimasi_total_anggaran: items.reduce((sum, it) => sum + it.estimasi_subtotal, 0),
    };

    return c.json({ success: true, summary, items });
  } catch (err: any) {
    return c.json({ error: "Gagal memproses saran order: " + err.message }, 500);
  }
});

// POST /saran-order/generate-po - Mengonversi item terpilih menjadi dokumen Purchase Order resmi
pembelianRoutes.post("/saran-order/generate-po", async (c) => {
  const user = c.get("user");
  const idCabang = user.id_cabang;

  if (!idCabang) {
    return c.json({ error: "Sesi tidak valid" }, 401);
  }

  try {
    const body = await c.req.json();
    const { id_supplier, items, keterangan } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return c.json({ error: "Pilih minimal 1 barang untuk membuat PO" }, 400);
    }

    // Group items by supplier
    const groupsBySupplier = new Map<number, any[]>();
    for (const item of items) {
      const sId = parseInt(item.id_supplier || id_supplier);
      if (!sId || isNaN(sId)) {
        return c.json({ error: `Barang ${item.nama_barang} tidak memiliki supplier yang valid` }, 400);
      }
      if (!groupsBySupplier.has(sId)) {
        groupsBySupplier.set(sId, []);
      }
      groupsBySupplier.get(sId)!.push(item);
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    const result = await db.transaction(async (tx) => {
      // 1. Get branch info
      const [cb] = await tx.select().from(cabang).where(eq(cabang.id_cabang, idCabang));
      const kodeCabang = cb ? cb.kode_cabang : "CBG";
      const datePart = todayStr.replace(/-/g, "");

      // Sequence numbering base
      const pattern = `PO-${kodeCabang}-${datePart}-%`;
      const [lastPo] = await tx
        .select({ nomor_pesan_beli: pesan_beli.nomor_pesan_beli })
        .from(pesan_beli)
        .where(and(eq(pesan_beli.id_cabang, idCabang), sql`${pesan_beli.nomor_pesan_beli} LIKE ${pattern}`))
        .orderBy(desc(pesan_beli.id_pesan_beli))
        .limit(1);

      let seq = 1;
      if (lastPo && lastPo.nomor_pesan_beli) {
        const parts = lastPo.nomor_pesan_beli.split("-");
        const lastSeq = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }

      const createdPos = [];

      for (const [suppId, suppItems] of groupsBySupplier.entries()) {
        const newPoNo = `PO-${kodeCabang}-${datePart}-${String(seq).padStart(3, "0")}`;
        seq += 1;

        const totalHarga = suppItems.reduce((sum: number, it: any) => sum + parseInt(it.subtotal || "0"), 0);

        const [newPo] = await tx
          .insert(pesan_beli)
          .values({
            id_cabang: idCabang,
            id_supplier: suppId,
            tanggal_pesan_beli: todayStr,
            nomor_pesan_beli: newPoNo,
            keterangan: keterangan || "Dibuat otomatis dari Saran Order Cerdas (Sales Velocity & Min Stock)",
            total_harga_pesan_beli: totalHarga,
            status: "Diproses",
          })
          .returning();

        for (const item of suppItems) {
          await tx.insert(pesan_beli_detail).values({
            id_pesan_beli: newPo.id_pesan_beli,
            id_barang: parseInt(item.id_barang),
            nama_barang: item.nama_barang,
            jumlah_barang: parseInt(item.jumlah_barang), // in pcs
            harga_satuan: parseInt(item.harga_satuan),   // in pcs
            subtotal: parseInt(item.subtotal),
          });
        }

        createdPos.push(newPo);
      }

      return createdPos;
    });

    return c.json({ success: true, count: result.length, po: result[0], pos: result }, 201);
  } catch (err: any) {
    return c.json({ error: "Gagal membuat PO otomatis: " + err.message }, 500);
  }
});

// ==========================================
// 5. MANAJEMEN BACKORDER & FORCE CLOSE PO
// ==========================================

// POST /po/:id/force-close - Menutup sisa pesanan PO secara manual jika vendor tidak akan mengirim lagi
pembelianRoutes.post("/po/:id/force-close", async (c) => {
  const user = c.get("user");
  const idPo = parseInt(c.req.param("id"));
  const idCabang = user.id_cabang;

  if (!idCabang) {
    return c.json({ error: "Sesi tidak valid" }, 401);
  }

  if (isNaN(idPo)) {
    return c.json({ error: "ID PO tidak valid" }, 400);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const alasan = body.alasan?.trim() || "Sisa barang ditiadakan oleh pengguna";

    const [po] = await db
      .select()
      .from(pesan_beli)
      .where(eq(pesan_beli.id_pesan_beli, idPo))
      .limit(1);

    if (!po) {
      return c.json({ error: "PO tidak ditemukan" }, 404);
    }

    const newKeterangan = po.keterangan 
      ? `${po.keterangan} [Sisa Ditutup: ${alasan}]` 
      : `[Sisa Ditutup: ${alasan}]`;

    await db
      .update(pesan_beli)
      .set({
        status: "Selesai",
        keterangan: newKeterangan,
      })
      .where(eq(pesan_beli.id_pesan_beli, idPo));

    return c.json({ success: true, message: "Sisa pesanan PO berhasil ditutup." });
  } catch (err: any) {
    return c.json({ error: "Gagal menutup sisa PO: " + err.message }, 500);
  }
});

// GET /backorder - Mengambil daftar seluruh PO yang belum lengkap / barang tertahan
pembelianRoutes.get("/backorder", async (c) => {
  const user = c.get("user");
  const idCabang = user.id_cabang;
  const isSuper = user.id_jabatan === 1 || user.id_jabatan === 2 || user.id_cabang === 3;
  const supplierFilter = c.req.query("id_supplier");
  const search = c.req.query("search") || "";

  try {
    // 1. Fetch POs that are active / partially received
    const rawPos = await db.execute(sql`
      SELECT 
        pb.id_pesan_beli,
        pb.id_cabang,
        c.nama_cabang,
        pb.nomor_pesan_beli,
        pb.tanggal_pesan_beli,
        pb.status,
        pb.keterangan,
        pb.total_harga_pesan_beli,
        s.id_supplier,
        s.nama_supplier,
        s.telepon as telepon_supplier,
        (
          SELECT MAX(fb.tanggal_faktur)
          FROM faktur_beli fb
          WHERE fb.id_po = pb.id_pesan_beli
        ) as tanggal_terima_terakhir,
        (
          SELECT COUNT(fb.id_faktur)
          FROM faktur_beli fb
          WHERE fb.id_po = pb.id_pesan_beli
        ) as total_faktur_tercatat
      FROM pesan_beli pb
      JOIN supplier s ON pb.id_supplier = s.id_supplier
      JOIN cabang c ON pb.id_cabang = c.id_cabang
      WHERE pb.status IN ('Sebagian', 'Diproses', 'PENDING')
      ORDER BY pb.id_pesan_beli DESC
    `);

    const poRows = rawPos.rows as any[];
    if (poRows.length === 0) {
      return c.json({
        success: true,
        summary: {
          total_po_backorder: 0,
          total_po_sebagian: 0,
          total_sku_backorder: 0,
          estimasi_nilai_backorder: 0,
        },
        data: [],
      });
    }

    const poIds = poRows.map((r) => r.id_pesan_beli);
    const details = await db
      .select({
        id: pesan_beli_detail.id,
        id_pesan_beli: pesan_beli_detail.id_pesan_beli,
        id_barang: pesan_beli_detail.id_barang,
        barcode: barang.barcode,
        nama_barang: pesan_beli_detail.nama_barang,
        qty_pesan: pesan_beli_detail.jumlah_barang,
        qty_diterima: pesan_beli_detail.jumlah_diterima,
        harga_satuan: pesan_beli_detail.harga_satuan,
        subtotal_pesan: pesan_beli_detail.subtotal,
        satuan_1: barang.satuan_1,
        satuan_2: barang.satuan_2,
        satuan_3: barang.satuan_3,
        isi_2: barang.isi_2,
        isi_3: barang.isi_3,
      })
      .from(pesan_beli_detail)
      .innerJoin(barang, eq(pesan_beli_detail.id_barang, barang.id_barang))
      .where(inArray(pesan_beli_detail.id_pesan_beli, poIds))
      .orderBy(asc(pesan_beli_detail.id));

    const allDetails = details.map((d) => {
      const sisa = Math.max(0, (d.qty_pesan || 0) - (d.qty_diterima || 0));
      return {
        ...d,
        sisa_backorder: sisa,
        subtotal_sisa: sisa * (d.harga_satuan || 0),
        isi_2: d.isi_2 ?? 1,
        isi_3: d.isi_3 ?? 1,
      };
    });

    // Assemble PO with items
    let backorderList = poRows.map((po) => {
      const items = allDetails.filter((d) => d.id_pesan_beli === po.id_pesan_beli);
      const unfulfilledItems = items.filter((d) => (d.sisa_backorder || 0) > 0);
      const totalPesanPcs = items.reduce((sum, d) => sum + Number(d.qty_pesan || 0), 0);
      const totalDiterimaPcs = items.reduce((sum, d) => sum + Number(d.qty_diterima || 0), 0);
      const totalSisaPcs = items.reduce((sum, d) => sum + Number(d.sisa_backorder || 0), 0);
      const totalNilaiSisa = items.reduce((sum, d) => sum + Number(d.subtotal_sisa || 0), 0);
      const progressPercent = totalPesanPcs > 0 ? Math.min(100, Math.round((totalDiterimaPcs / totalPesanPcs) * 100)) : 0;

      return {
        ...po,
        total_pesan_pcs: totalPesanPcs,
        total_diterima_pcs: totalDiterimaPcs,
        total_sisa_pcs: totalSisaPcs,
        total_nilai_sisa: totalNilaiSisa,
        progress_percent: progressPercent,
        items,
        unfulfilled_items: unfulfilledItems,
        is_partial: parseInt(po.total_faktur_tercatat) > 0 || po.status === "Sebagian",
      };
    }).filter((po) => po.total_sisa_pcs > 0);

    // Filter by branch if not super
    if (!isSuper) {
      backorderList = backorderList.filter((po) => po.id_cabang === idCabang);
    }

    // Filter by supplier
    if (supplierFilter) {
      const sId = parseInt(supplierFilter);
      if (!isNaN(sId)) {
        backorderList = backorderList.filter((po) => po.id_supplier === sId);
      }
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      backorderList = backorderList.filter(
        (po) =>
          po.nomor_pesan_beli.toLowerCase().includes(q) ||
          po.nama_supplier.toLowerCase().includes(q) ||
          po.items.some((i: any) => i.nama_barang.toLowerCase().includes(q) || i.barcode.toLowerCase().includes(q))
      );
    }

    // KPI Summary
    const distinctSkuSet = new Set<number>();
    backorderList.forEach((po) => {
      po.unfulfilled_items.forEach((i: any) => distinctSkuSet.add(i.id_barang));
    });

    const summary = {
      total_po_backorder: backorderList.length,
      total_po_sebagian: backorderList.filter((p) => p.status === "Sebagian" || p.is_partial).length,
      total_sku_backorder: distinctSkuSet.size,
      estimasi_nilai_backorder: backorderList.reduce((sum, po) => sum + po.total_nilai_sisa, 0),
    };

    return c.json({ success: true, summary, data: backorderList });
  } catch (err: any) {
    return c.json({ error: "Gagal memuat data backorder: " + err.message }, 500);
  }
});
