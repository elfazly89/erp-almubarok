"use client";

import Link from "next/link";
import { AlertTriangle, PlusCircle, ArrowLeftRight, Layers, ArrowRight } from "lucide-react";

interface CriticalStockItem {
  id_barang: number;
  kode_barang: string | null;
  nama_barang: string;
  satuan: string;
  id_cabang: number | null;
  nama_cabang: string;
  stok_akhir: number | null;
  minimal_stok: number | null;
  status: "HABIS" | "KRITIS";
}

interface ActionableCriticalStockProps {
  data: CriticalStockItem[];
}

export function ActionableCriticalStockWidget({ data }: ActionableCriticalStockProps) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Peringatan Stok Kritis & Stok Habis
          </h2>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">
            Barang di bawah buffer stok minimum yang membutuhkan restock
          </p>
        </div>
        <Link
          href="/stok"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Semua Stok</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table / List */}
      <div className="flex-1 overflow-x-auto">
        {data.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant/60 text-xs">
            🎉 Seluruh persediaan barang saat ini dalam kondisi aman di atas batas minimum.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/20 text-on-surface-variant font-semibold">
                <th className="pb-2.5">Barang</th>
                <th className="pb-2.5">Cabang</th>
                <th className="pb-2.5 text-center">Status</th>
                <th className="pb-2.5 text-right">Sisa Stok</th>
                <th className="pb-2.5 text-right">Min Buffer</th>
                <th className="pb-2.5 text-right">Tindakan Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {data.map((item) => (
                <tr key={`${item.id_barang}-${item.id_cabang}`} className="hover:bg-surface-container/30 transition-colors">
                  <td className="py-2.5 font-medium text-on-surface max-w-[200px] truncate">
                    <p className="font-semibold">{item.nama_barang}</p>
                    <span className="text-[10px] text-on-surface-variant/60 font-mono">
                      {item.kode_barang || "SKU-AUTO"}
                    </span>
                  </td>
                  <td className="py-2.5 text-on-surface-variant">
                    {item.nama_cabang}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === "HABIS"
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-rose-600">
                    {item.stok_akhir ?? 0} {item.satuan}
                  </td>
                  <td className="py-2.5 text-right font-mono text-on-surface-variant">
                    {item.minimal_stok ?? 5} {item.satuan}
                  </td>
                  <td className="py-2.5 text-right space-x-1 whitespace-nowrap">
                    <Link
                      href="/pembelian/po"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-on-primary text-[11px] font-semibold transition-all"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Buat PO</span>
                    </Link>
                    <Link
                      href="/distribusi/transfer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-container-highest text-[11px] font-medium transition-all"
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                      <span>Transfer</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

