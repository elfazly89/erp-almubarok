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
  barang,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const idPromo = parseInt(id);
      
      // 1. Get main promo
      const [mainPromo] = await db
        .select()
        .from(promo)
        .where(eq(promo.id_promo, idPromo));

      if (!mainPromo) {
        return NextResponse.json({ error: "Promo tidak ditemukan" }, { status: 404 });
      }

      // 2. Get detail tables
      // 2. Get detail tables
      const cabangList = await db.select().from(promo_cabang).where(eq(promo_cabang.id_promo, idPromo));
      const syaratPem = await db.select().from(promo_syarat_pembelanjaan).where(eq(promo_syarat_pembelanjaan.id_promo, idPromo));
      const syaratKat = await db.select().from(promo_syarat_kategori).where(eq(promo_syarat_kategori.id_promo, idPromo));
      const syaratSup = await db.select().from(promo_syarat_supplier).where(eq(promo_syarat_supplier.id_promo, idPromo));
      const hadiahPoin = await db.select().from(promo_hadiah_poin).where(eq(promo_hadiah_poin.id_promo, idPromo));
      const hadiahDisk = await db.select().from(promo_hadiah_diskon).where(eq(promo_hadiah_diskon.id_promo, idPromo));

      const syaratBarang = await db
        .select({
          id: promo_syarat_barang_tertentu.id,
          id_promo: promo_syarat_barang_tertentu.id_promo,
          id_barang: promo_syarat_barang_tertentu.id_barang,
          nama_barang: barang.nama_barang
        })
        .from(promo_syarat_barang_tertentu)
        .leftJoin(barang, eq(promo_syarat_barang_tertentu.id_barang, barang.id_barang))
        .where(eq(promo_syarat_barang_tertentu.id_promo, idPromo));

      const syaratBeli = await db
        .select({
          id: promo_syarat_beli.id,
          id_promo: promo_syarat_beli.id_promo,
          id_barang: promo_syarat_beli.id_barang,
          nama_barang: barang.nama_barang,
          jumlah: promo_syarat_beli.jumlah,
          id_satuan: promo_syarat_beli.id_satuan
        })
        .from(promo_syarat_beli)
        .leftJoin(barang, eq(promo_syarat_beli.id_barang, barang.id_barang))
        .where(eq(promo_syarat_beli.id_promo, idPromo));

      const hadiahGratis = await db
        .select({
          id: promo_hadiah_gratis.id,
          id_promo: promo_hadiah_gratis.id_promo,
          id_barang: promo_hadiah_gratis.id_barang,
          nama_barang: barang.nama_barang,
          jumlah: promo_hadiah_gratis.jumlah,
          id_satuan: promo_hadiah_gratis.id_satuan
        })
        .from(promo_hadiah_gratis)
        .leftJoin(barang, eq(promo_hadiah_gratis.id_barang, barang.id_barang))
        .where(eq(promo_hadiah_gratis.id_promo, idPromo));

      const diskonBarang = await db
        .select({
          id: promo_diskon_barang.id,
          id_promo: promo_diskon_barang.id_promo,
          id_barang: promo_diskon_barang.id_barang,
          nama_barang: barang.nama_barang,
          jumlah: promo_diskon_barang.jumlah,
          id_satuan: promo_diskon_barang.id_satuan,
          jenis_diskon: promo_diskon_barang.jenis_diskon,
          nilai_diskon: promo_diskon_barang.nilai_diskon,
          berlaku_kelipatan: promo_diskon_barang.berlaku_kelipatan
        })
        .from(promo_diskon_barang)
        .leftJoin(barang, eq(promo_diskon_barang.id_barang, barang.id_barang))
        .where(eq(promo_diskon_barang.id_promo, idPromo));

      const poinBarang = await db
        .select({
          id: promo_poin_barang.id,
          id_promo: promo_poin_barang.id_promo,
          id_barang: promo_poin_barang.id_barang,
          nama_barang: barang.nama_barang,
          jumlah_barang: promo_poin_barang.jumlah_barang,
          id_satuan: promo_poin_barang.id_satuan,
          jumlah_poin: promo_poin_barang.jumlah_poin,
          berlaku_kelipatan: promo_poin_barang.berlaku_kelipatan
        })
        .from(promo_poin_barang)
        .leftJoin(barang, eq(promo_poin_barang.id_barang, barang.id_barang))
        .where(eq(promo_poin_barang.id_promo, idPromo));

      const hadiahBarang = await db
        .select({
          id: promo_hadiah_barang.id,
          id_promo: promo_hadiah_barang.id_promo,
          id_barang: promo_hadiah_barang.id_barang,
          nama_barang: barang.nama_barang,
          jumlah: promo_hadiah_barang.jumlah,
          id_satuan: promo_hadiah_barang.id_satuan
        })
        .from(promo_hadiah_barang)
        .leftJoin(barang, eq(promo_hadiah_barang.id_barang, barang.id_barang))
        .where(eq(promo_hadiah_barang.id_promo, idPromo));

      const tebusMurah = await db
        .select({
          id: promo_barang_tebus_murah.id,
          id_promo: promo_barang_tebus_murah.id_promo,
          id_barang: promo_barang_tebus_murah.id_barang,
          nama_barang: barang.nama_barang,
          jumlah: promo_barang_tebus_murah.jumlah,
          id_satuan: promo_barang_tebus_murah.id_satuan,
          harga_tebus: promo_barang_tebus_murah.harga_tebus
        })
        .from(promo_barang_tebus_murah)
        .leftJoin(barang, eq(promo_barang_tebus_murah.id_barang, barang.id_barang))
        .where(eq(promo_barang_tebus_murah.id_promo, idPromo));

      return NextResponse.json({
        promo: mainPromo,
        cabang: cabangList.map(c => c.id_cabang),
        syarat_pembelanjaan: syaratPem[0] || null,
        kategori: syaratKat.map(k => k.id_kategori),
        supplier: syaratSup.map(s => s.id_supplier),
        hadiah_poin: hadiahPoin[0] || null,
        hadiah_diskon: hadiahDisk[0] || null,
        syarat_barang_tertentu: syaratBarang,
        syarat_beli: syaratBeli,
        hadiah_gratis: hadiahGratis,
        diskon_barang: diskonBarang,
        poin_barang: poinBarang,
        hadiah_barang: hadiahBarang,
        tebus_murah: tebusMurah
      });
    }

    // Otherwise return list of all promos
    const allPromos = await db.select().from(promo).orderBy(desc(promo.id_promo));
    return NextResponse.json(allPromos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
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
      hadiah_poin, // number
      hadiah_diskon, // object { jenis, nilai }
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

    // 1. Insert Main Promo
    const [newPromo] = await db
      .insert(promo)
      .values({
        nama_promo,
        tipe_promo,
        deskripsi: deskripsi || null,
        berlaku_untuk: berlaku_untuk || "UMUM",
        tanggal_mulai,
        tanggal_selesai,
        status: status || "Aktif",
        berlaku_kelipatan: berlaku_kelipatan ? 1 : 0,
        id_cabang_pembuat: id_cabang_pembuat ? parseInt(id_cabang_pembuat) : null,
      })
      .returning();

    const idPromo = newPromo.id_promo;

    // 2. Insert Branch Mappings
    if (Array.isArray(id_cabang) && id_cabang.length > 0) {
      await db.insert(promo_cabang).values(
        id_cabang.map((cid: any) => ({
          id_promo: idPromo,
          id_cabang: parseInt(cid),
        }))
      );
    }

    // 3. Insert Specific Details based on Tipe Promo
    switch (tipe_promo) {
      case "BELI_GRATIS":
        if (Array.isArray(syarat_beli) && syarat_beli.length > 0) {
          await db.insert(promo_syarat_beli).values(
            syarat_beli.map((item: any) => ({
              id_promo: idPromo,
              id_barang: parseInt(item.id_barang),
              jumlah: parseInt(item.jumlah),
              id_satuan: parseInt(item.id_satuan) || 1,
            }))
          );
        }
        if (Array.isArray(hadiah_gratis) && hadiah_gratis.length > 0) {
          await db.insert(promo_hadiah_gratis).values(
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
          await db.insert(promo_diskon_barang).values(
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
          await db.insert(promo_poin_barang).values(
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
          await db.insert(promo_syarat_pembelanjaan).values({
            id_promo: idPromo,
            minimum_pembelanjaan: parseInt(syarat_pembelanjaan.minimum_pembelanjaan),
            berlaku_kelipatan: syarat_pembelanjaan.berlaku_kelipatan ? 1 : 0,
          });
        }
        if (Array.isArray(id_barang_tertentu) && id_barang_tertentu.length > 0) {
          await db.insert(promo_syarat_barang_tertentu).values(
            id_barang_tertentu.map((bid: any) => ({
              id_promo: idPromo,
              id_barang: parseInt(bid),
            }))
          );
        }
        if (Array.isArray(tebus_murah) && tebus_murah.length > 0) {
          await db.insert(promo_barang_tebus_murah).values(
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
          await db.insert(promo_syarat_pembelanjaan).values({
            id_promo: idPromo,
            minimum_pembelanjaan: parseInt(syarat_pembelanjaan.minimum_pembelanjaan),
            berlaku_kelipatan: syarat_pembelanjaan.berlaku_kelipatan ? 1 : 0,
          });
        }
        if (Array.isArray(id_kategori) && id_kategori.length > 0) {
          await db.insert(promo_syarat_kategori).values(
            id_kategori.map((kid: any) => ({
              id_promo: idPromo,
              id_kategori: parseInt(kid),
            }))
          );
        }
        if (Array.isArray(id_supplier) && id_supplier.length > 0) {
          await db.insert(promo_syarat_supplier).values(
            id_supplier.map((sid: any) => ({
              id_promo: idPromo,
              id_supplier: parseInt(sid),
            }))
          );
        }

        if (tipe_promo === "DISKON_PEMBELANJAAN" && hadiah_diskon) {
          await db.insert(promo_hadiah_diskon).values({
            id_promo: idPromo,
            jenis_diskon: hadiah_diskon.jenis_diskon || "PERSEN",
            nilai_diskon: parseInt(hadiah_diskon.nilai_diskon),
          });
        } else if (tipe_promo === "POIN_PEMBELANJAAN" && hadiah_poin) {
          await db.insert(promo_hadiah_poin).values({
            id_promo: idPromo,
            jumlah_poin: parseInt(hadiah_poin),
          });
        } else if (tipe_promo === "GRATIS_BARANG_PEMBELANJAAN" && Array.isArray(hadiah_barang) && hadiah_barang.length > 0) {
          await db.insert(promo_hadiah_barang).values(
            hadiah_barang.map((item: any) => ({
              id_promo: idPromo,
              id_barang: parseInt(item.id_barang),
              jumlah: parseInt(item.jumlah),
              id_satuan: parseInt(item.id_satuan) || 1,
            }))
          );
        } else if (tipe_promo === "TEBUS_MURAH" && Array.isArray(tebus_murah) && tebus_murah.length > 0) {
          await db.insert(promo_barang_tebus_murah).values(
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
          await db.insert(promo_syarat_pembelanjaan).values({
            id_promo: idPromo,
            minimum_pembelanjaan: parseInt(syarat_pembelanjaan.minimum_pembelanjaan),
            berlaku_kelipatan: syarat_pembelanjaan.berlaku_kelipatan ? 1 : 0,
          });
        }
        if (Array.isArray(id_barang_tertentu) && id_barang_tertentu.length > 0) {
          await db.insert(promo_syarat_barang_tertentu).values(
            id_barang_tertentu.map((bid: any) => ({
              id_promo: idPromo,
              id_barang: parseInt(bid),
            }))
          );
        }

        if (tipe_promo === "DISKON_BELANJA_BARANG_TERTENTU" && hadiah_diskon) {
          await db.insert(promo_hadiah_diskon).values({
            id_promo: idPromo,
            jenis_diskon: hadiah_diskon.jenis_diskon || "PERSEN",
            nilai_diskon: parseInt(hadiah_diskon.nilai_diskon),
          });
        } else if (tipe_promo === "GRATIS_BARANG_BELANJA_TERTENTU" && Array.isArray(hadiah_barang) && hadiah_barang.length > 0) {
          await db.insert(promo_hadiah_barang).values(
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

    return NextResponse.json({ success: true, promo: newPromo }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
