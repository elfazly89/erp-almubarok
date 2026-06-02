import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  promo,
  promo_cabang,
  promo_syarat_pembelanjaan,
  promo_syarat_kategori,
  promo_syarat_supplier,
  promo_hadiah_poin,
  promo_hadiah_diskon,
  promo_syarat_barang_tertentu,
  promo_syarat_beli,
  promo_hadiah_gratis,
  promo_diskon_barang,
  promo_poin_barang,
  promo_hadiah_barang,
  promo_barang_tebus_murah,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const idPromo = parseInt(id);

    if (isNaN(idPromo)) {
      return NextResponse.json({ error: "ID Promo tidak valid" }, { status: 400 });
    }

    // Execute deletions inside a transaction
    await db.transaction(async (tx) => {
      // Delete from all detail tables first
      await tx.delete(promo_cabang).where(eq(promo_cabang.id_promo, idPromo));
      await tx.delete(promo_syarat_pembelanjaan).where(eq(promo_syarat_pembelanjaan.id_promo, idPromo));
      await tx.delete(promo_syarat_kategori).where(eq(promo_syarat_kategori.id_promo, idPromo));
      await tx.delete(promo_syarat_supplier).where(eq(promo_syarat_supplier.id_promo, idPromo));
      await tx.delete(promo_hadiah_poin).where(eq(promo_hadiah_poin.id_promo, idPromo));
      await tx.delete(promo_hadiah_diskon).where(eq(promo_hadiah_diskon.id_promo, idPromo));
      await tx.delete(promo_syarat_barang_tertentu).where(eq(promo_syarat_barang_tertentu.id_promo, idPromo));
      await tx.delete(promo_syarat_beli).where(eq(promo_syarat_beli.id_promo, idPromo));
      await tx.delete(promo_hadiah_gratis).where(eq(promo_hadiah_gratis.id_promo, idPromo));
      await tx.delete(promo_diskon_barang).where(eq(promo_diskon_barang.id_promo, idPromo));
      await tx.delete(promo_poin_barang).where(eq(promo_poin_barang.id_promo, idPromo));
      await tx.delete(promo_hadiah_barang).where(eq(promo_hadiah_barang.id_promo, idPromo));
      await tx.delete(promo_barang_tebus_murah).where(eq(promo_barang_tebus_murah.id_promo, idPromo));

      // Finally delete the main promo
      await tx.delete(promo).where(eq(promo.id_promo, idPromo));
    });

    return NextResponse.json({ success: true, message: "Promo berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const idPromo = parseInt(id);

    if (isNaN(idPromo)) {
      return NextResponse.json({ error: "ID Promo tidak valid" }, { status: 400 });
    }

    const body = await request.json();
    const {
      nama_promo,
      tipe_promo,
      deskripsi,
      berlaku_untuk, // string e.g. "UMUM,1,2,3"
      tanggal_mulai,
      tanggal_selesai,
      status,
      berlaku_kelipatan,
      id_cabang_pembuat,
      
      // Children data
      id_cabang, // array of branch ids
      syarat_pembelanjaan, // object { minimum_pembelanjaan, berlaku_kelipatan }
      id_kategori, // array of category ids
      id_supplier, // array of supplier ids
      hadiah_poin, // number or string
      hadiah_diskon, // object { jenis_diskon, nilai_diskon }
      id_barang_tertentu, // array of specific product ids
      syarat_beli, // array of objects { id_barang, jumlah, id_satuan }
      hadiah_gratis, // array of objects { id_barang, jumlah, id_satuan }
      diskon_barang, // array of objects { id_barang, jumlah, id_satuan, jenis_diskon, nilai_diskon, berlaku_kelipatan }
      poin_barang, // array of objects { id_barang, jumlah_barang, id_satuan, jumlah_poin, berlaku_kelipatan }
      hadiah_barang, // array of objects { id_barang, jumlah, id_satuan }
      tebus_murah // array of objects { id_barang, jumlah, id_satuan, harga_tebus }
    } = body;

    if (!nama_promo || !tipe_promo || !tanggal_mulai || !tanggal_selesai) {
      return NextResponse.json({ error: "Kolom wajib (nama, tipe, tanggal) harus diisi" }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      // 1. Delete all existing mappings first
      await tx.delete(promo_cabang).where(eq(promo_cabang.id_promo, idPromo));
      await tx.delete(promo_syarat_pembelanjaan).where(eq(promo_syarat_pembelanjaan.id_promo, idPromo));
      await tx.delete(promo_syarat_kategori).where(eq(promo_syarat_kategori.id_promo, idPromo));
      await tx.delete(promo_syarat_supplier).where(eq(promo_syarat_supplier.id_promo, idPromo));
      await tx.delete(promo_hadiah_poin).where(eq(promo_hadiah_poin.id_promo, idPromo));
      await tx.delete(promo_hadiah_diskon).where(eq(promo_hadiah_diskon.id_promo, idPromo));
      await tx.delete(promo_syarat_barang_tertentu).where(eq(promo_syarat_barang_tertentu.id_promo, idPromo));
      await tx.delete(promo_syarat_beli).where(eq(promo_syarat_beli.id_promo, idPromo));
      await tx.delete(promo_hadiah_gratis).where(eq(promo_hadiah_gratis.id_promo, idPromo));
      await tx.delete(promo_diskon_barang).where(eq(promo_diskon_barang.id_promo, idPromo));
      await tx.delete(promo_poin_barang).where(eq(promo_poin_barang.id_promo, idPromo));
      await tx.delete(promo_hadiah_barang).where(eq(promo_hadiah_barang.id_promo, idPromo));
      await tx.delete(promo_barang_tebus_murah).where(eq(promo_barang_tebus_murah.id_promo, idPromo));

      // 2. Update Main Promo table
      await tx
        .update(promo)
        .set({
          nama_promo,
          tipe_promo,
          deskripsi: deskripsi || null,
          berlaku_untuk: berlaku_untuk || "UMUM",
          tanggal_mulai,
          tanggal_selesai,
          status: status || "Aktif",
          berlaku_kelipatan: berlaku_kelipatan ? 1 : 0,
          id_cabang_pembuat: id_cabang_pembuat ? parseInt(id_cabang_pembuat) : null,
          updated_at: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(promo.id_promo, idPromo));

      // 3. Re-insert Branch Mappings
      if (Array.isArray(id_cabang) && id_cabang.length > 0) {
        await tx.insert(promo_cabang).values(
          id_cabang.map((cid: any) => ({
            id_promo: idPromo,
            id_cabang: parseInt(cid),
          }))
        );
      }

      // 4. Re-insert Specific Details based on Tipe Promo
      switch (tipe_promo) {
        case "BELI_GRATIS":
          if (Array.isArray(syarat_beli) && syarat_beli.length > 0) {
            await tx.insert(promo_syarat_beli).values(
              syarat_beli.map((item: any) => ({
                id_promo: idPromo,
                id_barang: parseInt(item.id_barang),
                jumlah: parseInt(item.jumlah),
                id_satuan: parseInt(item.id_satuan) || 1,
              }))
            );
          }
          if (Array.isArray(hadiah_gratis) && hadiah_gratis.length > 0) {
            await tx.insert(promo_hadiah_gratis).values(
              hadiah_gratis.map((item: any) => ({
                id_promo: idPromo,
                id_barang: parseInt(item.id_barang),
                jumlah: parseInt(item.jumlah),
                id_satuan: parseInt(item.id_satuan) || 1,
              }))
            );
          }
          break;

        case "DISKON_BARANG":
          if (Array.isArray(diskon_barang) && diskon_barang.length > 0) {
            await tx.insert(promo_diskon_barang).values(
              diskon_barang.map((item: any) => ({
                id_promo: idPromo,
                id_barang: parseInt(item.id_barang),
                jumlah: parseInt(item.jumlah),
                id_satuan: parseInt(item.id_satuan) || 1,
                jenis_diskon: item.jenis_diskon || "PERSEN",
                nilai_diskon: parseInt(item.nilai_diskon),
                berlaku_kelipatan: item.berlaku_kelipatan ? 1 : 0,
              }))
            );
          }
          break;

        case "POIN_BARANG":
          if (Array.isArray(poin_barang) && poin_barang.length > 0) {
            await tx.insert(promo_poin_barang).values(
              poin_barang.map((item: any) => ({
                id_promo: idPromo,
                id_barang: parseInt(item.id_barang),
                jumlah_barang: parseInt(item.jumlah_barang),
                id_satuan: parseInt(item.id_satuan) || 1,
                jumlah_poin: parseInt(item.jumlah_poin),
                berlaku_kelipatan: item.berlaku_kelipatan ? 1 : 0,
              }))
            );
          }
          break;

        case "TEBUS_MURAH_BARANG_TERTENTU":
          if (syarat_pembelanjaan && syarat_pembelanjaan.minimum_pembelanjaan) {
            await tx.insert(promo_syarat_pembelanjaan).values({
              id_promo: idPromo,
              minimum_pembelanjaan: parseInt(syarat_pembelanjaan.minimum_pembelanjaan),
              berlaku_kelipatan: syarat_pembelanjaan.berlaku_kelipatan ? 1 : 0,
            });
          }
          if (Array.isArray(id_barang_tertentu) && id_barang_tertentu.length > 0) {
            await tx.insert(promo_syarat_barang_tertentu).values(
              id_barang_tertentu.map((bid: any) => ({
                id_promo: idPromo,
                id_barang: parseInt(bid),
              }))
            );
          }
          if (Array.isArray(tebus_murah) && tebus_murah.length > 0) {
            await tx.insert(promo_barang_tebus_murah).values(
              tebus_murah.map((item: any) => ({
                id_promo: idPromo,
                id_barang: parseInt(item.id_barang),
                jumlah: parseInt(item.jumlah),
                id_satuan: parseInt(item.id_satuan) || 1,
                harga_tebus: parseInt(item.harga_tebus),
              }))
            );
          }
          break;

        case "DISKON_PEMBELANJAAN":
        case "POIN_PEMBELANJAAN":
        case "GRATIS_BARANG_PEMBELANJAAN":
        case "TEBUS_MURAH":
          if (syarat_pembelanjaan && syarat_pembelanjaan.minimum_pembelanjaan) {
            await tx.insert(promo_syarat_pembelanjaan).values({
              id_promo: idPromo,
              minimum_pembelanjaan: parseInt(syarat_pembelanjaan.minimum_pembelanjaan),
              berlaku_kelipatan: syarat_pembelanjaan.berlaku_kelipatan ? 1 : 0,
            });
          }
          if (Array.isArray(id_kategori) && id_kategori.length > 0) {
            await tx.insert(promo_syarat_kategori).values(
              id_kategori.map((kid: any) => ({
                id_promo: idPromo,
                id_kategori: parseInt(kid),
              }))
            );
          }
          if (Array.isArray(id_supplier) && id_supplier.length > 0) {
            await tx.insert(promo_syarat_supplier).values(
              id_supplier.map((sid: any) => ({
                id_promo: idPromo,
                id_supplier: parseInt(sid),
              }))
            );
          }

          if (tipe_promo === "DISKON_PEMBELANJAAN" && hadiah_diskon) {
            await tx.insert(promo_hadiah_diskon).values({
              id_promo: idPromo,
              jenis_diskon: hadiah_diskon.jenis_diskon || "PERSEN",
              nilai_diskon: parseInt(hadiah_diskon.nilai_diskon),
            });
          } else if (tipe_promo === "POIN_PEMBELANJAAN" && hadiah_poin) {
            await tx.insert(promo_hadiah_poin).values({
              id_promo: idPromo,
              jumlah_poin: parseInt(hadiah_poin),
            });
          } else if (tipe_promo === "GRATIS_BARANG_PEMBELANJAAN" && Array.isArray(hadiah_barang) && hadiah_barang.length > 0) {
            await tx.insert(promo_hadiah_barang).values(
              hadiah_barang.map((item: any) => ({
                id_promo: idPromo,
                id_barang: parseInt(item.id_barang),
                jumlah: parseInt(item.jumlah),
                id_satuan: parseInt(item.id_satuan) || 1,
              }))
            );
          } else if (tipe_promo === "TEBUS_MURAH" && Array.isArray(tebus_murah) && tebus_murah.length > 0) {
            await tx.insert(promo_barang_tebus_murah).values(
              tebus_murah.map((item: any) => ({
                id_promo: idPromo,
                id_barang: parseInt(item.id_barang),
                jumlah: parseInt(item.jumlah),
                id_satuan: parseInt(item.id_satuan) || 1,
                harga_tebus: parseInt(item.harga_tebus),
              }))
            );
          }
          break;

        case "DISKON_BELANJA_BARANG_TERTENTU":
        case "GRATIS_BARANG_BELANJA_TERTENTU":
          if (syarat_pembelanjaan && syarat_pembelanjaan.minimum_pembelanjaan) {
            await tx.insert(promo_syarat_pembelanjaan).values({
              id_promo: idPromo,
              minimum_pembelanjaan: parseInt(syarat_pembelanjaan.minimum_pembelanjaan),
              berlaku_kelipatan: syarat_pembelanjaan.berlaku_kelipatan ? 1 : 0,
            });
          }
          if (Array.isArray(id_barang_tertentu) && id_barang_tertentu.length > 0) {
            await tx.insert(promo_syarat_barang_tertentu).values(
              id_barang_tertentu.map((bid: any) => ({
                id_promo: idPromo,
                id_barang: parseInt(bid),
              }))
            );
          }

          if (tipe_promo === "DISKON_BELANJA_BARANG_TERTENTU" && hadiah_diskon) {
            await tx.insert(promo_hadiah_diskon).values({
              id_promo: idPromo,
              jenis_diskon: hadiah_diskon.jenis_diskon || "PERSEN",
              nilai_diskon: parseInt(hadiah_diskon.nilai_diskon),
            });
          } else if (tipe_promo === "GRATIS_BARANG_BELANJA_TERTENTU" && Array.isArray(hadiah_barang) && hadiah_barang.length > 0) {
            await tx.insert(promo_hadiah_barang).values(
              hadiah_barang.map((item: any) => ({
                id_promo: idPromo,
                id_barang: parseInt(item.id_barang),
                jumlah: parseInt(item.jumlah),
                id_satuan: parseInt(item.id_satuan) || 1,
              }))
            );
          }
          break;
      }
    });

    return NextResponse.json({ success: true, message: "Promo berhasil diperbarui" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
