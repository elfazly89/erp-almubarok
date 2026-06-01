import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  penjualan,
  penjualan_detail,
  stok_barang,
  pelanggan,
  riwayat_poin,
  infaq,
  vouchers,
} from "@/lib/db/schema";
import { verifyToken, TOKEN_COOKIE } from "@/lib/auth/jwt";
import { eq, and, sql, desc } from "drizzle-orm";
import type { Column } from "drizzle-orm";
import { getErrorMessage } from "@/lib/utils";

// GET: List transaction history
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idInvoice = searchParams.get("id");
  
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;
  const idCabang = user?.id_cabang;

  if (!idCabang) {
    return NextResponse.json({ error: "Cabang tidak teridentifikasi" }, { status: 400 });
  }

  // If a specific ID is requested, return invoice details too
  if (idInvoice) {
    const [invoice] = await db
      .select()
      .from(penjualan)
      .where(and(eq(penjualan.id_penjualan, parseInt(idInvoice)), eq(penjualan.id_cabang, idCabang)));

    if (!invoice) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }

    const details = await db
      .select()
      .from(penjualan_detail)
      .where(eq(penjualan_detail.id_penjualan, invoice.id_penjualan));

    return NextResponse.json({ invoice, details });
  }

  // Otherwise list recent transactions
  const list = await db
    .select()
    .from(penjualan)
    .where(eq(penjualan.id_cabang, idCabang))
    .orderBy(desc(penjualan.id_penjualan))
    .limit(50);

  return NextResponse.json(list);
}

// POST: Save new transaction (Kasir POS Checkout)
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user || !user.id_cabang) {
    return NextResponse.json({ error: "Sesi tidak valid atau tidak diizinkan" }, { status: 401 });
  }

  const body = await request.json();
  const idCabang = user.id_cabang;
  const idUser = user.id;

  const {
    id_pelanggan,
    nama_pelanggan,
    items,
    subtotal,
    diskon,
    nominal_voucher,
    potongan_poin, // Nominal rupiah dari potongan poin (e.g. 5 poin * Rp 100 = Rp 500)
    poin_digunakan, // Jumlah poin yang didebit dari pelanggan (e.g. 5)
    infaq: nominalInfaq,
    total_akhir,
    jenis_pembayaran,
    jumlah_bayar,
    id_voucher,
    poin_didapat,
  } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Keranjang belanja kosong" }, { status: 400 });
  }

  // Generate unique invoice number
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  
  // Count invoices from today for this branch
  const startOfDayStr = today.toISOString().slice(0, 10);
  const [invCount] = await db
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

  try {
    const transactionResult = await db.transaction(async (tx) => {
      // 1. Insert header
      const formattedDate = startOfDayStr;
      const formattedTime = today.toTimeString().split(" ")[0];

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
          subtotal: parseInt(subtotal),
          diskon: parseInt(diskon || "0"),
          nominal_voucher: parseInt(nominal_voucher || "0"),
          potongan_poin: parseInt(potongan_poin || "0"),
          infaq: parseInt(nominalInfaq || "0"),
          total_akhir: parseInt(total_akhir),
          jenis_pembayaran: jenis_pembayaran || "Tunai",
          jumlah_bayar: parseInt(jumlah_bayar || "0"),
          id_voucher: id_voucher ? parseInt(id_voucher) : null,
          poin_didapat: parseInt(poin_didapat || "0"),
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

        // Insert sale details
        await tx.insert(penjualan_detail).values({
          id_penjualan: idPenjualan,
          id_barang: idBarang,
          nama_barang: item.nama_barang,
          jumlah: qty,
          satuan: item.satuan,
          isi_satuan: isiSatuan,
          harga_jual: parseInt(item.harga_jual),
          harga_rata_saat_transaksi: parseInt(item.harga_rata || item.harga_beli || "0") * totalPcs,
          diskon: parseInt(item.diskon || "0"),
          subtotal: parseInt(item.subtotal),
          jenis_item: item.jenis_item || "TRANSAKSI",
        });

        // Cut Stock in stok_barang
        // Check if stock record exists for this branch
        const [stockRecord] = await tx
          .select()
          .from(stok_barang)
          .where(and(eq(stok_barang.id_barang, idBarang), eq(stok_barang.id_cabang, idCabang)));

        if (stockRecord) {
          await tx
            .update(stok_barang)
            .set({
              stok_akhir: (stockRecord.stok_akhir || 0) - totalPcs,
              penjualan: (stockRecord.penjualan || 0) + totalPcs,
            })
            .where(eq(stok_barang.id, stockRecord.id));
        } else {
          // If stock record doesn't exist, create it with negative/subtracted stock
          await tx.insert(stok_barang).values({
            id_barang: idBarang,
            id_cabang: idCabang,
            stok_akhir: -totalPcs,
            penjualan: totalPcs,
            posisi_rak: "-",
            minimal_stok: 0,
            maksimal_stok: 100,
          });
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
          if (poin_didapat && parseInt(poin_didapat) > 0) {
            const added = parseInt(poin_didapat);
            updatedPoin += added;
            await tx.insert(riwayat_poin).values({
              id_pelanggan: customerId,
              jenis_transaksi: "DAPAT",
              jumlah_poin: added,
              keterangan: `Poin didapat dari transaksi invoice ${noInvoice}`,
              id_referensi_transaksi: noInvoice,
              waktu: today.toISOString(),
            });
          }

          // Points spent
          if (poin_digunakan && parseInt(poin_digunakan) > 0) {
            const used = parseInt(poin_digunakan);
            updatedPoin = Math.max(0, updatedPoin - used);
            await tx.insert(riwayat_poin).values({
              id_pelanggan: customerId,
              jenis_transaksi: "GUNAKAN",
              jumlah_poin: used,
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
      if (nominalInfaq && parseInt(nominalInfaq) > 0) {
        await tx.insert(infaq).values({
          id_penjualan: idPenjualan,
          no_invoice: noInvoice,
          jumlah_infaq: parseInt(nominalInfaq),
          id_cabang: idCabang,
          id_user: idUser,
          waktu: today.toISOString(),
        });
      }

      // 5. Burn Voucher (mark as used)
      if (id_voucher) {
        await tx
          .update(vouchers)
          .set({ status: "TERPAKAI" })
          .where(eq(vouchers.id, parseInt(id_voucher)));
      }

      return { success: true, invoice_id: idPenjualan, no_invoice: noInvoice };
    });

    return NextResponse.json(transactionResult);
  } catch (error: unknown) {
    console.error("Gagal memproses transaksi:", error);
    return NextResponse.json(
      { error: "Gagal memproses transaksi di database: " + getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Utility SQL helper for sqlite LIKE query
function like(column: Column, pattern: string) {
  return sql`${column} LIKE ${pattern}`;
}
