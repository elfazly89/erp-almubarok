import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  faktur_beli,
  faktur_beli_detail,
  stok_barang,
  barang,
  supplier,
  pesan_beli,
} from "@/lib/db/schema";
import { verifyToken, TOKEN_COOKIE } from "@/lib/auth/jwt";
import { eq, and, desc } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idFaktur = searchParams.get("id");

  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  const idCabang = user?.id_cabang;

  if (!idCabang) {
    return NextResponse.json({ error: "Cabang tidak teridentifikasi" }, { status: 400 });
  }

  // Fetch single invoice with details
  if (idFaktur) {
    const [invoice] = await db
      .select({
        id_faktur: faktur_beli.id_faktur,
        id_po: faktur_beli.id_po,
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
      .innerJoin(supplier, eq(faktur_beli.id_supplier, supplier.id_supplier))
      .where(and(eq(faktur_beli.id_faktur, parseInt(idFaktur)), eq(faktur_beli.id_cabang, idCabang)));

    if (!invoice) {
      return NextResponse.json({ error: "Faktur tidak ditemukan" }, { status: 404 });
    }

    const details = await db
      .select()
      .from(faktur_beli_detail)
      .where(eq(faktur_beli_detail.id_faktur, invoice.id_faktur));

    return NextResponse.json({ invoice, details });
  }

  // List recent invoices
  const list = await db
    .select({
      id_faktur: faktur_beli.id_faktur,
      nomor_faktur: faktur_beli.nomor_faktur,
      tanggal_faktur: faktur_beli.tanggal_faktur,
      nama_supplier: supplier.nama_supplier,
      total_faktur: faktur_beli.total_faktur,
      status_pembayaran: faktur_beli.status_pembayaran,
    })
    .from(faktur_beli)
    .innerJoin(supplier, eq(faktur_beli.id_supplier, supplier.id_supplier))
    .where(eq(faktur_beli.id_cabang, idCabang))
    .orderBy(desc(faktur_beli.id_faktur));

  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || !user.id_cabang) {
    return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
  }

  const body = await request.json();
  const idCabang = user.id_cabang;

  const {
    id_po,
    id_supplier,
    tanggal_faktur,
    nomor_faktur,
    total_faktur,
    diskon_total,
    ppn_rate,
    status_pembayaran, // Lunas / Belum Dibayar
    items,
  } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Barang faktur kosong" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Insert faktur_beli
      const [newInvoice] = await tx
        .insert(faktur_beli)
        .values({
          id_po: id_po ? parseInt(id_po) : null,
          id_cabang: idCabang,
          id_supplier: parseInt(id_supplier),
          tanggal_faktur: tanggal_faktur,
          nomor_faktur: nomor_faktur,
          total_faktur: parseInt(total_faktur),
          diskon_total: parseInt(diskon_total || "0"),
          ppn_rate: parseInt(ppn_rate || "0"),
          status_pembayaran: status_pembayaran || "Belum Dibayar",
        })
        .returning();

      const idFaktur = newInvoice.id_faktur;

      // 2. Loop details, update stocks, update HPP
      for (const item of items) {
        const idBarang = parseInt(item.id_barang);
        const qtyBeliPcs = parseInt(item.jumlah_beli); // in pcs
        const subtotal = parseInt(item.subtotal);
        const hargaSatuanPcs = Math.round(subtotal / qtyBeliPcs);

        // Insert Detail
        await tx.insert(faktur_beli_detail).values({
          id_faktur: idFaktur,
          id_barang: idBarang,
          jumlah_beli: qtyBeliPcs,
          harga_satuan: hargaSatuanPcs,
          subtotal: subtotal,
        });

        // Get current stock
        const [stockRecord] = await tx
          .select()
          .from(stok_barang)
          .where(and(eq(stok_barang.id_barang, idBarang), eq(stok_barang.id_cabang, idCabang)));

        const stockBefore = stockRecord ? (stockRecord.stok_akhir || 0) : 0;

        // Stock in
        if (stockRecord) {
          await tx
            .update(stok_barang)
            .set({
              stok_akhir: stockBefore + qtyBeliPcs,
            })
            .where(eq(stok_barang.id, stockRecord.id));
        } else {
          await tx.insert(stok_barang).values({
            id_barang: idBarang,
            id_cabang: idCabang,
            stok_akhir: qtyBeliPcs,
            penjualan: 0,
            posisi_rak: "-",
            minimal_stok: 0,
            maksimal_stok: 100,
          });
        }

        // HPP Moving Average calculation
        const [product] = await tx
          .select()
          .from(barang)
          .where(eq(barang.id_barang, idBarang));

        if (product) {
          const oldHPP = product.harga_rata || product.harga_beli || 0;
          const oldQty = Math.max(0, stockBefore); // clamp negative stock to 0 for HPP math

          // Moving average formula: ((Old Qty * Old HPP) + (New Qty * New Price)) / (Old Qty + New Qty)
          const oldTotalValue = oldQty * oldHPP;
          const newTotalValue = qtyBeliPcs * hargaSatuanPcs;
          const newHPP = Math.round((oldTotalValue + newTotalValue) / (oldQty + qtyBeliPcs));

          await tx
            .update(barang)
            .set({
              harga_rata: newHPP,
              harga_beli: hargaSatuanPcs, // update latest buy price to this receipt's cost
            })
            .where(eq(barang.id_barang, idBarang));
        }
      }

      // 3. Update Supplier accounts payable (hutang) if unpaid
      if (status_pembayaran === "Belum Dibayar") {
        const supplierId = parseInt(id_supplier);
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
      }

      // 4. Update PO status to processed if PO is associated
      if (id_po) {
        await tx
          .update(pesan_beli)
          .set({ status: "PROCESSED" })
          .where(eq(pesan_beli.id_pesan_beli, parseInt(id_po)));
      }

      return { success: true, id_faktur: idFaktur };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Gagal menyimpan faktur beli:", error);
    return NextResponse.json({ error: "Gagal menyimpan faktur beli: " + getErrorMessage(error) }, { status: 500 });
  }
}
