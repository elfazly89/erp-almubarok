"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";

export interface TablePaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  isLoading?: boolean;
  pageSizeOptions?: number[];
}

export default function TablePagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  isLoading = false,
  pageSizeOptions = [25, 50, 100, 250],
}: TablePaginationProps) {
  const startRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, total);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const delta = 1; // Number of pages to show before and after current
    const range: (number | string)[] = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      range.unshift("...");
    }
    if (page + delta < totalPages - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const pages = totalPages > 0 ? getPageNumbers() : [1];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-surface-container-low/70 border-t border-outline-variant/30 text-xs">
      {/* Kiri: Selector Rows Per Page & Loading Indicator */}
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span>Tampilkan</span>
        <select
          value={limit}
          onChange={(e) => {
            onLimitChange(Number(e.target.value));
            onPageChange(1);
          }}
          disabled={isLoading}
          aria-label="Jumlah baris per halaman"
          className="bg-surface border border-outline-variant/50 rounded-lg px-2 py-1 text-xs text-on-surface focus:outline-none focus:border-primary disabled:opacity-50 cursor-pointer"
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt} data
            </option>
          ))}
        </select>
        <span>per halaman</span>

        {isLoading && (
          <span className="inline-flex items-center gap-1.5 text-primary text-[11px] font-medium ml-2 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Memuat data...</span>
          </span>
        )}
      </div>

      {/* Tengah: Ringkasan Baris Data */}
      <div className="text-on-surface-variant/80 font-medium">
        Menampilkan{" "}
        <span className="font-semibold text-on-surface">
          {startRow.toLocaleString("id-ID")}
        </span>{" "}
        -{" "}
        <span className="font-semibold text-on-surface">
          {endRow.toLocaleString("id-ID")}
        </span>{" "}
        dari{" "}
        <span className="font-semibold text-on-surface">
          {total.toLocaleString("id-ID")}
        </span>{" "}
        data
      </div>

      {/* Kanan: Navigasi Tombol Halaman */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1 || isLoading}
          className="p-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-high text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Halaman Pertama"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Prev Page */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="p-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-high text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Number Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-on-surface-variant/60 text-xs"
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === page;

            return (
              <button
                key={`page-${pageNum}`}
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                className={`min-w-7 h-7 px-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "border border-outline-variant/40 hover:bg-surface-container-high text-on-surface disabled:opacity-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className="p-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-high text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Halaman Selanjutnya"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages || isLoading}
          className="p-1.5 rounded-lg border border-outline-variant/40 hover:bg-surface-container-high text-on-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Halaman Terakhir"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

