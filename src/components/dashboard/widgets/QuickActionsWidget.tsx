"use client";

import Link from "next/link";
import {
  ShoppingCart,
  FilePlus,
  ArrowLeftRight,
  Layers,
  ClipboardCheck,
  Send,
  UserCheck,
  Receipt,
} from "lucide-react";

export function QuickActionsWidget() {
  const actions = [
    {
      label: "Buka Kasir POS",
      desc: "Transaksi kasir ritel",
      href: "/penjualan/pos",
      icon: <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20",
    },
    {
      label: "Buat PO Supplier",
      desc: "Pemesanan pengadaan",
      href: "/pembelian/po",
      icon: <FilePlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      bg: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
    },
    {
      label: "Faktur Pembelian",
      desc: "Penerimaan & tagihan",
      href: "/pembelian/invoice",
      icon: <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bg: "bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20",
    },
    {
      label: "Mutasi Kas / Biaya",
      desc: "Input kas masuk/keluar",
      href: "/kas/transaksi",
      icon: <ArrowLeftRight className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bg: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20",
    },
    {
      label: "Katalog Stok",
      desc: "Monitoring sisa stok",
      href: "/stok",
      icon: <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      bg: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20",
    },
    {
      label: "Stock Opname",
      desc: "Audit fisik & selisih",
      href: "/barang/stok-opname",
      icon: <ClipboardCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      bg: "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20",
    },
    {
      label: "Transfer Cabang",
      desc: "Kirim barang antartoko",
      href: "/distribusi/transfer",
      icon: <Send className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      bg: "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20",
    },
    {
      label: "Absensi Abdi",
      desc: "Presensi & shift kerja",
      href: "/hrd/absensi",
      icon: <UserCheck className="w-5 h-5 text-primary" />,
      bg: "bg-primary/10 hover:bg-primary/20 border-primary/20",
    },
  ];

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
          Pintasan Aksi Cepat (Quick Launcher)
        </h2>
        <span className="text-xs text-on-surface-variant/70">Akses langsung fitur utama</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {actions.map((act) => (
          <Link
            key={act.href}
            href={act.href}
            className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${act.bg} group`}
          >
            <div className="p-2 rounded-lg bg-surface/80 group-hover:scale-110 transition-transform mb-2">
              {act.icon}
            </div>
            <span className="text-xs font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
              {act.label}
            </span>
            <span className="text-[10px] text-on-surface-variant/70 line-clamp-1 mt-0.5">
              {act.desc}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

