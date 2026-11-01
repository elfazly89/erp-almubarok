"use client";

import Link from "next/link";
import { Truck, Send, MapPin, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ShipmentItem {
  id_pengiriman: number;
  kode_pengiriman: string;
  id_cabang_sumber: number;
  nama_cabang_sumber: string | null;
  id_cabang_tujuan: number;
  nama_cabang_tujuan: string | null;
  driver: string | null;
  armada: string | null;
  status: string | null;
  tanggal_kirim: string;
}

interface DcShipmentTrackingProps {
  data: ShipmentItem[];
}

export function DcShipmentTrackingWidget({ data }: DcShipmentTrackingProps) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-2xl p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            Pelacak Pengiriman & Surat Jalan DC
          </h2>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">
            Surat jalan logistik antar-cabang yang sedang dalam proses
          </p>
        </div>
        <Link
          href="/distribusi/pengiriman"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Surat Jalan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[260px] pr-1">
        {data.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant/60 text-xs">
            Tidak ada pengiriman distribusi yang sedang dalam perjalanan.
          </div>
        ) : (
          data.map((ship) => (
            <div
              key={ship.id_pengiriman}
              className="p-3.5 rounded-xl border border-outline-variant/25 bg-surface-container-low/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-on-surface">
                    {ship.kode_pengiriman}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-300">
                    {ship.status || "Proses"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-on-surface-variant mt-1 text-[11px]">
                  <span>{ship.nama_cabang_sumber || "DC"}</span>
                  <ArrowRight className="w-3 h-3 text-primary" />
                  <span className="font-semibold text-on-surface">{ship.nama_cabang_tujuan}</span>
                </div>
              </div>

              <div className="sm:text-right shrink-0 text-on-surface-variant/80 text-[11px]">
                <p>
                  Armada: <b className="text-on-surface">{ship.armada || "-"}</b>
                </p>
                <p className="text-[10px] text-on-surface-variant/60">
                  Driver: {ship.driver || "Internal"} &bull; {formatDate(ship.tanggal_kirim)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

