"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X, Building2 } from "lucide-react";

export interface SupplierItem {
  id_supplier: number | string;
  nama_supplier: string;
}

interface SupplierSearchSelectProps {
  suppliers: SupplierItem[];
  value: string | number | null | undefined;
  onChange: (value: string, supplier?: SupplierItem) => void;
  placeholder?: string;
  allowAll?: boolean;
  allLabel?: string;
  allValue?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  buttonClassName?: string;
  showIcon?: boolean;
  id?: string;
}

export default function SupplierSearchSelect({
  suppliers = [],
  value,
  onChange,
  placeholder = "-- Pilih Supplier --",
  allowAll = false,
  allLabel = "-- Semua Supplier --",
  allValue = "all",
  disabled = false,
  required = false,
  className = "",
  buttonClassName = "",
  showIcon = true,
  id,
}: SupplierSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const stringValue = value !== null && value !== undefined ? String(value) : "";

  // Selected display text
  const selectedSupplier = useMemo(() => {
    if (!stringValue || (allowAll && stringValue === allValue)) return null;
    return suppliers.find((s) => String(s.id_supplier) === stringValue);
  }, [suppliers, stringValue, allowAll, allValue]);

  const displayLabel = useMemo(() => {
    if (allowAll && (stringValue === allValue || stringValue === "")) {
      return allLabel;
    }
    if (selectedSupplier) {
      return selectedSupplier.nama_supplier;
    }
    return placeholder;
  }, [selectedSupplier, stringValue, allowAll, allValue, allLabel, placeholder]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) =>
      s.nama_supplier.toLowerCase().includes(q)
    );
  }, [suppliers, search]);

  // Total items including "All" option if allowed
  const showAllOption = allowAll && (!search.trim() || allLabel.toLowerCase().includes(search.trim().toLowerCase()));

  // Open & Focus
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setHighlightedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSelect = (val: string, supplier?: SupplierItem) => {
    onChange(val, supplier);
    setIsOpen(false);
    setSearch("");
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        if (!disabled) setIsOpen(true);
      }
      return;
    }

    const totalCount = filteredSuppliers.length + (showAllOption ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < totalCount ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalCount - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showAllOption && highlightedIndex === 0) {
        handleSelect(allValue);
      } else {
        const itemIndex = showAllOption ? highlightedIndex - 1 : highlightedIndex;
        if (filteredSuppliers[itemIndex]) {
          const item = filteredSuppliers[itemIndex];
          handleSelect(String(item.id_supplier), item);
        }
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Scroll highlighted into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-supplier-option]");
      const target = items[highlightedIndex] as HTMLElement;
      if (target) {
        target.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const isPlaceholderSelected = !selectedSupplier && !(allowAll && (stringValue === allValue || stringValue === ""));

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} onKeyDown={handleKeyDown}>
      {/* Hidden input for HTML form validation */}
      {required && (
        <input
          type="text"
          value={stringValue}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full bg-surface-container-low border border-outline-variant text-on-surface rounded-xl px-3 py-2 text-xs text-left focus:outline-none focus:ring-2 focus:ring-primary/40 flex items-center justify-between gap-2 transition-all ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-surface-container-high/30"
            : "cursor-pointer hover:bg-surface-container-high/40 hover:border-outline-variant/80 active:scale-[0.99]"
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {showIcon && (
            <Building2 className="w-3.5 h-3.5 text-on-surface-variant/70 shrink-0" />
          )}
          <span
            className={`truncate ${
              isPlaceholderSelected
                ? "text-on-surface-variant/60"
                : "text-on-surface font-medium"
            }`}
          >
            {displayLabel}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-on-surface-variant/60 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-surface border border-outline-variant/60 rounded-xl shadow-2xl p-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150 backdrop-blur-md">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/60" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
              placeholder="Ketik untuk mencari supplier..."
              className="w-full bg-surface-container-low border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 rounded-lg pl-8 pr-7 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  inputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-on-surface-variant/60 hover:text-on-surface rounded-md"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Supplier List */}
          <div
            ref={listRef}
            className="max-h-52 overflow-y-auto space-y-0.5 scrollbar-thin pr-0.5"
            role="listbox"
          >
            {/* All Option */}
            {showAllOption && (
              <button
                type="button"
                data-supplier-option
                onClick={() => handleSelect(allValue)}
                onMouseEnter={() => setHighlightedIndex(0)}
                className={`w-full px-3 py-2 text-left rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                  stringValue === allValue || stringValue === ""
                    ? "bg-primary/10 text-primary font-bold"
                    : highlightedIndex === 0
                    ? "bg-surface-container-high/60 text-on-surface"
                    : "text-on-surface hover:bg-surface-container-high/40"
                }`}
                role="option"
                aria-selected={stringValue === allValue || stringValue === ""}
              >
                <span className="truncate">{allLabel}</span>
                {(stringValue === allValue || stringValue === "") && (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
              </button>
            )}

            {filteredSuppliers.length === 0 && !showAllOption ? (
              <div className="py-4 px-3 text-center text-on-surface-variant/60 text-xs italic">
                Supplier tidak ditemukan
              </div>
            ) : (
              filteredSuppliers.map((s, idx) => {
                const currentIdx = showAllOption ? idx + 1 : idx;
                const isSelected = String(s.id_supplier) === stringValue;
                const isHighlighted = highlightedIndex === currentIdx;

                return (
                  <button
                    key={s.id_supplier}
                    type="button"
                    data-supplier-option
                    onClick={() => handleSelect(String(s.id_supplier), s)}
                    onMouseEnter={() => setHighlightedIndex(currentIdx)}
                    className={`w-full px-3 py-2 text-left rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 text-primary font-bold"
                        : isHighlighted
                        ? "bg-surface-container-high/60 text-on-surface"
                        : "text-on-surface hover:bg-surface-container-high/40"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="truncate">{s.nama_supplier}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

