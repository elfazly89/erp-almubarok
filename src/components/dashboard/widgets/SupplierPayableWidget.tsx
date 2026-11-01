"use client";

import Link from "next/link";
import { CreditCard, AlertCircle, ArrowRight, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SupplierPayableProps {
  data: {
    hutangJatuhTempo: number;
    hutangCount: number;
  };
}

export function SupplierPayableWidget({ data }: SupplierPayableProps) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-rose-500" />
            Hutang Supplier Belum Lunas (AP)
          </h2>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">
            Kewajiban pembayaran atas faktur pembelian barang
          </p>
        </div>
        <Link
          href="/pembelian/hutang"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Hutang Supplier</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-on-surface-variant">
            Total Tagihan Belum Dibayar
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600">
            {data.hutangCount} Faktur Terbuka
          </span>
        </div>
        <p className="text-2xl sm:text-3xl font-extrabold text-on-surface font-mono">
          {formatCurrency(data.hutangJatuhTempo)}
        </p>
        <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-outline-variant/20">
          <p className="text-xs text-on-surface-variant/80">
            Periksa jatuh tempo untuk menjaga hubungan baik dengan vendor
          </p>
          <Link
            href="/pembelian/hutang"
            className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors shrink-0"
          >
            Bayar Hutang
          </Link>
        </div>
      </div>
    </div>
  );
}

