"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Key, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  userName: string;
  jabatan?: string;
  foto?: string | null;
}

export default function UserMenu({ userName, jabatan, foto }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // Generate initials if no avatar photo is provided
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-surface-container-high/60 transition-all duration-200 cursor-pointer"
        aria-label="User menu"
      >
        {/* User photo / avatar */}
        {foto ? (
          <img
            src={foto}
            alt={userName}
            className="w-8 h-8 rounded-full object-cover border border-primary/20 shadow-sm"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
        )}
        
        {/* User name & chevron */}
        <span className="font-semibold text-on-surface text-sm hidden sm:inline-block">
          {userName}
        </span>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-on-surface-variant transition-transform duration-200", 
            isOpen ? "rotate-180" : ""
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-outline-variant bg-surface p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User metadata header */}
          <div className="px-3 py-2.5 border-b border-outline-variant/30 mb-1">
            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Akun Anda</p>
            <p className="font-bold text-on-surface text-sm truncate" title={userName}>{userName}</p>
            {jabatan && <p className="text-on-surface-variant text-[11px] truncate">{jabatan}</p>}
          </div>

          {/* Menu Items */}
          <button
            onClick={() => {
              setIsOpen(false);
              router.push("/profil");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <User className="w-4 h-4 text-primary" />
            <span>Profil</span>
          </button>
          
          <button
            onClick={() => {
              setIsOpen(false);
              router.push("/ubah-password");
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <Key className="w-4 h-4 text-primary" />
            <span>Ubah Password</span>
          </button>

          <div className="border-t border-outline-variant/30 my-1" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-error hover:bg-error/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      )}
    </div>
  );
}
