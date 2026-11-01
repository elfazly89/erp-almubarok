"use client";

import Link from "next/link";
import { Clock, AlertCircle, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BatchExpiredItem {
  id_batch: number;
  nomor_batch: string;
  id_barang: number;
  nama_barang: string;
  nama_cabang: string;
  stok_batch: number;
  tanggal_kadaluarsa: string;
  sisa_hari: number;
  status: "KADALUARSA" | "KRITIS" | "PERHATIAN";
}

interface FefoBatchExpiredProps {
  data: BatchExpiredItem[];
}

export function FefoBatchExpiredWidget({ data }: FefoBatchExpiredProps) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Peringatan Batch Kadaluarsa (FEFO)
          </h2>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">
            Prioritas pajang depan atau promo diskon
          </p>
        </div>
        <Link
          href="/barang/batch"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Batch & Lot</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[260px] pr-1">
        {data.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant/60 text-xs">
            Tidak ada batch yang mendekati kadaluarsa dalam 60 hari ke depan.
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.id_batch}
              className="p-3 rounded-xl border border-outline-variant/25 bg-surface-container-low/40 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0">
                <p className="font-semibold text-on-surface truncate">{item.nama_barang}</p>
                <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/80 mt-0.5">
                  <span className="font-mono bg-surface-container px-1 rounded">
                    Batch: {item.nomor_batch}
                  </span>
                  <span>&bull; {item.nama_cabang}</span>
                  <span>&bull; Stok: <b className="font-mono">{item.stok_batch}</b></span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    item.status === "KADALUARSA"
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : item.status === "KRITIS"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  }`}
                >
                  {item.sisa_hari <= 0 ? "Expired" : `${item.sisa_hari} hari lagi`}
                </span>
                <p className="text-[10px] text-on-surface-variant/60 font-mono mt-0.5">
                  {formatDate(item.tanggal_kadaluarsa)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

