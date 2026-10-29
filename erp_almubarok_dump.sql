--
-- PostgreSQL database dump
--

\restrict 3OFAz6rAlj7pbATCUx1hFU6NtJ1ZDhMdptGsCyRmP9itYgBl0qjikf25G3OPyvP

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.stok_setting_cabang DROP CONSTRAINT IF EXISTS stok_setting_cabang_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.stok_setting_cabang DROP CONSTRAINT IF EXISTS stok_setting_cabang_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.stok_barang DROP CONSTRAINT IF EXISTS stok_barang_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.stok_barang DROP CONSTRAINT IF EXISTS stok_barang_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.sales_velocity DROP CONSTRAINT IF EXISTS sales_velocity_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.sales_velocity DROP CONSTRAINT IF EXISTS sales_velocity_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.riwayat_poin DROP CONSTRAINT IF EXISTS riwayat_poin_id_pelanggan_pelanggan_id_pelanggan_fk;
ALTER TABLE IF EXISTS ONLY public.rekonsiliasi_kas DROP CONSTRAINT IF EXISTS rekonsiliasi_kas_id_rekening_rekening_kas_id_fk;
ALTER TABLE IF EXISTS ONLY public.rekonsiliasi_kas DROP CONSTRAINT IF EXISTS rekonsiliasi_kas_created_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.rekonsiliasi_kas DROP CONSTRAINT IF EXISTS rekonsiliasi_kas_approved_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.rekomendasi_pengiriman DROP CONSTRAINT IF EXISTS rekomendasi_pengiriman_dibuat_oleh_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.rekomendasi_pengiriman_detail DROP CONSTRAINT IF EXISTS rekomendasi_pengiriman_detail_id_rekomendasi_rekomendasi_pengir;
ALTER TABLE IF EXISTS ONLY public.rekomendasi_pengiriman_detail DROP CONSTRAINT IF EXISTS rekomendasi_pengiriman_detail_id_cabang_tujuan_cabang_id_cabang;
ALTER TABLE IF EXISTS ONLY public.rekomendasi_pengiriman_detail DROP CONSTRAINT IF EXISTS rekomendasi_pengiriman_detail_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.rekening_kas DROP CONSTRAINT IF EXISTS rekening_kas_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.rekening_kas DROP CONSTRAINT IF EXISTS rekening_kas_id_akun_coa_daftar_akun_id_fk;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_supplier DROP CONSTRAINT IF EXISTS promo_syarat_supplier_id_supplier_supplier_id_supplier_fk;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_supplier DROP CONSTRAINT IF EXISTS promo_syarat_supplier_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_pembelanjaan DROP CONSTRAINT IF EXISTS promo_syarat_pembelanjaan_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_kategori DROP CONSTRAINT IF EXISTS promo_syarat_kategori_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_kategori DROP CONSTRAINT IF EXISTS promo_syarat_kategori_id_kategori_kategori_barang_id_kategori_f;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_beli DROP CONSTRAINT IF EXISTS promo_syarat_beli_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_beli DROP CONSTRAINT IF EXISTS promo_syarat_beli_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_barang_tertentu DROP CONSTRAINT IF EXISTS promo_syarat_barang_tertentu_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_barang_tertentu DROP CONSTRAINT IF EXISTS promo_syarat_barang_tertentu_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.promo_poin_barang DROP CONSTRAINT IF EXISTS promo_poin_barang_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_poin_barang DROP CONSTRAINT IF EXISTS promo_poin_barang_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.promo_hadiah_poin DROP CONSTRAINT IF EXISTS promo_hadiah_poin_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_hadiah_gratis DROP CONSTRAINT IF EXISTS promo_hadiah_gratis_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_hadiah_gratis DROP CONSTRAINT IF EXISTS promo_hadiah_gratis_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.promo_hadiah_diskon DROP CONSTRAINT IF EXISTS promo_hadiah_diskon_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_hadiah_barang DROP CONSTRAINT IF EXISTS promo_hadiah_barang_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_hadiah_barang DROP CONSTRAINT IF EXISTS promo_hadiah_barang_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.promo_diskon_barang DROP CONSTRAINT IF EXISTS promo_diskon_barang_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_diskon_barang DROP CONSTRAINT IF EXISTS promo_diskon_barang_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.promo_cabang DROP CONSTRAINT IF EXISTS promo_cabang_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_cabang DROP CONSTRAINT IF EXISTS promo_cabang_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.promo_barang_tebus_murah DROP CONSTRAINT IF EXISTS promo_barang_tebus_murah_id_promo_promo_id_promo_fk;
ALTER TABLE IF EXISTS ONLY public.promo_barang_tebus_murah DROP CONSTRAINT IF EXISTS promo_barang_tebus_murah_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.pesan_cabang DROP CONSTRAINT IF EXISTS pesan_cabang_id_user_peminta_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.pesan_cabang DROP CONSTRAINT IF EXISTS pesan_cabang_id_cabang_sumber_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.pesan_cabang DROP CONSTRAINT IF EXISTS pesan_cabang_id_cabang_peminta_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.pesan_cabang_detail DROP CONSTRAINT IF EXISTS pesan_cabang_detail_id_request_pesan_cabang_id_request_fk;
ALTER TABLE IF EXISTS ONLY public.pesan_cabang_detail DROP CONSTRAINT IF EXISTS pesan_cabang_detail_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.pesan_beli DROP CONSTRAINT IF EXISTS pesan_beli_id_supplier_supplier_id_supplier_fk;
ALTER TABLE IF EXISTS ONLY public.pesan_beli DROP CONSTRAINT IF EXISTS pesan_beli_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.pesan_beli_detail DROP CONSTRAINT IF EXISTS pesan_beli_detail_id_pesan_beli_pesan_beli_id_pesan_beli_fk;
ALTER TABLE IF EXISTS ONLY public.pesan_beli_detail DROP CONSTRAINT IF EXISTS pesan_beli_detail_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.penjualan DROP CONSTRAINT IF EXISTS penjualan_id_user_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.penjualan DROP CONSTRAINT IF EXISTS penjualan_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.penjualan_detail DROP CONSTRAINT IF EXISTS penjualan_detail_id_penjualan_penjualan_id_penjualan_fk;
ALTER TABLE IF EXISTS ONLY public.penjualan_detail DROP CONSTRAINT IF EXISTS penjualan_detail_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.pengiriman_selisih DROP CONSTRAINT IF EXISTS pengiriman_selisih_id_pengiriman_pengiriman_id_pengiriman_fk;
ALTER TABLE IF EXISTS ONLY public.pengiriman_selisih DROP CONSTRAINT IF EXISTS pengiriman_selisih_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.pengiriman_selisih DROP CONSTRAINT IF EXISTS pengiriman_selisih_disetujui_oleh_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.pengiriman DROP CONSTRAINT IF EXISTS pengiriman_id_user_pengirim_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.pengiriman DROP CONSTRAINT IF EXISTS pengiriman_id_user_penerima_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.pengiriman DROP CONSTRAINT IF EXISTS pengiriman_id_cabang_tujuan_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.pengiriman DROP CONSTRAINT IF EXISTS pengiriman_id_cabang_sumber_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.pengiriman_detail DROP CONSTRAINT IF EXISTS pengiriman_detail_id_request_detail_pesan_cabang_detail_id_fk;
ALTER TABLE IF EXISTS ONLY public.pengiriman_detail DROP CONSTRAINT IF EXISTS pengiriman_detail_id_pengiriman_pengiriman_id_pengiriman_fk;
ALTER TABLE IF EXISTS ONLY public.pengiriman_detail DROP CONSTRAINT IF EXISTS pengiriman_detail_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.kasir_shift DROP CONSTRAINT IF EXISTS kasir_shift_verified_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kasir_shift DROP CONSTRAINT IF EXISTS kasir_shift_id_rekening_rekening_kas_id_fk;
ALTER TABLE IF EXISTS ONLY public.kasir_shift DROP CONSTRAINT IF EXISTS kasir_shift_id_kasir_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kasir_shift DROP CONSTRAINT IF EXISTS kasir_shift_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.kasir_jadwal DROP CONSTRAINT IF EXISTS kasir_jadwal_id_shift_jam_kerja_id_fk;
ALTER TABLE IF EXISTS ONLY public.kasir_jadwal DROP CONSTRAINT IF EXISTS kasir_jadwal_id_kasir_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kasir_jadwal DROP CONSTRAINT IF EXISTS kasir_jadwal_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.kasir_jadwal DROP CONSTRAINT IF EXISTS kasir_jadwal_created_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kas_transaksi DROP CONSTRAINT IF EXISTS kas_transaksi_id_rekening_tujuan_rekening_kas_id_fk;
ALTER TABLE IF EXISTS ONLY public.kas_transaksi DROP CONSTRAINT IF EXISTS kas_transaksi_id_rekening_rekening_kas_id_fk;
ALTER TABLE IF EXISTS ONLY public.kas_transaksi DROP CONSTRAINT IF EXISTS kas_transaksi_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.kas_transaksi DROP CONSTRAINT IF EXISTS kas_transaksi_created_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.kas_transaksi DROP CONSTRAINT IF EXISTS kas_transaksi_approved_by_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.jurnal_umum DROP CONSTRAINT IF EXISTS jurnal_umum_dibuat_oleh_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.jurnal_umum DROP CONSTRAINT IF EXISTS jurnal_umum_cabang_id_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.jurnal_umum DROP CONSTRAINT IF EXISTS jurnal_umum_akun_id_daftar_akun_id_fk;
ALTER TABLE IF EXISTS ONLY public.infaq DROP CONSTRAINT IF EXISTS infaq_id_user_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.infaq DROP CONSTRAINT IF EXISTS infaq_id_penjualan_penjualan_id_penjualan_fk;
ALTER TABLE IF EXISTS ONLY public.infaq DROP CONSTRAINT IF EXISTS infaq_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.forecast_stok DROP CONSTRAINT IF EXISTS forecast_stok_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.forecast_stok DROP CONSTRAINT IF EXISTS forecast_stok_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.faktur_beli DROP CONSTRAINT IF EXISTS faktur_beli_id_supplier_supplier_id_supplier_fk;
ALTER TABLE IF EXISTS ONLY public.faktur_beli DROP CONSTRAINT IF EXISTS faktur_beli_id_po_pesan_beli_id_pesan_beli_fk;
ALTER TABLE IF EXISTS ONLY public.faktur_beli DROP CONSTRAINT IF EXISTS faktur_beli_id_cabang_cabang_id_cabang_fk;
ALTER TABLE IF EXISTS ONLY public.faktur_beli_detail DROP CONSTRAINT IF EXISTS faktur_beli_detail_id_faktur_faktur_beli_id_faktur_fk;
ALTER TABLE IF EXISTS ONLY public.faktur_beli_detail DROP CONSTRAINT IF EXISTS faktur_beli_detail_id_barang_barang_id_barang_fk;
ALTER TABLE IF EXISTS ONLY public.daftar_akun DROP CONSTRAINT IF EXISTS daftar_akun_tipe_akun_id_tipe_akun_id_fk;
ALTER TABLE IF EXISTS ONLY public.bayar_hutang DROP CONSTRAINT IF EXISTS bayar_hutang_id_supplier_supplier_id_supplier_fk;
ALTER TABLE IF EXISTS ONLY public.barang DROP CONSTRAINT IF EXISTS barang_id_supplier_supplier_id_supplier_fk;
ALTER TABLE IF EXISTS ONLY public.barang DROP CONSTRAINT IF EXISTS barang_id_kategori_kategori_barang_id_kategori_fk;
ALTER TABLE IF EXISTS ONLY public.vouchers DROP CONSTRAINT IF EXISTS vouchers_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.tipe_akun DROP CONSTRAINT IF EXISTS tipe_akun_pkey;
ALTER TABLE IF EXISTS ONLY public.supplier DROP CONSTRAINT IF EXISTS supplier_pkey;
ALTER TABLE IF EXISTS ONLY public.stok_setting_cabang DROP CONSTRAINT IF EXISTS stok_setting_cabang_pkey;
ALTER TABLE IF EXISTS ONLY public.stok_barang DROP CONSTRAINT IF EXISTS stok_barang_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_velocity DROP CONSTRAINT IF EXISTS sales_velocity_pkey;
ALTER TABLE IF EXISTS ONLY public.role_menu_sub DROP CONSTRAINT IF EXISTS role_menu_sub_pkey;
ALTER TABLE IF EXISTS ONLY public.role_menu DROP CONSTRAINT IF EXISTS role_menu_pkey;
ALTER TABLE IF EXISTS ONLY public.riwayat_poin DROP CONSTRAINT IF EXISTS riwayat_poin_pkey;
ALTER TABLE IF EXISTS ONLY public.rekonsiliasi_kas DROP CONSTRAINT IF EXISTS rekonsiliasi_kas_pkey;
ALTER TABLE IF EXISTS ONLY public.rekomendasi_pengiriman DROP CONSTRAINT IF EXISTS rekomendasi_pengiriman_pkey;
ALTER TABLE IF EXISTS ONLY public.rekomendasi_pengiriman_detail DROP CONSTRAINT IF EXISTS rekomendasi_pengiriman_detail_pkey;
ALTER TABLE IF EXISTS ONLY public.rekening_kas DROP CONSTRAINT IF EXISTS rekening_kas_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_supplier DROP CONSTRAINT IF EXISTS promo_syarat_supplier_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_pembelanjaan DROP CONSTRAINT IF EXISTS promo_syarat_pembelanjaan_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_kategori DROP CONSTRAINT IF EXISTS promo_syarat_kategori_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_beli DROP CONSTRAINT IF EXISTS promo_syarat_beli_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_syarat_barang_tertentu DROP CONSTRAINT IF EXISTS promo_syarat_barang_tertentu_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_poin_barang DROP CONSTRAINT IF EXISTS promo_poin_barang_pkey;
ALTER TABLE IF EXISTS ONLY public.promo DROP CONSTRAINT IF EXISTS promo_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_hadiah_poin DROP CONSTRAINT IF EXISTS promo_hadiah_poin_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_hadiah_gratis DROP CONSTRAINT IF EXISTS promo_hadiah_gratis_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_hadiah_diskon DROP CONSTRAINT IF EXISTS promo_hadiah_diskon_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_hadiah_barang DROP CONSTRAINT IF EXISTS promo_hadiah_barang_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_diskon_barang DROP CONSTRAINT IF EXISTS promo_diskon_barang_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_cabang DROP CONSTRAINT IF EXISTS promo_cabang_pkey;
ALTER TABLE IF EXISTS ONLY public.promo_barang_tebus_murah DROP CONSTRAINT IF EXISTS promo_barang_tebus_murah_pkey;
ALTER TABLE IF EXISTS ONLY public.pesan_cabang DROP CONSTRAINT IF EXISTS pesan_cabang_pkey;
ALTER TABLE IF EXISTS ONLY public.pesan_cabang_detail DROP CONSTRAINT IF EXISTS pesan_cabang_detail_pkey;
ALTER TABLE IF EXISTS ONLY public.pesan_beli DROP CONSTRAINT IF EXISTS pesan_beli_pkey;
ALTER TABLE IF EXISTS ONLY public.pesan_beli_detail DROP CONSTRAINT IF EXISTS pesan_beli_detail_pkey;
ALTER TABLE IF EXISTS ONLY public.penjualan DROP CONSTRAINT IF EXISTS penjualan_pkey;
ALTER TABLE IF EXISTS ONLY public.penjualan_detail DROP CONSTRAINT IF EXISTS penjualan_detail_pkey;
ALTER TABLE IF EXISTS ONLY public.pengiriman_selisih DROP CONSTRAINT IF EXISTS pengiriman_selisih_pkey;
ALTER TABLE IF EXISTS ONLY public.pengiriman DROP CONSTRAINT IF EXISTS pengiriman_pkey;
ALTER TABLE IF EXISTS ONLY public.pengiriman_detail DROP CONSTRAINT IF EXISTS pengiriman_detail_pkey;
ALTER TABLE IF EXISTS ONLY public.pengaturan_aplikasi DROP CONSTRAINT IF EXISTS pengaturan_aplikasi_pkey;
ALTER TABLE IF EXISTS ONLY public.pelanggan DROP CONSTRAINT IF EXISTS pelanggan_pkey;
ALTER TABLE IF EXISTS ONLY public.menu_sub DROP CONSTRAINT IF EXISTS menu_sub_pkey;
ALTER TABLE IF EXISTS ONLY public.menu_main DROP CONSTRAINT IF EXISTS menu_main_pkey;
ALTER TABLE IF EXISTS ONLY public.login_attempts DROP CONSTRAINT IF EXISTS login_attempts_pkey;
ALTER TABLE IF EXISTS ONLY public.log_login DROP CONSTRAINT IF EXISTS log_login_pkey;
ALTER TABLE IF EXISTS ONLY public.kategori_barang DROP CONSTRAINT IF EXISTS kategori_barang_pkey;
ALTER TABLE IF EXISTS ONLY public.kasir_shift DROP CONSTRAINT IF EXISTS kasir_shift_pkey;
ALTER TABLE IF EXISTS ONLY public.kasir_jadwal DROP CONSTRAINT IF EXISTS kasir_jadwal_pkey;
ALTER TABLE IF EXISTS ONLY public.kas_transaksi DROP CONSTRAINT IF EXISTS kas_transaksi_pkey;
ALTER TABLE IF EXISTS ONLY public.kas_transaksi DROP CONSTRAINT IF EXISTS kas_transaksi_nomor_transaksi_unique;
ALTER TABLE IF EXISTS ONLY public.jurnal_umum DROP CONSTRAINT IF EXISTS jurnal_umum_pkey;
ALTER TABLE IF EXISTS ONLY public.jam_kerja DROP CONSTRAINT IF EXISTS jam_kerja_pkey;
ALTER TABLE IF EXISTS ONLY public.jabatan DROP CONSTRAINT IF EXISTS jabatan_pkey;
ALTER TABLE IF EXISTS ONLY public.izin_cuti DROP CONSTRAINT IF EXISTS izin_cuti_pkey;
ALTER TABLE IF EXISTS ONLY public.infaq DROP CONSTRAINT IF EXISTS infaq_pkey;
ALTER TABLE IF EXISTS ONLY public.hutang_karyawan DROP CONSTRAINT IF EXISTS hutang_karyawan_pkey;
ALTER TABLE IF EXISTS ONLY public.hari_libur DROP CONSTRAINT IF EXISTS hari_libur_pkey;
ALTER TABLE IF EXISTS ONLY public.forecast_stok DROP CONSTRAINT IF EXISTS forecast_stok_pkey;
ALTER TABLE IF EXISTS ONLY public.faktur_beli DROP CONSTRAINT IF EXISTS faktur_beli_pkey;
ALTER TABLE IF EXISTS ONLY public.faktur_beli_detail DROP CONSTRAINT IF EXISTS faktur_beli_detail_pkey;
ALTER TABLE IF EXISTS ONLY public.daftar_gaji_jabatan DROP CONSTRAINT IF EXISTS daftar_gaji_jabatan_pkey;
ALTER TABLE IF EXISTS ONLY public.daftar_akun DROP CONSTRAINT IF EXISTS daftar_akun_pkey;
ALTER TABLE IF EXISTS ONLY public.cabang DROP CONSTRAINT IF EXISTS cabang_pkey;
ALTER TABLE IF EXISTS ONLY public.bisyaroh DROP CONSTRAINT IF EXISTS bisyaroh_pkey;
ALTER TABLE IF EXISTS ONLY public.bayar_hutang DROP CONSTRAINT IF EXISTS bayar_hutang_pkey;
ALTER TABLE IF EXISTS ONLY public.barang DROP CONSTRAINT IF EXISTS barang_pkey;
ALTER TABLE IF EXISTS ONLY public.absensi DROP CONSTRAINT IF EXISTS absensi_pkey;
ALTER TABLE IF EXISTS public.vouchers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tipe_akun ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.supplier ALTER COLUMN id_supplier DROP DEFAULT;
ALTER TABLE IF EXISTS public.stok_setting_cabang ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.stok_barang ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sales_velocity ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.role_menu_sub ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.role_menu ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.riwayat_poin ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rekonsiliasi_kas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rekomendasi_pengiriman_detail ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rekomendasi_pengiriman ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rekening_kas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_syarat_supplier ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_syarat_pembelanjaan ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_syarat_kategori ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_syarat_beli ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_syarat_barang_tertentu ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_poin_barang ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_hadiah_poin ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_hadiah_gratis ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_hadiah_diskon ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_hadiah_barang ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_diskon_barang ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_cabang ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo_barang_tebus_murah ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.promo ALTER COLUMN id_promo DROP DEFAULT;
ALTER TABLE IF EXISTS public.pesan_cabang_detail ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pesan_cabang ALTER COLUMN id_request DROP DEFAULT;
ALTER TABLE IF EXISTS public.pesan_beli_detail ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pesan_beli ALTER COLUMN id_pesan_beli DROP DEFAULT;
ALTER TABLE IF EXISTS public.penjualan_detail ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.penjualan ALTER COLUMN id_penjualan DROP DEFAULT;
ALTER TABLE IF EXISTS public.pengiriman_selisih ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pengiriman_detail ALTER COLUMN id_detail_kirim DROP DEFAULT;
ALTER TABLE IF EXISTS public.pengiriman ALTER COLUMN id_pengiriman DROP DEFAULT;
ALTER TABLE IF EXISTS public.pelanggan ALTER COLUMN id_pelanggan DROP DEFAULT;
ALTER TABLE IF EXISTS public.menu_sub ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.menu_main ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.log_login ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kategori_barang ALTER COLUMN id_kategori DROP DEFAULT;
ALTER TABLE IF EXISTS public.kasir_shift ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kasir_jadwal ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.kas_transaksi ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.jurnal_umum ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.jam_kerja ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.jabatan ALTER COLUMN id_jabatan DROP DEFAULT;
ALTER TABLE IF EXISTS public.izin_cuti ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.infaq ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hutang_karyawan ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hari_libur ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.forecast_stok ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.faktur_beli_detail ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.faktur_beli ALTER COLUMN id_faktur DROP DEFAULT;
ALTER TABLE IF EXISTS public.daftar_gaji_jabatan ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.daftar_akun ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cabang ALTER COLUMN id_cabang DROP DEFAULT;
ALTER TABLE IF EXISTS public.bisyaroh ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.bayar_hutang ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.barang ALTER COLUMN id_barang DROP DEFAULT;
ALTER TABLE IF EXISTS public.absensi ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.vouchers_id_seq;
DROP TABLE IF EXISTS public.vouchers;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.tipe_akun_id_seq;
DROP TABLE IF EXISTS public.tipe_akun;
DROP SEQUENCE IF EXISTS public.supplier_id_supplier_seq;
DROP TABLE IF EXISTS public.supplier;
DROP SEQUENCE IF EXISTS public.stok_setting_cabang_id_seq;
DROP TABLE IF EXISTS public.stok_setting_cabang;
DROP SEQUENCE IF EXISTS public.stok_barang_id_seq;
DROP TABLE IF EXISTS public.stok_barang;
DROP SEQUENCE IF EXISTS public.sales_velocity_id_seq;
DROP TABLE IF EXISTS public.sales_velocity;
DROP SEQUENCE IF EXISTS public.role_menu_sub_id_seq;
DROP TABLE IF EXISTS public.role_menu_sub;
DROP SEQUENCE IF EXISTS public.role_menu_id_seq;
DROP TABLE IF EXISTS public.role_menu;
DROP SEQUENCE IF EXISTS public.riwayat_poin_id_seq;
DROP TABLE IF EXISTS public.riwayat_poin;
DROP SEQUENCE IF EXISTS public.rekonsiliasi_kas_id_seq;
DROP TABLE IF EXISTS public.rekonsiliasi_kas;
DROP SEQUENCE IF EXISTS public.rekomendasi_pengiriman_id_seq;
DROP SEQUENCE IF EXISTS public.rekomendasi_pengiriman_detail_id_seq;
DROP TABLE IF EXISTS public.rekomendasi_pengiriman_detail;
DROP TABLE IF EXISTS public.rekomendasi_pengiriman;
DROP SEQUENCE IF EXISTS public.rekening_kas_id_seq;
DROP TABLE IF EXISTS public.rekening_kas;
DROP SEQUENCE IF EXISTS public.promo_syarat_supplier_id_seq;
DROP TABLE IF EXISTS public.promo_syarat_supplier;
DROP SEQUENCE IF EXISTS public.promo_syarat_pembelanjaan_id_seq;
DROP TABLE IF EXISTS public.promo_syarat_pembelanjaan;
DROP SEQUENCE IF EXISTS public.promo_syarat_kategori_id_seq;
DROP TABLE IF EXISTS public.promo_syarat_kategori;
DROP SEQUENCE IF EXISTS public.promo_syarat_beli_id_seq;
DROP TABLE IF EXISTS public.promo_syarat_beli;
DROP SEQUENCE IF EXISTS public.promo_syarat_barang_tertentu_id_seq;
DROP TABLE IF EXISTS public.promo_syarat_barang_tertentu;
DROP SEQUENCE IF EXISTS public.promo_poin_barang_id_seq;
DROP TABLE IF EXISTS public.promo_poin_barang;
DROP SEQUENCE IF EXISTS public.promo_id_promo_seq;
DROP SEQUENCE IF EXISTS public.promo_hadiah_poin_id_seq;
DROP TABLE IF EXISTS public.promo_hadiah_poin;
DROP SEQUENCE IF EXISTS public.promo_hadiah_gratis_id_seq;
DROP TABLE IF EXISTS public.promo_hadiah_gratis;
DROP SEQUENCE IF EXISTS public.promo_hadiah_diskon_id_seq;
DROP TABLE IF EXISTS public.promo_hadiah_diskon;
DROP SEQUENCE IF EXISTS public.promo_hadiah_barang_id_seq;
DROP TABLE IF EXISTS public.promo_hadiah_barang;
DROP SEQUENCE IF EXISTS public.promo_diskon_barang_id_seq;
DROP TABLE IF EXISTS public.promo_diskon_barang;
DROP SEQUENCE IF EXISTS public.promo_cabang_id_seq;
DROP TABLE IF EXISTS public.promo_cabang;
DROP SEQUENCE IF EXISTS public.promo_barang_tebus_murah_id_seq;
DROP TABLE IF EXISTS public.promo_barang_tebus_murah;
DROP TABLE IF EXISTS public.promo;
DROP SEQUENCE IF EXISTS public.pesan_cabang_id_request_seq;
DROP SEQUENCE IF EXISTS public.pesan_cabang_detail_id_seq;
DROP TABLE IF EXISTS public.pesan_cabang_detail;
DROP TABLE IF EXISTS public.pesan_cabang;
DROP SEQUENCE IF EXISTS public.pesan_beli_id_pesan_beli_seq;
DROP SEQUENCE IF EXISTS public.pesan_beli_detail_id_seq;
DROP TABLE IF EXISTS public.pesan_beli_detail;
DROP TABLE IF EXISTS public.pesan_beli;
DROP SEQUENCE IF EXISTS public.penjualan_id_penjualan_seq;
DROP SEQUENCE IF EXISTS public.penjualan_detail_id_seq;
DROP TABLE IF EXISTS public.penjualan_detail;
DROP TABLE IF EXISTS public.penjualan;
DROP SEQUENCE IF EXISTS public.pengiriman_selisih_id_seq;
DROP TABLE IF EXISTS public.pengiriman_selisih;
DROP SEQUENCE IF EXISTS public.pengiriman_id_pengiriman_seq;
DROP SEQUENCE IF EXISTS public.pengiriman_detail_id_detail_kirim_seq;
DROP TABLE IF EXISTS public.pengiriman_detail;
DROP TABLE IF EXISTS public.pengiriman;
DROP TABLE IF EXISTS public.pengaturan_aplikasi;
DROP SEQUENCE IF EXISTS public.pelanggan_id_pelanggan_seq;
DROP TABLE IF EXISTS public.pelanggan;
DROP SEQUENCE IF EXISTS public.menu_sub_id_seq;
DROP TABLE IF EXISTS public.menu_sub;
DROP SEQUENCE IF EXISTS public.menu_main_id_seq;
DROP TABLE IF EXISTS public.menu_main;
DROP TABLE IF EXISTS public.login_attempts;
DROP SEQUENCE IF EXISTS public.log_login_id_seq;
DROP TABLE IF EXISTS public.log_login;
DROP SEQUENCE IF EXISTS public.kategori_barang_id_kategori_seq;
DROP TABLE IF EXISTS public.kategori_barang;
DROP SEQUENCE IF EXISTS public.kasir_shift_id_seq;
DROP TABLE IF EXISTS public.kasir_shift;
DROP SEQUENCE IF EXISTS public.kasir_jadwal_id_seq;
DROP TABLE IF EXISTS public.kasir_jadwal;
DROP SEQUENCE IF EXISTS public.kas_transaksi_id_seq;
DROP TABLE IF EXISTS public.kas_transaksi;
DROP SEQUENCE IF EXISTS public.jurnal_umum_id_seq;
DROP TABLE IF EXISTS public.jurnal_umum;
DROP SEQUENCE IF EXISTS public.jam_kerja_id_seq;
DROP TABLE IF EXISTS public.jam_kerja;
DROP SEQUENCE IF EXISTS public.jabatan_id_jabatan_seq;
DROP TABLE IF EXISTS public.jabatan;
DROP SEQUENCE IF EXISTS public.izin_cuti_id_seq;
DROP TABLE IF EXISTS public.izin_cuti;
DROP SEQUENCE IF EXISTS public.infaq_id_seq;
DROP TABLE IF EXISTS public.infaq;
DROP SEQUENCE IF EXISTS public.hutang_karyawan_id_seq;
DROP TABLE IF EXISTS public.hutang_karyawan;
DROP SEQUENCE IF EXISTS public.hari_libur_id_seq;
DROP TABLE IF EXISTS public.hari_libur;
DROP SEQUENCE IF EXISTS public.forecast_stok_id_seq;
DROP TABLE IF EXISTS public.forecast_stok;
DROP SEQUENCE IF EXISTS public.faktur_beli_id_faktur_seq;
DROP SEQUENCE IF EXISTS public.faktur_beli_detail_id_seq;
DROP TABLE IF EXISTS public.faktur_beli_detail;
DROP TABLE IF EXISTS public.faktur_beli;
DROP SEQUENCE IF EXISTS public.daftar_gaji_jabatan_id_seq;
DROP TABLE IF EXISTS public.daftar_gaji_jabatan;
DROP SEQUENCE IF EXISTS public.daftar_akun_id_seq;
DROP TABLE IF EXISTS public.daftar_akun;
DROP SEQUENCE IF EXISTS public.cabang_id_cabang_seq;
DROP TABLE IF EXISTS public.cabang;
DROP SEQUENCE IF EXISTS public.bisyaroh_id_seq;
DROP TABLE IF EXISTS public.bisyaroh;
DROP SEQUENCE IF EXISTS public.bayar_hutang_id_seq;
DROP TABLE IF EXISTS public.bayar_hutang;
DROP SEQUENCE IF EXISTS public.barang_id_barang_seq;
DROP TABLE IF EXISTS public.barang;
DROP SEQUENCE IF EXISTS public.absensi_id_seq;
DROP TABLE IF EXISTS public.absensi;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: absensi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.absensi (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tanggal text NOT NULL,
    jam text NOT NULL,
    jenis text NOT NULL,
    shift text,
    latitude text,
    longitude text,
    status_lokasi text DEFAULT 'valid'::text,
    foto_selfie text,
    id_shift integer,
    catatan text,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.absensi OWNER TO postgres;

--
-- Name: absensi_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.absensi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.absensi_id_seq OWNER TO postgres;

--
-- Name: absensi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.absensi_id_seq OWNED BY public.absensi.id;


--
-- Name: barang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.barang (
    id_barang integer NOT NULL,
    barcode text NOT NULL,
    nama_barang text NOT NULL,
    id_kategori integer,
    id_supplier integer,
    satuan_1 text,
    satuan_2 text,
    satuan_3 text,
    isi_1 integer,
    isi_2 integer,
    isi_3 integer,
    harga_beli integer,
    harga_rata integer,
    harga_jual_1_1 integer,
    harga_jual_1_2 integer,
    harga_jual_1_3 integer,
    harga_jual_2_1 integer,
    harga_jual_2_2 integer,
    harga_jual_2_3 integer,
    harga_jual_3_1 integer,
    harga_jual_3_2 integer,
    harga_jual_3_3 integer,
    jual_rugi integer DEFAULT 0,
    status text DEFAULT 'Aktif'::text,
    status_pajak text,
    keterangan_1 text,
    keterangan_2 text
);


ALTER TABLE public.barang OWNER TO postgres;

--
-- Name: barang_id_barang_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.barang_id_barang_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.barang_id_barang_seq OWNER TO postgres;

--
-- Name: barang_id_barang_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.barang_id_barang_seq OWNED BY public.barang.id_barang;


--
-- Name: bayar_hutang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bayar_hutang (
    id integer NOT NULL,
    id_supplier integer NOT NULL,
    tanggal_bayar text NOT NULL,
    jumlah_bayar integer NOT NULL,
    metode_pembayaran text NOT NULL,
    keterangan text,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bayar_hutang OWNER TO postgres;

--
-- Name: bayar_hutang_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bayar_hutang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bayar_hutang_id_seq OWNER TO postgres;

--
-- Name: bayar_hutang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bayar_hutang_id_seq OWNED BY public.bayar_hutang.id;


--
-- Name: bisyaroh; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bisyaroh (
    id integer NOT NULL,
    user_id integer NOT NULL,
    bulan integer NOT NULL,
    tahun integer NOT NULL,
    gaji_pokok integer DEFAULT 0 NOT NULL,
    gaji_per_jam integer DEFAULT 0 NOT NULL,
    lembur_per_jam integer DEFAULT 0 NOT NULL,
    hari_kerja integer DEFAULT 0 NOT NULL,
    total_jam_kerja integer DEFAULT 0 NOT NULL,
    total_jam_lembur integer DEFAULT 0 NOT NULL,
    gaji_kehadiran integer DEFAULT 0 NOT NULL,
    gaji_lembur integer DEFAULT 0 NOT NULL,
    tunjangan integer DEFAULT 0 NOT NULL,
    potongan integer DEFAULT 0 NOT NULL,
    total_diterima integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'Draft'::text,
    tanggal_bayar text,
    catatan text,
    created_at text DEFAULT CURRENT_TIMESTAMP,
    updated_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bisyaroh OWNER TO postgres;

--
-- Name: bisyaroh_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bisyaroh_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bisyaroh_id_seq OWNER TO postgres;

--
-- Name: bisyaroh_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bisyaroh_id_seq OWNED BY public.bisyaroh.id;


--
-- Name: cabang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cabang (
    id_cabang integer NOT NULL,
    kode_cabang text NOT NULL,
    nama_cabang text NOT NULL,
    alamat text NOT NULL,
    telepon text,
    email text,
    admin integer,
    latitude text,
    longitude text,
    data_kode text,
    created_at text DEFAULT CURRENT_TIMESTAMP,
    updated_at text DEFAULT CURRENT_TIMESTAMP,
    is_dc boolean DEFAULT false NOT NULL
);


ALTER TABLE public.cabang OWNER TO postgres;

--
-- Name: cabang_id_cabang_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cabang_id_cabang_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cabang_id_cabang_seq OWNER TO postgres;

--
-- Name: cabang_id_cabang_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cabang_id_cabang_seq OWNED BY public.cabang.id_cabang;


--
-- Name: daftar_akun; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daftar_akun (
    id integer NOT NULL,
    kode_akun text NOT NULL,
    nama_akun text NOT NULL,
    deskripsi text,
    tipe_akun_id integer NOT NULL,
    status text DEFAULT 'Aktif'::text
);


ALTER TABLE public.daftar_akun OWNER TO postgres;

--
-- Name: daftar_akun_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daftar_akun_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daftar_akun_id_seq OWNER TO postgres;

--
-- Name: daftar_akun_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daftar_akun_id_seq OWNED BY public.daftar_akun.id;


--
-- Name: daftar_gaji_jabatan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daftar_gaji_jabatan (
    id integer NOT NULL,
    id_jabatan integer NOT NULL,
    gaji_pokok integer NOT NULL,
    gaji_per_jam integer NOT NULL,
    lembur_per_jam integer DEFAULT 0 NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.daftar_gaji_jabatan OWNER TO postgres;

--
-- Name: daftar_gaji_jabatan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daftar_gaji_jabatan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daftar_gaji_jabatan_id_seq OWNER TO postgres;

--
-- Name: daftar_gaji_jabatan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daftar_gaji_jabatan_id_seq OWNED BY public.daftar_gaji_jabatan.id;


--
-- Name: faktur_beli; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faktur_beli (
    id_faktur integer NOT NULL,
    id_po integer,
    id_cabang integer NOT NULL,
    id_supplier integer NOT NULL,
    tanggal_faktur text NOT NULL,
    nomor_faktur text NOT NULL,
    total_faktur integer NOT NULL,
    diskon_total integer DEFAULT 0,
    ppn_rate integer DEFAULT 0,
    status_pembayaran text DEFAULT 'Belum Dibayar'::text,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.faktur_beli OWNER TO postgres;

--
-- Name: faktur_beli_detail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faktur_beli_detail (
    id integer NOT NULL,
    id_faktur integer NOT NULL,
    id_barang integer NOT NULL,
    jumlah_beli integer NOT NULL,
    harga_satuan integer NOT NULL,
    subtotal integer NOT NULL,
    nama_barang text
);


ALTER TABLE public.faktur_beli_detail OWNER TO postgres;

--
-- Name: faktur_beli_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faktur_beli_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faktur_beli_detail_id_seq OWNER TO postgres;

--
-- Name: faktur_beli_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faktur_beli_detail_id_seq OWNED BY public.faktur_beli_detail.id;


--
-- Name: faktur_beli_id_faktur_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faktur_beli_id_faktur_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faktur_beli_id_faktur_seq OWNER TO postgres;

--
-- Name: faktur_beli_id_faktur_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faktur_beli_id_faktur_seq OWNED BY public.faktur_beli.id_faktur;


--
-- Name: forecast_stok; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forecast_stok (
    id integer NOT NULL,
    id_barang integer NOT NULL,
    id_cabang integer NOT NULL,
    stok_sekarang integer DEFAULT 0 NOT NULL,
    ads integer DEFAULT 0,
    estimasi_habis_hari integer DEFAULT 0,
    tanggal_habis text,
    status text DEFAULT 'AMAN'::text,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.forecast_stok OWNER TO postgres;

--
-- Name: forecast_stok_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.forecast_stok_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.forecast_stok_id_seq OWNER TO postgres;

--
-- Name: forecast_stok_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.forecast_stok_id_seq OWNED BY public.forecast_stok.id;


--
-- Name: hari_libur; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hari_libur (
    id integer NOT NULL,
    tanggal text NOT NULL,
    nama_libur text NOT NULL,
    keterangan text
);


ALTER TABLE public.hari_libur OWNER TO postgres;

--
-- Name: hari_libur_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hari_libur_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hari_libur_id_seq OWNER TO postgres;

--
-- Name: hari_libur_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hari_libur_id_seq OWNED BY public.hari_libur.id;


--
-- Name: hutang_karyawan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hutang_karyawan (
    id integer NOT NULL,
    user_id integer NOT NULL,
    nominal integer NOT NULL,
    tanggal text NOT NULL,
    keterangan text,
    status text DEFAULT 'aktif'::text
);


ALTER TABLE public.hutang_karyawan OWNER TO postgres;

--
-- Name: hutang_karyawan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hutang_karyawan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hutang_karyawan_id_seq OWNER TO postgres;

--
-- Name: hutang_karyawan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hutang_karyawan_id_seq OWNED BY public.hutang_karyawan.id;


--
-- Name: infaq; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.infaq (
    id integer NOT NULL,
    id_penjualan integer,
    no_invoice text NOT NULL,
    jumlah_infaq integer NOT NULL,
    id_cabang integer,
    id_user integer,
    waktu text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.infaq OWNER TO postgres;

--
-- Name: infaq_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.infaq_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.infaq_id_seq OWNER TO postgres;

--
-- Name: infaq_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.infaq_id_seq OWNED BY public.infaq.id;


--
-- Name: izin_cuti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.izin_cuti (
    id integer NOT NULL,
    user_id integer NOT NULL,
    jenis text NOT NULL,
    tanggal_mulai text NOT NULL,
    tanggal_selesai text NOT NULL,
    keterangan text,
    bukti_file text,
    status text DEFAULT 'pending'::text,
    tanggal_pengajuan text DEFAULT CURRENT_TIMESTAMP,
    tanggal_approval text,
    approver_id integer,
    catatan_approval text
);


ALTER TABLE public.izin_cuti OWNER TO postgres;

--
-- Name: izin_cuti_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.izin_cuti_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.izin_cuti_id_seq OWNER TO postgres;

--
-- Name: izin_cuti_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.izin_cuti_id_seq OWNED BY public.izin_cuti.id;


--
-- Name: jabatan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jabatan (
    id_jabatan integer NOT NULL,
    jabatan text NOT NULL
);


ALTER TABLE public.jabatan OWNER TO postgres;

--
-- Name: jabatan_id_jabatan_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jabatan_id_jabatan_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jabatan_id_jabatan_seq OWNER TO postgres;

--
-- Name: jabatan_id_jabatan_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jabatan_id_jabatan_seq OWNED BY public.jabatan.id_jabatan;


--
-- Name: jam_kerja; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jam_kerja (
    id integer NOT NULL,
    nama_shift text NOT NULL,
    jam_masuk text NOT NULL,
    jam_masuk_batas_akhir text NOT NULL,
    jam_pulang text NOT NULL,
    jam_pulang_batas_awal text NOT NULL,
    keterangan text
);


ALTER TABLE public.jam_kerja OWNER TO postgres;

--
-- Name: jam_kerja_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jam_kerja_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jam_kerja_id_seq OWNER TO postgres;

--
-- Name: jam_kerja_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jam_kerja_id_seq OWNED BY public.jam_kerja.id;


--
-- Name: jurnal_umum; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jurnal_umum (
    id integer NOT NULL,
    tanggal_transaksi text NOT NULL,
    no_referensi_bukti text NOT NULL,
    deskripsi text NOT NULL,
    akun_id integer NOT NULL,
    cabang_id integer NOT NULL,
    debit integer DEFAULT 0 NOT NULL,
    kredit integer DEFAULT 0 NOT NULL,
    dibuat_oleh integer,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.jurnal_umum OWNER TO postgres;

--
-- Name: jurnal_umum_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jurnal_umum_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jurnal_umum_id_seq OWNER TO postgres;

--
-- Name: jurnal_umum_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jurnal_umum_id_seq OWNED BY public.jurnal_umum.id;


--
-- Name: kas_transaksi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kas_transaksi (
    id integer NOT NULL,
    nomor_transaksi text NOT NULL,
    id_rekening integer NOT NULL,
    id_cabang integer NOT NULL,
    tipe text NOT NULL,
    kategori text,
    nominal integer NOT NULL,
    tanggal text NOT NULL,
    keterangan text,
    referensi_type text,
    referensi_id integer,
    id_rekening_tujuan integer,
    bukti text,
    status text DEFAULT 'APPROVED'::text,
    id_jurnal integer,
    created_by integer,
    approved_by integer,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.kas_transaksi OWNER TO postgres;

--
-- Name: kas_transaksi_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kas_transaksi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kas_transaksi_id_seq OWNER TO postgres;

--
-- Name: kas_transaksi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kas_transaksi_id_seq OWNED BY public.kas_transaksi.id;


--
-- Name: kasir_jadwal; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kasir_jadwal (
    id integer NOT NULL,
    id_cabang integer NOT NULL,
    id_kasir integer NOT NULL,
    id_shift integer NOT NULL,
    tanggal text NOT NULL,
    catatan text,
    aktif boolean DEFAULT true NOT NULL,
    created_by integer,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.kasir_jadwal OWNER TO postgres;

--
-- Name: kasir_jadwal_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kasir_jadwal_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kasir_jadwal_id_seq OWNER TO postgres;

--
-- Name: kasir_jadwal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kasir_jadwal_id_seq OWNED BY public.kasir_jadwal.id;


--
-- Name: kasir_shift; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kasir_shift (
    id integer NOT NULL,
    id_cabang integer NOT NULL,
    id_kasir integer NOT NULL,
    id_rekening integer NOT NULL,
    waktu_buka text NOT NULL,
    waktu_tutup text,
    saldo_awal integer DEFAULT 0 NOT NULL,
    total_sistem integer DEFAULT 0,
    total_tunai integer DEFAULT 0,
    total_transfer integer DEFAULT 0,
    uang_fisik integer,
    selisih integer,
    setoran integer DEFAULT 0,
    catatan text,
    status text DEFAULT 'OPEN'::text,
    verified_by integer,
    verified_at text,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.kasir_shift OWNER TO postgres;

--
-- Name: kasir_shift_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kasir_shift_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kasir_shift_id_seq OWNER TO postgres;

--
-- Name: kasir_shift_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kasir_shift_id_seq OWNED BY public.kasir_shift.id;


--
-- Name: kategori_barang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kategori_barang (
    id_kategori integer NOT NULL,
    kode_kategori text NOT NULL,
    nama_kategori text NOT NULL
);


ALTER TABLE public.kategori_barang OWNER TO postgres;

--
-- Name: kategori_barang_id_kategori_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kategori_barang_id_kategori_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kategori_barang_id_kategori_seq OWNER TO postgres;

--
-- Name: kategori_barang_id_kategori_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kategori_barang_id_kategori_seq OWNED BY public.kategori_barang.id_kategori;


--
-- Name: log_login; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log_login (
    id integer NOT NULL,
    user_id integer,
    waktu text NOT NULL,
    status text NOT NULL,
    ip_address text
);


ALTER TABLE public.log_login OWNER TO postgres;

--
-- Name: log_login_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.log_login_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.log_login_id_seq OWNER TO postgres;

--
-- Name: log_login_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.log_login_id_seq OWNED BY public.log_login.id;


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_attempts (
    identifier text NOT NULL,
    attempts integer DEFAULT 1 NOT NULL,
    last_attempt text NOT NULL
);


ALTER TABLE public.login_attempts OWNER TO postgres;

--
-- Name: menu_main; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_main (
    id integer NOT NULL,
    nama text NOT NULL,
    link text DEFAULT '#'::text NOT NULL,
    icon text,
    urutan integer DEFAULT 0,
    aktif boolean DEFAULT true
);


ALTER TABLE public.menu_main OWNER TO postgres;

--
-- Name: menu_main_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.menu_main_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_main_id_seq OWNER TO postgres;

--
-- Name: menu_main_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.menu_main_id_seq OWNED BY public.menu_main.id;


--
-- Name: menu_sub; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.menu_sub (
    id integer NOT NULL,
    id_menu_main integer NOT NULL,
    nama text NOT NULL,
    link text NOT NULL,
    urutan integer DEFAULT 0,
    aktif boolean DEFAULT true
);


ALTER TABLE public.menu_sub OWNER TO postgres;

--
-- Name: menu_sub_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.menu_sub_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_sub_id_seq OWNER TO postgres;

--
-- Name: menu_sub_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.menu_sub_id_seq OWNED BY public.menu_sub.id;


--
-- Name: pelanggan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pelanggan (
    id_pelanggan integer NOT NULL,
    kode_pelanggan text NOT NULL,
    nama_lengkap text NOT NULL,
    email text,
    alamat text,
    telepon text,
    level_harga integer DEFAULT 1,
    total_poin integer DEFAULT 0
);


ALTER TABLE public.pelanggan OWNER TO postgres;

--
-- Name: pelanggan_id_pelanggan_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pelanggan_id_pelanggan_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pelanggan_id_pelanggan_seq OWNER TO postgres;

--
-- Name: pelanggan_id_pelanggan_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pelanggan_id_pelanggan_seq OWNED BY public.pelanggan.id_pelanggan;


--
-- Name: pengaturan_aplikasi; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengaturan_aplikasi (
    key text NOT NULL,
    value text NOT NULL,
    updated_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pengaturan_aplikasi OWNER TO postgres;

--
-- Name: pengiriman; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengiriman (
    id_pengiriman integer NOT NULL,
    kode_pengiriman text NOT NULL,
    id_cabang_sumber integer NOT NULL,
    id_cabang_tujuan integer NOT NULL,
    id_user_pengirim integer NOT NULL,
    id_user_penerima integer,
    jenis_pengiriman text DEFAULT 'CABANG'::text,
    id_rekomendasi integer,
    armada text,
    driver text,
    status text DEFAULT 'Draft'::text,
    tanggal_kirim text NOT NULL,
    tanggal_terima text,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pengiriman OWNER TO postgres;

--
-- Name: pengiriman_detail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengiriman_detail (
    id_detail_kirim integer NOT NULL,
    id_pengiriman integer NOT NULL,
    id_barang integer NOT NULL,
    jumlah_dikirim integer NOT NULL,
    jumlah_diterima integer,
    id_request_detail integer,
    status_selisih text,
    catatan_penerima text
);


ALTER TABLE public.pengiriman_detail OWNER TO postgres;

--
-- Name: pengiriman_detail_id_detail_kirim_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengiriman_detail_id_detail_kirim_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengiriman_detail_id_detail_kirim_seq OWNER TO postgres;

--
-- Name: pengiriman_detail_id_detail_kirim_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengiriman_detail_id_detail_kirim_seq OWNED BY public.pengiriman_detail.id_detail_kirim;


--
-- Name: pengiriman_id_pengiriman_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengiriman_id_pengiriman_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengiriman_id_pengiriman_seq OWNER TO postgres;

--
-- Name: pengiriman_id_pengiriman_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengiriman_id_pengiriman_seq OWNED BY public.pengiriman.id_pengiriman;


--
-- Name: pengiriman_selisih; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pengiriman_selisih (
    id integer NOT NULL,
    id_pengiriman integer NOT NULL,
    id_barang integer NOT NULL,
    jumlah_dikirim integer NOT NULL,
    jumlah_diterima integer NOT NULL,
    selisih integer NOT NULL,
    jenis_selisih text NOT NULL,
    alasan text,
    foto_bukti text,
    status text DEFAULT 'MENUNGGU_PEMERIKSAAN'::text,
    dibuat_oleh text,
    disetujui_oleh integer,
    created_at text DEFAULT CURRENT_TIMESTAMP,
    updated_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pengiriman_selisih OWNER TO postgres;

--
-- Name: pengiriman_selisih_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pengiriman_selisih_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pengiriman_selisih_id_seq OWNER TO postgres;

--
-- Name: pengiriman_selisih_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pengiriman_selisih_id_seq OWNED BY public.pengiriman_selisih.id;


--
-- Name: penjualan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.penjualan (
    id_penjualan integer NOT NULL,
    no_invoice text NOT NULL,
    tanggal_invoice text NOT NULL,
    jam_invoice text NOT NULL,
    id_pelanggan integer,
    nama_pelanggan text,
    id_user integer,
    id_cabang integer,
    subtotal integer NOT NULL,
    diskon integer DEFAULT 0,
    nominal_voucher integer DEFAULT 0,
    potongan_poin integer DEFAULT 0,
    infaq integer DEFAULT 0,
    total_akhir integer NOT NULL,
    jenis_pembayaran text NOT NULL,
    jumlah_bayar integer DEFAULT 0,
    id_voucher integer,
    poin_didapat integer DEFAULT 0,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.penjualan OWNER TO postgres;

--
-- Name: penjualan_detail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.penjualan_detail (
    id integer NOT NULL,
    id_penjualan integer,
    id_barang integer,
    nama_barang text NOT NULL,
    jumlah integer NOT NULL,
    satuan text NOT NULL,
    isi_satuan integer NOT NULL,
    harga_jual integer NOT NULL,
    harga_rata_saat_transaksi integer NOT NULL,
    diskon integer DEFAULT 0,
    subtotal integer NOT NULL,
    jenis_item text DEFAULT 'TRANSAKSI'::text
);


ALTER TABLE public.penjualan_detail OWNER TO postgres;

--
-- Name: penjualan_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.penjualan_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.penjualan_detail_id_seq OWNER TO postgres;

--
-- Name: penjualan_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.penjualan_detail_id_seq OWNED BY public.penjualan_detail.id;


--
-- Name: penjualan_id_penjualan_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.penjualan_id_penjualan_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.penjualan_id_penjualan_seq OWNER TO postgres;

--
-- Name: penjualan_id_penjualan_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.penjualan_id_penjualan_seq OWNED BY public.penjualan.id_penjualan;


--
-- Name: pesan_beli; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pesan_beli (
    id_pesan_beli integer NOT NULL,
    id_cabang integer NOT NULL,
    id_supplier integer NOT NULL,
    tanggal_pesan_beli text NOT NULL,
    nomor_pesan_beli text NOT NULL,
    keterangan text,
    total_harga_pesan_beli integer NOT NULL,
    status text DEFAULT 'PENDING'::text,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pesan_beli OWNER TO postgres;

--
-- Name: pesan_beli_detail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pesan_beli_detail (
    id integer NOT NULL,
    id_pesan_beli integer NOT NULL,
    id_barang integer NOT NULL,
    nama_barang text NOT NULL,
    jumlah_barang integer NOT NULL,
    harga_satuan integer NOT NULL,
    subtotal integer NOT NULL,
    jumlah_diterima integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.pesan_beli_detail OWNER TO postgres;

--
-- Name: pesan_beli_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pesan_beli_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pesan_beli_detail_id_seq OWNER TO postgres;

--
-- Name: pesan_beli_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pesan_beli_detail_id_seq OWNED BY public.pesan_beli_detail.id;


--
-- Name: pesan_beli_id_pesan_beli_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pesan_beli_id_pesan_beli_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pesan_beli_id_pesan_beli_seq OWNER TO postgres;

--
-- Name: pesan_beli_id_pesan_beli_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pesan_beli_id_pesan_beli_seq OWNED BY public.pesan_beli.id_pesan_beli;


--
-- Name: pesan_cabang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pesan_cabang (
    id_request integer NOT NULL,
    kode_request text NOT NULL,
    id_cabang_peminta integer NOT NULL,
    id_cabang_sumber integer NOT NULL,
    id_user_peminta integer NOT NULL,
    status text DEFAULT 'Pending'::text,
    tanggal_request text NOT NULL,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pesan_cabang OWNER TO postgres;

--
-- Name: pesan_cabang_detail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pesan_cabang_detail (
    id integer NOT NULL,
    id_request integer NOT NULL,
    id_barang integer NOT NULL,
    id_satuan integer,
    jumlah_diminta integer NOT NULL,
    status_item text DEFAULT 'Diproses'::text
);


ALTER TABLE public.pesan_cabang_detail OWNER TO postgres;

--
-- Name: pesan_cabang_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pesan_cabang_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pesan_cabang_detail_id_seq OWNER TO postgres;

--
-- Name: pesan_cabang_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pesan_cabang_detail_id_seq OWNED BY public.pesan_cabang_detail.id;


--
-- Name: pesan_cabang_id_request_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pesan_cabang_id_request_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pesan_cabang_id_request_seq OWNER TO postgres;

--
-- Name: pesan_cabang_id_request_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pesan_cabang_id_request_seq OWNED BY public.pesan_cabang.id_request;


--
-- Name: promo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo (
    id_promo integer NOT NULL,
    nama_promo text NOT NULL,
    tipe_promo text NOT NULL,
    deskripsi text,
    berlaku_untuk text NOT NULL,
    tanggal_mulai text NOT NULL,
    tanggal_selesai text NOT NULL,
    status text DEFAULT 'Aktif'::text NOT NULL,
    berlaku_kelipatan integer DEFAULT 0 NOT NULL,
    created_by integer,
    updated_by integer,
    id_cabang_pembuat integer,
    created_at text DEFAULT CURRENT_TIMESTAMP,
    updated_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.promo OWNER TO postgres;

--
-- Name: promo_barang_tebus_murah; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_barang_tebus_murah (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    id_barang integer NOT NULL,
    jumlah integer NOT NULL,
    id_satuan integer NOT NULL,
    harga_tebus integer NOT NULL
);


ALTER TABLE public.promo_barang_tebus_murah OWNER TO postgres;

--
-- Name: promo_barang_tebus_murah_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_barang_tebus_murah_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_barang_tebus_murah_id_seq OWNER TO postgres;

--
-- Name: promo_barang_tebus_murah_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_barang_tebus_murah_id_seq OWNED BY public.promo_barang_tebus_murah.id;


--
-- Name: promo_cabang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_cabang (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    id_cabang integer NOT NULL
);


ALTER TABLE public.promo_cabang OWNER TO postgres;

--
-- Name: promo_cabang_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_cabang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_cabang_id_seq OWNER TO postgres;

--
-- Name: promo_cabang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_cabang_id_seq OWNED BY public.promo_cabang.id;


--
-- Name: promo_diskon_barang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_diskon_barang (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    id_barang integer NOT NULL,
    jumlah integer NOT NULL,
    id_satuan integer NOT NULL,
    jenis_diskon text NOT NULL,
    nilai_diskon integer NOT NULL,
    berlaku_kelipatan integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.promo_diskon_barang OWNER TO postgres;

--
-- Name: promo_diskon_barang_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_diskon_barang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_diskon_barang_id_seq OWNER TO postgres;

--
-- Name: promo_diskon_barang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_diskon_barang_id_seq OWNED BY public.promo_diskon_barang.id;


--
-- Name: promo_hadiah_barang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_hadiah_barang (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    id_barang integer NOT NULL,
    jumlah integer NOT NULL,
    id_satuan integer NOT NULL
);


ALTER TABLE public.promo_hadiah_barang OWNER TO postgres;

--
-- Name: promo_hadiah_barang_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_hadiah_barang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_hadiah_barang_id_seq OWNER TO postgres;

--
-- Name: promo_hadiah_barang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_hadiah_barang_id_seq OWNED BY public.promo_hadiah_barang.id;


--
-- Name: promo_hadiah_diskon; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_hadiah_diskon (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    jenis_diskon text NOT NULL,
    nilai_diskon integer NOT NULL
);


ALTER TABLE public.promo_hadiah_diskon OWNER TO postgres;

--
-- Name: promo_hadiah_diskon_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_hadiah_diskon_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_hadiah_diskon_id_seq OWNER TO postgres;

--
-- Name: promo_hadiah_diskon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_hadiah_diskon_id_seq OWNED BY public.promo_hadiah_diskon.id;


--
-- Name: promo_hadiah_gratis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_hadiah_gratis (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    id_barang integer NOT NULL,
    jumlah integer NOT NULL,
    id_satuan integer NOT NULL
);


ALTER TABLE public.promo_hadiah_gratis OWNER TO postgres;

--
-- Name: promo_hadiah_gratis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_hadiah_gratis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_hadiah_gratis_id_seq OWNER TO postgres;

--
-- Name: promo_hadiah_gratis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_hadiah_gratis_id_seq OWNED BY public.promo_hadiah_gratis.id;


--
-- Name: promo_hadiah_poin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_hadiah_poin (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    jumlah_poin integer NOT NULL
);


ALTER TABLE public.promo_hadiah_poin OWNER TO postgres;

--
-- Name: promo_hadiah_poin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_hadiah_poin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_hadiah_poin_id_seq OWNER TO postgres;

--
-- Name: promo_hadiah_poin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_hadiah_poin_id_seq OWNED BY public.promo_hadiah_poin.id;


--
-- Name: promo_id_promo_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_id_promo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_id_promo_seq OWNER TO postgres;

--
-- Name: promo_id_promo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_id_promo_seq OWNED BY public.promo.id_promo;


--
-- Name: promo_poin_barang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_poin_barang (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    id_barang integer NOT NULL,
    jumlah_barang integer NOT NULL,
    id_satuan integer NOT NULL,
    jumlah_poin integer NOT NULL,
    berlaku_kelipatan integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.promo_poin_barang OWNER TO postgres;

--
-- Name: promo_poin_barang_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_poin_barang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_poin_barang_id_seq OWNER TO postgres;

--
-- Name: promo_poin_barang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_poin_barang_id_seq OWNED BY public.promo_poin_barang.id;


--
-- Name: promo_syarat_barang_tertentu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_syarat_barang_tertentu (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    id_barang integer NOT NULL
);


ALTER TABLE public.promo_syarat_barang_tertentu OWNER TO postgres;

--
-- Name: promo_syarat_barang_tertentu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_syarat_barang_tertentu_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_syarat_barang_tertentu_id_seq OWNER TO postgres;

--
-- Name: promo_syarat_barang_tertentu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_syarat_barang_tertentu_id_seq OWNED BY public.promo_syarat_barang_tertentu.id;


--
-- Name: promo_syarat_beli; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_syarat_beli (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    id_barang integer NOT NULL,
    jumlah integer NOT NULL,
    id_satuan integer NOT NULL
);


ALTER TABLE public.promo_syarat_beli OWNER TO postgres;

--
-- Name: promo_syarat_beli_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_syarat_beli_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_syarat_beli_id_seq OWNER TO postgres;

--
-- Name: promo_syarat_beli_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_syarat_beli_id_seq OWNED BY public.promo_syarat_beli.id;


--
-- Name: promo_syarat_kategori; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_syarat_kategori (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    id_kategori integer NOT NULL
);


ALTER TABLE public.promo_syarat_kategori OWNER TO postgres;

--
-- Name: promo_syarat_kategori_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_syarat_kategori_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_syarat_kategori_id_seq OWNER TO postgres;

--
-- Name: promo_syarat_kategori_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_syarat_kategori_id_seq OWNED BY public.promo_syarat_kategori.id;


--
-- Name: promo_syarat_pembelanjaan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_syarat_pembelanjaan (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    minimum_pembelanjaan integer NOT NULL,
    berlaku_kelipatan integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.promo_syarat_pembelanjaan OWNER TO postgres;

--
-- Name: promo_syarat_pembelanjaan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_syarat_pembelanjaan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_syarat_pembelanjaan_id_seq OWNER TO postgres;

--
-- Name: promo_syarat_pembelanjaan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_syarat_pembelanjaan_id_seq OWNED BY public.promo_syarat_pembelanjaan.id;


--
-- Name: promo_syarat_supplier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_syarat_supplier (
    id integer NOT NULL,
    id_promo integer NOT NULL,
    id_supplier integer NOT NULL
);


ALTER TABLE public.promo_syarat_supplier OWNER TO postgres;

--
-- Name: promo_syarat_supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_syarat_supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_syarat_supplier_id_seq OWNER TO postgres;

--
-- Name: promo_syarat_supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_syarat_supplier_id_seq OWNED BY public.promo_syarat_supplier.id;


--
-- Name: rekening_kas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rekening_kas (
    id integer NOT NULL,
    kode text NOT NULL,
    nama text NOT NULL,
    jenis text NOT NULL,
    id_cabang integer NOT NULL,
    saldo_awal integer DEFAULT 0 NOT NULL,
    saldo integer DEFAULT 0 NOT NULL,
    id_akun_coa integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at text DEFAULT CURRENT_TIMESTAMP,
    updated_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rekening_kas OWNER TO postgres;

--
-- Name: rekening_kas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rekening_kas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rekening_kas_id_seq OWNER TO postgres;

--
-- Name: rekening_kas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rekening_kas_id_seq OWNED BY public.rekening_kas.id;


--
-- Name: rekomendasi_pengiriman; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rekomendasi_pengiriman (
    id integer NOT NULL,
    kode_rekomendasi text NOT NULL,
    tanggal_rekomendasi text NOT NULL,
    status text DEFAULT 'DRAFT'::text,
    dibuat_oleh integer,
    catatan text,
    created_at text DEFAULT CURRENT_TIMESTAMP,
    updated_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rekomendasi_pengiriman OWNER TO postgres;

--
-- Name: rekomendasi_pengiriman_detail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rekomendasi_pengiriman_detail (
    id integer NOT NULL,
    id_rekomendasi integer NOT NULL,
    id_barang integer NOT NULL,
    id_cabang_tujuan integer NOT NULL,
    stok_sekarang integer DEFAULT 0 NOT NULL,
    ads integer DEFAULT 0,
    qty_rekomendasi integer DEFAULT 0 NOT NULL,
    target_stock integer DEFAULT 0 NOT NULL,
    prioritas_score integer DEFAULT 0,
    qty_approved integer
);


ALTER TABLE public.rekomendasi_pengiriman_detail OWNER TO postgres;

--
-- Name: rekomendasi_pengiriman_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rekomendasi_pengiriman_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rekomendasi_pengiriman_detail_id_seq OWNER TO postgres;

--
-- Name: rekomendasi_pengiriman_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rekomendasi_pengiriman_detail_id_seq OWNED BY public.rekomendasi_pengiriman_detail.id;


--
-- Name: rekomendasi_pengiriman_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rekomendasi_pengiriman_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rekomendasi_pengiriman_id_seq OWNER TO postgres;

--
-- Name: rekomendasi_pengiriman_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rekomendasi_pengiriman_id_seq OWNED BY public.rekomendasi_pengiriman.id;


--
-- Name: rekonsiliasi_kas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rekonsiliasi_kas (
    id integer NOT NULL,
    id_rekening integer NOT NULL,
    tanggal text NOT NULL,
    saldo_sistem integer NOT NULL,
    saldo_fisik integer NOT NULL,
    selisih integer NOT NULL,
    alasan text,
    bukti text,
    status text DEFAULT 'PENDING'::text,
    approved_by integer,
    approved_at text,
    created_by integer,
    created_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.rekonsiliasi_kas OWNER TO postgres;

--
-- Name: rekonsiliasi_kas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rekonsiliasi_kas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rekonsiliasi_kas_id_seq OWNER TO postgres;

--
-- Name: rekonsiliasi_kas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rekonsiliasi_kas_id_seq OWNED BY public.rekonsiliasi_kas.id;


--
-- Name: riwayat_poin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.riwayat_poin (
    id integer NOT NULL,
    id_pelanggan integer,
    jenis_transaksi text NOT NULL,
    jumlah_poin integer NOT NULL,
    keterangan text,
    id_referensi_transaksi text,
    waktu text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.riwayat_poin OWNER TO postgres;

--
-- Name: riwayat_poin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.riwayat_poin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.riwayat_poin_id_seq OWNER TO postgres;

--
-- Name: riwayat_poin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.riwayat_poin_id_seq OWNED BY public.riwayat_poin.id;


--
-- Name: role_menu; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_menu (
    id integer NOT NULL,
    id_jabatan integer NOT NULL,
    id_menu_main integer NOT NULL,
    aktif boolean DEFAULT true,
    can_create boolean DEFAULT false,
    can_read boolean DEFAULT true,
    can_update boolean DEFAULT false,
    can_delete boolean DEFAULT false
);


ALTER TABLE public.role_menu OWNER TO postgres;

--
-- Name: role_menu_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_menu_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_menu_id_seq OWNER TO postgres;

--
-- Name: role_menu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_menu_id_seq OWNED BY public.role_menu.id;


--
-- Name: role_menu_sub; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_menu_sub (
    id integer NOT NULL,
    id_jabatan integer NOT NULL,
    id_menu_sub integer NOT NULL,
    aktif boolean DEFAULT true,
    can_create boolean DEFAULT false,
    can_read boolean DEFAULT true,
    can_update boolean DEFAULT false,
    can_delete boolean DEFAULT false
);


ALTER TABLE public.role_menu_sub OWNER TO postgres;

--
-- Name: role_menu_sub_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.role_menu_sub_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_menu_sub_id_seq OWNER TO postgres;

--
-- Name: role_menu_sub_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.role_menu_sub_id_seq OWNED BY public.role_menu_sub.id;


--
-- Name: sales_velocity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales_velocity (
    id integer NOT NULL,
    id_barang integer NOT NULL,
    id_cabang integer NOT NULL,
    ads_7 integer DEFAULT 0,
    ads_30 integer DEFAULT 0,
    ads_90 integer DEFAULT 0,
    last_calculated text,
    created_at text DEFAULT CURRENT_TIMESTAMP,
    updated_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sales_velocity OWNER TO postgres;

--
-- Name: sales_velocity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sales_velocity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_velocity_id_seq OWNER TO postgres;

--
-- Name: sales_velocity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sales_velocity_id_seq OWNED BY public.sales_velocity.id;


--
-- Name: stok_barang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stok_barang (
    id integer NOT NULL,
    id_barang integer,
    id_cabang integer,
    stok_akhir integer DEFAULT 0,
    penjualan integer DEFAULT 0,
    transfer_masuk integer DEFAULT 0,
    transfer_keluar integer DEFAULT 0,
    posisi_rak text,
    minimal_stok integer DEFAULT 0,
    maksimal_stok integer DEFAULT 0
);


ALTER TABLE public.stok_barang OWNER TO postgres;

--
-- Name: stok_barang_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stok_barang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stok_barang_id_seq OWNER TO postgres;

--
-- Name: stok_barang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stok_barang_id_seq OWNED BY public.stok_barang.id;


--
-- Name: stok_setting_cabang; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stok_setting_cabang (
    id integer NOT NULL,
    id_barang integer NOT NULL,
    id_cabang integer NOT NULL,
    minimum_stock integer DEFAULT 0 NOT NULL,
    safety_stock integer DEFAULT 0 NOT NULL,
    target_days_stock integer DEFAULT 14 NOT NULL,
    lead_time_days integer DEFAULT 2 NOT NULL,
    created_at text DEFAULT CURRENT_TIMESTAMP,
    updated_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.stok_setting_cabang OWNER TO postgres;

--
-- Name: stok_setting_cabang_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stok_setting_cabang_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stok_setting_cabang_id_seq OWNER TO postgres;

--
-- Name: stok_setting_cabang_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stok_setting_cabang_id_seq OWNED BY public.stok_setting_cabang.id;


--
-- Name: supplier; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier (
    id_supplier integer NOT NULL,
    nama_supplier text NOT NULL,
    alamat text,
    telepon text,
    email text,
    bank text,
    no_rek_bank text,
    hari_kunjungan text,
    periode_kunjungan text,
    hutang integer DEFAULT 0,
    status_pajak text,
    npwp text,
    keterangan_1 text,
    keterangan_2 text
);


ALTER TABLE public.supplier OWNER TO postgres;

--
-- Name: supplier_id_supplier_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplier_id_supplier_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_id_supplier_seq OWNER TO postgres;

--
-- Name: supplier_id_supplier_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplier_id_supplier_seq OWNED BY public.supplier.id_supplier;


--
-- Name: tipe_akun; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipe_akun (
    id integer NOT NULL,
    nama text NOT NULL,
    posisi_saldo_normal text NOT NULL
);


ALTER TABLE public.tipe_akun OWNER TO postgres;

--
-- Name: tipe_akun_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipe_akun_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipe_akun_id_seq OWNER TO postgres;

--
-- Name: tipe_akun_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipe_akun_id_seq OWNED BY public.tipe_akun.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    kode_user text NOT NULL,
    nama_user text NOT NULL,
    tempat_lahir text,
    tanggal_lahir text,
    no_ktp text,
    pendidikan_terakhir text,
    riwayat_lembaga text,
    riwayat_pekerjaan text,
    status text DEFAULT 'Kontrak'::text,
    no_hp text NOT NULL,
    foto text,
    password text NOT NULL,
    id_jabatan integer,
    id_cabang integer,
    tanggal_masuk text,
    refresh_token text,
    refresh_token_expires text,
    updated_at text DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vouchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vouchers (
    id integer NOT NULL,
    kode_voucher text NOT NULL,
    nilai integer NOT NULL,
    status text DEFAULT 'AKTIF'::text
);


ALTER TABLE public.vouchers OWNER TO postgres;

--
-- Name: vouchers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vouchers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vouchers_id_seq OWNER TO postgres;

--
-- Name: vouchers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vouchers_id_seq OWNED BY public.vouchers.id;


--
-- Name: absensi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi ALTER COLUMN id SET DEFAULT nextval('public.absensi_id_seq'::regclass);


--
-- Name: barang id_barang; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barang ALTER COLUMN id_barang SET DEFAULT nextval('public.barang_id_barang_seq'::regclass);


--
-- Name: bayar_hutang id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bayar_hutang ALTER COLUMN id SET DEFAULT nextval('public.bayar_hutang_id_seq'::regclass);


--
-- Name: bisyaroh id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bisyaroh ALTER COLUMN id SET DEFAULT nextval('public.bisyaroh_id_seq'::regclass);


--
-- Name: cabang id_cabang; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabang ALTER COLUMN id_cabang SET DEFAULT nextval('public.cabang_id_cabang_seq'::regclass);


--
-- Name: daftar_akun id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daftar_akun ALTER COLUMN id SET DEFAULT nextval('public.daftar_akun_id_seq'::regclass);


--
-- Name: daftar_gaji_jabatan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daftar_gaji_jabatan ALTER COLUMN id SET DEFAULT nextval('public.daftar_gaji_jabatan_id_seq'::regclass);


--
-- Name: faktur_beli id_faktur; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faktur_beli ALTER COLUMN id_faktur SET DEFAULT nextval('public.faktur_beli_id_faktur_seq'::regclass);


--
-- Name: faktur_beli_detail id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faktur_beli_detail ALTER COLUMN id SET DEFAULT nextval('public.faktur_beli_detail_id_seq'::regclass);


--
-- Name: forecast_stok id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forecast_stok ALTER COLUMN id SET DEFAULT nextval('public.forecast_stok_id_seq'::regclass);


--
-- Name: hari_libur id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hari_libur ALTER COLUMN id SET DEFAULT nextval('public.hari_libur_id_seq'::regclass);


--
-- Name: hutang_karyawan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hutang_karyawan ALTER COLUMN id SET DEFAULT nextval('public.hutang_karyawan_id_seq'::regclass);


--
-- Name: infaq id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infaq ALTER COLUMN id SET DEFAULT nextval('public.infaq_id_seq'::regclass);


--
-- Name: izin_cuti id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.izin_cuti ALTER COLUMN id SET DEFAULT nextval('public.izin_cuti_id_seq'::regclass);


--
-- Name: jabatan id_jabatan; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jabatan ALTER COLUMN id_jabatan SET DEFAULT nextval('public.jabatan_id_jabatan_seq'::regclass);


--
-- Name: jam_kerja id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jam_kerja ALTER COLUMN id SET DEFAULT nextval('public.jam_kerja_id_seq'::regclass);


--
-- Name: jurnal_umum id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jurnal_umum ALTER COLUMN id SET DEFAULT nextval('public.jurnal_umum_id_seq'::regclass);


--
-- Name: kas_transaksi id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kas_transaksi ALTER COLUMN id SET DEFAULT nextval('public.kas_transaksi_id_seq'::regclass);


--
-- Name: kasir_jadwal id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kasir_jadwal ALTER COLUMN id SET DEFAULT nextval('public.kasir_jadwal_id_seq'::regclass);


--
-- Name: kasir_shift id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kasir_shift ALTER COLUMN id SET DEFAULT nextval('public.kasir_shift_id_seq'::regclass);


--
-- Name: kategori_barang id_kategori; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategori_barang ALTER COLUMN id_kategori SET DEFAULT nextval('public.kategori_barang_id_kategori_seq'::regclass);


--
-- Name: log_login id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_login ALTER COLUMN id SET DEFAULT nextval('public.log_login_id_seq'::regclass);


--
-- Name: menu_main id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_main ALTER COLUMN id SET DEFAULT nextval('public.menu_main_id_seq'::regclass);


--
-- Name: menu_sub id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_sub ALTER COLUMN id SET DEFAULT nextval('public.menu_sub_id_seq'::regclass);


--
-- Name: pelanggan id_pelanggan; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pelanggan ALTER COLUMN id_pelanggan SET DEFAULT nextval('public.pelanggan_id_pelanggan_seq'::regclass);


--
-- Name: pengiriman id_pengiriman; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman ALTER COLUMN id_pengiriman SET DEFAULT nextval('public.pengiriman_id_pengiriman_seq'::regclass);


--
-- Name: pengiriman_detail id_detail_kirim; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman_detail ALTER COLUMN id_detail_kirim SET DEFAULT nextval('public.pengiriman_detail_id_detail_kirim_seq'::regclass);


--
-- Name: pengiriman_selisih id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman_selisih ALTER COLUMN id SET DEFAULT nextval('public.pengiriman_selisih_id_seq'::regclass);


--
-- Name: penjualan id_penjualan; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penjualan ALTER COLUMN id_penjualan SET DEFAULT nextval('public.penjualan_id_penjualan_seq'::regclass);


--
-- Name: penjualan_detail id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penjualan_detail ALTER COLUMN id SET DEFAULT nextval('public.penjualan_detail_id_seq'::regclass);


--
-- Name: pesan_beli id_pesan_beli; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_beli ALTER COLUMN id_pesan_beli SET DEFAULT nextval('public.pesan_beli_id_pesan_beli_seq'::regclass);


--
-- Name: pesan_beli_detail id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_beli_detail ALTER COLUMN id SET DEFAULT nextval('public.pesan_beli_detail_id_seq'::regclass);


--
-- Name: pesan_cabang id_request; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_cabang ALTER COLUMN id_request SET DEFAULT nextval('public.pesan_cabang_id_request_seq'::regclass);


--
-- Name: pesan_cabang_detail id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_cabang_detail ALTER COLUMN id SET DEFAULT nextval('public.pesan_cabang_detail_id_seq'::regclass);


--
-- Name: promo id_promo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo ALTER COLUMN id_promo SET DEFAULT nextval('public.promo_id_promo_seq'::regclass);


--
-- Name: promo_barang_tebus_murah id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_barang_tebus_murah ALTER COLUMN id SET DEFAULT nextval('public.promo_barang_tebus_murah_id_seq'::regclass);


--
-- Name: promo_cabang id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_cabang ALTER COLUMN id SET DEFAULT nextval('public.promo_cabang_id_seq'::regclass);


--
-- Name: promo_diskon_barang id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_diskon_barang ALTER COLUMN id SET DEFAULT nextval('public.promo_diskon_barang_id_seq'::regclass);


--
-- Name: promo_hadiah_barang id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_barang ALTER COLUMN id SET DEFAULT nextval('public.promo_hadiah_barang_id_seq'::regclass);


--
-- Name: promo_hadiah_diskon id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_diskon ALTER COLUMN id SET DEFAULT nextval('public.promo_hadiah_diskon_id_seq'::regclass);


--
-- Name: promo_hadiah_gratis id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_gratis ALTER COLUMN id SET DEFAULT nextval('public.promo_hadiah_gratis_id_seq'::regclass);


--
-- Name: promo_hadiah_poin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_poin ALTER COLUMN id SET DEFAULT nextval('public.promo_hadiah_poin_id_seq'::regclass);


--
-- Name: promo_poin_barang id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_poin_barang ALTER COLUMN id SET DEFAULT nextval('public.promo_poin_barang_id_seq'::regclass);


--
-- Name: promo_syarat_barang_tertentu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_barang_tertentu ALTER COLUMN id SET DEFAULT nextval('public.promo_syarat_barang_tertentu_id_seq'::regclass);


--
-- Name: promo_syarat_beli id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_beli ALTER COLUMN id SET DEFAULT nextval('public.promo_syarat_beli_id_seq'::regclass);


--
-- Name: promo_syarat_kategori id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_kategori ALTER COLUMN id SET DEFAULT nextval('public.promo_syarat_kategori_id_seq'::regclass);


--
-- Name: promo_syarat_pembelanjaan id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_pembelanjaan ALTER COLUMN id SET DEFAULT nextval('public.promo_syarat_pembelanjaan_id_seq'::regclass);


--
-- Name: promo_syarat_supplier id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_supplier ALTER COLUMN id SET DEFAULT nextval('public.promo_syarat_supplier_id_seq'::regclass);


--
-- Name: rekening_kas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekening_kas ALTER COLUMN id SET DEFAULT nextval('public.rekening_kas_id_seq'::regclass);


--
-- Name: rekomendasi_pengiriman id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekomendasi_pengiriman ALTER COLUMN id SET DEFAULT nextval('public.rekomendasi_pengiriman_id_seq'::regclass);


--
-- Name: rekomendasi_pengiriman_detail id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekomendasi_pengiriman_detail ALTER COLUMN id SET DEFAULT nextval('public.rekomendasi_pengiriman_detail_id_seq'::regclass);


--
-- Name: rekonsiliasi_kas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekonsiliasi_kas ALTER COLUMN id SET DEFAULT nextval('public.rekonsiliasi_kas_id_seq'::regclass);


--
-- Name: riwayat_poin id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riwayat_poin ALTER COLUMN id SET DEFAULT nextval('public.riwayat_poin_id_seq'::regclass);


--
-- Name: role_menu id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_menu ALTER COLUMN id SET DEFAULT nextval('public.role_menu_id_seq'::regclass);


--
-- Name: role_menu_sub id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_menu_sub ALTER COLUMN id SET DEFAULT nextval('public.role_menu_sub_id_seq'::regclass);


--
-- Name: sales_velocity id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_velocity ALTER COLUMN id SET DEFAULT nextval('public.sales_velocity_id_seq'::regclass);


--
-- Name: stok_barang id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stok_barang ALTER COLUMN id SET DEFAULT nextval('public.stok_barang_id_seq'::regclass);


--
-- Name: stok_setting_cabang id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stok_setting_cabang ALTER COLUMN id SET DEFAULT nextval('public.stok_setting_cabang_id_seq'::regclass);


--
-- Name: supplier id_supplier; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier ALTER COLUMN id_supplier SET DEFAULT nextval('public.supplier_id_supplier_seq'::regclass);


--
-- Name: tipe_akun id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipe_akun ALTER COLUMN id SET DEFAULT nextval('public.tipe_akun_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vouchers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers ALTER COLUMN id SET DEFAULT nextval('public.vouchers_id_seq'::regclass);


--
-- Data for Name: absensi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.absensi (id, user_id, tanggal, jam, jenis, shift, latitude, longitude, status_lokasi, foto_selfie, id_shift, catatan, created_at) FROM stdin;
1	179	2026-05-31	22:23:15	masuk	\N	-8.056322	113.82795699999998	valid	\N	\N		2026-05-31 15:23:15
2	4	2026-06-01	08:33:42	masuk	\N	\N	\N	invalid	\N	\N		2026-06-01 01:33:42
3	134	2026-06-05	08:01:27	masuk	\N	\N	\N	invalid	\N	\N		2026-06-05 01:01:27
4	150	2026-06-05	08:01:34	masuk	\N	\N	\N	invalid	\N	\N		2026-06-05 01:01:34
\.


--
-- Data for Name: barang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.barang (id_barang, barcode, nama_barang, id_kategori, id_supplier, satuan_1, satuan_2, satuan_3, isi_1, isi_2, isi_3, harga_beli, harga_rata, harga_jual_1_1, harga_jual_1_2, harga_jual_1_3, harga_jual_2_1, harga_jual_2_2, harga_jual_2_3, harga_jual_3_1, harga_jual_3_2, harga_jual_3_3, jual_rugi, status, status_pajak, keterangan_1, keterangan_2) FROM stdin;
1	CIPCOL120	CIPTADENT COOL MINT 120G	5	3	PCS	PAK	\N	1	12	\N	8132	8132	9000	8900	8800	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
2	CIP1901A	CIPTADENT COOL MINT 190G	7	3	PCS	PAK	\N	1	12	\N	12444	12444	15000	14500	14000	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
3	8998866109727	CIPTADENT COOL MINT 225+25G	5	3	PCS	PAK	\N	1	12	\N	10730	10730	13000	12500	12000	140000	139000	148000	\N	\N	\N	0	Aktif	PPn	\N	\N
6	8998866181075	CIPTADENT FRESH MINT 120G	7	3	PCS	PAK	\N	1	12	\N	10050	10009	11000	10500	10000	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
7	8998866181082	CIPTADENT FRESH MINT 190G	7	3	PCS	PAK	\N	1	12	\N	15462	15372	16000	15500	15000	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
8	8998866109079	CIPTADENT FRESH MINT 225+25G	7	3	PCS	PAK	\N	1	12	\N	10730	10790	15000	14500	14000	140000	139000	138000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
11	8998866105064	CIPTADENT MAXI COMPLETE 120G	7	3	PCS	PAK	\N	1	12	\N	6600	6600	8000	7500	7000	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
12	8998866105071	CIPTADENT MAXI COMPLETE 190G	7	3	PCS	PAK	\N	1	12	\N	10100	10100	13000	12500	12000	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
14	8998866106191	CIPTADENT MAXI HERBAL 190G	7	3	PCS	PAK	\N	1	12	\N	15350	15350	18000	17500	17000	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
15	BRG-15	CIPTADENT MAXI HERBAL 75G	7	3	PCS	PAK	\N	1	12	\N	7526	7526	9000	8500	8000	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
16	BRG-16	CIPTADENT SG CHARCOAL PROTECTION SOFT	10	3	PCS	BOX	\N	1	12	\N	9734	9734	11000	10500	10000	120000	119000	118000	\N	\N	\N	0	Aktif	PPn	\N	\N
17	BRG-17	CIPTADENT SG CLASSIC REG SOFT ISI 3	10	3	PCS	BOX	\N	1	6	\N	6521	6521	8000	7500	7000	80000	79000	78000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
18	fhjkkjuiljkgfdgdg	CIPTADENT SG CLASSIC REGULAR SOFT	10	3	PCS	BOX	\N	1	12	\N	2773	2773	4000	3500	3000	40000	39000	38000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
19	BRG-19	CIPTADENT SG CRYSTAL CLEAN MEDIUM	10	3	PCS	BOX	\N	1	12	\N	3252	3252	4500	4000	3500	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
20	BRG-20	CIPTADENT SG CRYSTAL CLEAN SOFT	10	3	PCS	BOX	\N	1	12	\N	2930	2930	5000	4500	4000	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
21	cipi3	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	10	3	PCS	BOX	\N	1	6	\N	6860	6860	8000	7500	7000	80000	79000	78000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
22	BRG-22	CIPTADENT SG DIAMOND CLEAN SOFT	10	3	PCS	BOX	\N	1	12	\N	2930	2930	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
23	BRG-23	CIPTADENT SG DIAMOND CLEAN SOFT ISI 3	10	3	PCS	BOX	\N	1	6	\N	6860	6860	8000	7500	7000	80000	79000	78000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
24	BRG-24	CIPTADENT SG DOUBLE ACTION SOFT	10	3	PCS	BOX	\N	1	12	\N	2250	2250	3000	2900	2800	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
25	BRG-25	CIPTADENT SG EXTRA CLEAN MEDIUM	10	3	PCS	BOX	\N	1	12	\N	2930	2930	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
26	8998866103954	CIPTADENT SG EXTRA CLEAN SOFT	10	3	PCS	BOX	\N	1	12	\N	2640	2640	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
27	8998866606547	CIPTADENT SG FLEXI  CLEAN SOFT	10	3	PCS	BOX	\N	1	12	\N	2930	2930	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
28	BRG-28	CIPTADENT SG PERFECT CARE SOFT	10	3	PCS	BOX	\N	1	12	\N	7900	7900	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
29	BRG-29	CIPTADENT SG PERFECT SC KTK ISI 3	10	3	PCS	BOX	\N	1	6	\N	15800	15800	20000	19000	18000	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
30	BRG-30	CIPTADENT SG TOTAL CLEAN SOFT	10	3	PCS	BOX	\N	1	12	\N	2640	2640	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
31	cw190	CIPTADENT WHITENING 190G	7	3	PCS	PAK	\N	1	12	\N	15350	13162	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
32	cit601c	CITRA HBL 60ML BENGKOANG NTRL WHITE	11	4	PCS	SLOP	DOS	1	6	36	6683	6683	9000	8500	8000	49000	47000	45000	280000	270000	260000	0	Aktif	Non PPn	\N	\N
33	cit602b	CITRA HBL 60ML PEARLY WHITE PINK	11	4	PCS	SLOP	DOS	1	6	36	6021	6021	9000	8500	8000	49000	47000	45000	280000	270000	260000	0	Aktif	Non PPn	\N	\N
34	kjhkgjretf	CITRA HBL BENGKOANG NTRL WHITE 110ML	11	4	PCS	DOS	\N	1	36	\N	11648	11648	15000	14000	13000	450000	445000	440000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
35	8999999605940	CITRA HBL BENGKOANG NTRL WHITE 210ML	11	4	PCS	DOS	\N	1	24	\N	17929	17929	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
36	BRG-36	CITRA HBL NOURISHING AVOCADO 110ML	11	4	PCS	DOS	\N	1	36	\N	11826	11826	15000	14000	13000	450000	445000	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
37	8999999606022	CITRA HBL NOURISHING AVOCADO 210ML	11	4	PCS	DOS	\N	1	24	\N	24491	24491	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
38	BRG-38	CITRA HBL PEARLY WHITE UV 110ML	11	4	PCS	DOS	\N	1	36	\N	10134	10134	15000	14000	13000	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
39	8990891617031	CITRA HBL PEARLY WHITE UV 210ML	11	4	PCS	DOS	\N	1	24	\N	18616	18616	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
40	BRG-40	CITRA HBL SAKURA FAIR UV 110ML	11	4	PCS	DOS	\N	1	36	\N	11826	11826	15000	14000	13000	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
41	8999999605964	CITRA HBL SAKURA FAIR UV 210ML	11	4	PCS	DOS	\N	1	24	\N	19196	19196	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
42	6970914823740	CITRA PEARLY GLOW PINK 40G 3890	10	4	PCS	SLOP		1	6	\N	42031	42031	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
46	BRG-46	CLAS MILD 16	12	5	PCS	PRES	\N	1	10	\N	28000	28000	30000	29750	29500	295000	290000	285000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
50	cl1001a	CLEAN & CLEAR FACIAL WASH 100ML	11	7	PCS	\N	\N	1	\N	\N	24704	24704	27000	26500	26000	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
51	Cl50c	CLEAN & CLEAR FACIAL WASH 50ML	11	7	PCS	\N	\N	1	\N	\N	16510	16510	19000	18500	18000	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
52	857161001670	CLEAR SHP COMPLETE SOFT CARE 160ML	5	4	PCS	\N	\N	1	\N	\N	27430	27430	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
53	789784454	CLEAR SHP CSC PRWT KOMPLIT 70ML	10	4	PCS			1	0	\N	11874	11874	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
54	BRG-54	CLEAR SHP ICE COOL MENTHOL 70ML	5	4	PCS	\N	\N	1	\N	\N	11874	11874	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
55	8999999529734	CLEAR SHP ICE COOL MENTHOL SEGAR 160ML	10	4	PCS			1	0	\N	27430	21944	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
56	8991389220009	CLEAR SHP MENTHOL FRESH ACTIVE 160ML	10	4	PCS			1	0	\N	27429	15498	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
57	8998866200981	CLEAR SHP SASET AD PRWTN KOMPLIT 9+2ML	10	8	LSN	DOS		1	40	\N	10545	10545	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
58	BRG-58	CLEAR SHP SASET AD RMBT RONTOK 9ML	5	4	LSN	DOS	\N	1	40	\N	10545	10545	12000	11750	11500	470000	460000	450000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
59	BRG-59	CLEAR SHP SASET COMPLITE SOFT CARE 9ML	5	9	LSN	DOS	\N	1	40	\N	10545	10545	12000	11750	11500	470000	460000	450000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
60	8991389258392	CLEAR SHP SASET LEMON FRESH 9ML	5	8	LSN	DOS	\N	1	40	\N	10545	10545	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
61	CLS	CLEAR SHP SASET MEN FRESH ACTIVE 9ML	5	8	LSN	DOS	\N	1	40	\N	10545	10545	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
62	BRG-62	CLEAR SHP SASET MENTHOL SEGAR 9ML	5	9	LSN	DOS	\N	1	40	\N	421800	421800	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
63	gfgdgewew	CLING REFIL LEMON FRESH 425ML 5144	10	3	PCS	DOS		1	12	\N	3103	2690	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
64	BRG-64	CLING REFIL OCEAN FRESH 425ML 5137	10	3	PCS	DOS		1	12	\N	3103	2638	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
65	BRG-65	CLING REFIL UNGU 400ML	5	3	PCS	DOS	\N	1	12	\N	3444	3444	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
66	BRG-66	CLING REFILL APPLE FRESH 425ML	10	3	PCS	DOS		1	12	\N	3103	2483	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
67	8998866605120	CLING SEMPROT APPLE 440ML 5120	10	3	PCS			1	0	\N	8129	6503	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
68	8998866605106	CLING SEMPROT BIRU 440ML 5106	10	3	PCS			1	0	\N	8129	6503	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
69	8998866605113	CLING SEMPROT LEMON 440ML 5113	10	3	PCS	DOS		1	12	\N	8129	6096	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
70	8998866610407	CLING SEMPROT UNGU 440ML	10	3	PCS			1	0	\N	8129	6503	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
71	c65b	CLOSE UP DEEP ACTION 65+10G	7	4	PCS	PAK	\N	1	12	\N	7014	7014	9000	8800	8500	95000	93000	90000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
72	8999999707842	CLOSE UP MENTHOL 110G	7	4	PCS	PAK	\N	1	12	\N	15911	15911	19000	18800	18500	222000	219000	217000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
73	8999999707859	CLOSE UP MENTHOL 160G	7	4	PCS	PAK	\N	1	12	\N	20057	20057	25000	24800	24500	295000	293000	291000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
74	8996196226855	CLOUD 9 CRUNCHY COKLAT TREAT PACK 80G	10	10	PCS	PAK	DOS	1	24	144	427	427	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	Non PPn	\N	\N
75	club1501b	CLUB AIR MINUM 1500ML	9	11	PCS	DOS	\N	1	12	\N	3333	3333	3500	3400	3300	40000	39000	38500	\N	\N	\N	0	Aktif	Non PPn	\N	\N
76	896867700258	CLUB AIR MINUM 330ML	9	11	PCS	DOS	\N	1	24	\N	1454	1454	2700	2300	2000	40000	39000	38000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
77	896867700326	CLUB AIR MINUM 600ML	9	11	PCS	DOS	\N	1	24	\N	1566	1566	4000	3700	3500	80000	79000	78000	\N	\N	\N	0	Aktif	Non PPn	\N	\N
78	club19b	CLUB AIR MINUM GALON 19L	9	11	PCS	\N	\N	1	\N	\N	17000	17036	25000	24000	23000	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
88	club240b	CLUB GELAS 240ML	9	4	DOS	\N	\N	1	\N	\N	10500	10500	15000	14000	13000	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
89	089686010947	INDOMIE GORENG	6	4	PCS	DOS	\N	1	40	\N	2450	2450	3300	2800	\N	110000	105000	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
90	8996006142511	TEH BOTOL SOSRO KOTAK 250ML	6	4	PCS	DOS	\N	1	24	\N	2708	2708	3500	\N	\N	75000	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
91	chi68	CHITATO SAPI PANGGANG 68G	6	11	PCS	DOS	\N	1	40	\N	9086	6501	10000	\N	\N	380000	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
92	54545453	SUSU ULTRA MILK COKLAT 250ML	9	4	PCS	DOS	\N	1	24	\N	120000	120000	6000	\N	\N	135000	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
93	BRG-93	KOPI KAPAL API SPECIAL MIX 25G	6	4	PCS	RTG	DOS	1	10	120	140000	80055	1500	\N	\N	14000	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
94	BRG-94	CHITATO SAPI PANGGANG 20G	6	11	PCS	DOS	\N	1	60	\N	4357	3493	\N	\N	\N	\N	\N	\N	\N	\N	\N	0	Aktif	PPn	\N	\N
\.


--
-- Data for Name: bayar_hutang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bayar_hutang (id, id_supplier, tanggal_bayar, jumlah_bayar, metode_pembayaran, keterangan, created_at) FROM stdin;
\.


--
-- Data for Name: bisyaroh; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bisyaroh (id, user_id, bulan, tahun, gaji_pokok, gaji_per_jam, lembur_per_jam, hari_kerja, total_jam_kerja, total_jam_lembur, gaji_kehadiran, gaji_lembur, tunjangan, potongan, total_diterima, status, tanggal_bayar, catatan, created_at, updated_at) FROM stdin;
1	134	6	2026	300000	10000	5000	1	8	0	80000	0	0	50000	330000	Lunas	2026-06-05	Bisyaroh Abdi 2026-06	2026-06-05 02:08:03	2026-06-05T02:08:19.341Z
2	179	6	2026	300000	10000	5000	0	0	0	0	0	0	149999	150001	Lunas	2026-06-05	Bisyaroh Abdi 2026-06	2026-06-05 02:09:13	2026-06-05T02:18:59.795Z
3	60	6	2026	1000000	5000	7500	20	160	10	800000	75000	100000	50000	1925000	Lunas	2026-06-05	Bisyaroh Abdi 2026-06	2026-06-05 02:12:21	2026-06-05T02:12:21.364Z
4	150	6	2026	300000	8000	4000	1	8	0	64000	0	0	0	364000	Lunas	2026-06-05	Bisyaroh Abdi 2026-06	2026-06-05 02:15:16	2026-06-05T02:15:16.364Z
\.


--
-- Data for Name: cabang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cabang (id_cabang, kode_cabang, nama_cabang, alamat, telepon, email, admin, latitude, longitude, data_kode, created_at, updated_at, is_dc) FROM stdin;
2	SR09231	SUKOSARI	SUKOSARI	021812481	info@almubarok.com	\N	\N	\N	\N	2026-08-11 14:36:40	2026-08-11 14:36:40	f
3	DC-001	DC Pusat	SUKOWONO	082337522221	kantor@gmail.com	4	\N	\N	VxMsDNynLu	2025-08-04 00:30:45	2025-10-22 01:06:31	f
5	CBG-0001	PONPES	JL. KH. WAHID HASYIM, RAGANG, SUKOWONO, KABUPATEN JEMBER, JAWA TIMUR	082331507913	KOP1ALMUBAROK@GMAIL.COM	82	\N	\N	rMQ9v8eKuJ	2025-08-27 06:21:15	2025-10-22 01:06:26	f
6	CBG-0002	SUKOWONO	JL. AHMAD YANI, NO. 112, SUKOWONO, JEMBER	085232579511	MUBAROKOFFSET@GMAIL.COM	80	\N	\N	K8IoCHKN3Q	2025-08-27 06:50:23	2025-10-22 01:06:26	f
7	CBG-0003	GUNUNG MALANG	JL. CHAIRIL ANWAR NO.85, KRAJAN, CUMEDAK, SUMBER JAMBE, KABUPATEN JEMBER, JAWA TIMUR	085232582949	KOP03ALMUBAROK@GMAIL.COM	78	\N	\N	610KGmksds	2025-08-27 06:53:07	2025-10-22 01:06:26	f
8	CBG-0004	SUKOSARI	JL. SUKOSARI, SASI, SUKOSARI, SUKOWONO, KABUPATEN JEMBER, JAWA TIMUR	085232581588	KOP4ALMUBAROK@GMAIL.COM	71	\N	\N	jh0cNXoPS6	2025-09-10 07:08:04	2025-10-22 01:06:26	f
9	CBG-0005	LEDOKOMBO	JL. ST, PASAR, LEDOKOMBO, KABUPATEN JEMBER, JAWA TIMUR	085232582885	KOP5ALMUBAROK@GMAIL.COM	79	\N	\N	QOU8h0DWQA	2025-09-28 05:55:40	2025-10-22 01:06:26	f
10	CBG-0006	KALISAT	JL. PATIMURA KALISAT, KRAJAN II, KALISAT, KABUPATEN JEMBER, JAWA TIMUR	085232581411	KOP6ALMUBAROK@GMAIL.COM	69	\N	\N	rKzPHO82p4	2025-10-17 09:06:54	2025-10-17 09:11:47	f
11	CBG-0007	SUMBER JAMBE	JL. PB. SUDIRMAN, KRAJAN, SUMBERJAMBE, KABUPATEN JEMBER, JAWA TIMUR	085232581663	KOP7ALMUBAROK@GMAIL.COM	74	\N	\N	tUjq6NA3h2	2025-10-17 09:08:31	2025-10-17 09:12:12	f
12	CBG-0008	MAYANG	JL. TJ. SARI, KRAJAN, TEGALREJO, MAYANG, KABUPATEN JEMBER, JAWA TIMUR	081233327637	KOP8MAYANG@GMAIL.COM	102	\N	\N	oCp6IEBs1A	2025-10-17 09:14:14	2025-10-17 09:14:14	f
13	CBG-0009	PRINGGONDANI	JL. BONDOWOSO, SUMBER JAMBE, JEMBER , JAWA TIMUR	082328091948	KOP9ALMUBAROK@GMAIL.COM	77	\N	\N	U0rPxbSb2v	2025-10-17 09:15:22	2025-10-17 09:15:22	f
14	CBG-0010	PUJER	JL. RAYA PAKISAN, MAS KUNING, BONDOWOSO , JAWA TIMUR	082286868170	KOP10ALMUBAROK@GMAIL.COM	97	\N	\N	z6i8hQ9wY4	2025-10-17 09:16:27	2025-10-17 09:16:27	f
15	CBG-0011	DADAPAN	JL. BONDOWOSO JEMBER DADAPAN GRUJUGAN BONDOWOSO , JAWA TIMUR		KOP11ALMUBAROK@GMAIL.COM	76	\N	\N	Dw2L40FY3b	2025-10-17 09:18:04	2025-10-17 09:18:04	f
16	CBG-0012	SUREN	JL. LEDOKOMBO, SUREN, LEDOKOMBO KABUPATEN JEMBER , JAWA TIMUR	085854655771	KOP12ALMUBAROK@GMAIL.COM	108	\N	\N	tnwKUMUvxP	2025-10-17 09:19:02	2025-10-17 09:19:02	f
17	CBG-0013	PUTRI	PONPES MAMBAUL ULUM	085732403582	KOPMINI3@GMAIL.COM	\N	\N	\N	XlQCv3QMIZ	2025-10-17 09:20:53	2025-10-17 09:24:37	f
18	CBG-0014	GARAHAN	JL. RAYA JEMBER BANYUWANGI KRAJAN GARAHAN SILO JEMBER , JAWA TIMUR	085198146331	KOP15ALMUBAROK@GMAIL.COM	98	\N	\N	5y45G2GXHJ	2025-10-17 09:24:08	2025-10-17 09:24:08	f
19	CBG-0015	SUGER	JL. BONDOWOSO JEMBER NO 17 KRAJAN  TIMUR SUGER KIDUL JELBUK JEMBER , JAWA TIMUR	085143404437	KOP17ALMUBAROK@GMAIL.COM	75	\N	\N	dwimuoolTB	2025-10-17 09:40:31	2025-10-17 09:40:31	f
21	CBG-0016	TLOGOSARI	JL. KEMBANG , PAKISAN , TLOGOSARI BONDOWOSO , JAWA TIMUR		KOP18ALMUBAROK@GMAIL.COM	89	\N	\N	zNmYCwnlKa	2025-10-17 09:41:35	2025-10-17 09:41:35	f
22	CBG-0017	SILO	JL. PDP SUMBER WADUNG, SUMBER PINANG , KARANGHARJO SILO JEMBER , JAWA TIMUR		KOP19ALMUBAROK@GMAIL.COM	85	\N	\N	zN2fd4Pcgk	2025-10-17 09:42:27	2025-10-17 09:42:27	f
\.


--
-- Data for Name: daftar_akun; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daftar_akun (id, kode_akun, nama_akun, deskripsi, tipe_akun_id, status) FROM stdin;
1	1.101.01	Kas Toko	Kas Utama di Toko	1	Aktif
2	1.101.01	Kas di Tangan (Kasir)	Uang tunai fisik yang ada di laci kasir setiap cabang.	1	Aktif
3	1.101.02	Kas Kecil (Petty Cash)	Dana kecil untuk pengeluaran non-rutin di kantor/cabang.	1	Aktif
4	1.102.01	Bank Mandiri	Saldo di rekening operasional Bank Mandiri.	1	Aktif
5	1.102.02	Bank BCA	Saldo di rekening operasional Bank BCA.	1	Aktif
6	1.103.01	Piutang Pihak Ketiga	Tagihan dari penjualan ke institusi (misal: katering kantor).	1	Aktif
7	1.103.02	Piutang Payment Gateway	Dana penjualan yang masih tertahan di Midtrans, GoPay, dll.	1	Aktif
8	1.104.01	Persediaan - Makanan & Minuman	Nilai stok makanan dan minuman yang siap jual.	1	Aktif
9	1.104.02	Persediaan - Produk Rumah Tangga	Nilai stok sabun, pembersih, dll.	1	Aktif
10	1.104.03	Persediaan - Lain-lain	Nilai stok lainnya (misal: ATK, pulsa fisik).	1	Aktif
11	1.105.01	Sewa Dibayar Dimuka	Biaya sewa toko/gudang yang sudah dibayar untuk periode mendatang.	1	Aktif
12	1.201.01	Tanah & Bangunan	Nilai perolehan tanah dan bangunan milik sendiri.	1	Aktif
13	1.201.02	Peralatan Toko (Rak, Pendingin)	Nilai perolehan rak, kulkas, mesin kasir.	1	Aktif
14	1.201.03	Kendaraan Operasional	Nilai perolehan mobil/motor untuk distribusi.	1	Aktif
15	1.202.01	Akumulasi Penyusutan - Bangunan	Total penyusutan bangunan hingga saat ini.	1	Aktif
16	1.202.02	Akumulasi Penyusutan - Peralatan	Total penyusutan peralatan hingga saat ini.	1	Aktif
17	1.202.03	Akumulasi Penyusutan - Kendaraan	Total penyusutan kendaraan hingga saat ini.	1	Aktif
18	2.101.01	Utang Usaha Pemasok	Tagihan dari supplier barang dagangan (Indofood, Unilever, dll).	2	Aktif
19	2.102.01	Utang Gaji	Gaji karyawan yang sudah menjadi hak tapi belum dibayar.	2	Aktif
20	2.102.02	Utang Listrik, Air, Telepon	Tagihan utilitas yang sudah dipakai tapi belum dibayar.	2	Aktif
21	2.103.01	PPN Keluaran	PPN yang dipungut dari penjualan dan harus disetor ke negara.	2	Aktif
22	2.103.02	Utang PPh 21	Pajak penghasilan karyawan yang dipotong dari gaji.	2	Aktif
23	2.104.01	Pendapatan Diterima Dimuka	Pembayaran dari pelanggan untuk barang/jasa yang belum diserahkan.	2	Aktif
24	2.201.01	Utang Bank	Pinjaman dari bank untuk modal kerja atau ekspansi dengan tenor > 1 tahun.	2	Aktif
25	3.101.01	Modal Disetor	Setoran modal awal dari para pemilik.	3	Aktif
26	3.102.01	Laba Ditahan	Akumulasi laba bersih dari tahun-tahun sebelumnya.	3	Aktif
27	3.103.01	Laba Tahun Berjalan	Laba bersih yang dihasilkan dalam periode akuntansi saat ini.	3	Aktif
28	3.201.01	Prive / Dividen	Pengambilan dana oleh pemilik untuk keperluan pribadi.	3	Aktif
29	4.101.01	Penjualan - Makanan & Minuman	Total penjualan kotor dari kategori produk ini.	4	Aktif
30	4.101.02	Penjualan - Produk Rumah Tangga	Total penjualan kotor dari kategori produk ini.	4	Aktif
31	4.101.03	Penjualan - Lain-lain	Total penjualan kotor dari pulsa, token listrik, dll.	4	Aktif
32	4.201.01	Retur Penjualan	Nilai barang yang dikembalikan oleh pelanggan.	4	Aktif
33	4.201.02	Diskon Penjualan	Nilai diskon yang diberikan saat penjualan.	4	Aktif
34	5.101.01	HPP - Makanan & Minuman	Biaya pokok dari produk makanan/minuman yang terjual.	5	Aktif
35	5.101.02	HPP - Produk Rumah Tangga	Biaya pokok dari produk rumah tangga yang terjual.	5	Aktif
36	5.101.03	HPP - Lain-lain	Biaya pokok dari produk lain yang terjual.	5	Aktif
37	6.101.01	Beban Gaji Karyawan	Gaji pokok staf toko dan kantor pusat.	6	Aktif
38	6.101.02	Beban Tunjangan & Bonus	Tunjangan transportasi, makan, dan bonus kinerja.	6	Aktif
39	6.102.01	Beban Sewa Toko/Gudang	Biaya sewa tempat untuk setiap cabang.	6	Aktif
40	6.102.02	Beban Listrik, Air, Internet	Biaya utilitas bulanan.	6	Aktif
41	6.103.01	Beban Iklan & Promosi	Biaya untuk brosur, iklan media sosial, dll.	6	Aktif
42	6.104.01	Beban Penyusutan - Peralatan	Beban penyusutan aset peralatan untuk periode berjalan.	6	Aktif
43	6.104.02	Beban Penyusutan - Bangunan	Beban penyusutan aset bangunan untuk periode berjalan.	6	Aktif
44	6.104.03	Beban Penyusutan - Kendaraan	Beban penyusutan aset kendaraan untuk periode berjalan.	6	Aktif
45	6.105.01	Beban Transportasi & Distribusi	Biaya bahan bakar untuk kendaraan operasional.	6	Aktif
46	6.105.02	Beban Perlengkapan Toko	Biaya kantong plastik, struk kasir, ATK.	6	Aktif
47	6.105.03	Beban Perbaikan & Pemeliharaan	Biaya servis AC, perbaikan rak, dll.	6	Aktif
48	6.106.01	Beban Administrasi Bank	Biaya administrasi bulanan dari rekening bank.	6	Aktif
49	8.101.01	Pendapatan Bunga Bank	Pendapatan bunga yang diterima dari simpanan di bank.	8	Aktif
50	8.201.01	Beban Bunga Pinjaman	Beban bunga yang dibayarkan atas pinjaman bank.	8	Aktif
51	1.101.03	Kas Kantor	Uang yang ada di Bendahara Kantor	1	Aktif
\.


--
-- Data for Name: daftar_gaji_jabatan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daftar_gaji_jabatan (id, id_jabatan, gaji_pokok, gaji_per_jam, lembur_per_jam, updated_at) FROM stdin;
1	1	300000	6250	7000	2025-08-09 13:35:36
2	5	250000	20000	20000	2025-08-10 04:31:25
3	6	300000	10000	5000	2026-06-05T01:03:07.020Z
4	7	300000	8000	4000	2026-06-05T01:03:21.554Z
\.


--
-- Data for Name: faktur_beli; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faktur_beli (id_faktur, id_po, id_cabang, id_supplier, tanggal_faktur, nomor_faktur, total_faktur, diskon_total, ppn_rate, status_pembayaran, created_at) FROM stdin;
34	\N	3	11	2025-09-06	PB-3-250906-0001	128377	0	11	Belum Lunas	2025-09-06 05:19:16
35	\N	3	3	2025-09-06	PB-3-250906-0002	519096	0	0	Lunas	2025-09-06 08:59:47
36	\N	3	3	2025-09-06	PB-3-250906-0003	158355	0	0	Belum Lunas	2025-09-06 09:00:25
37	\N	3	4	2025-09-06	PB-3-250906-0004	2732724	0	0	Belum Lunas	2025-09-06 09:07:23
38	\N	3	3	2025-09-07	PB-3-250907-0001	1046982	0	0	Lunas	2025-09-07 06:03:09
39	\N	3	11	2025-09-09	PB-3-250909-0001	742878	0	0	Belum Lunas	2025-09-09 07:20:26
40	\N	5	11	2025-09-11	PB-5-250911-0001	1286160	0	0	Belum Lunas	2025-09-11 07:57:08
41	\N	3	4	2025-09-13	PB-3-250913-0001	2432592	0	0	Lunas	2025-09-13 06:58:48
42	\N	3	3	2025-09-14	PB-3-250914-0001	3561462	0	0	Lunas	2025-09-14 05:05:40
43	\N	3	4	2025-09-14	PB-3-250914-0002	2374800	0	0	Lunas	2025-09-14 06:06:09
44	\N	3	4	2025-09-15	PB-3-250915-0001	7622400	0	0	Lunas	2025-09-15 02:11:45
45	\N	3	4	2025-09-15	PB-3-250915-0002	25308000	0	0	Lunas	2025-09-15 02:17:08
46	\N	3	7	2025-09-15	PB-3-250915-0003	4121400	0	0	Lunas	2025-09-15 02:44:15
47	\N	3	3	2025-09-15	PB-3-250915-0004	2575200	0	0	Lunas	2025-09-15 05:15:56
48	\N	3	5	2025-09-16	PB-3-250916-0001	28000000	0	0	Lunas	2025-09-16 03:45:10
49	\N	3	4	2025-09-17	PB-3-250917-0001	19320000	0	0	Lunas	2025-09-17 02:13:03
50	\N	3	11	2025-09-20	PB-3-250920-0001	10500000	0	0	Lunas	2025-09-20 08:13:57
51	\N	3	11	2025-09-25	PB-3-250925-0001	3920000	0	0	Lunas	2025-09-25 02:58:43
52	\N	3	4	2025-09-25	PB-3-250925-0002	2980152	0	0	Lunas	2025-09-25 08:47:11
53	\N	3	11	2025-09-27	PB-3-250927-0001	980000	0	0	Lunas	2025-09-27 05:01:05
54	\N	3	4	2025-09-27	PB-3-250927-0002	4225320	0	0	Lunas	2025-09-27 05:42:26
55	\N	3	11	2025-09-27	PB-3-250927-0003	715000	0	0	Lunas	2025-09-27 05:58:20
56	\N	3	4	2025-10-06	PB-3-251006-0001	51578400	0	0	Lunas	2025-10-06 03:29:45
58	\N	3	3	2025-10-30	dssdfgghfhj	356400	39600	0	Lunas	2025-10-30 03:14:13
59	\N	3	11	2025-10-30	fdsfdfdsfds	388500	0	11	Lunas	2025-10-30 04:02:34
60	\N	3	11	2025-10-30	ewewewe	349650	35000	11	Lunas	2025-10-30 05:43:43
61	\N	3	1	2025-10-30	FGFDGDF	610000	0	0	Lunas	2025-10-30 07:18:26
62	\N	3	3	2025-10-30	FGFGFGFG	51024	4558	0	Lunas	2025-10-30 08:03:28
63	29	3	4	2025-11-01	fdfdfdfd	17082640	0	0	Lunas	2025-11-01 09:17:04
64	\N	10	11	2025-11-16	gygugdrftdfytr	400000	0	0	Lunas	2025-11-16 03:20:01
65	\N	8	11	2025-11-16	123	20733056	0	0	Lunas	2025-11-16 06:27:07
66	\N	19	4	2025-11-16	02515344585	552408	0	0	Belum Lunas	2025-11-16 07:02:57
67	\N	12	11	2025-11-16	0365452585	120000	0	0	Lunas	2025-11-16 07:07:33
68	\N	19	5	2025-11-16	02515344585	0	0	0	Belum Lunas	2025-11-16 07:10:02
69	\N	10	11	2025-11-16	001	562380	0	0	Belum Lunas	2025-11-16 07:13:38
70	\N	15	4	2025-11-16	123456	1651820	0	0	Lunas	2025-11-16 07:14:37
71	\N	15	4	2025-11-16	123456	8475192	0	0	Lunas	2025-11-16 07:19:54
72	\N	6	4	2025-11-16	0021113	3805616	0	0	Lunas	2025-11-16 07:24:20
73	\N	19	5	2025-11-16	02515344585	1032490	0	0	Belum Lunas	2025-11-16 07:28:26
74	\N	6	4	2025-11-16	0021113	4893999	0	0	Lunas	2025-11-16 07:31:56
75	\N	13	3	2025-11-16	001	1556728	0	0	Belum Lunas	2025-11-16 07:39:20
76	\N	11	4	2025-11-16	123456	816344	0	0	Belum Lunas	2025-11-16 07:59:17
77	\N	21	3	2025-11-16	001	771372	0	0	Lunas	2025-11-16 08:00:43
78	\N	21	3	2025-11-16	001	862728	0	0	Lunas	2025-11-16 08:03:23
79	\N	11	5	2025-11-16	123456	1982992	0	0	Lunas	2025-11-16 08:05:48
80	\N	15	11	2025-11-16	112545	307952	0	0	Lunas	2025-11-16 08:06:02
81	\N	21	11	2025-11-16	00012	2882404	0	0	Lunas	2025-11-16 08:14:38
82	\N	22	11	2025-11-17	JIHIH	1041792	0	0	Lunas	2025-11-17 03:30:46
83	\N	11	12	2025-11-17	123456	542184	0	0	Belum Lunas	2025-11-17 04:15:36
84	\N	7	11	2025-11-17	130399	1404882	0	0	Lunas	2025-11-17 04:31:43
85	\N	7	8	2025-11-17	1234	379620	0	0	Lunas	2025-11-17 04:35:11
86	\N	10	8	2025-11-17	002	941436	0	0	Lunas	2025-11-17 04:52:32
87	\N	11	4	2025-11-17	123456	1001436	0	0	Lunas	2025-11-17 07:52:33
88	\N	16	8	2025-11-17	0001	736574	0	0	Lunas	2025-11-17 07:55:29
89	\N	18	4	2025-11-19	01	498734	0	0	Lunas	2025-11-19 06:21:11
90	\N	14	5	2025-11-19	002	150000	0	0	Lunas	2025-11-19 07:00:50
91	\N	14	4	2025-11-19	002	1275550	0	0	Lunas	2025-11-19 07:07:44
92	\N	14	4	2025-11-19	002	2872700	0	0	Lunas	2025-11-19 07:10:05
93	\N	7	6	2025-11-20	130399	576534	0	0	Lunas	2025-11-20 06:01:53
94	\N	11	4	2025-11-22	123456	534888	0	0	Lunas	2025-11-22 06:23:53
95	\N	21	4	2025-11-22	0003	1801272	0	0	Lunas	2025-11-22 08:06:01
96	\N	16	3	2025-11-28	0001	1206288	0	0	Lunas	2025-11-28 03:55:04
97	\N	14	11	2025-11-29	eka buana	643982	0	0	Lunas	2025-11-29 06:35:10
98	26	5	11	2025-12-11	GUDANG	68587	0	0	Lunas	2025-12-11 06:18:53
99	\N	3	11	2025-12-17	SASASA	340000	0	0	Lunas	2025-12-17 06:51:04
100	\N	3	11	2025-12-17	454545	188700	0	11	Lunas	2025-12-17 06:58:04
101	\N	3	11	2025-12-17	FGFGFGFG	377400	0	11	Lunas	2025-12-17 06:59:43
102	\N	3	11	2025-12-17	ewewewe	170000	0	0	Lunas	2025-12-17 07:03:49
103	\N	3	11	2025-12-17	DSDSD	14540	0	0	Lunas	2025-12-17 07:04:30
104	\N	3	11	2025-12-17	TREER	33330	0	0	Lunas	2025-12-17 07:05:23
105	\N	3	11	2025-12-17	JHJHJ	2908	0	0	Lunas	2025-12-17 07:24:48
106	\N	3	11	2025-12-17	FGFDGDF	4362	0	0	Lunas	2025-12-17 07:58:30
107	\N	3	11	2025-12-17	FGFGFGFG	23264	0	0	Lunas	2025-12-17 07:58:52
108	\N	3	11	2025-12-17	FGFDGDF	20356	0	0	Lunas	2025-12-17 07:59:20
109	\N	3	11	2025-12-18	trtrthg	333000	0	11	Lunas	2025-12-18 03:39:26
110	\N	3	11	2025-12-18	ewewewe	4900	0	0	Lunas	2025-12-18 03:42:36
111	\N	3	11	2025-12-18	sadfdssdadasd	4000	1000	0	Lunas	2025-12-18 03:44:02
112	\N	3	11	2025-12-18	FGFGFGFG	14100	800	0	Lunas	2025-12-18 03:45:46
113	\N	3	11	2025-12-18	sadfdssdadasd	20000	0	0	Lunas	2025-12-18 03:56:40
114	\N	3	11	2025-12-18	fdsfdfdsfds	18900	900	0	Lunas	2025-12-18 03:58:19
115	\N	3	11	2025-12-18	fdsfdfdsfds	19757	900	11	Lunas	2025-12-18 07:37:39
116	\N	3	3	2025-12-20	FGFDGDF	79200	0	0	Lunas	2025-12-20 03:29:10
117	\N	3	3	2025-12-20	dssdfgghfhj	121200	0	0	Lunas	2025-12-20 10:39:39
118	31	3	3	2025-12-20	FGFGFGFG	535080	0	0	Lunas	2025-12-20 13:15:06
119	25	3	4	2025-12-20	fdsfdfdsfds	106014	0	0	Lunas	2025-12-20 13:15:22
120	24	3	3	2025-12-20	FGFDGDF	35126	0	0	Lunas	2025-12-20 13:15:32
121	24	3	3	2025-12-20	fdsfdfdsfds	24396	0	0	Lunas	2025-12-20 13:15:39
122	27	3	11	2025-12-20	FGFGFGFG	17000	0	0	Lunas	2025-12-20 13:15:47
123	27	3	11	2025-12-20	FGFGFGFG	12873604	0	0	Lunas	2025-12-20 13:15:55
124	28	3	4	2025-12-20	dssdfgghfhj	4090656	0	0	Lunas	2025-12-20 13:16:02
125	30	3	4	2025-12-20	dssdfgghfhj	29414916	0	0	Lunas	2025-12-20 13:17:02
126	36	3	3	2025-12-20	ggdfgfdgfg	37236	0	0	Lunas	2025-12-20 13:46:26
127	32	3	4	2025-12-20	ewewewe	92100	0	0	Lunas	2025-12-20 13:46:44
128	33	3	4	2025-12-20	dssdfgghfhj	139776	0	0	Lunas	2025-12-20 13:46:51
129	34	3	4	2025-12-20	fdsfdfdsfds	215148	0	0	Lunas	2025-12-20 13:46:57
130	35	3	4	2025-12-20	dssdfgghfhj	329160	0	0	Lunas	2025-12-20 13:47:04
\.


--
-- Data for Name: faktur_beli_detail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faktur_beli_detail (id, id_faktur, id_barang, jumlah_beli, harga_satuan, subtotal, nama_barang) FROM stdin;
93	34	75	1	34332	34332	\N
94	34	76	1	31440	31440	\N
95	34	77	1	33864	33864	\N
96	34	78	1	16019	16019	\N
97	35	1	4	97584	390336	\N
98	35	3	12	10730	128760	\N
99	36	2	12	12444	149328	\N
100	36	6	1	9027	9027	\N
101	37	33	6	36126	216756	\N
102	37	34	6	419328	2515968	\N
103	38	7	1	165756	165756	\N
104	38	8	1	142920	142920	\N
105	38	11	1	79200	79200	\N
106	38	12	1	121200	121200	\N
107	38	14	1	184200	184200	\N
108	38	15	1	90312	90312	\N
109	38	16	1	116808	116808	\N
110	38	17	1	39126	39126	\N
111	38	18	1	33276	33276	\N
112	38	19	1	39024	39024	\N
113	38	20	1	35160	35160	\N
114	39	75	5	38112	190560	\N
115	39	77	10	37584	375840	\N
116	39	76	2	34896	69792	\N
117	39	78	6	17781	106686	\N
118	40	75	9	40000	360000	\N
119	40	76	5	34896	174480	\N
120	40	77	20	37584	751680	\N
121	41	36	2	425736	851472	\N
122	41	38	2	364824	729648	\N
123	41	40	2	425736	851472	\N
124	42	16	4	116808	467232	\N
125	42	17	5	39126	195630	\N
126	42	18	6	33276	199656	\N
127	42	19	6	39024	234144	\N
128	42	20	5	35160	175800	\N
129	42	21	6	41160	246960	\N
130	42	22	6	35160	210960	\N
131	42	23	6	41160	246960	\N
132	42	24	7	27000	189000	\N
133	42	25	5	35160	175800	\N
134	42	26	5	31680	158400	\N
135	42	27	5	35160	175800	\N
136	42	28	4	94800	379200	\N
137	42	29	4	94800	379200	\N
138	42	30	4	31680	126720	\N
139	43	53	100	11874	1187400	\N
140	43	54	100	11874	1187400	\N
141	44	32	100	40098	4009800	\N
142	44	33	100	36126	3612600	\N
143	45	57	10	421800	4218000	\N
144	45	58	10	421800	4218000	\N
145	45	59	10	421800	4218000	\N
146	45	60	10	421800	4218000	\N
147	45	61	10	421800	4218000	\N
148	45	62	10	421800	4218000	\N
149	46	50	100	24704	2470400	\N
150	46	51	100	16510	1651000	\N
151	47	3	10	128760	1287600	\N
152	47	8	10	128760	1287600	\N
153	48	46	100	280000	28000000	\N
154	49	92	4	2880000	11520000	\N
155	49	90	5	1560000	7800000	\N
156	50	88	1000	10500	10500000	\N
157	51	89	1	3920000	3920000	\N
158	52	36	7	425736	2980152	\N
159	53	89	10	98000	980000	\N
160	54	34	5	419328	2096640	\N
161	54	36	5	425736	2128680	\N
162	55	90	11	65000	715000	\N
163	56	71	100	84168	8416800	\N
164	56	72	100	190932	19093200	\N
165	56	73	100	240684	24068400	\N
166	58	1	1	97584	97344	\N
167	58	2	2	149328	298656	\N
168	59	91	1	350000	350000	\N
169	60	91	1	350000	350000	\N
170	61	74	10	61500	610000	\N
171	62	6	2	9028	17956	\N
172	62	7	2	13813	27626	\N
173	63	42	10	252186	2521860	\N
174	63	41	10	460704	4607040	\N
175	63	56	100	27429	2742900	\N
176	63	39	10	446784	4467840	\N
177	63	52	100	27430	2743000	\N
178	64	91	1	400000	400000	\N
179	65	32	3	6683	20049	\N
180	65	33	3	6021	18063	\N
181	65	34	3	11648	34944	\N
182	65	89	10	98000	980000	\N
183	65	93	1	16800000	16800000	\N
184	65	92	1	2880000	2880000	\N
185	66	32	1	40098	40098	\N
186	66	33	1	36126	36126	\N
187	66	39	1	446784	446784	\N
188	66	89	12	2450	29400	\N
189	67	91	12	10000	120000	\N
190	68	94	10	0	0	\N
191	69	75	5	39996	199980	\N
192	69	76	5	34896	174480	\N
193	69	77	5	37584	187920	\N
194	70	94	20	0	0	\N
195	70	91	10	10000	100000	\N
196	70	1	10	8132	81320	\N
197	70	2	10	12444	124440	\N
198	70	3	1	128760	128760	\N
199	70	6	1	120600	120600	\N
200	70	7	1	185544	185544	\N
201	70	8	1	128760	128760	\N
202	70	11	1	79200	79200	\N
203	70	12	1	121200	121200	\N
204	70	14	1	184200	184200	\N
205	70	15	1	90312	90312	\N
206	70	16	1	116808	116808	\N
207	70	17	1	39126	39126	\N
208	70	18	1	33276	33276	\N
209	70	19	1	39024	39024	\N
210	70	20	1	35160	35160	\N
211	70	21	6	6860	41160	\N
212	70	22	1	2930	2930	\N
213	71	23	1	41160	41160	\N
214	71	24	1	27000	27000	\N
215	71	25	1	35160	35160	\N
216	71	26	1	31680	31680	\N
217	71	27	1	35160	35160	\N
218	71	28	1	94800	94800	\N
219	71	29	1	94800	94800	\N
220	71	30	1	31680	31680	\N
221	71	31	1	184200	184200	\N
222	71	32	6	6683	40098	\N
223	71	33	6	6021	36126	\N
224	71	34	6	11648	69888	\N
225	71	35	6	17929	107574	\N
226	71	36	6	11826	70956	\N
227	71	37	6	24491	146946	\N
228	71	38	6	10134	60804	\N
229	71	39	6	18616	111696	\N
230	71	40	6	11826	70956	\N
231	71	41	6	19196	115176	\N
232	71	42	6	42031	252186	\N
233	71	46	1	280000	280000	\N
234	71	50	3	24704	74112	\N
235	71	51	3	16510	49530	\N
236	71	52	3	27430	82290	\N
237	71	53	3	11874	35622	\N
238	71	54	3	11874	35622	\N
239	71	55	3	27430	82290	\N
240	71	56	3	27429	82287	\N
241	71	57	3	10545	31635	\N
242	71	58	12	10545	126540	\N
243	71	59	12	10545	126540	\N
244	71	60	12	10545	126540	\N
245	71	61	12	10545	126540	\N
246	71	62	12	421800	5061600	\N
247	71	63	3	3103	9309	\N
248	71	64	3	3103	9309	\N
249	71	65	3	3444	10332	\N
250	71	66	3	3103	9309	\N
251	71	67	3	8129	24387	\N
252	71	68	3	8129	24387	\N
253	71	69	3	8129	24387	\N
254	71	70	3	8129	24387	\N
255	71	71	3	7014	21042	\N
256	71	72	1	15911	15911	\N
257	71	73	1	240684	240684	\N
258	71	74	6	427	2562	\N
259	71	75	2	39996	79992	\N
260	72	94	10	0	0	\N
261	72	90	12	2708	32496	\N
262	72	92	12	120000	1440000	\N
263	72	93	12	140000	1680000	\N
264	72	89	40	2450	98000	\N
265	72	91	10	10000	100000	\N
266	72	1	10	8132	81320	\N
267	72	2	10	12444	124440	\N
268	72	3	12	10730	128760	\N
269	72	6	12	10050	120600	\N
270	73	11	12	6600	79200	\N
271	73	12	12	10100	121200	\N
272	73	3	12	10730	128760	\N
273	73	6	12	10050	120600	\N
274	73	7	12	15462	185544	\N
275	73	14	11	15350	168850	\N
276	73	17	12	6521	78252	\N
277	73	18	12	2773	33276	\N
278	73	16	12	9734	116808	\N
279	74	7	1	185544	185544	\N
280	74	11	1	79200	79200	\N
281	74	12	1	121200	121200	\N
282	74	14	1	184200	184200	\N
283	74	15	1	90312	90312	\N
284	74	16	1	116808	116808	\N
285	74	17	1	39126	39126	\N
286	74	18	1	33276	33276	\N
287	74	19	1	39024	39024	\N
288	74	20	1	35160	35160	\N
289	74	21	1	41160	41160	\N
290	74	22	1	35160	35160	\N
291	74	23	1	41160	41160	\N
292	74	24	1	27000	27000	\N
293	74	25	1	35160	35160	\N
294	74	26	1	31680	31680	\N
295	74	27	1	35160	35160	\N
296	74	28	1	94800	94800	\N
297	74	29	1	94800	94800	\N
298	74	30	1	31680	31680	\N
299	74	31	1	184200	184200	\N
300	74	32	3	6683	20049	\N
301	74	33	3	6021	18063	\N
302	74	34	3	11648	34944	\N
303	74	35	3	17929	53787	\N
304	74	36	3	11826	35478	\N
305	74	37	3	24491	73473	\N
306	74	39	3	18616	55848	\N
307	74	38	3	10134	30402	\N
308	74	40	3	11826	35478	\N
309	74	41	3	19196	57588	\N
310	74	42	3	42031	126093	\N
311	74	46	3	28000	84000	\N
312	74	50	3	24704	74112	\N
313	74	51	3	16510	49530	\N
314	74	52	3	27430	82290	\N
315	74	53	3	11874	35622	\N
316	74	54	3	11874	35622	\N
317	74	55	3	27430	82290	\N
318	74	56	3	27429	82287	\N
319	74	57	3	10545	31635	\N
320	74	58	3	10545	31635	\N
321	74	59	3	10545	31635	\N
322	74	60	3	10545	31635	\N
323	74	61	3	10545	31635	\N
324	74	62	3	421800	1265400	\N
325	74	63	3	3103	9309	\N
326	74	64	3	3103	9309	\N
327	74	65	3	3444	10332	\N
328	74	67	3	8129	24387	\N
329	74	66	3	3103	9309	\N
330	74	68	3	8129	24387	\N
331	74	69	3	8129	24387	\N
332	74	70	3	8129	24387	\N
333	74	71	1	84168	84168	\N
334	74	72	1	190932	190932	\N
335	74	73	1	240684	240684	\N
336	74	74	1	10248	10248	\N
337	74	75	1	39996	39996	\N
338	74	76	1	34896	34896	\N
339	74	77	1	37584	37584	\N
340	74	78	3	17781	53343	\N
341	75	91	1	400000	400000	\N
342	75	1	12	8132	97584	\N
343	75	2	12	12444	149328	\N
344	75	3	12	10730	128760	\N
345	75	6	12	10050	120600	\N
346	75	7	12	15462	185544	\N
347	75	11	12	6600	79200	\N
348	75	12	12	10100	121200	\N
349	75	14	12	15350	184200	\N
350	75	15	12	7526	90312	\N
351	76	94	6	5000	30000	\N
352	76	91	9	10000	90000	\N
353	76	1	1	8132	8132	\N
354	76	2	1	149328	149328	\N
355	76	3	1	128760	128760	\N
356	76	6	1	120600	120600	\N
357	76	7	1	185544	185544	\N
358	76	8	6	10730	64380	\N
359	76	11	6	6600	39600	\N
360	77	1	1	97584	97584	\N
361	77	2	1	149328	149328	\N
362	77	3	1	128760	128760	\N
363	77	6	1	120600	120600	\N
364	77	71	1	84168	84168	\N
365	77	72	1	190932	190932	\N
366	78	3	1	128760	128760	\N
367	78	6	1	120600	120600	\N
368	78	1	1	97584	97584	\N
369	78	71	1	84168	84168	\N
370	78	72	1	190932	190932	\N
371	78	73	1	240684	240684	\N
372	79	94	1	300000	300000	\N
373	79	91	12	10000	120000	\N
374	79	89	1	98000	98000	\N
375	79	93	1	1400000	1400000	\N
376	79	90	1	64992	64992	\N
377	80	76	2	34896	69792	\N
378	80	77	2	37584	75168	\N
379	80	89	1	98000	98000	\N
380	80	90	1	64992	64992	\N
381	81	94	1	300000	300000	\N
382	81	16	1	116808	116808	\N
383	81	17	1	39126	39126	\N
384	81	18	1	33276	33276	\N
385	81	19	1	39024	39024	\N
386	81	20	1	35160	35160	\N
387	81	21	1	41160	41160	\N
388	81	22	1	35160	35160	\N
389	81	23	1	41160	41160	\N
390	81	24	1	27000	27000	\N
391	81	25	1	35160	35160	\N
392	81	27	1	35160	35160	\N
393	81	28	1	94800	94800	\N
394	81	31	1	184200	184200	\N
395	81	32	3	6683	20049	\N
396	81	33	3	6021	18063	\N
397	81	34	2	11648	23296	\N
398	81	35	3	17929	53787	\N
399	81	36	2	11826	23652	\N
400	81	37	2	24491	48982	\N
401	81	38	3	10134	30402	\N
402	81	39	3	18616	55848	\N
403	81	56	10	27429	274290	\N
404	81	57	10	10545	105450	\N
405	81	58	10	10545	105450	\N
406	81	59	10	10545	105450	\N
407	81	60	10	10545	105450	\N
408	81	61	10	10545	105450	\N
409	81	63	3	3103	9309	\N
410	81	64	3	3103	9309	\N
411	81	65	3	3444	10332	\N
412	81	66	3	3103	9309	\N
413	81	67	3	8129	24387	\N
414	81	68	3	8129	24387	\N
415	81	69	3	8129	24387	\N
416	81	70	3	8129	24387	\N
417	81	71	1	84168	84168	\N
418	81	72	1	190932	190932	\N
419	81	73	1	240684	240684	\N
420	81	89	1	98000	98000	\N
421	82	94	12	5000	60000	\N
422	82	91	12	10000	120000	\N
423	82	1	12	8132	97584	\N
424	82	2	12	12444	149328	\N
425	82	3	12	10730	128760	\N
426	82	6	12	10050	120600	\N
427	82	17	12	6521	78252	\N
428	82	31	6	15350	92100	\N
429	82	32	6	6683	40098	\N
430	82	33	6	6021	36126	\N
431	82	34	3	11648	34944	\N
432	82	46	3	28000	84000	\N
433	83	1	1	97584	97584	\N
434	83	3	1	128760	128760	\N
435	83	65	1	41328	41328	\N
436	83	15	1	90312	90312	\N
437	83	31	1	184200	184200	\N
438	84	94	6	5000	30000	\N
439	84	91	6	10000	60000	\N
440	84	75	5	39996	199980	\N
441	84	76	3	34896	104688	\N
442	84	77	3	37584	112752	\N
443	84	32	6	6683	40098	\N
444	84	33	6	6021	36126	\N
445	84	34	6	11648	69888	\N
446	84	35	6	17929	107574	\N
447	84	37	6	24491	146946	\N
448	84	38	6	10134	60804	\N
449	84	15	12	7526	90312	\N
450	84	16	12	9734	116808	\N
451	84	17	6	6521	39126	\N
452	84	18	12	2773	33276	\N
453	84	19	12	3252	39024	\N
454	84	20	12	2930	35160	\N
455	84	21	12	6860	82320	\N
456	85	57	12	10545	126540	\N
457	85	60	12	10545	126540	\N
458	85	61	12	10545	126540	\N
459	86	2	1	149328	149328	\N
460	86	3	1	128760	128760	\N
461	86	7	1	185544	185544	\N
462	86	8	1	128760	128760	\N
463	86	11	1	79200	79200	\N
464	86	15	1	90312	90312	\N
465	86	32	3	6683	20049	\N
466	86	33	3	6021	18063	\N
467	86	94	6	5000	30000	\N
468	86	63	3	3103	9309	\N
469	86	64	3	3103	9309	\N
470	86	65	3	3444	10332	\N
471	86	66	3	3103	9309	\N
472	86	67	3	8129	24387	\N
473	86	68	3	8129	24387	\N
474	86	70	3	8129	24387	\N
475	87	94	6	5000	30000	\N
476	87	91	6	10000	60000	\N
477	87	1	6	8132	48792	\N
478	87	2	6	12444	74664	\N
479	87	3	6	10730	64380	\N
480	87	6	6	120600	723600	\N
481	88	8	3	10730	32190	\N
482	88	11	4	79200	316800	\N
483	88	17	4	6521	26084	\N
484	88	18	5	33276	166380	\N
485	88	19	5	39024	195120	\N
486	89	91	10	10000	100000	\N
487	89	1	1	97584	97584	\N
488	89	6	1	120600	120600	\N
489	89	51	5	16510	82550	\N
490	89	89	1	98000	98000	\N
491	90	94	10	5000	50000	\N
492	90	91	10	10000	100000	\N
493	91	94	10	5000	50000	\N
494	91	1	10	8132	81320	\N
495	91	2	10	12444	124440	\N
496	91	3	10	10730	107300	\N
497	91	17	10	6521	65210	\N
498	91	18	10	2773	27730	\N
499	91	19	10	3252	32520	\N
500	91	20	10	2930	29300	\N
501	91	21	10	6860	68600	\N
502	91	22	10	2930	29300	\N
503	91	23	10	6860	68600	\N
504	91	24	10	2250	22500	\N
505	91	25	10	2930	29300	\N
506	91	26	10	2640	26400	\N
507	91	27	10	2930	29300	\N
508	91	28	10	7900	79000	\N
509	91	29	10	15800	158000	\N
510	91	30	10	2640	26400	\N
511	91	31	10	15350	153500	\N
512	91	32	10	6683	66830	\N
513	92	6	10	10050	100500	\N
514	92	7	10	15462	154620	\N
515	92	8	10	10730	107300	\N
516	92	11	10	6600	66000	\N
517	92	12	10	10100	101000	\N
518	92	14	10	15350	153500	\N
519	92	15	10	7526	75260	\N
520	92	16	10	9734	97340	\N
521	92	33	10	6021	60210	\N
522	92	34	10	11648	116480	\N
523	92	35	10	17929	179290	\N
524	92	36	10	11826	118260	\N
525	92	37	10	24491	244910	\N
526	92	38	10	10134	101340	\N
527	92	39	10	18616	186160	\N
528	92	40	10	11826	118260	\N
529	92	41	10	19196	191960	\N
530	92	42	10	42031	420310	\N
531	92	46	10	28000	280000	\N
532	93	36	6	11826	70956	\N
533	93	37	6	24491	146946	\N
534	93	38	6	10134	60804	\N
535	93	39	6	18616	111696	\N
536	93	40	6	11826	70956	\N
537	93	41	6	19196	115176	\N
538	94	94	6	5000	30000	\N
539	94	91	6	10000	60000	\N
540	94	1	6	8132	48792	\N
541	94	2	6	12444	74664	\N
542	94	3	6	10730	64380	\N
543	94	6	6	10050	60300	\N
544	94	7	6	15462	92772	\N
545	94	8	6	10730	64380	\N
546	94	11	6	6600	39600	\N
547	95	1	1	97584	97584	\N
548	95	2	1	149328	149328	\N
549	95	3	1	128760	128760	\N
550	95	6	1	120600	120600	\N
551	95	7	1	185544	185544	\N
552	95	8	1	128760	128760	\N
553	95	11	1	79200	79200	\N
554	95	12	1	121200	121200	\N
555	95	14	1	184200	184200	\N
556	95	15	1	90312	90312	\N
557	95	71	1	84168	84168	\N
558	95	72	1	190932	190932	\N
559	95	73	1	240684	240684	\N
560	96	2	1	149328	149328	\N
561	96	1	1	97584	97584	\N
562	96	3	1	128760	128760	\N
563	96	6	1	120600	120600	\N
564	96	7	1	185544	185544	\N
565	96	8	1	128760	128760	\N
566	96	12	1	121200	121200	\N
567	96	14	1	184200	184200	\N
568	96	15	1	90312	90312	\N
569	97	50	5	24704	123520	\N
570	97	51	5	16510	82550	\N
571	97	52	5	27430	137150	\N
572	97	53	3	11874	35622	\N
573	97	54	3	11874	35622	\N
574	97	57	10	10545	105450	\N
575	97	58	10	10545	105450	\N
576	97	64	6	3103	18618	\N
577	98	75	9	3333	29997	\N
578	98	76	5	1454	7270	\N
579	98	77	20	1566	31320	\N
580	99	78	20	17781	340000	\N
581	100	78	10	17000	170000	\N
582	101	78	20	17000	340000	\N
583	102	78	10	17000	170000	\N
584	103	76	10	1454	14540	\N
585	104	75	10	3333	33330	\N
586	105	76	2	1454	2908	\N
587	106	76	3	1454	4362	\N
588	107	76	16	1454	23264	\N
589	108	76	14	1454	20356	\N
590	109	94	1	300000	300000	\N
591	110	94	1	5000	4900	\N
592	111	94	1	5000	5000	\N
593	112	94	1	5000	4900	\N
594	112	91	1	10000	10000	\N
595	113	94	2	5000	10000	\N
596	113	91	1	10000	10000	\N
597	114	94	2	5000	9800	\N
598	114	91	1	10000	10000	\N
599	115	94	2	4677	9154	\N
600	115	91	1	9545	9545	\N
601	116	11	1	79200	79200	\N
602	117	12	1	121200	121200	\N
603	118	21	13	41160	535080	\N
604	119	33	1	36126	36126	\N
605	119	34	6	11648	69888	\N
606	120	1	3	8132	24396	\N
607	120	3	1	10730	10730	\N
608	121	1	3	8132	24396	\N
609	122	78	1	17000	17000	\N
610	123	75	99	39996	3959604	\N
611	123	76	100	34896	3489600	\N
612	123	77	100	37584	3758400	\N
613	123	78	98	17000	1666000	\N
614	124	39	4	446784	1787136	\N
615	124	41	5	460704	2303520	\N
616	125	92	9	2880000	25920000	\N
617	125	42	2	252186	504372	\N
618	125	41	2	460704	921408	\N
619	125	39	2	446784	893568	\N
620	125	37	2	587784	1175568	\N
621	126	63	1	37236	37236	\N
622	127	31	6	15350	92100	\N
623	128	34	12	11648	139776	\N
624	129	35	12	17929	215148	\N
625	130	55	12	27430	329160	\N
\.


--
-- Data for Name: forecast_stok; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.forecast_stok (id, id_barang, id_cabang, stok_sekarang, ads, estimasi_habis_hari, tanggal_habis, status, created_at) FROM stdin;
\.


--
-- Data for Name: hari_libur; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hari_libur (id, tanggal, nama_libur, keterangan) FROM stdin;
1	2025-01-01	Tahun Baru Masehi	Libur Nasional
2	2025-04-09	Hari Raya Idul Fitri	Libur Nasional
3	2025-04-10	Hari Raya Idul Fitri	Libur Nasional
4	2025-05-01	Hari Buruh	Libur Nasional
5	2025-12-25	Hari Natal	Libur Nasional
16	2025-01-01	Tahun Baru Masehi	Libur Nasional
17	2025-04-09	Hari Raya Idul Fitri	Libur Nasional
18	2025-04-10	Hari Raya Idul Fitri	Libur Nasional
19	2025-05-01	Hari Buruh	Libur Nasional
20	2025-12-25	Hari Natal	Libur Nasional
\.


--
-- Data for Name: hutang_karyawan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hutang_karyawan (id, user_id, nominal, tanggal, keterangan, status) FROM stdin;
1	134	0	2026-06-05	\N	lunas
\.


--
-- Data for Name: infaq; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.infaq (id, id_penjualan, no_invoice, jumlah_infaq, id_cabang, id_user, waktu) FROM stdin;
1	112	INV/20251006/3/0004	200	3	4	2025-10-06 11:31:15
2	117	INV/20251007/3/0003	200	3	4	2025-10-07 08:50:22
3	118	INV/20251007/3/0004	200	3	4	2025-10-07 08:55:59
4	119	INV/20251007/3/0005	200	3	4	2025-10-07 09:06:37
5	120	INV/20251007/3/0006	200	3	4	2025-10-07 09:09:21
6	121	INV/20251007/3/0007	200	3	4	2025-10-07 09:11:14
7	137	INV/20251023/6/0001	200	6	80	2025-10-23 03:35:13
8	146	INV/20251116/10/0002	100	10	69	2025-11-16 08:10:18
9	152	INV/20251116/10/0004	100	10	69	2025-11-16 09:05:26
10	153	INV/20251116/10/0005	100	10	69	2025-11-16 09:14:12
11	159	INV/20251116/10/0008	100	10	69	2025-11-16 12:05:01
12	167	INV/20251118/15/0001	300	15	76	2025-11-18 04:00:30
13	181	INV/20251122/18/0002	200	18	98	2025-11-22 08:14:57
\.


--
-- Data for Name: izin_cuti; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.izin_cuti (id, user_id, jenis, tanggal_mulai, tanggal_selesai, keterangan, bukti_file, status, tanggal_pengajuan, tanggal_approval, approver_id, catatan_approval) FROM stdin;
1	179	izin	2026-06-05	2026-06-06		\N	pending	2026-06-05 00:24:19	\N	\N	\N
\.


--
-- Data for Name: jabatan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jabatan (id_jabatan, jabatan) FROM stdin;
1	Super User
2	IT
3	HRD
4	Bendahara
5	Admin
6	Pramuniaga
7	Kasir
8	Manager
9	Driver
10	Admin Gudang
11	SPV
\.


--
-- Data for Name: jam_kerja; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jam_kerja (id, nama_shift, jam_masuk, jam_masuk_batas_akhir, jam_pulang, jam_pulang_batas_awal, keterangan) FROM stdin;
1	shift1	06:30:00	07:00:00	14:00:00	13:50:00	Shift Toko Pagi
2	shift2	13:30:00	14:00:00	21:30:00	21:20:00	Shift Toko Siang
3	kantor	08:00:00	08:15:00	16:00:00	15:45:00	Karyawan Kantor
\.


--
-- Data for Name: jurnal_umum; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jurnal_umum (id, tanggal_transaksi, no_referensi_bukti, deskripsi, akun_id, cabang_id, debit, kredit, dibuat_oleh, created_at) FROM stdin;
3	2026-06-05	BYS-134-2026-06	Beban Gaji Abdi: ABDUL KHOLIK (Periode 6/2026)	8	9	330000	0	4	2026-06-05 02:08:19
4	2026-06-05	BYS-134-2026-06	Pembayaran Gaji Abdi: ABDUL KHOLIK (Periode 6/2026)	2	9	0	330000	4	2026-06-05 02:08:19
15	2026-06-05	BYS-150-2026-06	Beban Gaji Abdi: ABDULLAH AUVAL MAROM (Periode 6/2026)	37	16	364000	0	4	2026-06-05 02:15:16
16	2026-06-05	BYS-150-2026-06	Pembayaran Gaji Abdi: ABDULLAH AUVAL MAROM (Periode 6/2026)	2	16	0	364000	4	2026-06-05 02:15:16
17	2026-06-05	BYS-179-2026-06	Beban Gaji Abdi: A. JAUHARI ADI (Periode 6/2026)	37	14	150001	0	4	2026-06-05 02:18:59
18	2026-06-05	BYS-179-2026-06	Pembayaran Gaji Abdi: A. JAUHARI ADI (Periode 6/2026)	2	14	0	150001	4	2026-06-05 02:18:59
\.


--
-- Data for Name: kas_transaksi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kas_transaksi (id, nomor_transaksi, id_rekening, id_cabang, tipe, kategori, nominal, tanggal, keterangan, referensi_type, referensi_id, id_rekening_tujuan, bukti, status, id_jurnal, created_by, approved_by, created_at) FROM stdin;
\.


--
-- Data for Name: kasir_jadwal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kasir_jadwal (id, id_cabang, id_kasir, id_shift, tanggal, catatan, aktif, created_by, created_at) FROM stdin;
1	15	179	1	2026-08-01	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.095171+07
2	15	179	2	2026-08-02	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.106957+07
3	15	179	1	2026-08-03	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.109247+07
4	15	179	2	2026-08-04	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.11113+07
5	15	179	1	2026-08-05	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.112877+07
6	15	179	2	2026-08-06	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.114848+07
7	15	179	1	2026-08-07	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.117621+07
8	15	179	2	2026-08-08	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.120109+07
9	15	179	1	2026-08-09	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.122235+07
10	15	179	2	2026-08-10	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.124163+07
11	15	179	1	2026-08-11	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.126146+07
12	15	179	2	2026-08-12	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.127972+07
13	15	179	1	2026-08-13	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.129654+07
14	15	179	2	2026-08-14	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.131208+07
15	15	179	1	2026-08-15	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.133247+07
16	15	179	2	2026-08-16	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.135863+07
17	15	179	1	2026-08-17	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.138079+07
18	15	179	2	2026-08-18	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.140056+07
19	15	179	1	2026-08-19	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.14176+07
20	15	179	2	2026-08-20	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.143532+07
21	15	179	1	2026-08-21	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.145327+07
22	15	179	2	2026-08-22	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.147035+07
23	15	179	1	2026-08-23	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.14887+07
24	15	179	2	2026-08-24	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.151226+07
25	15	179	1	2026-08-25	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.1533+07
26	15	179	2	2026-08-26	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.155254+07
27	15	179	1	2026-08-27	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.156886+07
28	15	179	2	2026-08-28	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.158623+07
29	15	179	1	2026-08-29	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.160244+07
30	15	179	2	2026-08-30	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.161793+07
31	15	179	1	2026-08-31	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.163487+07
32	15	134	2	2026-08-01	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.165381+07
33	15	134	1	2026-08-02	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.169047+07
34	15	134	2	2026-08-03	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.170862+07
35	15	134	1	2026-08-04	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.172502+07
36	15	134	2	2026-08-05	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.174393+07
37	15	134	1	2026-08-06	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.176092+07
38	15	134	2	2026-08-07	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.177979+07
39	15	134	1	2026-08-08	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.179646+07
40	15	134	2	2026-08-09	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.1812+07
41	15	134	1	2026-08-10	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.183588+07
42	15	134	2	2026-08-11	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.186625+07
43	15	134	1	2026-08-12	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.189371+07
44	15	134	2	2026-08-13	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.190845+07
45	15	134	1	2026-08-14	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.192995+07
46	15	134	2	2026-08-15	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.194762+07
47	15	134	1	2026-08-16	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.196494+07
48	15	134	2	2026-08-17	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.198402+07
49	15	134	1	2026-08-18	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.200509+07
50	15	134	2	2026-08-19	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.203493+07
51	15	134	1	2026-08-20	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.206497+07
52	15	134	2	2026-08-21	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.208332+07
53	15	134	1	2026-08-22	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.209926+07
54	15	134	2	2026-08-23	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.211549+07
55	15	134	1	2026-08-24	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.213225+07
56	15	134	2	2026-08-25	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.214785+07
57	15	134	1	2026-08-26	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.216596+07
58	15	134	2	2026-08-27	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.219276+07
59	15	134	1	2026-08-28	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.220923+07
60	15	134	2	2026-08-29	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.222525+07
61	15	134	1	2026-08-30	Auto-generate rotasi: shift1	t	4	2026-08-12 09:54:40.224051+07
62	15	134	2	2026-08-31	Auto-generate rotasi: shift2	t	4	2026-08-12 09:54:40.22568+07
\.


--
-- Data for Name: kasir_shift; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kasir_shift (id, id_cabang, id_kasir, id_rekening, waktu_buka, waktu_tutup, saldo_awal, total_sistem, total_tunai, total_transfer, uang_fisik, selisih, setoran, catatan, status, verified_by, verified_at, created_at) FROM stdin;
\.


--
-- Data for Name: kategori_barang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kategori_barang (id_kategori, kode_kategori, nama_kategori) FROM stdin;
1	kt-001	Makanan
2	kt-002	Minuman
3	kt-003	Obat-obatan
5	KT00001	Shampoo
6	KT00002	Mie
7	KT00003	Pasta Gigi
9	KT00004	Minuman
10	KT00005	Sikat Gigi
11	KT00006	Lotion
12	KT00007	Rokok
\.


--
-- Data for Name: log_login; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.log_login (id, user_id, waktu, status, ip_address) FROM stdin;
1	\N	2025-07-30 10:27:13	gagal	\N
2	4	2025-07-30 10:27:40	sukses	::1
3	\N	2025-07-31 10:04:11	gagal	\N
4	\N	2025-07-31 10:04:16	gagal	\N
5	\N	2025-07-31 10:20:52	gagal	\N
6	4	2025-07-31 10:47:20	sukses	::1
7	4	2025-07-31 14:15:36	sukses	::1
8	4	2025-07-31 14:55:57	sukses	::1
9	4	2025-07-31 15:03:00	sukses	::1
10	4	2025-07-31 15:06:37	sukses	::1
11	4	2025-07-31 20:31:29	sukses	::1
12	4	2025-07-31 20:33:20	sukses	::1
13	4	2025-07-31 20:43:03	sukses	::1
14	4	2025-07-31 21:22:45	sukses	::1
15	4	2025-07-31 21:23:45	sukses	::1
16	4	2025-07-31 22:22:11	sukses	::1
17	4	2025-08-02 16:15:27	sukses	::1
18	9	2025-08-02 16:22:31	sukses	::1
19	4	2025-08-02 16:44:08	sukses	::1
20	9	2025-08-02 17:45:50	sukses	::1
21	4	2025-08-02 22:12:45	sukses	::1
22	9	2025-08-02 22:15:34	sukses	::1
23	4	2025-08-02 22:15:50	sukses	::1
24	9	2025-08-02 22:16:25	sukses	::1
25	4	2025-08-02 22:18:13	sukses	::1
26	4	2025-08-03 11:32:45	sukses	::1
27	4	2025-08-03 12:27:03	sukses	::1
28	4	2025-08-03 12:33:02	sukses	::1
29	4	2025-08-03 13:57:24	sukses	::1
30	4	2025-08-03 13:58:15	sukses	::1
31	4	2025-08-03 20:28:33	sukses	::1
32	4	2025-08-04 06:45:25	sukses	::1
33	4	2025-08-04 08:26:26	sukses	::1
34	\N	2025-08-04 08:26:57	gagal	::1
35	9	2025-08-04 08:27:03	sukses	::1
36	4	2025-08-04 08:27:48	sukses	::1
37	9	2025-08-04 08:37:47	sukses	::1
38	8	2025-08-04 08:38:06	sukses	::1
39	4	2025-08-04 08:42:21	sukses	::1
40	9	2025-08-04 09:14:59	sukses	::1
41	4	2025-08-04 09:20:46	sukses	::1
42	4	2025-08-04 09:24:11	sukses	::1
43	9	2025-08-04 09:46:41	sukses	::1
44	9	2025-08-04 11:12:25	sukses	::1
45	4	2025-08-04 12:45:07	sukses	::1
46	4	2025-08-05 08:43:07	sukses	::1
47	9	2025-08-05 10:06:31	sukses	::1
48	4	2025-08-05 11:52:03	sukses	::1
49	9	2025-08-05 12:20:31	sukses	::1
50	4	2025-08-05 12:38:24	sukses	::1
51	4	2025-08-07 07:24:21	sukses	::1
52	4	2025-08-07 11:13:08	sukses	::1
53	9	2025-08-07 15:03:07	sukses	::1
54	4	2025-08-07 20:00:03	sukses	::1
55	4	2025-08-07 21:39:02	sukses	::1
56	9	2025-08-07 22:30:42	sukses	::1
57	4	2025-08-07 22:42:35	sukses	::1
58	4	2025-08-08 09:43:06	sukses	::1
59	4	2025-08-08 13:37:27	sukses	::1
60	4	2025-08-08 14:10:11	sukses	::1
61	4	2025-08-08 16:54:39	sukses	::1
62	4	2025-08-08 17:22:18	sukses	::1
63	4	2025-08-08 17:28:16	sukses	::1
64	9	2025-08-08 17:32:52	sukses	::1
65	4	2025-08-08 17:33:41	sukses	::1
66	4	2025-08-08 17:38:15	sukses	::1
67	4	2025-08-08 17:38:41	sukses	::1
68	4	2025-08-09 06:47:13	sukses	::1
69	4	2025-08-09 07:40:46	sukses	::1
70	4	2025-08-09 09:01:21	sukses	::1
71	4	2025-08-09 10:29:29	sukses	::1
72	8	2025-08-09 10:31:50	sukses	::1
73	4	2025-08-09 10:32:07	sukses	::1
74	8	2025-08-09 10:32:43	sukses	::1
75	4	2025-08-09 10:40:51	sukses	::1
76	28	2025-08-09 10:49:00	sukses	::1
77	4	2025-08-09 10:49:09	sukses	::1
78	28	2025-08-09 10:50:00	sukses	::1
79	4	2025-08-09 13:34:57	sukses	::1
80	\N	2025-08-09 13:42:14	gagal	::1
81	8	2025-08-09 13:42:18	sukses	::1
82	4	2025-08-09 13:42:37	sukses	::1
83	4	2025-08-09 20:22:12	sukses	::1
84	4	2025-08-10 08:27:42	sukses	::1
85	4	2025-08-10 08:27:50	sukses	::1
86	4	2025-08-10 08:27:57	sukses	::1
87	4	2025-08-10 08:29:30	sukses	::1
88	9	2025-08-10 08:29:45	sukses	::1
89	9	2025-08-10 08:29:47	sukses	::1
90	9	2025-08-10 08:29:48	sukses	::1
91	9	2025-08-10 08:29:48	sukses	::1
92	9	2025-08-10 08:29:48	sukses	::1
93	9	2025-08-10 08:29:48	sukses	::1
94	9	2025-08-10 08:29:49	sukses	::1
95	9	2025-08-10 08:29:49	sukses	::1
96	4	2025-08-10 08:31:29	sukses	::1
97	4	2025-08-10 08:31:36	sukses	::1
98	4	2025-08-10 08:33:06	sukses	::1
99	4	2025-08-10 08:33:09	sukses	::1
100	4	2025-08-10 08:33:10	sukses	::1
101	4	2025-08-10 08:33:10	sukses	::1
102	4	2025-08-10 08:33:10	sukses	::1
103	4	2025-08-10 08:33:10	sukses	::1
104	4	2025-08-10 08:35:21	sukses	::1
105	4	2025-08-10 08:35:22	sukses	::1
106	4	2025-08-10 08:35:23	sukses	::1
107	4	2025-08-10 08:35:45	sukses	::1
108	4	2025-08-10 08:35:53	sukses	::1
109	4	2025-08-10 08:54:19	sukses	::1
110	4	2025-08-10 08:54:22	sukses	::1
111	4	2025-08-10 08:54:23	sukses	::1
112	4	2025-08-10 08:54:24	sukses	::1
113	4	2025-08-10 08:54:25	sukses	::1
114	4	2025-08-10 08:54:25	sukses	::1
115	8	2025-08-10 08:54:45	sukses	::1
116	4	2025-08-10 08:56:12	sukses	::1
117	4	2025-08-10 09:10:59	sukses	::1
118	28	2025-08-10 09:11:34	sukses	::1
119	4	2025-08-10 09:11:56	sukses	::1
120	4	2025-08-10 09:21:56	sukses	::1
121	4	2025-08-10 09:25:01	sukses	::1
122	4	2025-08-10 09:25:30	sukses	::1
123	4	2025-08-10 09:28:05	sukses	::1
124	4	2025-08-10 09:28:31	sukses	::1
125	4	2025-08-10 10:08:43	sukses	::1
126	4	2025-08-10 10:18:56	sukses	::1
127	8	2025-08-10 10:19:04	sukses	::1
128	4	2025-08-10 10:29:22	sukses	::1
129	4	2025-08-10 10:58:54	sukses	::1
130	4	2025-08-10 11:13:48	sukses	::1
131	4	2025-08-10 11:17:52	sukses	::1
132	4	2025-08-10 12:04:32	sukses	::1
133	4	2025-08-10 13:46:28	sukses	::1
134	4	2025-08-10 14:33:09	sukses	::1
135	4	2025-08-10 14:33:59	sukses	::1
136	4	2025-08-10 21:49:06	sukses	::1
137	4	2025-08-11 07:05:35	sukses	::1
138	4	2025-08-11 07:49:04	sukses	::1
139	8	2025-08-11 08:05:10	sukses	::1
140	4	2025-08-11 08:57:36	sukses	::1
141	4	2025-08-11 10:11:54	sukses	::1
142	10	2025-08-11 10:12:08	sukses	::1
143	10	2025-08-11 10:27:57	sukses	::1
144	4	2025-08-11 10:43:58	sukses	::1
145	4	2025-08-11 11:38:44	sukses	::1
146	4	2025-08-11 11:44:02	sukses	::1
147	4	2025-08-11 11:52:06	sukses	::1
148	4	2025-08-11 21:17:48	sukses	::1
149	4	2025-08-12 06:24:01	sukses	::1
150	4	2025-08-12 09:50:00	sukses	::1
151	4	2025-08-12 10:47:08	sukses	::1
152	4	2025-08-12 13:29:17	sukses	::1
153	4	2025-08-13 06:38:31	sukses	::1
154	10	2025-08-13 06:45:57	sukses	::1
155	8	2025-08-13 06:46:18	sukses	::1
156	9	2025-08-13 06:46:32	sukses	::1
157	4	2025-08-13 06:46:44	sukses	::1
158	4	2025-08-13 09:35:14	sukses	::1
159	4	2025-08-13 14:06:14	sukses	::1
160	4	2025-08-14 08:31:59	sukses	::1
161	4	2025-08-14 13:01:09	sukses	::1
162	8	2025-08-14 14:24:07	sukses	::1
163	8	2025-08-14 14:39:30	sukses	::1
164	8	2025-08-14 15:06:24	sukses	::1
165	8	2025-08-14 15:32:17	sukses	::1
166	8	2025-08-14 15:53:42	sukses	::1
167	8	2025-08-14 16:04:52	sukses	::1
168	8	2025-08-14 16:11:00	sukses	::1
169	8	2025-08-16 15:27:22	sukses	::1
170	8	2025-08-18 09:21:25	sukses	::1
171	8	2025-08-18 09:22:33	sukses	::1
172	4	2025-08-18 09:22:41	sukses	::1
173	4	2025-08-18 13:01:02	sukses	::1
174	8	2025-08-18 13:58:04	sukses	::1
175	8	2025-08-18 13:58:40	sukses	::1
176	8	2025-08-19 08:48:48	sukses	::1
177	4	2025-08-19 09:48:08	sukses	::1
178	4	2025-08-19 15:30:24	sukses	::1
179	8	2025-08-19 15:30:35	sukses	::1
180	8	2025-08-19 15:41:23	sukses	::1
181	4	2025-08-19 15:56:58	sukses	::1
182	4	2025-08-20 08:34:24	sukses	::1
183	4	2025-08-20 11:52:53	sukses	::1
184	8	2025-08-20 12:02:34	sukses	::1
185	8	2025-08-20 12:04:20	sukses	::1
186	4	2025-08-21 08:14:28	sukses	::1
187	4	2025-08-21 12:36:45	sukses	::1
188	4	2025-08-21 12:43:50	sukses	::1
189	4	2025-08-21 12:50:22	sukses	::1
190	4	2025-08-21 12:55:37	sukses	::1
191	4	2025-08-21 12:56:09	sukses	::1
192	4	2025-08-21 13:02:01	sukses	::1
193	4	2025-08-21 13:02:15	sukses	::1
194	4	2025-08-21 13:07:37	sukses	::1
195	4	2025-08-21 15:35:19	sukses	::1
196	4	2025-08-22 08:29:22	sukses	::1
197	4	2025-08-22 08:31:09	sukses	::1
198	4	2025-08-22 14:37:14	sukses	::1
199	4	2025-08-22 14:37:20	sukses	::1
200	4	2025-08-22 15:36:46	sukses	::1
201	8	2025-08-22 17:26:40	sukses	::1
202	4	2025-08-25 12:52:20	sukses	::1
203	4	2025-08-26 08:06:31	sukses	::1
204	4	2025-08-26 13:22:12	sukses	::1
205	4	2025-08-26 13:22:16	sukses	::1
206	8	2025-08-26 15:58:28	sukses	::1
207	4	2025-08-26 15:59:55	sukses	::1
208	8	2025-08-26 16:00:06	sukses	::1
209	4	2025-08-26 16:00:40	sukses	::1
210	8	2025-08-26 16:00:51	sukses	::1
211	4	2025-08-26 16:33:43	sukses	::1
212	4	2025-08-27 10:58:43	sukses	::1
213	4	2025-08-27 13:13:43	sukses	::1
214	4	2025-08-28 08:43:53	sukses	::1
215	4	2025-08-28 11:36:58	sukses	::1
216	4	2025-08-28 12:35:02	sukses	::1
217	4	2025-08-28 12:58:51	sukses	::1
218	4	2025-08-28 13:10:09	sukses	::1
219	4	2025-08-30 15:19:31	sukses	::1
220	4	2025-09-03 10:17:48	sukses	::1
221	4	2025-09-06 09:22:39	sukses	::1
222	4	2025-09-06 13:30:00	sukses	::1
223	4	2025-09-06 14:40:57	sukses	::1
224	4	2025-09-06 15:28:55	sukses	::1
225	4	2025-09-07 08:34:48	sukses	::1
226	4	2025-09-07 09:12:46	sukses	::1
227	8	2025-09-07 13:41:02	sukses	::1
228	8	2025-09-07 13:41:48	sukses	::1
229	4	2025-09-07 15:25:54	sukses	::1
230	4	2025-09-07 15:57:21	sukses	::1
231	4	2025-09-09 08:44:42	sukses	::1
232	4	2025-09-09 10:42:41	sukses	::1
233	4	2025-09-09 11:39:52	sukses	::1
234	8	2025-09-09 13:13:59	sukses	::1
235	4	2025-09-09 13:14:35	sukses	::1
236	4	2025-09-09 13:47:14	sukses	::1
237	4	2025-09-10 09:06:57	sukses	::1
238	4	2025-09-10 12:08:40	sukses	::1
239	4	2025-09-10 15:02:11	sukses	::1
240	4	2025-09-11 08:21:12	sukses	::1
241	4	2025-09-11 09:45:01	sukses	::1
242	8	2025-09-11 14:52:36	sukses	::1
243	4	2025-09-11 15:07:07	sukses	::1
244	4	2025-09-12 08:27:27	sukses	::1
245	4	2025-09-12 11:07:06	sukses	::1
246	4	2025-09-12 12:53:31	sukses	::1
247	4	2025-09-13 08:47:40	sukses	::1
248	4	2025-09-14 09:27:28	sukses	::1
249	4	2025-09-15 08:22:45	sukses	::1
250	4	2025-09-15 08:46:33	sukses	::1
251	4	2025-09-15 08:49:24	sukses	::1
252	4	2025-09-15 08:53:27	sukses	::1
253	4	2025-09-15 13:02:24	sukses	::1
254	4	2025-09-16 08:30:43	sukses	::1
255	4	2025-09-16 12:05:19	sukses	::1
256	4	2025-09-16 12:14:43	sukses	::1
257	4	2025-09-17 08:42:29	sukses	::1
258	4	2025-09-18 12:36:08	sukses	::1
259	4	2025-09-19 09:28:01	sukses	::1
260	4	2025-09-19 13:10:00	sukses	::1
261	4	2025-09-19 14:05:16	sukses	::1
262	4	2025-09-19 16:17:33	sukses	::1
263	4	2025-09-20 08:50:30	sukses	::1
264	4	2025-09-20 10:09:49	sukses	::1
265	4	2025-09-20 10:40:10	sukses	::1
266	4	2025-09-20 10:40:34	sukses	::1
267	4	2025-09-20 10:41:37	sukses	::1
268	4	2025-09-20 11:09:28	sukses	::1
269	4	2025-09-20 11:13:38	sukses	::1
270	4	2025-09-20 11:25:44	sukses	::1
271	4	2025-09-20 11:26:41	sukses	::1
272	4	2025-09-20 15:01:44	sukses	::1
273	4	2025-09-21 08:27:49	sukses	::1
274	4	2025-09-23 13:10:40	sukses	::1
275	4	2025-09-24 08:33:21	sukses	::1
276	4	2025-09-25 09:08:54	sukses	::1
277	4	2025-09-25 11:02:27	sukses	::1
278	4	2025-09-25 12:43:14	sukses	::1
279	4	2025-09-25 12:52:29	sukses	::1
280	4	2025-09-25 12:53:06	sukses	::1
281	4	2025-09-25 12:59:41	sukses	::1
282	4	2025-09-25 16:04:08	sukses	::1
283	4	2025-09-26 09:19:38	sukses	::1
284	4	2025-09-26 12:36:39	sukses	::1
285	4	2025-09-26 14:47:31	sukses	::1
286	4	2025-09-27 08:29:08	sukses	::1
287	4	2025-09-28 08:33:12	sukses	::1
288	8	2025-09-29 08:23:39	sukses	::1
289	4	2025-09-29 08:33:31	sukses	::1
290	4	2025-10-05 15:19:48	sukses	::1
291	4	2025-10-05 16:05:55	sukses	::1
292	4	2025-10-06 08:04:27	sukses	::1
293	4	2025-10-07 08:37:01	sukses	::1
294	8	2025-10-07 10:19:29	sukses	::1
295	4	2025-10-07 10:19:55	sukses	::1
296	8	2025-10-07 10:25:11	sukses	::1
297	4	2025-10-07 10:25:24	sukses	::1
298	4	2025-10-08 10:57:17	sukses	::1
299	4	2025-10-08 10:57:30	sukses	::1
300	4	2025-10-08 12:44:34	sukses	::1
301	8	2025-10-08 14:13:34	sukses	::1
302	8	2025-10-08 14:22:33	sukses	::1
303	4	2025-10-08 14:22:42	sukses	::1
304	8	2025-10-08 16:12:01	sukses	::1
305	4	2025-10-09 08:20:10	sukses	::1
306	8	2025-10-09 08:41:30	sukses	::1
307	8	2025-10-10 14:55:54	sukses	::1
308	4	2025-10-10 15:38:14	sukses	::1
309	4	2025-10-12 08:43:55	sukses	::1
310	8	2025-10-12 08:53:31	sukses	::1
311	4	2025-10-12 08:56:08	sukses	::1
312	8	2025-10-12 08:58:19	sukses	::1
313	4	2025-10-12 09:03:04	sukses	::1
314	8	2025-10-12 09:07:38	sukses	::1
315	4	2025-10-12 09:08:21	sukses	::1
316	8	2025-10-12 09:10:56	sukses	::1
317	8	2025-10-12 12:57:42	sukses	::1
318	4	2025-10-12 16:16:29	sukses	::1
319	8	2025-10-13 08:45:28	sukses	::1
320	4	2025-10-13 09:21:13	sukses	::1
321	8	2025-10-13 10:28:48	sukses	::1
322	4	2025-10-13 10:30:42	sukses	::1
323	8	2025-10-13 10:34:41	sukses	::1
324	61	2025-10-13 10:38:03	sukses	::1
325	4	2025-10-13 10:39:52	sukses	::1
326	8	2025-10-13 10:48:44	sukses	::1
327	4	2025-10-13 10:49:13	sukses	::1
328	8	2025-10-13 10:49:38	sukses	::1
329	4	2025-10-13 10:50:17	sukses	::1
330	59	2025-10-13 12:43:14	sukses	::1
331	4	2025-10-13 12:43:55	sukses	::1
332	4	2025-10-13 13:11:00	sukses	::1
333	8	2025-10-13 13:17:39	sukses	::1
334	4	2025-10-13 13:18:28	sukses	::1
335	8	2025-10-13 14:43:38	sukses	::1
336	4	2025-10-13 14:49:39	sukses	::1
337	61	2025-10-13 15:13:03	sukses	::1
338	4	2025-10-13 15:15:03	sukses	::1
339	59	2025-10-13 15:36:45	sukses	::1
340	4	2025-10-13 15:38:33	sukses	::1
341	8	2025-10-15 03:05:04	sukses	180.247.52.25
342	8	2025-10-15 03:08:02	sukses	180.247.52.25
343	8	2025-10-15 03:09:16	sukses	180.247.52.25
344	8	2025-10-15 03:15:11	sukses	180.247.52.25
345	8	2025-10-15 03:26:02	sukses	180.247.52.25
346	8	2025-10-15 03:27:35	sukses	180.247.52.25
347	8	2025-10-15 03:29:40	sukses	180.247.52.25
348	8	2025-10-15 03:35:08	sukses	180.247.52.25
349	8	2025-10-15 03:37:08	sukses	180.247.52.25
350	8	2025-10-15 03:38:09	sukses	180.247.52.25
351	8	2025-10-15 03:38:28	sukses	180.247.52.25
352	8	2025-10-15 03:41:55	sukses	180.247.52.25
353	8	2025-10-15 03:45:54	sukses	180.247.52.25
354	8	2025-10-15 04:12:25	sukses	180.247.52.25
355	4	2025-10-15 04:12:41	sukses	180.247.52.25
356	8	2025-10-15 05:22:43	sukses	180.247.52.25
357	8	2025-10-15 05:23:22	sukses	180.247.52.25
358	8	2025-10-15 05:29:06	sukses	180.247.52.25
359	8	2025-10-15 05:29:26	sukses	180.247.52.25
360	8	2025-10-15 05:30:33	sukses	180.247.52.25
361	4	2025-10-15 05:31:39	sukses	180.247.52.25
362	4	2025-10-15 05:32:29	sukses	180.247.52.25
363	4	2025-10-15 05:34:01	sukses	180.247.52.25
364	8	2025-10-15 05:34:32	sukses	180.247.52.25
365	59	2025-10-15 05:36:22	sukses	180.247.52.25
366	4	2025-10-15 05:37:51	sukses	2404:c0:3074:46c3:186e:7b6c:296b:9c42
367	4	2025-10-15 06:13:25	sukses	180.247.52.25
368	4	2025-10-15 06:18:34	sukses	180.247.52.25
369	4	2025-10-15 06:23:42	sukses	180.247.52.25
370	4	2025-10-15 06:25:57	sukses	180.247.52.25
371	4	2025-10-15 06:30:00	sukses	180.247.52.25
372	4	2025-10-15 06:37:18	sukses	180.247.52.25
373	4	2025-10-15 06:38:35	sukses	180.247.52.25
374	4	2025-10-15 06:48:55	sukses	180.247.52.25
375	4	2025-10-15 06:55:21	sukses	180.247.52.25
376	4	2025-10-15 07:12:23	sukses	180.247.52.25
377	4	2025-10-15 07:21:06	sukses	180.247.52.25
378	4	2025-10-15 07:29:39	sukses	180.247.52.25
379	4	2025-10-15 07:30:29	sukses	180.247.52.25
380	4	2025-10-15 07:34:27	sukses	180.247.52.25
381	4	2025-10-15 07:36:30	sukses	180.247.52.25
382	4	2025-10-15 07:41:16	sukses	180.247.52.25
383	4	2025-10-15 07:46:58	sukses	180.247.52.25
384	4	2025-10-15 07:57:25	sukses	180.247.52.25
385	4	2025-10-15 07:58:16	sukses	180.247.52.25
386	4	2025-10-15 08:09:48	sukses	180.247.52.25
387	4	2025-10-15 08:09:50	sukses	180.247.52.25
388	4	2025-10-15 08:09:54	sukses	180.247.52.25
389	4	2025-10-15 08:27:50	sukses	180.247.52.25
390	4	2025-10-15 08:29:40	sukses	180.247.52.25
391	8	2025-10-15 08:33:52	sukses	180.247.52.25
392	4	2025-10-15 08:42:01	sukses	180.247.52.25
393	8	2025-10-15 08:42:50	sukses	180.247.52.25
394	4	2025-10-15 08:44:45	sukses	180.247.52.25
395	8	2025-10-15 08:45:30	sukses	180.247.52.25
396	8	2025-10-15 23:26:13	sukses	114.125.127.212
397	8	2025-10-16 01:13:45	sukses	180.247.53.51
398	8	2025-10-16 02:04:35	sukses	180.247.53.51
399	4	2025-10-16 02:06:22	sukses	180.247.53.51
400	4	2025-10-16 02:11:19	sukses	180.247.53.51
401	4	2025-10-16 05:21:36	sukses	180.247.53.51
402	8	2025-10-16 05:23:10	sukses	180.247.53.51
403	8	2025-10-16 05:49:18	sukses	180.247.53.51
404	8	2025-10-16 05:50:18	sukses	180.247.53.51
405	4	2025-10-16 06:02:18	sukses	180.247.53.51
406	8	2025-10-16 06:33:46	sukses	180.247.53.51
407	8	2025-10-16 06:36:09	sukses	180.247.53.51
408	8	2025-10-16 06:47:16	sukses	180.247.53.51
409	4	2025-10-16 06:55:25	sukses	180.247.53.51
410	8	2025-10-16 06:55:35	sukses	180.247.53.51
411	8	2025-10-16 07:20:13	sukses	180.247.53.51
412	4	2025-10-16 07:26:42	sukses	157.15.63.74
413	8	2025-10-16 08:19:05	sukses	180.247.53.51
414	8	2025-10-16 08:19:07	sukses	180.247.53.51
415	8	2025-10-16 08:19:09	sukses	180.247.53.51
416	8	2025-10-16 08:21:32	sukses	180.247.53.51
417	8	2025-10-16 08:21:34	sukses	180.247.53.51
418	8	2025-10-16 08:22:57	sukses	180.247.53.51
419	8	2025-10-16 08:22:59	sukses	180.247.53.51
420	8	2025-10-16 08:23:20	sukses	180.247.53.51
421	8	2025-10-16 08:23:22	sukses	180.247.53.51
422	8	2025-10-16 08:24:38	sukses	180.247.53.51
423	8	2025-10-16 08:30:02	sukses	180.247.53.51
424	8	2025-10-16 08:32:55	sukses	180.247.53.51
425	8	2025-10-16 08:52:01	sukses	180.247.53.51
426	8	2025-10-16 08:52:03	sukses	180.247.53.51
427	8	2025-10-16 08:53:20	sukses	180.247.53.51
428	8	2025-10-16 08:59:35	sukses	180.247.53.51
429	8	2025-10-16 08:59:47	sukses	180.247.53.51
430	8	2025-10-16 09:11:56	sukses	180.247.53.51
431	8	2025-10-16 09:11:58	sukses	180.247.53.51
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.login_attempts (identifier, attempts, last_attempt) FROM stdin;
2013003:125.166.119.234	1	2025-11-03 05:58:11
2018013:180.247.52.94	1	2025-10-19 08:29:31
2019003:114.125.109.230	1	2025-10-23 16:08:25
2019003:125.166.119.234	8	2025-11-03 05:58:48
ABD WAKIL:125.166.117.214	22	2025-11-16 07:29:05
ABD. WAKIL:125.166.117.214	24	2025-11-16 07:30:03
ABD.WAKIL:125.166.117.214	6	2025-11-16 07:29:56
ABDUL WAKIL:125.166.117.214	10	2025-11-16 07:28:06
ABDULWAKIL:125.166.117.214	2	2025-11-16 07:29:10
ABDWAKIL:125.166.117.214	6	2025-11-16 07:29:02
Adi Sucipto:36.74.219.68	2	2025-10-25 12:15:17
ADMIN' 1=1 #:157.15.63.74	1	2025-11-05 23:18:54
ADMIN' OR 1=1 #:157.15.63.74	3	2025-11-05 23:19:52
admin11320100:2404:c0:3074:46c3:91b:b47b:7fe2:10bd	1	2025-10-15 05:15:14
admin123:157.15.63.74	2	2025-10-21 02:25:41
admin:2404:c0:3074:46c3:91b:b47b:7fe2:10bd	5	2025-10-15 05:04:11
afifuddin@mbu.co.id:157.15.63.74	1	2025-10-22 00:53:39
ALI MAKSUM:125.166.116.232	3	2025-11-22 08:33:30
firman:125.166.117.182	4	2025-10-22 01:21:32
FIRMAN:180.247.53.242	1	2025-10-23 01:36:12
fTxH6gPrpX:125.166.119.174	1	2025-11-19 06:26:14
k2011011:180.247.53.224	1	2025-11-01 14:42:57
K201106:180.247.52.86	1	2025-12-18 07:49:26
K2018004:36.73.178.132	3	2025-10-21 09:56:11
k2018010:103.160.182.155	2	2025-10-21 07:10:53
K20190003:125.166.117.182	4	2025-10-22 04:19:32
K20190003:125.166.119.234	4	2025-11-03 07:31:59
k202022:103.184.54.49	2	2025-10-24 13:46:38
K2021004:125.166.119.246	2	2025-10-24 06:53:12
K2022006:125.166.116.232	2	2025-11-22 08:36:39
M FIRMAN:125.166.117.182	6	2025-10-22 01:21:23
M SOFI:125.166.116.232	5	2025-11-22 08:35:23
M. FIRMAN:125.166.117.182	4	2025-10-22 01:22:05
MAKSUM:125.166.116.232	1	2025-11-22 08:33:12
Mamah:2404:c0:3074:46c3:91b:b47b:7fe2:10bd	1	2025-10-15 05:15:08
MSOFI:125.166.116.232	2	2025-11-22 08:35:14
MUHAMMAD FIRMAN:125.166.117.182	2	2025-10-22 01:22:54
Nenqmvkmvf:36.73.178.132	1	2025-10-21 09:53:34
SAIFUL:180.247.53.242	2	2025-10-23 01:36:03
sj410b vbc	1	2025-07-30 10:27:13
SOFI:125.166.116.232	4	2025-11-22 08:35:34
spv:180.247.53.242	8	2025-10-23 01:35:55
SULAIMAN:125.166.119.130	4	2025-10-22 00:43:08
Sulaiman@mbu.co.id:125.166.117.175	2	2025-10-21 09:35:59
SULAIMANmbu:125.166.119.130	1	2025-10-22 00:42:22
UMARUL FARUK:125.166.116.111	1	2025-10-22 00:33:13
UMARUL FARUK:125.166.117.214	2	2025-11-16 07:17:20
WAKIL:125.166.117.214	20	2025-11-16 07:28:54
\.


--
-- Data for Name: menu_main; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menu_main (id, nama, link, icon, urutan, aktif) FROM stdin;
37	Dashboard	/dashboard	LayoutDashboard	1	t
38	HRD & Abdi	#	Users	2	t
39	Barang	#	Package	3	t
40	Penjualan	#	ShoppingCart	4	t
41	Pelanggan	#	Users	5	t
42	Pembelian	#	ShoppingBag	6	t
43	Distribusi	#	Truck	7	t
44	Akuntansi	#	BookOpen	8	t
45	Cabang	/cabang	Building2	9	t
46	Pengaturan	#	Settings	10	t
47	Manajemen Kas	#	Banknote	9	t
\.


--
-- Data for Name: menu_sub; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.menu_sub (id, id_menu_main, nama, link, urutan, aktif) FROM stdin;
127	38	Daftar Abdi	/hrd/users	1	t
128	38	Absensi	/hrd/absensi	2	t
129	38	Jabatan	/hrd/jabatan	3	t
130	38	Jam Kerja	/hrd/jam-kerja	4	t
131	38	Hari Libur	/hrd/hari-libur	5	t
132	38	Izin & Cuti	/hrd/izin-cuti	6	t
133	38	Bisyaroh	/hrd/bisyaroh	7	t
134	39	Data Barang	/barang	1	t
135	39	Kategori	/kategori	2	t
136	39	Supplier	/supplier	3	t
137	39	Stok Barang	/stok	4	t
138	40	Kasir POS	/penjualan/pos	1	t
139	40	Riwayat Nota	/penjualan/history	2	t
140	40	Manajemen Promo	/penjualan/promo	3	t
141	41	Daftar Pelanggan	/pelanggan	1	t
142	41	Riwayat Poin	/pelanggan/poin	2	t
143	42	Purchase Order (PO)	/pembelian/po	1	t
147	43	Dasbor Distribusi	/distribusi/dashboard	1	t
148	43	Proyeksi Ketersediaan	/distribusi/forecast	2	t
149	43	Rekomendasi Pengiriman	/distribusi/rekomendasi	3	t
150	43	Transfer Antarcabang	/distribusi/transfer	4	t
151	43	Surat Jalan DC	/distribusi/pengiriman	5	t
152	43	Pemantauan GPS	/distribusi/monitoring	6	t
153	43	Selisih Pengiriman	/distribusi/selisih	7	t
154	44	Jurnal Umum	/akuntansi/jurnal	1	t
155	44	Daftar Akun (CoA)	/akuntansi/coa	2	t
156	44	Tipe Akun	/akuntansi/tipe	3	t
157	44	Buku Besar & Laporan	/akuntansi/laporan	4	t
158	46	Role Menu	/pengaturan/role-menu	1	t
159	47	Dashboard Kas	/kas/dashboard	1	t
160	47	Rekening Kas	/kas/rekening	2	t
161	47	Mutasi Kas	/kas/transaksi	3	t
163	47	Transfer Kas	/kas/transfer	5	t
164	47	Rekonsiliasi	/kas/rekonsiliasi	6	t
165	47	Laporan Kas	/kas/laporan	7	t
166	46	Pengaturan Aplikasi	/pengaturan/aplikasi	2	t
162	47	Shift Kasir	/kas/shift	4	f
171	42	Saran Order (Smart)	/pembelian/saran-order	2	t
144	42	Faktur Beli	/pembelian/invoice	4	t
145	42	Riwayat Faktur	/pembelian/history	5	t
146	42	Hutang Supplier	/pembelian/hutang	6	t
172	42	Sisa Pesanan (Backorder)	/pembelian/backorder	3	t
167	38	Shift Kasir	/hrd/shift-kasir	9	t
168	38	Laporan Shift	/hrd/shift-kasir/laporan	10	t
169	38	Jadwal Kasir	/hrd/jadwal-kasir	11	t
170	44	Profit Per Cabang	/akuntansi/profit-cabang	5	t
\.


--
-- Data for Name: pelanggan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pelanggan (id_pelanggan, kode_pelanggan, nama_lengkap, email, alamat, telepon, level_harga, total_poin) FROM stdin;
1	PLG-0001	Ahmad Mujahid	mujahid@gmail.com	Jl. Raya Al-Mubarok No. 12, Jember	081234567890	1	250
2	PLG-0002	UD Misfalah Utama	misfalah.utama@misfalah.com	Kawasan Industri Sukowono, Jember	081122334455	2	1500
3	PLG-0003	Koperasi Pondok Pesantren	kopontren@almubarok.org	Kompleks PP Al-Mubarok, Jember	081987654321	3	5000
54	PLG-0004	Ahamad	\N	-	-	1	0
\.


--
-- Data for Name: pengaturan_aplikasi; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pengaturan_aplikasi (key, value, updated_at) FROM stdin;
\.


--
-- Data for Name: pengiriman; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pengiriman (id_pengiriman, kode_pengiriman, id_cabang_sumber, id_cabang_tujuan, id_user_pengirim, id_user_penerima, jenis_pengiriman, id_rekomendasi, armada, driver, status, tanggal_kirim, tanggal_terima, created_at) FROM stdin;
1	SJ-20251013143209	3	5	4	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-13 07:32:09	\N	\N
2	SJ-20251013150914	3	6	4	80	CABANG	\N	\N	\N	Ada Selisih	2025-10-13 08:09:14	2025-12-19 07:57:48	\N
3	SJ-20251013152442	3	6	4	80	CABANG	\N	\N	\N	Diterima Penuh	2025-10-13 08:24:42	2025-12-19 15:18:19	\N
4	SJ-20251013153912	3	7	4	\N	CABANG	\N	\N	\N	Dikirim	2025-10-13 08:39:12	\N	\N
5	SJ-20251013155840	3	5	4	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-13 08:58:40	\N	\N
6	SJ-20251013155917	3	5	4	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-13 08:59:17	\N	\N
7	SJ-20251013160106	3	5	4	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-13 09:01:06	\N	\N
8	SJ-20251013160631	3	5	4	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-13 09:06:31	\N	\N
9	SJ-20251013161610	3	5	4	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-13 09:16:10	\N	\N
10	SJ-20251015111525	3	5	4	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-15 04:15:25	\N	\N
11	SJ-20251015111608	3	5	4	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-15 04:16:08	\N	\N
12	SJ-20251015111735	3	7	4	\N	CABANG	\N	\N	\N	Dikirim	2025-10-15 04:17:35	\N	\N
13	SJ-20251015120011	3	5	4	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-15 05:00:11	\N	\N
14	SJ-20251015154512	3	5	4	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-15 08:45:12	\N	\N
15	SJ-20251018120526	3	5	8	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-18 05:05:26	\N	\N
16	SJ-20251018120900	3	5	8	\N	CABANG	\N	\N	\N	Diterima Penuh	2025-10-18 05:09:00	\N	\N
17	SJ-20251018162926	3	13	91	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-18 09:29:26	\N	\N
18	SJ-20251019133302	3	13	8	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-19 06:33:02	\N	\N
19	SJ-20251019133527	3	5	8	\N	CABANG	\N	\N	\N	Diterima Penuh	2025-10-19 06:35:27	\N	\N
20	SJ-20251019144252	3	13	8	\N	CABANG	\N	\N	\N	Dikirim	2025-10-19 07:42:52	\N	\N
21	SJ-20251019161316	3	13	8	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-19 09:13:16	\N	\N
22	SJ-20251023095934	3	6	8	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-23 02:59:34	\N	\N
23	SJ-20251023114254	3	5	72	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-23 04:42:54	\N	\N
24	SJ-20251023120503	3	5	72	\N	CABANG	\N	\N	\N	Ada Selisih	2025-10-23 05:05:03	\N	\N
32	KIRIM/2025/11/KANTOR/0001	3	5	8	\N	CABANG	\N	\N	\N	Diterima Penuh	2025-11-11 06:38:19	\N	\N
33	KIRIM/2025/11/KANTOR/0002	3	6	8	\N	CABANG	\N	\N	\N	Ada Selisih	2025-11-12 03:28:26	\N	\N
34	KIRIM/2025/11/KANTOR/0003	3	6	8	\N	CABANG	\N	\N	\N	Diterima Penuh	2025-11-12 04:25:28	\N	\N
35	KIRIM/2025/11/KANTOR/0004	3	6	8	\N	CABANG	\N	\N	\N	Diterima Penuh	2025-11-12 04:31:17	\N	\N
36	KIRIM/2025/11/KANTOR/0005	3	6	8	\N	CABANG	\N	\N	\N	Ada Selisih	2025-11-12 04:41:43	\N	\N
37	KIRIM/2025/11/KANTOR/0006	3	6	8	\N	CABANG	\N	\N	\N	Ada Selisih	2025-11-12 04:45:57	\N	\N
38	KIRIM/2025/11/KANTOR/0007	3	6	8	80	CABANG	\N	\N	\N	Diterima Penuh	2025-11-12 07:19:23	2025-12-21 15:12:40	\N
39	KIRIM/2025/12/KANTOR/0001	3	6	8	\N	CABANG	\N	\N	\N	Dikirim	2025-12-21 06:07:54	\N	\N
40	KIRIM/2025/12/KANTOR/0002	3	7	8	\N	CABANG	\N	\N	\N	Dikirim	2025-12-21 06:10:28	\N	\N
42	KIRIM/2025/12/KANTOR/0003	3	7	8	\N	CABANG	\N	\N	\N	Dikirim	2025-12-21 13:17:12	\N	\N
43	KIRIM/2026/06/KANTOR/0001	3	5	4	\N	CABANG	\N	\N	\N	Dikirim	2026-06-04 10:03:31	\N	\N
\.


--
-- Data for Name: pengiriman_detail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pengiriman_detail (id_detail_kirim, id_pengiriman, id_barang, jumlah_dikirim, jumlah_diterima, id_request_detail, status_selisih, catatan_penerima) FROM stdin;
1	1	1	12	3	\N	Approved	rusak
2	1	2	12	12	\N	Pending	
3	2	1	12	11	\N	Pending	sobek
4	2	11	12	12	\N	Pending	
5	3	7	12	12	\N	Pending	
6	3	12	12	12	\N	Pending	
7	4	8	12	\N	\N	Pending	\N
8	5	1	5	\N	\N	Pending	\N
9	5	32	18	\N	\N	Pending	\N
10	6	32	12	\N	\N	Pending	\N
11	6	33	12	\N	\N	Pending	\N
12	7	32	36	\N	\N	Pending	\N
13	7	33	36	\N	\N	Pending	\N
14	8	32	36	\N	\N	Pending	\N
15	8	33	36	\N	\N	Pending	\N
16	8	77	24	24	\N	Pending	\N
17	9	32	36	18	\N	Approved	\N
18	9	33	36	18	\N	Approved	\N
19	9	77	24	\N	\N	Pending	\N
20	10	32	6	\N	\N	Pending	\N
21	11	33	12	\N	\N	Pending	\N
22	12	8	24	\N	\N	Pending	\N
23	13	77	24	\N	\N	Pending	\N
24	14	71	24	12	\N	Approved	\N
25	14	72	12	6	\N	Approved	\N
26	14	73	6	6	\N	Pending	\N
27	15	71	24	12	\N	Approved	ketinggalan
28	15	72	24	12	\N	Approved	ketinggalan
29	16	71	12	12	\N	Pending	
30	16	77	24	24	\N	Pending	
31	17	3	12	6	\N	Approved	Pernyut
32	17	8	12	\N	\N	Pending	\N
33	18	1	6	0	\N	Approved	Barang tidak di-scan saat penerimaan
34	18	50	12	11	\N	Approved	bocor
35	18	51	12	12	\N	Pending	
36	19	88	5	5	\N	Pending	
37	20	1	3	\N	\N	Pending	\N
38	21	1	6	0	\N	Approved	Barang tidak di-scan saat penerimaan
39	21	16	12	0	\N	Approved	Barang tidak di-scan saat penerimaan
40	21	50	6	6	\N	Pending	
41	21	51	6	5	\N	Approved	Bocor
42	22	77	48	0	\N	Approved	Barang tidak di-scan saat penerimaan
43	22	88	10	9	\N	Approved	Bocor
44	23	57	40	40	\N	Pending	
45	23	60	40	40	\N	Pending	
46	23	61	10	0	\N	Approved	Barang tidak di-scan saat penerimaan
47	24	1	6	5	\N	Approved	Pernyut
48	32	91	6	6	1	Pending	
49	33	3	12	12	406	Pending	
50	33	3	24	12	\N	Approved	
51	34	8	24	24	407	Pending	
52	35	52	6	6	428	Pending	
53	36	53	10	9	429	Approved	rusak
54	37	92	24	12	\N	Approved	
55	38	18	24	24	413	Pending	
56	39	32	6	\N	251	Pending	\N
57	40	1	12	\N	19	Pending	\N
58	42	71	12	\N	210	Pending	\N
59	43	1	12	\N	585	\N	\N
60	43	3	12	\N	586	\N	\N
61	43	6	12	\N	587	\N	\N
62	43	7	12	\N	588	\N	\N
63	43	8	12	\N	589	\N	\N
64	43	11	12	\N	590	\N	\N
65	43	12	12	\N	591	\N	\N
66	43	14	12	\N	592	\N	\N
67	43	15	12	\N	593	\N	\N
68	43	16	12	\N	594	\N	\N
69	43	94	12	\N	595	\N	\N
\.


--
-- Data for Name: pengiriman_selisih; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pengiriman_selisih (id, id_pengiriman, id_barang, jumlah_dikirim, jumlah_diterima, selisih, jenis_selisih, alasan, foto_bukti, status, dibuat_oleh, disetujui_oleh, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: penjualan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.penjualan (id_penjualan, no_invoice, tanggal_invoice, jam_invoice, id_pelanggan, nama_pelanggan, id_user, id_cabang, subtotal, diskon, nominal_voucher, potongan_poin, infaq, total_akhir, jenis_pembayaran, jumlah_bayar, id_voucher, poin_didapat, created_at) FROM stdin;
1	INV/3/202509/1757142274	2025-09-06	00:00:00	2		4	3	78000	500	0	0	0	77500	Tunai	0	\N	0	2026-05-31 14:58:29
2	INV/3/202509/1757148801	2025-09-06	00:00:00	\N	Umum	4	3	10500	0	0	0	0	10500	Kredit	0	\N	0	2026-05-31 14:58:29
3	INV/3/202509/1757148855	2025-09-06	00:00:00	9		4	3	20400	0	0	0	0	20400	Tunai	0	\N	0	2026-05-31 14:58:29
4	INV/3/202509/1757149815	2025-09-06	00:00:00	\N	Umum	4	3	9000	0	0	0	0	9000	Tunai	0	\N	0	2026-05-31 14:58:29
5	INV/3/202509/1757150297	2025-09-06	00:00:00	\N	Umum	4	3	36000	0	0	0	0	36000	Tunai	0	\N	0	2026-05-31 14:58:29
6	INV/3/202509/1757213613	2025-09-07	00:00:00	11		4	3	8900	0	0	0	0	8900	Tunai	0	\N	0	2026-05-31 14:58:29
7	INV/3/202509/1757382480	2025-09-09	00:00:00	\N	Umum	4	3	11000	0	0	0	0	11000	Tunai	0	\N	0	2026-05-31 14:58:29
8	INV/3/202509/1757399481	2025-09-09	00:00:00	19		4	3	6900	0	0	0	0	6900	Tunai	0	\N	0	2026-05-31 14:58:29
9	INV/3/202509/1757400214	2025-09-09	08:43:34	9		4	3	7500	0	0	0	0	7500	Tunai	0	\N	0	2026-05-31 14:58:29
10	INV/3/202509/1757400556	2025-09-09	13:49:16	10		4	3	2000	0	0	0	0	2000	Tunai	0	\N	0	2026-05-31 14:58:29
11	INV/3/202509/1757401609	2025-09-09	14:06:49	8		4	3	2000	0	0	0	0	2000	Tunai	0	\N	0	2026-05-31 14:58:29
12	INV/3/202509/1757405615	2025-09-09	15:13:35	16		4	3	42000	0	0	0	0	42000	Tunai	0	\N	0	2026-05-31 14:58:29
13	INV/3/202509/1757406878	2025-09-09	15:34:38	\N	Umum	4	3	40000	0	0	0	0	40000	Tunai	0	\N	0	2026-05-31 14:58:29
17	INV/3/202509/1757407881	2025-09-09	15:51:21	\N	Umum	4	3	40000	0	0	0	0	40000	Tunai	0	\N	0	2026-05-31 14:58:29
18	INV/3/202509/1757408213	2025-09-09	15:56:53	\N	Umum	4	3	40000	0	0	0	0	40000	Tunai	0	\N	0	2026-05-31 14:58:29
20	INV/20250925/3/0001	2025-09-25	13:01:47	\N	Umum	4	3	3500	0	0	0	0	3500	Tunai	4000	\N	0	2026-05-31 14:58:29
21	INV/20250925/3/0002	2025-09-25	13:04:39	\N	Umum	4	3	130000	0	0	0	0	130000	Tunai	150000	\N	0	2026-05-31 14:58:29
22	INV/20250925/3/0003	2025-09-25	13:04:48	\N	Umum	4	3	130000	0	0	0	0	130000	Tunai	150000	\N	0	2026-05-31 14:58:29
23	INV/20250925/3/0004	2025-09-25	13:04:52	\N	Umum	4	3	130000	0	0	0	0	130000	Tunai	150000	\N	0	2026-05-31 14:58:29
24	INV/20250925/3/0005	2025-09-25	13:05:09	\N	Umum	4	3	40000	0	0	0	0	40000	Tunai	40000	\N	0	2026-05-31 14:58:29
25	INV/20250925/3/0006	2025-09-25	13:14:59	\N	Umum	4	3	90000	0	0	0	0	90000	Tunai	100000	\N	0	2026-05-31 14:58:29
26	INV/20250925/3/0007	2025-09-25	13:22:36	\N	Umum	4	3	90000	0	0	0	0	90000	Tunai	100000	\N	0	2026-05-31 14:58:29
27	INV/20250925/3/0008	2025-09-25	13:23:06	\N	Umum	4	3	90000	0	0	0	0	90000	Tunai	100000	\N	0	2026-05-31 14:58:29
28	INV/20250925/3/0009	2025-09-25	13:23:12	\N	Umum	4	3	90000	0	0	0	0	90000	Tunai	100000	\N	0	2026-05-31 14:58:29
29	INV/20250925/3/0010	2025-09-25	13:23:51	\N	Umum	4	3	115000	0	0	0	0	115000	Tunai	120000	\N	0	2026-05-31 14:58:29
30	INV/20250925/3/0011	2025-09-25	14:01:45	\N	Umum	4	3	115000	0	0	0	0	115000	Tunai	120000	\N	0	2026-05-31 14:58:29
31	INV/20250925/3/0012	2025-09-25	14:24:11	\N	Umum	4	3	9000	0	0	0	0	9000	Tunai	10000	\N	0	2026-05-31 14:58:29
36	INV/20250925/3/0013	2025-09-25	14:43:20	\N	Umum	4	3	40000	0	0	0	0	40000	Tunai	40000	\N	0	2026-05-31 14:58:29
37	INV/20250925/3/0014	2025-09-25	14:44:30	\N	Umum	4	3	90000	0	0	0	0	90000	Tunai	100000	\N	0	2026-05-31 14:58:29
38	INV/20250925/3/0015	2025-09-25	14:50:12	\N	Umum	4	3	90000	0	0	0	0	90000	Tunai	100000	\N	0	2026-05-31 14:58:29
39	INV/20250925/3/0016	2025-09-25	15:05:00	\N	Umum	4	3	90000	0	0	0	0	90000	Tunai	100000	\N	0	2026-05-31 14:58:29
40	INV/20250925/3/0017	2025-09-25	15:11:54	\N	Umum	4	3	90000	0	0	0	0	90000	Tunai	100000	\N	0	2026-05-31 14:58:29
41	INV/20250925/3/0018	2025-09-25	15:41:03	\N	Umum	4	3	90000	0	0	0	0	90000	Tunai	100000	\N	0	2026-05-31 14:58:29
42	INV/20250925/3/0019	2025-09-25	15:45:15	30	DIKA	4	3	445000	0	0	0	0	445000	Tunai	500000	\N	0	2026-05-31 14:58:29
43	INV/20250925/3/0020	2025-09-25	15:56:16	\N	Umum	4	3	900000	0	0	0	0	900000	Tunai	900000	\N	0	2026-05-31 14:58:29
44	INV/20250925/3/0021	2025-09-25	16:04:28	\N	Umum	4	3	900000	0	0	0	0	900000	Tunai	900000	\N	0	2026-05-31 14:58:29
45	INV/20250926/3/0001	2025-09-26	09:23:54	\N	Umum	4	3	100000	0	0	0	0	100000	Tunai	100000	\N	0	2026-05-31 14:58:29
46	INV/20250926/3/0002	2025-09-26	12:43:53	\N	Umum	4	3	298000	0	0	0	0	298000	Tunai	300000	\N	0	2026-05-31 14:58:29
47	INV/20250926/3/0003	2025-09-26	12:50:19	\N	Umum	4	3	298000	0	0	0	0	298000	Tunai	300000	\N	0	2026-05-31 14:58:29
48	INV/20250926/3/0004	2025-09-26	12:52:02	\N	Umum	4	3	105000	0	0	0	0	105000	Tunai	110000	\N	0	2026-05-31 14:58:29
49	INV/20250926/3/0005	2025-09-26	12:59:54	\N	Umum	4	3	12000	0	0	0	0	12000	Tunai	12000	\N	0	2026-05-31 14:58:29
50	INV/20250926/3/0006	2025-09-26	13:34:26	\N	Umum	4	3	12000	120	0	0	0	11880	Tunai	12000	\N	0	2026-05-31 14:58:29
51	INV/20250926/3/0007	2025-09-26	14:45:11	\N	Umum	4	3	24500	0	0	0	0	24500	Tunai	25000	\N	0	2026-05-31 14:58:29
52	INV/20250926/3/0008	2025-09-26	15:07:24	\N	Umum	4	3	50000	0	0	0	0	50000	Tunai	50000	\N	0	2026-05-31 14:58:29
53	INV/20250927/3/0001	2025-09-27	08:31:28	\N	Umum	4	3	22000	0	0	0	0	22000	Tunai	22000	\N	0	2026-05-31 14:58:29
54	INV/20250927/3/0002	2025-09-27	08:44:02	\N	Umum	4	3	22000	0	0	0	0	22000	Tunai	22000	\N	0	2026-05-31 14:58:29
55	INV/20250927/3/0003	2025-09-27	08:45:28	\N	Umum	4	3	22000	120	0	0	0	21880	Tunai	22000	\N	0	2026-05-31 14:58:29
56	INV/20250927/3/0004	2025-09-27	10:08:07	\N	\N	4	3	900000	0	0	0	0	900000	Tunai	900000	\N	0	2026-05-31 14:58:29
57	INV/20250927/3/0005	2025-09-27	10:08:51	\N	\N	4	3	19000	0	0	0	0	19000	Tunai	19000	\N	0	2026-05-31 14:58:29
58	INV/20250927/3/0006	2025-09-27	10:10:11	\N	\N	4	3	19000	0	0	0	0	19000	Tunai	19000	\N	0	2026-05-31 14:58:29
59	INV/20250927/3/0007	2025-09-27	10:16:44	\N	Umum	4	3	19000	0	0	0	0	19000	Tunai	19000	\N	0	2026-05-31 14:58:29
60	INV/20250927/3/0008	2025-09-27	10:16:47	\N	Umum	4	3	19000	0	0	0	0	19000	Tunai	19000	\N	0	2026-05-31 14:58:29
61	INV/20250927/3/0009	2025-09-27	10:17:02	\N	Umum	4	3	2500	0	0	0	0	2500	Tunai	2500	\N	0	2026-05-31 14:58:29
62	INV/20250927/3/0010	2025-09-27	10:17:14	\N	Umum	4	3	19000	0	0	0	0	19000	Tunai	19000	\N	0	2026-05-31 14:58:29
63	INV/20250927/3/0011	2025-09-27	10:18:01	\N	Umum	4	3	27000	0	0	0	0	27000	Tunai	30000	\N	0	2026-05-31 14:58:29
64	INV/20250927/3/0012	2025-09-27	10:24:11	\N	Umum	4	3	13000	130	0	0	0	12870	Tunai	13000	\N	0	2026-05-31 14:58:29
65	INV/20250927/3/0013	2025-09-27	10:30:09	\N	Umum	4	3	22500	135	0	0	0	22365	Tunai	22230	\N	0	2026-05-31 14:58:29
66	INV/20250927/3/0014	2025-09-27	10:48:04	\N	Umum	4	3	22500	135	0	0	0	22365	Tunai	22365	\N	0	2026-05-31 14:58:29
67	INV/20250927/3/0015	2025-09-27	10:48:58	\N	Umum	4	3	19000	0	0	0	0	19000	Tunai	18620	\N	0	2026-05-31 14:58:29
68	INV/20250927/3/0016	2025-09-27	10:49:07	\N	Umum	4	3	19000	0	0	0	0	19000	Tunai	18620	\N	0	2026-05-31 14:58:29
69	INV/20250927/3/0017	2025-09-27	10:53:26	\N	Umum	4	3	27000	0	0	0	0	27000	Tunai	26000	\N	0	2026-05-31 14:58:29
70	INV/20250927/3/0018	2025-09-27	10:55:28	\N	Umum	4	3	46000	1380	0	0	0	44620	Tunai	44620	\N	0	2026-05-31 14:58:29
71	INV/20250927/3/0019	2025-09-27	10:55:44	\N	Umum	4	3	19000	380	0	0	0	18620	Tunai	44620	\N	0	2026-05-31 14:58:29
72	INV/20250927/3/0020	2025-09-27	10:56:20	\N	Umum	4	3	27000	1000	0	0	0	26000	Tunai	44620	\N	0	2026-05-31 14:58:29
73	INV/20250927/3/0021	2025-09-27	10:56:59	\N	Umum	4	3	46000	1380	0	0	0	44620	Tunai	44620	\N	0	2026-05-31 14:58:29
74	INV/20250927/3/0022	2025-09-27	11:05:28	\N	Umum	4	3	30000	300	0	0	0	29700	Tunai	29700	\N	0	2026-05-31 14:58:29
75	INV/20250927/3/0023	2025-09-27	11:24:18	\N	Umum	4	3	62000	1540	0	0	0	60460	Tunai	60500	\N	0	2026-05-31 14:58:29
76	INV/20250927/3/0024	2025-09-27	11:24:40	\N	Umum	4	3	16000	160	0	0	0	15840	Tunai	60500	\N	0	2026-05-31 14:58:29
77	INV/20250927/3/0025	2025-09-27	11:24:51	\N	Umum	4	3	19000	380	0	0	0	18620	Tunai	20000	\N	0	2026-05-31 14:58:29
78	INV/20250927/3/0026	2025-09-27	11:27:09	\N	Umum	4	3	54000	730	0	0	0	53270	Tunai	53270	\N	0	2026-05-31 14:58:29
79	INV/20250927/3/0027	2025-09-27	11:27:23	\N	Umum	4	3	19000	380	0	0	0	18620	Tunai	53270	\N	0	2026-05-31 14:58:29
80	INV/20250927/3/0028	2025-09-27	11:27:59	\N	Umum	4	3	27000	1000	0	0	0	26000	Tunai	26000	\N	0	2026-05-31 14:58:29
81	INV/20250927/3/0029	2025-09-27	11:28:51	\N	Umum	4	3	35000	350	0	0	0	34650	Tunai	35000	\N	0	2026-05-31 14:58:29
82	INV/20250927/3/0030	2025-09-27	11:29:37	\N	Umum	4	3	46000	1380	0	0	0	44620	Tunai	50000	\N	0	2026-05-31 14:58:29
83	INV/20250927/3/0031	2025-09-27	11:32:57	\N	Umum	4	3	46000	1380	0	0	0	44620	Tunai	50000	\N	0	2026-05-31 14:58:29
84	INV/20250927/3/0032	2025-09-27	11:43:27	\N	Umum	4	3	19000	380	0	0	0	18620	Tunai	19000	\N	0	2026-05-31 14:58:29
85	INV/20250927/3/0033	2025-09-27	11:44:12	\N	Umum	4	3	35000	350	0	0	0	34650	Tunai	40000	\N	0	2026-05-31 14:58:29
86	INV/20250927/3/0034	2025-09-27	11:44:29	\N	Umum	4	3	27000	1000	0	0	0	26000	Tunai	100000	\N	0	2026-05-31 14:58:29
87	INV/20250927/3/0035	2025-09-27	11:44:58	\N	Umum	4	3	27000	1000	0	0	0	26000	Tunai	100000	\N	0	2026-05-31 14:58:29
88	INV/20250927/3/0036	2025-09-27	11:59:00	\N	Umum	4	3	27000	1000	0	0	0	26000	Tunai	100000	\N	0	2026-05-31 14:58:29
89	INV/20250927/3/0037	2025-09-27	12:04:33	\N	Umum	4	3	108000	2600	0	0	0	105400	Tunai	106000	\N	0	2026-05-31 14:58:29
90	INV/20250927/3/0038	2025-09-27	12:18:19	\N	Umum	4	3	1303000	6930	0	0	0	1296070	Tunai	1300000	\N	0	2026-05-31 14:58:29
91	INV/20250927/3/0039	2025-09-27	12:43:39	\N	Umum	4	3	1303000	6930	0	0	0	1296070	Tunai	1300000	\N	0	2026-05-31 14:58:29
92	INV/20250927/3/0040	2025-09-27	12:49:46	\N	Umum	4	3	220000	2200	0	0	0	217800	Tunai	250000	\N	0	2026-05-31 14:58:29
93	INV/20250927/3/0041	2025-09-27	12:51:41	\N	Umum	4	3	970000	9700	0	0	0	960300	Tunai	1000000	\N	0	2026-05-31 14:58:29
94	INV/20250927/3/0042	2025-09-27	12:55:30	\N	Umum	4	3	150000	1500	0	0	0	148500	Tunai	150000	\N	0	2026-05-31 14:58:29
95	INV/20250927/3/0043	2025-09-27	12:58:42	\N	Umum	4	3	150000	1500	0	0	0	148500	Tunai	150000	\N	0	2026-05-31 14:58:29
96	INV/20250927/3/0044	2025-09-27	12:59:28	\N	Umum	4	3	150000	1500	0	0	0	148500	Tunai	150000	\N	0	2026-05-31 14:58:29
97	INV/20250928/3/0001	2025-09-28	11:29:12	\N	Umum	4	3	480000	16000	0	0	0	464000	Tunai	464000	\N	0	2026-05-31 14:58:29
98	INV/20250928/3/0002	2025-09-28	13:05:46	\N	Umum	4	3	80000	2000	0	0	0	78000	Tunai	58000	\N	0	2026-05-31 14:58:29
99	INV/20250928/3/0003	2025-09-28	14:10:48	\N	Umum	4	3	54000	2000	20000	0	0	32000	Tunai	32000	1	0	2026-05-31 14:58:29
100	INV/20250928/3/0004	2025-09-28	14:12:41	\N	Umum	4	3	54000	2000	20000	0	0	32000	Tunai	32000	1	0	2026-05-31 14:58:29
101	INV/20250928/3/0005	2025-09-28	14:28:49	\N	Umum	4	3	13000	130	12870	0	0	0	Tunai	0	2	0	2026-05-31 14:58:29
102	INV/20250929/3/0001	2025-09-29	12:31:43	30	DIKA	4	3	80500	0	0	0	0	80500	Tunai	100000	\N	0	2026-05-31 14:58:29
103	INV/20251005/3/0001	2025-10-05	15:59:43	31	WINDAH	4	3	25000	0	0	0	0	25000	Tunai	25000	\N	0	2026-05-31 14:58:29
104	INV/20251005/3/0002	2025-10-05	16:01:18	31	WINDAH	4	3	50000	0	0	0	0	50000	Tunai	50000	\N	0	2026-05-31 14:58:29
105	INV/20251005/3/0003	2025-10-05	16:06:16	30	DIKA	4	3	48000	0	0	0	0	48000	Tunai	48000	\N	0	2026-05-31 14:58:29
106	INV/20251005/3/0004	2025-10-05	16:14:58	30	DIKA	4	3	48000	0	0	0	0	48000	Tunai	48000	\N	0	2026-05-31 14:58:29
107	INV/20251005/3/0005	2025-10-05	16:15:37	31	WINDAH	4	3	25000	0	0	0	0	25000	Tunai	25000	\N	0	2026-05-31 14:58:29
108	INV/20251005/3/0006	2025-10-05	16:26:18	30	DIKA	4	3	48000	0	0	0	0	48000	Tunai	50000	\N	16	2026-05-31 14:58:29
109	INV/20251006/3/0001	2025-10-06	08:09:46	30	DIKA	4	3	29249000	0	0	0	0	29249000	Tunai	29250000	\N	29249	2026-05-31 14:58:29
110	INV/20251006/3/0002	2025-10-06	10:02:09	\N	Umum	4	3	3000	0	0	0	0	3000	Tunai	3000	\N	0	2026-05-31 14:58:29
111	INV/20251006/3/0003	2025-10-06	10:02:41	30	DIKA	4	3	2800	0	0	2800	0	0	Tunai	0	\N	2	2026-05-31 14:58:29
112	INV/20251006/3/0004	2025-10-06	11:31:15	\N	Umum	4	3	3300	0	0	0	200	3300	Tunai	5000	\N	0	2026-05-31 14:58:29
113	INV/20251006/3/0005	2025-10-06	13:51:02	31	WINDAH	4	3	110000	0	0	0	0	110000	Tunai	110000	\N	110	2026-05-31 14:58:29
114	INV/20251006/3/0006	2025-10-06	13:51:42	30	DIKA	4	3	47000	0	0	0	0	47000	Tunai	50000	\N	47	2026-05-31 14:58:29
115	INV/20251007/3/0001	2025-10-07	08:43:33	\N	Umum	4	3	25000	0	0	0	0	25000	Tunai	25000	\N	0	2026-05-31 14:58:29
116	INV/20251007/3/0002	2025-10-07	08:46:50	30	DIKA	4	3	890000	0	0	0	0	890000	Tunai	900000	\N	890	2026-05-31 14:58:29
117	INV/20251007/3/0003	2025-10-07	08:50:22	\N	Umum	4	3	3300	0	0	0	200	3300	Tunai	10000	\N	0	2026-05-31 14:58:29
118	INV/20251007/3/0004	2025-10-07	08:55:59	\N	Umum	4	3	3300	0	0	0	200	3300	Tunai	5000	\N	0	2026-05-31 14:58:29
119	INV/20251007/3/0005	2025-10-07	09:06:37	30	DIKA	4	3	16800	0	0	0	200	16800	Tunai	20000	\N	16	2026-05-31 14:58:29
120	INV/20251007/3/0006	2025-10-07	09:09:21	30	DIKA	4	3	906800	0	0	0	200	906800	Tunai	910000	\N	906	2026-05-31 14:58:29
121	INV/20251007/3/0007	2025-10-07	09:11:14	30	DIKA	4	3	906800	0	0	0	200	906800	Tunai	910000	\N	906	2026-05-31 14:58:29
122	INV/20251007/3/0008	2025-10-07	09:22:32	30	DIKA	4	3	41500	0	0	0	0	41500	Tunai	50000	\N	41	2026-05-31 14:58:29
123	INV/20251007/3/0009	2025-10-07	09:29:02	30	DIKA	4	3	890000	0	0	0	0	890000	Tunai	900000	\N	890	2026-05-31 14:58:29
124	INV/20251007/3/0010	2025-10-07	09:32:50	30	DIKA	4	3	890000	0	0	0	0	890000	Tunai	900000	\N	890	2026-05-31 14:58:29
125	INV/20251007/3/0011	2025-10-07	09:37:25	\N	Umum	4	3	80000	2000	0	0	0	78000	Tunai	80000	\N	0	2026-05-31 14:58:29
126	INV/20251007/3/0012	2025-10-07	09:38:04	\N	Umum	4	3	160000	5000	0	0	0	155000	Tunai	160000	\N	0	2026-05-31 14:58:29
127	INV/20251007/3/0013	2025-10-07	09:38:43	\N	Umum	4	3	264000	8000	0	0	0	256000	Tunai	300000	\N	0	2026-05-31 14:58:29
128	INV/20251007/3/0014	2025-10-07	09:41:40	\N	Umum	4	3	265000	9000	0	0	0	256000	Tunai	300000	\N	0	2026-05-31 14:58:29
129	INV/20251007/3/0015	2025-10-07	09:42:21	\N	Umum	4	3	265000	9000	0	0	0	256000	Tunai	300000	\N	0	2026-05-31 14:58:29
130	INV/20251007/3/0016	2025-10-07	10:06:45	\N	Umum	4	3	25000	0	0	0	0	25000	Tunai	30000	\N	0	2026-05-31 14:58:29
131	INV/20251007/3/0017	2025-10-07	10:08:06	\N	Umum	4	3	25000	0	0	0	0	25000	Tunai	30000	\N	0	2026-05-31 14:58:29
132	INV/20251007/3/0018	2025-10-07	10:11:54	\N	Umum	4	3	25000	0	0	0	0	25000	Tunai	30000	\N	0	2026-05-31 14:58:29
133	INV/20251007/3/0019	2025-10-07	10:13:15	\N	Umum	4	3	80000	2000	0	0	0	78000	Tunai	78000	\N	0	2026-05-31 14:58:29
134	INV/20251007/3/0020	2025-10-07	10:14:00	\N	Umum	4	3	80000	2000	0	0	0	78000	Tunai	80000	\N	0	2026-05-31 14:58:29
135	INV/20251016/5/0001	2025-10-16	17:49:08	30	DIKA	8	5	14500	0	0	14500	0	0	Tunai	0	\N	0	2026-05-31 14:58:29
136	INV/20251021/3/0001	2025-10-21	09:33:04	\N	Umum	8	3	304000	0	0	0	0	304000	Tunai	305000	\N	0	2026-05-31 14:58:29
137	INV/20251023/6/0001	2025-10-23	10:35:13	30	DIKA	80	6	28000	0	0	700	200	27300	Tunai	30000	\N	28	2026-05-31 14:58:29
138	INV/20251116/5/0001	2025-11-16	14:08:58	\N	Umum	82	5	90000	0	0	0	0	90000	Tunai	100000	\N	0	2026-05-31 14:58:29
139	INV/20251116/10/0001	2025-11-16	14:18:46	\N	Umum	69	10	40500	0	0	0	0	40500	Tunai	50000	\N	0	2026-05-31 14:58:29
140	INV/20251116/19/0001	2025-11-16	14:38:00	41	ABDUL WAKIL	75	19	16000	0	0	0	0	16000	Tunai	20000	\N	0	2026-05-31 14:58:29
141	INV/20251116/6/0001	2025-11-16	14:38:31	\N	Umum	80	6	9000	0	0	0	0	9000	Tunai	50000	\N	0	2026-05-31 14:58:29
142	INV/20251116/19/0002	2025-11-16	14:41:36	\N	Umum	75	19	16000	0	0	0	0	16000	Tunai	17000	\N	0	2026-05-31 14:58:29
143	INV/20251116/6/0002	2025-11-16	14:47:00	\N	Umum	80	6	30000	0	0	0	0	30000	Tunai	30000	\N	0	2026-05-31 14:58:29
144	INV/20251116/6/0003	2025-11-16	14:48:48	\N	Umum	80	6	54000	0	0	0	0	54000	Tunai	54000	\N	0	2026-05-31 14:58:29
145	INV/20251116/13/0001	2025-11-16	14:50:48	\N	Umum	77	13	56000	0	0	0	0	56000	Tunai	100000	\N	0	2026-05-31 14:58:29
146	INV/20251116/10/0002	2025-11-16	15:10:18	\N	Umum	69	10	25400	0	0	0	100	25400	Tunai	30000	\N	0	2026-05-31 14:58:29
147	INV/20251116/19/0003	2025-11-16	15:14:24	\N	Umum	75	19	3300	0	0	0	0	3300	Tunai	3500	\N	0	2026-05-31 14:58:29
148	INV/20251116/19/0004	2025-11-16	15:16:29	\N	Umum	75	19	3300	0	0	0	0	3300	Tunai	3500	\N	0	2026-05-31 14:58:29
149	INV/20251116/15/0001	2025-11-16	15:16:33	\N	Umum	76	15	41000	0	0	0	0	41000	Tunai	50000	\N	0	2026-05-31 14:58:29
150	INV/20251116/19/0005	2025-11-16	15:18:18	\N	Umum	75	19	3300	0	0	0	0	3300	Tunai	3500	\N	0	2026-05-31 14:58:29
151	INV/20251116/10/0003	2025-11-16	16:04:21	\N	Umum	69	10	151500	0	0	0	0	151500	Tunai	200000	\N	0	2026-05-31 14:58:29
152	INV/20251116/10/0004	2025-11-16	16:05:26	\N	Umum	69	10	32400	0	0	0	100	32400	Tunai	40000	\N	0	2026-05-31 14:58:29
153	INV/20251116/10/0005	2025-11-16	16:14:12	\N	Umum	69	10	32400	0	0	0	100	32400	Tunai	40000	\N	0	2026-05-31 14:58:29
154	INV/20251116/15/0002	2025-11-16	17:00:21	\N	Umum	76	15	129000	0	0	0	0	129000	Tunai	150000	\N	0	2026-05-31 14:58:29
155	INV/20251116/10/0006	2025-11-16	17:06:49	\N	Umum	69	10	176500	0	0	0	0	176500	Tunai	200000	\N	0	2026-05-31 14:58:29
156	INV/20251116/19/0006	2025-11-16	18:28:19	\N	Umum	75	19	26400	0	0	0	0	26400	Tunai	50000	\N	0	2026-05-31 14:58:29
157	INV/20251116/15/0003	2025-11-16	19:00:25	\N	Umum	76	15	70000	0	0	0	0	70000	Tunai	100000	\N	0	2026-05-31 14:58:29
158	INV/20251116/10/0007	2025-11-16	19:03:02	\N	Umum	69	10	75000	0	0	0	0	75000	Tunai	80000	\N	0	2026-05-31 14:58:29
159	INV/20251116/10/0008	2025-11-16	19:05:01	36	MOH WAKIL	69	10	43400	0	0	0	100	43400	Tunai	45000	\N	0	2026-05-31 14:58:29
160	INV/20251116/6/0004	2025-11-16	19:05:36	\N	Umum	80	6	45000	0	0	0	0	45000	Tunai	45000	\N	0	2026-05-31 14:58:29
161	INV/20251116/10/0009	2025-11-16	19:07:14	\N	Umum	69	10	63000	0	0	0	0	63000	Tunai	63000	\N	0	2026-05-31 14:58:29
162	INV/20251116/6/0005	2025-11-16	20:36:56	\N	Umum	80	6	27000	0	0	0	0	27000	Tunai	27000	\N	0	2026-05-31 14:58:29
163	INV/20251116/15/0004	2025-11-16	20:40:23	\N	Umum	76	15	42000	0	0	0	0	42000	Tunai	50000	\N	0	2026-05-31 14:58:29
164	INV/20251117/10/0001	2025-11-17	14:07:25	\N	Umum	69	10	30000	0	0	0	0	30000	Tunai	50000	\N	0	2026-05-31 14:58:29
165	INV/20251117/16/0001	2025-11-17	15:01:46	\N	Umum	108	16	15000	0	0	0	0	15000	Tunai	20000	\N	0	2026-05-31 14:58:29
166	INV/20251117/10/0002	2025-11-17	15:19:23	\N	Umum	69	10	19000	0	0	0	0	19000	Tunai	20000	\N	0	2026-05-31 14:58:29
167	INV/20251118/15/0001	2025-11-18	11:00:30	\N	Umum	76	15	50200	0	0	0	300	50200	Tunai	50500	\N	0	2026-05-31 14:58:29
168	INV/20251118/19/0001	2025-11-18	15:27:51	\N	Umum	75	19	32000	0	0	0	0	32000	Tunai	32000	\N	0	2026-05-31 14:58:29
169	INV/20251119/21/0001	2025-11-19	11:13:35	\N	Umum	89	21	13000	0	0	0	0	13000	Tunai	20000	\N	0	2026-05-31 14:58:29
170	INV/20251119/21/0002	2025-11-19	11:14:40	\N	Umum	89	21	9000	0	0	0	0	9000	Tunai	10000	\N	0	2026-05-31 14:58:29
171	INV/20251119/22/0001	2025-11-19	13:24:39	\N	Umum	85	22	30000	0	0	0	0	30000	Tunai	50000	\N	0	2026-05-31 14:58:29
172	INV/20251119/14/0001	2025-11-19	14:14:48	\N	Umum	97	14	15000	0	0	0	0	15000	Tunai	20000	\N	0	2026-05-31 14:58:29
173	INV/20251119/14/0002	2025-11-19	15:01:22	\N	Umum	97	14	15000	0	0	0	0	15000	Tunai	20000	\N	0	2026-05-31 14:58:29
174	INV/20251119/14/0003	2025-11-19	17:15:08	33	BINTANG	97	14	18000	0	0	0	0	18000	Tunai	20000	\N	0	2026-05-31 14:58:29
175	INV/20251120/7/0001	2025-11-20	13:03:47	\N	Umum	78	7	9000	0	0	0	0	9000	Tunai	10000	\N	0	2026-05-31 14:58:29
176	INV/20251122/5/0001	2025-11-22	13:48:24	\N	Umum	82	5	45000	0	0	0	0	45000	Tunai	100000	\N	0	2026-05-31 14:58:29
177	INV/20251122/5/0002	2025-11-22	13:57:07	48	AFI	82	5	26700	0	0	0	0	26700	Tunai	100000	\N	0	2026-05-31 14:58:29
178	INV/20251122/21/0001	2025-11-22	15:08:11	\N	Umum	89	21	50000	0	0	0	0	50000	Tunai	100000	\N	0	2026-05-31 14:58:29
179	INV/20251122/18/0001	2025-11-22	15:11:18	46	SINDI	98	18	9000	0	0	0	0	9000	Tunai	10000	\N	0	2026-05-31 14:58:29
180	INV/20251122/21/0002	2025-11-22	15:14:15	\N	Umum	89	21	15000	0	0	0	0	15000	Tunai	20000	\N	0	2026-05-31 14:58:29
181	INV/20251122/18/0002	2025-11-22	15:14:57	32	DILA	98	18	52800	0	0	0	200	52800	Tunai	60000	\N	0	2026-05-31 14:58:29
182	INV/20251123/8/0001	2025-11-23	07:13:51	\N	Umum	71	8	128000	0	0	0	0	128000	Tunai	150000	\N	0	2026-05-31 14:58:29
183	INV/20251128/16/0001	2025-11-28	10:57:24	\N	Umum	108	16	82000	0	0	0	0	82000	Tunai	100000	\N	0	2026-05-31 14:58:29
184	INV/20251128/10/0001	2025-11-28	13:40:07	\N	Umum	69	10	9000	0	0	0	0	9000	Tunai	10000	\N	0	2026-05-31 14:58:29
185	INV/20251128/10/0002	2025-11-28	13:41:36	36	MOH WAKIL	69	10	8500	0	0	0	0	8500	Tunai	10000	\N	0	2026-05-31 14:58:29
186	INV/20251129/13/0001	2025-11-29	13:44:07	\N	Umum	77	13	81000	0	0	0	0	81000	Tunai	100000	\N	0	2026-05-31 14:58:29
187	INV/20251220/3/0001	2025-12-20	10:26:27	\N	Umum	8	3	13000	0	0	0	0	13000	Tunai	13000	\N	0	2026-05-31 14:58:29
188	INV/20251221/6/0001	2025-12-21	16:29:41	\N	Umum	80	6	110000	0	0	0	0	110000	Tunai	110000	\N	0	2026-05-31 14:58:29
189	INV/20260601/3/0001	2026-06-01	08:54:01	\N	Umum	4	3	10000	0	0	0	0	10000	Tunai	10000	\N	1	2026-06-01T01:54:01.114Z
\.


--
-- Data for Name: penjualan_detail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.penjualan_detail (id, id_penjualan, id_barang, nama_barang, jumlah, satuan, isi_satuan, harga_jual, harga_rata_saat_transaksi, diskon, subtotal, jenis_item) FROM stdin;
1	1	75	CLUB AIR MINUM 1500ML	2	DOS	1	39000	39000	0	77500	TRANSAKSI
2	1	76	CLUB AIR MINUM 330ML	1	PCS	1	0	0	0	0	TRANSAKSI
3	1	77	CLUB AIR MINUM 600ML	1	PCS	1	0	0	0	0	TRANSAKSI
4	1	78	CLUB AIR MINUM GALON 19L	1	PCS	1	0	0	0	0	TRANSAKSI
5	2	75	CLUB AIR MINUM 1500ML	3	PCS	1	3500	3500	0	10500	TRANSAKSI
6	3	75	CLUB AIR MINUM 1500ML	6	PCS	1	3400	3400	0	20400	TRANSAKSI
7	4	1	CIPTADENT COOL MINT 120G	1	PCS	1	9000	9000	0	9000	TRANSAKSI
8	5	1	CIPTADENT COOL MINT 120G	4	PCS	1	9000	9000	0	36000	TRANSAKSI
9	6	1	CIPTADENT COOL MINT 120G	1	PCS	1	8900	8900	0	8900	TRANSAKSI
10	7	6	CIPTADENT FRESH MINT 120G	1	PCS	1	11000	11000	0	11000	TRANSAKSI
11	8	18	CIPTADENT SG CLASSIC REGULAR SOFT	1	PCS	1	3500	3500	0	3500	TRANSAKSI
12	8	75	CLUB AIR MINUM 1500ML	1	PCS	1	3400	3400	0	3400	TRANSAKSI
13	9	17	CIPTADENT SG CLASSIC REG SOFT ISI 3	1	PCS	1	7500	7500	0	7500	TRANSAKSI
14	10	76	CLUB AIR MINUM 330ML	1	PCS	1	2000	2000	0	2000	TRANSAKSI
15	11	76	CLUB AIR MINUM 330ML	1	PCS	1	2000	1454	0	2000	TRANSAKSI
16	12	75	CLUB AIR MINUM 1500ML	1	DOS	1	38500	3176	0	38500	TRANSAKSI
17	12	77	CLUB AIR MINUM 600ML	1	PCS	1	3500	1566	0	3500	TRANSAKSI
18	13	75	CLUB AIR MINUM 1500ML	1	DOS	1	40000	3176	0	40000	TRANSAKSI
19	17	75	CLUB AIR MINUM 1500ML	1	DOS	1	40000	3176	0	40000	TRANSAKSI
20	18	75	CLUB AIR MINUM 1500ML	1	DOS	1	40000	38112	0	40000	TRANSAKSI
22	20	75	CLUB AIR MINUM 1500ML	1	1	1	3500	3500	0	3500	TRANSAKSI
23	21	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
24	21	36	CITRA HBL NOURISHING AVOCADO 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
25	21	76	CLUB AIR MINUM 330ML	1	2	1	40000	40000	0	40000	TRANSAKSI
26	21	33	CITRA HBL 60ML PEARLY WHITE PINK	0		1	0	0	0	0	GRATIS
27	22	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
28	22	36	CITRA HBL NOURISHING AVOCADO 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
29	22	76	CLUB AIR MINUM 330ML	1	2	1	40000	40000	0	40000	TRANSAKSI
30	22	33	CITRA HBL 60ML PEARLY WHITE PINK	0		1	0	0	0	0	GRATIS
31	23	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
32	23	36	CITRA HBL NOURISHING AVOCADO 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
33	23	76	CLUB AIR MINUM 330ML	1	2	1	40000	40000	0	40000	TRANSAKSI
34	23	33	CITRA HBL 60ML PEARLY WHITE PINK	0		1	0	0	0	0	GRATIS
35	24	76	CLUB AIR MINUM 330ML	1	2	1	40000	40000	0	40000	TRANSAKSI
36	25	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
37	25	36	CITRA HBL NOURISHING AVOCADO 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
38	25	33	CITRA HBL 60ML PEARLY WHITE PINK	1		1	0	0	0	0	GRATIS
39	26	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
40	26	36	CITRA HBL NOURISHING AVOCADO 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
41	26	33	CITRA HBL 60ML PEARLY WHITE PINK	1		1	0	0	0	0	GRATIS
42	27	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
43	27	36	CITRA HBL NOURISHING AVOCADO 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
44	27	33	CITRA HBL 60ML PEARLY WHITE PINK	1		1	0	0	0	0	GRATIS
45	28	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
46	28	36	CITRA HBL NOURISHING AVOCADO 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
47	28	33	CITRA HBL 60ML PEARLY WHITE PINK	1		1	0	0	0	0	GRATIS
48	29	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
49	29	36	CITRA HBL NOURISHING AVOCADO 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
50	29	78	CLUB AIR MINUM GALON 19L	1	1	1	25000	25000	0	25000	TRANSAKSI
51	29	33	CITRA HBL 60ML PEARLY WHITE PINK	1		1	0	0	0	0	GRATIS
52	30	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
53	30	36	CITRA HBL NOURISHING AVOCADO 110ML	3	1	1	15000	15000	0	45000	TRANSAKSI
54	30	78	CLUB AIR MINUM GALON 19L	1	1	1	25000	25000	0	25000	TRANSAKSI
55	30	33	CITRA HBL 60ML PEARLY WHITE PINK	1		1	0	0	0	0	GRATIS
56	31	1	CIPTADENT COOL MINT 120G	1	1	1	9000	9000	0	9000	TRANSAKSI
57	36	76	CLUB AIR MINUM 330ML	1	DOS	24	40000	40000	0	40000	TRANSAKSI
58	37	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	PCS	1	15000	15000	0	45000	TRANSAKSI
59	37	36	CITRA HBL NOURISHING AVOCADO 110ML	3	PCS	1	15000	15000	0	45000	TRANSAKSI
60	37	33	CITRA HBL 60ML PEARLY WHITE PINK	1		1	0	0	0	0	GRATIS
61	38	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	PCS	1	15000	15000	0	45000	TRANSAKSI
62	38	36	CITRA HBL NOURISHING AVOCADO 110ML	3	PCS	1	15000	15000	0	45000	TRANSAKSI
63	38	33	CITRA HBL 60ML PEARLY WHITE PINK	1	PCS	1	0	0	0	0	GRATIS
64	39	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	PCS	1	15000	15000	0	45000	TRANSAKSI
65	39	36	CITRA HBL NOURISHING AVOCADO 110ML	3	PCS	1	15000	15000	0	45000	TRANSAKSI
66	39	33	CITRA HBL 60ML PEARLY WHITE PINK	1	PCS	1	0	0	0	0	GRATIS
67	40	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	PCS	1	15000	15000	0	45000	TRANSAKSI
68	40	36	CITRA HBL NOURISHING AVOCADO 110ML	3	PCS	1	15000	15000	0	45000	TRANSAKSI
69	40	33	CITRA HBL 60ML PEARLY WHITE PINK	1	PCS	1	0	0	0	0	GRATIS
70	41	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	3	PCS	1	15000	15000	0	45000	TRANSAKSI
71	41	36	CITRA HBL NOURISHING AVOCADO 110ML	3	PCS	1	15000	15000	0	45000	TRANSAKSI
72	41	33	CITRA HBL 60ML PEARLY WHITE PINK	1	PCS	1	0	0	0	0	GRATIS
73	42	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	1	DOS	36	445000	445000	0	445000	TRANSAKSI
74	42	36	CITRA HBL NOURISHING AVOCADO 110ML	1	DOS	36	0	0	0	0	TRANSAKSI
75	42	33	CITRA HBL 60ML PEARLY WHITE PINK	1	PCS	1	0	0	0	0	GRATIS
76	42	76	CLUB AIR MINUM 330ML	4	PCS	1	0	0	0	0	GRATIS
77	43	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	1	DOS	36	450000	450000	0	450000	TRANSAKSI
78	43	36	CITRA HBL NOURISHING AVOCADO 110ML	1	DOS	36	450000	450000	0	450000	TRANSAKSI
79	43	33	CITRA HBL 60ML PEARLY WHITE PINK	1		1	0	0	0	0	GRATIS
80	43	76	CLUB AIR MINUM 330ML	9		1	0	0	0	0	GRATIS
81	44	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	1	DOS	36	450000	450000	0	450000	TRANSAKSI
82	44	36	CITRA HBL NOURISHING AVOCADO 110ML	1	DOS	36	450000	450000	0	450000	TRANSAKSI
83	44	33	CITRA HBL 60ML PEARLY WHITE PINK	1	SLOP	6	0	0	0	0	GRATIS
84	44	76	CLUB AIR MINUM 330ML	9	PCS	1	0	0	0	0	GRATIS
85	45	88	CLUB GELAS 240ML	5	DOS	1	15000	15000	0	75000	TRANSAKSI
86	45	78	CLUB AIR MINUM GALON 19L	1		1	25000	25000	0	25000	TRANSAKSI
87	46	88	CLUB GELAS 240ML	10	DOS	1	15000	15000	0	150000	TRANSAKSI
88	46	33	CITRA HBL 60ML PEARLY WHITE PINK	2		1	49000	49000	0	98000	TRANSAKSI
89	46	78	CLUB AIR MINUM GALON 19L	2		1	25000	25000	0	50000	TRANSAKSI
90	47	88	CLUB GELAS 240ML	10	DOS	1	15000	15000	0	150000	TRANSAKSI
91	47	33	CITRA HBL 60ML PEARLY WHITE PINK	2	SLOP	6	49000	49000	0	98000	TRANSAKSI
92	47	78	CLUB AIR MINUM GALON 19L	2	PCS	1	25000	25000	0	50000	TRANSAKSI
93	48	1	CIPTADENT COOL MINT 120G	1	PAK	12	105000	105000	0	105000	TRANSAKSI
94	48	89	INDOMIE GORENG	2	PCS	1	0	0	0	0	GRATIS
95	49	89	INDOMIE GORENG	4	PCS	1	3000	3000	0	12000	TRANSAKSI
96	50	89	INDOMIE GORENG	4	PCS	1	3000	3000	0	12000	TRANSAKSI
97	51	32	CITRA HBL 60ML BENGKOANG NTRL WHITE	1	PCS	1	9000	9000	0	9000	TRANSAKSI
98	51	89	INDOMIE GORENG	4	PCS	1	3000	3000	0	12000	TRANSAKSI
99	51	90	TEH BOTOL SOSRO KOTAK 250ML	1	PCS	1	3500	3500	0	3500	TRANSAKSI
100	52	90	TEH BOTOL SOSRO KOTAK 250ML	10	PCS	1	3500	3500	0	35000	TRANSAKSI
101	52	89	INDOMIE GORENG	5	PCS	1	3000	3000	0	15000	TRANSAKSI
102	53	90	TEH BOTOL SOSRO KOTAK 250ML	2	PCS	1	3500	3500	0	7000	TRANSAKSI
103	53	32	CITRA HBL 60ML BENGKOANG NTRL WHITE	1	PCS	1	9000	9000	0	9000	TRANSAKSI
104	53	89	INDOMIE GORENG	2	PCS	1	3000	3000	0	6000	TRANSAKSI
105	54	90	TEH BOTOL SOSRO KOTAK 250ML	2	PCS	1	3500	3500	0	7000	TRANSAKSI
106	54	32	CITRA HBL 60ML BENGKOANG NTRL WHITE	1	PCS	1	9000	9000	0	9000	TRANSAKSI
107	54	89	INDOMIE GORENG	2	PCS	1	3000	3000	0	6000	TRANSAKSI
108	55	90	TEH BOTOL SOSRO KOTAK 250ML	2	PCS	1	3500	3500	0	7000	TRANSAKSI
109	55	32	CITRA HBL 60ML BENGKOANG NTRL WHITE	1	PCS	1	9000	9000	0	9000	TRANSAKSI
110	55	89	INDOMIE GORENG	2	PCS	1	3000	3000	0	6000	TRANSAKSI
111	56	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	1	DOS	36	450000	450000	0	450000	TRANSAKSI
112	56	36	CITRA HBL NOURISHING AVOCADO 110ML	1	DOS	36	450000	450000	0	450000	TRANSAKSI
113	56	33	CITRA HBL 60ML PEARLY WHITE PINK	1	SLOP	6	0	0	0	0	GRATIS
114	56	76	CLUB AIR MINUM 330ML	9	PCS	1	0	0	0	0	GRATIS
115	57	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	0	19000	TRANSAKSI
116	58	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	0	19000	TRANSAKSI
117	59	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	0	19000	TRANSAKSI
118	60	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	0	19000	TRANSAKSI
119	61	76	CLUB AIR MINUM 330ML	1	PCS	1	2500	2500	0	2500	TRANSAKSI
120	62	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	0	19000	TRANSAKSI
121	63	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	0	27000	TRANSAKSI
122	64	90	TEH BOTOL SOSRO KOTAK 250ML	2	PCS	1	3500	3500	70	6930	TRANSAKSI
123	64	89	INDOMIE GORENG	2	PCS	1	3000	3000	60	5940	TRANSAKSI
124	65	89	INDOMIE GORENG	1	PCS	1	3000	3000	30	2970	TRANSAKSI
125	65	32	CITRA HBL 60ML BENGKOANG NTRL WHITE	1	PCS	1	9000	9000	0	9000	TRANSAKSI
126	65	90	TEH BOTOL SOSRO KOTAK 250ML	3	PCS	1	3500	3500	105	10395	TRANSAKSI
127	66	32	CITRA HBL 60ML BENGKOANG NTRL WHITE	1	PCS	1	9000	9000	0	9000	TRANSAKSI
128	66	90	TEH BOTOL SOSRO KOTAK 250ML	3	PCS	1	3500	3500	105	10395	TRANSAKSI
129	66	89	INDOMIE GORENG	1	PCS	1	3000	3000	30	2970	TRANSAKSI
130	67	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	0	19000	TRANSAKSI
131	68	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	0	19000	TRANSAKSI
132	69	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	0	27000	TRANSAKSI
133	70	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	380	18620	TRANSAKSI
134	70	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	1000	26000	TRANSAKSI
135	71	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	380	18620	TRANSAKSI
136	72	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	1000	26000	TRANSAKSI
137	73	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	1000	26000	TRANSAKSI
138	73	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	380	18620	TRANSAKSI
139	74	89	INDOMIE GORENG	10	PCS	1	3000	3000	300	29700	TRANSAKSI
140	75	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	380	18620	TRANSAKSI
141	75	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	1000	26000	TRANSAKSI
142	75	89	INDOMIE GORENG	3	PCS	1	3000	3000	90	8910	TRANSAKSI
143	75	90	TEH BOTOL SOSRO KOTAK 250ML	2	PCS	1	3500	3500	70	6930	TRANSAKSI
144	76	89	INDOMIE GORENG	3	PCS	1	3000	3000	90	8910	TRANSAKSI
145	76	90	TEH BOTOL SOSRO KOTAK 250ML	2	PCS	1	3500	3500	70	6930	TRANSAKSI
146	77	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	380	18620	TRANSAKSI
147	78	90	TEH BOTOL SOSRO KOTAK 250ML	10	PCS	1	3500	3500	350	34650	TRANSAKSI
148	78	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	380	18620	TRANSAKSI
149	79	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	380	18620	TRANSAKSI
150	80	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	1000	26000	TRANSAKSI
151	81	90	TEH BOTOL SOSRO KOTAK 250ML	10	PCS	1	3500	3500	350	34650	TRANSAKSI
152	82	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	380	18620	TRANSAKSI
153	82	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	1000	26000	TRANSAKSI
154	83	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	380	18620	TRANSAKSI
155	83	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	1000	26000	TRANSAKSI
156	84	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	380	18620	TRANSAKSI
157	85	90	TEH BOTOL SOSRO KOTAK 250ML	10	PCS	1	3500	3500	350	34650	TRANSAKSI
158	86	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	1000	26000	TRANSAKSI
159	87	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	1000	26000	TRANSAKSI
160	88	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	1000	26000	TRANSAKSI
161	89	89	INDOMIE GORENG	5	PCS	1	3000	3000	150	14850	TRANSAKSI
162	89	90	TEH BOTOL SOSRO KOTAK 250ML	2	PCS	1	3500	3500	70	6930	TRANSAKSI
163	89	50	CLEAN & CLEAR FACIAL WASH 100ML	1	PCS	1	27000	27000	1000	26000	TRANSAKSI
164	89	51	CLEAN & CLEAR FACIAL WASH 50ML	1	PCS	1	19000	19000	380	18620	TRANSAKSI
165	89	17	CIPTADENT SG CLASSIC REG SOFT ISI 3	2	PCS	1	8000	8000	400	15600	TRANSAKSI
166	89	21	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	3	PCS	1	8000	8000	600	23400	TRANSAKSI
167	90	50	CLEAN & CLEAR FACIAL WASH 100ML	2	PCS	1	27000	49408	2000	52000	TRANSAKSI
168	90	51	CLEAN & CLEAR FACIAL WASH 50ML	2	PCS	1	19000	33020	760	37240	TRANSAKSI
169	90	21	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	1	BOX	6	80000	41160	2500	77500	TRANSAKSI
170	90	17	CIPTADENT SG CLASSIC REG SOFT ISI 3	2	PCS	1	8000	13042	500	15500	TRANSAKSI
171	90	90	TEH BOTOL SOSRO KOTAK 250ML	2	PCS	1	3500	130000	70	6930	TRANSAKSI
172	90	89	INDOMIE GORENG	1	DOS	40	110000	98000	1100	108900	TRANSAKSI
173	90	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	1	DOS	36	450000	419328	0	450000	TRANSAKSI
174	90	36	CITRA HBL NOURISHING AVOCADO 110ML	1	DOS	36	450000	425736	0	450000	TRANSAKSI
175	90	33	CITRA HBL 60ML PEARLY WHITE PINK	2	SLOP	6	49000	72252	0	98000	TRANSAKSI
176	90	33	CITRA HBL 60ML PEARLY WHITE PINK	1	SLOP	6	0	36126	0	0	GRATIS
177	90	76	CLUB AIR MINUM 330ML	9	PCS	1	0	13086	0	0	GRATIS
178	91	50	CLEAN & CLEAR FACIAL WASH 100ML	2		1	54000	0	2000	52000	TRANSAKSI
179	91	51	CLEAN & CLEAR FACIAL WASH 50ML	2		1	38000	0	760	37240	TRANSAKSI
180	91	21	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	1		1	80000	0	2500	77500	TRANSAKSI
181	91	17	CIPTADENT SG CLASSIC REG SOFT ISI 3	2		1	16000	0	500	15500	TRANSAKSI
182	91	90	TEH BOTOL SOSRO KOTAK 250ML	2		1	7000	0	70	6930	TRANSAKSI
183	91	89	INDOMIE GORENG	1		1	110000	0	1100	108900	TRANSAKSI
184	91	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	1		1	450000	0	0	450000	TRANSAKSI
185	91	36	CITRA HBL NOURISHING AVOCADO 110ML	1		1	450000	0	0	450000	TRANSAKSI
186	91	33	CITRA HBL 60ML PEARLY WHITE PINK	2		1	98000	0	0	98000	TRANSAKSI
187	91	33	CITRA HBL 60ML PEARLY WHITE PINK	1		1	0	0	0	0	GRATIS
188	91	76	CLUB AIR MINUM 330ML	9		1	0	0	0	0	GRATIS
189	92	89	INDOMIE GORENG	2		1	220000	0	2200	217800	TRANSAKSI
190	93	89	INDOMIE GORENG	2		1	220000	0	2200	217800	TRANSAKSI
191	93	90	TEH BOTOL SOSRO KOTAK 250ML	10		1	750000	0	7500	742500	TRANSAKSI
192	94	90	TEH BOTOL SOSRO KOTAK 250ML	2	DOS	24	150000	3120000	1500	148500	TRANSAKSI
193	95	90	TEH BOTOL SOSRO KOTAK 250ML	2	DOS	24	150000	0	1500	148500	TRANSAKSI
194	96	90	TEH BOTOL SOSRO KOTAK 250ML	2	DOS	24	150000	129984	1500	148500	TRANSAKSI
195	97	21	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	6	BOX	6	480000	246960	16000	464000	TRANSAKSI
196	98	21	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	1	BOX	6	80000	41160	2000	78000	TRANSAKSI
197	99	50	CLEAN & CLEAR FACIAL WASH 100ML	2	PCS	1	54000	49408	2000	52000	TRANSAKSI
198	100	50	CLEAN & CLEAR FACIAL WASH 100ML	2	PCS	1	54000	49408	2000	52000	TRANSAKSI
199	101	89	INDOMIE GORENG	2	PCS	1	6000	4900	60	5940	TRANSAKSI
200	101	90	TEH BOTOL SOSRO KOTAK 250ML	2	PCS	1	7000	5416	70	6930	TRANSAKSI
201	102	75	CLUB AIR MINUM 1500ML	2	DOS	12	78000	79992	0	78000	TRANSAKSI
202	102	24	CIPTADENT SG DOUBLE ACTION SOFT (Tebus Murah)	1	PCS	1	2500	2250	0	2500	TEBUS_MURAH
203	103	78	CLUB AIR MINUM GALON 19L	1	PCS	1	25000	17781	0	25000	TRANSAKSI
204	104	78	CLUB AIR MINUM GALON 19L	2	PCS	1	50000	35562	0	50000	TRANSAKSI
205	105	78	CLUB AIR MINUM GALON 19L	2	PCS	1	48000	35562	0	48000	TRANSAKSI
206	106	78	CLUB AIR MINUM GALON 19L	2	PCS	1	48000	35562	0	48000	TRANSAKSI
207	107	78	CLUB AIR MINUM GALON 19L	1	PCS	1	25000	17781	0	25000	TRANSAKSI
208	108	78	CLUB AIR MINUM GALON 19L	2	PCS	1	48000	35562	0	48000	TRANSAKSI
209	109	76	CLUB AIR MINUM 330ML	1	DOS	24	39000	34896	0	39000	TRANSAKSI
210	109	89	INDOMIE GORENG	2	DOS	40	210000	196000	0	210000	TRANSAKSI
211	109	46	CLAS MILD 16	100	PRES	10	29000000	28000000	0	29000000	TRANSAKSI
212	110	89	INDOMIE GORENG	1	PCS	1	3000	2450	0	3000	TRANSAKSI
213	111	89	INDOMIE GORENG	1	PCS	1	2800	2450	0	2800	TRANSAKSI
214	112	89	INDOMIE GORENG	1	PCS	1	3300	2450	0	3300	TRANSAKSI
215	113	89	INDOMIE GORENG	1	DOS	40	110000	98000	0	110000	TRANSAKSI
216	114	32	CITRA HBL 60ML BENGKOANG NTRL WHITE	1	SLOP	6	47000	40098	0	47000	TRANSAKSI
217	115	78	CLUB AIR MINUM GALON 19L	1	PCS	1	25000	17781	0	25000	TRANSAKSI
218	116	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	1	DOS	36	445000	419328	0	445000	TRANSAKSI
219	116	36	CITRA HBL NOURISHING AVOCADO 110ML	1	DOS	36	445000	425736	0	445000	TRANSAKSI
220	116	33	CITRA HBL 60ML PEARLY WHITE PINK	1	SLOP	6	0	36126	0	0	GRATIS
221	117	89	INDOMIE GORENG	1	PCS	1	3300	2450	0	3300	TRANSAKSI
222	118	89	INDOMIE GORENG	1	PCS	1	3300	2450	0	3300	TRANSAKSI
223	119	89	INDOMIE GORENG	6	PCS	1	16800	14700	0	16800	TRANSAKSI
224	120	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	1	DOS	36	445000	419328	0	445000	TRANSAKSI
225	120	36	CITRA HBL NOURISHING AVOCADO 110ML	1	DOS	36	445000	425736	0	445000	TRANSAKSI
226	120	89	INDOMIE GORENG	6	PCS	1	16800	14700	0	16800	TRANSAKSI
227	120	33	CITRA HBL 60ML PEARLY WHITE PINK	1	SLOP	6	0	36126	0	0	GRATIS
228	121	89	INDOMIE GORENG	6	PCS	1	16800	14700	0	16800	TRANSAKSI
229	121	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	1	DOS	36	445000	419328	0	445000	TRANSAKSI
230	121	36	CITRA HBL NOURISHING AVOCADO 110ML	1	DOS	36	445000	425736	0	445000	TRANSAKSI
231	121	33	CITRA HBL 60ML PEARLY WHITE PINK	1	SLOP	6	0	36126	0	0	GRATIS
232	122	75	CLUB AIR MINUM 1500ML	1	DOS	12	39000	39996	0	39000	TRANSAKSI
233	122	24	CIPTADENT SG DOUBLE ACTION SOFT (Tebus Murah)	1	PCS	1	2500	2250	0	2500	TEBUS_MURAH
234	123	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	1	DOS	36	445000	419328	0	445000	TRANSAKSI
235	123	36	CITRA HBL NOURISHING AVOCADO 110ML	1	DOS	36	445000	425736	0	445000	TRANSAKSI
236	123	33	CITRA HBL 60ML PEARLY WHITE PINK	1	SLOP	6	0	36126	0	0	GRATIS
237	124	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	1	DOS	36	445000	419328	0	445000	TRANSAKSI
238	124	36	CITRA HBL NOURISHING AVOCADO 110ML	1	DOS	36	445000	425736	0	445000	TRANSAKSI
239	124	33	CITRA HBL 60ML PEARLY WHITE PINK	1	SLOP	6	0	36126	0	0	GRATIS
240	125	17	CIPTADENT SG CLASSIC REG SOFT ISI 3	1	BOX	6	80000	39126	2000	78000	TRANSAKSI
241	126	17	CIPTADENT SG CLASSIC REG SOFT ISI 3	1	BOX	6	80000	39126	2500	77500	TRANSAKSI
242	126	21	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	1	BOX	6	80000	41160	2500	77500	TRANSAKSI
243	127	17	CIPTADENT SG CLASSIC REG SOFT ISI 3	3	PCS	1	24000	19563	727	23273	TRANSAKSI
244	127	21	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	3	BOX	6	240000	123480	7273	232727	TRANSAKSI
245	128	17	CIPTADENT SG CLASSIC REG SOFT ISI 3	3	PCS	1	24000	19563	783	23217	TRANSAKSI
246	128	21	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	2	BOX	6	160000	82320	5217	154783	TRANSAKSI
247	128	50	CLEAN & CLEAR FACIAL WASH 100ML	3	PCS	1	81000	74112	3000	78000	TRANSAKSI
248	129	50	CLEAN & CLEAR FACIAL WASH 100ML	3	PCS	1	81000	74112	3000	78000	TRANSAKSI
249	129	17	CIPTADENT SG CLASSIC REG SOFT ISI 3	3	PCS	1	24000	19563	783	23217	TRANSAKSI
250	129	21	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	2	BOX	6	160000	82320	5217	154783	TRANSAKSI
251	130	78	CLUB AIR MINUM GALON 19L	1	PCS	1	25000	17781	0	25000	TRANSAKSI
252	131	78	CLUB AIR MINUM GALON 19L	1	PCS	1	25000	17781	0	25000	TRANSAKSI
253	132	78	CLUB AIR MINUM GALON 19L	1	PCS	1	25000	17781	0	25000	TRANSAKSI
254	133	21	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	1	BOX	6	80000	41160	2000	78000	TRANSAKSI
255	134	21	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	1	BOX	6	80000	41160	2000	78000	TRANSAKSI
256	135	2	CIPTADENT COOL MINT 190G	1	PCS	1	14500	12444	0	14500	TRANSAKSI
257	136	73	CLOSE UP MENTHOL 160G	1	PAK	12	295000	240684	0	295000	TRANSAKSI
258	136	71	CLOSE UP DEEP ACTION 65+10G	1	PCS	1	9000	7014	0	9000	TRANSAKSI
259	136	71	CLOSE UP DEEP ACTION 65+10G	1	PCS	1	0	7014	0	0	GRATIS
260	137	88	CLUB GELAS 240ML	2	DOS	1	28000	21000	0	28000	TRANSAKSI
261	138	2	CIPTADENT COOL MINT 190G	6	PCS	1	90000	74664	0	90000	TRANSAKSI
262	139	75	CLUB AIR MINUM 1500ML	2	PCS	1	7000	6666	0	7000	TRANSAKSI
263	139	77	CLUB AIR MINUM 600ML	5	PCS	1	20000	7830	0	20000	TRANSAKSI
264	139	76	CLUB AIR MINUM 330ML	5	PCS	1	13500	7270	0	13500	TRANSAKSI
265	140	7	CIPTADENT FRESH MINT 190G	1	PCS	1	16000	15231	0	16000	TRANSAKSI
266	141	1	CIPTADENT COOL MINT 120G	1	PCS	1	9000	8132	0	9000	TRANSAKSI
267	142	7	CIPTADENT FRESH MINT 190G	1	PCS	1	16000	15276	0	16000	TRANSAKSI
268	143	91	CHITATO SAPI PANGGANG 68G	3	PCS	1	30000	16530	0	30000	TRANSAKSI
269	144	1	CIPTADENT COOL MINT 120G	6	PCS	1	54000	48792	0	54000	TRANSAKSI
270	145	2	CIPTADENT COOL MINT 190G	2	PCS	1	30000	24888	0	30000	TRANSAKSI
271	145	3	CIPTADENT COOL MINT 225+25G	2	PCS	1	26000	21460	0	26000	TRANSAKSI
272	146	77	CLUB AIR MINUM 600ML	5	PCS	1	20000	7830	0	20000	TRANSAKSI
273	146	76	CLUB AIR MINUM 330ML	2	PCS	1	5400	2908	0	5400	TRANSAKSI
274	147	89	INDOMIE GORENG	1	PCS	1	3300	2450	0	3300	TRANSAKSI
275	148	89	INDOMIE GORENG	1	PCS	1	3300	2450	0	3300	TRANSAKSI
276	149	6	CIPTADENT FRESH MINT 120G	1	PCS	1	11000	9976	0	11000	TRANSAKSI
277	149	2	CIPTADENT COOL MINT 190G	2	PCS	1	30000	24888	0	30000	TRANSAKSI
278	150	89	INDOMIE GORENG	1	PCS	1	3300	2450	0	3300	TRANSAKSI
279	151	76	CLUB AIR MINUM 330ML	2	DOS	24	80000	69792	0	80000	TRANSAKSI
280	151	77	CLUB AIR MINUM 600ML	10	PCS	1	40000	15660	0	40000	TRANSAKSI
281	151	75	CLUB AIR MINUM 1500ML	9	PCS	1	31500	29997	0	31500	TRANSAKSI
282	152	76	CLUB AIR MINUM 330ML	12	PCS	1	32400	17448	0	32400	TRANSAKSI
283	153	76	CLUB AIR MINUM 330ML	12	PCS	1	32400	17448	0	32400	TRANSAKSI
284	154	14	CIPTADENT MAXI HERBAL 190G	2	PCS	1	36000	30700	0	36000	TRANSAKSI
285	154	7	CIPTADENT FRESH MINT 190G	3	PCS	1	48000	45921	0	48000	TRANSAKSI
286	154	1	CIPTADENT COOL MINT 120G	5	PCS	1	45000	40660	0	45000	TRANSAKSI
287	155	76	CLUB AIR MINUM 330ML	15	PCS	1	40500	21810	0	40500	TRANSAKSI
288	155	77	CLUB AIR MINUM 600ML	34	PCS	1	136000	53244	0	136000	TRANSAKSI
289	156	89	INDOMIE GORENG	8	PCS	1	26400	19600	0	26400	TRANSAKSI
290	157	32	CITRA HBL 60ML BENGKOANG NTRL WHITE	1	PCS	1	9000	6683	0	9000	TRANSAKSI
291	157	33	CITRA HBL 60ML PEARLY WHITE PINK	1	PCS	1	9000	6021	0	9000	TRANSAKSI
292	157	3	CIPTADENT COOL MINT 225+25G	2	PCS	1	26000	21460	0	26000	TRANSAKSI
293	157	12	CIPTADENT MAXI COMPLETE 190G	2	PCS	1	26000	20200	0	26000	TRANSAKSI
294	158	76	CLUB AIR MINUM 330ML	10	PCS	1	27000	14540	0	27000	TRANSAKSI
295	158	77	CLUB AIR MINUM 600ML	12	PCS	1	48000	18792	0	48000	TRANSAKSI
296	159	76	CLUB AIR MINUM 330ML	6	PCS	1	13800	8724	0	13800	TRANSAKSI
297	159	77	CLUB AIR MINUM 600ML	8	PCS	1	29600	12528	0	29600	TRANSAKSI
298	160	8	CIPTADENT FRESH MINT 225+25G	3	PCS	1	45000	32460	0	45000	TRANSAKSI
299	161	76	CLUB AIR MINUM 330ML	10	PCS	1	27000	14540	0	27000	TRANSAKSI
300	161	77	CLUB AIR MINUM 600ML	9	PCS	1	36000	14094	0	36000	TRANSAKSI
301	162	32	CITRA HBL 60ML BENGKOANG NTRL WHITE	3	PCS	1	27000	20049	0	27000	TRANSAKSI
302	163	11	CIPTADENT MAXI COMPLETE 120G	2	PCS	1	16000	13200	0	16000	TRANSAKSI
303	163	6	CIPTADENT FRESH MINT 120G	1	PCS	1	11000	9976	0	11000	TRANSAKSI
304	163	2	CIPTADENT COOL MINT 190G	1	PCS	1	15000	12444	0	15000	TRANSAKSI
305	164	2	CIPTADENT COOL MINT 190G	2	PCS	1	30000	24888	0	30000	TRANSAKSI
306	165	8	CIPTADENT FRESH MINT 225+25G	1	PCS	1	15000	10809	0	15000	TRANSAKSI
307	166	2	CIPTADENT COOL MINT 190G	1	PCS	1	15000	12444	0	15000	TRANSAKSI
308	166	77	CLUB AIR MINUM 600ML	1	PCS	1	4000	1566	0	4000	TRANSAKSI
309	167	72	CLOSE UP MENTHOL 110G	1	PCS	1	19000	15911	0	19000	TRANSAKSI
310	167	73	CLOSE UP MENTHOL 160G	1	PCS	1	25000	20057	0	25000	TRANSAKSI
311	167	90	TEH BOTOL SOSRO KOTAK 250ML	1	PCS	1	3500	2708	0	3500	TRANSAKSI
312	167	76	CLUB AIR MINUM 330ML	1	PCS	1	2700	1454	0	2700	TRANSAKSI
313	168	7	CIPTADENT FRESH MINT 190G	2	PCS	1	32000	30660	0	32000	TRANSAKSI
314	169	3	CIPTADENT COOL MINT 225+25G	1	PCS	1	13000	10730	0	13000	TRANSAKSI
315	170	1	CIPTADENT COOL MINT 120G	1	PCS	1	9000	8132	0	9000	TRANSAKSI
316	171	2	CIPTADENT COOL MINT 190G	2	PCS	1	30000	24888	0	30000	TRANSAKSI
317	172	2	CIPTADENT COOL MINT 190G	1	PCS	1	15000	12444	0	15000	TRANSAKSI
318	173	2	CIPTADENT COOL MINT 190G	1	PCS	1	15000	12444	0	15000	TRANSAKSI
319	174	1	CIPTADENT COOL MINT 120G	2	PCS	1	18000	16264	0	18000	TRANSAKSI
320	175	32	CITRA HBL 60ML BENGKOANG NTRL WHITE	1	PCS	1	9000	6683	0	9000	TRANSAKSI
321	176	1	CIPTADENT COOL MINT 120G	5	PCS	1	45000	40660	0	45000	TRANSAKSI
322	177	1	CIPTADENT COOL MINT 120G	3	PCS	1	26700	24396	0	26700	TRANSAKSI
323	178	2	CIPTADENT COOL MINT 190G	1	PCS	1	15000	12444	0	15000	TRANSAKSI
324	178	1	CIPTADENT COOL MINT 120G	1	PCS	1	9000	8132	0	9000	TRANSAKSI
325	178	6	CIPTADENT FRESH MINT 120G	1	PCS	1	11000	10008	0	11000	TRANSAKSI
326	178	8	CIPTADENT FRESH MINT 225+25G	1	PCS	1	15000	10795	0	15000	TRANSAKSI
327	179	1	CIPTADENT COOL MINT 120G	1	PCS	1	9000	8132	0	9000	TRANSAKSI
328	180	8	CIPTADENT FRESH MINT 225+25G	1	PCS	1	15000	10795	0	15000	TRANSAKSI
329	181	1	CIPTADENT COOL MINT 120G	6	PCS	1	52800	48792	0	52800	TRANSAKSI
330	182	33	CITRA HBL 60ML PEARLY WHITE PINK	2	PCS	1	18000	12042	0	18000	TRANSAKSI
331	182	89	INDOMIE GORENG	1	DOS	40	110000	98000	0	110000	TRANSAKSI
332	183	11	CIPTADENT MAXI COMPLETE 120G	2	PCS	1	16000	13200	0	16000	TRANSAKSI
333	183	7	CIPTADENT FRESH MINT 190G	3	PCS	1	48000	46116	0	48000	TRANSAKSI
334	183	1	CIPTADENT COOL MINT 120G	2	PCS	1	18000	16264	0	18000	TRANSAKSI
335	184	32	CITRA HBL 60ML BENGKOANG NTRL WHITE	1	PCS	1	9000	6683	0	9000	TRANSAKSI
336	185	32	CITRA HBL 60ML BENGKOANG NTRL WHITE	1	PCS	1	8500	6683	0	8500	TRANSAKSI
337	186	2	CIPTADENT COOL MINT 190G	3	PCS	1	45000	37332	0	45000	TRANSAKSI
338	186	1	CIPTADENT COOL MINT 120G	4	PCS	1	36000	32528	0	36000	TRANSAKSI
339	187	3	CIPTADENT COOL MINT 225+25G	1	PCS	1	13000	10730	0	13000	TRANSAKSI
340	188	89	INDOMIE GORENG	1	DOS	40	110000	98000	0	110000	TRANSAKSI
341	189	94	CHITATO SAPI PANGGANG 20G	1	PCS	1	0	3493	0	0	TRANSAKSI
342	189	91	CHITATO SAPI PANGGANG 68G	1	PCS	1	10000	6501	0	10000	TRANSAKSI
\.


--
-- Data for Name: pesan_beli; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pesan_beli (id_pesan_beli, id_cabang, id_supplier, tanggal_pesan_beli, nomor_pesan_beli, keterangan, total_harga_pesan_beli, status, created_at) FROM stdin;
24	3	3	2025-09-06	PB/20250906/001	\N	35126	Selesai	2025-09-06 08:58:17
25	3	4	2025-09-06	PB/20250906/002	\N	212028	Batal	2025-09-06 09:01:46
26	5	11	2025-09-11	PB/20250911/001	\N	71920	Diproses	2025-09-11 07:53:59
27	3	11	2025-10-27	PR/2025/10/KANTOR/0001	\N	12947600	Selesai	2025-10-27 04:08:17
28	3	4	2025-10-28	PR/2025/10/KANTOR/0002	\N	9627840	Selesai	2025-10-28 02:48:43
29	3	4	2025-10-29	PR/2025/10/KANTOR/0003	\N	19825640	Selesai	2025-10-29 01:41:33
30	3	4	2025-10-31	PR/2025/10/KANTOR/0004	\N	32294916	Selesai	2025-10-31 09:21:59
31	3	3	2025-12-20	PR/2025/12/KANTOR/0001	\N	535080	Selesai	2025-12-20 06:05:54
32	3	4	2025-12-20	PR/2025/12/KANTOR/0002	\N	269562	Selesai	2025-12-20 06:17:37
33	3	4	2025-12-20	PR/2025/12/KANTOR/0003	\N	139776	Selesai	2025-12-20 06:24:08
34	3	4	2025-12-20	PR/2025/12/KANTOR/0004	\N	215148	Selesai	2025-12-20 06:37:30
35	3	4	2025-12-20	PR/2025/12/KANTOR/0005	\N	329160	Selesai	2025-12-20 06:43:02
36	3	3	2025-12-20	PR/2025/12/KANTOR/0006	\N	37236	Selesai	2025-12-20 06:44:37
37	3	3	2025-12-20	PR/2025/12/KANTOR/0007	\N	97548	Selesai	2025-12-20 06:48:52
38	3	3	2025-12-20	PR/2025/12/KANTOR/0008	\N	97548	Selesai	2025-12-20 06:57:39
39	3	3	2025-12-20	PR/2025/12/KANTOR/0009	\N	97548	Selesai	2025-12-20 07:02:44
\.


--
-- Data for Name: pesan_beli_detail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pesan_beli_detail (id, id_pesan_beli, id_barang, nama_barang, jumlah_barang, harga_satuan, subtotal, jumlah_diterima) FROM stdin;
92	28	35	CITRA HBL BENGKOANG NTRL WHITE 210ML	120	17929	2151480	120
93	28	37	CITRA HBL NOURISHING AVOCADO 210ML	120	24491	2938920	120
100	29	55	CLEAR SHP ICE COOL MENTHOL SEGAR 160ML	100	27430	2743000	100
109	32	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	6	11648	69888	6
110	32	35	CITRA HBL BENGKOANG NTRL WHITE 210ML	6	17929	107574	6
115	37	70	CLING SEMPROT UNGU 440ML	12	8129	97548	12
116	38	69	CLING SEMPROT LEMON 440ML 5113	12	8129	97548	12
117	39	68	CLING SEMPROT BIRU 440ML 5106	12	8129	97548	12
112	34	35	CITRA HBL BENGKOANG NTRL WHITE 210ML	12	17929	215148	12
84	25	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	12	11648	139776	6
103	30	39	CITRA HBL PEARLY WHITE UV 210ML	48	18616	893568	2
108	32	31	CIPTADENT WHITENING 190G	6	15350	92100	6
99	29	52	CLEAR SHP COMPLETE SOFT CARE 160ML	100	27430	2743000	100
104	30	41	CITRA HBL SAKURA FAIR UV 210ML	48	19196	921408	2
101	29	56	CLEAR SHP MENTHOL FRESH ACTIVE 160ML	100	27429	2742900	100
91	27	78	CLUB AIR MINUM GALON 19L	100	17000	1700000	99
82	24	3	CIPTADENT COOL MINT 225+25G	1	10730	10730	1
95	28	41	CITRA HBL SAKURA FAIR UV 210ML	120	19196	2303520	5
102	30	37	CITRA HBL NOURISHING AVOCADO 210ML	48	24491	1175568	2
89	27	76	CLUB AIR MINUM 330ML	2400	1454	3489600	100
97	29	41	CITRA HBL SAKURA FAIR UV 210ML	240	19196	4607040	10
86	26	76	CLUB AIR MINUM 330ML	5	1454	7270	5
98	29	42	CITRA PEARLY GLOW PINK 40G 3890	60	42031	2521860	10
107	31	21	CIPTADENT SG CTYSTAL CLEAN SOFT ISI 3	78	6860	535080	13
90	27	77	CLUB AIR MINUM 600ML	2400	1566	3758400	100
88	27	75	CLUB AIR MINUM 1500ML	1200	3333	3999600	99
94	28	39	CITRA HBL PEARLY WHITE UV 210ML	120	18616	2233920	4
83	25	33	CITRA HBL 60ML PEARLY WHITE PINK	12	6021	72252	1
105	30	42	CITRA PEARLY GLOW PINK 40G 3890	12	42031	504372	2
113	35	55	CLEAR SHP ICE COOL MENTHOL SEGAR 160ML	12	27430	329160	12
96	29	39	CITRA HBL PEARLY WHITE UV 210ML	240	18616	4467840	10
111	33	34	CITRA HBL BENGKOANG NTRL WHITE 110ML	12	11648	139776	12
114	36	63	CLING REFIL LEMON FRESH 425ML 5144	12	3103	37236	1
81	24	1	CIPTADENT COOL MINT 120G	3	8132	24396	6
106	30	92	SUSU ULTRA MILK COKLAT 250ML	240	120000	28800000	9
87	26	77	CLUB AIR MINUM 600ML	20	1566	31320	20
85	26	75	CLUB AIR MINUM 1500ML	10	3333	33330	9
\.


--
-- Data for Name: pesan_cabang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pesan_cabang (id_request, kode_request, id_cabang_peminta, id_cabang_sumber, id_user_peminta, status, tanggal_request, created_at) FROM stdin;
6	TR-20251010-68E8C00B9D54B	5	3	8	Dikirim Sebagian	2025-10-10 08:12:59	2026-05-31 14:58:29
7	TR-20251010-68E8C0395A222	5	3	8	Dikirim Sebagian	2025-10-10 08:13:45	2026-05-31 14:58:29
8	TR-20251010-68E8C2C3337BF	5	3	8	Dikirim Sebagian	2025-10-10 08:24:35	2026-05-31 14:58:29
9	TR-20251010-68E8C3BE1EEEE	5	3	8	Dikirim Sebagian	2025-10-10 08:28:46	2026-05-31 14:58:29
10	TR-20251012-68EB0D8E4049A	5	3	8	Selesai	2025-10-12 02:08:14	2026-05-31 14:58:29
11	TR-20251012161616	5	3	8	Selesai	2025-10-12 09:16:16	2026-05-31 14:58:29
12	TR-20251013090601	5	3	8	Selesai	2025-10-13 02:06:01	2026-05-31 14:58:29
13	TR-20251013103034	5	3	8	Dikirim Sebagian	2025-10-13 03:30:34	2026-05-31 14:58:29
14	TR-20251013103943	6	3	61	Dikirim Sebagian	2025-10-13 03:39:43	2026-05-31 14:58:29
15	TR-20251013105009	5	3	8	Dikirim Sebagian	2025-10-13 03:50:09	2026-05-31 14:58:29
16	TR-20251013124345	7	3	59	Dikirim Sebagian	2025-10-13 05:43:45	2026-05-31 14:58:29
17	TR-20251013151433	6	3	61	Dikirim Sebagian	2025-10-13 08:14:33	2026-05-31 14:58:29
18	TR-20251013153702	7	3	59	Selesai	2025-10-13 08:37:02	2026-05-31 14:58:29
19	TR-20251015154153	5	3	8	Dikirim Sebagian	2025-10-15 08:41:53	2026-05-31 14:58:29
20	TR-20251015154317	5	3	8	Selesai	2025-10-15 08:43:17	2026-05-31 14:58:29
21	TR-20251016090600	5	3	8	Dikirim Sebagian	2025-10-16 02:06:00	2026-05-31 14:58:29
22	TR-20251017085813	5	3	8	Dikirim Sebagian	2025-10-17 01:58:13	2026-05-31 14:58:29
23	TR-20251018120801	5	3	82	Selesai	2025-10-18 05:08:01	2026-05-31 14:58:29
24	TR-20251018162521	13	3	77	Dikirim Sebagian	2025-10-18 09:25:21	2026-05-31 14:58:29
25	TR-20251018162839	13	3	77	Dikirim Sebagian	2025-10-18 09:28:39	2026-05-31 14:58:29
26	TR-20251019125302	13	3	77	Selesai	2025-10-19 05:53:02	2026-05-31 14:58:29
27	TR-20251019142104	13	3	77	Dikirim Sebagian	2025-10-19 07:21:04	2026-05-31 14:58:29
28	TR-20251019145738	13	3	77	Dikirim Sebagian	2025-10-19 07:57:38	2026-05-31 14:58:29
29	TR-20251019161236	13	3	77	Selesai	2025-10-19 09:12:36	2026-05-31 14:58:29
30	TR-20251023095526	6	3	80	Dikirim Sebagian	2025-10-23 02:55:26	2026-05-31 14:58:29
31	TR-20251023133937	18	3	98	Pending	2025-10-23 06:39:37	2026-05-31 14:58:29
32	TR-20251023134850	11	6	74	Pending	2025-10-23 06:48:50	2026-05-31 14:58:29
33	TR-20251024083532	22	3	85	Pending	2025-10-24 01:35:32	2026-05-31 14:58:29
34	TR-20251024100825	16	3	108	Pending	2025-10-24 03:08:25	2026-05-31 14:58:29
35	TR-20251024205015	14	3	97	Pending	2025-10-24 13:50:15	2026-05-31 14:58:29
36	TR-20251025083156	10	3	69	Pending	2025-10-25 01:31:56	2026-05-31 14:58:29
37	TR-20251025091741	11	3	74	Pending	2025-10-25 02:17:41	2026-05-31 14:58:29
38	TR-20251103091248	21	3	89	Pending	2025-11-03 02:12:48	2026-05-31 14:58:29
39	TR-20251103091557	19	3	75	Pending	2025-11-03 02:15:57	2026-05-31 14:58:29
40	TR-20251103091703	10	3	69	Pending	2025-11-03 02:17:03	2026-05-31 14:58:29
41	TR-20251103092029	16	3	108	Pending	2025-11-03 02:20:29	2026-05-31 14:58:29
42	TR-20251103094304	15	3	76	Pending	2025-11-03 02:43:04	2026-05-31 14:58:29
43	TR-20251103102743	22	3	85	Pending	2025-11-03 03:27:43	2026-05-31 14:58:29
44	TR-20251103103626	12	3	102	Pending	2025-11-03 03:36:26	2026-05-31 14:58:29
45	TR-20251103103702	12	3	102	Pending	2025-11-03 03:37:02	2026-05-31 14:58:29
46	TR-20251103103729	12	3	102	Pending	2025-11-03 03:37:29	2026-05-31 14:58:29
47	TR-20251103104338	10	3	69	Pending	2025-11-03 03:43:38	2026-05-31 14:58:29
48	TR-20251103105520	12	3	102	Pending	2025-11-03 03:55:20	2026-05-31 14:58:29
49	TR-20251103111557	7	3	78	Pending	2025-11-03 04:15:57	2026-05-31 14:58:29
50	TR-20251103113725	9	3	79	Pending	2025-11-03 04:37:25	2026-05-31 14:58:29
51	TR-20251103115456	13	3	77	Pending	2025-11-03 04:54:56	2026-05-31 14:58:29
52	TR-20251103125658	12	3	102	Pending	2025-11-03 05:56:58	2026-05-31 14:58:29
53	TR-20251103125919	12	3	102	Pending	2025-11-03 05:59:19	2026-05-31 14:58:29
54	TR-20251103130412	6	3	80	Pending	2025-11-03 06:04:12	2026-05-31 14:58:29
55	TR-20251103131922	6	3	80	Pending	2025-11-03 06:19:22	2026-05-31 14:58:29
56	TR-20251103132032	6	3	80	Pending	2025-11-03 06:20:32	2026-05-31 14:58:29
57	TR-20251104114437	11	3	74	Pending	2025-11-04 04:44:37	2026-05-31 14:58:29
58	TR-20251104121124	8	3	71	Pending	2025-11-04 05:11:24	2026-05-31 14:58:29
59	TR-20251104131159	12	3	102	Pending	2025-11-04 06:11:59	2026-05-31 14:58:29
60	TR-20251104131301	12	3	102	Pending	2025-11-04 06:13:01	2026-05-31 14:58:29
61	TR-20251104131458	18	3	98	Pending	2025-11-04 06:14:58	2026-05-31 14:58:29
62	TR-20251104133519	14	3	97	Pending	2025-11-04 06:35:19	2026-05-31 14:58:29
63	TR-20251104133703	10	3	69	Pending	2025-11-04 06:37:03	2026-05-31 14:58:29
64	TR-20251104142912	6	3	80	Pending	2025-11-04 07:29:12	2026-05-31 14:58:29
65	TR-20251104143556	6	3	80	Pending	2025-11-04 07:35:56	2026-05-31 14:58:29
66	TR-20251104143655	6	3	80	Pending	2025-11-04 07:36:55	2026-05-31 14:58:29
67	TR-20251104143956	6	3	80	Pending	2025-11-04 07:39:56	2026-05-31 14:58:29
68	TR-20251108130904	15	3	76	Pending	2025-11-08 06:09:04	2026-05-31 14:58:29
69	TR-20251110102810	12	3	102	Pending	2025-11-10 03:28:10	2026-05-31 14:58:29
70	TR-20251110110556	12	3	102	Pending	2025-11-10 04:05:56	2026-05-31 14:58:29
71	TR-20251110120717	5	3	82	Pending	2025-11-10 05:07:17	2026-05-31 14:58:29
72	TR-20251110124941	14	3	97	Pending	2025-11-10 05:49:41	2026-05-31 14:58:29
73	TR-20251111135548	10	3	69	Pending	2025-11-11 06:55:48	2026-05-31 14:58:29
74	TR-20251116101734	10	3	69	Pending	2025-11-16 03:17:34	2026-05-31 14:58:29
75	TR-20251116140133	15	3	76	Pending	2025-11-16 07:01:33	2026-05-31 14:58:29
76	TR-20251116140321	15	3	76	Pending	2025-11-16 07:03:21	2026-05-31 14:58:29
77	TR-20251116140424	15	3	76	Pending	2025-11-16 07:04:24	2026-05-31 14:58:29
78	TR-20251116140518	15	3	76	Pending	2025-11-16 07:05:18	2026-05-31 14:58:29
79	TR-20251116140645	15	3	76	Pending	2025-11-16 07:06:45	2026-05-31 14:58:29
80	TR-20251116140737	15	3	76	Pending	2025-11-16 07:07:37	2026-05-31 14:58:29
81	TR-20251116140826	15	3	76	Pending	2025-11-16 07:08:26	2026-05-31 14:58:29
82	TR-20251116144930	21	3	89	Pending	2025-11-16 07:49:30	2026-05-31 14:58:29
83	TR-20251116145211	11	3	74	Pending	2025-11-16 07:52:11	2026-05-31 14:58:29
84	TR-20251117102125	22	3	85	Pending	2025-11-17 03:21:25	2026-05-31 14:58:29
85	TR-20251122135047	5	3	82	Pending	2025-11-22 06:50:47	2026-05-31 14:58:29
86	TR-20251211131656	5	3	82	Diproses	2025-12-11 06:16:56	2026-05-31 14:58:29
87	TR-20260602095017	3	16	4	Pending	2026-06-02	2026-06-02 02:50:17
88	TR-20260604155724	3	15	4	Pending	2026-06-04	2026-06-04 08:57:25
89	TR-20260604171157	3	3	4	Pending	2026-06-04	2026-06-04 10:11:57
90	TR-20260604171223	3	3	4	Pending	2026-06-04	2026-06-04 10:12:24
91	TR-20260604171850	3	3	4	Pending	2026-06-04	2026-06-04 10:18:50
92	TR-20260606082515	3	3	4	Pending	2026-06-06	2026-06-06 01:25:15
\.


--
-- Data for Name: pesan_cabang_detail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pesan_cabang_detail (id, id_request, id_barang, id_satuan, jumlah_diminta, status_item) FROM stdin;
1	6	91	\N	80	Terkirim Sebagian
2	7	6	\N	24	Dibatalkan
3	8	91	\N	1	Dibatalkan
4	9	91	\N	1	Dibatalkan
5	10	32	\N	0	Terkirim Sebagian
6	10	33	\N	0	Terkirim Sebagian
7	11	32	\N	0	Terkirim
8	11	33	\N	0	Terkirim
9	12	2	\N	0	Diproses
10	13	75	\N	60	Dibatalkan
11	13	76	\N	24	Dibatalkan
12	13	77	\N	48	Terkirim Sebagian
13	13	78	\N	3	Diproses
14	14	1	\N	0	Diproses
15	14	6	\N	12	Diproses
16	14	11	\N	0	Diproses
17	15	1	\N	6	Terkirim
18	15	11	\N	24	Diproses
19	16	1	\N	12	Terkirim
20	16	6	\N	12	Diproses
21	16	11	\N	120	Diproses
22	17	2	\N	24	Diproses
23	17	7	\N	12	Diproses
24	17	12	\N	24	Diproses
25	18	8	\N	0	Terkirim
26	19	88	\N	5	Terkirim Sebagian
27	20	71	\N	0	Terkirim
28	20	72	\N	0	Terkirim
29	20	73	\N	0	Terkirim
30	21	57	\N	0	Terkirim
31	21	60	\N	0	Terkirim
32	21	61	\N	30	Terkirim
33	22	63	\N	3	Dibatalkan
34	22	68	\N	3	Diproses
35	22	69	\N	3	Diproses
36	22	70	\N	3	Diproses
37	23	71	\N	0	Terkirim
38	24	1	\N	0	Terkirim Sebagian
39	24	2	\N	12	Diproses
40	25	2	\N	12	Diproses
41	25	3	\N	0	Terkirim
42	25	8	\N	0	Terkirim
43	26	50	\N	0	Terkirim
44	26	51	\N	0	Terkirim
45	27	1	\N	9	Terkirim Sebagian
46	28	1	\N	24	Terkirim Sebagian
47	29	16	\N	0	Terkirim
48	29	50	\N	0	Terkirim
49	29	51	\N	0	Terkirim
50	30	75	\N	24	Diproses
51	30	76	\N	24	Diproses
52	30	77	\N	0	Terkirim
53	30	78	\N	3	Diproses
54	30	88	\N	0	Terkirim
55	31	1	\N	12	Diproses
56	31	2	\N	12	Diproses
57	31	3	\N	12	Diproses
58	32	91	\N	40	Diproses
59	33	46	\N	10	Diproses
60	33	75	\N	12	Diproses
61	33	91	\N	12	Diproses
62	33	92	\N	24	Diproses
63	34	14	\N	624	Diproses
64	34	15	\N	36	Diproses
65	34	75	\N	24	Diproses
66	35	32	\N	20	Diproses
67	35	33	\N	3	Diproses
68	35	34	\N	3	Diproses
69	35	91	\N	20	Diproses
70	36	1	\N	12	Diproses
71	36	2	\N	12	Diproses
72	36	3	\N	12	Diproses
73	36	6	\N	12	Diproses
74	36	7	\N	12	Diproses
75	36	8	\N	12	Diproses
76	36	11	\N	12	Diproses
77	36	12	\N	12	Diproses
78	36	14	\N	12	Diproses
79	36	32	\N	3	Diproses
80	36	33	\N	3	Diproses
81	36	34	\N	3	Diproses
82	36	35	\N	3	Diproses
83	36	67	\N	3	Diproses
84	36	69	\N	3	Diproses
85	36	71	\N	24	Diproses
86	36	75	\N	36	Diproses
87	36	77	\N	120	Diproses
88	36	89	\N	200	Diproses
89	36	91	\N	6	Diproses
90	37	1	\N	12	Diproses
91	37	75	\N	24	Diproses
92	37	76	\N	24	Diproses
93	37	77	\N	72	Diproses
94	37	78	\N	2	Diproses
95	38	32	\N	6	Diproses
96	38	33	\N	6	Diproses
97	38	34	\N	3	Diproses
98	38	35	\N	3	Diproses
99	38	36	\N	3	Diproses
100	38	37	\N	3	Diproses
101	38	38	\N	3	Diproses
102	38	40	\N	3	Diproses
103	38	41	\N	3	Diproses
104	38	42	\N	3	Diproses
105	38	52	\N	2	Diproses
106	38	53	\N	2	Diproses
107	38	54	\N	2	Diproses
108	38	55	\N	2	Diproses
109	38	56	\N	2	Diproses
110	38	58	\N	10	Diproses
111	38	71	\N	12	Diproses
112	38	72	\N	12	Diproses
113	38	73	\N	12	Diproses
114	38	88	\N	3	Diproses
115	38	89	\N	40	Diproses
116	39	2	\N	12	Diproses
117	39	3	\N	12	Diproses
118	39	57	\N	40	Diproses
119	39	75	\N	60	Diproses
120	39	76	\N	120	Diproses
121	39	77	\N	120	Diproses
122	39	92	\N	240	Diproses
123	39	94	\N	720	Diproses
124	40	1	\N	12	Diproses
125	40	2	\N	132	Diproses
126	40	3	\N	12	Diproses
127	40	6	\N	12	Diproses
128	40	8	\N	12	Diproses
129	40	11	\N	12	Diproses
130	40	12	\N	12	Diproses
131	40	14	\N	12	Diproses
132	40	46	\N	10	Diproses
133	40	91	\N	6	Diproses
134	40	94	\N	6	Diproses
135	41	17	\N	18	Diproses
136	41	46	\N	10	Diproses
137	41	51	\N	4	Diproses
138	41	53	\N	3	Diproses
139	41	56	\N	4	Diproses
140	41	57	\N	10	Diproses
141	41	60	\N	10	Diproses
142	41	61	\N	10	Diproses
143	41	76	\N	24	Diproses
144	42	1	\N	12	Diproses
145	42	2	\N	12	Diproses
146	42	3	\N	12	Diproses
147	42	32	\N	12	Diproses
148	42	33	\N	12	Diproses
149	42	35	\N	3	Diproses
150	42	37	\N	3	Diproses
151	42	65	\N	3	Diproses
152	42	66	\N	3	Diproses
153	42	68	\N	3	Diproses
154	42	70	\N	3	Diproses
155	42	89	\N	40	Diproses
156	42	91	\N	10	Diproses
157	42	94	\N	30	Diproses
158	43	46	\N	1	Diproses
159	43	50	\N	3	Diproses
160	43	51	\N	3	Diproses
161	43	74	\N	6	Diproses
162	43	94	\N	12	Diproses
163	44	1	\N	12	Diproses
164	44	2	\N	12	Diproses
165	44	3	\N	12	Diproses
166	44	6	\N	12	Diproses
167	44	11	\N	12	Diproses
168	44	12	\N	12	Diproses
169	44	16	\N	12	Diproses
170	44	17	\N	6	Diproses
171	44	18	\N	12	Diproses
172	44	71	\N	12	Diproses
173	44	72	\N	12	Diproses
174	44	73	\N	12	Diproses
175	44	74	\N	10	Diproses
176	44	75	\N	60	Diproses
177	44	76	\N	120	Diproses
178	44	77	\N	120	Diproses
179	44	91	\N	10	Diproses
180	44	94	\N	60	Diproses
181	45	7	\N	12	Diproses
182	45	8	\N	12	Diproses
183	46	14	\N	12	Diproses
184	46	15	\N	12	Diproses
185	46	19	\N	12	Diproses
186	47	15	\N	12	Diproses
187	47	16	\N	12	Diproses
188	47	17	\N	6	Diproses
189	47	18	\N	12	Diproses
190	47	19	\N	12	Diproses
191	47	20	\N	12	Diproses
192	47	21	\N	6	Diproses
193	47	22	\N	12	Diproses
194	48	32	\N	3	Diproses
195	48	33	\N	3	Diproses
196	48	34	\N	3	Diproses
197	48	35	\N	3	Diproses
198	48	36	\N	3	Diproses
199	48	37	\N	3	Diproses
200	48	38	\N	3	Diproses
201	49	32	\N	3	Diproses
202	49	33	\N	3	Diproses
203	49	34	\N	3	Diproses
204	49	35	\N	3	Diproses
205	49	36	\N	3	Diproses
206	49	37	\N	3	Diproses
207	49	38	\N	3	Diproses
208	49	39	\N	3	Diproses
209	49	41	\N	3	Diproses
210	49	71	\N	12	Terkirim
211	49	72	\N	12	Diproses
212	49	73	\N	12	Diproses
213	49	89	\N	80	Diproses
214	49	90	\N	24	Diproses
215	50	1	\N	12	Diproses
216	50	2	\N	12	Diproses
217	50	3	\N	12	Diproses
218	50	6	\N	12	Diproses
219	50	7	\N	12	Diproses
220	50	8	\N	12	Diproses
221	50	11	\N	12	Diproses
222	50	12	\N	12	Diproses
223	50	15	\N	12	Diproses
224	50	16	\N	12	Diproses
225	50	17	\N	6	Diproses
226	50	18	\N	12	Diproses
227	50	19	\N	12	Diproses
228	50	20	\N	12	Diproses
229	50	21	\N	6	Diproses
230	50	22	\N	12	Diproses
231	50	23	\N	6	Diproses
232	50	24	\N	12	Diproses
233	50	25	\N	12	Diproses
234	50	26	\N	12	Diproses
235	50	27	\N	12	Diproses
236	50	28	\N	12	Diproses
237	50	29	\N	1	Diproses
238	50	91	\N	10	Diproses
239	50	94	\N	10	Diproses
240	51	1	\N	6	Diproses
241	51	2	\N	12	Diproses
242	51	3	\N	12	Diproses
243	51	77	\N	24	Diproses
244	51	89	\N	40	Diproses
245	51	90	\N	24	Diproses
246	52	20	\N	12	Diproses
247	52	21	\N	6	Diproses
248	52	22	\N	12	Diproses
249	53	89	\N	200	Diproses
250	53	92	\N	2	Diproses
251	54	32	\N	3	Over
252	54	35	\N	3	Diproses
253	54	36	\N	3	Diproses
254	54	37	\N	3	Diproses
255	54	38	\N	3	Diproses
256	54	39	\N	3	Diproses
257	54	40	\N	3	Diproses
258	54	71	\N	24	Diproses
259	54	72	\N	24	Diproses
260	54	73	\N	24	Diproses
261	54	88	\N	2	Diproses
262	54	89	\N	120	Diproses
263	55	33	\N	3	Diproses
264	55	34	\N	3	Diproses
265	55	41	\N	3	Diproses
266	55	50	\N	2	Diproses
267	55	51	\N	2	Diproses
268	56	90	\N	24	Diproses
269	56	91	\N	10	Diproses
270	56	94	\N	10	Diproses
271	57	50	\N	3	Diproses
272	57	51	\N	2	Diproses
273	57	57	\N	10	Diproses
274	57	60	\N	10	Diproses
275	57	61	\N	10	Diproses
276	57	74	\N	144	Diproses
277	58	32	\N	3	Diproses
278	58	33	\N	3	Diproses
279	58	34	\N	3	Diproses
280	58	35	\N	3	Diproses
281	58	36	\N	3	Diproses
282	58	58	\N	20	Diproses
283	59	39	\N	3	Diproses
284	59	40	\N	3	Diproses
285	59	41	\N	3	Diproses
286	59	42	\N	3	Diproses
287	60	50	\N	3	Diproses
288	60	51	\N	3	Diproses
289	60	52	\N	3	Diproses
290	60	53	\N	3	Diproses
291	60	54	\N	3	Diproses
292	60	55	\N	3	Diproses
293	61	6	\N	12	Diproses
294	61	15	\N	12	Diproses
295	61	46	\N	10	Diproses
296	61	75	\N	24	Diproses
297	61	76	\N	48	Diproses
298	61	89	\N	80	Diproses
299	61	90	\N	24	Diproses
300	61	91	\N	10	Diproses
301	61	94	\N	10	Diproses
302	62	1	\N	12	Diproses
303	62	2	\N	12	Diproses
304	62	3	\N	12	Diproses
305	62	6	\N	12	Diproses
306	62	7	\N	12	Diproses
307	62	8	\N	12	Diproses
308	62	11	\N	12	Diproses
309	62	12	\N	12	Diproses
310	62	14	\N	12	Diproses
311	62	15	\N	36	Diproses
312	62	16	\N	12	Diproses
313	62	17	\N	6	Diproses
314	62	18	\N	12	Diproses
315	62	19	\N	12	Diproses
316	62	20	\N	12	Diproses
317	62	21	\N	6	Diproses
318	62	22	\N	12	Diproses
319	62	23	\N	6	Diproses
320	62	24	\N	12	Diproses
321	62	25	\N	12	Diproses
322	62	26	\N	12	Diproses
323	62	27	\N	12	Diproses
324	62	28	\N	12	Diproses
325	62	29	\N	6	Diproses
326	62	30	\N	12	Diproses
327	62	31	\N	12	Diproses
328	62	32	\N	3	Diproses
329	62	33	\N	5	Diproses
330	62	34	\N	5	Diproses
331	62	36	\N	5	Diproses
332	62	37	\N	5	Diproses
333	62	38	\N	5	Diproses
334	62	39	\N	5	Diproses
335	62	41	\N	5	Diproses
336	62	46	\N	10	Diproses
337	62	50	\N	3	Diproses
338	62	51	\N	6	Diproses
339	62	52	\N	5	Diproses
340	62	53	\N	5	Diproses
341	62	55	\N	3	Diproses
342	62	56	\N	3	Diproses
343	62	57	\N	40	Diproses
344	62	58	\N	3	Diproses
345	62	59	\N	40	Diproses
346	62	60	\N	40	Diproses
347	62	61	\N	40	Diproses
348	62	62	\N	40	Diproses
349	62	63	\N	3	Diproses
350	62	64	\N	3	Diproses
351	62	65	\N	3	Diproses
352	62	66	\N	3	Diproses
353	62	67	\N	3	Diproses
354	62	68	\N	3	Diproses
355	62	69	\N	3	Diproses
356	62	70	\N	3	Diproses
357	62	71	\N	24	Diproses
358	62	72	\N	12	Diproses
359	62	73	\N	1	Diproses
360	62	74	\N	10	Diproses
361	62	75	\N	60	Diproses
362	62	76	\N	120	Diproses
363	62	77	\N	144	Diproses
364	62	78	\N	2	Diproses
365	62	88	\N	3	Diproses
366	62	89	\N	200	Diproses
367	62	90	\N	6	Diproses
368	62	92	\N	5	Diproses
369	62	94	\N	10	Diproses
370	63	23	\N	6	Diproses
371	63	24	\N	12	Diproses
372	63	25	\N	12	Diproses
373	63	26	\N	12	Diproses
374	63	27	\N	12	Diproses
375	63	28	\N	12	Diproses
376	63	29	\N	6	Diproses
377	63	30	\N	12	Diproses
378	63	31	\N	12	Diproses
379	63	36	\N	3	Diproses
380	63	37	\N	3	Diproses
381	63	38	\N	3	Diproses
382	63	39	\N	3	Diproses
383	63	40	\N	3	Diproses
384	63	41	\N	3	Diproses
385	63	42	\N	3	Diproses
386	63	50	\N	3	Diproses
387	63	51	\N	3	Diproses
388	63	52	\N	3	Diproses
389	63	53	\N	3	Diproses
390	63	54	\N	3	Diproses
391	63	55	\N	3	Diproses
392	63	56	\N	3	Diproses
393	63	57	\N	12	Diproses
394	63	58	\N	12	Diproses
395	63	63	\N	3	Diproses
396	63	64	\N	3	Diproses
397	63	65	\N	3	Diproses
398	63	66	\N	3	Diproses
399	63	68	\N	3	Diproses
400	63	72	\N	12	Diproses
401	63	73	\N	12	Diproses
402	63	74	\N	3	Diproses
403	63	90	\N	24	Diproses
404	63	92	\N	24	Diproses
405	64	1	\N	24	Diproses
406	64	3	\N	12	Terkirim
407	64	8	\N	12	Over
408	64	11	\N	12	Diproses
409	64	14	\N	12	Diproses
410	64	15	\N	12	Diproses
411	64	16	\N	12	Diproses
412	64	17	\N	6	Diproses
413	64	18	\N	12	Over
414	64	19	\N	12	Diproses
415	65	20	\N	12	Diproses
416	65	21	\N	6	Diproses
417	65	22	\N	12	Diproses
418	65	26	\N	12	Diproses
419	65	27	\N	12	Diproses
420	65	29	\N	6	Diproses
421	66	23	\N	6	Diproses
422	66	24	\N	12	Diproses
423	66	25	\N	12	Diproses
424	67	42	\N	3	Diproses
425	67	46	\N	10	Diproses
426	67	50	\N	3	Diproses
427	67	51	\N	3	Diproses
428	67	52	\N	3	Over
429	67	53	\N	3	Over
430	67	54	\N	3	Diproses
431	67	55	\N	3	Diproses
432	67	56	\N	3	Diproses
433	67	57	\N	10	Diproses
434	67	58	\N	10	Diproses
435	67	59	\N	10	Diproses
436	67	61	\N	10	Diproses
437	67	62	\N	10	Diproses
438	67	63	\N	3	Diproses
439	67	64	\N	3	Diproses
440	67	65	\N	3	Diproses
441	67	66	\N	3	Diproses
442	67	67	\N	3	Diproses
443	67	68	\N	3	Diproses
444	67	69	\N	3	Diproses
445	67	70	\N	3	Diproses
446	67	74	\N	3	Diproses
447	67	77	\N	120	Diproses
448	68	6	\N	12	Diproses
449	68	7	\N	12	Diproses
450	68	8	\N	12	Diproses
451	68	11	\N	12	Diproses
452	68	12	\N	12	Diproses
453	68	14	\N	12	Diproses
454	68	15	\N	12	Diproses
455	69	1	\N	12	Diproses
456	69	2	\N	12	Diproses
457	69	3	\N	12	Diproses
458	69	8	\N	12	Diproses
459	69	14	\N	12	Diproses
460	69	15	\N	12	Diproses
461	69	16	\N	12	Diproses
462	69	17	\N	6	Diproses
463	69	18	\N	12	Diproses
464	69	19	\N	12	Diproses
465	69	20	\N	12	Diproses
466	69	21	\N	6	Diproses
467	69	22	\N	12	Diproses
468	69	23	\N	6	Diproses
469	69	24	\N	12	Diproses
470	69	25	\N	12	Diproses
471	69	26	\N	12	Diproses
472	69	27	\N	12	Diproses
473	69	28	\N	12	Diproses
474	69	29	\N	6	Diproses
475	69	30	\N	12	Diproses
476	69	31	\N	12	Diproses
477	69	91	\N	10	Diproses
478	70	56	\N	2	Diproses
479	70	57	\N	20	Diproses
480	70	58	\N	20	Diproses
481	70	59	\N	20	Diproses
482	70	60	\N	20	Diproses
483	70	61	\N	20	Diproses
484	70	62	\N	10	Diproses
485	71	1	\N	12	Diproses
486	71	3	\N	12	Diproses
487	71	8	\N	6	Diproses
488	71	30	\N	12	Diproses
489	71	50	\N	3	Diproses
490	71	52	\N	2	Diproses
491	71	91	\N	12	Dibatalkan
492	71	94	\N	60	Dibatalkan
493	72	1	\N	5	Diproses
494	72	2	\N	5	Diproses
495	72	3	\N	5	Diproses
496	72	6	\N	2	Diproses
497	72	7	\N	2	Diproses
498	72	8	\N	12	Diproses
499	72	91	\N	5	Diproses
500	72	94	\N	5	Diproses
501	73	59	\N	12	Diproses
502	73	60	\N	12	Diproses
503	73	61	\N	12	Diproses
504	73	62	\N	12	Diproses
505	73	70	\N	3	Diproses
506	74	76	\N	24	Diproses
507	75	16	\N	3	Diproses
508	75	17	\N	6	Diproses
509	75	18	\N	6	Diproses
510	75	19	\N	6	Diproses
511	75	20	\N	6	Diproses
512	75	21	\N	6	Diproses
513	75	22	\N	6	Diproses
514	75	23	\N	6	Diproses
515	75	24	\N	6	Diproses
516	75	25	\N	6	Diproses
517	75	26	\N	6	Diproses
518	75	27	\N	6	Diproses
519	75	28	\N	6	Diproses
520	75	29	\N	6	Diproses
521	75	30	\N	6	Diproses
522	75	31	\N	6	Diproses
523	75	34	\N	6	Diproses
524	75	36	\N	6	Diproses
525	75	38	\N	6	Diproses
526	75	39	\N	6	Diproses
527	75	40	\N	6	Diproses
528	75	41	\N	6	Diproses
529	75	42	\N	6	Diproses
530	75	46	\N	10	Diproses
531	75	50	\N	3	Diproses
532	75	51	\N	3	Diproses
533	75	52	\N	3	Diproses
534	75	75	\N	12	Diproses
535	75	76	\N	48	Diproses
536	75	77	\N	48	Diproses
537	75	78	\N	2	Diproses
538	76	53	\N	3	Diproses
539	76	54	\N	3	Diproses
540	76	55	\N	33	Diproses
541	76	56	\N	3	Diproses
542	76	57	\N	3	Diproses
543	76	58	\N	3	Diproses
544	76	59	\N	12	Diproses
545	77	60	\N	12	Diproses
546	77	61	\N	12	Diproses
547	78	62	\N	12	Diproses
548	78	63	\N	3	Diproses
549	78	64	\N	3	Diproses
550	79	71	\N	6	Diproses
551	79	72	\N	6	Diproses
552	79	73	\N	6	Diproses
553	79	88	\N	1	Diproses
554	79	90	\N	24	Diproses
555	79	92	\N	24	Diproses
556	79	93	\N	120	Diproses
557	80	74	\N	10	Diproses
558	81	67	\N	3	Diproses
559	81	69	\N	3	Diproses
560	82	1	\N	12	Diproses
561	82	2	\N	12	Diproses
562	82	91	\N	6	Diproses
563	82	94	\N	6	Diproses
564	83	32	\N	3	Diproses
565	83	33	\N	3	Diproses
566	83	34	\N	3	Diproses
567	83	35	\N	3	Diproses
568	83	36	\N	3	Diproses
569	83	37	\N	3	Diproses
570	83	38	\N	3	Diproses
571	83	39	\N	3	Diproses
572	83	40	\N	3	Diproses
573	83	41	\N	3	Diproses
574	84	1	\N	12	Diproses
575	84	2	\N	12	Diproses
576	84	17	\N	12	Diproses
577	84	19	\N	12	Diproses
578	84	64	\N	6	Diproses
579	84	65	\N	6	Diproses
580	84	94	\N	13	Diproses
581	85	1	\N	6	Diproses
582	85	2	\N	6	Diproses
583	85	91	\N	6	Diproses
584	85	94	\N	6	Diproses
585	86	1	\N	12	Terkirim
586	86	3	\N	12	Terkirim
587	86	6	\N	12	Terkirim
588	86	7	\N	12	Terkirim
589	86	8	\N	12	Terkirim
590	86	11	\N	12	Terkirim
591	86	12	\N	12	Terkirim
592	86	14	\N	12	Terkirim
593	86	15	\N	12	Terkirim
594	86	16	\N	12	Terkirim
595	86	94	\N	12	Terkirim
596	87	1	\N	1	Diproses
597	88	1	\N	1	Diproses
598	89	46	\N	1	Diproses
599	90	46	\N	1	Diproses
600	91	39	\N	1	Diproses
601	92	1	\N	1	Diproses
602	92	89	\N	40	Diproses
\.


--
-- Data for Name: promo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo (id_promo, nama_promo, tipe_promo, deskripsi, berlaku_untuk, tanggal_mulai, tanggal_selesai, status, berlaku_kelipatan, created_by, updated_by, id_cabang_pembuat, created_at, updated_at) FROM stdin;
1	Promo Beras Misfalah Pagi	BELI_GRATIS	Beli 5 Pcs Beras Misfalah gratis 1 Pcs Gula Pasir 1kg	UMUM,1,2	2026-06-01 07:00:00	2026-06-30 11:00:00	Aktif	1	1	1	2	2026-06-01T10:07:22.397Z	2026-06-01T10:07:22.397Z
2	Tebus Murah Minyak Goreng Koperasi	TEBUS_MURAH	Belanja Min. Rp 200.000, tebus murah Bimoli 2L seharga Rp 15.000	2,3	2026-06-01 00:00:00	2026-06-15 23:59:59	Aktif	0	1	1	3	2026-06-01T10:07:22.397Z	2026-06-01T10:07:22.397Z
\.


--
-- Data for Name: promo_barang_tebus_murah; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_barang_tebus_murah (id, id_promo, id_barang, jumlah, id_satuan, harga_tebus) FROM stdin;
1	2	3	1	1	15000
\.


--
-- Data for Name: promo_cabang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_cabang (id, id_promo, id_cabang) FROM stdin;
1	1	2
2	2	2
3	2	3
\.


--
-- Data for Name: promo_diskon_barang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_diskon_barang (id, id_promo, id_barang, jumlah, id_satuan, jenis_diskon, nilai_diskon, berlaku_kelipatan) FROM stdin;
\.


--
-- Data for Name: promo_hadiah_barang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_hadiah_barang (id, id_promo, id_barang, jumlah, id_satuan) FROM stdin;
\.


--
-- Data for Name: promo_hadiah_diskon; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_hadiah_diskon (id, id_promo, jenis_diskon, nilai_diskon) FROM stdin;
\.


--
-- Data for Name: promo_hadiah_gratis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_hadiah_gratis (id, id_promo, id_barang, jumlah, id_satuan) FROM stdin;
1	1	2	1	1
\.


--
-- Data for Name: promo_hadiah_poin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_hadiah_poin (id, id_promo, jumlah_poin) FROM stdin;
\.


--
-- Data for Name: promo_poin_barang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_poin_barang (id, id_promo, id_barang, jumlah_barang, id_satuan, jumlah_poin, berlaku_kelipatan) FROM stdin;
\.


--
-- Data for Name: promo_syarat_barang_tertentu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_syarat_barang_tertentu (id, id_promo, id_barang) FROM stdin;
\.


--
-- Data for Name: promo_syarat_beli; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_syarat_beli (id, id_promo, id_barang, jumlah, id_satuan) FROM stdin;
1	1	1	5	1
\.


--
-- Data for Name: promo_syarat_kategori; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_syarat_kategori (id, id_promo, id_kategori) FROM stdin;
\.


--
-- Data for Name: promo_syarat_pembelanjaan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_syarat_pembelanjaan (id, id_promo, minimum_pembelanjaan, berlaku_kelipatan) FROM stdin;
1	2	200000	0
\.


--
-- Data for Name: promo_syarat_supplier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_syarat_supplier (id, id_promo, id_supplier) FROM stdin;
\.


--
-- Data for Name: rekening_kas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rekening_kas (id, kode, nama, jenis, id_cabang, saldo_awal, saldo, id_akun_coa, is_active, created_at, updated_at) FROM stdin;
1	REK-SUKOSARI-01	Kas Toko Sukosari	KAS_TOKO	2	1000000	1000000	1	t	2026-08-11 14:36:40	2026-08-11 14:36:40
2	REK-KANTOR-01	Kas Toko Kantor	KAS_TOKO	3	2000000	2000000	1	t	2026-08-11 14:36:40	2026-08-11 14:36:40
\.


--
-- Data for Name: rekomendasi_pengiriman; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rekomendasi_pengiriman (id, kode_rekomendasi, tanggal_rekomendasi, status, dibuat_oleh, catatan, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: rekomendasi_pengiriman_detail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rekomendasi_pengiriman_detail (id, id_rekomendasi, id_barang, id_cabang_tujuan, stok_sekarang, ads, qty_rekomendasi, target_stock, prioritas_score, qty_approved) FROM stdin;
\.


--
-- Data for Name: rekonsiliasi_kas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rekonsiliasi_kas (id, id_rekening, tanggal, saldo_sistem, saldo_fisik, selisih, alasan, bukti, status, approved_by, approved_at, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: riwayat_poin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.riwayat_poin (id, id_pelanggan, jenis_transaksi, jumlah_poin, keterangan, id_referensi_transaksi, waktu) FROM stdin;
1	1	DAPAT	300	Poin Pembelian Pertama POS-00231	INV-2026-0001	2026-05-15 10:30:15
2	1	GUNAKAN	50	Klaim Voucher Belanja Hadiah 50P	VCH-10023	2026-05-20 14:15:00
3	2	DAPAT	1500	Pembelian Grosir Paket A	INV-2026-0012	2026-05-22 09:00:00
4	3	DAPAT	5000	Apresiasi Loyalitas Instansi oleh Admin	MANUAL-001	2026-05-30 16:45:00
\.


--
-- Data for Name: role_menu; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_menu (id, id_jabatan, id_menu_main, aktif, can_create, can_read, can_update, can_delete) FROM stdin;
1063	1	37	t	t	t	t	t
1064	1	38	t	t	t	t	t
1065	1	39	t	t	t	t	t
1066	1	40	t	t	t	t	t
1067	1	41	t	t	t	t	t
1068	1	42	t	t	t	t	t
1069	1	43	t	t	t	t	t
1070	1	44	t	t	t	t	t
1071	1	45	t	t	t	t	t
1072	1	46	t	t	t	t	t
1073	2	37	t	t	t	t	t
1074	2	38	t	t	t	t	t
1075	2	39	t	t	t	t	t
1076	2	40	t	t	t	t	t
1077	2	41	t	t	t	t	t
1078	2	42	t	t	t	t	t
1079	2	43	t	t	t	t	t
1080	2	44	t	t	t	t	t
1081	2	45	t	t	t	t	t
1082	2	46	t	t	t	t	t
1083	3	37	t	t	t	t	t
1084	3	38	t	t	t	t	t
1085	4	37	t	f	t	f	f
1086	5	37	t	f	t	f	f
1087	6	37	t	f	t	f	f
1088	7	37	t	f	t	f	f
1089	7	40	t	t	t	t	f
1090	7	41	t	t	t	t	f
1091	8	37	t	t	t	t	t
1092	8	38	t	t	t	t	t
1093	8	39	t	t	t	t	t
1094	8	40	t	t	t	t	t
1095	8	41	t	t	t	t	t
1096	8	42	t	t	t	t	t
1097	8	43	t	t	t	t	t
1098	8	44	t	t	t	t	t
1099	8	45	t	t	t	t	t
1100	8	46	t	t	t	t	t
1101	9	37	t	f	t	f	f
1102	10	37	t	f	t	f	f
1103	11	37	t	f	t	f	f
\.


--
-- Data for Name: role_menu_sub; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_menu_sub (id, id_jabatan, id_menu_sub, aktif, can_create, can_read, can_update, can_delete) FROM stdin;
3184	1	127	t	t	t	t	t
3185	1	128	t	t	t	t	t
3186	1	129	t	t	t	t	t
3187	1	130	t	t	t	t	t
3188	1	131	t	t	t	t	t
3189	1	132	t	t	t	t	t
3190	1	133	t	t	t	t	t
3191	1	134	t	t	t	t	t
3192	1	135	t	t	t	t	t
3193	1	136	t	t	t	t	t
3194	1	137	t	t	t	t	t
3195	1	138	t	t	t	t	t
3196	1	139	t	t	t	t	t
3197	1	140	t	t	t	t	t
3198	1	141	t	t	t	t	t
3199	1	142	t	t	t	t	t
3200	1	143	t	t	t	t	t
3201	1	144	t	t	t	t	t
3202	1	145	t	t	t	t	t
3203	1	146	t	t	t	t	t
3204	1	147	t	t	t	t	t
3205	1	148	t	t	t	t	t
3206	1	149	t	t	t	t	t
3207	1	150	t	t	t	t	t
3208	1	151	t	t	t	t	t
3209	1	152	t	t	t	t	t
3210	1	153	t	t	t	t	t
3211	1	154	t	t	t	t	t
3212	1	155	t	t	t	t	t
3213	1	156	t	t	t	t	t
3214	1	157	t	t	t	t	t
3215	1	158	t	t	t	t	t
3216	2	127	t	t	t	t	t
3217	2	128	t	t	t	t	t
3218	2	129	t	t	t	t	t
3219	2	130	t	t	t	t	t
3220	2	131	t	t	t	t	t
3221	2	132	t	t	t	t	t
3222	2	133	t	t	t	t	t
3223	2	134	t	t	t	t	t
3224	2	135	t	t	t	t	t
3225	2	136	t	t	t	t	t
3226	2	137	t	t	t	t	t
3227	2	138	t	t	t	t	t
3228	2	139	t	t	t	t	t
3229	2	140	t	t	t	t	t
3230	2	141	t	t	t	t	t
3231	2	142	t	t	t	t	t
3232	2	143	t	t	t	t	t
3233	2	144	t	t	t	t	t
3234	2	145	t	t	t	t	t
3235	2	146	t	t	t	t	t
3236	2	147	t	t	t	t	t
3237	2	148	t	t	t	t	t
3238	2	149	t	t	t	t	t
3239	2	150	t	t	t	t	t
3240	2	151	t	t	t	t	t
3241	2	152	t	t	t	t	t
3242	2	153	t	t	t	t	t
3243	2	154	t	t	t	t	t
3244	2	155	t	t	t	t	t
3245	2	156	t	t	t	t	t
3246	2	157	t	t	t	t	t
3247	2	158	t	t	t	t	t
3248	3	127	t	t	t	t	t
3249	3	128	t	t	t	t	t
3250	3	129	t	t	t	t	t
3251	3	130	t	t	t	t	t
3252	3	131	t	t	t	t	t
3253	3	132	t	t	t	t	t
3254	3	133	t	t	t	t	t
3255	7	138	t	t	t	t	f
3256	7	139	t	t	t	t	f
3257	7	140	t	f	t	f	f
3258	7	141	t	t	t	t	f
3259	7	142	t	t	t	t	f
3260	8	127	t	t	t	t	t
3261	8	128	t	t	t	t	t
3262	8	129	t	t	t	t	t
3263	8	130	t	t	t	t	t
3264	8	131	t	t	t	t	t
3265	8	132	t	t	t	t	t
3266	8	133	t	t	t	t	t
3267	8	134	t	t	t	t	t
3268	8	135	t	t	t	t	t
3269	8	136	t	t	t	t	t
3270	8	137	t	t	t	t	t
3271	8	138	t	t	t	t	t
3272	8	139	t	t	t	t	t
3273	8	140	t	t	t	t	t
3274	8	141	t	t	t	t	t
3275	8	142	t	t	t	t	t
3276	8	143	t	t	t	t	t
3277	8	144	t	t	t	t	t
3278	8	145	t	t	t	t	t
3279	8	146	t	t	t	t	t
3280	8	147	t	t	t	t	t
3281	8	148	t	t	t	t	t
3282	8	149	t	t	t	t	t
3283	8	150	t	t	t	t	t
3284	8	151	t	t	t	t	t
3285	8	152	t	t	t	t	t
3286	8	153	t	t	t	t	t
3287	8	154	t	t	t	t	t
3288	8	155	t	t	t	t	t
3289	8	156	t	t	t	t	t
3290	8	157	t	t	t	t	t
3291	8	158	t	t	t	t	t
3292	1	159	t	t	t	t	t
3293	2	159	t	t	t	t	t
3294	1	160	t	t	t	t	t
3295	2	160	t	t	t	t	t
3296	1	161	t	t	t	t	t
3297	2	161	t	t	t	t	t
3298	1	162	t	t	t	t	t
3299	2	162	t	t	t	t	t
3300	1	163	t	t	t	t	t
3301	2	163	t	t	t	t	t
3302	1	164	t	t	t	t	t
3303	2	164	t	t	t	t	t
3304	1	165	t	t	t	t	t
3305	2	165	t	t	t	t	t
3306	7	162	t	t	t	t	t
3307	1	166	t	t	t	t	t
3308	2	166	t	t	t	t	t
3309	1	167	t	t	t	t	t
3310	2	167	t	t	t	t	t
3311	7	167	t	t	t	t	t
3312	1	168	t	t	t	t	t
3313	2	168	t	t	t	t	t
3314	1	169	t	t	t	t	t
3315	2	169	t	t	t	t	t
3316	1	170	t	t	t	t	t
3317	2	170	t	t	t	t	t
3318	1	171	t	t	t	t	t
3319	2	171	t	t	t	t	t
3320	8	171	t	t	t	t	t
3321	1	172	t	t	t	t	t
3322	2	172	t	t	t	t	t
3323	8	172	t	t	t	t	t
\.


--
-- Data for Name: sales_velocity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales_velocity (id, id_barang, id_cabang, ads_7, ads_30, ads_90, last_calculated, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stok_barang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stok_barang (id, id_barang, id_cabang, stok_akhir, penjualan, transfer_masuk, transfer_keluar, posisi_rak, minimal_stok, maksimal_stok) FROM stdin;
1	1	3	-3	19	22	45	\N	0	0
2	1	5	0	8	8	0	\N	0	0
3	1	6	11	7	11	0	\N	0	0
4	1	11	74	0	0	0	\N	0	0
5	1	13	8	4	0	0	\N	0	0
6	1	14	8	2	0	0	\N	0	0
7	1	15	5	5	0	0	\N	0	0
8	1	16	10	2	0	0	\N	0	0
9	1	18	5	7	0	0	\N	0	0
10	1	21	81	2	0	0	\N	0	0
11	1	22	12	0	0	0	\N	0	0
12	2	3	26	0	0	0	\N	0	0
13	2	5	6	6	12	0	\N	0	0
14	2	6	7	0	0	0	\N	0	0
15	2	10	9	3	0	0	\N	0	0
16	2	11	66	0	0	0	\N	0	0
17	2	13	7	5	0	0	\N	0	0
18	2	14	8	2	0	0	\N	0	0
19	2	15	7	3	0	0	\N	0	0
20	2	16	12	0	0	0	\N	0	0
21	2	21	35	1	0	0	\N	0	0
22	2	22	10	2	0	0	\N	0	0
23	3	3	90	1	18	24	\N	0	0
24	3	6	36	0	12	0	\N	0	0
25	3	10	12	0	0	0	\N	0	0
26	3	11	162	0	0	0	\N	0	0
27	3	13	22	2	6	0	\N	0	0
28	3	14	10	0	0	0	\N	0	0
29	3	15	10	2	0	0	\N	0	0
30	3	16	12	0	0	0	\N	0	0
31	3	19	12	0	0	0	\N	0	0
32	3	21	82	1	0	0	\N	0	0
33	3	22	12	0	0	0	\N	0	0
34	6	3	-10	1	0	12	\N	0	0
35	6	6	12	0	0	0	\N	0	0
36	6	11	198	0	0	0	\N	0	0
37	6	13	12	0	0	0	\N	0	0
38	6	14	10	0	0	0	\N	0	0
39	6	15	10	2	0	0	\N	0	0
40	6	16	12	0	0	0	\N	0	0
41	6	18	12	0	0	0	\N	0	0
42	6	19	12	0	0	0	\N	0	0
43	6	21	83	1	0	0	\N	0	0
44	6	22	12	0	0	0	\N	0	0
45	7	3	-10	0	0	12	\N	0	0
46	7	6	24	0	12	0	\N	0	0
47	7	10	12	0	0	0	\N	0	0
48	7	11	30	0	0	0	\N	0	0
49	7	13	12	0	0	0	\N	0	0
50	7	14	10	0	0	0	\N	0	0
51	7	15	9	3	0	0	\N	0	0
52	7	16	9	3	0	0	\N	0	0
53	7	19	8	4	0	0	\N	0	0
54	7	21	12	0	0	0	\N	0	0
55	8	3	58	0	0	24	\N	0	0
56	8	6	11	3	24	0	\N	0	0
57	8	10	12	0	0	0	\N	0	0
58	8	11	18	0	0	0	\N	0	0
59	8	14	10	0	0	0	\N	0	0
60	8	15	12	0	0	0	\N	0	0
61	8	16	16	1	0	0	\N	0	0
62	8	21	10	2	0	0	\N	0	0
63	11	3	0	0	0	12	\N	0	0
64	11	6	24	0	12	0	\N	0	0
65	11	10	12	0	0	0	\N	0	0
66	11	11	18	0	0	0	\N	0	0
67	11	13	12	0	0	0	\N	0	0
68	11	14	10	0	0	0	\N	0	0
69	11	15	10	2	0	0	\N	0	0
70	11	16	46	2	0	0	\N	0	0
71	11	19	12	0	0	0	\N	0	0
72	11	21	12	0	0	0	\N	0	0
73	12	3	0	0	0	12	\N	0	0
74	12	6	24	0	12	0	\N	0	0
75	12	13	12	0	0	0	\N	0	0
76	12	14	10	0	0	0	\N	0	0
77	12	15	10	2	0	0	\N	0	0
78	12	16	12	0	0	0	\N	0	0
79	12	19	12	0	0	0	\N	0	0
80	12	21	12	0	0	0	\N	0	0
81	14	3	0	0	0	12	\N	0	0
82	14	6	12	0	0	0	\N	0	0
83	14	13	12	0	0	0	\N	0	0
84	14	14	10	0	0	0	\N	0	0
85	14	15	10	2	0	0	\N	0	0
86	14	16	12	0	0	0	\N	0	0
87	14	19	11	0	0	0	\N	0	0
88	14	21	12	0	0	0	\N	0	0
89	15	3	0	0	0	12	\N	0	0
90	15	6	12	0	0	0	\N	0	0
91	15	7	12	0	0	0	\N	0	0
92	15	10	12	0	0	0	\N	0	0
93	15	11	12	0	0	0	\N	0	0
94	15	13	12	0	0	0	\N	0	0
95	15	14	10	0	0	0	\N	0	0
96	15	15	12	0	0	0	\N	0	0
97	15	16	12	0	0	0	\N	0	0
98	15	21	12	0	0	0	\N	0	0
99	16	3	48	0	12	24	\N	0	0
100	16	6	12	0	0	0	\N	0	0
101	16	7	12	0	0	0	\N	0	0
102	16	14	10	0	0	0	\N	0	0
103	16	15	12	0	0	0	\N	0	0
104	16	19	12	0	0	0	\N	0	0
105	16	21	12	0	0	0	\N	0	0
106	17	3	8	28	0	0	\N	0	0
107	17	6	6	0	0	0	\N	0	0
108	17	7	6	0	0	0	\N	0	0
109	17	14	10	0	0	0	\N	0	0
110	17	15	6	0	0	0	\N	0	0
111	17	16	4	0	0	0	\N	0	0
112	17	19	12	0	0	0	\N	0	0
113	17	21	6	0	0	0	\N	0	0
114	17	22	12	0	0	0	\N	0	0
115	18	3	59	1	0	24	\N	0	0
116	18	6	36	0	24	0	\N	0	0
117	18	7	12	0	0	0	\N	0	0
118	18	14	10	0	0	0	\N	0	0
119	18	15	12	0	0	0	\N	0	0
120	18	16	60	0	0	0	\N	0	0
121	18	19	12	0	0	0	\N	0	0
122	18	21	12	0	0	0	\N	0	0
123	19	3	84	0	0	0	\N	0	0
124	19	6	12	0	0	0	\N	0	0
125	19	7	12	0	0	0	\N	0	0
126	19	14	10	0	0	0	\N	0	0
127	19	15	12	0	0	0	\N	0	0
128	19	16	60	0	0	0	\N	0	0
129	19	21	12	0	0	0	\N	0	0
130	20	3	72	0	0	0	\N	0	0
131	20	6	12	0	0	0	\N	0	0
132	20	7	12	0	0	0	\N	0	0
133	20	14	10	0	0	0	\N	0	0
134	20	15	12	0	0	0	\N	0	0
135	20	21	12	0	0	0	\N	0	0
136	21	3	2	112	0	0	\N	0	0
137	21	6	6	0	0	0	\N	0	0
138	21	7	12	0	0	0	\N	0	0
139	21	14	10	0	0	0	\N	0	0
140	21	15	6	0	0	0	\N	0	0
141	21	21	6	0	0	0	\N	0	0
142	22	3	72	0	0	0	\N	0	0
143	22	6	12	0	0	0	\N	0	0
144	22	14	10	0	0	0	\N	0	0
145	22	15	1	0	0	0	\N	0	0
146	22	21	12	0	0	0	\N	0	0
147	23	3	36	0	0	0	\N	0	0
148	23	6	6	0	0	0	\N	0	0
149	23	14	10	0	0	0	\N	0	0
150	23	15	6	0	0	0	\N	0	0
151	23	21	6	0	0	0	\N	0	0
152	24	3	82	2	0	0	\N	0	0
153	24	6	12	0	0	0	\N	0	0
154	24	14	10	0	0	0	\N	0	0
155	24	15	12	0	0	0	\N	0	0
156	24	21	12	0	0	0	\N	0	0
157	25	3	60	0	0	0	\N	0	0
158	25	6	12	0	0	0	\N	0	0
159	25	14	10	0	0	0	\N	0	0
160	25	15	12	0	0	0	\N	0	0
161	25	21	12	0	0	0	\N	0	0
162	26	3	60	0	0	0	\N	0	0
163	26	6	12	0	0	0	\N	0	0
164	26	14	10	0	0	0	\N	0	0
165	26	15	12	0	0	0	\N	0	0
166	27	3	60	0	0	0	\N	0	0
167	27	6	12	0	0	0	\N	0	0
168	27	14	10	0	0	0	\N	0	0
169	27	15	12	0	0	0	\N	0	0
170	27	21	12	0	0	0	\N	0	0
171	28	3	48	0	0	0	\N	0	0
172	28	6	12	0	0	0	\N	0	0
173	28	14	10	0	0	0	\N	0	0
174	28	15	12	0	0	0	\N	0	0
175	28	21	12	0	0	0	\N	0	0
176	29	3	24	0	0	0	\N	0	0
177	29	6	6	0	0	0	\N	0	0
178	29	14	10	0	0	0	\N	0	0
179	29	15	6	0	0	0	\N	0	0
180	30	3	48	0	0	0	\N	0	0
181	30	6	12	0	0	0	\N	0	0
182	30	14	10	0	0	0	\N	0	0
183	30	15	12	0	0	0	\N	0	0
184	31	3	6	0	0	0	\N	0	0
185	31	6	12	0	0	0	\N	0	0
186	31	11	12	0	0	0	\N	0	0
187	31	14	10	0	0	0	\N	0	0
188	31	15	12	0	0	0	\N	0	0
189	31	21	12	0	0	0	\N	0	0
190	31	22	6	0	0	0	\N	0	0
191	32	3	456	12	18	6	\N	0	0
192	32	5	18	0	18	0	\N	0	0
193	32	6	0	3	0	0	\N	0	0
194	32	7	5	1	0	0	\N	0	0
195	32	8	3	0	0	0	\N	0	0
196	32	10	1	2	0	0	\N	0	0
197	32	14	10	0	0	0	\N	0	0
198	32	15	5	1	0	0	\N	0	0
199	32	19	6	0	0	0	\N	0	0
200	32	21	3	0	0	0	\N	0	0
201	32	22	6	0	0	0	\N	0	0
202	33	3	448	80	18	0	\N	0	0
203	33	5	18	0	18	0	\N	0	0
204	33	6	3	0	0	0	\N	0	0
205	33	7	6	0	0	0	\N	0	0
206	33	8	1	2	0	0	\N	0	0
207	33	10	3	0	0	0	\N	0	0
208	33	14	10	0	0	0	\N	0	0
209	33	15	5	1	0	0	\N	0	0
210	33	19	6	0	0	0	\N	0	0
211	33	21	3	0	0	0	\N	0	0
212	33	22	6	0	0	0	\N	0	0
213	34	3	11	391	0	0	\N	0	0
214	34	6	3	0	0	0	\N	0	0
215	34	7	6	0	0	0	\N	0	0
216	34	8	3	0	0	0	\N	0	0
217	34	14	10	0	0	0	\N	0	0
218	34	15	6	0	0	0	\N	0	0
219	34	21	2	0	0	0	\N	0	0
220	34	22	3	0	0	0	\N	0	0
221	35	3	12	0	0	0	\N	0	0
222	35	6	3	0	0	0	\N	0	0
223	35	7	6	0	0	0	\N	0	0
224	35	14	10	0	0	0	\N	0	0
225	35	15	6	0	0	0	\N	0	0
226	35	21	3	0	0	0	\N	0	0
227	36	3	101	391	0	0	\N	0	0
228	36	6	3	0	0	0	\N	0	0
229	36	7	6	0	0	0	\N	0	0
230	36	14	10	0	0	0	\N	0	0
231	36	15	6	0	0	0	\N	0	0
232	36	21	2	0	0	0	\N	0	0
233	37	3	48	0	0	0	\N	0	0
234	37	6	3	0	0	0	\N	0	0
235	37	7	18	0	0	0	\N	0	0
236	37	14	10	0	0	0	\N	0	0
237	37	15	6	0	0	0	\N	0	0
238	37	21	2	0	0	0	\N	0	0
239	38	3	72	0	0	0	\N	0	0
240	38	6	3	0	0	0	\N	0	0
241	38	7	18	0	0	0	\N	0	0
242	38	14	10	0	0	0	\N	0	0
243	38	15	6	0	0	0	\N	0	0
244	38	21	3	0	0	0	\N	0	0
245	39	3	384	0	0	0	\N	0	0
246	39	6	3	0	0	0	\N	0	0
247	39	7	6	0	0	0	\N	0	0
248	39	14	10	0	0	0	\N	0	0
249	39	15	6	0	0	0	\N	0	0
250	39	19	24	0	0	0	\N	0	0
251	39	21	3	0	0	0	\N	0	0
252	40	3	72	0	0	0	\N	0	0
253	40	6	3	0	0	0	\N	0	0
254	40	7	6	0	0	0	\N	0	0
255	40	14	10	0	0	0	\N	0	0
256	40	15	6	0	0	0	\N	0	0
257	41	3	408	0	0	0	\N	0	0
258	41	6	3	0	0	0	\N	0	0
259	41	7	6	0	0	0	\N	0	0
260	41	14	10	0	0	0	\N	0	0
261	41	15	6	0	0	0	\N	0	0
262	42	3	72	0	0	0	\N	0	0
263	42	6	3	0	0	0	\N	0	0
264	42	14	10	0	0	0	\N	0	0
265	42	15	6	0	0	0	\N	0	0
266	46	3	0	1000	0	0	\N	0	0
267	46	6	3	0	0	0	\N	0	0
268	46	14	10	0	0	0	\N	0	0
269	46	15	10	0	0	0	\N	0	0
270	46	22	3	0	0	0	\N	0	0
271	50	3	56	27	1	18	\N	0	0
272	50	6	3	0	0	0	\N	0	0
273	50	13	17	0	17	0	\N	0	0
274	50	14	5	0	0	0	\N	0	0
275	50	15	3	0	0	0	\N	0	0
276	51	3	61	22	1	18	\N	0	0
277	51	6	3	0	0	0	\N	0	0
278	51	13	17	0	17	0	\N	0	0
279	51	14	5	0	0	0	\N	0	0
280	51	15	3	0	0	0	\N	0	0
281	51	18	5	0	0	0	\N	0	0
282	52	3	94	0	0	0	\N	0	0
283	52	6	15	0	6	0	\N	0	0
284	52	14	5	0	0	0	\N	0	0
285	52	15	3	0	0	0	\N	0	0
286	53	3	91	0	1	10	\N	0	0
287	53	6	21	0	9	0	\N	0	0
288	53	14	3	0	0	0	\N	0	0
289	53	15	3	0	0	0	\N	0	0
290	54	3	100	0	0	0	\N	0	0
291	54	6	3	0	0	0	\N	0	0
292	54	14	3	0	0	0	\N	0	0
293	54	15	3	0	0	0	\N	0	0
294	55	3	12	0	0	0	\N	0	0
295	55	6	3	0	0	0	\N	0	0
296	55	15	3	0	0	0	\N	0	0
297	56	3	100	0	0	0	\N	0	0
298	56	6	3	0	0	0	\N	0	0
299	56	15	3	0	0	0	\N	0	0
300	56	21	10	0	0	0	\N	0	0
301	57	3	360	0	0	40	\N	0	0
302	57	5	40	0	40	0	\N	0	0
303	57	6	3	0	0	0	\N	0	0
304	57	7	12	0	0	0	\N	0	0
305	57	14	10	0	0	0	\N	0	0
306	57	15	3	0	0	0	\N	0	0
307	57	21	10	0	0	0	\N	0	0
308	58	3	400	0	0	0	\N	0	0
309	58	6	3	0	0	0	\N	0	0
310	58	14	10	0	0	0	\N	0	0
311	58	15	12	0	0	0	\N	0	0
312	58	21	10	0	0	0	\N	0	0
313	59	3	400	0	0	0	\N	0	0
314	59	6	3	0	0	0	\N	0	0
315	59	15	12	0	0	0	\N	0	0
316	59	21	10	0	0	0	\N	0	0
317	60	3	360	0	0	40	\N	0	0
318	60	5	40	0	40	0	\N	0	0
319	60	6	3	0	0	0	\N	0	0
320	60	7	12	0	0	0	\N	0	0
321	60	15	12	0	0	0	\N	0	0
322	60	21	10	0	0	0	\N	0	0
323	61	3	400	0	10	10	\N	0	0
324	61	6	3	0	0	0	\N	0	0
325	61	7	12	0	0	0	\N	0	0
326	61	15	12	0	0	0	\N	0	0
327	61	21	10	0	0	0	\N	0	0
328	62	3	10	0	0	0	\N	0	0
329	62	6	3	0	0	0	\N	0	0
330	62	15	12	0	0	0	\N	0	0
331	63	3	12	0	0	0	\N	0	0
332	63	6	3	0	0	0	\N	0	0
333	63	10	3	0	0	0	\N	0	0
334	63	15	3	0	0	0	\N	0	0
335	63	21	3	0	0	0	\N	0	0
336	64	6	3	0	0	0	\N	0	0
337	64	10	3	0	0	0	\N	0	0
338	64	14	6	0	0	0	\N	0	0
339	64	15	3	0	0	0	\N	0	0
340	64	21	3	0	0	0	\N	0	0
341	65	6	3	0	0	0	\N	0	0
342	65	10	3	0	0	0	\N	0	0
343	65	11	12	0	0	0	\N	0	0
344	65	15	3	0	0	0	\N	0	0
345	65	21	3	0	0	0	\N	0	0
346	66	6	3	0	0	0	\N	0	0
347	66	10	3	0	0	0	\N	0	0
348	66	15	3	0	0	0	\N	0	0
349	66	21	3	0	0	0	\N	0	0
350	67	6	3	0	0	0	\N	0	0
351	67	10	3	0	0	0	\N	0	0
352	67	15	3	0	0	0	\N	0	0
353	67	21	3	0	0	0	\N	0	0
354	68	6	3	0	0	0	\N	0	0
355	68	10	3	0	0	0	\N	0	0
356	68	15	3	0	0	0	\N	0	0
357	68	21	3	0	0	0	\N	0	0
358	69	6	3	0	0	0	\N	0	0
359	69	15	3	0	0	0	\N	0	0
360	69	21	3	0	0	0	\N	0	0
361	70	6	3	0	0	0	\N	0	0
362	70	10	3	0	0	0	\N	0	0
363	70	15	3	0	0	0	\N	0	0
364	70	21	3	0	0	0	\N	0	0
365	71	3	1150	2	24	72	\N	0	0
366	71	5	24	0	24	0	\N	0	0
367	71	6	12	0	0	0	\N	0	0
368	71	15	3	0	0	0	\N	0	0
369	71	21	180	0	0	0	\N	0	0
370	72	3	1182	0	18	36	\N	0	0
371	72	5	12	0	12	0	\N	0	0
372	72	6	12	0	0	0	\N	0	0
373	72	15	0	1	0	0	\N	0	0
374	72	21	180	0	0	0	\N	0	0
375	73	3	1182	12	0	6	\N	0	0
376	73	6	12	0	0	0	\N	0	0
377	73	15	11	1	0	0	\N	0	0
378	73	21	84	0	0	0	\N	0	0
379	74	3	1440	0	0	0	\N	0	0
380	74	6	24	0	0	0	\N	0	0
381	74	15	6	0	0	0	\N	0	0
382	75	3	1192	74	0	0	\N	0	0
383	75	5	225	0	0	0	\N	0	0
384	75	6	12	0	0	0	\N	0	0
385	75	7	60	0	0	0	\N	0	0
386	75	10	49	11	0	0	\N	0	0
387	75	15	24	0	0	0	\N	0	0
388	76	3	2415	78	0	0	\N	0	0
389	76	5	245	0	0	0	\N	0	0
390	76	6	24	0	0	0	\N	0	0
391	76	7	72	0	0	0	\N	0	0
392	76	10	0	120	0	0	\N	0	0
393	76	15	47	1	0	0	\N	0	0
394	77	3	2566	2	48	96	\N	0	0
395	77	5	1076	0	48	0	\N	0	0
396	77	6	24	0	0	0	\N	0	0
397	77	7	72	0	0	0	\N	0	0
398	77	10	36	84	0	0	\N	0	0
399	77	15	48	0	0	0	\N	0	0
400	78	3	109	22	0	0	\N	0	0
401	78	6	3	0	0	0	\N	0	0
402	88	3	961	25	1	15	\N	0	0
403	88	5	5	0	5	0	\N	0	0
404	88	6	7	2	9	0	\N	0	0
405	89	3	200	240	0	0	\N	0	0
406	89	6	0	40	0	0	\N	0	0
407	89	8	360	40	0	0	\N	0	0
408	89	11	40	0	0	0	\N	0	0
409	89	15	40	0	0	0	\N	0	0
410	89	18	40	0	0	0	\N	0	0
411	89	19	1	11	0	0	\N	0	0
412	89	21	40	0	0	0	\N	0	0
413	90	3	163	221	0	0	\N	0	0
414	90	6	12	0	0	0	\N	0	0
415	90	11	24	0	0	0	\N	0	0
416	90	15	23	1	0	0	\N	0	0
417	91	3	117	1	0	0	\N	0	0
418	91	5	6	0	6	0	\N	0	0
419	91	6	7	3	0	0	\N	0	0
420	91	7	6	0	0	0	\N	0	0
421	91	10	40	0	0	0	\N	0	0
422	91	11	138	0	0	0	\N	0	0
423	91	12	12	0	0	0	\N	0	0
424	91	13	40	0	0	0	\N	0	0
425	91	14	10	0	0	0	\N	0	0
426	91	15	10	0	0	0	\N	0	0
427	91	18	10	0	0	0	\N	0	0
428	91	22	12	0	0	0	\N	0	0
429	92	3	300	0	12	24	\N	0	0
430	92	6	36	0	12	0	\N	0	0
431	92	8	24	0	0	0	\N	0	0
432	93	6	12	0	0	0	\N	0	0
433	93	8	120	0	0	0	\N	0	0
434	93	11	10	0	0	0	\N	0	0
435	94	3	58	1	0	12	\N	0	0
436	94	6	8	0	0	0	\N	0	0
437	94	7	6	0	0	0	\N	0	0
438	94	10	6	0	0	0	\N	0	0
439	94	11	306	0	0	0	\N	0	0
440	94	14	30	0	0	0	\N	0	0
441	94	15	20	0	0	0	\N	0	0
442	94	19	10	0	0	0	\N	0	0
443	94	21	60	0	0	0	\N	0	0
444	94	22	12	0	0	0	\N	0	0
\.


--
-- Data for Name: stok_setting_cabang; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stok_setting_cabang (id, id_barang, id_cabang, minimum_stock, safety_stock, target_days_stock, lead_time_days, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: supplier; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supplier (id_supplier, nama_supplier, alamat, telepon, email, bank, no_rek_bank, hari_kunjungan, periode_kunjungan, hutang, status_pajak, npwp, keterangan_1, keterangan_2) FROM stdin;
1	PT. MAYORA	JEMBER	082337522221	khoirul@yjsad.com	mandiri	20145021354031	Senin	Mingguan	0	PKP	46478974146546		
2	PT Unilever Indonesia	Tangerang	021-654321	contact@unilever.com	BCA	0987654321	Rabu	Mingguan	0	PKP	\N	\N	\N
3	PT. TEKAD KARYA PUTERA (FOOD)	JEMBER	372498324325	DSDSAASDA@GMAIL.COM	BCA	543578439546	Selasa	Mingguan	1715083	PKP	3232342435456	\N	\N
4	PT. EKA ARTHA BUANA (UNILEVER)	JEMBER	372498324326	DDSADDSASAD@GMAIL.COM	MANDIRI	785483543545	Sabtu	Setengah Bulanan	4101476	PKP	4534565465773	\N	\N
5	PT. NIAGA NUSA ABADI	JEMBER	372498324327	DEWRGRGG@GMAIL.COM	CIMB NIAGA	1027388647544	Rabu	Mingguan	1032490	PKP	5836788496090	\N	\N
6	PT. TEMPO MARINA	JEMBER	372498324328	TTRYTYT@GMAIL.COM	BCA	1269293751543	Selasa	Mingguan	0	PKP	7139011526407	\N	\N
7	PT. SUPRALITA JOHNSONS	JEMBER	372498324329	FEGFHGFH@GMAIL.COM	MANDIRI	1511198855542	Rabu	Mingguan	0	PKP	8441234556724	\N	\N
8	SURABAYA	SURABAYA	372498324330	GTHTYYJ@GMAIL.COM	CIMB NIAGA	1753103959541			0	NON-PKP		\N	\N
9	SURABAYA HARTA INDO JAYA	SURABAYA	372498324331	FFREYTRYT@GMAIL.COM	BCA	1995009063540			0	PKP	45455645465546654	\N	\N
10	PT. SUMBER BARU N PIATTOS	JEMBER	372498324332	RYYTUUIUL@GMAIL.COM	MANDIRI	2236914167539	Jumat	Mingguan	0	PKP	12347903647675	\N	\N
11	PT. INDOMARCO AIR CLUB	JEMBER	372498324333	HJUYTYH@GMAIL.COM	CIMB NIAGA	2478819271538	Senin	Mingguan	2719795	PKP	13650126677992	\N	\N
12	PT. NUSA INDAH	JEMBER	0896521201525	NUSAINDAH@GMAIL.COM	BCA	8651421156	Kamis	Setengah Bulanan	542184	PKP	632156454564564456	\N	\N
\.


--
-- Data for Name: tipe_akun; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipe_akun (id, nama, posisi_saldo_normal) FROM stdin;
1	Aset	DEBIT
2	Liabilitas	KREDIT
3	Ekuitas	KREDIT
4	Pendapatan	KREDIT
5	Harga Pokok Penjualan	DEBIT
6	Beban Operasional	DEBIT
8	Pendapatan & Beban Lain-lain	DEBIT
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, kode_user, nama_user, tempat_lahir, tanggal_lahir, no_ktp, pendidikan_terakhir, riwayat_lembaga, riwayat_pekerjaan, status, no_hp, foto, password, id_jabatan, id_cabang, tanggal_masuk, refresh_token, refresh_token_expires, updated_at) FROM stdin;
4	admin	ACH FAWAID BAQIR		0000-00-00					Kontrak	082317356095	data:image/jpeg;base64,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	$2y$10$mUnYbb9a3POrZb65qGdbteoaKUz4c7O0yyOIiwt4gG0GdZCgZbyyy	1	3	2004-05-20	\N	\N	2025-10-16 10:28:31
8	it	it al mubarok		0000-00-00					Kontrak	082512545022323	\N	$2y$10$N6mrLZFTZomP7C2Urt.41eCCTgB46e4DHs.ZqyuctoZ6z9KtyImPC	1	3	2002-01-01	\N	\N	2025-10-18 01:26:40
9	kasir	Kasir Al Mubarok	\N	\N	\N	\N	\N	\N	Kontrak	082222545152	\N	$2b$10$5g53M55YSddHvpqXfmMJEu9s640ANTYosxQVx20ZAAswg0ChquM2O	7	2	2000-02-02	\N	\N	2026-08-11 14:36:40
28	HRD	HRD Al Mubarok	\N	\N	\N	\N	\N	\N	Abdi Tetap	08525023232	\N	$2b$10$EYSroDhV7E.A/52eW9lBjOLYvh4LGR0dXP3GH/QZSDAL/1ik3SDxC	3	3	2025-02-02	\N	\N	2026-08-11 14:36:40
58	K2006001	RAHMADI		0000-00-00					Abdi Tetap	8455	\N	$2y$10$V3YknftctE9fnxYO2v9/EOVLnNSn1R2YvGsa8ZhRrnQOeMQ5ClKjS	11	3	2006-01-01	\N	\N	2025-10-17 09:47:04
59	K2011001	AHMAD FAUZI		2011-01-01					Abdi Tetap	8456	\N	$2y$10$6xeZ/q9FfyHl.SgsElJDrOwp.RaQ3n23KEZqzbhnIHbrhBdwKWZIC	11	3	2025-10-09	\N	\N	2025-10-17 09:46:53
60	13	DIDIK MULYONO	\N	\N	\N	\N	\N	\N		8457	\N	$2y$10$.h9rCW7d6GJje4EawCzQQefX.xsL/bo055jWRD.ZkMmHYvd0wT28O	\N	\N	\N	\N	\N	2025-08-27 07:10:07
61	K2012001	AHMAD FAISOL	\N	0000-00-00	\N	\N	\N	\N	Abdi Tetap	8458	\N	$2b$10$/10cw8ia05kgbkU.S4783O4Aqhpn/1.l5wVGB8EAetjvIfFbcKaZa	11	3	2012-01-01	\N	\N	2026-06-04T23:38:16.409Z
62	15	KHAIRUL WARISIN	\N	\N	\N	\N	\N	\N		8459	\N	$2y$10$xYRHjF3hnl5Gqc1L6qGLuO.rokT/82HxhDMLer.CTQ3P.U8/ytE2a	\N	\N	\N	\N	\N	2025-08-27 07:10:07
63	16	DODIK SUGIHARTO	\N	\N	\N	\N	\N	\N		8460	\N	$2y$10$33hVb6jOV1JmVxuRqpgWH.leNWA/JL3r1kBWoqCD8V5kky2BZRgzW	\N	\N	\N	\N	\N	2025-08-27 07:10:07
64	17	RIFAN ZUHRI	\N	\N	\N	\N	\N	\N		8461	\N	$2y$10$aWf9ROD.Ul26ntuWKd5jVeOAD1SHiRdjkOpvbbVW0BAamWmfSKxKG	\N	\N	\N	\N	\N	2025-08-27 07:10:07
65	K2016002	AINUL YAKIN		0000-00-00					Kontrak	8462	\N	$2y$10$sCi8gEYoFpsuVtao5zRPHej8dMF6G4MKXICE/MrO5rBvQyF0xTmWS	10	3	2016-10-01	\N	\N	2025-10-21 08:05:26
66	19	M. YASIR ABDUL WAHID	\N	\N	\N	\N	\N	\N		8463	\N	$2y$10$qjhXZXJpAnLWZq30BphUK.YQBaeEsxXK1HVI5AMY1614v9Og2H3WS	\N	\N	\N	\N	\N	2025-08-27 07:10:08
67	20	MISBAHUL MUNIR	\N	\N	\N	\N	\N	\N		8464	\N	$2y$10$gBB83VYG47O64BUNKJvU5Ouhci5P/spy0U.3.hM3VKp.U2IQ296Le	\N	\N	\N	\N	\N	2025-08-27 07:10:08
68	21	M. AMIRULLAH	\N	\N	\N	\N	\N	\N		8465	\N	$2y$10$ryHs95cBzwkLA/lrnl7h/.ZER8EeesDuGUM214FMj41Qebw5aFyv.	\N	\N	\N	\N	\N	2025-08-27 07:10:08
69	K2017003	MOH. WAKIL		0000-00-00					Kontrak	8466	\N	$2y$10$d78SEXjj9I6HdfgBomr2/OT6ZG/Ttk3.ur85RNZ2lNPjZxScnEg8q	5	10	2017-10-01	\N	\N	2025-10-18 01:19:10
70	23	MIFTAHUL HUDA	\N	\N	\N	\N	\N	\N		8467	\N	$2y$10$qqGH.kAJWn9VJgGK4npCnObTWPSurUgLyE1wyQzNv8596JQN0uAtG	\N	\N	\N	\N	\N	2025-08-27 07:10:09
71	K2017005	M. ANSHORI		0000-00-00					Kontrak	8468	\N	$2y$10$ySa1enK9VYzUO/WA6z5rIOxTr8jli4jz0wEMIIeBlkOdF4B.HV2fC	5	8	2017-10-01	\N	\N	2025-10-18 01:17:28
72	K2017011	MOH. SAMSUL ARIFIN		0000-00-00					Kontrak	8469	\N	$2y$10$5HhJ2MkejaBgduvRvE6O1uEBGPThdqVa4OJnzONBf/mxhm/bt2wmi	10	3	2017-10-01	\N	\N	2025-10-21 08:04:37
73	K2018002	MUHAMMAD HABIBI		0000-00-00					Abdi Tetap	8470	\N	$2y$10$/gZ1HbKyDeeNohRT9GzSsu1Uu5WZ/avjuLKLR9LlqQszq49sy3VCa	11	3	2018-10-01	\N	\N	2025-10-18 01:09:00
74	K2018004	SAIFUL ARIFIN		0000-00-00					Kontrak	8471	\N	$2y$10$7vzmik4dq4BO26p/WYMnAOuhqXYY3S4yuuC2VwMm3hrv.rZXN4MfS	5	11	2018-10-01	\N	\N	2025-10-18 01:21:19
75	K2018006	UMARUL FARUK		0000-00-00					Kontrak	8472	\N	$2y$10$XxYgv7p8fapLHM.e6R.ZiOT0NCkDnHKBWFcLt5zfp7mHmYbWtwd3W	5	19	2018-10-01	\N	\N	2025-10-18 01:29:23
76	K2018008	MUHAMMAD ANDRIK AFANDI		0000-00-00					Kontrak	8473	\N	$2y$10$DMBOg9IlEYjgzr7i24DbpOmMmJq57rVSdzyQ9fi/Gn.n5RcLWgfiy	5	15	2018-10-01	\N	\N	2025-10-18 01:25:46
77	K2018010	MUHAMMAD SULTON		0000-00-00					Kontrak	8474	\N	$2y$10$PhLz0g6AzSyBn/Lous04U.40F4WmzN9GnYiQ/va71Q1Z1wskxzRza	5	13	2018-10-01	\N	\N	2025-10-21 08:00:45
78	K2018013	MUHAMMAD TAUFIQ		0000-00-00					Kontrak	8475	\N	$2y$10$sVhaHyAtt1MM1FdqRpmkXuCXl5gkhwDUi00rOMdVtDrHe.IkeXsIu	5	7	2018-10-01	\N	\N	2025-10-18 01:15:39
79	K2019002	MUHAMMAD SOFI		0000-00-00					Kontrak	8476	\N	$2y$10$AiDyH/97OxqJDL5IHP04Y..JhEoNo2D0yZP4IMoZXs8i2Z0p4e0TO	5	9	2019-10-01	\N	\N	2025-10-18 01:19:25
80	K2019003	MUHAMMAD FIRMAN		0000-00-00					Kontrak	8477	\N	$2y$10$uW1Jviby/iKd3oqX2.Yp/uZLIlH.qrmKpQ8OaxYzexvmEgL1Wa8cq	5	6	2019-10-01	\N	\N	2025-10-18 01:15:00
81	34	HATIP	\N	\N	\N	\N	\N	\N		8478	\N	$2y$10$bUARqADw2DNNTOw3/gHnE.ftSrhjuiqJFTihc6dGmZ6nV8LNcSUD.	\N	\N	\N	\N	\N	2025-08-27 07:10:11
82	K2019011	AFIFUDDIN		0000-00-00					Kontrak	8479	\N	$2y$10$agZU8lH.m649f.j9ubeOEeg6sHI2I9dnmkcpK/LGVXbce/2zMLVRC	5	5	2019-10-01	\N	\N	2025-10-18 01:14:14
83	36	AHMAD ZAINI	\N	\N	\N	\N	\N	\N		8480	\N	$2y$10$hlW8HxPJf5XO5qXG7H5Fle7phBGvZpf3/fE3iVo/nVEILedCz0Hu6	\N	\N	\N	\N	\N	2025-08-27 07:10:11
84	37	MISBAH PAHOLASAN	\N	\N	\N	\N	\N	\N		8481	\N	$2y$10$h2B8us2fiLVzphfLP.bnj.15Xt0hlPGVJzN9V36VYOW11FtNWnbc6	\N	\N	\N	\N	\N	2025-08-27 07:10:11
85	K2019020	SULAIMAN		0000-00-00					Kontrak	8482	\N	$2y$10$lPVmZ4ywzFxeBzT/OtcVUeIj9It0minbmVznS0UWzXU492ad/s0cK	5	22	2019-10-01	\N	\N	2025-10-18 01:30:57
86	39	AHMAD AINUL YAKIN	\N	\N	\N	\N	\N	\N		8483	\N	$2y$10$yYagLtp55O0e0SGlpxP2yeuzigZ8bpR2yVX4hV9SWfBM2XkPT1E9i	\N	\N	\N	\N	\N	2025-08-27 07:10:12
87	40	MUHAMMAD ROKI BAHTIAR	\N	\N	\N	\N	\N	\N		8484	\N	$2y$10$EofAbDLWMlQWxPzE9YzPAOl3wYn7LczWN23aqRYIpudLx0nDjs/yq	\N	\N	\N	\N	\N	2025-08-27 07:10:12
88	41	M. FIKROM	\N	\N	\N	\N	\N	\N		8485	\N	$2y$10$lEPqVLbaqfHm2bozdli79uM5KWaqkGi.YzU6ST.9KG2lvHIsR6s3O	\N	\N	\N	\N	\N	2025-08-27 07:10:12
89	K2020009	HASIFUL KUDUS		0000-00-00					Kontrak	8486	\N	$2y$10$8wLhXGSjhAMqC1M081GpsO2a9L1oEy2rcWbS/IikiLhceiGnMxUgO	5	21	2020-10-01	\N	\N	2025-10-18 01:30:19
90	43	MUHAMMAD UMAM	\N	\N	\N	\N	\N	\N		8487	\N	$2y$10$8fJwsxg5RcX0IjZh52dJ/.P7NSguKBHQB8rD5sRpSBP/fwgVCpTpi	\N	\N	\N	\N	\N	2025-08-27 07:10:12
91	K2020013	ZAINUL HASAN		0000-00-00					Abdi Tetap	8488	\N	$2y$10$JizDR4a1wOaLgnhOHI43KOOSBgbv2xVZvCcuJv6FBZ.KwydW.4gvu	11	3	2020-10-01	\N	\N	2025-10-18 01:08:08
92	45	FADHAL RAMADHAN	\N	\N	\N	\N	\N	\N		8489	\N	$2y$10$OUIB6/1eoDxucHiFo9wyjutBXg5GQm56XyZnpboBibQOWA5gGGB2W	\N	\N	\N	\N	\N	2025-08-27 07:10:13
93	46	JUNAIDI KOMARUL ZAMAN	\N	\N	\N	\N	\N	\N		8490	\N	$2y$10$1IkM6Jqt.NgWy0Y7b7WCgep.FHholb38EWM3wqq6JY4AAGq0Hdcpy	\N	\N	\N	\N	\N	2025-08-27 07:10:13
94	47	NOFRI	\N	\N	\N	\N	\N	\N		8491	\N	$2y$10$ruGnBXtk85UQ7R2dahoQ8.571T29ABwraEZR37wvYXr8kH22Zahnm	\N	\N	\N	\N	\N	2025-08-27 07:10:13
95	48	MUHAMMAD KAMILUL UMAM	\N	\N	\N	\N	\N	\N		8492	\N	$2y$10$6Z/OZbbtQVsAhwIU3pmiO.XDegEc6qy1dxhqy2vg3dlQStr0Ka7Xm	\N	\N	\N	\N	\N	2025-08-27 07:10:14
96	49	KHOIRUL FAIZIN	\N	\N	\N	\N	\N	\N		8493	\N	$2y$10$AufRmgpGm0hUh8Ytmn/4l.7dtPrzilyAK9UmpOgINEpA9JZOonThG	\N	\N	\N	\N	\N	2025-08-27 07:10:14
97	K2020022	MUHAMMAD NADZIR		0000-00-00					Kontrak	8494	\N	$2y$10$OPubP3PVQYdidTJRtobupOi2ligywfPshWz/Wh5MnMo8iPPwPQxNa	5	14	2020-10-01	\N	\N	2025-10-18 01:26:02
98	K2020024	SAIDI		0000-00-00					Kontrak	8495	\N	$2y$10$uIvlx0BlAh.pAkeM21jNe.IZ1zF.tNKNUngHQIJbfhLr28i/AvbCa	5	18	2020-10-01	\N	\N	2025-10-18 01:28:29
99	52	IMAM FATHUR R	\N	\N	\N	\N	\N	\N		8496	\N	$2y$10$zhBOV1r1PdtvUZPHkUIPCOTDMa5Rq7SsgYiotLCwtw7c7233cL756	\N	\N	\N	\N	\N	2025-08-27 07:10:14
100	53	FAQIHURROHMAN	\N	\N	\N	\N	\N	\N		8497	\N	$2y$10$MLTbuuYs2H2B14b90keJ1u07I1xQqn4GVlH58aA9lg0824I5WBYI2	\N	\N	\N	\N	\N	2025-08-27 07:10:15
101	54	MOH. IMRON ROSIDI	\N	\N	\N	\N	\N	\N		8498	\N	$2y$10$1/AMQemBuKxG3jCY0ogkOepkZRNQRVTTlMBZy/RQWvPReJ.nrcQGi	\N	\N	\N	\N	\N	2025-08-27 07:10:15
102	K2021002	SAIYID ABDULLAH ALI		0000-00-00					Kontrak	8499	\N	$2y$10$/O.Tlk/yeJM5R8BSQsuL4OC7DqiQbeEQarnUn7vP9vom47UMV19TC	5	12	2021-10-01	\N	\N	2025-10-18 01:26:15
103	56	RIFQON	\N	\N	\N	\N	\N	\N		8500	\N	$2y$10$3P7ZPdvkkuoi7ZxDW87TL.k/aGmccKIeSIjeoAIOjTjNYaH2xopYS	\N	\N	\N	\N	\N	2025-08-27 07:10:15
104	57	SUBHAN	\N	\N	\N	\N	\N	\N		8501	\N	$2y$10$eMQDLkuo/lPYByiHFIKhJee7Ef7V628EIR9EJ8VX7MMw/OXPaE8q.	\N	\N	\N	\N	\N	2025-08-27 07:10:15
105	58	MUHAMMAD IVAN ANSORI	\N	\N	\N	\N	\N	\N		8502	\N	$2y$10$mrRUovaLRY97CNNihgX/KeeyKMYHzyk50CWyYZGvqfC7alY3H0yZy	\N	\N	\N	\N	\N	2025-08-27 07:10:15
106	59	KHOIRUSIN	\N	\N	\N	\N	\N	\N		8503	\N	$2y$10$FpqnFfpfMEGJT2zQq38gdu51nuXu524b5VOiL2cooHQU/wzkhnIZa	\N	\N	\N	\N	\N	2025-08-27 07:10:16
107	60	FATHUL BARI	\N	\N	\N	\N	\N	\N		8504	\N	$2y$10$pz/3SUVDEuNyGaKw4oD9fe5JVY8n5MOjsLS6Iy7hilmxwlvZqv5Gq	\N	\N	\N	\N	\N	2025-08-27 07:10:16
108	K2021013	MIFTAHUS SURUR		0000-00-00					Kontrak	8505	\N	$2y$10$FcgTJdZbZTsDZpxunlkBzuKpuzdX5XQh4zoQy0juqKqhZMKEIP986	5	16	2021-10-01	\N	\N	2025-10-18 01:27:44
109	62	HALIS	\N	\N	\N	\N	\N	\N		8506	\N	$2y$10$WQR5.O9kh3BxXX5.OvUHfukiv58K4daoIypp7uTH0MnZN6VO4ATzu	\N	\N	\N	\N	\N	2025-08-27 07:10:16
110	63	SAID AQIL	\N	\N	\N	\N	\N	\N		8507	\N	$2y$10$XRt.kfGlsTr9IpkVTwrmtuPyWpc3UhSK6ssfRh7QcyaHW5CIAyHtC	\N	\N	\N	\N	\N	2025-08-27 07:10:16
111	64	MUHAMMAD ROCKY	\N	\N	\N	\N	\N	\N		8508	\N	$2y$10$M.aKOZxgWhkT47tV4/KGxe1mGT2Ecsxi3SF62nGVgRyH04gM8m/o2	\N	\N	\N	\N	\N	2025-08-27 07:10:17
112	65	MASHURI	\N	\N	\N	\N	\N	\N		8509	\N	$2y$10$9iM1MJgUQ6axjfRGB.AX7.JuEUP2SLBOpdA5YOUxm8Dt39ipmwKv.	\N	\N	\N	\N	\N	2025-08-27 07:10:17
113	66	MUHAMMAD SAIFUL RIZAL	\N	\N	\N	\N	\N	\N		8510	\N	$2y$10$9vbbjrSK1LIB9Zbei8F6cuBxGJDptunZnR1tcGWcC6NvihowSbNXO	\N	\N	\N	\N	\N	2025-08-27 07:10:17
114	67	ALI WAFI	\N	\N	\N	\N	\N	\N		8511	\N	$2y$10$6c2/aurCRfs25eVtV2I5HO83szWbgSX2e3vk6PtlpzVnfkVFcbndC	\N	\N	\N	\N	\N	2025-08-27 07:10:17
115	68	ALI MAKSUM	\N	\N	\N	\N	\N	\N		8512	\N	$2y$10$4x/E4ei2veYmIlh.HIqCdOFbW4NiFmNJ6WctVJeqvt.eVQ29Hxmi6	\N	\N	\N	\N	\N	2025-08-27 07:10:17
116	69	HARIS MUNANDAR	\N	\N	\N	\N	\N	\N		8513	\N	$2y$10$oFhJMNZzgTGzikViaCt8reJ93HHd9omaxdt22/eg0rpthAiXREDfC	\N	\N	\N	\N	\N	2025-08-27 07:10:18
117	70	IMAM AL FARISI	\N	\N	\N	\N	\N	\N		8514	\N	$2y$10$OYAG7ydEI1dz41IPPjx5S.3nJW2csSazVg2BHDgbcbosxrV4A5TNm	\N	\N	\N	\N	\N	2025-08-27 07:10:18
118	71	M. KHOIRUL ANAM	\N	\N	\N	\N	\N	\N		8515	\N	$2y$10$JiEeWMrv5VJNSfiPW6u6HOqhfhjDTk7ISYftpo6araFmd2Aid57Ye	\N	\N	\N	\N	\N	2025-08-27 07:10:18
119	72	M BAHRUDDIN	\N	\N	\N	\N	\N	\N		8516	\N	$2y$10$J5qBmBSpghDsa47PKXr3MejpBZ2SkCMdga8I5A5kA5m7xfvmZqagu	\N	\N	\N	\N	\N	2025-08-27 07:10:18
120	73	BUSTANUL ARIFIN	\N	\N	\N	\N	\N	\N		8517	\N	$2y$10$Fb8yY4jQeQcA8l5.KlRd6uCkhMoR93V6NDC5lU2QGZt1mlxSzmeHe	\N	\N	\N	\N	\N	2025-08-27 07:10:18
121	74	MUHAMMAD MUHYID	\N	\N	\N	\N	\N	\N		8518	\N	$2y$10$Q98cOi2RjCDRPbUHGLR1..lExKOOSzuN5lGItJttE0g8cEJmYKque	\N	\N	\N	\N	\N	2025-08-27 07:10:18
122	75	HAFIFUL FAWAID	\N	\N	\N	\N	\N	\N		8519	\N	$2y$10$JBG1GIJ/aH5UpPqZk8BzseYp5Imq1YqUwuimZ6aduXJpdSa/1yxNG	\N	\N	\N	\N	\N	2025-08-27 07:10:19
123	76	USTMAN QURTUBY	\N	\N	\N	\N	\N	\N		8520	\N	$2y$10$guspVVunHqlGkPfqRdF//ONVQNg95JW2oHgfdirQsQpl3R5S2DmK6	\N	\N	\N	\N	\N	2025-08-27 07:10:19
124	77	AHMAD DIAN PRIANTO	\N	\N	\N	\N	\N	\N		8521	\N	$2y$10$quNQpMyrS/IspRty8o8Bs.7VeErK/LdYenh4K7wQZtvGCF977IJ..	\N	\N	\N	\N	\N	2025-08-27 07:10:19
125	78	FAIZ ABDILAH	\N	\N	\N	\N	\N	\N		8522	\N	$2y$10$uC93b.v3M19L5mafhSBIDuy96n50lv5HUWdcExEHprQf7U.WYngjC	\N	\N	\N	\N	\N	2025-08-27 07:10:19
126	79	M. KHOIRUL UMAM	\N	\N	\N	\N	\N	\N		8523	\N	$2y$10$j5iBx5aZGTRKM8XEP28jReiLQuEZA23vYLRjiSoVpqDaa7XpiX.nq	\N	\N	\N	\N	\N	2025-08-27 07:10:19
127	80	M AFIFUDDIN	\N	\N	\N	\N	\N	\N		8524	\N	$2y$10$vihIAeSgZRpQAStA2MVCquQIKtbUdZqf/bsQkfjFJ4SFo0tzHLdL2	\N	\N	\N	\N	\N	2025-08-27 07:10:20
128	81	ROFIKUL ROHMAN	\N	\N	\N	\N	\N	\N		8525	\N	$2y$10$im5bBGKwDB8RKEQ.itpW2.ROiurgAY35GKbpDR3kEwh4VwwmNRHVe	\N	\N	\N	\N	\N	2025-08-27 07:10:20
129	82	ABU THORIQ ALAM ROHMATULLAH	\N	\N	\N	\N	\N	\N		8526	\N	$2y$10$uaLaUxSmcy6okH6ezNDgpOGrxHYe3S0f4W00BJBQ52m0Rfw0K/xKG	\N	\N	\N	\N	\N	2025-08-27 07:10:20
130	83	RODIFUL KHOIR	\N	\N	\N	\N	\N	\N		8527	\N	$2y$10$hdWDiQXJaka0zvj76oZvOejMwY4NofSQ6JQHo93XM8dpuKNXCNnmW	\N	\N	\N	\N	\N	2025-08-27 07:10:20
131	84	DENI FIRMANSYAH	\N	\N	\N	\N	\N	\N		8528	\N	$2y$10$l3kQwiazYyvnPbtavv6hau1ZhDuPVGJD9iYGC6leUN415Ncrdnm9q	\N	\N	\N	\N	\N	2025-08-27 07:10:20
132	85	MUHAMMAD WAKILLAH	\N	\N	\N	\N	\N	\N		8529	\N	$2y$10$bPtlnBbD1E3jnh5Yc5.xouW0YPxCScXdUjjYYN2RV/.ls4yaROs/6	\N	\N	\N	\N	\N	2025-08-27 07:10:21
133	86	WIRDAN AULIYAK RAHMAN	\N	\N	\N	\N	\N	\N		8530	\N	$2y$10$9ZMXXf3kHZw1LyK0GzsYN.vu6KUEBS5WBf3q6J7dpihFQtRJKnbyG	\N	\N	\N	\N	\N	2025-08-27 07:10:21
134	87	ABDUL KHOLIK	\N	\N	\N	\N	\N	\N		8531	\N	$2y$10$g4uUfS/jtp6gtfl80YTN6.YwSFY9..xZVdxmTQe5vibV/2zKJIyvy	6	9	\N	\N	\N	2026-06-05T01:02:23.559Z
135	88	ABDUL WAKIL	\N	\N	\N	\N	\N	\N		8532	\N	$2y$10$Y0fXxG1Tm/6XPw8CHc.aLOQcZpE/0yJ/c6Y.HO3z/TWtbD2.ZORf.	\N	\N	\N	\N	\N	2025-08-27 07:10:21
136	89	IMAM TURMIDI	\N	\N	\N	\N	\N	\N		8533	\N	$2y$10$mJUgYrpU8nsNKPobu.a5Cutsaq0mfN4u50AIfxRCxYIutNL2gsyfK	\N	\N	\N	\N	\N	2025-08-27 07:10:21
137	90	ACHMAD RIYAN HAKIKI	\N	\N	\N	\N	\N	\N		8534	\N	$2y$10$y4QJ0aseLOpb.FpYZiNJoOlBG3rMi1SBXoF0fAGtS0eIlJRzGo7se	\N	\N	\N	\N	\N	2025-08-27 07:10:21
138	91	RUSLI FERDIANSYAH	\N	\N	\N	\N	\N	\N		8535	\N	$2y$10$zcrjXrQ4uqhkGWpv8qqu/.xNPb1TZi/JmY1DTCLIHw25GEKEANSVm	\N	\N	\N	\N	\N	2025-08-27 07:10:22
139	92	MOHAMMAD DHOFIR	\N	\N	\N	\N	\N	\N		8536	\N	$2y$10$YtFkAPt9.FfWYHDAWVgcUe5FlIAICjoYTaIOts.ubfxAdJiXTvtwi	\N	\N	\N	\N	\N	2025-08-27 07:10:22
140	93	LUTFIANTO	\N	\N	\N	\N	\N	\N		8537	\N	$2y$10$.DV9zrK613tPIc7CSC1Sr.dYnri1L5pcNM34.tjxoN4A0p3I8sGv6	\N	\N	\N	\N	\N	2025-08-27 07:10:22
141	94	MUHAMMAD ALI MAGHROBI	\N	\N	\N	\N	\N	\N		8538	\N	$2y$10$20sLB7QWNeEJp1fLdXUolehwlGwz1IR21sXD91bwXORIGBvQbampm	\N	\N	\N	\N	\N	2025-08-27 07:10:22
142	95	MUHAMMAD RENDI	\N	\N	\N	\N	\N	\N		8539	\N	$2y$10$VO6CCY2uF81f61gv5VNh5ut6n8vYAUCfXZikAsUrp9hHJ0rDsRsn.	\N	\N	\N	\N	\N	2025-08-27 07:10:22
143	96	ALI HAFIDI	\N	\N	\N	\N	\N	\N		8540	\N	$2y$10$vKLQC.QhgJFRyZXTLHsAP.G4htEGTZuoLi10LGHnW17QAZ6fWih.i	\N	\N	\N	\N	\N	2025-08-27 07:10:23
144	97	MUHAMMAD SHOLEHUDDIN	\N	\N	\N	\N	\N	\N		8541	\N	$2y$10$jytGy3AUAdITUdRnsSkx..0TehYXWbnBS3SU0ZG1wDdCUSn.iXVfK	\N	\N	\N	\N	\N	2025-08-27 07:10:23
145	98	NADIA ATIQOTUL M	\N	\N	\N	\N	\N	\N		8542	\N	$2y$10$cLM94M3duZgPB5nIe53/veUwg10aozVdGMrJWc0Pi7aBqX7pgp1yq	\N	\N	\N	\N	\N	2025-08-27 07:10:23
146	99	ST.INALATUL ALJINANI	\N	\N	\N	\N	\N	\N		8543	\N	$2y$10$q8bHRR7V02d/DFYBL0GmFOsqxu9A1eD6.WyxaNNHQhdvGUhLgJjAa	\N	\N	\N	\N	\N	2025-08-27 07:10:23
147	100	ATIYATUL KAMILA	\N	\N	\N	\N	\N	\N		8544	\N	$2y$10$Odt6L0xwbY.YT9XODblMbO8zNTgTC2j3Pcu2Ht08RB8Y/tQd7KQbu	\N	\N	\N	\N	\N	2025-08-27 07:10:23
148	101	WILDATUL HASANAH	\N	\N	\N	\N	\N	\N		8545	\N	$2y$10$cco1KJ/6k/aYkJDy7H.1u..6VeHnZJ5.GwKbCAoZCemKiGwMEZKtu	\N	\N	\N	\N	\N	2025-08-27 07:10:23
149	102	AHMAD BAIHAKKI	\N	\N	\N	\N	\N	\N		8546	\N	$2y$10$RZ309ypYtJ1rCLGjQcycmOBgIkxdxafmYnm/JHYypgGkJOlYotXka	\N	\N	\N	\N	\N	2025-08-27 07:10:24
150	103	ABDULLAH AUVAL MAROM	\N	\N	\N	\N	\N	\N		8547	\N	$2y$10$ExIWANY9Vt05utb5yp5WjuKSAvM.cCbk.F3U6fejHnsCFDU1f.W5O	7	16	\N	\N	\N	2026-06-05T01:02:37.705Z
151	104	M. ZAINUL ARIFIN	\N	\N	\N	\N	\N	\N		8548	\N	$2y$10$SGj2YjMwQ4WIYg8C0D4nReQAY4/8Dsktwzgjr6o.TzKkSuVXLpAfu	\N	\N	\N	\N	\N	2025-08-27 07:10:24
152	105	IBNU RAMADANI	\N	\N	\N	\N	\N	\N		8549	\N	$2y$10$c0YutLl9TrYGq5gzn1FG8e1pv7WNiBvVTHfuijAG2ENkd9Rtqmr5i	\N	\N	\N	\N	\N	2025-08-27 07:10:24
153	106	HANDIKA	\N	\N	\N	\N	\N	\N		8550	\N	$2y$10$YpzuejVBDVmlW0/OSdLxXebBQO9QqcK7t4U4kIRrRHnb8VryZ57SS	\N	\N	\N	\N	\N	2025-08-27 07:10:24
154	107	ADIT AFANDI	\N	\N	\N	\N	\N	\N		8551	\N	$2y$10$3AZ2qgV8oP//TOawIkmTw.zqsYoZRzDdUFaVDcDIDIwxY2BnL8UB.	\N	\N	\N	\N	\N	2025-08-27 07:10:25
155	108	RUUSIL UMAM	\N	\N	\N	\N	\N	\N		8552	\N	$2y$10$C1rmUIk/gV4sr8b8H/TkUe0SrdvfgqnIMptZjrDh97ABRTMzZS.mC	\N	\N	\N	\N	\N	2025-08-27 07:10:25
156	109	MUHAMMAD IMRON	\N	\N	\N	\N	\N	\N		8553	\N	$2y$10$PqaeNDQiCCEzAtSed6uFzeunRIocfo8u31Am7/WNmkKmWHwLHowai	\N	\N	\N	\N	\N	2025-08-27 07:10:25
157	110	M. MUHLIS	\N	\N	\N	\N	\N	\N		8554	\N	$2y$10$Rp5L4aDiblrn8BWUq.ZTHed3jXJmxaYcy2TqUrZAEGd6cNGX/sviO	\N	\N	\N	\N	\N	2025-08-27 07:10:25
158	111	MUZAMMIL	\N	\N	\N	\N	\N	\N		8555	\N	$2y$10$vRyH4YNMC3qaSVp97Jmo2uWBw6/0cUuAGa3ORvQ0r.XqoZDmtlvJq	\N	\N	\N	\N	\N	2025-08-27 07:10:25
159	112	M. ADI ABDUR RAHMAN WAGE	\N	\N	\N	\N	\N	\N		8556	\N	$2y$10$ey3yh0a91JbUuHUBcyj.2uUTowO.fyRPxV5tsFKv6aQe487ErkrTS	\N	\N	\N	\N	\N	2025-08-27 07:10:26
160	113	WAID QURNIE	\N	\N	\N	\N	\N	\N		8557	\N	$2y$10$bAyYJpGk2bP8CfzkN9PnvuLUrCzpm4qP6yk.CEKiA2tXVzk48jOQS	\N	\N	\N	\N	\N	2025-08-27 07:10:26
161	114	M. RIDWAN	\N	\N	\N	\N	\N	\N		8558	\N	$2y$10$XMERYFLmh3E41JYjVxuyW.QTBvLCmJG.FfUEn3NUgexTZ5Dl03bne	\N	\N	\N	\N	\N	2025-08-27 07:10:26
162	115	M. NOFAL	\N	\N	\N	\N	\N	\N		8559	\N	$2y$10$IO4ieuTKYBAWPcYIy3semegY1SeOk9xrldmcPagiglvAaGmNH7Hg.	\N	\N	\N	\N	\N	2025-08-27 07:10:26
163	116	AINUL YAKIN 2	\N	\N	\N	\N	\N	\N		8560	\N	$2y$10$gQYMiK32DRw/FUWZqll2QO2/J1vX10IuPffxzns2Dd/dzo8lMZ9sq	\N	\N	\N	\N	\N	2025-08-27 07:10:26
164	117	MOHAMMAD UMAR AL FARUQ	\N	\N	\N	\N	\N	\N		8561	\N	$2y$10$NH732gc/1821VCFC4d61mu6Oi5cQnXKqbtavgWrhMSxbLFtPZURVO	\N	\N	\N	\N	\N	2025-08-27 07:10:27
165	118	MUKIT ARIFIN	\N	\N	\N	\N	\N	\N		8562	\N	$2y$10$uIW/MNvPLz2S/0JRrdZwheXLKHok5EhErGmwq3yY1S.XADngNb0cq	\N	\N	\N	\N	\N	2025-08-27 07:10:27
166	119	MUHAMMAD NUR AFANDI	\N	\N	\N	\N	\N	\N		8563	\N	$2y$10$M9lWuUlnn4NjmNMr4.Km0ubX/7cEYzbUOxzwIRdYMeujyuCmV.PoG	\N	\N	\N	\N	\N	2025-08-27 07:10:27
167	120	ADI SUCIPTO	\N	\N	\N	\N	\N	\N		8564	\N	$2y$10$Qki.XsmNQPIbZWw9Lu2jxekoJPL.4oZ9JzOJ0jdugq3tenrDoAL6m	\N	\N	\N	\N	\N	2025-08-27 07:10:27
168	121	MOHAMMAD LUTFI	\N	\N	\N	\N	\N	\N		8565	\N	$2y$10$ryq05BeBgMiNf7ErT9sFDuy13TdJ3XwpR5qJ/xUNjF7d0VAETuC/i	\N	\N	\N	\N	\N	2025-08-27 07:10:27
169	122	MOHAMMAD HAFIDI	\N	\N	\N	\N	\N	\N		8566	\N	$2y$10$cxKKYVMv7Yl6wVClEQYzHOUoCgCaiN2BNoaHT/zaCdrpF3fUYo4R2	\N	\N	\N	\N	\N	2025-08-27 07:10:28
170	123	WADIFIL ARIFIN	\N	\N	\N	\N	\N	\N		8567	\N	$2y$10$r9/HqxcH5C8R7HFS5FPwbeBsTG2gDnLFIPLXYu3BdA2Aw71/cJNTW	\N	\N	\N	\N	\N	2025-08-27 07:10:28
171	124	MOHAMMAD HAFI	\N	\N	\N	\N	\N	\N		8568	\N	$2y$10$QcMUe7S1AgwUAAVIioGLguQSsyQuEvEDntyqUy/oKtSLHgKkMYLge	\N	\N	\N	\N	\N	2025-08-27 07:10:28
172	125	MUHAMMAD RIZAL HIDAYAT	\N	\N	\N	\N	\N	\N		8569	\N	$2y$10$E4kQchVsrYTrmBf3NzQZiup8mEiFsntPTkHUxpUbea58G5qClIr/6	\N	\N	\N	\N	\N	2025-08-27 07:10:28
173	126	M. UBAIDILLAH	\N	\N	\N	\N	\N	\N		8570	\N	$2y$10$6r9Fld8YU8nYbCW40/YC4u3UGthWJIZnft11nCLqhcQcDLX.PYc1e	\N	\N	\N	\N	\N	2025-08-27 07:10:29
174	127	M. ERSA AJI SAPUTRA	\N	\N	\N	\N	\N	\N		8571	\N	$2y$10$BgUcsnMhUXbdD0tM.GzCSuqbvIR7LSo0b.QURwUFkjEiXfj57ziiO	\N	\N	\N	\N	\N	2025-08-27 07:10:29
175	128	KAVIN MASTUR	\N	\N	\N	\N	\N	\N		8572	\N	$2y$10$KaoQDSB8Gzn5RySCrHl1R.7iITdyHOKkd66LFCchzkteBS8lDnPBq	\N	\N	\N	\N	\N	2025-08-27 07:10:29
176	129	M. DAFIR	\N	\N	\N	\N	\N	\N		8573	\N	$2y$10$sBHo1bdXtukllEJNoLeAfuSIfxUcQr5ygDcn7lauxcC5Gm6OOrjju	\N	\N	\N	\N	\N	2025-08-27 07:10:29
177	130	M. SOFYAN SAHURI	\N	\N	\N	\N	\N	\N		8574	\N	$2y$10$2oDQQg2zL6IHFYFwCA9tb.LEArOcjASL.bQwive2Y8JwwKF66ZeMq	\N	\N	\N	\N	\N	2025-08-27 07:10:29
178	131	FAUZI	\N	\N	\N	\N	\N	\N		8575	\N	$2y$10$RIsXvt2yWc/FWCswV9Q5r.S8UO4MMn92aWhhn/.KU0iGpK9x/Vpfu	\N	\N	\N	\N	\N	2025-08-27 07:10:30
179	132	A. JAUHARI ADI	Jember	2026-06-04	\N	SMK	\N	\N		8576	data:image/jpeg;base64,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	$2y$10$.OD1rZJT1unlZFwOXbwjYur6lkKCF.1r3IsjY2y.SnX8oAQ7OxS6e	6	14	2026-06-04	\N	\N	2026-06-04T08:41:22.572Z
180	133	M. IMRON BAIHAQI	\N	\N	\N	\N	\N	\N		8577	\N	$2y$10$tE34fFFSWZUEnB6TWv8fq.4T.lahA2ViE6HZ/eXdyhGD.Fz4lnkjG	\N	\N	\N	\N	\N	2025-08-27 07:10:30
181	134	M. ROHIT FEBRIAN	\N	\N	\N	\N	\N	\N		8578	\N	$2y$10$muvL1KfmxXnd/o1nGmXQA.fmoH01lUgS5a1CjWP7U1fPOdoiBziqC	\N	\N	\N	\N	\N	2025-08-27 07:10:30
182	135	M. INDRA SAPUTRA	\N	\N	\N	\N	\N	\N		8579	\N	$2y$10$anyH2UcSBkP9hmAweUEUPuTpHEFcF2J8W7Q1stj/FlmvWYUrUDHQ.	\N	\N	\N	\N	\N	2025-08-27 07:10:31
183	136	M. LAFIFUR HOIR		0000-00-00					Kontrak	8580	\N	$2y$10$1tjBjlcVi0GRpa2ylT3q2OMfyEAbSahpSb1LzmGR1cnHPgggiOWLS	6	7	2025-08-01	\N	\N	2025-08-28 03:42:18
\.


--
-- Data for Name: vouchers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vouchers (id, kode_voucher, nilai, status) FROM stdin;
1	DSYFFYNMZN	20000	TERPAKAI
2	NCBL97W06S	20000	TERPAKAI
3	6I8ZKYE3J9	20000	AKTIF
4	F7HJCYSALL	20000	AKTIF
5	OVQS64316F	20000	AKTIF
6	FC0WCLVJ	30000	AKTIF
7	B9XRUMSG	30000	AKTIF
8	HNEH5SJI	30000	AKTIF
9	7PO3Q5LC	30000	AKTIF
10	Z0L3QQ0X	30000	AKTIF
11	35UOYM5B	30000	AKTIF
12	M9GUNU1D	30000	AKTIF
13	858L0D63	30000	AKTIF
14	QZCHZS8B	30000	AKTIF
15	ZZ5CBMXH	30000	AKTIF
16	Z38A9V2EG	10000	AKTIF
17	FEW8LPIQK	10000	AKTIF
18	3K8RZC675	10000	AKTIF
19	1VVRKUUTR	10000	AKTIF
20	93M6EUBMW	10000	AKTIF
\.


--
-- Name: absensi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.absensi_id_seq', 4, true);


--
-- Name: barang_id_barang_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.barang_id_barang_seq', 94, true);


--
-- Name: bayar_hutang_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bayar_hutang_id_seq', 1, false);


--
-- Name: bisyaroh_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bisyaroh_id_seq', 4, true);


--
-- Name: cabang_id_cabang_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cabang_id_cabang_seq', 22, true);


--
-- Name: daftar_akun_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.daftar_akun_id_seq', 51, true);


--
-- Name: daftar_gaji_jabatan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.daftar_gaji_jabatan_id_seq', 4, true);


--
-- Name: faktur_beli_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.faktur_beli_detail_id_seq', 625, true);


--
-- Name: faktur_beli_id_faktur_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.faktur_beli_id_faktur_seq', 130, true);


--
-- Name: forecast_stok_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.forecast_stok_id_seq', 1, false);


--
-- Name: hari_libur_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hari_libur_id_seq', 20, true);


--
-- Name: hutang_karyawan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hutang_karyawan_id_seq', 1, true);


--
-- Name: infaq_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.infaq_id_seq', 13, true);


--
-- Name: izin_cuti_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.izin_cuti_id_seq', 1, true);


--
-- Name: jabatan_id_jabatan_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jabatan_id_jabatan_seq', 11, true);


--
-- Name: jam_kerja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jam_kerja_id_seq', 3, true);


--
-- Name: jurnal_umum_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jurnal_umum_id_seq', 18, true);


--
-- Name: kas_transaksi_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kas_transaksi_id_seq', 1, false);


--
-- Name: kasir_jadwal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kasir_jadwal_id_seq', 62, true);


--
-- Name: kasir_shift_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kasir_shift_id_seq', 1, false);


--
-- Name: kategori_barang_id_kategori_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kategori_barang_id_kategori_seq', 12, true);


--
-- Name: log_login_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.log_login_id_seq', 431, true);


--
-- Name: menu_main_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.menu_main_id_seq', 47, true);


--
-- Name: menu_sub_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.menu_sub_id_seq', 172, true);


--
-- Name: pelanggan_id_pelanggan_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pelanggan_id_pelanggan_seq', 54, true);


--
-- Name: pengiriman_detail_id_detail_kirim_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pengiriman_detail_id_detail_kirim_seq', 69, true);


--
-- Name: pengiriman_id_pengiriman_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pengiriman_id_pengiriman_seq', 43, true);


--
-- Name: pengiriman_selisih_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pengiriman_selisih_id_seq', 1, false);


--
-- Name: penjualan_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.penjualan_detail_id_seq', 342, true);


--
-- Name: penjualan_id_penjualan_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.penjualan_id_penjualan_seq', 189, true);


--
-- Name: pesan_beli_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pesan_beli_detail_id_seq', 119, true);


--
-- Name: pesan_beli_id_pesan_beli_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pesan_beli_id_pesan_beli_seq', 40, true);


--
-- Name: pesan_cabang_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pesan_cabang_detail_id_seq', 602, true);


--
-- Name: pesan_cabang_id_request_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pesan_cabang_id_request_seq', 92, true);


--
-- Name: promo_barang_tebus_murah_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_barang_tebus_murah_id_seq', 1, true);


--
-- Name: promo_cabang_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_cabang_id_seq', 3, true);


--
-- Name: promo_diskon_barang_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_diskon_barang_id_seq', 1, false);


--
-- Name: promo_hadiah_barang_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_hadiah_barang_id_seq', 1, false);


--
-- Name: promo_hadiah_diskon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_hadiah_diskon_id_seq', 1, false);


--
-- Name: promo_hadiah_gratis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_hadiah_gratis_id_seq', 1, true);


--
-- Name: promo_hadiah_poin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_hadiah_poin_id_seq', 1, false);


--
-- Name: promo_id_promo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_id_promo_seq', 2, true);


--
-- Name: promo_poin_barang_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_poin_barang_id_seq', 1, false);


--
-- Name: promo_syarat_barang_tertentu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_syarat_barang_tertentu_id_seq', 1, false);


--
-- Name: promo_syarat_beli_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_syarat_beli_id_seq', 1, true);


--
-- Name: promo_syarat_kategori_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_syarat_kategori_id_seq', 1, false);


--
-- Name: promo_syarat_pembelanjaan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_syarat_pembelanjaan_id_seq', 1, true);


--
-- Name: promo_syarat_supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_syarat_supplier_id_seq', 1, false);


--
-- Name: rekening_kas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rekening_kas_id_seq', 2, true);


--
-- Name: rekomendasi_pengiriman_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rekomendasi_pengiriman_detail_id_seq', 1, false);


--
-- Name: rekomendasi_pengiriman_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rekomendasi_pengiriman_id_seq', 1, false);


--
-- Name: rekonsiliasi_kas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rekonsiliasi_kas_id_seq', 1, false);


--
-- Name: riwayat_poin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.riwayat_poin_id_seq', 4, true);


--
-- Name: role_menu_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_menu_id_seq', 1103, true);


--
-- Name: role_menu_sub_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.role_menu_sub_id_seq', 3323, true);


--
-- Name: sales_velocity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sales_velocity_id_seq', 1, false);


--
-- Name: stok_barang_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stok_barang_id_seq', 444, true);


--
-- Name: stok_setting_cabang_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stok_setting_cabang_id_seq', 1, false);


--
-- Name: supplier_id_supplier_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supplier_id_supplier_seq', 12, true);


--
-- Name: tipe_akun_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipe_akun_id_seq', 8, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 183, true);


--
-- Name: vouchers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vouchers_id_seq', 20, true);


--
-- Name: absensi absensi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.absensi
    ADD CONSTRAINT absensi_pkey PRIMARY KEY (id);


--
-- Name: barang barang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barang
    ADD CONSTRAINT barang_pkey PRIMARY KEY (id_barang);


--
-- Name: bayar_hutang bayar_hutang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bayar_hutang
    ADD CONSTRAINT bayar_hutang_pkey PRIMARY KEY (id);


--
-- Name: bisyaroh bisyaroh_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bisyaroh
    ADD CONSTRAINT bisyaroh_pkey PRIMARY KEY (id);


--
-- Name: cabang cabang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cabang
    ADD CONSTRAINT cabang_pkey PRIMARY KEY (id_cabang);


--
-- Name: daftar_akun daftar_akun_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daftar_akun
    ADD CONSTRAINT daftar_akun_pkey PRIMARY KEY (id);


--
-- Name: daftar_gaji_jabatan daftar_gaji_jabatan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daftar_gaji_jabatan
    ADD CONSTRAINT daftar_gaji_jabatan_pkey PRIMARY KEY (id);


--
-- Name: faktur_beli_detail faktur_beli_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faktur_beli_detail
    ADD CONSTRAINT faktur_beli_detail_pkey PRIMARY KEY (id);


--
-- Name: faktur_beli faktur_beli_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faktur_beli
    ADD CONSTRAINT faktur_beli_pkey PRIMARY KEY (id_faktur);


--
-- Name: forecast_stok forecast_stok_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forecast_stok
    ADD CONSTRAINT forecast_stok_pkey PRIMARY KEY (id);


--
-- Name: hari_libur hari_libur_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hari_libur
    ADD CONSTRAINT hari_libur_pkey PRIMARY KEY (id);


--
-- Name: hutang_karyawan hutang_karyawan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hutang_karyawan
    ADD CONSTRAINT hutang_karyawan_pkey PRIMARY KEY (id);


--
-- Name: infaq infaq_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infaq
    ADD CONSTRAINT infaq_pkey PRIMARY KEY (id);


--
-- Name: izin_cuti izin_cuti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.izin_cuti
    ADD CONSTRAINT izin_cuti_pkey PRIMARY KEY (id);


--
-- Name: jabatan jabatan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jabatan
    ADD CONSTRAINT jabatan_pkey PRIMARY KEY (id_jabatan);


--
-- Name: jam_kerja jam_kerja_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jam_kerja
    ADD CONSTRAINT jam_kerja_pkey PRIMARY KEY (id);


--
-- Name: jurnal_umum jurnal_umum_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jurnal_umum
    ADD CONSTRAINT jurnal_umum_pkey PRIMARY KEY (id);


--
-- Name: kas_transaksi kas_transaksi_nomor_transaksi_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kas_transaksi
    ADD CONSTRAINT kas_transaksi_nomor_transaksi_unique UNIQUE (nomor_transaksi);


--
-- Name: kas_transaksi kas_transaksi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kas_transaksi
    ADD CONSTRAINT kas_transaksi_pkey PRIMARY KEY (id);


--
-- Name: kasir_jadwal kasir_jadwal_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kasir_jadwal
    ADD CONSTRAINT kasir_jadwal_pkey PRIMARY KEY (id);


--
-- Name: kasir_shift kasir_shift_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kasir_shift
    ADD CONSTRAINT kasir_shift_pkey PRIMARY KEY (id);


--
-- Name: kategori_barang kategori_barang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kategori_barang
    ADD CONSTRAINT kategori_barang_pkey PRIMARY KEY (id_kategori);


--
-- Name: log_login log_login_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_login
    ADD CONSTRAINT log_login_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (identifier);


--
-- Name: menu_main menu_main_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_main
    ADD CONSTRAINT menu_main_pkey PRIMARY KEY (id);


--
-- Name: menu_sub menu_sub_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.menu_sub
    ADD CONSTRAINT menu_sub_pkey PRIMARY KEY (id);


--
-- Name: pelanggan pelanggan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pelanggan
    ADD CONSTRAINT pelanggan_pkey PRIMARY KEY (id_pelanggan);


--
-- Name: pengaturan_aplikasi pengaturan_aplikasi_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengaturan_aplikasi
    ADD CONSTRAINT pengaturan_aplikasi_pkey PRIMARY KEY (key);


--
-- Name: pengiriman_detail pengiriman_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman_detail
    ADD CONSTRAINT pengiriman_detail_pkey PRIMARY KEY (id_detail_kirim);


--
-- Name: pengiriman pengiriman_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman
    ADD CONSTRAINT pengiriman_pkey PRIMARY KEY (id_pengiriman);


--
-- Name: pengiriman_selisih pengiriman_selisih_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman_selisih
    ADD CONSTRAINT pengiriman_selisih_pkey PRIMARY KEY (id);


--
-- Name: penjualan_detail penjualan_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penjualan_detail
    ADD CONSTRAINT penjualan_detail_pkey PRIMARY KEY (id);


--
-- Name: penjualan penjualan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penjualan
    ADD CONSTRAINT penjualan_pkey PRIMARY KEY (id_penjualan);


--
-- Name: pesan_beli_detail pesan_beli_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_beli_detail
    ADD CONSTRAINT pesan_beli_detail_pkey PRIMARY KEY (id);


--
-- Name: pesan_beli pesan_beli_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_beli
    ADD CONSTRAINT pesan_beli_pkey PRIMARY KEY (id_pesan_beli);


--
-- Name: pesan_cabang_detail pesan_cabang_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_cabang_detail
    ADD CONSTRAINT pesan_cabang_detail_pkey PRIMARY KEY (id);


--
-- Name: pesan_cabang pesan_cabang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_cabang
    ADD CONSTRAINT pesan_cabang_pkey PRIMARY KEY (id_request);


--
-- Name: promo_barang_tebus_murah promo_barang_tebus_murah_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_barang_tebus_murah
    ADD CONSTRAINT promo_barang_tebus_murah_pkey PRIMARY KEY (id);


--
-- Name: promo_cabang promo_cabang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_cabang
    ADD CONSTRAINT promo_cabang_pkey PRIMARY KEY (id);


--
-- Name: promo_diskon_barang promo_diskon_barang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_diskon_barang
    ADD CONSTRAINT promo_diskon_barang_pkey PRIMARY KEY (id);


--
-- Name: promo_hadiah_barang promo_hadiah_barang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_barang
    ADD CONSTRAINT promo_hadiah_barang_pkey PRIMARY KEY (id);


--
-- Name: promo_hadiah_diskon promo_hadiah_diskon_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_diskon
    ADD CONSTRAINT promo_hadiah_diskon_pkey PRIMARY KEY (id);


--
-- Name: promo_hadiah_gratis promo_hadiah_gratis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_gratis
    ADD CONSTRAINT promo_hadiah_gratis_pkey PRIMARY KEY (id);


--
-- Name: promo_hadiah_poin promo_hadiah_poin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_poin
    ADD CONSTRAINT promo_hadiah_poin_pkey PRIMARY KEY (id);


--
-- Name: promo promo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo
    ADD CONSTRAINT promo_pkey PRIMARY KEY (id_promo);


--
-- Name: promo_poin_barang promo_poin_barang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_poin_barang
    ADD CONSTRAINT promo_poin_barang_pkey PRIMARY KEY (id);


--
-- Name: promo_syarat_barang_tertentu promo_syarat_barang_tertentu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_barang_tertentu
    ADD CONSTRAINT promo_syarat_barang_tertentu_pkey PRIMARY KEY (id);


--
-- Name: promo_syarat_beli promo_syarat_beli_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_beli
    ADD CONSTRAINT promo_syarat_beli_pkey PRIMARY KEY (id);


--
-- Name: promo_syarat_kategori promo_syarat_kategori_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_kategori
    ADD CONSTRAINT promo_syarat_kategori_pkey PRIMARY KEY (id);


--
-- Name: promo_syarat_pembelanjaan promo_syarat_pembelanjaan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_pembelanjaan
    ADD CONSTRAINT promo_syarat_pembelanjaan_pkey PRIMARY KEY (id);


--
-- Name: promo_syarat_supplier promo_syarat_supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_supplier
    ADD CONSTRAINT promo_syarat_supplier_pkey PRIMARY KEY (id);


--
-- Name: rekening_kas rekening_kas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekening_kas
    ADD CONSTRAINT rekening_kas_pkey PRIMARY KEY (id);


--
-- Name: rekomendasi_pengiriman_detail rekomendasi_pengiriman_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekomendasi_pengiriman_detail
    ADD CONSTRAINT rekomendasi_pengiriman_detail_pkey PRIMARY KEY (id);


--
-- Name: rekomendasi_pengiriman rekomendasi_pengiriman_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekomendasi_pengiriman
    ADD CONSTRAINT rekomendasi_pengiriman_pkey PRIMARY KEY (id);


--
-- Name: rekonsiliasi_kas rekonsiliasi_kas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekonsiliasi_kas
    ADD CONSTRAINT rekonsiliasi_kas_pkey PRIMARY KEY (id);


--
-- Name: riwayat_poin riwayat_poin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riwayat_poin
    ADD CONSTRAINT riwayat_poin_pkey PRIMARY KEY (id);


--
-- Name: role_menu role_menu_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_menu
    ADD CONSTRAINT role_menu_pkey PRIMARY KEY (id);


--
-- Name: role_menu_sub role_menu_sub_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_menu_sub
    ADD CONSTRAINT role_menu_sub_pkey PRIMARY KEY (id);


--
-- Name: sales_velocity sales_velocity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_velocity
    ADD CONSTRAINT sales_velocity_pkey PRIMARY KEY (id);


--
-- Name: stok_barang stok_barang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stok_barang
    ADD CONSTRAINT stok_barang_pkey PRIMARY KEY (id);


--
-- Name: stok_setting_cabang stok_setting_cabang_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stok_setting_cabang
    ADD CONSTRAINT stok_setting_cabang_pkey PRIMARY KEY (id);


--
-- Name: supplier supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier
    ADD CONSTRAINT supplier_pkey PRIMARY KEY (id_supplier);


--
-- Name: tipe_akun tipe_akun_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipe_akun
    ADD CONSTRAINT tipe_akun_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vouchers vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vouchers
    ADD CONSTRAINT vouchers_pkey PRIMARY KEY (id);


--
-- Name: barang barang_id_kategori_kategori_barang_id_kategori_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barang
    ADD CONSTRAINT barang_id_kategori_kategori_barang_id_kategori_fk FOREIGN KEY (id_kategori) REFERENCES public.kategori_barang(id_kategori);


--
-- Name: barang barang_id_supplier_supplier_id_supplier_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barang
    ADD CONSTRAINT barang_id_supplier_supplier_id_supplier_fk FOREIGN KEY (id_supplier) REFERENCES public.supplier(id_supplier);


--
-- Name: bayar_hutang bayar_hutang_id_supplier_supplier_id_supplier_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bayar_hutang
    ADD CONSTRAINT bayar_hutang_id_supplier_supplier_id_supplier_fk FOREIGN KEY (id_supplier) REFERENCES public.supplier(id_supplier);


--
-- Name: daftar_akun daftar_akun_tipe_akun_id_tipe_akun_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daftar_akun
    ADD CONSTRAINT daftar_akun_tipe_akun_id_tipe_akun_id_fk FOREIGN KEY (tipe_akun_id) REFERENCES public.tipe_akun(id);


--
-- Name: faktur_beli_detail faktur_beli_detail_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faktur_beli_detail
    ADD CONSTRAINT faktur_beli_detail_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: faktur_beli_detail faktur_beli_detail_id_faktur_faktur_beli_id_faktur_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faktur_beli_detail
    ADD CONSTRAINT faktur_beli_detail_id_faktur_faktur_beli_id_faktur_fk FOREIGN KEY (id_faktur) REFERENCES public.faktur_beli(id_faktur);


--
-- Name: faktur_beli faktur_beli_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faktur_beli
    ADD CONSTRAINT faktur_beli_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- Name: faktur_beli faktur_beli_id_po_pesan_beli_id_pesan_beli_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faktur_beli
    ADD CONSTRAINT faktur_beli_id_po_pesan_beli_id_pesan_beli_fk FOREIGN KEY (id_po) REFERENCES public.pesan_beli(id_pesan_beli);


--
-- Name: faktur_beli faktur_beli_id_supplier_supplier_id_supplier_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faktur_beli
    ADD CONSTRAINT faktur_beli_id_supplier_supplier_id_supplier_fk FOREIGN KEY (id_supplier) REFERENCES public.supplier(id_supplier);


--
-- Name: forecast_stok forecast_stok_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forecast_stok
    ADD CONSTRAINT forecast_stok_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: forecast_stok forecast_stok_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forecast_stok
    ADD CONSTRAINT forecast_stok_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- Name: infaq infaq_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infaq
    ADD CONSTRAINT infaq_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- Name: infaq infaq_id_penjualan_penjualan_id_penjualan_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infaq
    ADD CONSTRAINT infaq_id_penjualan_penjualan_id_penjualan_fk FOREIGN KEY (id_penjualan) REFERENCES public.penjualan(id_penjualan);


--
-- Name: infaq infaq_id_user_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.infaq
    ADD CONSTRAINT infaq_id_user_users_id_fk FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: jurnal_umum jurnal_umum_akun_id_daftar_akun_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jurnal_umum
    ADD CONSTRAINT jurnal_umum_akun_id_daftar_akun_id_fk FOREIGN KEY (akun_id) REFERENCES public.daftar_akun(id);


--
-- Name: jurnal_umum jurnal_umum_cabang_id_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jurnal_umum
    ADD CONSTRAINT jurnal_umum_cabang_id_cabang_id_cabang_fk FOREIGN KEY (cabang_id) REFERENCES public.cabang(id_cabang);


--
-- Name: jurnal_umum jurnal_umum_dibuat_oleh_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jurnal_umum
    ADD CONSTRAINT jurnal_umum_dibuat_oleh_users_id_fk FOREIGN KEY (dibuat_oleh) REFERENCES public.users(id);


--
-- Name: kas_transaksi kas_transaksi_approved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kas_transaksi
    ADD CONSTRAINT kas_transaksi_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: kas_transaksi kas_transaksi_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kas_transaksi
    ADD CONSTRAINT kas_transaksi_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: kas_transaksi kas_transaksi_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kas_transaksi
    ADD CONSTRAINT kas_transaksi_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- Name: kas_transaksi kas_transaksi_id_rekening_rekening_kas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kas_transaksi
    ADD CONSTRAINT kas_transaksi_id_rekening_rekening_kas_id_fk FOREIGN KEY (id_rekening) REFERENCES public.rekening_kas(id);


--
-- Name: kas_transaksi kas_transaksi_id_rekening_tujuan_rekening_kas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kas_transaksi
    ADD CONSTRAINT kas_transaksi_id_rekening_tujuan_rekening_kas_id_fk FOREIGN KEY (id_rekening_tujuan) REFERENCES public.rekening_kas(id);


--
-- Name: kasir_jadwal kasir_jadwal_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kasir_jadwal
    ADD CONSTRAINT kasir_jadwal_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: kasir_jadwal kasir_jadwal_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kasir_jadwal
    ADD CONSTRAINT kasir_jadwal_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- Name: kasir_jadwal kasir_jadwal_id_kasir_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kasir_jadwal
    ADD CONSTRAINT kasir_jadwal_id_kasir_users_id_fk FOREIGN KEY (id_kasir) REFERENCES public.users(id);


--
-- Name: kasir_jadwal kasir_jadwal_id_shift_jam_kerja_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kasir_jadwal
    ADD CONSTRAINT kasir_jadwal_id_shift_jam_kerja_id_fk FOREIGN KEY (id_shift) REFERENCES public.jam_kerja(id);


--
-- Name: kasir_shift kasir_shift_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kasir_shift
    ADD CONSTRAINT kasir_shift_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- Name: kasir_shift kasir_shift_id_kasir_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kasir_shift
    ADD CONSTRAINT kasir_shift_id_kasir_users_id_fk FOREIGN KEY (id_kasir) REFERENCES public.users(id);


--
-- Name: kasir_shift kasir_shift_id_rekening_rekening_kas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kasir_shift
    ADD CONSTRAINT kasir_shift_id_rekening_rekening_kas_id_fk FOREIGN KEY (id_rekening) REFERENCES public.rekening_kas(id);


--
-- Name: kasir_shift kasir_shift_verified_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kasir_shift
    ADD CONSTRAINT kasir_shift_verified_by_users_id_fk FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: pengiriman_detail pengiriman_detail_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman_detail
    ADD CONSTRAINT pengiriman_detail_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: pengiriman_detail pengiriman_detail_id_pengiriman_pengiriman_id_pengiriman_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman_detail
    ADD CONSTRAINT pengiriman_detail_id_pengiriman_pengiriman_id_pengiriman_fk FOREIGN KEY (id_pengiriman) REFERENCES public.pengiriman(id_pengiriman);


--
-- Name: pengiriman_detail pengiriman_detail_id_request_detail_pesan_cabang_detail_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman_detail
    ADD CONSTRAINT pengiriman_detail_id_request_detail_pesan_cabang_detail_id_fk FOREIGN KEY (id_request_detail) REFERENCES public.pesan_cabang_detail(id);


--
-- Name: pengiriman pengiriman_id_cabang_sumber_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman
    ADD CONSTRAINT pengiriman_id_cabang_sumber_cabang_id_cabang_fk FOREIGN KEY (id_cabang_sumber) REFERENCES public.cabang(id_cabang);


--
-- Name: pengiriman pengiriman_id_cabang_tujuan_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman
    ADD CONSTRAINT pengiriman_id_cabang_tujuan_cabang_id_cabang_fk FOREIGN KEY (id_cabang_tujuan) REFERENCES public.cabang(id_cabang);


--
-- Name: pengiriman pengiriman_id_user_penerima_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman
    ADD CONSTRAINT pengiriman_id_user_penerima_users_id_fk FOREIGN KEY (id_user_penerima) REFERENCES public.users(id);


--
-- Name: pengiriman pengiriman_id_user_pengirim_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman
    ADD CONSTRAINT pengiriman_id_user_pengirim_users_id_fk FOREIGN KEY (id_user_pengirim) REFERENCES public.users(id);


--
-- Name: pengiriman_selisih pengiriman_selisih_disetujui_oleh_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman_selisih
    ADD CONSTRAINT pengiriman_selisih_disetujui_oleh_users_id_fk FOREIGN KEY (disetujui_oleh) REFERENCES public.users(id);


--
-- Name: pengiriman_selisih pengiriman_selisih_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman_selisih
    ADD CONSTRAINT pengiriman_selisih_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: pengiriman_selisih pengiriman_selisih_id_pengiriman_pengiriman_id_pengiriman_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pengiriman_selisih
    ADD CONSTRAINT pengiriman_selisih_id_pengiriman_pengiriman_id_pengiriman_fk FOREIGN KEY (id_pengiriman) REFERENCES public.pengiriman(id_pengiriman);


--
-- Name: penjualan_detail penjualan_detail_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penjualan_detail
    ADD CONSTRAINT penjualan_detail_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: penjualan_detail penjualan_detail_id_penjualan_penjualan_id_penjualan_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penjualan_detail
    ADD CONSTRAINT penjualan_detail_id_penjualan_penjualan_id_penjualan_fk FOREIGN KEY (id_penjualan) REFERENCES public.penjualan(id_penjualan);


--
-- Name: penjualan penjualan_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penjualan
    ADD CONSTRAINT penjualan_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- Name: penjualan penjualan_id_user_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.penjualan
    ADD CONSTRAINT penjualan_id_user_users_id_fk FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: pesan_beli_detail pesan_beli_detail_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_beli_detail
    ADD CONSTRAINT pesan_beli_detail_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: pesan_beli_detail pesan_beli_detail_id_pesan_beli_pesan_beli_id_pesan_beli_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_beli_detail
    ADD CONSTRAINT pesan_beli_detail_id_pesan_beli_pesan_beli_id_pesan_beli_fk FOREIGN KEY (id_pesan_beli) REFERENCES public.pesan_beli(id_pesan_beli);


--
-- Name: pesan_beli pesan_beli_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_beli
    ADD CONSTRAINT pesan_beli_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- Name: pesan_beli pesan_beli_id_supplier_supplier_id_supplier_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_beli
    ADD CONSTRAINT pesan_beli_id_supplier_supplier_id_supplier_fk FOREIGN KEY (id_supplier) REFERENCES public.supplier(id_supplier);


--
-- Name: pesan_cabang_detail pesan_cabang_detail_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_cabang_detail
    ADD CONSTRAINT pesan_cabang_detail_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: pesan_cabang_detail pesan_cabang_detail_id_request_pesan_cabang_id_request_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_cabang_detail
    ADD CONSTRAINT pesan_cabang_detail_id_request_pesan_cabang_id_request_fk FOREIGN KEY (id_request) REFERENCES public.pesan_cabang(id_request);


--
-- Name: pesan_cabang pesan_cabang_id_cabang_peminta_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_cabang
    ADD CONSTRAINT pesan_cabang_id_cabang_peminta_cabang_id_cabang_fk FOREIGN KEY (id_cabang_peminta) REFERENCES public.cabang(id_cabang);


--
-- Name: pesan_cabang pesan_cabang_id_cabang_sumber_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_cabang
    ADD CONSTRAINT pesan_cabang_id_cabang_sumber_cabang_id_cabang_fk FOREIGN KEY (id_cabang_sumber) REFERENCES public.cabang(id_cabang);


--
-- Name: pesan_cabang pesan_cabang_id_user_peminta_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pesan_cabang
    ADD CONSTRAINT pesan_cabang_id_user_peminta_users_id_fk FOREIGN KEY (id_user_peminta) REFERENCES public.users(id);


--
-- Name: promo_barang_tebus_murah promo_barang_tebus_murah_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_barang_tebus_murah
    ADD CONSTRAINT promo_barang_tebus_murah_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: promo_barang_tebus_murah promo_barang_tebus_murah_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_barang_tebus_murah
    ADD CONSTRAINT promo_barang_tebus_murah_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_cabang promo_cabang_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_cabang
    ADD CONSTRAINT promo_cabang_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- Name: promo_cabang promo_cabang_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_cabang
    ADD CONSTRAINT promo_cabang_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_diskon_barang promo_diskon_barang_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_diskon_barang
    ADD CONSTRAINT promo_diskon_barang_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: promo_diskon_barang promo_diskon_barang_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_diskon_barang
    ADD CONSTRAINT promo_diskon_barang_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_hadiah_barang promo_hadiah_barang_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_barang
    ADD CONSTRAINT promo_hadiah_barang_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: promo_hadiah_barang promo_hadiah_barang_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_barang
    ADD CONSTRAINT promo_hadiah_barang_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_hadiah_diskon promo_hadiah_diskon_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_diskon
    ADD CONSTRAINT promo_hadiah_diskon_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_hadiah_gratis promo_hadiah_gratis_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_gratis
    ADD CONSTRAINT promo_hadiah_gratis_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: promo_hadiah_gratis promo_hadiah_gratis_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_gratis
    ADD CONSTRAINT promo_hadiah_gratis_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_hadiah_poin promo_hadiah_poin_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_hadiah_poin
    ADD CONSTRAINT promo_hadiah_poin_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_poin_barang promo_poin_barang_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_poin_barang
    ADD CONSTRAINT promo_poin_barang_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: promo_poin_barang promo_poin_barang_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_poin_barang
    ADD CONSTRAINT promo_poin_barang_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_syarat_barang_tertentu promo_syarat_barang_tertentu_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_barang_tertentu
    ADD CONSTRAINT promo_syarat_barang_tertentu_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: promo_syarat_barang_tertentu promo_syarat_barang_tertentu_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_barang_tertentu
    ADD CONSTRAINT promo_syarat_barang_tertentu_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_syarat_beli promo_syarat_beli_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_beli
    ADD CONSTRAINT promo_syarat_beli_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: promo_syarat_beli promo_syarat_beli_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_beli
    ADD CONSTRAINT promo_syarat_beli_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_syarat_kategori promo_syarat_kategori_id_kategori_kategori_barang_id_kategori_f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_kategori
    ADD CONSTRAINT promo_syarat_kategori_id_kategori_kategori_barang_id_kategori_f FOREIGN KEY (id_kategori) REFERENCES public.kategori_barang(id_kategori);


--
-- Name: promo_syarat_kategori promo_syarat_kategori_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_kategori
    ADD CONSTRAINT promo_syarat_kategori_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_syarat_pembelanjaan promo_syarat_pembelanjaan_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_pembelanjaan
    ADD CONSTRAINT promo_syarat_pembelanjaan_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_syarat_supplier promo_syarat_supplier_id_promo_promo_id_promo_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_supplier
    ADD CONSTRAINT promo_syarat_supplier_id_promo_promo_id_promo_fk FOREIGN KEY (id_promo) REFERENCES public.promo(id_promo);


--
-- Name: promo_syarat_supplier promo_syarat_supplier_id_supplier_supplier_id_supplier_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_syarat_supplier
    ADD CONSTRAINT promo_syarat_supplier_id_supplier_supplier_id_supplier_fk FOREIGN KEY (id_supplier) REFERENCES public.supplier(id_supplier);


--
-- Name: rekening_kas rekening_kas_id_akun_coa_daftar_akun_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekening_kas
    ADD CONSTRAINT rekening_kas_id_akun_coa_daftar_akun_id_fk FOREIGN KEY (id_akun_coa) REFERENCES public.daftar_akun(id);


--
-- Name: rekening_kas rekening_kas_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekening_kas
    ADD CONSTRAINT rekening_kas_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- Name: rekomendasi_pengiriman_detail rekomendasi_pengiriman_detail_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekomendasi_pengiriman_detail
    ADD CONSTRAINT rekomendasi_pengiriman_detail_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: rekomendasi_pengiriman_detail rekomendasi_pengiriman_detail_id_cabang_tujuan_cabang_id_cabang; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekomendasi_pengiriman_detail
    ADD CONSTRAINT rekomendasi_pengiriman_detail_id_cabang_tujuan_cabang_id_cabang FOREIGN KEY (id_cabang_tujuan) REFERENCES public.cabang(id_cabang);


--
-- Name: rekomendasi_pengiriman_detail rekomendasi_pengiriman_detail_id_rekomendasi_rekomendasi_pengir; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekomendasi_pengiriman_detail
    ADD CONSTRAINT rekomendasi_pengiriman_detail_id_rekomendasi_rekomendasi_pengir FOREIGN KEY (id_rekomendasi) REFERENCES public.rekomendasi_pengiriman(id);


--
-- Name: rekomendasi_pengiriman rekomendasi_pengiriman_dibuat_oleh_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekomendasi_pengiriman
    ADD CONSTRAINT rekomendasi_pengiriman_dibuat_oleh_users_id_fk FOREIGN KEY (dibuat_oleh) REFERENCES public.users(id);


--
-- Name: rekonsiliasi_kas rekonsiliasi_kas_approved_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekonsiliasi_kas
    ADD CONSTRAINT rekonsiliasi_kas_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: rekonsiliasi_kas rekonsiliasi_kas_created_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekonsiliasi_kas
    ADD CONSTRAINT rekonsiliasi_kas_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: rekonsiliasi_kas rekonsiliasi_kas_id_rekening_rekening_kas_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rekonsiliasi_kas
    ADD CONSTRAINT rekonsiliasi_kas_id_rekening_rekening_kas_id_fk FOREIGN KEY (id_rekening) REFERENCES public.rekening_kas(id);


--
-- Name: riwayat_poin riwayat_poin_id_pelanggan_pelanggan_id_pelanggan_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.riwayat_poin
    ADD CONSTRAINT riwayat_poin_id_pelanggan_pelanggan_id_pelanggan_fk FOREIGN KEY (id_pelanggan) REFERENCES public.pelanggan(id_pelanggan);


--
-- Name: sales_velocity sales_velocity_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_velocity
    ADD CONSTRAINT sales_velocity_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: sales_velocity sales_velocity_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales_velocity
    ADD CONSTRAINT sales_velocity_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- Name: stok_barang stok_barang_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stok_barang
    ADD CONSTRAINT stok_barang_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: stok_barang stok_barang_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stok_barang
    ADD CONSTRAINT stok_barang_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- Name: stok_setting_cabang stok_setting_cabang_id_barang_barang_id_barang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stok_setting_cabang
    ADD CONSTRAINT stok_setting_cabang_id_barang_barang_id_barang_fk FOREIGN KEY (id_barang) REFERENCES public.barang(id_barang);


--
-- Name: stok_setting_cabang stok_setting_cabang_id_cabang_cabang_id_cabang_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stok_setting_cabang
    ADD CONSTRAINT stok_setting_cabang_id_cabang_cabang_id_cabang_fk FOREIGN KEY (id_cabang) REFERENCES public.cabang(id_cabang);


--
-- PostgreSQL database dump complete
--

\unrestrict 3OFAz6rAlj7pbATCUx1hFU6NtJ1ZDhMdptGsCyRmP9itYgBl0qjikf25G3OPyvP

